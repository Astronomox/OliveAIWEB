// app/verify-email/page.tsx — Email OTP verification (6-digit input screen)
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Mail, RefreshCw, ArrowRight, CheckCircle, AlertCircle
} from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { usersApi } from "@/services/api";
import { getUserId } from "@/lib/auth";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage() {
    const router = useRouter();
    const userId = getUserId();

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN); // already sent from signup
    const [error, setError] = useState<string | null>(null);
    const [resendError, setResendError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [shakeOtp, setShakeOtp] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Guard + fetch masked email
    useEffect(() => {
        if (!userId) { router.push("/login"); return; }
        usersApi.getUser(userId).then(res => {
            if (res.data?.email) setUserEmail(res.data.email);
        });
    }, [userId, router]);

    // Countdown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown(c => c - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    // Auto-submit when all boxes filled
    useEffect(() => {
        if (otp.every(d => d !== "") && !isVerifying && !success) {
            submitOtp();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otp]);

    const maskEmail = (email: string) => {
        const [local, domain] = email.split("@");
        if (!domain) return email;
        const masked = local.charAt(0) + "***" + (local.length > 1 ? local.slice(-1) : "");
        return `${masked}@${domain}`;
    };

    const handleChange = (i: number, val: string) => {
        if (!/^\d*$/.test(val)) return;
        const digit = val.slice(-1);
        const next = [...otp];
        next[i] = digit;
        setOtp(next);
        setError(null);
        if (digit && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[i] && i > 0) {
            const next = [...otp];
            next[i - 1] = "";
            setOtp(next);
            inputRefs.current[i - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        const next = Array(OTP_LENGTH).fill("");
        pasted.split("").forEach((ch, j) => { next[j] = ch; });
        setOtp(next);
        const nextEmpty = next.findIndex(d => !d);
        inputRefs.current[nextEmpty >= 0 ? nextEmpty : OTP_LENGTH - 1]?.focus();
    };

    const submitOtp = async () => {
        if (!userId) return;
        const code = otp.join("");
        if (code.length !== OTP_LENGTH) { setError("Please enter the full 6-digit code"); return; }

        setIsVerifying(true);
        setError(null);

        const res = await usersApi.confirmEmail(userId, code);

        if (res.data) {
            setSuccess(true);
            setTimeout(() => router.push("/dashboard"), 2000);
        } else {
            const msg = res.error?.message || "Incorrect code — please try again";
            setError(msg);
            setShakeOtp(true);
            setTimeout(() => setShakeOtp(false), 600);
            setOtp(Array(OTP_LENGTH).fill(""));
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        }
        setIsVerifying(false);
    };

    const handleResend = async () => {
        if (!userId || cooldown > 0) return;
        setIsResending(true);
        setResendError(null);
        setError(null);

        const res = await usersApi.verifyEmail(userId);
        if (res.data) {
            setCooldown(RESEND_COOLDOWN);
            setOtp(Array(OTP_LENGTH).fill(""));
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        } else {
            setResendError(res.error?.message || "Failed to send verification email — tap to retry");
        }
        setIsResending(false);
    };

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-white/50 p-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <motion.div
                        animate={success ? {} : { y: [0, -8, 0] }}
                        transition={{ repeat: success ? 0 : Infinity, duration: 2, ease: "easeInOut" }}
                        className={cn("w-20 h-20 rounded-full flex items-center justify-center shadow-xl mb-4 transition-all",
                            success ? "bg-safe-500" : "bg-primary-500")}
                    >
                        {success
                            ? <CheckCircle className="w-10 h-10 text-white" />
                            : <Mail className="w-10 h-10 text-white" />}
                    </motion.div>

                    <h1 className="text-2xl font-black text-primary-950 tracking-tight">
                        {success ? "Email Verified! ✅" : "Verify Your Email"}
                    </h1>
                    <p className="text-muted-foreground font-medium text-center mt-2 px-4 text-sm">
                        {success
                            ? "Welcome to Safely-Mama! Redirecting to dashboard..."
                            : userEmail
                                ? <>We sent a 6-digit code to <strong>{maskEmail(userEmail)}</strong>. Enter it below.</>
                                : "We sent a 6-digit code to your email. Enter it below."}
                    </p>
                </div>

                {!success && (
                    <>
                        {/* OTP Boxes */}
                        <div
                            className={cn("flex justify-center gap-2 mb-4", shakeOtp && "animate-[shake_0.5s_ease-in-out]")}
                            onPaste={handlePaste}
                        >
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    disabled={isVerifying}
                                    onChange={e => handleChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    className={cn(
                                        "w-12 h-14 text-center text-2xl font-black rounded-2xl border-2 transition-all focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 disabled:opacity-60",
                                        digit ? "border-primary-400 bg-primary-50" : "border-gray-200 bg-white",
                                        error && "border-danger-400 bg-danger-50"
                                    )}
                                />
                            ))}
                        </div>

                        {/* Verify button (also auto-submits, but keep manual too) */}
                        <button
                            onClick={submitOtp}
                            disabled={isVerifying || otp.some(d => !d)}
                            className={cn(
                                "btn-primary w-full py-4 text-lg rounded-2xl group transition-all mb-4 flex items-center justify-center gap-2",
                                otp.some(d => !d) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isVerifying
                                ? <><Spinner size={20} color="white" /> Verifying...</>
                                : <>Verify Email <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                        </button>

                        {/* Errors */}
                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="p-3 rounded-2xl bg-danger-50 border border-danger-100 flex items-center gap-2 text-danger-700 text-sm font-bold mb-4 justify-center">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                            </motion.div>
                        )}

                        {/* Resend */}
                        <div className="text-center">
                            {cooldown > 0 ? (
                                <p className="text-sm text-muted-foreground font-bold">
                                    Resend code in{" "}
                                    <span className="text-primary-600 font-black">
                                        {String(Math.floor(cooldown / 60)).padStart(2, "0")}:{String(cooldown % 60).padStart(2, "0")}
                                    </span>
                                </p>
                            ) : (
                                <button
                                    onClick={handleResend}
                                    disabled={isResending}
                                    className="text-sm font-black text-primary-600 hover:underline flex items-center gap-1 mx-auto"
                                >
                                    {isResending
                                        ? <><Spinner size={14} color="#0A6B4B" /> Sending...</>
                                        : <><RefreshCw className="w-4 h-4" /> Resend Code</>}
                                </button>
                            )}
                            {resendError && (
                                <p className="text-xs text-danger-600 font-bold mt-2">{resendError}</p>
                            )}
                        </div>

                        {/* Tips */}
                        <div className="mt-5 p-4 bg-cream rounded-2xl border border-border text-xs text-muted-foreground space-y-1">
                            <p className="font-black uppercase text-[10px] tracking-widest mb-2">📧 Can&apos;t find the email?</p>
                            <p>✅ Check your spam or junk folder</p>
                            <p>✅ The code expires after 10 minutes</p>
                            <p>✅ Request a new code using the resend button</p>
                        </div>
                    </>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="text-xs font-bold text-muted-foreground hover:text-primary-600 transition-colors"
                    >
                        Skip for now →
                    </button>
                </div>

                <p className="mt-4 text-[10px] text-center text-muted-foreground font-black uppercase tracking-widest">
                    Safe • Secure • Neural-Powered
                </p>
            </motion.div>
        </div>
    );
}
