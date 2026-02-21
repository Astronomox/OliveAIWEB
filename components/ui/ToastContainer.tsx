// components/ui/ToastContainer.tsx — Toast notification display
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import type { Toast } from "@/hooks/useToast";

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
};

const colors = {
    success: "bg-safe-500 text-white",
    error: "bg-danger-500 text-white",
    info: "bg-primary-600 text-white",
};

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <div className="fixed top-4 right-4 z-[999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
                {toasts.map((t) => {
                    const Icon = icons[t.type];
                    return (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 80, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 80, scale: 0.8 }}
                            transition={{ type: "spring", stiffness: 300, damping: 24 }}
                            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl ${colors[t.type]} backdrop-blur-sm`}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-bold flex-1">{t.message}</span>
                            <button
                                onClick={() => onRemove(t.id)}
                                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
