// app/prescriptions/page.tsx — DOCUMENT-RICH Prescriptions page
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardList, Upload, Trash2, Plus, Camera,
    Image, FileText, CheckCircle, AlertTriangle, Eye, Pill,
    Calendar, ChevronRight, X, RefreshCw, Clock, Search,
    ChevronDown, Share2, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useToast } from "@/hooks";
import { prescriptionsApi, medicationsApi } from "@/services/api";
import { Spinner } from "@/components/ui/Spinner";
import { ToastContainer } from "@/components/ui/ToastContainer";
import type { PrescriptionResponse, DrugInput } from "@/types/api";

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

export default function PrescriptionsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { toasts, addToast, removeToast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);

    const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [showUpload, setShowUpload] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [addingMedFromDrug, setAddingMedFromDrug] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) { router.push("/login"); return; }
        if (user) fetchPrescriptions();
    }, [user, authLoading, isAuthenticated]);

    const fetchPrescriptions = async () => {
        if (!user) return;
        setIsLoading(true);
        const res = await prescriptionsApi.getAll(user.id);
        if (res.data) setPrescriptions(res.data);
        else addToast(res.error?.message || "Failed to load", "error");
        setIsLoading(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setShowUpload(true);
    };

    const handleUpload = async () => {
        if (!user || !selectedFile) return;
        setIsUploading(true);
        const res = await prescriptionsApi.upload(user.id, selectedFile, true);
        if (res.data) {
            addToast("Prescription uploaded! OCR processing complete ✅", "success");
            setShowUpload(false);
            setPreviewUrl(null);
            setSelectedFile(null);
            fetchPrescriptions();
        } else addToast(res.error?.message || "Upload failed", "error");
        setIsUploading(false);
    };

    const handleDelete = async (id: number) => {
        const res = await prescriptionsApi.delete(id);
        if (res.error) addToast(res.error.message, "error");
        else { addToast("Prescription deleted", "info"); setPrescriptions(prev => prev.filter(p => p.id !== id)); }
    };

    const handleAddDrugToMeds = async (rxId: number, drug: DrugInput) => {
        if (!user) return;
        setAddingMedFromDrug(drug.drug_name);
        const res = await medicationsApi.create(user.id, {
            prescription_id: rxId,
            drug_name: drug.drug_name,
            dosage: drug.dosage || "",
            frequency: drug.frequency || "As directed",
            start_date: new Date().toISOString().split("T")[0],
            reminder_times: ["08:00"],
        });
        if (res.data) addToast(`${drug.drug_name} added to medications! 💊`, "success");
        else addToast(res.error?.message || "Failed to add", "error");
        setAddingMedFromDrug(null);
    };

    // Filters
    const filtered = prescriptions.filter(p => {
        if (statusFilter && p.status !== statusFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!p.ocr_text?.toLowerCase().includes(q) && !p.drugs?.some(d => d.drug_name.toLowerCase().includes(q))) return false;
        }
        return true;
    });

    // Stats
    const total = prescriptions.length;
    const active = prescriptions.filter(p => p.status === "active" || p.status === "processed").length;
    const totalDrugs = prescriptions.reduce((sum, p) => sum + (p.drugs?.length ?? 0), 0);
    const thisMonth = prescriptions.filter(p => {
        const d = new Date(p.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={40} /></div>;

    return (
        <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            {/* ═══════════ HEADER ═══════════ */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-primary-950 tracking-tight flex items-center gap-3">
                        <ClipboardList className="w-8 h-8 text-primary-500" /> Prescriptions
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Upload, scan &amp; manage your prescriptions — Mama reads them for you</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchPrescriptions} className="btn-ghost rounded-xl flex items-center gap-1 text-xs"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
                    <button onClick={() => fileRef.current?.click()} className="btn-primary rounded-2xl flex items-center gap-2 shadow-glow">
                        <Camera className="w-4 h-4" /> Upload Prescription
                    </button>
                </div>
            </div>

            {/* ═══════════ STATS ROW ═══════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={ClipboardList} label="Total" value={total} color="text-primary-600 bg-primary-100" />
                <StatCard icon={Activity} label="Active" value={active} color="text-safe-600 bg-safe-100" />
                <StatCard icon={Pill} label="Drugs Prescribed" value={totalDrugs} color="text-secondary-600 bg-secondary-100" />
                <StatCard icon={Calendar} label="This Month" value={thisMonth} color="text-purple-600 bg-purple-100" />
            </div>

            {/* ═══════════ UPLOAD PREVIEW ═══════════ */}
            <AnimatePresence>
                {showUpload && (
                    <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="card p-6 bg-white border-2 border-primary-200 rounded-[2rem]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-primary-900 uppercase tracking-tight flex items-center gap-2">
                                <Upload className="w-5 h-5" /> Upload Prescription
                            </h3>
                            <button onClick={() => { setShowUpload(false); setPreviewUrl(null); setSelectedFile(null); }} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-muted-foreground" /></button>
                        </div>
                        {previewUrl && (
                            <div className="mb-4 rounded-2xl overflow-hidden border border-gray-200 max-h-64 flex items-center justify-center bg-gray-50">
                                <img src={previewUrl} alt="Prescription preview" className="max-h-64 object-contain" />
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mb-4">Mama will analyze your prescription using OCR and extract all drugs, dosages, and frequencies automatically.</p>
                        <div className="flex gap-3">
                            <button onClick={handleUpload} disabled={isUploading} className="btn-primary rounded-2xl flex items-center gap-2 flex-1">
                                {isUploading ? <><Spinner size={20} color="white" /> Processing OCR…</> : <><Upload className="w-4 h-4" /> Upload &amp; Analyze</>}
                            </button>
                            <button onClick={() => fileRef.current?.click()} className="btn-ghost rounded-2xl flex items-center gap-2">
                                <Camera className="w-4 h-4" /> Choose Another
                            </button>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* ═══════════ FILTERS ═══════════ */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: "", label: "All" },
                        { key: "active", label: "Active" },
                        { key: "processed", label: "Processed" },
                    ].map(f => (
                        <button key={f.key} onClick={() => setStatusFilter(f.key)} className={cn(
                            "px-4 py-2 rounded-2xl text-xs font-black uppercase transition-all",
                            statusFilter === f.key ? "bg-primary-600 text-white shadow-glow" : "bg-white text-primary-600 border border-primary-200 hover:bg-primary-50"
                        )}>{f.label}</button>
                    ))}
                </div>
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" placeholder="Search prescriptions..." className="input pl-9 w-full text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
            </div>

            {/* ═══════════ PRESCRIPTION CARDS ═══════════ */}
            {isLoading ? (
                <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-white rounded-2xl h-36 border border-gray-100" />)}</div>
            ) : filtered.length > 0 ? (
                <div className="space-y-4">
                    {filtered.map(rx => {
                        const isExpanded = expandedId === rx.id;
                        return (
                            <motion.div key={rx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="card bg-white border border-border hover:border-primary-300 hover:shadow-glow transition-all overflow-hidden">
                                <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : rx.id)}>
                                    <div className="flex items-start gap-4">
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
                                            rx.status === "active" || rx.status === "processed" ? "bg-safe-100 text-safe-600" : "bg-gray-100 text-gray-400")}>
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-primary-900 text-lg">Prescription #{rx.id}</h4>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase border",
                                                    (rx.status === "active" || rx.status === "processed") ? "bg-safe-50 text-safe-700 border-safe-100" : "bg-gray-50 text-gray-600 border-gray-200"
                                                )}>{rx.status}</span>
                                                {rx.verified_by_user && <span className="text-[10px] font-bold text-safe-600 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Verified</span>}
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {new Date(rx.created_at).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-muted-foreground">{timeAgo(rx.created_at)}</span>
                                            </div>
                                            {/* Drug preview badges */}
                                            {rx.drugs && rx.drugs.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {rx.drugs.slice(0, 3).map((d, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                                                            <Pill className="w-2.5 h-2.5" /> {d.drug_name}
                                                        </span>
                                                    ))}
                                                    {rx.drugs.length > 3 && <span className="px-2 py-0.5 bg-gray-50 text-muted-foreground text-[10px] font-bold rounded-full">+{rx.drugs.length - 3} more</span>}
                                                </div>
                                            )}
                                            {rx.ocr_confidence != null && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden max-w-32">
                                                        <div className={cn("h-full rounded-full", rx.ocr_confidence > 0.7 ? "bg-safe-400" : "bg-secondary-400")}
                                                            style={{ width: `${rx.ocr_confidence * 100}%` }} />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-muted-foreground">{Math.round(rx.ocr_confidence * 100)}% OCR confidence</span>
                                                </div>
                                            )}
                                        </div>
                                        <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")} />
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-gray-100">
                                            <div className="p-5 space-y-4">
                                                {/* OCR Text */}
                                                {rx.ocr_text && (
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">OCR Extracted Text</p>
                                                        <p className="text-xs text-primary-800 bg-cream p-3 rounded-xl font-mono whitespace-pre-wrap">{rx.ocr_text}</p>
                                                    </div>
                                                )}

                                                {/* Drug list */}
                                                {rx.drugs && rx.drugs.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Prescribed Drugs ({rx.drugs.length})</p>
                                                        <div className="space-y-2">
                                                            {rx.drugs.map((drug, i) => (
                                                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-cream/50 border border-border">
                                                                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                                                                        <Pill className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-primary-900 text-sm">{drug.drug_name}</p>
                                                                        <p className="text-[10px] text-muted-foreground">
                                                                            {drug.dosage || "—"} · {drug.frequency || "—"} · {drug.duration || "As directed"}
                                                                        </p>
                                                                    </div>
                                                                    <button onClick={() => handleAddDrugToMeds(rx.id, drug)} disabled={addingMedFromDrug === drug.drug_name}
                                                                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-safe-50 text-safe-600 hover:bg-safe-100 text-[10px] font-bold transition-all shrink-0">
                                                                        {addingMedFromDrug === drug.drug_name ? <Spinner size={12} color="#10B981" /> : <Plus className="w-3 h-3" />}
                                                                        Add to Meds
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Image preview */}
                                                {rx.image_url && (
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Uploaded Image</p>
                                                        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 max-h-48">
                                                            <img src={rx.image_url} alt="Prescription" className="w-full h-48 object-contain" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-2 pt-2 border-t border-gray-50">
                                                    <button onClick={() => handleDelete(rx.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-danger-50 text-muted-foreground hover:text-danger-600 text-xs font-bold transition-all ml-auto">
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
                    <ClipboardList className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="font-black text-primary-900 text-xl uppercase mb-2">No Prescriptions Yet</p>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">Upload a photo of your prescription and Mama will read it for you using AI-powered OCR.</p>
                    <div className="space-y-2 text-xs text-muted-foreground max-w-xs mx-auto text-left mb-6">
                        <p>📷 Take a photo or upload from gallery</p>
                        <p>🤖 AI extracts drugs, dosages &amp; frequencies</p>
                        <p>💊 One-click add drugs to your medications</p>
                    </div>
                    <button onClick={() => fileRef.current?.click()} className="btn-primary rounded-2xl shadow-glow">
                        <Camera className="w-4 h-4 mr-2" /> Upload Your First Prescription
                    </button>
                </div>
            )}

            {/* ═══════════ TIP ═══════════ */}
            <section className="card p-4 bg-secondary-50 border border-secondary-100 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-secondary-600 shrink-0" />
                <p className="text-xs font-medium text-secondary-800">
                    <strong>Tip:</strong> For best OCR results, use good lighting, keep the prescription flat, and ensure all text is clearly visible.
                </p>
            </section>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
    return (
        <div className="card p-4 bg-white flex items-center gap-3 hover:shadow-glow transition-all">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}><Icon className="w-5 h-5" /></div>
            <div>
                <p className="text-2xl font-black text-primary-900 leading-none">{value}</p>
                <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}
