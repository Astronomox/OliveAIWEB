// components/ui/RiskMeter.tsx — Visual risk indicator for pregnancy
import React from "react";
import { cn } from "@/lib/utils";
import { PREGNANCY_CATEGORY_INFO } from "@/constants/colors";
import type { RiskMeterProps } from "@/types";

export const RiskMeter: React.FC<RiskMeterProps> = ({
    level,
    category,
    label,
    showDetails = true,
    className,
}) => {
    const levels = ["safe", "caution", "danger"];
    const currentIndex = levels.indexOf(level);

    const info = PREGNANCY_CATEGORY_INFO[category] || { label: `Category ${category}`, description: "" };

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                <span className={cn(
                    "text-xs font-black px-2 py-0.5 rounded",
                    level === "safe" && "bg-safe-100 text-safe-700",
                    level === "caution" && "bg-caution-100 text-caution-700",
                    level === "danger" && "bg-danger-100 text-danger-700"
                )}>
                    WHO CATEGORY {category}
                </span>
            </div>

            {/* Visual Meter */}
            <div className="relative h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
                <div className={cn("h-full transition-all duration-500",
                    currentIndex >= 0 ? "w-1/3 bg-safe-500" : "w-1/3 opacity-20 bg-safe-400")} />
                <div className={cn("h-full transition-all duration-500 border-x border-white/20",
                    currentIndex >= 1 ? "w-1/3 bg-caution-500" : "w-1/3 opacity-20 bg-caution-400")} />
                <div className={cn("h-full transition-all duration-500",
                    currentIndex >= 2 ? "w-1/3 bg-danger-500" : "w-1/3 opacity-20 bg-danger-400")} />

                {/* Pointer */}
                <div className={cn(
                    "absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-all duration-700 ease-out",
                    level === "safe" && "left-[16.5%]",
                    level === "caution" && "left-[50%]",
                    level === "danger" && "left-[83.5%]"
                )} />
            </div>

            {/* Details Box */}
            {showDetails && (
                <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-border shadow-sm">
                    <h4 className="font-bold text-primary-900 dark:text-primary-100 mb-1">{info.label}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {info.description}
                    </p>
                </div>
            )}
        </div>
    );
};
