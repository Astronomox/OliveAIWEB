// app/mama/page.tsx — ALIVE Talk to Mama AI Chat
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, MessageCircle, Send, Globe, Plus, Trash2, Clock, Volume2, Mic, MicOff, Settings, X, ChevronDown, ChevronRight, Info, AlertCircle, User, Scan, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth, useToast, useVoice } from "../../hooks";
import { medicationsApi } from "../../services/api";
import { Spinner } from "../../components/ui/Spinner";
import { ToastContainer } from "../../components/ui/ToastContainer";
import type { MedicationResponse } from "@/types/api";

interface ChatMessage {
    id: string;
    role: "user" | "mama";
    text: string;
    timestamp: string;
    isEmergency?: boolean;
}

const SUGGESTION_CHIPS = [
    { text: "Is this drug safe in pregnancy?", emoji: "💊" },
    { text: "I have a headache — what can I take?", emoji: "🤕" },
    { text: "My baby isn't moving much", emoji: "👶" },
    { text: "What are signs of malaria?", emoji: "🦟" },
    { text: "Is Paracetamol safe for breastfeeding?", emoji: "🍼" },
    { text: "I feel dizzy and my vision is blurry", emoji: "😵" },
];

const MAMA_GREETING = "Hello Mama! 🌿 I'm here to help you with medication safety, pregnancy questions, and health guidance. Ask me anything — I'll respond in your preferred language.\n\nRemember: I'm not a doctor, but I can help guide you with evidence-based information.";

function generateId() {
    return Math.random().toString(36).slice(2, 10);
}

