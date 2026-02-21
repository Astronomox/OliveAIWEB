// app/signup/page.tsx — Registration page wired to live Medi-Sync backend
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Leaf, Mail, Lock, ArrowRight, AlertCircle,
    Phone, User, Eye, EyeOff, CheckCircle, ShieldCheck, Heart, Loader2
} from "lucide-react";
import { usersApi } from "@/services/api";
import { cn } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";
import { Spinner } from "@/components/ui/Spinner";
import type { UserCreate } from "@/types/api";

const PHONE_REGEX = /^(0[7-9][01]\d{8}|\+234[7-9][01]\d{8})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [shakeForm, setShakeForm] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone_number: "",
        password: "",
        confirm_password: "",
    });

    // Check if already authenticated — never flash form if logged in
    useEffect(() => {
        if (isAuthenticated()) {
            router.replace("/dashboard");
        } else {
            setCheckingAuth(false);
        }
    }, [router]);

    const setField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        // Clear field error on change
        if (fieldErrors[field]) {
            setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        }
    };

    // ── Client-side validation ──────────────────────────────────
    const validate = (): boolean => {
        const errors: Record<string, string> = {};

        if (!form.name.trim()) errors.name = "Full name is required";
        if (!form.email.trim()) errors.email = "Email address is required";
        else if (!EMAIL_REGEX.test(form.email)) errors.email = "Please enter a valid email address";

        if (!form.phone_number.trim()) errors.phone_number = "Phone number is required";
        else if (!PHONE_REGEX.test(form.phone_number.replace(/\s/g, "")))
            errors.phone_number = "Enter a valid Nigerian number (e.g. 08012345678)";

        if (!form.password) errors.password = "Password is required";
        else if (form.password.length < 8) errors.password = "Password must be at least 8 characters";

        if (!form.confirm_password) errors.confirm_password = "Please confirm your password";
        else if (form.confirm_password !== form.password) errors.confirm_password = "Passwords do not match";

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            triggerShake();
            return false;
        }
        return true;
    };

    const triggerShake = () => {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 600);
    };

    // ── Form submission ─────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        setError(null);

        const body: UserCreate = {
            phone_number: form.phone_number.replace(/\s/g, ""),
            email: form.email.trim(),
            name: form.name.trim(),
            password: form.password,
        };

        const res = await usersApi.register(body);

        if (res.data) {
            const userId = res.data.user.id;
            // Fire verify-email immediately — non-blocking but surface errors
            usersApi.verifyEmail(userId).then(emailRes => {
                if (!emailRes.data) {
                    // Will be visible as a toast on the verify-email page if needed
                    console.warn("[Signup] verifyEmail failed:", emailRes.error?.message);
                }
            });
            // Redirect to email OTP screen
            router.push("/verify-email");
        } else {
            // Handle specific error codes
            if (res.status === 409) {
                setError("An account with this email or phone already exists");
            } else if (res.error?.fieldErrors) {
                setFieldErrors(res.error.fieldErrors);
                setError(res.error.message);
            } else if (res.status === 0) {
                setError("Unable to reach server — please check your connection");
            } else {
                setError(res.error?.message || "Registration failed — please try again");
            }
            triggerShake();
        }

        setIsLoading(false);
    };

    const isFormValid = form.name.trim() && form.email.trim() && form.phone_number.trim()
        && form.password.length >= 8 && form.confirm_password === form.password;

    // Loading skeleton while checking auth
    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <div className="w-full max-w-md space-y-6 p-8">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-2xl" />
                        <div className="h-8 bg-gray-200 rounded-xl w-48" />
                        <div className="h-4 bg-gray-200 rounded w-64" />
                    </div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-2xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-safe-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-white/50 p-8 relative z-10",
                    shakeForm && "animate-[shake_0.5s_ease-in-out]"
                )}
            >
                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-glow mb-4 transform -rotate-6">
                        <Leaf className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-primary-950 tracking-tight">Create Account</h1>
                    <p className="text-muted-foreground font-medium text-center mt-2 px-4">
                        Join Safely-Mama — your AI health guardian for safe motherhood
                    </p>
                </div>

                {/* Benefits strip */}
                <div className="flex justify-center gap-4 mb-6 text-[10px] font-bold text-muted-foreground">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-safe-500" /> Drug Safety</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-danger-500" /> Pregnancy Care</span>
                    <span className="flex items-center gap-1"><Leaf className="w-3 h-3 text-primary-500" /> Mama AI</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                    {/* Full Name */}
                    <div>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                id="signup-name"
                                placeholder="Full Name"
                                autoComplete="name"
                                className={cn("input pl-12 w-full", fieldErrors.name && "border-danger-500 ring-2 ring-danger-100")}
                                value={form.name}
                                onChange={e => setField("name", e.target.value)}
                            />
                        </div>
                        {fieldErrors.name && <p className="text-xs font-bold text-danger-500 mt-1 px-2">{fieldErrors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="email"
                                id="signup-email"
                                placeholder="Email Address"
                                autoComplete="email"
                                className={cn("input pl-12 w-full", fieldErrors.email && "border-danger-500 ring-2 ring-danger-100")}
                                value={form.email}
                                onChange={e => setField("email", e.target.value)}
                            />
                        </div>
                        {fieldErrors.email && <p className="text-xs font-bold text-danger-500 mt-1 px-2">{fieldErrors.email}</p>}
                    </div>

                    {/* Phone Number */}
                    <div>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="tel"
                                id="signup-phone"
                                placeholder="Phone Number (e.g. 08012345678)"
                                autoComplete="tel"
                                className={cn("input pl-12 w-full", fieldErrors.phone_number && "border-danger-500 ring-2 ring-danger-100")}
                                value={form.phone_number}
                                onChange={e => setField("phone_number", e.target.value)}
                            />
                        </div>
                        {fieldErrors.phone_number && <p className="text-xs font-bold text-danger-500 mt-1 px-2">{fieldErrors.phone_number}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type={showPassword ? "text" : "password"}
                                id="signup-password"
                                placeholder="Password (min 8 characters)"
                                autoComplete="new-password"
                                className={cn("input pl-12 pr-12 w-full", fieldErrors.password && "border-danger-500 ring-2 ring-danger-100")}
                                value={form.password}
                                onChange={e => setField("password", e.target.value)}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary-600 transition-colors">
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {fieldErrors.password && <p className="text-xs font-bold text-danger-500 mt-1 px-2">{fieldErrors.password}</p>}
                        {/* Strength indicator */}
                        {form.password && (
                            <div className="flex gap-1 mt-1.5 px-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className={cn("h-1 flex-1 rounded-full transition-all",
                                        form.password.length >= i * 3 ? (form.password.length >= 12 ? "bg-safe-400" : form.password.length >= 8 ? "bg-secondary-400" : "bg-danger-300") : "bg-gray-100"
                                    )} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type={showConfirm ? "text" : "password"}
                                id="signup-confirm-password"
                                placeholder="Confirm Password"
                                autoComplete="new-password"
                                className={cn("input pl-12 pr-12 w-full", fieldErrors.confirm_password && "border-danger-500 ring-2 ring-danger-100")}
                                value={form.confirm_password}
                                onChange={e => setField("confirm_password", e.target.value)}
                            />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary-600 transition-colors">
                                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                            {form.confirm_password && form.confirm_password === form.password && (
                                <CheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 text-safe-500" />
                            )}
                        </div>
                        {fieldErrors.confirm_password && <p className="text-xs font-bold text-danger-500 mt-1 px-2">{fieldErrors.confirm_password}</p>}
                    </div>

                    {/* Global Error */}
                    {error && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-2xl bg-danger-50 border border-danger-100 flex items-start gap-3 text-danger-700 text-sm font-bold">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                {error}
                                {error.includes("already exists") && (
                                    <Link href="/login" className="block mt-1 text-primary-600 font-black hover:underline">
                                        Login instead →
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        id="signup-submit-btn"
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
                                Create Account
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/login" className="text-sm font-bold text-primary-600 hover:underline">
                        Already have an account? Login
                    </Link>
                </div>

                <p className="mt-6 text-[10px] text-center text-muted-foreground font-black uppercase tracking-widest">
                    Safe • Secure • Neural-Powered
                </p>
            </motion.div>

            <Link href="/" className="absolute bottom-8 text-sm font-black text-primary-900/40 hover:text-primary-900 transition-colors uppercase tracking-widest z-10">
                Return to Home
            </Link>
        </div>
    );
}
