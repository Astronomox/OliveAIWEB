// app/medications/page.tsx — DENSE Medications page
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Pill, Plus, Trash2, Activity, CheckCircle, Edit,
    ChevronRight, Calendar, Bell, Clock, Info, ShieldCheck,
    AlertCircle, AlertTriangle, Search, Save, X, Smartphone, BarChart3, Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useToast } from "@/hooks";
import { medicationsApi } from "@/services/api";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { DrugSearchInput } from "@/components/ui/DrugSearchInput";
import { Spinner, SectionSpinner } from "@/components/ui/Spinner";
import type { MedicationResponse, MedicationCreate } from "@/types/api";

const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Every 8 hours", "Every 12 hours", "As needed"];

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function MedicationsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { toasts, addToast, removeToast } = useToast();

    const [medications, setMedications] = useState<MedicationResponse[]>([]);
    const [allMeds, setAllMeds] = useState<MedicationResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("active");
    const [searchQuery, setSearchQuery] = useState("");
    const [newMed, setNewMed] = useState<MedicationCreate>({
        drug_name: "",
        dosage: "",
        frequency: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        reminder_times: ["08:00"],
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) { router.push("/login"); return; }
        if (user) fetchMeds();
    }, [user, authLoading, isAuthenticated]);

    useEffect(() => {
        let filtered = allMeds;
        if (statusFilter) filtered = filtered.filter(m => m.status === statusFilter);
        if (searchQuery) filtered = filtered.filter(m => m.drug_name.toLowerCase().includes(searchQuery.toLowerCase()));
        setMedications(filtered);
    }, [statusFilter, searchQuery, allMeds]);

    const fetchMeds = async () => {
        if (!user) return;
        setIsLoading(true);
        const res = await medicationsApi.getAll(user.id);
        if (res.data) { setAllMeds(res.data); }
        else addToast(res.error?.message || "Failed to load", "error");
        setIsLoading(false);
    };

    const handleAddMed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newMed.drug_name.trim()) { addToast("Drug name is required", "error"); return; }
        setIsSaving(true);
        const res = await medicationsApi.create(user.id, newMed);
        if (res.data) {
            addToast(`${res.data.drug_name} added! ✅`, "success");
            setShowAdd(false);
            setNewMed({ drug_name: "", dosage: "", frequency: "", start_date: new Date().toISOString().split("T")[0], end_date: "", reminder_times: ["08:00"] });
            fetchMeds();
        } else addToast(res.error?.message || "Failed", "error");
        setIsSaving(false);
    };

    const handleDelete = async (id: number) => {
        const res = await medicationsApi.delete(id);
        if (res.error) addToast(res.error.message, "error");
        else { addToast("Medication removed", "info"); setAllMeds(prev => prev.filter(m => m.id !== id)); }
    };

    const handleRecordCompliance = async (id: number) => {
        const res = await medicationsApi.recordCompliance(id);
        if (res.error) addToast("Failed", "error");
        else { addToast("Marked as taken! 💊", "success"); fetchMeds(); }
    };

    const addReminderTime = () => setNewMed(prev => ({ ...prev, reminder_times: [...prev.reminder_times, "12:00"] }));
    const removeReminderTime = (idx: number) => setNewMed(prev => ({ ...prev, reminder_times: prev.reminder_times.filter((_, i) => i !== idx) }));

    // Stats
    const totalMeds = allMeds.length;
    const activeMeds = allMeds.filter(m => m.status === "active").length;
    const completedMeds = allMeds.filter(m => m.status === "completed").length;
    const totalReminders = allMeds.reduce((sum, m) => sum + m.reminders_sent, 0);
    const complianceRate = totalMeds > 0 ? Math.round((completedMeds / totalMeds) * 100) : 0;
    const filterCounts: Record<string, number> = {
        active: allMeds.filter(m => m.status === "active").length,
        completed: allMeds.filter(m => m.status === "completed").length,
        "": allMeds.length,
    };

    if (authLoading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={40} /></div>;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* ═══════════ HEADER ═══════════ */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-primary-950 tracking-tight flex items-center gap-3">
                        <Pill className="w-8 h-8 text-primary-500" /> Medications
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Track, manage &amp; stay on top of every medication</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="btn-primary rounded-2xl flex items-center gap-2 shadow-glow">
                    <Plus className="w-4 h-4" /> Add Medication
                </button>
            </div>

            {/* ═══════════ TOP STATS BAR ═══════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Pill} label="Total" value={totalMeds} color="text-primary-600 bg-primary-100" />
                <StatCard icon={Activity} label="Active" value={activeMeds} color="text-safe-600 bg-safe-100" />
                <StatCard icon={CheckCircle} label="Completed" value={completedMeds} color="text-secondary-600 bg-secondary-100" />
                <StatCard icon={BarChart3} label="Reminders Sent" value={totalReminders} color="text-purple-600 bg-purple-100" />
            </div>

            {/* ═══════════ FILTER + SEARCH ═══════════ */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-2 flex-wrap">
                    {(["active", "completed", ""] as const).map(s => (
                        <button key={s || "all"} onClick={() => setStatusFilter(s)} className={cn(
                            "px-4 py-2 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-1",
                            statusFilter === s ? "bg-primary-600 text-white shadow-glow" : "bg-white text-primary-600 border border-primary-200 hover:bg-primary-50"
                        )}>
                            {s || "All"}
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full ml-1", statusFilter === s ? "bg-white/20" : "bg-primary-50")}>{filterCounts[s]}</span>
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" placeholder="Search medications..." className="input pl-9 w-full text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
            </div>

            {/* ═══════════ ADD MEDICATION FORM ═══════════ */}
            <AnimatePresence>
                {showAdd && (
                    <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <form onSubmit={handleAddMed} className="card p-8 bg-white border-2 border-primary-200 rounded-[2rem]">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-primary-900 uppercase tracking-tight">New Medication</h3>
                                <button type="button" onClick={() => setShowAdd(false)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-muted-foreground" /></button>
                            </div>

                            {/* Section: Drug Info */}
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Drug Information</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-xs font-black text-primary-900 uppercase mb-1">Drug Name *</label>
                                    <DrugSearchInput
                                        value={newMed.drug_name}
                                        onSelect={(drug) => setNewMed({ ...newMed, drug_name: drug.name })}
                                        onChange={(val) => setNewMed({ ...newMed, drug_name: val })}
                                        placeholder="e.g. Amoxicillin"
                                        inputClassName="h-12"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">Olive finds the exact medicine for you</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-primary-900 uppercase mb-1">Dosage</label>
                                    <input type="text" className="input w-full" placeholder="e.g. 500mg" value={newMed.dosage || ""} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} />
                                    <p className="text-[10px] text-muted-foreground mt-1">Amount per dose (e.g. 500mg, 2 tablets)</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-primary-900 uppercase mb-1">Frequency</label>
                                    <select className="input w-full" value={newMed.frequency || ""} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}>
                                        <option value="">Select how often</option>
                                        {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                    <p className="text-[10px] text-muted-foreground mt-1">How often should you take it?</p>
                                </div>
                            </div>

                            {/* Section: Schedule */}
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Schedule</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-xs font-black text-primary-900 uppercase mb-1">Start Date</label>
                                    <input type="date" className="input w-full" value={newMed.start_date} onChange={e => setNewMed({ ...newMed, start_date: e.target.value })} />
                                    <p className="text-[10px] text-muted-foreground mt-1">When did you start or when will you start?</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-primary-900 uppercase mb-1">End Date</label>
                                    <input type="date" className="input w-full" value={newMed.end_date || ""} onChange={e => setNewMed({ ...newMed, end_date: e.target.value })} />
                                    <p className="text-[10px] text-muted-foreground mt-1">Leave empty for ongoing medications</p>
                                </div>
                            </div>

                            {/* Section: Reminder Times */}
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3 flex items-center gap-1"><Clock className="w-3 h-3" /> Reminder Times</p>
                            <div className="flex flex-wrap gap-2 items-center mb-6">
                                {newMed.reminder_times.map((t, idx) => (
                                    <div key={idx} className="flex items-center gap-1 bg-primary-50 rounded-xl border border-primary-100 pr-1">
                                        <input type="time" value={t} onChange={e => { const u = [...newMed.reminder_times]; u[idx] = e.target.value; setNewMed({ ...newMed, reminder_times: u }); }}
                                            className="bg-transparent px-3 py-2 text-sm font-bold text-primary-900 w-24 focus:outline-none" />
                                        <button type="button" onClick={() => removeReminderTime(idx)} className="p-1 rounded-full hover:bg-danger-100 text-danger-500"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={addReminderTime} className="btn-ghost text-xs"><Plus className="w-3 h-3 mr-1" /> Add Time</button>
                            </div>
                            <p className="text-[10px] text-muted-foreground mb-6">We&apos;ll send you WhatsApp reminders at these times</p>

                            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                                <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
                                <button type="submit" disabled={isSaving} className="btn-primary rounded-2xl flex items-center gap-2">
                                    {isSaving ? <Spinner size={20} color="white" /> : <Plus className="w-4 h-4" />}
                                    {isSaving ? "Adding…" : "Add Medication"}
                                </button>
                            </div>
                        </form>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* ═══════════ MEDICATION CARDS ═══════════ */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="animate-pulse bg-white rounded-2xl h-40 border border-gray-100" />)}
                </div>
            ) : medications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {medications.map(med => (
                        <motion.div key={med.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="card p-5 bg-white border border-border hover:border-primary-300 hover:shadow-glow transition-all">
                            <div className="flex items-start gap-4">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
                                    med.status === "active" ? "bg-safe-100 text-safe-600" : "bg-gray-100 text-gray-400")}>
                                    <Pill className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-primary-900 text-lg leading-tight">{med.drug_name}</h4>
                                    <p className="text-xs text-muted-foreground font-bold uppercase mt-0.5">{med.dosage || "—"} · {med.frequency || "—"}</p>

                                    {/* Status + dates */}
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase border",
                                            med.status === "active" ? "bg-safe-50 text-safe-700 border-safe-100" : "bg-gray-50 text-gray-600 border-gray-200")}>{med.status}</span>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                            <Calendar className="w-3 h-3" /> {med.start_date}{med.end_date && ` → ${med.end_date}`}
                                        </span>
                                    </div>

                                    {/* Reminders + created */}
                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                        {med.reminders_sent > 0 && (
                                            <span className="text-[10px] font-bold text-primary-600 flex items-center gap-0.5">
                                                <Timer className="w-3 h-3" /> {med.reminders_sent} reminders sent
                                            </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground">Added {timeAgo(med.created_at)}</span>
                                    </div>

                                    {/* 7-day compliance dots (visual placeholder) */}
                                    <div className="flex gap-1 mt-3">
                                        {[...Array(7)].map((_, i) => (
                                            <div key={i} className={cn("w-4 h-4 rounded-full border",
                                                i < (med.reminders_sent % 7) ? "bg-safe-400 border-safe-500" : "bg-gray-100 border-gray-200")} />
                                        ))}
                                        <span className="text-[9px] text-muted-foreground ml-1 self-center">last 7 days</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                                {med.status === "active" && (
                                    <button onClick={() => handleRecordCompliance(med.id)}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-safe-50 text-safe-600 hover:bg-safe-100 text-xs font-bold transition-all">
                                        <CheckCircle className="w-3.5 h-3.5" /> Take Now
                                    </button>
                                )}
                                <button onClick={() => handleDelete(med.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-danger-50 text-muted-foreground hover:text-danger-600 text-xs font-bold transition-all ml-auto">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
                    <Pill className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="font-black text-primary-900 text-xl uppercase mb-2">No Medications Yet</p>
                    <p className="text-sm text-muted-foreground mb-2 max-w-sm mx-auto">Add your medications to get reminders, track compliance, and keep Olive informed about your health.</p>
                    <div className="space-y-2 text-xs text-muted-foreground max-w-xs mx-auto text-left mb-6">
                        <p>✅ Get WhatsApp reminders at the right time</p>
                        <p>✅ Track your compliance over time</p>
                        <p>✅ Olive AI knows your medications for better advice</p>
                    </div>
                    <button onClick={() => setShowAdd(true)} className="btn-primary rounded-2xl shadow-glow">
                        <Plus className="w-4 h-4 mr-2" /> Add Your First Medication
                    </button>
                </div>
            )}

            {/* ═══════════ HELPER TIP ═══════════ */}
            <section className="card p-4 bg-secondary-50 border border-secondary-100 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-secondary-600 shrink-0" />
                <p className="text-xs font-medium text-secondary-800">
                    <strong>Pro tip:</strong> Add reminder times to each medication so Olive can send you WhatsApp reminders. You can also scan your prescription to auto-add medications.
                </p>
                <Link href="/prescriptions" className="text-xs font-black text-secondary-700 whitespace-nowrap hover:underline flex items-center gap-1">
                    Scan now <ChevronRight className="w-3 h-3" />
                </Link>
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
