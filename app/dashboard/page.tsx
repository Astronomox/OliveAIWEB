// app/dashboard/page.tsx — PACKED Dashboard
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Pill, Bell, CheckCircle, ClipboardList, Scan, MessageCircle,
    HeartPulse, Leaf, Clock, TrendingUp, Calendar,
    ChevronRight, Volume2, Share2, Timer, Wifi, WifiOff,
    Activity, AlertTriangle, Baby, Sparkles, Sun, Moon, CloudSun
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useOffline, useToast, usePregnancy } from "@/hooks";
import { remindersApi, medicationsApi, prescriptionsApi } from "@/services/api";
import { Spinner } from "@/components/ui/Spinner";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { getBabySize } from "@/services/pregnancy";
import type { ReminderResponse, ReminderStatsResponse, MedicationResponse } from "@/types/api";

const HEALTH_TIPS = [
    { tip: "Take your folic acid every day — it helps protect your baby's brain and spine development.", emoji: "🧬" },
    { tip: "Drink at least 8 glasses of water daily, especially during pregnancy in Nigeria's heat.", emoji: "💧" },
    { tip: "Avoid self-medicating. Always consult your doctor before taking any drug during pregnancy.", emoji: "⚠️" },
    { tip: "Iron-rich foods like beans, spinach, and liver help prevent anaemia in pregnancy.", emoji: "🥬" },
    { tip: "Get enough rest — your body is working hard growing a tiny human being!", emoji: "😴" },
    { tip: "Keep all your antenatal appointments. Early detection saves lives.", emoji: "🏥" },
    { tip: "Malaria is dangerous during pregnancy. Sleep under treated nets every night.", emoji: "🦟" },
];

function getGreeting(): { text: string; icon: React.ElementType } {
    const h = new Date().getHours();
    if (h < 12) return { text: "Good Morning", icon: Sun };
    if (h < 17) return { text: "Good Afternoon", icon: CloudSun };
    return { text: "Good Evening", icon: Moon };
}

