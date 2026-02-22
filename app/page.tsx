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
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between max-w-[1600px] mx-auto w-full bg-cream/80 backdrop-blur-md border-b border-border">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                >
                    <img src="/assets/logo.png" alt="Olive AI Logo" className="w-10 h-10 object-contain" />
                    <span className="text-xl font-bold text-primary-950 font-heading">Olive AI</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden md:flex items-center gap-8 text-sm font-medium text-primary-900/80 font-body"
                >
                    <a href="#about" className="hover:text-primary-600 transition-colors">About</a>
                    <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-primary-600 transition-colors">How it Works</a>
                    
                    <div className="flex items-center gap-4 ml-4 border-l border-border pl-4">
                        <Link href="/auth?mode=login" className="font-semibold hover:text-primary-600 transition-colors">Log In</Link>
                        <Link href="/auth?mode=signup" className="px-5 py-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 hover:shadow-lg transition-all font-semibold">Sign Up</Link>
                    </div>
                </motion.div>
                
                {/* Mobile Nav Actions */}
                <div className="flex md:hidden items-center gap-4">
                    <Link href="/auth?mode=signup" className="px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-semibold">Sign Up</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative z-10 max-w-[1600px] mx-auto px-4 pt-24 pb-16 lg:pt-32 lg:pb-24">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    {/* Left Column: Text Content */}
                    <div className="text-left max-w-2xl mx-auto lg:mx-0">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-6 border border-primary-200"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Built for Olive Mamas
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-950 leading-[1.1] mb-4 font-heading"
                        >
                            Protecting Two Lives, <br />
                            <span className="text-primary-600">One Heartbeat</span> At A Time.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-base md:text-lg text-primary-900/70 font-normal leading-relaxed mb-8 font-body"
                        >
                            Olive AI is your AI-powered companion that ensures every medicine you take is safe for your baby. From instant drug scanning to calming AI wellness advice—we're with you every step of the journey.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-3"
                        >
                            <Link href="/auth?mode=signup" className="group flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-full text-base font-semibold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                                Sign Up Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/auth?mode=login" className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-900 border border-border rounded-full text-base font-semibold hover:border-primary-500 transition-all w-full sm:w-auto">
                                Log In
                            </Link>
                        </motion.div>
                    </div>

                    {/* Right Column: Video/Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="relative w-full aspect-[4/3] lg:aspect-square max-w-lg mx-auto lg:mx-0 rounded-[1.5rem] overflow-hidden shadow-xl border-4 border-white bg-primary-50"
                    >
                        {/* Video Element */}
                        <video 
                            src="/assets/splashVid.mp4" 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            className="w-full h-full object-cover"
                        >
                            Your browser does not support the video tag.
                        </video>
                        
                        {/* Overlay Gradient for better text readability if needed */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                        
                        {/* Floating Badge */}
                        <motion.div 
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/20 flex items-center gap-3"
                        >
                            <div className="w-10 h-10 bg-safe-100 rounded-full flex items-center justify-center text-safe-600">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-primary-950">100% Safe & Verified</p>
                                <p className="text-xs text-primary-900/60">NAFDAC Approved Database</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Features Section */}
            <section id="features" className="relative bg-white pt-24 pb-16 px-6">
                <div className="max-w-[1600px] mx-auto px-4">
                    <div className="text-center mb-16">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-4xl font-bold text-primary-950 dark:text-white mb-4 font-heading"
                        >
                            Why Mothers Trust Us
                        </motion.h2>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="h-1.5 w-24 bg-primary-500 mx-auto rounded-full" 
                        />
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
            <section id="how-it-works" className="bg-cream dark:bg-gray-900 pt-24 pb-32 px-6 relative overflow-hidden transition-colors duration-300">
                <div className="max-w-[1600px] mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-4xl font-bold text-primary-950 dark:text-white mb-4 font-heading"
                        >
                            As Simple As Asking A Sister
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-primary-900/70 dark:text-primary-100/70 font-normal max-w-xl mx-auto font-body text-lg"
                        >
                            Getting safe medical advice shouldn't be hard. In three steps, you're protected.
                        </motion.p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { step: "01", title: "Scan or Search", desc: "Use your camera to scan a drug label or just type the name of the medicine.", icon: Scan },
                            { step: "02", title: "AI Analysis", desc: "Our AI checks the drug against NAFDAC data and your current pregnancy stage.", icon: Sparkles },
                            { step: "03", title: "Get Guidance", desc: "Receive immediate 'Safe' or 'Risky' advice in clear English or Nigerian Pidgin.", icon: ShieldCheck },
                        ].map((item, idx) => (
                            <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="relative flex flex-col items-center text-center"
                            >
                                <div className="w-20 h-20 bg-white dark:bg-charcoal rounded-3xl flex items-center justify-center shadow-lg mb-6 relative border border-border">
                                    <span className="absolute -top-3 -left-3 w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-md">{item.step}</span>
                                    <item.icon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h4 className="text-xl font-bold text-primary-950 dark:text-white mb-3 font-heading">{item.title}</h4>
                                <p className="text-base text-primary-900/70 dark:text-primary-100/70 font-normal leading-relaxed font-body">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section id="about" className="bg-white dark:bg-charcoal py-24 px-6 transition-colors duration-300">
                <div className="max-w-[1600px] mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-primary-950 dark:text-white leading-tight font-heading">
                                Making Motherhood <br /> <span className="text-secondary-500">Safe For Everyone.</span>
                            </h2>
                            <p className="text-lg text-primary-900/70 dark:text-primary-100/70 font-normal font-body">
                                We're on a mission to ensure no mother ever has to guess about her health again. Our community is growing every day.
                            </p>

                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div>
                                    <p className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2 font-heading">5,000+</p>
                                    <p className="text-sm font-semibold uppercase tracking-wider text-primary-900/50 dark:text-primary-100/50">Active Mamas</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-bold text-secondary-500 mb-2 font-heading">50.2k</p>
                                    <p className="text-sm font-semibold uppercase tracking-wider text-primary-900/50 dark:text-primary-100/50">Safety Scans</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-bold text-primary-950 dark:text-white mb-2 font-heading">24/7</p>
                                    <p className="text-sm font-semibold uppercase tracking-wider text-primary-900/50 dark:text-primary-100/50">AI Protection</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-bold text-safe-500 mb-2 font-heading">0%</p>
                                    <p className="text-sm font-semibold uppercase tracking-wider text-primary-900/50 dark:text-primary-100/50">Guesswork</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/20 rounded-[2rem] rotate-3 scale-95 opacity-50 blur-xl" />
                            <div className="relative bg-primary-900 dark:bg-gray-900 rounded-[2rem] p-10 md:p-12 text-white overflow-hidden shadow-2xl border border-primary-800">
                                <Users className="absolute -top-12 -right-12 w-64 h-64 text-white/5 -rotate-12" />
                                <div className="relative z-10">
                                    <div className="flex gap-1 mb-6">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-secondary-400 text-secondary-400" />)}
                                    </div>
                                    <p className="text-xl md:text-2xl font-medium leading-relaxed mb-8 font-body">
                                        "Olive AI saved me from taking a fake cough syrup that wasn't even meant for pregnant women. This app is a life saver for every mama!"
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-full border border-white/20 flex items-center justify-center font-bold text-lg">N</div>
                                        <div>
                                            <p className="font-bold text-white font-heading">Nneka O.</p>
                                            <p className="text-sm text-white/60 font-body">Lagos, Nigeria</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Emotional Banner Section */}
            <section className="bg-cream py-12 px-6 overflow-hidden relative">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <Heart className="w-12 h-12 text-primary-500 mb-6 mx-auto animate-pulse" />
                    <h2 className="text-2xl md:text-3xl font-bold text-primary-950 mb-4 leading-tight">
                        "Mama, Olive AI is hearing your baby's heartbeat alongside you."
                    </h2>
                    <p className="text-base text-primary-900/60 font-normal max-w-2xl mx-auto mb-6">
                        Olive AI was built with love to reduce the stress of pregnancy. No more guessing, no more fake drugs. Just safe motherhood.
                    </p>
                    <Link href="/auth?mode=signup" className="inline-flex items-center gap-2 text-primary-700 font-semibold text-sm border-b-2 border-primary-500 pb-1 hover:text-primary-950 transition-colors">
                        Join 5,000+ Protected Mamas <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Background Shapes */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary-100/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-100/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            </section>

            {/* Footer */}
            <footer className="bg-primary-950 text-white py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {/* Company Info */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <img src="/assets/flogo2.png" alt="Olive AI Logo" className="w-10 h-10 object-contain" />
                                <span className="text-xl font-bold text-white">Olive AI</span>
                            </div>
                            <p className="text-white/70 mb-6 leading-relaxed max-w-md">
                                Empowering Nigerian mothers with AI-driven healthcare insights. Ensuring safe pregnancies through technology and compassion.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.223.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.754-1.378l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.99C24.007 5.367 18.641.001 12.017.001z"/></svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-white font-bold mb-4">Quick Links</h4>
                            <ul className="space-y-2">
                                <li><a href="#about" className="text-white/70 hover:text-white transition-colors">About</a></li>
                                <li><a href="#features" className="text-white/70 hover:text-white transition-colors">Features</a></li>
                                <li><a href="#how-it-works" className="text-white/70 hover:text-white transition-colors">How it Works</a></li>
                                <li><Link href="/auth?mode=signup" className="text-white/70 hover:text-white transition-colors">Get Started</Link></li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 className="text-white font-bold mb-4">Support</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Contact Us</a></li>
                                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-white/60 text-sm">© 2026 Olive AI. Crafted with ❤️ for all Nigerian Mothers</p>
                        <div className="flex items-center gap-6 text-sm">
                            <a href="#" className="text-white/60 hover:text-white transition-colors">Safety Disclaimer</a>
                            <a href="#" className="text-white/60 hover:text-white transition-colors">Medical Advisory</a>
                            <div className="flex items-center gap-2 text-white/40">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-xs">NAFDAC Verified</span>
                            </div>
                        </div>
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
