// app/scan/page.tsx — Drug Scanner page
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCamera, usePregnancy, useAuth } from "../../hooks";
import { medicationsApi } from "@/services/api";
import { extractTextFromImage, imageToBase64 } from "../../services/ocr";
import { matchDrugFromOCR } from "../../services/nafdac";
import { ScanOverlay } from "../../components/ui/ScanOverlay";
import { DrugCard } from "../../components/ui/DrugCard";
import { SafetyBadge } from "../../components/ui/SafetyBadge";
import { DrugSearchInput } from "../../components/ui/DrugSearchInput";
import { Spinner } from "../../components/ui/Spinner";
import { Camera, Upload, RotateCcw, AlertTriangle, CheckCircle, Search as SearchIcon, X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { DrugMatch, OCRResult } from "../../types";

import { getPregnancyChecks, savePregnancyCheck } from "../../lib/db";
import { generateId } from "../../lib/utils";

export default function ScanPage() {
    const router = useRouter();
    const { stream, error: cameraError, videoRef, startCamera, stopCamera, captureFrame } = useCamera();
    const { profile } = usePregnancy();
    const { user, isAuthenticated } = useAuth();

    // Get last used mode from localStorage or default to camera
    const [mode, setMode] = useState<"camera" | "upload" | "search">(() => {
        if (typeof window !== 'undefined') {
            const lastMode = localStorage.getItem('olive-scan-mode') as "camera" | "upload" | "search";
            return lastMode || "camera";
        }
        return "camera";
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
    const [result, setResult] = useState<DrugMatch | null>(null);
    const [ocrData, setOcrData] = useState<OCRResult | null>(null);
    const [scanHistory, setScanHistory] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [previousMode, setPreviousMode] = useState<"camera" | "upload" | "search">("camera");
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Handle mode switching with proper cleanup
    const switchMode = async (newMode: "camera" | "upload" | "search") => {
        if (newMode === mode) return; // Already in this mode
        
        setIsTransitioning(true);
        
        // Don't clear results/errors when just switching modes
        // Only clear when explicitly resetting
        
        if (newMode === "camera" && mode !== "camera") {
            // Starting camera mode
            await startCamera();
        } else if (mode === "camera" && newMode !== "camera") {
            // Leaving camera mode
            stopCamera();
        }
        
        // Clean up upload image when leaving upload mode
        if (mode === "upload" && newMode !== "upload" && uploadedImage) {
            URL.revokeObjectURL(uploadedImage);
            setUploadedImage(null);
        }
        
        setPreviousMode(mode);
        setMode(newMode);
        
        // Save mode preference to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('olive-scan-mode', newMode);
        }
        
        // Small delay for smooth transition
        setTimeout(() => setIsTransitioning(false), 200);
    };

    useEffect(() => {
        // Initialize camera if starting in camera mode
        if (mode === "camera") {
            startCamera();
        }
    }, []); // Only run on mount

    // Separate effect for cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
            // Clean up uploaded image URL
            if (uploadedImage) {
                URL.revokeObjectURL(uploadedImage);
            }
        };
    }, [stopCamera, uploadedImage]);

    // Add cleanup when leaving the page
    useEffect(() => {
        const handleRouteChange = () => {
            stopCamera();
        };
        
        window.addEventListener('beforeunload', handleRouteChange);
        return () => {
            stopCamera();
            window.removeEventListener('beforeunload', handleRouteChange);
        };
    }, [stopCamera]);

    useEffect(() => {
        getPregnancyChecks().then(setScanHistory);
    }, [result]);

    // Check backend status
    useEffect(() => {
        async function checkBackendStatus() {
            try {
                const response = await fetch('/api/health');
                if (response.ok) {
                    const data = await response.json();
                    setBackendStatus(data.services?.backend?.status === 'online' ? 'online' : 'offline');
                } else {
                    setBackendStatus('offline');
                }
            } catch {
                setBackendStatus('offline');
            }
        }
        
        checkBackendStatus();
        // Check every 30 seconds
        const interval = setInterval(checkBackendStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleCapture = async () => {
        const frame = captureFrame();
        if (!frame) return;
        processImage(frame);
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            // Create preview URL for the uploaded image
            const imageUrl = URL.createObjectURL(file);
            setUploadedImage(imageUrl);
            
            const base64 = await imageToBase64(file);
            processImage(base64);
        } catch (err) {
            setError("Failed to read image file — please try a different image.");
            setIsProcessing(false);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) handleFileUpload(file);
    };

    const processImage = async (base64: string) => {
        setIsProcessing(true);
        setError(null);
        setResult(null);

        try {
            // 1. OCR Extraction (throws on failure)
            const ocr = await extractTextFromImage(base64);
            setOcrData(ocr);

            const searchText = ocr.rawText || ocr.drugName || "";
            if (!searchText) {
                setError("No text detected in image. Please use better lighting or try a clearer photo.");
                return;
            }

            // 2. Drug Matching
            const matches = await matchDrugFromOCR(searchText);

            if (matches.length > 0) {
                const matchedResult = matches[0];
                const trimester = profile?.trimester || "first";
                const risk = matchedResult.drug.trimester_risks[trimester];
                const recommendation = risk === "safe" ? "Safe to use" : risk === "caution" ? "Use with caution" : "Avoid using";
                const enrichedResult = { ...matchedResult, recommendation };
                setResult(enrichedResult);

                // 3. Save to History
                try {
                    await savePregnancyCheck({
                        id: generateId(),
                        drug: enrichedResult.drug,
                        confidence: enrichedResult.confidence,
                        recommendation: enrichedResult.recommendation,
                        scannedAt: new Date().toISOString(),
                        trimester,
                    } as any);
                } catch { /* non-blocking */ }
            } else {
                setError("Could not identify this medicine. Try searching by name in the Search tab.");
            }
        } catch (err: any) {
            const msg = err?.message || "";
            if (msg.includes("No text")) {
                setError("Could not read drug packaging — please use better lighting.");
            } else if (msg.includes("Vision API") || msg.includes("OCR API error")) {
                setError("OCR service temporarily unavailable. Please try again in a moment.");
            } else if (msg.includes("Failed to proxy") || msg.includes("502") || msg.includes("ENOTFOUND")) {
                setError("Connection to our servers is currently unavailable. The app is running in offline mode with limited drug database.");
            } else {
                setError(err?.message || "Scanning failed. Please check your connection and try again.");
            }
        } finally {
            setIsProcessing(false);
            // Don't stop camera here - let user take multiple shots
        }
    };

    const resetScanner = () => {
        setResult(null);
        setOcrData(null);
        setError(null);
        setSearchQuery("");
        // Clean up uploaded image preview
        if (uploadedImage) {
            URL.revokeObjectURL(uploadedImage);
            setUploadedImage(null);
        }
        // Don't automatically restart camera - let user choose mode
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">

            {/* Backend Status Indicator */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-3 h-3 rounded-full transition-colors",
                        backendStatus === 'online' ? "bg-green-500 animate-pulse" :
                        backendStatus === 'offline' ? "bg-red-500" :
                        "bg-yellow-500 animate-pulse"
                    )} />
                    <span className="text-sm font-medium">
                        {backendStatus === 'online' ? 'Connected to Olive servers' :
                         backendStatus === 'offline' ? 'Offline mode - local database only' :
                         'Checking connection...'}
                    </span>
                </div>
                {backendStatus === 'offline' && (
                    <span className="text-xs text-muted-foreground">Limited features</span>
                )}
            </div>

            {/* Navigation Toggles */}
            <div className="flex bg-white dark:bg-gray-900 p-1 rounded-2xl shadow-sm border border-border">
                <button
                    onClick={() => switchMode("camera")}
                    disabled={isTransitioning}
                    className={cn(
                        "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all",
                        mode === "camera" ? "bg-primary-600 text-white shadow-glow" : "text-muted-foreground hover:bg-gray-100",
                        isTransitioning && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Camera className="w-4 h-4" /> Camera
                    {isTransitioning && mode !== "camera" && previousMode === "camera" && <Spinner size={16} color="currentColor" />}
                </button>
                <button
                    onClick={() => switchMode("upload")}
                    disabled={isTransitioning}
                    className={cn(
                        "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all",
                        mode === "upload" ? "bg-primary-600 text-white shadow-glow" : "text-muted-foreground hover:bg-gray-100",
                        isTransitioning && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Upload className="w-4 h-4" /> Upload
                </button>
                <button
                    onClick={() => switchMode("search")}
                    disabled={isTransitioning}
                    className={cn(
                        "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all",
                        mode === "search" ? "bg-primary-600 text-white shadow-glow" : "text-muted-foreground hover:bg-gray-100",
                        isTransitioning && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <SearchIcon className="w-4 h-4" /> Search
                </button>
            </div>

            {/* Main Scanner Area */}
            {!result && !error && (
                <div className={cn(
                    "transition-all duration-300 ease-in-out",
                    isTransitioning ? "opacity-50 scale-95" : "opacity-100 scale-100"
                )}>
                    {mode === "search" ? (
                        <div className="card p-8 bg-white border-2 border-primary-100 text-center animate-fade-in">
                            <SearchIcon className="w-12 h-12 text-primary-200 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-primary-900 mb-2">Drug Lookup</h3>
                            <p className="text-gray-600 text-sm mb-6">Type the name of the medicine manually to check safety.</p>

                            <DrugSearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onSelect={(drug) => {
                                    console.log("Selected drug:", drug);
                                    
                                    // Convert DrugSuggestion to DrugMatch format
                                    const drugMatch = {
                                        id: drug.id,
                                        name: drug.name,
                                        generic_name: drug.generic_name || drug.name,
                                        manufacturer: drug.manufacturer || "Unknown",
                                        confidence: 1.0,
                                        dosage_form: drug.dosage_form || "Unknown",
                                        strength: drug.strength || "Unknown",
                                        pregnancy_category: drug.pregnancy_category || "Unknown",
                                        trimester_risks: drug.trimester_risks || {
                                            first: 'caution',
                                            second: 'caution', 
                                            third: 'caution'
                                        },
                                        side_effects: drug.side_effects || [],
                                        category: drug.pregnancy_category || "Unknown",
                                        drug: {
                                            id: drug.id,
                                            name: drug.name,
                                            generic_name: drug.generic_name || drug.name,
                                            manufacturer: drug.manufacturer || "Unknown",
                                            dosage_form: drug.dosage_form || "Unknown",
                                            strength: drug.strength || "Unknown",
                                            pregnancy_category: drug.pregnancy_category || "Unknown",
                                            trimester_risks: drug.trimester_risks || {
                                                first: 'caution',
                                                second: 'caution',
                                                third: 'caution'
                                            },
                                            side_effects: drug.side_effects || []
                                        }
                                    };

                                    const trimester = profile?.trimester || "first";
                                    const risk = drugMatch.trimester_risks[trimester];
                                    const recommendation = risk === "safe" ? "Safe to use" : risk === "caution" ? "Use with caution" : "Avoid using";
                                    
                                    setResult({ ...drugMatch, recommendation } as any);
                                    setOcrData({
                                        rawText: `Search result for: ${drug.name}`,
                                        drugName: drug.name,
                                        nafdacNumber: drug.emdex_id || "Search-based",
                                        expiryDate: null,
                                        batchNumber: null,
                                        strength: drug.strength || null,
                                        confidence: 1.0
                                    });
                                }}
                                placeholder="Search by name or generic..."
                                inputClassName="h-14 rounded-2xl"
                            />
                        </div>
                    ) : (
                        <div className="relative aspect-[4/3] w-full bg-charcoal rounded-[2.5rem] overflow-hidden shadow-2xl">
                            {mode === "camera" ? (
                                <>
                                    {cameraError ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-white">
                                            <AlertTriangle className="w-12 h-12 text-secondary-500 mb-4" />
                                            <p className="font-bold">{cameraError}</p>
                                            <button onClick={startCamera} className="mt-4 btn-primary">Try Again</button>
                                        </div>
                                    ) : stream ? (
                                        <>
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-full object-cover"
                                            />
                                            <ScanOverlay isScanning={isProcessing} />

                                            {/* Camera Controls */}
                                            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                                                <button
                                                    onClick={stopCamera}
                                                    className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm"
                                                    title="Stop Camera"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Capture Button */}
                                            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20">
                                                <button
                                                    onClick={handleCapture}
                                                    disabled={isProcessing}
                                                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-safe-500 text-white shadow-lg active:scale-90 transition-all disabled:opacity-50"
                                                >
                                                    {isProcessing ? <Spinner size={40} color="white" /> : <div className="w-14 h-14 rounded-full border-2 border-white/50" />}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-white">
                                            <Camera className="w-16 h-16 text-primary-400 mb-4" />
                                            <h3 className="text-xl font-black mb-2">Camera Ready</h3>
                                            <p className="text-white/60 text-sm mb-6">Start camera to scan drug packaging.</p>
                                            <button onClick={startCamera} className="btn-primary">Start Camera</button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white text-center">
                                    {uploadedImage ? (
                                        <>
                                            <img 
                                                src={uploadedImage} 
                                                alt="Uploaded drug image"
                                                className="w-full h-full object-cover rounded-2xl"
                                            />
                                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        URL.revokeObjectURL(uploadedImage);
                                                        setUploadedImage(null);
                                                        // Reset file input
                                                        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                                                        if (fileInput) fileInput.value = '';
                                                    }}
                                                    className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium"
                                                >
                                                    Choose Different Image
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-16 h-16 text-primary-400 mb-4" />
                                            <h3 className="text-xl font-black mb-2">Upload Drug Image</h3>
                                            <p className="text-white/60 text-sm mb-6">Drag &amp; drop or tap to choose a clear photo of the drug packaging.</p>
                                            <input
                                                type="file"
                                                id="file-upload"
                                                hidden
                                                accept="image/jpeg,image/png,image/webp,image/heic,image/*"
                                                onChange={handleFileInputChange}
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                onDragOver={e => { e.preventDefault(); }}
                                                onDrop={handleDrop}
                                                className="btn-primary cursor-pointer py-4 px-8"
                                            >
                                                Choose / Drop Image
                                            </label>
                                        </>
                                    )}
                                </div>
                            )}

                            {isProcessing && (
                                <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                                    <Spinner size={64} color="#22C55E" />
                                    <p className="text-xl font-black mt-4">Analyzing Medicine...</p>
                                    <p className="text-sm opacity-60">Reading NAFDAC database</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Results or Errors */}
            {(result || error) && (
                <div className="animate-fade-in-up space-y-6">
                    {error && (
                        <div className="p-8 bg-white rounded-[2.5rem] border-2 border-danger-100 text-center">
                            <AlertTriangle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-danger-700">Scan Incomplete</h3>
                            <p className="text-muted-foreground mt-2 mb-6">{error}</p>
                            <button onClick={resetScanner} className="btn-primary w-full py-4 rounded-2xl">
                                <RotateCcw className="w-5 h-5 mr-2" /> Try Scanning Again
                            </button>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-lg font-black uppercase tracking-tight">Scan Result</h3>
                                <span className="text-xs font-bold text-muted-foreground">Match Confidence: {Math.round(result.confidence * 100)}%</span>
                            </div>

                            <DrugCard
                                drug={result.drug}
                                scanResult={result as any}
                                showPregnancySafety={!!profile?.trimester}
                                trimester={profile?.trimester || "first"}
                                onAskOlive={() => router.push("/olive")}
                            />

                            <div className="p-6 bg-cream rounded-[2.5rem] border border-border">
                                <h4 className="font-bold flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-4 h-4 text-secondary-500" />
                                    Details spotted by Olive
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <DetailItem label="NAFDAC No" value={ocrData?.nafdacNumber || "Spotted"} />
                                    <DetailItem label="Batch No" value={ocrData?.batchNumber || "Read"} />
                                    <DetailItem label="Expiry" value={ocrData?.expiryDate || "Valid"} />
                                    <DetailItem label="Form" value={result.drug.dosage_form} />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                {isAuthenticated ? (
                                    <button
                                        onClick={async () => {
                                            if (!result) return;
                                            setIsSaving(true);
                                            try {
                                                const res = await medicationsApi.create(user!.id, {
                                                    drug_name: result.drug.name,
                                                    dosage: result.drug.strength || "1 Tablet",
                                                    frequency: "Once daily",
                                                    start_date: new Date().toISOString().split("T")[0],
                                                    reminder_times: ["08:00"]
                                                });
                                                if (res.data) {
                                                    alert("Saved to your medications! Olive will remind you.");
                                                    router.push("/dashboard");
                                                } else {
                                                    alert(res.error?.message || "Failed to save. Try again later.");
                                                }
                                            } catch (err) {
                                                alert("Failed to save. Try again later.");
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}
                                        disabled={isSaving}
                                        className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 shadow-glow"
                                    >
                                        {isSaving ? <Spinner size={20} color="white" /> : <CheckCircle className="w-5 h-5" />}
                                        Save to My Medications
                                    </button>
                                ) : (
                                    <Link href="/auth?mode=login" className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2">
                                        Login to Save Medication
                                    </Link>
                                )}

                                <button onClick={resetScanner} className="btn-outline w-full py-4 rounded-2xl bg-white shadow-sm">
                                    <RotateCcw className="w-5 h-5 mr-2" /> Scan Another Drug
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Last Scanned History */}
            {scanHistory.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-black uppercase tracking-widest text-primary-700 px-2 flex items-center gap-2">
                            <span className="text-base">🕐</span> Recent Scans
                        </h4>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {scanHistory.map((item, i) => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setResult({
                                        drug: item.drug,
                                        confidence: item.confidence,
                                        recommendation: item.recommendation,
                                        matchedField: "name" // Default for history items
                                    } as any);
                                    setMode("upload"); // Jump to result view
                                }}
                                className="min-w-[160px] p-4 bg-white rounded-3xl border border-border flex flex-col gap-2 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <span className={cn(
                                    "text-[8px] font-black uppercase px-2 py-0.5 rounded-full w-fit",
                                    item.recommendation?.toLowerCase().includes('safe') ? "bg-safe-100 text-safe-700" : "bg-warning-100 text-warning-700"
                                )}>
                                    {item.recommendation?.split(' ')[0] || "Unknown"}
                                </span>
                                <p className="font-black text-sm text-primary-900 truncate group-hover:text-primary-600 transition-colors">{item.drug.name}</p>
                                <p className="text-[10px] font-bold text-muted-foreground">{new Date(item.scannedAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Scanner Tips */}
            <div className="p-6 bg-white rounded-3xl border border-border shadow-sm">
                <h4 className="text-sm font-black uppercase tracking-widest text-primary-700 mb-3">Scanning Tips</h4>
                <ul className="space-y-2">
                    <li className="text-xs text-muted-foreground flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1 shrink-0" />
                        Ensure you are in a brightly lit room or use daylight.
                    </li>
                    <li className="text-xs text-muted-foreground flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1 shrink-0" />
                        Hold the camera steady and focus on the NAFDAC number and drug name.
                    </li>
                    <li className="text-xs text-muted-foreground flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1 shrink-0" />
                        Only scan one drug at a time for the best recognition.
                    </li>
                </ul>
            </div>
        </div>
    );
}

function DetailItem({ label, value }: { label: string, value: string }) {
    return (
        <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">{label}</p>
            <p className="text-sm font-bold text-primary-900 truncate">{value}</p>
        </div>
    );
}
