// app/page.tsx — A stunning, emotionally soothing landing page
"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Leaf,
    Heart,
    Baby,
    ShieldCheck,
    Sparkles,
    MessageCircle,
    Scan,
    ArrowRight,
    Star,
    Cloud,
    Sun,
    Users,
    CheckCircle
} from "lucide-react";
import { cn } from "../lib/utils";

const FloatingIcon = ({ icon: Icon, delay = 0, x = 0, y = 0, size = 24 }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1],
            x: [x - 10, x + 10, x - 10],
            y: [y - 10, y + 10, y - 10]
        }}
        transition={{
            duration: 5,
            repeat: Infinity,
            delay,
            ease: "easeInOut"
        }}
        className="absolute pointer-events-none text-primary-200/40"
        style={{ left: `${x}%`, top: `${y}%` }}
    >
        <Icon size={size} strokeWidth={1.5} />
    </motion.div>
);

export default function LandingPage() {
    return (
        <div className="relative min-h-screen bg-cream overflow-hidden font-outfit">

            {/* Soft Ambient Background Elements */}
            <div className="absolute inset-0 z-0">
                <FloatingIcon icon={Leaf} x={10} y={20} delay={0} size={40} />
                <FloatingIcon icon={Heart} x={85} y={15} delay={1} size={32} />
                <FloatingIcon icon={Baby} x={75} y={70} delay={2} size={48} />
                <FloatingIcon icon={Star} x={25} y={80} delay={3} size={28} />
                <FloatingIcon icon={Cloud} x={50} y={10} delay={0.5} size={60} />
                <FloatingIcon icon={Sparkles} x={90} y={50} delay={1.5} size={24} />
                <FloatingIcon icon={Sun} x={5} y={60} delay={4} size={36} />

                {/* Large Curvy Background Blobs */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary-50/50 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] bg-secondary-50/50 rounded-full blur-[100px]"
                />
            </div>

            {/* Navigation (Floating) */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between max-w-[1600px] mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                >
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-glow transform -rotate-6">
                        <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-black text-primary-950 tracking-tight">Olive AI</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden md:flex items-center gap-8 text-sm font-bold text-primary-900/60"
                >
                    <a href="#features" className="hover:text-primary-600 transition-colors">Safety</a>
                    <a href="#mama" className="hover:text-primary-600 transition-colors">Mama AI</a>
                    <a href="#impact" className="hover:text-primary-600 transition-colors">Impact</a>
                    <Link href="/login" className="px-5 py-2.5 bg-primary-950 text-white rounded-full hover:shadow-xl transition-all">Login</Link>
                </motion.div>
            </nav>

            {/* Hero Section */}
            <div className="relative z-10 text-center max-w-[1600px] mx-auto px-4 pt-20">

                <div className="text-center max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-xs font-black uppercase tracking-widest mb-8 border border-primary-200"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Built for Olive Mamas
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-primary-950 leading-[0.9] mb-8"
                    >
                        Protecting Two Lives, <br />
                        <span className="text-primary-600 italic">One Heartbeat</span> At A Time.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-primary-900/70 font-medium leading-relaxed mb-12 px-4"
                    >
                        Olive AI is your AI-powered companion that ensures every medicine you take is safe for your baby. From instant drug scanning to calming AI wellness advice—we're with you every step of the journey.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link href="/login" className="group flex items-center justify-center gap-3 px-8 py-5 bg-primary-600 text-white rounded-[2rem] text-lg font-black shadow-2xl shadow-primary-600/30 hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all">
                            Start Your Journey <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/pregnancy" className="flex items-center justify-center gap-3 px-8 py-5 bg-white text-primary-900 border-2 border-primary-100 rounded-[2rem] text-lg font-black hover:border-primary-500 transition-all">
                            Check Medicine Safety
                        </Link>
                    </motion.div>
                </div>

                {/* Floating Preview Image / Mockup Wrapper */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 60 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                    className="relative w-full max-w-4xl mt-12 mb-[-120px]"
                >
                    {/* The "Curvy" Banner Section using SVG Clip */}
                    <div className="relative aspect-video rounded-[3rem] overflow-hidden shadow-soft-xl bg-white border-8 border-white">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary-50 to-secondary-50 flex items-center justify-center p-12">
                            {/* Visual representation of the app's soul */}
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="relative w-full max-w-lg aspect-square bg-gradient-to-br from-primary-500/10 to-transparent rounded-full flex items-center justify-center"
                            >
                                <div className="absolute inset-0 border-2 border-dashed border-primary-200 rounded-full animate-spin-slow" />
                                <div className="z-10 bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-white flex flex-col items-center gap-6">
                                    <div className="w-24 h-24 bg-primary-600 rounded-3xl flex items-center justify-center shadow-glow text-white">
                                        <MessageCircle size={48} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-1">Mama AI Guidance</p>
                                        <p className="text-xl font-bold text-primary-950 italic leading-snug">
                                            "Dont worry Mama, this paracetamol is safe. <br /> Just rest and drink water."
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Curvy Bottom Mask */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-cream pointer-events-none"
                        style={{ clipPath: "ellipse(50% 100% at 50% 100%)" }} />
                </motion.div>
            </div>

            {/* Features Section */}
            <section id="features" className="relative bg-white pt-48 pb-32 px-6">
                <div className="max-w-[1600px] mx-auto px-4">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-primary-950 mb-4 tracking-tighter uppercase">Why Nigerian Mamas Trust Us</h2>
                        <div className="h-1.5 w-24 bg-primary-500 mx-auto rounded-full" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Scan}
                            title="Instant NAFDAC Scan"
                            desc="Not sure about a bottle of medicine? Just point your camera and we'll check it against the NAFDAC database instantly."
                            color="bg-safe-500"
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Pregnancy Safety Filter"
                            desc="We check every ingredient against its safety for your specific trimester. If it's risky, we'll tell you immediately."
                            color="bg-primary-600"
                        />
                        <FeatureCard
                            icon={MessageCircle}
                            title="Talk to Mama AI"
                            desc="Speak in English or Pidgin. Mama understands your worries and gives you soothing, medically-backed health advice daily."
                            color="bg-secondary-500"
                        />
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="bg-cream pt-24 pb-48 px-6 relative overflow-hidden">
                <div className="max-w-[1600px] mx-auto px-4 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-primary-950 mb-4 tracking-tighter uppercase">As Simple As Asking A Sister</h2>
                        <p className="text-primary-900/60 font-medium max-w-xl mx-auto">Getting safe medical advice shouldn't be hard. In three steps, you're protected.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { step: "01", title: "Scan or Search", desc: "Use your camera to scan a drug label or just type the name of the medicine.", icon: Scan },
                            { step: "02", title: "AI Analysis", desc: "Our AI checks the drug against NAFDAC data and your current pregnancy stage.", icon: Sparkles },
                            { step: "03", title: "Get Guidance", desc: "Receive immediate 'Safe' or 'Risky' advice in clear English or Nigerian Pidgin.", icon: ShieldCheck },
                        ].map((item, idx) => (
                            <div key={idx} className="relative flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-soft-xl mb-6 relative">
                                    <span className="absolute -top-3 -left-3 w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-xs font-black">{item.step}</span>
                                    <item.icon className="w-10 h-10 text-primary-600" />
                                </div>
                                <h4 className="text-xl font-black text-primary-950 mb-2">{item.title}</h4>
                                <p className="text-sm text-primary-900/60 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Decorative background curve */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-white" style={{ clipPath: "ellipse(70% 100% at 50% 100%)" }} />
            </section>

            {/* Impact Section */}
            <section id="impact" className="bg-white py-32 px-6">
                <div className="max-w-[1600px] mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8">
                            <h2 className="text-5xl font-black text-primary-950 leading-none">Making Motherhood <br /> <span className="text-secondary-500">Safe For Everyone.</span></h2>
                            <p className="text-lg text-primary-900/60 font-medium">We're on a mission to ensure no Nigerian mother ever has to guess about her health again. Our community is growing every day.</p>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-4xl font-black text-primary-600 mb-1">5,000+</p>
                                    <p className="text-xs font-black uppercase tracking-widest text-primary-900/40">Active Mamas</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-secondary-500 mb-1">50.2k</p>
                                    <p className="text-xs font-black uppercase tracking-widest text-primary-900/40">Safety Scans</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-primary-950 mb-1">24/7</p>
                                    <p className="text-xs font-black uppercase tracking-widest text-primary-900/40">AI Protection</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-safe-500 mb-1">0%</p>
                                    <p className="text-xs font-black uppercase tracking-widest text-primary-900/40">Guesswork</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-100 rounded-[3rem] rotate-3 scale-95 opacity-50 blur-2xl" />
                            <div className="relative bg-primary-900 rounded-[3rem] p-12 text-white overflow-hidden">
                                <Users className="absolute -top-12 -right-12 w-64 h-64 text-white/5 -rotate-12" />
                                <div className="relative z-10">
                                    <div className="flex gap-1 mb-6">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-secondary-400 text-secondary-400" />)}
                                    </div>
                                    <p className="text-2xl font-bold italic leading-tight mb-8">
                                        "Olive AI saved me from taking a fake cough syrup that wasn't even meant for pregnant women. This app is a life saver for every mama in Nigeria!"
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-full border border-white/20 flex items-center justify-center font-black">N</div>
                                        <div>
                                            <p className="font-black">Nneka O.</p>
                                            <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Lagos, Nigeria</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Emotional Banner Section */}
            <section className="bg-cream py-24 px-6 overflow-hidden relative">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <Heart className="w-16 h-16 text-primary-500 mb-8 mx-auto animate-pulse" />
                    <h2 className="text-4xl md:text-5xl font-black text-primary-950 mb-6 leading-tight">
                        "Mama, Olive AI is hearing your baby's heartbeat alongside you."
                    </h2>
                    <p className="text-lg text-primary-900/60 font-medium max-w-2xl mx-auto mb-12">
                        Olive AI was built with love to reduce the stress of pregnancy. No more guessing, no more fake drugs. Just safe motherhood.
                    </p>
                    <Link href="/onboarding" className="inline-flex items-center gap-2 text-primary-700 font-black uppercase text-sm tracking-widest border-b-2 border-primary-500 pb-1 hover:text-primary-950 transition-colors">
                        Join 5,000+ Protected Mamas <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Background Shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-100/50 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            </section>

            {/* Footer */}
            <footer className="bg-primary-950 text-white/50 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-black text-white">Olive AI</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">© 2026 Crafted with ❤️ for all Nigerian Mothers</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Safety Disclaimer</a>
                    </div>
                </div>
            </footer>

        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc, color }: any) {
    return (
        <motion.div
            whileHover={{ y: -10 }}
            className="p-10 rounded-[2.5rem] bg-white border border-gray-100 shadow-soft hover:shadow-glow transition-all"
        >
            <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white mb-8 shadow-lg", color)}>
                <Icon size={32} />
            </div>
            <h3 className="text-2xl font-black text-primary-950 mb-4">{title}</h3>
            <p className="text-primary-900/60 font-medium leading-relaxed">{desc}</p>
        </motion.div>
    );
}
