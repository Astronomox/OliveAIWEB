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

    const [mode, setMode] = useState<"camera" | "upload" | "search">("camera");
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<DrugMatch | null>(null);
    const [ocrData, setOcrData] = useState<OCRResult | null>(null);
    const [scanHistory, setScanHistory] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (mode === "camera") {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [mode, startCamera, stopCamera]);

    useEffect(() => {
        getPregnancyChecks().then(setScanHistory);
    }, [result]);

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
            } else if (msg.includes("Vision API")) {
                setError("OCR service unavailable. Try again in a moment.");
            } else {
                setError(err?.message || "Scanning failed. Please check your connection and try again.");
            }
        } finally {
            setIsProcessing(false);
            if (mode === "camera") stopCamera();
        }
    };

    const resetScanner = () => {
        setResult(null);
        setOcrData(null);
        setError(null);
        setSearchQuery("");
        if (mode === "camera") startCamera();
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">

            {/* Navigation Toggles */}
            <div className="flex bg-white dark:bg-gray-900 p-1 rounded-2xl shadow-sm border border-border">
                <button
                    onClick={() => setMode("camera")}
                    className={cn(
                        "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all",
                        mode === "camera" ? "bg-primary-600 text-white shadow-glow" : "text-muted-foreground hover:bg-gray-100"
                    )}
                >
                    <Camera className="w-4 h-4" /> Camera
                </button>
                <button
                    onClick={() => setMode("upload")}
                    className={cn(
                        "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all",
                        mode === "upload" ? "bg-primary-600 text-white shadow-glow" : "text-muted-foreground hover:bg-gray-100"
                    )}
                >
                    <Upload className="w-4 h-4" /> Upload
                </button>
                <button
                    onClick={() => setMode("search")}
                    className={cn(
                        "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all",
                        mode === "search" ? "bg-primary-600 text-white shadow-glow" : "text-muted-foreground hover:bg-gray-100"
                    )}
                >
                    <SearchIcon className="w-4 h-4" /> Search
                </button>
            </div>

            {/* Main Scanner Area */}
            {!result && !error && (
                <>
                    {mode === "search" ? (
                        <div className="card p-8 bg-white border-2 border-primary-100 text-center animate-fade-in">
                            <SearchIcon className="w-12 h-12 text-primary-200 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-primary-900 mb-2">Drug Lookup</h3>
                            <p className="text-white/60 text-sm mb-6">Type the name of the medicine manually to check safety.</p>

                            <DrugSearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onSelect={(drug) => {
                                    setResult({
                                        id: drug.id,
                                        name: drug.name,
                                        generic_name: drug.generic_name,
                                        manufacturer: drug.manufacturer,
                                        confidence: 1.0,
                                        trimester_risks: (drug as any).trimester_risks || {},
                                        side_effects: (drug as any).side_effects || [],
                                        category: (drug as any).pregnancy_category || "Unknown"
                                    } as any);
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
                                    ) : (
                                        <>
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                            <ScanOverlay isScanning={!!stream} />

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
                                    )}
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white text-center">
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
                </>
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
                                onAskMama={() => router.push("/mama")}
                            />

                            <div className="p-6 bg-cream rounded-[2.5rem] border border-border">
                                <h4 className="font-bold flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-4 h-4 text-secondary-500" />
                                    Details spotted by Mama
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
                                                    alert("Saved to your medications! Mama will remind you.");
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
