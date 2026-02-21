// components/ui/SafetyBadge.tsx — Safe/Caution/Danger badge
import React from "react";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, XCircle } from "lucide-react";
import type { SafetyBadgeProps } from "@/types";

export const SafetyBadge: React.FC<SafetyBadgeProps> = ({
    level,
    label,
    size = "md",
    showIcon = true,
    className,
}) => {
    const configs = {
        safe: {
            bg: "bg-safe-50 dark:bg-safe-900/30",
            text: "text-safe-600 dark:text-safe-400",
            border: "border-safe-200 dark:border-safe-800",
            icon: Check,
            defaultLabel: "SAFE",
        },
        caution: {
            bg: "bg-caution-50 dark:bg-caution-900/30",
            text: "text-caution-600 dark:text-caution-400",
            border: "border-caution-200 dark:border-caution-800",
            icon: AlertTriangle,
            defaultLabel: "CAUTION",
        },
        danger: {
            bg: "bg-danger-50 dark:bg-danger-900/30",
            text: "text-danger-600 dark:text-danger-400",
            border: "border-danger-200 dark:border-danger-800",
            icon: XCircle,
            defaultLabel: "DANGER",
        },
    };

    const config = configs[level];
    const Icon = config.icon;

    const sizes = {
        sm: "px-2 py-0.5 text-xs gap-1",
        md: "px-3 py-1 text-sm gap-1.5",
        lg: "px-4 py-2 text-base gap-2 font-bold",
    };

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border transition-all duration-300",
                config.bg,
                config.text,
                config.border,
                sizes[size],
                className
            )}
            role="status"
            aria-label={`${config.defaultLabel}: ${label || config.defaultLabel}`}
        >
            {showIcon && <Icon className={cn(size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5")} />}
            <span>{label || config.defaultLabel}</span>
        </div>
    );
};
