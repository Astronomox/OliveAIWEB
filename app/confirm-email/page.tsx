// app/confirm-email/page.tsx — Handles email confirmation link from inbox
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Leaf, CheckCircle, XCircle, Mail, ArrowRight } from "lucide-react";
import { usersApi } from "@/services/api";
import { getUserId } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

type ConfirmState = "loading" | "success" | "error";

export default function ConfirmEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <Spinner size={32} />
            </div>
        }>
            <ConfirmEmailInner />
        </Suspense>
    );
}

function ConfirmEmailInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || searchParams.get("otp_code");
    const userId = getUserId();

    const [state, setState] = useState<ConfirmState>("loading");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!token) {
            setState("error");
            setErrorMsg("No verification token found in the URL");
            return;
        }

        confirmEmail();
    }, [token]);

    const confirmEmail = async () => {
        if (!userId || !token) {
            setState("error");
            setErrorMsg("Missing user session or token. Please log in and try again.");
            return;
        }

        setState("loading");

        const res = await usersApi.confirmEmail(userId, token);
        if (res.data) {
            setState("success");
            // Redirect to login after 3 seconds
            setTimeout(() => router.push("/login"), 3000);
        } else {
            setState("error");
            setErrorMsg(res.error?.message || "This link has expired or is invalid");
        }
    };

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-safe-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-white/50 p-10 relative z-10 text-center">

                {/* ── LOADING STATE ──────────────────────────── */}
                {state === "loading" && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                            <Spinner size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-primary-950">Verifying Your Email...</h2>
                        <p className="text-muted-foreground font-medium">Please wait while we confirm your email address</p>
                        <div className="flex justify-center gap-1">
                            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                    </div>
                )}

                {/* ── SUCCESS STATE ──────────────────────────── */}
                {state === "success" && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 8, stiffness: 200, delay: 0.2 }}
                            className="w-24 h-24 bg-safe-500 rounded-full flex items-center justify-center mx-auto shadow-xl"
                        >
                            <CheckCircle className="w-14 h-14 text-white" />
                        </motion.div>

                        <h2 className="text-2xl font-black text-primary-950">Email Verified! 🎉</h2>
                        <p className="text-muted-foreground font-medium px-4">
                            Your email is confirmed. Welcome to Safely-Mama 🌿
                        </p>
                        <p className="text-xs text-muted-foreground">Redirecting to login in 3 seconds...</p>

                        <Link href="/auth?mode=login" className="btn-primary rounded-2xl inline-flex items-center gap-2 px-8 py-3">
                            Go to Login <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                )}

                {/* ── ERROR STATE ────────────────────────────── */}
                {state === "error" && (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
                        <div className="w-24 h-24 bg-danger-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                            <XCircle className="w-14 h-14 text-danger-500" />
                        </div>

                        <h2 className="text-2xl font-black text-primary-950">Verification Failed</h2>
                        <p className="text-muted-foreground font-medium px-4">{errorMsg}</p>

                        <div className="space-y-3">
                            <Link href="/verify-email"
                                className="btn-primary rounded-2xl w-full py-3 flex items-center justify-center gap-2">
                                <Mail className="w-5 h-5" /> Request a New Verification Email
                            </Link>
                            <Link href="/auth?mode=login"
                                className="block text-sm font-bold text-primary-600 hover:underline">
                                Back to Login
                            </Link>
                        </div>
                    </motion.div>
                )}

                <p className="mt-8 text-[10px] text-center text-muted-foreground font-black uppercase tracking-widest">
                    Safely-Mama • Secure • Neural-Powered
                </p>
            </motion.div>
        </div>
    );
}
