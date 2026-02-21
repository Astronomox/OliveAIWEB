// app/pregnancy/page.tsx — Pregnancy Safety Filter page
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePregnancy } from "../../hooks";
import { searchNAFDACDrugs } from "../../services/nafdac";
import { checkDrugPregnancySafety } from "../../services/pregnancy";
import { SafetyBadge } from "../../components/ui/SafetyBadge";
import { RiskMeter } from "../../components/ui/RiskMeter";
import { DrugSearchInput } from "../../components/ui/DrugSearchInput";
import { Spinner } from "../../components/ui/Spinner";
import { Search, Info, Baby, AlertCircle, MessageCircle, ChevronDown, ChevronUp, Pill, Thermometer, Stethoscope, Droplets, RotateCcw } from "lucide-react";
import { cn } from "../../lib/utils";
import type { NAFDACDrug, Trimester, PregnancyCheckResult } from "../../types";

const SAFETY_CATEGORIES = [
    { id: 1, name: "Pain & Fever", icon: Thermometer, color: "text-danger-500", bg: "bg-danger-50", query: "Paracetamol" },
    { id: 2, name: "Vitamins", icon: Pill, color: "text-safe-500", bg: "bg-safe-50", query: "Vitamin" },
    { id: 3, name: "Cough & Cold", icon: Droplets, color: "text-primary-500", bg: "bg-primary-50", query: "Cough" },
    { id: 4, name: "Antibiotics", icon: Stethoscope, color: "text-secondary-500", bg: "bg-secondary-50", query: "Amoxicillin" },
];

export default function PregnancyPage() {
    const { profile, updateTrimester } = usePregnancy();
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<NAFDACDrug[]>([]);
    const [selectedResult, setSelectedResult] = useState<PregnancyCheckResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPidgin, setShowPidgin] = useState(false);
    const [trimester, setTrimester] = useState<Trimester>(profile?.trimester || "first");

    useEffect(() => {
        if (profile?.trimester) setTrimester(profile.trimester);
    }, [profile]);

    const handleSearch = async (e: any) => {
        const query = typeof e === 'string' ? e : e.target.value;
        setSearchQuery(query);

        if (query.length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        const matches = await searchNAFDACDrugs(query);
        setResults(matches);
        setIsLoading(false);
    };

    const selectDrug = async (drug: any) => {
        setIsLoading(true);
        setSelectedResult(null);
        try {
            const result = await checkDrugPregnancySafety(drug.id || drug.emdex_id, trimester);
            setSelectedResult(result);
            setSearchQuery(drug.name);
        } catch (err) {
            console.error("Safety check failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">

            {/* Header & Trimester Selector */}
            <section className="card p-6 border-b-4 border-secondary-400">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900 shadow-inner rounded-2xl flex items-center justify-center">
                        <Baby className="w-7 h-7 text-secondary-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-primary-900 dark:text-primary-100">Safety Filter</h1>
                        <p className="text-sm text-muted-foreground font-medium">Is this medicine safe for your baby?</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block">Select your current trimester</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['first', 'second', 'third'] as Trimester[]).map((tri) => (
                            <button
                                key={tri}
                                onClick={() => {
                                    setTrimester(tri);
                                    if (selectedResult) selectDrug(selectedResult.drug);
                                }}
                                className={cn(
                                    "py-3 rounded-2xl border-2 font-black capitalize transition-all",
                                    trimester === tri
                                        ? "border-secondary-500 bg-secondary-50 text-secondary-900 shadow-md translate-y-[-2px]"
                                        : "border-gray-100 text-muted-foreground bg-gray-50/50"
                                )}
                            >
                                {tri}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Safety Categories */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground px-2">Quick Safety Categories</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {SAFETY_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleSearch(cat.query)}
                            className="card p-4 flex flex-col items-center justify-center text-center gap-3 hover:shadow-glow transition-all active:scale-95 border-b-4 border-b-transparent hover:border-b-primary-500"
                        >
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", cat.bg)}>
                                <cat.icon className={cn("w-6 h-6", cat.color)} />
                            </div>
                            <span className="text-xs font-black text-primary-900 leading-tight">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Drug Search */}
            <section className="relative">
                <DrugSearchInput
                    onSelect={selectDrug}
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search for medication safety (e.g. Paracetamol)..."
                    inputClassName="h-16 rounded-[2rem] shadow-sm border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-lg"
                />

                {isLoading && !selectedResult && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Spinner size={48} />
                        <p className="text-sm font-bold text-muted-foreground animate-pulse">Mama is checking safety records...</p>
                    </div>
                )}
            </section>

            {/* Result Display */}
            {
                selectedResult && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-lg font-black uppercase tracking-tight">Safety Analysis</h3>
                            <button
                                onClick={() => setShowPidgin(!showPidgin)}
                                className={cn("text-xs font-black px-3 py-1.5 rounded-full border-2 transition-all",
                                    showPidgin ? "bg-primary-500 border-primary-500 text-white" : "border-gray-200 text-muted-foreground")}
                            >
                                🇳🇬 Pidgin: {showPidgin ? 'ON' : 'OFF'}
                            </button>
                        </div>

                        <RiskMeter
                            level={selectedResult.currentRisk}
                            category={selectedResult.drug.pregnancy_category}
                            label={selectedResult.drug.name}
                        />

                        <div className="card p-6 bg-white dark:bg-gray-900 border-l-4 border-l-primary-500 shadow-glow">
                            <h4 className="font-black text-primary-900 dark:text-primary-100 flex items-center gap-2 mb-3">
                                <Info className="w-5 h-5 text-primary-500" />
                                Mama's Guidance
                            </h4>

                            <div className="space-y-4">
                                <p className="text-lg font-medium leading-relaxed">
                                    {selectedResult.explanation}
                                </p>

                                {showPidgin && (
                                    <div className="p-4 rounded-2xl bg-cream border border-secondary-200 italic font-bold text-secondary-900 animate-slide-down">
                                        {selectedResult.pidginExplanation}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                                <button className="btn-primary py-3 px-6 h-auto text-sm flex-1">
                                    <MessageCircle className="w-5 h-5" /> Ask Mama AI
                                </button>
                            </div>
                        </div>

                        {/* Alternatives */}
                        {selectedResult.alternatives.length > 0 && (
                            <section className="space-y-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground px-2">Safer Alternatives</h4>
                                <div className="space-y-3">
                                    {selectedResult.alternatives.map((alt) => (
                                        <div key={alt.id} className="card p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-bold">{alt.name}</p>
                                                <p className="text-xs text-muted-foreground">{alt.generic_name}</p>
                                            </div>
                                            <SafetyBadge level="safe" size="sm" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Warning Banner */}
                        <div className="p-5 rounded-3xl bg-danger-50 border border-danger-100 flex gap-4">
                            <AlertCircle className="w-6 h-6 text-danger-600 shrink-0" />
                            <p className="text-xs font-bold text-danger-800 leading-relaxed uppercase tracking-tight">
                                NEVER change your medicine without talking to your doctor. Olive AI provides guidance but a doctor knows your specific health history best.
                            </p>
                        </div>
                    </div>
                )
            }

            {/* Empty State */}
            {
                !selectedResult && !isLoading && (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full mx-auto flex items-center justify-center">
                            <Search className="w-10 h-10 text-gray-200" />
                        </div>
                        <p className="text-muted-foreground font-medium">Search for a drug to see its safety profile for your trimester.</p>
                    </div>
                )
            }
        </div >
    );
}
