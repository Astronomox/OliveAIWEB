// components/ui/VoiceButton.tsx — Pulsing microphone button for voice AI
import React from "react";
import { cn } from "@/lib/utils";
import { Mic, Square, Loader2, Volume2 } from "lucide-react";
import type { VoiceButtonProps } from "@/types";

export const VoiceButton: React.FC<VoiceButtonProps> = ({
    state,
    onStart,
    onStop,
    size = "md",
    className,
    disabled = false,
}) => {
    const sizes = {
        sm: "w-12 h-12",
        md: "w-16 h-16",
        lg: "w-24 h-24",
    };

    const iconSizes = {
        sm: "w-5 h-5",
        md: "w-6 h-6",
        lg: "w-10 h-10",
    };

    const handleClick = () => {
        if (state === "idle" || state === "error") {
            onStart();
        } else {
            onStop();
        }
    };

    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            {/* Pulse Animations */}
            {state === "listening" && (
                <>
                    <div className="absolute inset-0 animate-pulse-ring rounded-full bg-primary-400" />
                    <div className="absolute inset-0 animate-pulse-ring rounded-full bg-primary-400 [animation-delay:0.5s]" />
                    <div className="absolute inset-0 animate-pulse-ring rounded-full bg-primary-400 [animation-delay:1s]" />
                </>
            )}

            {state === "speaking" && (
                <div className="absolute -inset-2 animate-pulse rounded-full bg-secondary-100 dark:bg-secondary-900/40" />
            )}

            <button
                onClick={handleClick}
                disabled={disabled || state === "processing"}
                className={cn(
                    "relative z-10 flex items-center justify-center rounded-full transition-all duration-300 active:scale-90",
                    sizes[size],
                    state === "idle" && "bg-primary-500 text-white shadow-lg hover:bg-primary-600",
                    state === "listening" && "bg-danger-500 text-white shadow-glow-danger",
                    state === "processing" && "bg-primary-200 text-primary-500 dark:bg-primary-900",
                    state === "speaking" && "bg-secondary-500 text-white shadow-lg",
                    state === "error" && "bg-charcoal text-white",
                    disabled && "cursor-not-allowed opacity-50"
                )}
                aria-label={
                    state === "listening" ? "Stop listening" :
                        state === "speaking" ? "Stop Olive speaking" :
                            "Talk to Olive"
                }
                aria-busy={state === "processing"}
            >
                {state === "idle" && <Mic className={iconSizes[size]} />}
                {state === "listening" && <Square className={iconSizes[size]} fill="currentColor" />}
                {state === "processing" && <Loader2 className={cn(iconSizes[size], "animate-spin")} />}
                {state === "speaking" && <Volume2 className={cn(iconSizes[size], "animate-pulse")} />}
                {state === "error" && <Mic className={iconSizes[size]} />}
            </button>

            {/* Label for context */}
            <span className="sr-only">
                {state === "idle" ? "Activate voice recognition" :
                    state === "listening" ? "Currently recording your voice" :
                        state === "processing" ? "Olive is thinking" :
                            "Olive is speaking"}
            </span>
        </div>
    );
};
