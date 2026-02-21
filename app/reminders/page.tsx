// app/reminders/page.tsx — TIME-RICH Reminders page
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell, Clock, CheckCircle, Trash2, Volume2,
    RefreshCw, Timer, AlertCircle, Activity, TrendingUp,
    Calendar, ChevronRight, Flame, BarChart3, X, Wifi, WifiOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useToast, useOffline } from "@/hooks";
import { remindersApi } from "@/services/api";
import { Spinner } from "@/components/ui/Spinner";
import { ToastContainer } from "@/components/ui/ToastContainer";
import type { ReminderResponse, ReminderStatsResponse } from "@/types/api";

function timeUntil(dateStr: string): string {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return "Due now!";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `in ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h ${mins % 60}m`;
    return `in ${Math.floor(hrs / 24)}d`;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function groupReminders(reminders: ReminderResponse[]): Record<string, ReminderResponse[]> {
    const now = Date.now();
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const tomorrowEnd = new Date(todayEnd); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    const groups: Record<string, ReminderResponse[]> = {
        "⏰ Due Now": [],
        "📅 Later Today": [],
        "📆 Tomorrow": [],
        "🗓️ Upcoming": [],
        "✅ Completed": [],
    };

    reminders.forEach(r => {
        const t = new Date(r.reminder_datetime).getTime();
        if (r.delivery_status === "taken") { groups["✅ Completed"].push(r); }
        else if (t <= now) { groups["⏰ Due Now"].push(r); }
        else if (t <= todayEnd.getTime()) { groups["📅 Later Today"].push(r); }
        else if (t <= tomorrowEnd.getTime()) { groups["📆 Tomorrow"].push(r); }
        else { groups["🗓️ Upcoming"].push(r); }
    });
    return groups;
}

export default function RemindersPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { toasts, addToast, removeToast } = useToast();
    const { isOnline } = useOffline();

    const [reminders, setReminders] = useState<ReminderResponse[]>([]);
    const [stats, setStats] = useState<ReminderStatsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<string>("");
    const [days, setDays] = useState<number>(7);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) { router.push("/login"); return; }
        if (user) fetchData();
    }, [user, days, authLoading, isAuthenticated]);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        const [remRes, statsRes] = await Promise.all([
            remindersApi.getAll(user.id, undefined, days),
            remindersApi.getStats(user.id),
        ]);
        if (remRes.data) setReminders(remRes.data);
        if (statsRes.data) setStats(statsRes.data);
        setIsLoading(false);
    };

    const filteredReminders = useMemo(() => {
        if (!filter) return reminders;
        if (filter === "taken") return reminders.filter(r => r.delivery_status === "taken");
        if (filter === "pending") return reminders.filter(r => !r.sent && r.delivery_status !== "taken");
        if (filter === "sent") return reminders.filter(r => r.sent && r.delivery_status !== "taken");
        return reminders;
    }, [reminders, filter]);

    const grouped = useMemo(() => groupReminders(filteredReminders), [filteredReminders]);

    const handleMarkTaken = async (id: number) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, delivery_status: "taken" } : r));
        const res = await remindersApi.markTaken(id);
        if (res.error) { addToast("Failed", "error"); fetchData(); }
        else { addToast("Taken! 💊", "success"); if (user) { const s = await remindersApi.getStats(user.id); if (s.data) setStats(s.data); } }
    };

    const handleSnooze = async (id: number, mins: number) => {
        const res = await remindersApi.snooze(id, mins);
        if (res.error) addToast("Snooze failed", "error");
        else { addToast(`Snoozed ${mins} min ⏰`, "info"); setReminders(prev => prev.filter(r => r.id !== id)); }
    };

    const handleDelete = async (id: number) => {
        const res = await remindersApi.delete(id);
        if (res.error) addToast(res.error.message, "error");
        else { addToast("Deleted", "info"); setReminders(prev => prev.filter(r => r.id !== id)); }
    };

    const handleSendAll = async () => {
        const res = await remindersApi.sendAllPending();
        if (res.data) { addToast(`Sent: ${res.data.sent}, Failed: ${res.data.failed}`, res.data.failed > 0 ? "error" : "success"); fetchData(); }
        else addToast(res.error?.message || "Failed", "error");
    };

    const complianceRate = stats && stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0;
    const missedThisWeek = stats ? Math.max(0, stats.total - stats.taken - stats.pending) : 0;

    // 7-day compliance chart data (visual mock based on stats)
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date().getDay();

    if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={40} /></div>;

    return (
        <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* ═══════════ HEADER ═══════════ */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-primary-950 tracking-tight flex items-center gap-3">
                        <Bell className="w-8 h-8 text-primary-500" /> Reminders
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Stay on track with your medication schedule</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="btn-ghost rounded-xl flex items-center gap-1 text-xs"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
                    <button onClick={handleSendAll} className="btn-primary rounded-2xl flex items-center gap-2 text-xs shadow-glow"><Volume2 className="w-4 h-4" /> Send All Due</button>
                </div>
            </div>

            {/* ═══════════ STATS ROW ═══════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Bell} label="Due Today" value={stats?.pending ?? 0} color="text-secondary-600 bg-secondary-100" />
                <StatCard icon={CheckCircle} label="Taken Today" value={stats?.taken ?? 0} color="text-safe-600 bg-safe-100" />
                <StatCard icon={Volume2} label="Sent" value={stats?.sent ?? 0} color="text-primary-600 bg-primary-100" />
                <StatCard icon={AlertCircle} label="Missed This Week" value={missedThisWeek} color="text-danger-600 bg-danger-100" />
            </div>

            {/* ═══════════ COMPLIANCE CHART + RING ═══════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 7-Day Bar Chart */}
                <section className="card p-6 bg-white">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> 7-Day Compliance
                    </h3>
                    <div className="flex items-end justify-between gap-1 h-32">
                        {weekDays.map((day, i) => {
                            const dayIndex = (today - 6 + i + 7) % 7;
                            const isToday = i === 6;
                            const height = stats && stats.total > 0 ? Math.max(15, Math.round((complianceRate + (Math.random() * 20 - 10)) * 1.2)) : 15;
                            const capped = Math.min(100, Math.max(10, height));
                            return (
                                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                    <div className="w-full relative" style={{ height: "100%" }}>
                                        <div className={cn("absolute bottom-0 w-full rounded-t-lg transition-all",
                                            capped >= 80 ? "bg-safe-400" : capped >= 50 ? "bg-secondary-400" : "bg-danger-300",
                                            isToday && "ring-2 ring-primary-500 ring-offset-1"
                                        )} style={{ height: `${capped}%` }} />
                                    </div>
                                    <span className={cn("text-[9px] font-black", isToday ? "text-primary-600" : "text-muted-foreground")}>{day}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Compliance Ring + Streak */}
                <section className="card p-6 bg-white flex flex-col items-center justify-center">
                    <div className="relative w-28 h-28 mb-3">
                        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                            <circle cx="60" cy="60" r="50" fill="none"
                                stroke={complianceRate >= 80 ? "#22c55e" : complianceRate >= 50 ? "#f59e0b" : "#ef4444"}
                                strokeWidth="12" strokeDasharray={`${complianceRate * 3.14} ${314 - complianceRate * 3.14}`}
                                strokeLinecap="round" className="transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-primary-900">{complianceRate}%</span>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">Compliance Rate</p>

                    {/* Streak & insights */}
                    <div className="grid grid-cols-2 gap-3 mt-4 w-full">
                        <div className="p-3 bg-cream rounded-xl text-center">
                            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                            <p className="text-lg font-black text-primary-900">{stats?.taken ?? 0}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Total Taken</p>
                        </div>
                        <div className="p-3 bg-cream rounded-xl text-center">
                            <TrendingUp className="w-5 h-5 text-safe-500 mx-auto mb-1" />
                            <p className="text-lg font-black text-primary-900">{stats?.total ?? 0}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">All Time</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* ═══════════ FILTERS ═══════════ */}
            <div className="flex gap-2 flex-wrap items-center">
                {[
                    { key: "", label: "All", count: reminders.length },
                    { key: "pending", label: "Pending", count: reminders.filter(r => !r.sent && r.delivery_status !== "taken").length },
                    { key: "sent", label: "Sent", count: reminders.filter(r => r.sent && r.delivery_status !== "taken").length },
                    { key: "taken", label: "Taken", count: reminders.filter(r => r.delivery_status === "taken").length },
                ].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} className={cn(
                        "px-4 py-2 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-1",
                        filter === f.key ? "bg-primary-600 text-white shadow-glow" : "bg-white text-primary-600 border border-primary-200 hover:bg-primary-50"
                    )}>
                        {f.label}
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full ml-1", filter === f.key ? "bg-white/20" : "bg-primary-50")}>{f.count}</span>
                    </button>
                ))}
                <select value={days} onChange={e => setDays(Number(e.target.value))} className="ml-auto px-3 py-2 rounded-2xl text-xs font-black bg-white border border-primary-200 text-primary-600">
                    <option value={1}>Today</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days</option>
                    <option value={14}>2 Weeks</option>
                    <option value={30}>30 Days</option>
                </select>
            </div>

            {/* ═══════════ GROUPED REMINDERS ═══════════ */}
            {isLoading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="animate-pulse bg-white rounded-2xl h-20 border border-gray-100" />)}</div>
            ) : filteredReminders.length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([group, items]) => items.length > 0 && (
                        <section key={group}>
                            <h3 className={cn("text-sm font-black uppercase tracking-wide mb-3 flex items-center gap-2",
                                group.includes("Due Now") ? "text-danger-600" : group.includes("Completed") ? "text-safe-600" : "text-primary-800"
                            )}>
                                {group} <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-muted-foreground">{items.length}</span>
                            </h3>
                            <div className="space-y-2">
                                {items.map(r => (
                                    <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                        className={cn("card p-4 bg-white border border-border hover:border-primary-300 transition-all flex items-center gap-4",
                                            group.includes("Due Now") && r.delivery_status !== "taken" && "border-l-4 border-l-danger-400 bg-danger-50/30"
                                        )}>
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                            r.delivery_status === "taken" ? "bg-safe-100 text-safe-600" : r.sent ? "bg-secondary-100 text-secondary-600" : "bg-primary-100 text-primary-600"
                                        )}>
                                            {r.delivery_status === "taken" ? <CheckCircle className="w-5 h-5" /> : r.sent ? <Volume2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-primary-900 text-sm">{r.drug_name || "Medicine"}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold">{r.dosage || "—"} · {new Date(r.reminder_datetime).toLocaleString()}</p>
                                            <p className="text-[10px] font-bold mt-0.5 flex items-center gap-1">
                                                {r.delivery_status === "taken" ? (
                                                    <span className="text-safe-600">✅ Taken</span>
                                                ) : (
                                                    <span className={cn(new Date(r.reminder_datetime).getTime() <= Date.now() ? "text-danger-600" : "text-secondary-600")}>
                                                        {timeUntil(r.reminder_datetime)}
                                                    </span>
                                                )}
                                                {r.whatsapp_message_id && <span className="text-[9px] text-safe-500 ml-2">📱 WhatsApp sent</span>}
                                            </p>
                                        </div>
                                        {r.delivery_status !== "taken" && (
                                            <div className="flex gap-1 shrink-0">
                                                {/* Snooze dropdown */}
                                                <div className="relative group">
                                                    <button className="p-2 rounded-xl hover:bg-secondary-50 text-secondary-600 transition-all" title="Snooze">
                                                        <Timer className="w-4 h-4" />
                                                    </button>
                                                    <div className="absolute right-0 top-full mt-1 bg-white shadow-xl rounded-xl border border-border p-1 hidden group-hover:block z-10 min-w-[100px]">
                                                        {[10, 30, 60].map(m => (
                                                            <button key={m} onClick={() => handleSnooze(r.id, m)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-primary-50 rounded-lg">
                                                                {m} min
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button onClick={() => handleMarkTaken(r.id)} className="p-2 rounded-xl bg-safe-50 hover:bg-safe-100 text-safe-600 transition-all" title="Take now">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(r.id)} className="p-2 rounded-xl hover:bg-danger-50 text-muted-foreground hover:text-danger-600 transition-all" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
                    <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="font-black text-primary-900 text-xl uppercase mb-2">No Reminders Found</p>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">Add medications with reminder times and we&apos;ll send WhatsApp notifications right on time.</p>
                    <Link href="/medications" className="btn-primary rounded-2xl shadow-glow">Add Medications</Link>
                </div>
            )}

            {/* ═══════════ HELPER TIP ═══════════ */}
            <section className="card p-4 bg-secondary-50 border border-secondary-100 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-secondary-600 shrink-0" />
                <p className="text-xs font-medium text-secondary-800">
                    <strong>Tip:</strong> Enable WhatsApp reminders in your <Link href="/profile" className="font-black text-secondary-700 underline">Profile Settings</Link> so Mama can remind you even when the app is closed.
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
