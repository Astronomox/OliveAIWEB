"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Leaf, Mail, Lock, ArrowRight, AlertCircle,
    Eye, EyeOff, CheckCircle, Loader2, Phone, User, ShieldCheck, Heart
} from "lucide-react";
import { usersApi } from "@/services/api";
import { cn } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";
import { Spinner } from "@/components/ui/Spinner";
import type { LoginRequest, UserCreate } from "@/types/api";

const PHONE_REGEX = /^(0[7-9][01]\d{8}|\+234[7-9][01]\d{8})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <Spinner size={32} />
            </div>
        }>
            <AuthPageInner />
        </Suspense>
    );
}

function AuthPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

    const [isLogin, setIsLogin] = useState(initialMode === "login");
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone_number: "",
        password: "",
        confirm_password: "",
    });

    useEffect(() => {
        // Small delay to prevent race conditions and loops
        const checkAuthDelayed = setTimeout(() => {
            if (!hasCheckedAuth) {
                if (isAuthenticated()) {
                    router.replace("/dashboard");
                    return;
                } else {
                    setCheckingAuth(false);
                }
                setHasCheckedAuth(true);
            }
        }, 100); // 100ms delay

        // Handle URL search params immediately
        const reason = searchParams.get("reason");
        if (reason === "session_expired") {
            setError("Your session expired — please log in again");
        } else if (reason === "unauthorized") {
            setError("You need to log in to access that page");
        }

        return () => clearTimeout(checkAuthDelayed);
    }, [hasCheckedAuth, router, searchParams]);

    const setField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        }
        if (error) setError(null);
    };

    const validateLogin = (): boolean => {
        const errors: Record<string, string> = {};
        if (!form.email.trim()) errors.email = "Email is required";
        if (!form.password) errors.password = "Password is required";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateSignup = (): boolean => {
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
        return Object.keys(errors).length === 0;
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateLogin()) return;

        setIsLoading(true);
        setError(null);

        const creds: LoginRequest = {
            email: form.email.trim(),
            password: form.password,
        };

        try {
            const res = await usersApi.login(creds);
            if (res.error) {
                setError(res.error.message || "Invalid email or password");
            } else {
                // Small delay to ensure cookie is set before navigation
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 100);
            }
        } catch (err: any) {
            setError(err.message || "Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateSignup()) return;

        setIsLoading(true);
        setError(null);

        const body: UserCreate = {
            phone_number: form.phone_number.replace(/\s/g, ""),
            email: form.email.trim(),
            name: form.name.trim(),
            password: form.password,
        };

        try {
            const res = await usersApi.register(body);
            if (res.error) {
                setError(res.error.message || "Registration failed. Please try again.");
            } else {
                router.push("/verify-email");
            }
        } catch (err: any) {
            setError(err.message || "Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null);
        setFieldErrors({});
        setForm({ name: "", email: "", phone_number: "", password: "", confirm_password: "" });
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <Spinner size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4 font-body">
            <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex min-h-[700px] relative">
                
                {/* Diagonal Separator */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    <svg 
                        viewBox="0 0 100 100" 
                        className="w-full h-full"
                        preserveAspectRatio="none"
                    >
                        <polygon 
                            fill="rgba(10, 107, 75, 0.1)" 
                            points={isLogin ? "0,0 60,0 40,100 0,100" : "40,0 100,0 100,100 60,100"}
                            style={{ transition: "all 0.5s ease" }}
                        />
                    </svg>
                </div>

                {/* Left Panel - Welcome/Info */}
                <motion.div 
                    className={cn(
                        "w-full md:w-[60%] bg-primary-600 text-white flex flex-col justify-center p-8 md:p-12 relative overflow-hidden",
                        "hidden md:flex"
                    )}
                    style={{ 
                        clipPath: isLogin ? "polygon(0 0, 100% 0, 80% 100%, 0 100%)" : "polygon(0 0, 80% 0, 100% 100%, 0 100%)"
                    }}
                    animate={{ 
                        clipPath: isLogin ? "polygon(0 0, 100% 0, 80% 100%, 0 100%)" : "polygon(0 0, 80% 0, 100% 100%, 0 100%)"
                    }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 opacity-90" />
                    <div className="relative z-10 max-w-md">
                        <div className="flex items-center gap-3 mb-8">
                            <img src="/assets/logo.png" alt="Olive AI Logo" className="w-12 h-12 object-contain brightness-0 invert" />
                            <span className="text-2xl font-bold">Olive AI</span>
                        </div>
                        
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? "login-welcome" : "signup-welcome"}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {isLogin ? (
                                    <>
                                        <h2 className="text-3xl font-bold mb-4">Welcome Back, Mama!</h2>
                                        <p className="text-primary-100 mb-8 text-lg leading-relaxed">
                                            Continue your safe motherhood journey. Your health data and AI companion are waiting for you.
                                        </p>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                                <ShieldCheck className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">100% Secure</p>
                                                <p className="text-primary-200 text-sm">Your data is encrypted and protected</p>
                                            </div>
                                        </div>
                                        <p className="text-primary-200 text-sm">
                                            New to Olive AI? 
                                            <button onClick={toggleMode} className="text-white font-semibold ml-1 underline">Create an account</button>
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
                                        <p className="text-primary-100 mb-8 text-lg leading-relaxed">
                                            Join thousands of Nigerian mothers who trust Olive AI for safe pregnancy guidance and medication safety.
                                        </p>
                                        <div className="space-y-4 mb-8">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5" />
                                                <span>AI-powered medication safety checks</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5" />
                                                <span>24/7 maternal health guidance</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5" />
                                                <span>NAFDAC verified drug database</span>
                                            </div>
                                        </div>
                                        <p className="text-primary-200 text-sm">
                                            Already have an account? 
                                            <button onClick={toggleMode} className="text-white font-semibold ml-1 underline">Sign in</button>
                                        </p>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Right Panel - Form */}
                <div className={cn(
                    "w-full md:w-[40%] p-6 md:p-10 flex flex-col justify-center relative z-20",
                    "bg-white"
                )}>
                    <div className="w-full max-w-sm mx-auto">
                        <div className="md:hidden text-center mb-6">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <img src="/assets/logo.png" alt="Olive AI Logo" className="w-10 h-10 object-contain" />
                                <span className="text-xl font-bold text-primary-950">Olive AI</span>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {isLogin ? (
                                <motion.div
                                    key="login-form"
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h3 className="text-2xl font-bold text-primary-950 mb-2">Sign In</h3>
                                    <p className="text-primary-900/60 mb-6">Welcome back to your health journey</p>

                                    {error && (
                                        <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2 text-danger-700">
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    )}

                                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-primary-900 mb-1.5">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-900/40" />
                                                <input
                                                    type="email"
                                                    value={form.email}
                                                    onChange={e => setField("email", e.target.value)}
                                                    className={cn(
                                                        "w-full pl-10 pr-4 py-3 bg-cream border rounded-lg text-primary-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm",
                                                        fieldErrors.email ? "border-danger-500" : "border-border"
                                                    )}
                                                    placeholder="you@example.com"
                                                />
                                            </div>
                                            {fieldErrors.email && <p className="text-xs text-danger-500 mt-1">{fieldErrors.email}</p>}
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="block text-sm font-medium text-primary-900">Password</label>
                                                <Link href="/forgot-password" className="text-xs text-primary-600 hover:underline">Forgot?</Link>
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-900/40" />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={form.password}
                                                    onChange={e => setField("password", e.target.value)}
                                                    className={cn(
                                                        "w-full pl-10 pr-10 py-3 bg-cream border rounded-lg text-primary-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm",
                                                        fieldErrors.password ? "border-danger-500" : "border-border"
                                                    )}
                                                    placeholder="••••••••"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowPassword(!showPassword)} 
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-900/40 hover:text-primary-600"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            {fieldErrors.password && <p className="text-xs text-danger-500 mt-1">{fieldErrors.password}</p>}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                                        </button>
                                    </form>

                                    <div className="mt-6 md:hidden text-center">
                                        <p className="text-sm text-primary-900/60">
                                            Don't have an account? 
                                            <button onClick={toggleMode} className="text-primary-600 font-semibold ml-1">Create one</button>
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="signup-form"
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h3 className="text-2xl font-bold text-primary-950 mb-2">Create Account</h3>
                                    <p className="text-primary-900/60 mb-6">Start your safe motherhood journey</p>

                                    {error && (
                                        <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2 text-danger-700">
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    )}

                                    <form onSubmit={handleSignupSubmit} className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-primary-900 mb-1">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-900/40" />
                                                <input
                                                    type="text"
                                                    value={form.name}
                                                    onChange={e => setField("name", e.target.value)}
                                                    className={cn(
                                                        "w-full pl-10 pr-4 py-2.5 bg-cream border rounded-lg text-primary-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm",
                                                        fieldErrors.name ? "border-danger-500" : "border-border"
                                                    )}
                                                    placeholder="e.g. Ngozi Adebayo"
                                                />
                                            </div>
                                            {fieldErrors.name && <p className="text-xs text-danger-500 mt-1">{fieldErrors.name}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-primary-900 mb-1">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-900/40" />
                                                <input
                                                    type="email"
                                                    value={form.email}
                                                    onChange={e => setField("email", e.target.value)}
                                                    className={cn(
                                                        "w-full pl-10 pr-4 py-2.5 bg-cream border rounded-lg text-primary-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm",
                                                        fieldErrors.email ? "border-danger-500" : "border-border"
                                                    )}
                                                    placeholder="you@example.com"
                                                />
                                            </div>
                                            {fieldErrors.email && <p className="text-xs text-danger-500 mt-1">{fieldErrors.email}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-primary-900 mb-1">Phone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-900/40" />
                                                <input
                                                    type="tel"
                                                    value={form.phone_number}
                                                    onChange={e => setField("phone_number", e.target.value)}
                                                    className={cn(
                                                        "w-full pl-10 pr-4 py-2.5 bg-cream border rounded-lg text-primary-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm",
                                                        fieldErrors.phone_number ? "border-danger-500" : "border-border"
                                                    )}
                                                    placeholder="0801 234 5678"
                                                />
                                            </div>
                                            {fieldErrors.phone_number && <p className="text-xs text-danger-500 mt-1">{fieldErrors.phone_number}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-primary-900 mb-1">Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-900/40" />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={form.password}
                                                    onChange={e => setField("password", e.target.value)}
                                                    className={cn(
                                                        "w-full pl-10 pr-10 py-2.5 bg-cream border rounded-lg text-primary-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm",
                                                        fieldErrors.password ? "border-danger-500" : "border-border"
                                                    )}
                                                    placeholder="••••••••"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowPassword(!showPassword)} 
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-900/40 hover:text-primary-600"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            {fieldErrors.password && <p className="text-xs text-danger-500 mt-1">{fieldErrors.password}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-primary-900 mb-1">Confirm Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-900/40" />
                                                <input
                                                    type="password"
                                                    value={form.confirm_password}
                                                    onChange={e => setField("confirm_password", e.target.value)}
                                                    className={cn(
                                                        "w-full pl-10 pr-4 py-2.5 bg-cream border rounded-lg text-primary-950 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm",
                                                        fieldErrors.confirm_password ? "border-danger-500" : "border-border"
                                                    )}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            {fieldErrors.confirm_password && <p className="text-xs text-danger-500 mt-1">{fieldErrors.confirm_password}</p>}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                                        </button>
                                    </form>

                                    <div className="mt-4 md:hidden text-center">
                                        <p className="text-sm text-primary-900/60">
                                            Already have an account? 
                                            <button onClick={toggleMode} className="text-primary-600 font-semibold ml-1">Sign in</button>
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
