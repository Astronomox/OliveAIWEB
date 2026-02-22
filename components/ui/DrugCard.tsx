// components/ui/DrugCard.tsx — Detailed drug information card
import React from "react";
import { cn, formatDate } from "@/lib/utils";
import { SafetyBadge } from "./SafetyBadge";
import { ShieldCheck, ShieldAlert, MessageCircle, Volume2, Share2, Info } from "lucide-react";
import type { DrugCardProps } from "@/types";

export const DrugCard: React.FC<DrugCardProps> = ({
    drug,
    scanResult,
    showPregnancySafety = false,
    trimester = "first",
    onAskOlive,
    onReadAloud,
    className,
}) => {
    const pregnancyRisk = drug.trimester_risks[trimester];

    return (
        <div className={cn("card border-l-4 overflow-hidden",
            drug.is_authentic ? "border-l-safe-500" : "border-l-danger-500",
            className)}>

            {/* Header: Auth Status & Badge */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    {drug.is_authentic ? (
                        <div className="flex items-center gap-1.5 text-safe-600 font-bold text-sm">
                            <ShieldCheck className="w-5 h-5" />
                            AUTHENTIC
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-danger-600 font-bold text-sm">
                            <ShieldAlert className="w-5 h-5" />
                            LIKELY COUNTERFEIT
                        </div>
                    )}
                </div>
                <div className="text-xs text-muted-foreground bg-gray-100 rounded px-2 py-0.5">
                    Verified: {formatDate(drug.verified_date)}
                </div>
            </div>

            {/* Drug Details */}
            <div className="mb-4">
                <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100 leading-tight">
                    {drug.name}
                </h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold mt-1">
                    {drug.generic_name} • {drug.strength}
                </p>
                <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Manufacturer: </span>
                    <span className="font-medium">{drug.manufacturer}</span>
                </div>
                <div className="text-sm">
                    <span className="text-muted-foreground">NAFDAC No: </span>
                    <code className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded font-bold">
                        {drug.nafdac_number}
                    </code>
                </div>
            </div>

            {/* AI Recommendation */}
            {scanResult?.recommendation && (
                <div className="mb-4 p-4 rounded-2xl bg-primary-50 border border-primary-100 flex gap-3 shadow-inner ring-1 ring-white/50">
                    <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-primary-600 tracking-widest mb-1">Olive's Advice</p>
                        <p className="text-sm font-medium text-primary-900 leading-relaxed italic">
                            "{scanResult.recommendation}"
                        </p>
                    </div>
                </div>
            )}

            {/* Pregnancy Safety Filter */}
            {showPregnancySafety && (
                <div className="mb-4 p-3 rounded-xl bg-cream dark:bg-charcoal border border-border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">
                            Pregnancy Safety ({trimester} trimester)
                        </span>
                        <SafetyBadge level={pregnancyRisk} size="sm" />
                    </div>
                    <p className="text-sm leading-relaxed italic">
                        "{drug.pidgin_warning}"
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border mt-auto">
                <button
                    onClick={() => onAskOlive?.(drug.name)}
                    className="btn-primary py-2 px-4 h-auto text-xs flex-1"
                >
                    <MessageCircle className="w-4 h-4" />
                    Ask Olive
                </button>
                <button
                    onClick={onReadAloud}
                    className="btn-outline py-2 px-3 h-auto min-w-[48px]"
                    aria-label="Read drug details aloud"
                >
                    <Volume2 className="w-4 h-4" />
                </button>
                <button
                    className="btn-ghost py-2 px-3 h-auto min-w-[48px] border border-transparent"
                    aria-label="Share this result"
                >
                    <Share2 className="w-4 h-4" />
                </button>
                <button
                    className="btn-ghost py-2 px-3 h-auto min-w-[48px] border border-transparent"
                    aria-label="More information"
                >
                    <Info className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
