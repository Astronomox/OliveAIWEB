// app/drugs/page.tsx — FEATURE-RICH Drug Search & Verification
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Pill, ShieldCheck, AlertTriangle, ChevronDown,
    ChevronUp, DollarSign, Building2, Hash, Package, Volume2,
    Plus, CheckCircle, Clock, TrendingDown, Sparkles, Camera,
    RefreshCw, X, ExternalLink, Share2, ChevronRight, Star,
    FileText, Scan
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useToast } from "@/hooks";
import { drugsApi, medicationsApi } from "@/services/api";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { DrugSearchInput } from "@/components/ui/DrugSearchInput";
import { Spinner } from "@/components/ui/Spinner";
import type { DrugResponse, GenericResponse, DrugVerificationResponse } from "@/types/api";

const TRENDING_DRUGS = [
    { name: "Paracetamol", emoji: "🩹" },
    { name: "Amoxicillin", emoji: "💊" },
    { name: "Metformin", emoji: "🧬" },
    { name: "Ibuprofen", emoji: "🔥" },
    { name: "Omeprazole", emoji: "🫃" },
];

export default function DrugsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { toasts, addToast, removeToast } = useToast();

    const [tab, setTab] = useState<"search" | "verify">("search");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<DrugResponse[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedDrug, setSelectedDrug] = useState<DrugResponse | null>(null);
    const [generics, setGenerics] = useState<GenericResponse[]>([]);
    const [showGenerics, setShowGenerics] = useState(false);
    const [isLoadingGenerics, setIsLoadingGenerics] = useState(false);
    const [addingTxt, setAddingTxt] = useState<string | null>(null);

    // Verify tab
    const [regNumber, setRegNumber] = useState("");
    const [verifyResult, setVerifyResult] = useState<DrugVerificationResponse | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // Recent searches
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) { router.push("/login"); return; }
        // Load recent searches
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("smama_recent_drug_searches");
            if (saved) setRecentSearches(JSON.parse(saved));
        }
    }, [authLoading, isAuthenticated]);

    const saveRecentSearch = (term: string) => {
        const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem("smama_recent_drug_searches", JSON.stringify(updated));
    };

    const handleSearch = useCallback((value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (value.length < 2) { setResults([]); return; }
        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            const res = await drugsApi.search(value);
            if (res.data) { setResults(res.data.results || []); saveRecentSearch(value); }
            else setResults([]);
            setIsSearching(false);
        }, 400);
    }, [recentSearches]);

    const selectDrug = async (drug: DrugResponse) => {
        setSelectedDrug(drug);
        setResults([]);
        setQuery(drug.name);
        setShowGenerics(false);
        setGenerics([]);
    };

    const loadGenerics = async () => {
        if (!selectedDrug) return;
        setIsLoadingGenerics(true);
        setShowGenerics(true);
        const res = await drugsApi.getGenerics(selectedDrug.name);
        if (res.data) setGenerics(res.data);
        setIsLoadingGenerics(false);
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!regNumber.trim()) { addToast("Enter a NAFDAC registration number", "error"); return; }
        setIsVerifying(true);
        const res = await drugsApi.verify({ reg_number: regNumber.trim() });
        if (res.data) setVerifyResult(res.data);
        else addToast(res.error?.message || "Verification failed", "error");
        setIsVerifying(false);
    };

    const handleAddToMeds = async (drugName: string) => {
        if (!user) return;
        setAddingTxt(drugName);
        const res = await medicationsApi.create(user.id, {
            drug_name: drugName,
            dosage: selectedDrug?.price_naira ? `₦${selectedDrug.price_naira}` : "",
            frequency: "As directed",
            start_date: new Date().toISOString().split("T")[0],
            reminder_times: ["08:00"],
        });
        if (res.data) addToast(`${drugName} added to medications! 💊`, "success");
        else addToast(res.error?.message || "Failed", "error");
        setAddingTxt(null);
    };

    if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={40} /></div>;

    return (
        <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* ═══════════ HEADER ═══════════ */}
            <div>
                <h1 className="text-3xl font-black text-primary-950 tracking-tight flex items-center gap-3">
                    <Search className="w-8 h-8 text-primary-500" /> Drug Search &amp; Verify
                </h1>
                <p className="text-sm font-medium text-muted-foreground mt-1">Find drugs, compare prices, check generics &amp; verify NAFDAC registration</p>
            </div>

            {/* ═══════════ TAB SWITCH ═══════════ */}
            <div className="flex gap-2">
                <button onClick={() => setTab("search")} className={cn(
                    "flex-1 py-3 rounded-2xl text-sm font-black uppercase transition-all flex items-center justify-center gap-2",
                    tab === "search" ? "bg-primary-600 text-white shadow-glow" : "bg-white text-primary-600 border border-primary-200"
                )}><Search className="w-4 h-4" /> Search Drugs</button>
                <button onClick={() => setTab("verify")} className={cn(
                    "flex-1 py-3 rounded-2xl text-sm font-black uppercase transition-all flex items-center justify-center gap-2",
                    tab === "verify" ? "bg-primary-600 text-white shadow-glow" : "bg-white text-primary-600 border border-primary-200"
                )}><ShieldCheck className="w-4 h-4" /> Verify NAFDAC</button>
            </div>

            {/* ═══════════ SEARCH TAB ═══════════ */}
            {tab === "search" && (
                <div className="space-y-6">
                    {/* Search input */}
                    <DrugSearchInput
                        value={query}
                        onSelect={(drug) => selectDrug(drug as any)}
                        onChange={(val) => {
                            setQuery(val);
                            if (val.length < 2) { setResults([]); return; }
                            handleSearch(val);
                        }}
                        placeholder="Search by drug name, generic name, or manufacturer..."
                        inputClassName="h-14 rounded-[2rem] text-lg pl-12 pr-10"
                    />

                    {/* Trending searches */}
                    {!selectedDrug && !query && (
                        <>
                            <section>
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4" /> Trending Searches
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {TRENDING_DRUGS.map(d => (
                                        <button key={d.name} onClick={() => handleSearch(d.name)}
                                            className="px-4 py-2 rounded-2xl bg-white border border-border hover:border-primary-300 hover:shadow-md text-xs font-bold text-primary-800 transition-all flex items-center gap-1.5 active:scale-95">
                                            <span>{d.emoji}</span> {d.name}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {recentSearches.length > 0 && (
                                <section>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Recent Searches
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {recentSearches.map(s => (
                                            <button key={s} onClick={() => handleSearch(s)}
                                                className="px-3 py-1.5 rounded-full bg-cream border border-border text-xs font-bold text-primary-600 hover:bg-primary-50 transition-all">
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}

                    {/* Live search results */}
                    {results.length > 0 && !selectedDrug && (
                        <section className="card bg-white divide-y divide-gray-50 rounded-[2rem] overflow-hidden shadow-lg border border-gray-100">
                            {results.map(drug => (
                                <button key={drug.emdex_id} onClick={() => selectDrug(drug)}
                                    className="w-full text-left p-4 hover:bg-primary-50 transition-colors flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                                        <Pill className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-primary-900">{drug.name}</p>
                                        <p className="text-xs text-muted-foreground">{drug.generic_name || "—"} · {drug.manufacturer}</p>
                                    </div>
                                    <span className="text-sm font-black text-safe-600">₦{drug.price_naira?.toLocaleString()}</span>
                                </button>
                            ))}
                        </section>
                    )}

                    {/* Selected Drug Detail */}
                    {selectedDrug && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            {/* Main drug card */}
                            <section className="card p-6 bg-white border-l-4 border-l-primary-500">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-primary text-white flex items-center justify-center shadow-lg shrink-0">
                                        <Pill className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-2xl font-black text-primary-900">{selectedDrug.name}</h2>
                                        {selectedDrug.generic_name && <p className="text-sm text-muted-foreground font-bold">{selectedDrug.generic_name}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                    <DetailItem icon={Building2} label="Manufacturer" value={selectedDrug.manufacturer} />
                                    <DetailItem icon={DollarSign} label="Price" value={`₦${selectedDrug.price_naira?.toLocaleString()}`} />
                                    <DetailItem icon={Hash} label="EMDEX ID" value={selectedDrug.emdex_id} />
                                </div>

                                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                                    <button onClick={() => handleAddToMeds(selectedDrug.name)} disabled={addingTxt === selectedDrug.name}
                                        className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-safe-50 text-safe-700 hover:bg-safe-100 text-xs font-black transition-all">
                                        {addingTxt === selectedDrug.name ? <Spinner size={14} color="#10B981" /> : <Plus className="w-3.5 h-3.5" />}
                                        Add to Medications
                                    </button>
                                    <Link href="/pregnancy" className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-secondary-50 text-secondary-700 hover:bg-secondary-100 text-xs font-black transition-all">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Pregnancy Safety
                                    </Link>
                                    <button className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-black transition-all">
                                        <Volume2 className="w-3.5 h-3.5" /> Read Aloud
                                    </button>
                                </div>
                            </section>

                            {/* Generics section */}
                            <section className="card p-5 bg-white">
                                <button onClick={loadGenerics} className="w-full flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <TrendingDown className="w-4 h-4 text-safe-500" /> Generic Alternatives &amp; Savings
                                    </h3>
                                    {showGenerics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                <AnimatePresence>
                                    {showGenerics && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 space-y-2 overflow-hidden">
                                            {isLoadingGenerics ? (
                                                <div className="flex items-center justify-center py-6"><Spinner size={24} /></div>
                                            ) : generics.length > 0 ? (
                                                generics.map((g, i) => (
                                                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-cream/50 border border-border">
                                                        <div className="w-8 h-8 rounded-lg bg-safe-100 text-safe-600 flex items-center justify-center shrink-0">
                                                            <Pill className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-primary-900 text-sm">{g.name}</p>
                                                            <p className="text-[10px] text-muted-foreground">{g.manufacturer}</p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-sm font-black text-safe-600">₦{g.price_naira.toLocaleString()}</p>
                                                            {g.savings > 0 && (
                                                                <p className="text-[10px] font-bold text-safe-500 flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> Save ₦{g.savings.toLocaleString()}</p>
                                                            )}
                                                        </div>
                                                        <button onClick={() => handleAddToMeds(g.name)} disabled={addingTxt === g.name}
                                                            className="p-2 rounded-xl bg-safe-50 hover:bg-safe-100 text-safe-600 transition-all shrink-0" title="Add to meds">
                                                            {addingTxt === g.name ? <Spinner size={14} color="#10B981" /> : <Plus className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-muted-foreground text-center py-4 italic">No generic alternatives found in our database.</p>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </section>

                            {/* Built-in generics */}
                            {selectedDrug.generics && selectedDrug.generics.length > 0 && !showGenerics && (
                                <section className="card p-5 bg-white">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Available Generics ({selectedDrug.generics.length})</h3>
                                    <div className="space-y-2">
                                        {selectedDrug.generics.map((g, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-cream/50 border border-border">
                                                <Pill className="w-4 h-4 text-primary-500 shrink-0" />
                                                <div className="flex-1"><p className="text-sm font-bold">{g.name}</p><p className="text-[10px] text-muted-foreground">{g.manufacturer}</p></div>
                                                <span className="text-sm font-black text-safe-600">₦{g.price_naira.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <button onClick={() => { setSelectedDrug(null); setQuery(""); }} className="btn-ghost rounded-2xl w-full flex items-center justify-center gap-2">
                                <Search className="w-4 h-4" /> Search Another Drug
                            </button>
                        </motion.div>
                    )}

                    {/* Empty search state */}
                    {!selectedDrug && !query && results.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-50 rounded-full mx-auto flex items-center justify-center mb-4">
                                <Search className="w-10 h-10 text-gray-200" />
                            </div>
                            <p className="font-bold text-primary-900">Search the EMDEX Drug Database</p>
                            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">Find any drug in Nigeria — check prices, generics, and NAFDAC registration status</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ VERIFY TAB ═══════════ */}
            {tab === "verify" && (
                <div className="space-y-6">
                    <section className="card p-6 bg-white border-l-4 border-l-secondary-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-secondary-100 text-secondary-600 flex items-center justify-center shadow-md">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-primary-900 uppercase tracking-tight">NAFDAC Verification</h3>
                                <p className="text-xs text-muted-foreground font-bold">Enter the NAFDAC registration number to verify drug authenticity</p>
                            </div>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-primary-900 uppercase mb-1">NAFDAC Registration Number</label>
                                <input type="text" value={regNumber} onChange={e => setRegNumber(e.target.value)}
                                    placeholder="e.g. A4-0123 or NAFDAC/04-1234"
                                    className="input w-full h-14 text-lg" required />
                                <p className="text-[10px] text-muted-foreground mt-1">Find this on the drug packaging, usually near the NAFDAC logo</p>
                            </div>
                            <button type="submit" disabled={isVerifying} className="btn-primary rounded-2xl w-full flex items-center justify-center gap-2">
                                {isVerifying ? <><Spinner size={20} color="white" /> Verifying…</> : <><ShieldCheck className="w-4 h-4" /> Verify Now</>}
                            </button>
                        </form>
                    </section>

                    {/* Verification Result */}
                    {verifyResult && (
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className={cn("card p-6 border-2", verifyResult.status === "verified" || verifyResult.status === "valid" ? "border-safe-300 bg-safe-50" : "border-danger-300 bg-danger-50")}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                                    verifyResult.status === "verified" || verifyResult.status === "valid" ? "bg-safe-500 text-white" : "bg-danger-500 text-white")}>
                                    {verifyResult.status === "verified" || verifyResult.status === "valid" ? <CheckCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black uppercase">{verifyResult.status === "verified" || verifyResult.status === "valid" ? "✅ VERIFIED" : "⚠️ " + verifyResult.status.toUpperCase()}</h4>
                                    <p className="text-sm font-medium">{verifyResult.message}</p>
                                </div>
                            </div>

                            {verifyResult.product_details && Object.keys(verifyResult.product_details).length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {Object.entries(verifyResult.product_details).map(([key, val]) => (
                                        <div key={key} className="p-3 bg-white/60 rounded-xl">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground">{key.replace(/_/g, " ")}</p>
                                            <p className="text-sm font-bold text-primary-900">{String(val)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {verifyResult.verification_tips.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs font-black uppercase text-muted-foreground mb-2">Verification Tips</p>
                                    <ul className="space-y-1">
                                        {verifyResult.verification_tips.map((tip, i) => (
                                            <li key={i} className="text-xs font-medium flex items-start gap-2">
                                                <CheckCircle className="w-3 h-3 text-safe-500 shrink-0 mt-0.5" /> {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.section>
                    )}

                    {/* How to find NAFDAC number */}
                    <section className="card p-5 bg-cream border border-secondary-100">
                        <h4 className="text-xs font-black uppercase tracking-widest text-secondary-800 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> How to Find the NAFDAC Number
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-secondary-200 text-secondary-800 text-xs font-black flex items-center justify-center shrink-0">1</span>
                                <p className="text-xs text-secondary-900 font-medium">Look on the drug&apos;s outer packaging (box or wrapper)</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-secondary-200 text-secondary-800 text-xs font-black flex items-center justify-center shrink-0">2</span>
                                <p className="text-xs text-secondary-900 font-medium">Find the NAFDAC logo — the number is usually nearby</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-secondary-200 text-secondary-800 text-xs font-black flex items-center justify-center shrink-0">3</span>
                                <p className="text-xs text-secondary-900 font-medium">It looks like: A4-0123, NAFDAC/04-1234, or similar formats</p>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* ═══════════ QUICK LINKS ═══════════ */}
            <section className="flex flex-wrap gap-3 justify-center pt-2">
                <Link href="/scan" className="text-xs font-bold text-muted-foreground hover:text-primary-600 transition-colors flex items-center gap-1"><Camera className="w-3 h-3" /> Scan Drug</Link>
                <span className="text-gray-200">|</span>
                <Link href="/pregnancy" className="text-xs font-bold text-muted-foreground hover:text-primary-600 transition-colors flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Pregnancy Check</Link>
                <span className="text-gray-200">|</span>
                <Link href="/medications" className="text-xs font-bold text-muted-foreground hover:text-primary-600 transition-colors flex items-center gap-1"><Pill className="w-3 h-3" /> My Medications</Link>
            </section>
        </div>
    );
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="p-3 bg-cream/50 rounded-xl border border-border">
            <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</p>
            <p className="text-sm font-bold text-primary-900 mt-0.5">{value || "—"}</p>
        </div>
    );
}
