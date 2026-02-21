// app/onboarding/page.tsx — Multi-step onboarding flow
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Baby, ShieldCheck, Accessibility, ArrowRight, Mic, Camera, Bell } from "lucide-react";
import { cn } from "../../lib/utils";
import { saveUserProfile } from "../../lib/db";
import type { UserProfile, Language, Trimester } from "../../types";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<UserProfile>>({
        name: "",
        isPregnant: "prefer_not_to_say",
        language: "en",
        hasVisualImpairment: false,
    });

    const handleComplete = async () => {
        const profile: UserProfile = {
            id: "main",
            name: formData.name || "Mama",
            isPregnant: formData.isPregnant || "no",
            trimester: formData.trimester || null,
            weekNumber: formData.weekNumber || null,
            hasVisualImpairment: formData.hasVisualImpairment || false,
            language: formData.language || "en",
            onboardingComplete: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await saveUserProfile(profile);
        localStorage.setItem("olive-ai-onboarding", "complete");
        router.push("/");
    };

    return (
        <div className="fixed inset-0 z-50 bg-cream flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up">

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-100 flex">
                    <div className={cn("h-full bg-primary-500 transition-all duration-500",
                        step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full")} />
                </div>

                <div className="p-8">
                    {/* STEP 1: WELCOME */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-primary-500 rounded-3xl flex items-center justify-center shadow-lg animate-float">
                                <Leaf className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-primary-900 leading-none mb-4">Welcome, Mama 🌿</h1>
                                <p className="text-muted-foreground leading-relaxed">
                                    I'm your personal AI health guardian. I'll help you stay safe with medications and track your maternal wellness.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-black uppercase tracking-widest text-primary-700">Choose your language</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setFormData({ ...formData, language: 'en' })}
                                        className={cn("p-4 rounded-2xl border-2 font-bold transition-all",
                                            formData.language === 'en' ? "border-primary-500 bg-primary-50 text-primary-900" : "border-gray-100 hover:border-gray-200")}
                                    >
                                        🇬🇧 English
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, language: 'pidgin' })}
                                        className={cn("p-4 rounded-2xl border-2 font-bold transition-all",
                                            formData.language === 'pidgin' ? "border-primary-500 bg-primary-50 text-primary-900" : "border-gray-100 hover:border-gray-200")}
                                    >
                                        🇳🇬 Pidgin
                                    </button>
                                </div>
                            </div>

                            <button onClick={() => setStep(2)} className="btn-primary w-full py-4 text-lg">
                                Let's Begin <ArrowRight className="w-5 h-5 ml-2" />
                            </button>
                        </div>
                    )}

                    {/* STEP 2: ABOUT YOU */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-black text-primary-900">A bit about you</h2>

                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-sm font-bold text-muted-foreground">What should Mama call you?</span>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Favour"
                                        className="input mt-1"
                                    />
                                </label>

                                <div className="space-y-3">
                                    <span className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                        <Baby className="w-4 h-4" /> Are you currently pregnant?
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {['yes', 'no', 'prefer_not_to_say'].map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => setFormData({ ...formData, isPregnant: opt as any })}
                                                className={cn("px-4 py-2 rounded-full border-2 text-sm font-bold capitalize transition-all",
                                                    formData.isPregnant === opt ? "border-primary-500 bg-primary-50 text-primary-900" : "border-gray-100")}
                                            >
                                                {opt.replace(/_/g, ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {formData.isPregnant === 'yes' && (
                                    <div className="animate-slide-down space-y-3">
                                        <span className="text-sm font-bold text-muted-foreground">Which trimester?</span>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['first', 'second', 'third'].map((tri) => (
                                                <button
                                                    key={tri}
                                                    onClick={() => setFormData({ ...formData, trimester: tri as Trimester })}
                                                    className={cn("py-2 rounded-xl border-2 text-xs font-bold capitalize transition-all",
                                                        formData.trimester === tri ? "border-primary-500 bg-primary-50" : "border-gray-100")}
                                                >
                                                    {tri}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 rounded-2xl bg-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Accessibility className="w-5 h-5 text-primary-700" />
                                        <div>
                                            <p className="text-sm font-bold">Visual accessibility?</p>
                                            <p className="text-[10px] text-muted-foreground">Larger text & voice guides</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.hasVisualImpairment}
                                        onChange={(e) => setFormData({ ...formData, hasVisualImpairment: e.target.checked })}
                                        className="w-6 h-6 rounded-lg accent-primary-600"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)} className="btn-ghost flex-1">Back</button>
                                <button onClick={() => setStep(3)} className="btn-primary flex-[2]">Continue</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PERMISSIONS */}
                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-black text-primary-900">A few permissions</h2>

                            <div className="space-y-4">
                                {[
                                    { icon: Camera, title: "Camera", desc: "To scan drug packaging." },
                                    { icon: Mic, title: "Microphone", desc: "To talk to Mama AI." },
                                    { icon: Bell, title: "Notifications", desc: "For medication reminders." },
                                ].map((item) => (
                                    <div key={item.title} className="flex items-center gap-4 p-4 rounded-3xl border border-gray-100">
                                        <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm leading-none">{item.title}</h4>
                                            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                                        </div>
                                        <div className="ml-auto w-6 h-6 rounded-full border-2 border-primary-100" />
                                    </div>
                                ))}
                            </div>

                            <div className="bg-primary-50 p-4 rounded-3xl border border-primary-100 flex gap-3">
                                <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0 mt-1" />
                                <p className="text-[10px] font-medium leading-relaxed italic text-primary-800">
                                    Mama respects your privacy. Your health data stays encrypted on your device and is never shared with third parties.
                                </p>
                            </div>

                            <button onClick={handleComplete} className="btn-primary w-full py-5 text-xl rounded-3xl">
                                Enter Olive AI 🌿
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
