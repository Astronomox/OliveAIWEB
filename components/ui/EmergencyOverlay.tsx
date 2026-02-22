// components/ui/EmergencyOverlay.tsx — Life-saving emergency modal
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, Phone, MessageSquare, Copy, X } from "lucide-react";
import { EMERGENCY_CONTACTS } from "@/constants/emergency";
import type { EmergencyOverlayProps } from "@/types";

export const EmergencyOverlay: React.FC<EmergencyOverlayProps> = ({
    isVisible,
    emergency,
    onDismiss,
    caregiverPhone,
}) => {
    const [confirmText, setConfirmText] = useState("");
    const dismissalPhrase = "I AT GET HELP"; // Slightly easier than "I am getting help" for stress

    if (!isVisible) return null;

    const isConfirmed = confirmText.toUpperCase() === dismissalPhrase;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-danger-600 animate-fade-in">
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">

                {/* Header */}
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-20 h-20 bg-danger-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <AlertCircle className="w-12 h-12 text-danger-600" />
                    </div>
                    <h1 className="text-3xl font-black text-danger-700 leading-none mb-2">THIS IS AN EMERGENCY</h1>
                    <div className="bg-danger-50 text-danger-700 px-3 py-1 rounded-full text-sm font-bold border border-danger-200 uppercase tracking-tighter">
                        {emergency.condition} detected
                    </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4 mb-8">
                    <div className="p-5 bg-danger-50 rounded-3xl border-2 border-dashed border-danger-200">
                        <h2 className="text-lg font-bold text-danger-800 mb-2">Olive says:</h2>
                        <p className="text-xl font-bold leading-tight mb-4 text-danger-900">
                            {emergency.instruction}
                        </p>
                        <hr className="border-danger-200 mb-4" />
                        <p className="text-lg font-medium italic text-danger-700">
                            "{emergency.pidginInstruction}"
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-3 mb-8">
                    {EMERGENCY_CONTACTS.slice(0, 2).map((contact) => (
                        <a
                            key={contact.number}
                            href={`tel:${contact.number}`}
                            className="btn bg-danger-600 text-white text-xl py-6 rounded-3xl hover:bg-danger-700 active:scale-95 flex items-center justify-center gap-3 shadow-lg"
                        >
                            <Phone className="w-6 h-6 fill-current" />
                            CALL {contact.number} ({contact.area})
                        </a>
                    ))}

                    {caregiverPhone && (
                        <a
                            href={`https://wa.me/${caregiverPhone}?text=EMERGENCY! I need help immediately. Olive AI detected: ${emergency.condition}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn bg-emerald-600 text-white py-4 rounded-3xl flex items-center justify-center gap-2"
                        >
                            <MessageSquare className="w-5 h-5" />
                            Tell Caregiver on WhatsApp
                        </a>
                    )}
                </div>

                {/* Dismissal Guard */}
                <div className="pt-6 border-t border-gray-100">
                    <p className="text-xs font-bold text-muted-foreground uppercase text-center mb-3">
                        Type "{dismissalPhrase}" to close this screen
                    </p>
                    <div className="relative">
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Confirm you are safe..."
                            className="input text-center h-14 bg-gray-50 border-gray-200 focus:bg-white"
                        />
                        {isConfirmed && (
                            <button
                                onClick={onDismiss}
                                className="absolute right-2 top-2 bottom-2 aspect-square bg-safe-500 text-white rounded-xl flex items-center justify-center animate-fade-in"
                                aria-label="Dismiss emergency overlay"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
