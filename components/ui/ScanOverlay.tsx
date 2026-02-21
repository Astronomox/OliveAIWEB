// components/ui/ScanOverlay.tsx — Camera scan frame animation
import React from "react";
import { cn } from "@/lib/utils";

export const ScanOverlay: React.FC<{ isScanning: boolean }> = ({ isScanning }) => {
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
            {/* Corner Brackets */}
            <div className="relative w-full max-w-sm aspect-[4/3] border-2 border-white/30 rounded-3xl">
                {/* Animated Scanning Line */}
                {isScanning && (
                    <div className="absolute left-4 right-4 h-1 bg-safe-400 shadow-[0_0_15px_#26D4A1] z-10 animate-scan-line rounded-full opacity-70" />
                )}

                {/* Brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-safe-500 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-safe-500 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-safe-500 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-safe-500 rounded-br-2xl" />
            </div>

            {/* Guide Text */}
            <div className="absolute bottom-24 left-0 right-0 text-center animate-pulse">
                <p className="inline-block px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-sm font-bold">
                    {isScanning ? "Align drug packaging within frame" : "Camera Ready"}
                </p>
            </div>

            {/* Hints Overlay */}
            <div className="absolute inset-0 bg-black/20" />
        </div>
    );
};
