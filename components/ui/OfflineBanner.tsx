// components/ui/OfflineBanner.tsx — Connectivity status banner
import React from "react";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Cloud } from "lucide-react";
import type { OfflineBannerProps } from "@/types";

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
    isOnline,
    lastSynced,
    className,
}) => {
    if (isOnline) {
        // Show a subtle sync success indicator for a few seconds when back online
        return null;
    }

    return (
        <div
            className={cn(
                "fixed bottom-20 left-4 right-4 z-40 lg:bottom-10 lg:left-auto lg:right-10 lg:w-80",
                "animate-slide-up bg-charcoal text-white rounded-2xl p-4 shadow-2xl border border-white/10",
                className
            )}
            role="alert"
        >
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <WifiOff className="w-5 h-5 text-secondary-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">You're Offline</p>
                    <p className="text-xs text-white/60">
                        {lastSynced ? `Last sync: ${new Date(lastSynced).toLocaleTimeString()}` : "Don't worry — scan & safety check still work!"}
                    </p>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/40">
                <Cloud className="w-3 h-3" />
                Offline Protection Enabled
            </div>
        </div>
    );
};
