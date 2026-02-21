// app/verify-phone/page.tsx — Phone OTP Verification
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Leaf, Phone, RefreshCw, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { usersApi } from "@/services/api";
import { getUserId } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

export default function VerifyPhonePage() {
    const router = useRouter();
    const userId = getUserId();

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [shakeOtp, setShakeOtp] = useState(false);
    const [sentInitial, setSentInitial] = useState(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Send initial OTP on mount
    useEffect(() => {
        if (!userId) { router.push("/login"); return; }
        if (!sentInitial) {
            usersApi.verifyPhone(userId);
            setSentInitial(true);
        }
    }, [userId, router, sentInitial]);

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => setCountdown(c => c - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    // Auto-submit when all digits filled
    useEffect(() => {
        if (otp.every(d => d !== "") && !isVerifying) {
            handleVerify();
        }
    }, [otp]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // digits only
        const digit = value.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        setError(null);

        // Auto-advance
        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        const newOtp = [...otp];
        pasted.split("").forEach((ch, i) => { if (i < OTP_LENGTH) newOtp[i] = ch; });
        setOtp(newOtp);
        const nextEmpty = newOtp.findIndex(d => !d);
        inputRefs.current[nextEmpty >= 0 ? nextEmpty : OTP_LENGTH - 1]?.focus();
    };

    const handleVerify = async () => {
        if (!userId) return;
        const code = otp.join("");
        if (code.length !== OTP_LENGTH) { setError("Please enter all 6 digits"); return; }

        setIsVerifying(true);
        setError(null);

        const res = await usersApi.verifyPhone(userId, code);

        if (res.data) {
            setSuccess(true);
            setTimeout(() => router.push("/verify-email"), 1500);
        } else {
            setError("Incorrect code — please try again");
            setShakeOtp(true);
            setTimeout(() => setShakeOtp(false), 600);
            setOtp(Array(OTP_LENGTH).fill(""));
            inputRefs.current[0]?.focus();
        }

        setIsVerifying(false);
    };

    const handleResend = async () => {
        if (!userId || countdown > 0) return;
        setIsResending(true);
        await usersApi.verifyPhone(userId);
        setCountdown(COUNTDOWN_SECONDS);
        setError(null);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        setIsResending(false);
    };

    // Masked phone display
    const maskedPhone = "XXXX";

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-safe-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-white/50 p-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className={cn("w-20 h-20 rounded-full flex items-center justify-center shadow-xl mb-4 transition-all",
                        success ? "bg-safe-500" : "bg-primary-100")}>
                        {success ? <ShieldCheck className="w-10 h-10 text-white" /> : <Phone className="w-10 h-10 text-primary-600" />}
                    </div>
                    <h1 className="text-2xl font-black text-primary-950 tracking-tight">
                        {success ? "Phone Verified! ✅" : "Verify Your Phone"}
                    </h1>
                    <p className="text-muted-foreground font-medium text-center mt-2 px-4">
                        {success
                            ? "Redirecting to email verification..."
                            : `We sent a code to your phone number ending in ${maskedPhone}`}
                    </p>
                </div>

                {!success && (
                    <>
                        {/* OTP Input Boxes */}
                        <div className={cn("flex justify-center gap-3 mb-6", shakeOtp && "animate-[shake_0.5s_ease-in-out]")}
                            onPaste={handlePaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    className={cn(
                                        "w-12 h-14 text-center text-2xl font-black rounded-2xl border-2 transition-all focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10",
                                        digit ? "border-primary-400 bg-primary-50" : "border-gray-200 bg-white",
                                        error && "border-danger-400 bg-danger-50"
                                    )}
                                />
                            ))}
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="p-3 rounded-2xl bg-danger-50 border border-danger-100 flex items-center gap-2 text-danger-700 text-sm font-bold mb-4 justify-center">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                            </motion.div>
                        )}

                        {/* Countdown + Resend */}
                        <div className="text-center mb-6">
                            {countdown > 0 ? (
                                <p className="text-sm text-muted-foreground font-bold">
                                    Resend code in <span className="text-primary-600 font-black">{String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")}</span>
                                </p>
                            ) : (
                                <button onClick={handleResend} disabled={isResending}
                                    className="text-sm font-black text-primary-600 hover:underline flex items-center gap-1 mx-auto">
                                    {isResending ? <Spinner size={16} /> : <RefreshCw className="w-4 h-4" />}
                                    Resend Code
                                </button>
                            )}
                        </div>

                        {/* Verify Button */}
                        <button onClick={handleVerify} disabled={isVerifying || otp.some(d => !d)}
                            className={cn("btn-primary w-full py-4 text-lg rounded-2xl group transition-all",
                                otp.some(d => !d) && "opacity-50 cursor-not-allowed")}>
                            {isVerifying ? <Spinner size={24} color="white" /> : (
                                <span className="flex items-center justify-center gap-2">
                                    Verify <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </>
                )}

                <div className="mt-6 text-center">
                    <button onClick={() => router.push("/dashboard")} className="text-xs font-bold text-muted-foreground hover:text-primary-600 transition-colors">
                        Skip for now →
                    </button>
                </div>

                <p className="mt-6 text-[10px] text-center text-muted-foreground font-black uppercase tracking-widest">
                    Safe • Secure • Neural-Powered
                </p>
            </motion.div>
        </div>
    );
}
