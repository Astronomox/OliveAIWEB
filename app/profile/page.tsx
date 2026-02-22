// app/profile/page.tsx — SETTINGS-RICH Profile page
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Mail, Phone, Shield, Bell, LogOut, Trash2,
    CheckCircle, Edit, Save, X, Calendar, Activity, Pill, FileText,
    Globe, Volume2, Eye, Smartphone, Heart, ChevronRight,
    Download, MessageSquare, AlertTriangle, Settings, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useToast, usePregnancy } from "@/hooks";
import { usersApi, medicationsApi } from "@/services/api";
import { Spinner } from "@/components/ui/Spinner";
import { ToastContainer } from "@/components/ui/ToastContainer";
import type { UserUpdate } from "@/types/api";

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading, logout, refresh } = useAuth();
    const { toasts, addToast, removeToast } = useToast();
    const { profile: pregnancyProfile } = usePregnancy();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState<UserUpdate>({});
    const [medsCount, setMedsCount] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteText, setDeleteText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) { router.push("/login"); return; }
        if (user) {
            setForm({
                name: user.name || "",
                email: user.email || "",
                age: user.age,
                gender: user.gender || "",
                language_preference: user.language_preference || "en",
                reminders_enabled: user.reminders_enabled,
                email_reminders_enabled: user.email_reminders_enabled,
            });
            fetchStats();
        }
    }, [user, authLoading, isAuthenticated]);

    const fetchStats = async () => {
        if (!user) return;
        const res = await medicationsApi.getAll(user.id);
        if (res.data) setMedsCount(res.data.length);
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        const res = await usersApi.updateUser(user.id, form);
        if (res.data) {
            addToast("Profile updated! ✅", "success");
            refresh();
            setIsEditing(false);
        } else addToast(res.error?.message || "Failed to save", "error");
        setIsSaving(false);
    };

    const handleVerifyEmail = async () => {
        if (!user) return;
        const res = await usersApi.verifyEmail(user.id);
        if (res.data) addToast("Verification email sent! Check your inbox 📧", "success");
        else addToast(res.error?.message || "Failed", "error");
    };

    const handleDeleteAccount = async () => {
        if (!user || deleteText !== "DELETE") return;
        setIsDeleting(true);
        const res = await usersApi.deleteUser(user.id);
        if (res.data) {
            addToast("Account deleted. We're sad to see you go. 😢", "info");
            logout();
        } else addToast(res.error?.message || "Failed", "error");
        setIsDeleting(false);
    };

    const daysSinceJoined = user ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000) : 0;

    if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={40} /></div>;

    return (
        <div className="space-y-6 animate-fade-in pb-12 max-w-3xl mx-auto">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* ═══════════ PROFILE HEADER ═══════════ */}
            <section className="card p-6 bg-gradient-to-br from-primary-500 to-primary-700 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
                <div className="relative z-10 flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-black shadow-xl border-4 border-white/30">
                        {user?.name?.charAt(0).toUpperCase() || "M"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-black tracking-tight">{user?.name || "User"}</h1>
                        <p className="text-sm text-white/70 font-bold flex items-center gap-1"><Phone className="w-3 h-3" /> {user?.phone_number}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {user?.email_verified ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-safe-500/20 text-safe-200 border border-safe-400/30">✅ Verified</span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-yellow-500/20 text-yellow-200 border border-yellow-400/30">⚠️ Unverified</span>
                            )}
                            <span className="text-[10px] text-white/50 flex items-center gap-1"><Calendar className="w-3 h-3" /> Member since {new Date(user?.created_at || "").toLocaleDateString()}</span>
                        </div>
                    </div>
                    <button onClick={() => setIsEditing(!isEditing)} className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all shrink-0">
                        <Edit className="w-5 h-5" />
                    </button>
                </div>
            </section>

            {/* ═══════════ STATS SUMMARY ═══════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat icon={Pill} label="Medications" value={medsCount} />
                <MiniStat icon={Calendar} label="Days Active" value={daysSinceJoined} />
                <MiniStat icon={Activity} label="Compliance" value="—" />
                <MiniStat icon={Heart} label="Trimester" value={pregnancyProfile?.trimester || "—"} />
            </div>

            {/* ═══════════ PERSONAL INFO ═══════════ */}
            <section className="card p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4" /> Personal Information
                    </h3>
                    {isEditing && (
                        <button onClick={handleSave} disabled={isSaving} className="btn-primary rounded-xl text-xs flex items-center gap-1">
                            {isSaving ? <Spinner size={14} color="white" /> : <Save className="w-3.5 h-3.5" />}
                            {isSaving ? "Saving…" : "Save Changes"}
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProfileField label="Full Name" icon={User} value={form.name || ""} editable={isEditing}
                        onChange={v => setForm({ ...form, name: v })} helper="Your name as shown throughout the app" />
                    <ProfileField label="Email" icon={Mail} value={form.email || ""} editable={isEditing}
                        onChange={v => setForm({ ...form, email: v })} helper="Used for email reminders and account recovery"
                        action={!user?.email_verified && user?.email ? { label: "Verify", onClick: handleVerifyEmail } : undefined} />
                    <ProfileField label="Age" icon={Calendar} value={form.age?.toString() || ""} editable={isEditing}
                        onChange={v => setForm({ ...form, age: v ? parseInt(v) : undefined })} helper="Helps personalize health recommendations" type="number" />
                    <ProfileField label="Gender" icon={User} value={form.gender || ""} editable={isEditing}
                        onChange={v => setForm({ ...form, gender: v })} helper="Optional — used for health insights"
                        options={["", "female", "male", "other"]} />
                </div>
            </section>

            {/* ═══════════ NOTIFICATION SETTINGS ═══════════ */}
            <section className="card p-6 bg-white">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                    <Bell className="w-4 h-4" /> Notification Settings
                </h3>
                <div className="space-y-4">
                    <ToggleRow icon={Smartphone} label="WhatsApp Reminders" description="Receive medication reminders via WhatsApp"
                        checked={form.reminders_enabled ?? false} onChange={v => { setForm({ ...form, reminders_enabled: v }); if (user) usersApi.updateUser(user.id, { reminders_enabled: v }).then(r => { if (r.data) { addToast(v ? "WhatsApp reminders enabled ✅" : "Reminders disabled", "info"); refresh(); } }); }} />
                    <ToggleRow icon={Mail} label="Email Reminders" description="Also get reminders by email (requires verified email)"
                        checked={form.email_reminders_enabled ?? false} onChange={v => { setForm({ ...form, email_reminders_enabled: v }); if (user) usersApi.updateUser(user.id, { email_reminders_enabled: v }).then(r => { if (r.data) { addToast(v ? "Email reminders enabled ✅" : "Email reminders disabled", "info"); refresh(); } }); }} />
                </div>
            </section>

            {/* ═══════════ ACCESSIBILITY ═══════════ */}
            <section className="card p-6 bg-white">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                    <Eye className="w-4 h-4" /> Accessibility &amp; Language
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black text-primary-900 uppercase mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Language Preference</label>
                        <select className="input w-full max-w-xs" value={form.language_preference || "en"}
                            onChange={e => { setForm({ ...form, language_preference: e.target.value }); if (user) usersApi.updateUser(user.id, { language_preference: e.target.value }).then(r => { if (r.data) addToast("Language updated", "success"); }); }}>
                            <option value="en">🇬🇧 English</option>
                            <option value="pid">🇳🇬 Nigerian Pidgin</option>
                            <option value="yo">🇳🇬 Yorùbá</option>
                            <option value="ig">🇳🇬 Igbo</option>
                            <option value="ha">🇳🇬 Hausa</option>
                        </select>
                        <p className="text-[10px] text-muted-foreground mt-1">Olive will speak to you in this language</p>
                    </div>

                    <ToggleRow icon={Volume2} label="Auto-Read Results" description="Automatically read drug safety results aloud"
                        checked={false} onChange={() => addToast("Coming soon!", "info")} />
                </div>
            </section>

            {/* ═══════════ DATA MANAGEMENT ═══════════ */}
            <section className="card p-6 bg-white">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                    <Settings className="w-4 h-4" /> Data Management
                </h3>
                <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 transition-all text-left group"
                        onClick={() => addToast("Export coming soon!", "info")}>
                        <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Download className="w-4 h-4" /></div>
                        <div className="flex-1"><p className="text-sm font-bold text-primary-900">Export Health Data</p><p className="text-[10px] text-muted-foreground">Download all your data as JSON</p></div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 transition-all text-left group"
                        onClick={() => addToast("History cleared!", "info")}>
                        <div className="w-8 h-8 rounded-lg bg-secondary-100 text-secondary-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><MessageSquare className="w-4 h-4" /></div>
                        <div className="flex-1"><p className="text-sm font-bold text-primary-900">Clear Chat History</p><p className="text-[10px] text-muted-foreground">Remove all Olive AI conversations</p></div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            </section>

            {/* ═══════════ LOGOUT ═══════════ */}
            <button onClick={logout} className="w-full card p-4 bg-white flex items-center justify-center gap-2 text-danger-600 font-black uppercase text-sm hover:bg-danger-50 transition-all">
                <LogOut className="w-5 h-5" /> Log Out
            </button>

            {/* ═══════════ DANGER ZONE ═══════════ */}
            <section className="card p-6 bg-white border-2 border-danger-200">
                <h3 className="text-sm font-black uppercase tracking-widest text-danger-600 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Danger Zone
                </h3>
                <p className="text-xs text-muted-foreground mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 rounded-xl border-2 border-danger-300 text-danger-600 text-xs font-black hover:bg-danger-50 transition-all">
                        Delete My Account
                    </button>
                ) : (
                    <div className="space-y-3 p-4 bg-danger-50 rounded-2xl border border-danger-100">
                        <p className="text-xs font-bold text-danger-800">Type <strong>DELETE</strong> to confirm:</p>
                        <input type="text" value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="Type DELETE" className="input w-full max-w-xs border-danger-200" />
                        <div className="flex gap-2">
                            <button onClick={handleDeleteAccount} disabled={deleteText !== "DELETE" || isDeleting}
                                className={cn("px-4 py-2 rounded-xl text-xs font-black text-white transition-all", deleteText === "DELETE" ? "bg-danger-500 hover:bg-danger-600" : "bg-gray-300 cursor-not-allowed")}>
                                {isDeleting ? <Spinner size={16} color="white" /> : "Permanently Delete"}
                            </button>
                            <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); }} className="btn-ghost text-xs">Cancel</button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

