// app/login/page.tsx — Login page wired to live Medi-Sync backend
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Leaf, Mail, Lock, ArrowRight, AlertCircle,
    Eye, EyeOff, CheckCircle
} from "lucide-react";
import { usersApi } from "@/services/api";
import { cn } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";
import { Spinner } from "@/components/ui/Spinner";
import type { LoginRequest } from "@/types/api";

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <Spinner size={32} />
            </div>
        }>
            <LoginPageInner />
        </Suspense>
    );
}

function LoginPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [shakeForm, setShakeForm] = useState(false);

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    // Check if already logged in — show skeleton, never flash form
    useEffect(() => {
        if (isAuthenticated()) {
            router.replace("/dashboard");
        } else {
            setCheckingAuth(false);
        }

        // Show reason-based messages
        const reason = searchParams.get("reason");
        if (reason === "session_expired") {
            setError("Your session expired — please log in again");
        } else if (reason === "unauthorized") {
            setError("You need to log in to access that page");
        }
    }, [router, searchParams]);

    const setField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        }
        if (error) setError(null);
    };

    const triggerShake = () => {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 600);
    };

    // ── Client-side validation ──────────────────────────────────
    const validate = (): boolean => {
        const errors: Record<string, string> = {};
        if (!form.email.trim()) errors.email = "Email or phone is required";
        if (!form.password) errors.password = "Password is required";
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            triggerShake();
            return false;
        }
        return true;
    };

    // ── Form submission ─────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        setError(null);

        const creds: LoginRequest = {
            email: form.email.trim(),
            password: form.password,
        };

        const res = await usersApi.login(creds);

        if (res.data) {
            router.push("/dashboard");
        } else {
            if (res.status === 401) {
                setError("Incorrect email or password");
                // Only clear password on 401, keep email
                setForm(prev => ({ ...prev, password: "" }));
            } else if (res.error?.fieldErrors) {
                setFieldErrors(res.error.fieldErrors);
                setError(res.error.message);
            } else if (res.status === 0) {
                setError("Unable to reach server — check your connection");
            } else {
                setError(res.error?.message || "Login failed — please try again");
            }
            triggerShake();
        }

        setIsLoading(false);
    };

    const isFormValid = form.email.trim() && form.password;

    // Loading skeleton while checking auth
    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <div className="w-full max-w-md space-y-6 p-8">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-2xl" />
                        <div className="h-8 bg-gray-200 rounded-xl w-40" />
                        <div className="h-4 bg-gray-200 rounded w-56" />
                    </div>
                    <div className="space-y-3">
                        <div className="animate-pulse h-14 bg-gray-100 rounded-2xl" />
                        <div className="animate-pulse h-14 bg-gray-100 rounded-2xl" />
                        <div className="animate-pulse h-14 bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background Blobs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-white/50 p-8 relative z-10",
                    shakeForm && "animate-[shake_0.5s_ease-in-out]"
                )}
            >
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-glow mb-4 transform -rotate-6">
                        <Leaf className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-primary-950 tracking-tight">Welcome Back</h1>
                    <p className="text-muted-foreground font-medium text-center mt-2 px-4">
                        Your AI health guardian awaits.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {/* Email / Phone */}
                    <div>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="email"
                                id="login-email"
                                placeholder="Email Address"
                                autoComplete="email"
                                className={cn("input pl-12 w-full", fieldErrors.email && "border-danger-500 ring-2 ring-danger-100")}
                                value={form.email}
                                onChange={e => setField("email", e.target.value)}
                            />
                        </div>
                        {fieldErrors.email && <p className="text-xs font-bold text-danger-500 mt-1 px-2">{fieldErrors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type={showPassword ? "text" : "password"}
                                id="login-password"
                                placeholder="Password"
                                autoComplete="current-password"
                                className={cn("input pl-12 pr-12 w-full", fieldErrors.password && "border-danger-500 ring-2 ring-danger-100")}
                                value={form.password}
                                onChange={e => setField("password", e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {fieldErrors.password && <p className="text-xs font-bold text-danger-500 mt-1 px-2">{fieldErrors.password}</p>}
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <button type="button" onClick={() => setRememberMe(!rememberMe)}
                                className={cn("w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                                    rememberMe ? "bg-primary-600 border-primary-600" : "border-gray-300")}>
                                {rememberMe && <CheckCircle className="w-3 h-3 text-white" />}
                            </button>
                            <span className="text-xs font-bold text-muted-foreground">Remember me</span>
                        </label>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-2xl bg-danger-50 border border-danger-100 flex items-center gap-3 text-danger-700 text-sm font-bold"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        id="login-submit-btn"
                        disabled={isLoading || !isFormValid}
                        className={cn(
                            "btn-primary w-full py-4 text-lg rounded-2xl group transition-all",
                            (!isFormValid && !isLoading) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                Login Now
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link href="/signup" className="text-sm font-bold text-primary-600 hover:underline">
                        Don&apos;t have an account? Sign Up
                    </Link>
                </div>

                <p className="mt-8 text-[10px] text-center text-muted-foreground font-black uppercase tracking-widest">
                    Safe • Secure • Neural-Powered
                </p>
            </motion.div>

            <Link href="/" className="absolute bottom-8 text-sm font-black text-primary-900/40 hover:text-primary-900 transition-colors uppercase tracking-widest z-10">
                Return to Home
            </Link>
        </div>
    );
}