function formatDate(): string {
    return new Date().toLocaleDateString("en-NG", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
}

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

function timeUntil(dateStr: string): string {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return "Due now!";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `in ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h`;
    return `in ${Math.floor(hrs / 24)}d`;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { isOnline } = useOffline();
    const { toasts, addToast, removeToast } = useToast();
    const { profile } = usePregnancy();

    const [reminders, setReminders] = useState<ReminderResponse[]>([]);
    const [stats, setStats] = useState<ReminderStatsResponse | null>(null);
    const [medications, setMedications] = useState<MedicationResponse[]>([]);
    const [prescriptionCount, setPrescriptionCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState<{ action: string; drug: string; time: string; icon: React.ElementType }[]>([]);

    const greeting = useMemo(() => getGreeting(), []);
    const todayTip = useMemo(() => HEALTH_TIPS[new Date().getDay() % HEALTH_TIPS.length], []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) { 
            // Add a small delay to prevent race conditions with auth initialization
            setTimeout(() => {
                if (!isAuthenticated) {
                    router.push("/auth?mode=login");
                }
            }, 200);
            return; 
        }
        if (user) fetchAll();
    }, [user, authLoading, isAuthenticated, router]);

    const fetchAll = async () => {
        if (!user) return;
        setIsLoading(true);

        // OPTIMIZATION: Promise.allSettled ensures if 1 API fails (e.g. reminders), the rest still load
        const results = await Promise.allSettled([
            remindersApi.getAll(user.id, undefined, 3),
            remindersApi.getStats(user.id),
            medicationsApi.getAll(user.id, "active"),
            prescriptionsApi.getAll(user.id),
        ]);

        const remRes = results[0].status === "fulfilled" ? results[0].value : null;
        const statsRes = results[1].status === "fulfilled" ? results[1].value : null;
        const medsRes = results[2].status === "fulfilled" ? results[2].value : null;
        const rxRes = results[3].status === "fulfilled" ? results[3].value : null;

        if (remRes?.data) setReminders(remRes.data);
        if (statsRes?.data) setStats(statsRes.data);
        if (medsRes?.data) {
            setMedications(medsRes.data);
            // Build recent activity from medications
            const activity = medsRes.data.slice(0, 5).map((m: MedicationResponse) => ({
                action: m.status === "active" ? "Taking" : "Completed",
                drug: `${m.drug_name} ${m.dosage || ""}`,
                time: m.created_at,
                icon: m.status === "active" ? Pill : CheckCircle,
            }));
            setRecentActivity(activity);
        }
        if (rxRes?.data) setPrescriptionCount(rxRes.data.length);
        setIsLoading(false);
    };

    const handleMarkTaken = async (id: number) => {
        setReminders(prev => prev.filter(r => r.id !== id));
        const res = await remindersApi.markTaken(id);
        if (res.error) { addToast("Failed", "error"); fetchAll(); }
        else { addToast("Marked as taken! 💊", "success"); fetchAll(); }
    };

    const handleSnooze = async (id: number) => {
        const res = await remindersApi.snooze(id, 10);
        if (res.error) addToast("Snooze failed", "error");
        else { addToast("Snoozed 10 min ⏰", "info"); setReminders(prev => prev.filter(r => r.id !== id)); }
    };

    const complianceRate = stats && stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0;
    const takenToday = stats?.taken ?? 0;
    const pendingToday = stats?.pending ?? 0;
    const totalToday = takenToday + pendingToday;
    const todayProgress = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 0;

    const babySize = profile?.weekNumber ? getBabySize(profile.weekNumber) : null;

    if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={40} /></div>;

    return (
        <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* ═══════════ GREETING + STATUS BAR ═══════════ */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
                        <Calendar className="w-4 h-4" />
                        {formatDate()}
                        <span className={cn("ml-2 flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full", isOnline ? "bg-safe-50 text-safe-700" : "bg-danger-50 text-danger-700")}>
                            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            {isOnline ? "Online" : "Offline"}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-primary-950 tracking-tight flex items-center gap-3 mt-1">
                        <greeting.icon className="w-8 h-8 text-secondary-500" />
                        {greeting.text}, {user?.name?.split(" ")[0] || "Mama"} 🌿
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Here&apos;s your health dashboard for today</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary text-white flex items-center justify-center text-lg font-black shadow-lg">
                        {user?.name?.charAt(0).toUpperCase() || "M"}
                    </div>
                </div>
            </section>

            {/* ═══════════ QUICK STATS ROW ═══════════ */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickStat icon={Pill} label="Medications" value={medications.length} color="bg-primary-100 text-primary-600" />
                <QuickStat icon={Bell} label="Reminders Today" value={stats?.total ?? 0} color="bg-secondary-100 text-secondary-600" />
                <QuickStat icon={CheckCircle} label="Taken Today" value={takenToday} color="bg-safe-100 text-safe-600" />
                <QuickStat icon={ClipboardList} label="Prescriptions" value={prescriptionCount} color="bg-purple-100 text-purple-600" />
            </section>

            {/* ═══════════ TODAY'S MEDICATION SUMMARY ═══════════ */}
            <section className="card p-6 bg-white border-l-4 border-l-primary-500">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-primary-900 uppercase tracking-tight flex items-center gap-2">
                        <Pill className="w-5 h-5 text-primary-500" /> Today&apos;s Medications
                    </h2>
                    <span className="text-xs font-black text-muted-foreground">{takenToday} of {totalToday} taken</span>
                </div>
                {/* Progress bar */}
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${todayProgress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn("h-full rounded-full transition-colors", todayProgress >= 80 ? "bg-safe-500" : todayProgress >= 50 ? "bg-secondary-500" : "bg-primary-500")}
                    />
                </div>
                {isLoading ? (
                    <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-gray-50 rounded-2xl h-16" />)}</div>
                ) : medications.length > 0 ? (
                    <div className="space-y-2">
                        {medications.slice(0, 5).map(med => (
                            <div key={med.id} className="flex items-center gap-4 p-3 rounded-2xl bg-cream/50 border border-border hover:border-primary-200 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                                    <Pill className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-primary-900 text-sm">{med.drug_name}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{med.dosage || "—"} · {med.frequency || "—"}</p>
                                </div>
                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase", med.status === "active" ? "bg-safe-50 text-safe-700" : "bg-gray-100 text-gray-500")}>{med.status}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <Pill className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground font-bold">No active medications</p>
                        <Link href="/medications" className="text-xs text-primary-600 font-black hover:underline">+ Add Medication</Link>
                    </div>
                )}
            </section>

            {/* ═══════════ COMPLIANCE RING + QUICK ACTIONS ═══════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Compliance Ring */}
                <section className="card p-6 bg-white flex flex-col items-center justify-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Weekly Compliance</h3>
                    <div className="relative w-36 h-36">
                        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                            <circle
                                cx="60" cy="60" r="52" fill="none"
                                stroke={complianceRate >= 80 ? "#22c55e" : complianceRate >= 50 ? "#f59e0b" : "#ef4444"}
                                strokeWidth="10"
                                strokeDasharray={`${complianceRate * 3.27} ${327 - complianceRate * 3.27}`}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-primary-900">{complianceRate}%</span>
                            <span className="text-[10px] text-muted-foreground font-bold">this week</span>
                        </div>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground mt-3 flex items-center gap-1">
                        {complianceRate >= 70 ? (
                            <><TrendingUp className="w-4 h-4 text-safe-500" /> You&apos;re doing great, Mama 🌿</>
                        ) : (
                            <><AlertTriangle className="w-4 h-4 text-secondary-500" /> Let&apos;s improve together 💪</>
                        )}
                    </p>
                </section>

                {/* Quick Action Grid */}
                <section className="grid grid-cols-2 gap-3">
                    <QuickAction href="/scan" icon={Scan} label="Scan Drug" color="bg-primary-500" emoji="💊" />
                    <QuickAction href="/pregnancy" icon={HeartPulse} label="Pregnancy Check" color="bg-secondary-500" emoji="🤰" />
                    <QuickAction href="/mama" icon={MessageCircle} label="Talk to Mama" color="bg-safe-500" emoji="🎙️" />
                    <QuickAction href="/prescriptions" icon={ClipboardList} label="Prescriptions" color="bg-purple-500" emoji="📋" />
                </section>
            </div>

            {/* ═══════════ UPCOMING REMINDERS ═══════════ */}
            <section className="card p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-primary-900 uppercase tracking-tight flex items-center gap-2">
                        <Bell className="w-5 h-5 text-secondary-500" /> Upcoming Reminders
                    </h2>
                    <Link href="/reminders" className="text-xs font-black text-primary-600 hover:underline flex items-center gap-1">
                        View All <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
                {isLoading ? (
                    <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-gray-50 rounded-2xl h-16" />)}</div>
                ) : reminders.length > 0 ? (
                    <div className="space-y-2">
                        {reminders.slice(0, 5).map(r => (
                            <div key={r.id} className="flex items-center gap-4 p-3 rounded-2xl bg-cream/50 border border-border">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                    r.delivery_status === "taken" ? "bg-safe-100 text-safe-600" : "bg-secondary-100 text-secondary-600"
                                )}>
                                    {r.delivery_status === "taken" ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-primary-900 text-sm">{r.drug_name || "Medicine"}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold">{r.dosage || "—"} · {timeUntil(r.reminder_datetime)}</p>
                                </div>
                                {r.delivery_status !== "taken" && (
                                    <div className="flex gap-1">
                                        <button onClick={() => handleSnooze(r.id)} className="p-2 rounded-xl hover:bg-secondary-50 text-secondary-600 transition-all" title="Snooze"><Timer className="w-4 h-4" /></button>
                                        <button onClick={() => handleMarkTaken(r.id)} className="p-2 rounded-xl bg-safe-50 hover:bg-safe-100 text-safe-600 transition-all" title="Take now"><CheckCircle className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground font-bold">No upcoming reminders</p>
                        <Link href="/medications" className="text-xs text-primary-600 font-black hover:underline">Add medications to create reminders</Link>
                    </div>
                )}
            </section>

            {/* ═══════════ RECENT ACTIVITY + DAILY TIP ═══════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recent Activity Feed */}
                <section className="card p-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Recent Activity
                        </h3>
                    </div>
                    {recentActivity.length > 0 ? (
                        <div className="space-y-3">
                            {recentActivity.map((a, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                                        <a.icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-primary-900 truncate">{a.action} {a.drug}</p>
                                        <p className="text-[10px] text-muted-foreground">{timeAgo(a.time)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic text-center py-4">No recent activity yet</p>
                    )}
                </section>

                {/* Daily Health Tip */}
                <section className="card p-6 bg-gradient-to-br from-secondary-50 to-cream border-2 border-secondary-100">
                    <div className="flex items-start gap-3 mb-3">
                        <span className="text-3xl">{todayTip.emoji}</span>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-secondary-800 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Mama&apos;s Daily Tip
                            </h3>
                            <p className="text-sm font-medium text-secondary-900 leading-relaxed mt-2">{todayTip.tip}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-secondary-200 text-xs font-bold text-secondary-700 hover:bg-secondary-50 transition-all">
                            <Volume2 className="w-3 h-3" /> Read Aloud
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-secondary-200 text-xs font-bold text-secondary-700 hover:bg-secondary-50 transition-all">
                            <Share2 className="w-3 h-3" /> Share
                        </button>
                    </div>
                </section>
            </div>

            {/* ═══════════ PREGNANCY TRACKER ═══════════ */}
            {profile?.isPregnant === "yes" && profile?.weekNumber && (
                <section className="card p-6 bg-gradient-to-br from-pink-50 to-secondary-50 border-2 border-pink-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shadow-md">
                            <Baby className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-pink-900 uppercase tracking-tight">Pregnancy Tracker</h3>
                            <p className="text-xs text-pink-600 font-bold">Week {profile.weekNumber} of 40</p>
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-4 bg-white/60 rounded-full overflow-hidden mb-4 border border-pink-100">
                        <div className="h-full bg-gradient-to-r from-pink-400 to-secondary-400 rounded-full transition-all" style={{ width: `${(profile.weekNumber / 40) * 100}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/60 rounded-2xl text-center">
                            <span className="text-4xl">{babySize?.emoji || "👶"}</span>
                            <p className="text-xs font-black text-pink-800 mt-1">Baby is the size of a {babySize?.name || "blessing"}</p>
                        </div>
                        <div className="p-4 bg-white/60 rounded-2xl text-center">
                            <p className="text-3xl font-black text-pink-800">{40 - profile.weekNumber}</p>
                            <p className="text-xs font-bold text-pink-600">weeks to go</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Trimester: {profile.trimester || "—"}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════ FOOTER LINKS ═══════════ */}
            <section className="flex flex-wrap justify-center gap-3 pt-4">
                <Link href="/drugs" className="text-xs font-bold text-muted-foreground hover:text-primary-600 transition-colors flex items-center gap-1">
                    🔍 Search Drugs
                </Link>
                <span className="text-gray-200">|</span>
                <Link href="/profile" className="text-xs font-bold text-muted-foreground hover:text-primary-600 transition-colors flex items-center gap-1">
                    ⚙️ Settings
                </Link>
                <span className="text-gray-200">|</span>
                <Link href="/mama" className="text-xs font-bold text-muted-foreground hover:text-primary-600 transition-colors flex items-center gap-1">
                    🎙️ Ask Mama
                </Link>
            </section>
        </div>
    );
}

/* ─── Sub Components ─── */

function QuickStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
    return (
        <div className="card p-4 bg-white flex items-center gap-3 hover:shadow-glow transition-all">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-2xl font-black text-primary-900 leading-none">{value}</p>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wide">{label}</p>
            </div>
        </div>
    );
}

function QuickAction({ href, icon: Icon, label, color, emoji }: { href: string; icon: React.ElementType; label: string; color: string; emoji: string }) {
    return (
        <Link href={href} className="card p-5 bg-white flex flex-col items-center justify-center text-center gap-3 hover:shadow-glow hover:border-primary-300 transition-all active:scale-95 group">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform", color)}>
                <Icon className="w-7 h-7" />
            </div>
            <div>
                <span className="text-lg">{emoji}</span>
                <p className="text-xs font-black text-primary-900 uppercase mt-1">{label}</p>
            </div>
        </Link>
    );
}