function ProfileField({ label, icon: Icon, value, editable, onChange, helper, type = "text", action, options }: {
    label: string; icon: React.ElementType; value: string; editable: boolean; onChange: (v: string) => void; helper?: string; type?: string;
    action?: { label: string; onClick: () => void }; options?: string[];
}) {
    return (
        <div>
            <label className="text-xs font-black text-primary-900 uppercase mb-1 flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</label>
            {editable ? (
                options ? (
                    <select className="input w-full" value={value} onChange={e => onChange(e.target.value)}>
                        {options.map(o => <option key={o} value={o}>{o || "Select…"}</option>)}
                    </select>
                ) : (
                    <input type={type} className="input w-full" value={value} onChange={e => onChange(e.target.value)} />
                )
            ) : (
                <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-primary-900">{value || "—"}</p>
                    {action && <button onClick={action.onClick} className="text-[10px] font-black text-primary-600 hover:underline">{action.label}</button>}
                </div>
            )}
            {helper && <p className="text-[10px] text-muted-foreground mt-0.5">{helper}</p>}
        </div>
    );
}

function ToggleRow({ icon: Icon, label, description, checked, onChange }: {
    icon: React.ElementType; label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-cream/50 border border-border">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary-900">{label}</p>
                <p className="text-[10px] text-muted-foreground">{description}</p>
            </div>
            <button onClick={() => onChange(!checked)} className={cn(
                "w-12 h-7 rounded-full relative transition-all shrink-0",
                checked ? "bg-safe-500" : "bg-gray-200"
            )}>
                <div className={cn("absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all", checked ? "left-[22px]" : "left-0.5")} />
            </button>
        </div>
    );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) {
    return (
        <div className="card p-3 bg-white flex items-center gap-2 hover:shadow-glow transition-all">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></div>
            <div>
                <p className="text-lg font-black text-primary-900 leading-none">{value}</p>
                <p className="text-[9px] font-black uppercase text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}