function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MamaPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { toasts, addToast, removeToast } = useToast();
    const { state, startListening, stopListening, transcript, speak } = useVoice();
    const isListening = state === "listening";

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [language, setLanguage] = useState<"en" | "pid">("en");
    const [medications, setMedications] = useState<MedicationResponse[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [chatSessions, setChatSessions] = useState<{ id: string; date: string; preview: string; count: number }[]>([]);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) { router.push("/login"); return; }
        if (user) fetchMedContext();
        // Load chat history
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("smama_chat_messages");
            if (saved) setMessages(JSON.parse(saved));
            const sessions = localStorage.getItem("smama_chat_sessions");
            if (sessions) setChatSessions(JSON.parse(sessions));
        }
    }, [user, authLoading, isAuthenticated]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    useEffect(() => {
        if (transcript) setInput(prev => prev + " " + transcript);
    }, [transcript]);

    const fetchMedContext = async () => {
        if (!user) return;
        const res = await medicationsApi.getAll(user.id, "active");
        if (res.data) setMedications(res.data);
    };

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const saveMessages = (msgs: ChatMessage[]) => {
        setMessages(msgs);
        if (typeof window === "undefined") return;

        // THROTTLE: Only write to localStorage at most once every 1000ms
        // This prevents mobile jank when history gets long.
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            localStorage.setItem("smama_chat_messages", JSON.stringify(msgs));
        }, 1000);
    };

    const handleSend = async (manualInput?: string) => {
        const textToSend = manualInput || input.trim();
        if (!textToSend || isThinking) return;

        const userMsg: ChatMessage = { id: generateId(), role: "user", text: textToSend, timestamp: new Date().toISOString() };
        const updated = [...messages, userMsg];
        saveMessages(updated);
        setInput("");
        setIsThinking(true);

        try {
            const response = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMsg.text,
                    history: messages.map(m => ({
                        role: m.role === "user" ? "user" : "model",
                        parts: [{ text: m.text }]
                    }))
                }),
            });

            if (!response.ok) throw new Error("Mama needs a small break. Please try again.");

            // Create placeholder message for Mama's streaming reply
            const mamaMsg: ChatMessage = { id: generateId(), role: "mama", text: "", timestamp: new Date().toISOString() };
            const withMama = [...updated, mamaMsg];
            saveMessages(withMama);

            if (!response.body) {
                setIsThinking(false);
                addToast("Mama is having trouble speaking. Try again.", "error");
                return;
            }
            const reader = response.body.getReader();
            if (!reader) throw new Error("Stream reader failed");

            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                accumulated += decoder.decode(value, { stream: true });

                // Functional state update for streaming
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === "mama") {
                        return [...prev.slice(0, -1), { ...last, text: accumulated }];
                    }
                    return prev;
                });
            }

            // Persistence
            const finalMessages = [...updated, { ...mamaMsg, text: accumulated }];
            localStorage.setItem("smama_chat_messages", JSON.stringify(finalMessages));

        } catch (err: any) {
            const errorMsg: ChatMessage = {
                id: generateId(), role: "mama",
                text: language === "pid"
                    ? "Ah sorry o! Mama brain dey small rest. Try again for me. 🌿"
                    : err.message || "I'm sorry, I couldn't process that right now. Please try again, Mama. 🌿",
                timestamp: new Date().toISOString(),
            };
            saveMessages([...updated, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleNewChat = () => {
        if (messages.length > 0) {
            const session = {
                id: generateId(),
                date: new Date().toISOString(),
                preview: messages[0]?.text.slice(0, 50) || "",
                count: messages.length,
            };
            const updatedSessions = [session, ...chatSessions].slice(0, 20);
            setChatSessions(updatedSessions);
            localStorage.setItem("smama_chat_sessions", JSON.stringify(updatedSessions));
        }
        saveMessages([]);
    };

    const handleReadAloud = (text: string) => { speak(text); };

    if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={40} /></div>;

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] max-w-3xl mx-auto animate-fade-in">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* ═══════════ HEADER ═══════════ */}
            <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary text-white flex items-center justify-center shadow-lg">
                        <Leaf className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-primary-900">Talk to Mama 🌿</h1>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">AI Health Assistant · {isThinking ? "Thinking…" : "Online"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setLanguage(language === "en" ? "pid" : "en")}
                        className={cn("px-3 py-1.5 rounded-full text-[10px] font-black border-2 transition-all",
                            language === "pid" ? "bg-primary-500 border-primary-500 text-white" : "border-gray-200 text-muted-foreground")}>
                        <Globe className="w-3 h-3 inline mr-1" /> {language === "pid" ? "🇳🇬 Pidgin" : "🇬🇧 English"}
                    </button>
                    <button onClick={handleNewChat} className="p-2 rounded-xl hover:bg-primary-50 text-primary-600 transition-all" title="New Chat">
                        <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowHistory(!showHistory)} className="p-2 rounded-xl hover:bg-primary-50 text-primary-600 transition-all" title="History">
                        <Clock className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ═══════════ CHAT HISTORY PANEL ═══════════ */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-b border-border overflow-hidden bg-cream/50">
                        <div className="p-4 max-h-48 overflow-y-auto">
                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Chat History</h4>
                            {chatSessions.length > 0 ? (
                                <div className="space-y-1">
                                    {chatSessions.map(s => (
                                        <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-all cursor-pointer">
                                            <MessageCircle className="w-3 h-3 text-muted-foreground shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-primary-900 truncate">{s.preview || "Chat"}</p>
                                                <p className="text-[9px] text-muted-foreground">{new Date(s.date).toLocaleDateString()} · {s.count} messages</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No previous chats</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════ CHAT MESSAGES ═══════════ */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
                {messages.length === 0 ? (
                    /* Welcome state */
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-primary text-white flex items-center justify-center shadow-xl mb-4">
                            <Leaf className="w-10 h-10" />
                        </div>
                        <p className="text-lg font-black text-primary-900 mb-2">Hello, {user?.name?.split(" ")[0] || "Mama"}! 🌿</p>
                        <p className="text-sm text-muted-foreground max-w-md font-medium mb-6">How can I help you today? I can answer questions about medication safety, pregnancy, and maternal health.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                            {SUGGESTION_CHIPS.map((chip, i) => (
                                <button key={i} onClick={() => handleSend(chip.text)}
                                    className="text-left p-3 rounded-2xl bg-white border border-border hover:border-primary-300 hover:shadow-md transition-all text-xs font-bold text-primary-800 flex items-center gap-2 active:scale-95">
                                    <span className="text-lg">{chip.emoji}</span>
                                    <span className="flex-1">{chip.text}</span>
                                </button>
                            ))}
                        </div>

                        {medications.length > 0 && (
                            <div className="mt-6 card p-3 bg-cream/50 border border-border w-full max-w-md">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Your Active Medications</p>
                                <div className="flex flex-wrap gap-1">
                                    {medications.slice(0, 5).map(m => (
                                        <span key={m.id} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-bold rounded-full">
                                            💊 {m.drug_name}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[9px] text-muted-foreground mt-1">Mama knows about these and will factor them into her advice</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Active chat */
                    <>
                        {messages.map(msg => (
                            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                                {msg.role === "mama" && (
                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md",
                                        msg.isEmergency ? "bg-danger-500 text-white" : "bg-gradient-primary text-white")}>
                                        <Leaf className="w-4 h-4" />
                                    </div>
                                )}
                                <div className={cn("max-w-[80%] rounded-2xl p-4 shadow-sm",
                                    msg.role === "user" ? "bg-primary-600 text-white rounded-br-md" :
                                        msg.isEmergency ? "bg-danger-50 border-2 border-danger-300 text-danger-900 rounded-bl-md animate-pulse" :
                                            "bg-white border border-border text-primary-900 rounded-bl-md"
                                )}>
                                    <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    <div className={cn("flex items-center gap-2 mt-2 pt-1 border-t",
                                        msg.role === "user" ? "border-white/20" : "border-gray-100")}>
                                        <span className={cn("text-[9px]", msg.role === "user" ? "text-white/60" : "text-muted-foreground")}>{formatTime(msg.timestamp)}</span>
                                        {msg.role === "mama" && (
                                            <button onClick={() => handleReadAloud(msg.text)} className="text-[9px] text-primary-600 hover:underline flex items-center gap-0.5">
                                                <Volume2 className="w-3 h-3" /> Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {msg.role === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0 shadow-md">
                                        <User className="w-4 h-4" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        {isThinking && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center shadow-md shrink-0">
                                    <Leaf className="w-4 h-4" />
                                </div>
                                <div className="bg-white border border-border rounded-2xl rounded-bl-md p-4 shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </>
                )}
            </div>

            {/* ═══════════ DISCLAIMER ═══════════ */}
            {messages.length > 0 && (
                <div className="px-4 py-2 bg-secondary-50 border-t border-secondary-100 text-center shrink-0">
                    <p className="text-[9px] font-bold text-secondary-700">⚠️ Mama is not a doctor. Always consult a healthcare professional for medical decisions.</p>
                </div>
            )}

            {/* ═══════════ INPUT BAR ═══════════ */}
            <div className="border-t border-border bg-white p-3 shrink-0">
                <div className="flex items-end gap-2">
                    <button onClick={() => isListening ? stopListening() : startListening()}
                        className={cn("p-3 rounded-2xl transition-all shrink-0",
                            isListening ? "bg-danger-500 text-white animate-pulse shadow-glow" : "bg-primary-50 text-primary-600 hover:bg-primary-100")}>
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <div className="flex-1 relative">
                        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={language === "pid" ? "Wetin you wan ask Mama?" : "Ask Mama anything..."}
                            rows={1} className="input w-full resize-none py-3 pr-10 text-sm min-h-[48px] max-h-32" />
                        {input.length > 100 && (
                            <span className="absolute bottom-1 right-2 text-[9px] text-muted-foreground">{input.length}</span>
                        )}
                    </div>
                    <button onClick={() => handleSend()} disabled={!input.trim() || isThinking}
                        className={cn("p-3 rounded-2xl transition-all shrink-0",
                            input.trim() ? "bg-primary-600 text-white hover:bg-primary-700 shadow-glow" : "bg-gray-100 text-gray-300")}>
                        {isThinking ? <Spinner size={20} color="white" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
                {/* Quick links */}
                <div className="flex gap-3 justify-center mt-2 pt-2 border-t border-gray-50">
                    <button onClick={() => router.push("/scan")} className="text-[10px] font-bold text-muted-foreground hover:text-primary-600 flex items-center gap-1"><Scan className="w-3 h-3" /> Scan Drug</button>
                    <span className="text-gray-200">|</span>
                    <button onClick={() => router.push("/pregnancy")} className="text-[10px] font-bold text-muted-foreground hover:text-primary-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Pregnancy Check</button>
                    <span className="text-gray-200">|</span>
                    <button onClick={() => router.push("/drugs")} className="text-[10px] font-bold text-muted-foreground hover:text-primary-600 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Drug Search</button>
                </div>
            </div>
        </div>
    );
}
