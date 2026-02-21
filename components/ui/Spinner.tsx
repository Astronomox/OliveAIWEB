// components/ui/Spinner.tsx — Pure CSS animated spinner. No images, no GIFs.
// Guaranteed to spin everywhere via inline style animation.
import React from "react";

interface SpinnerProps {
    size?: number;
    color?: string;
    className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
    size = 24,
    color = "#0A6B4B",
    className = "",
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Loading"
        role="status"
        className={className}
        style={{
            animation: "spinner-spin 0.75s linear infinite",
            display: "inline-block",
            flexShrink: 0,
        }}
    >
        {/* Inline keyframes: guaranteed even if Tailwind purges */}
        <style>{`
            @keyframes spinner-spin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
            }
        `}</style>
        {/* Track */}
        <circle cx="12" cy="12" r="10" stroke="#E6EBE8" strokeWidth="3" />
        {/* Arc */}
        <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
        />
    </svg>
);

/** Full-page centered loading overlay */
export const PageSpinner: React.FC<{ label?: string }> = ({ label = "Loading..." }) => (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
        <Spinner size={52} />
        {label && <p className="text-sm font-bold text-muted-foreground">{label}</p>}
    </div>
);

/** Inline centered spinner for cards/sections */
export const SectionSpinner: React.FC<{ size?: number }> = ({ size = 36 }) => (
    <div className="flex items-center justify-center py-8">
        <Spinner size={size} />
    </div>
);
