// lib/utils.ts — Shared utility functions
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with clsx — avoids class conflicts */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Generate a unique ID */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Format a date string for display */
export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/** Format time for display */
export function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

/** Get time-based greeting */
export function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
}
