// lib/accessibility.ts — Accessibility utility functions

/**
 * Announce a message to screen readers using aria-live region.
 * Creates a temporary live region, inserts the message, then cleans up.
 */
export function announceToScreenReader(
    message: string,
    priority: "polite" | "assertive" = "polite"
): void {
    if (typeof document === "undefined") return;

    const el = document.createElement("div");
    el.setAttribute("aria-live", priority);
    el.setAttribute("aria-atomic", "true");
    el.setAttribute("role", priority === "assertive" ? "alert" : "status");
    el.style.position = "absolute";
    el.style.width = "1px";
    el.style.height = "1px";
    el.style.overflow = "hidden";
    el.style.clip = "rect(0, 0, 0, 0)";
    el.style.whiteSpace = "nowrap";
    el.style.border = "0";

    document.body.appendChild(el);

    // Small delay lets screen reader detect the new live region
    setTimeout(() => {
        el.textContent = message;
    }, 100);

    // Clean up after announcement
    setTimeout(() => {
        document.body.removeChild(el);
    }, 3000);
}

/**
 * Trap keyboard focus inside a container element (for modals/dialogs).
 * Returns a cleanup function to restore normal focus behavior.
 */
export function trapFocus(container: HTMLElement): () => void {
    const focusableSelectors = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        '[tabindex]:not([tabindex="-1"])',
        "[contenteditable]",
    ].join(", ");

    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Store the element that had focus before trapping
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus the first element
    firstFocusable?.focus();

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key !== "Tab") return;

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable?.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable?.focus();
            }
        }
    }

    container.addEventListener("keydown", handleKeyDown);

    // Return cleanup function
    return () => {
        container.removeEventListener("keydown", handleKeyDown);
        previouslyFocused?.focus();
    };
}

/**
 * Get the current text size preference from localStorage.
 */
export function getCurrentTextSize(): "small" | "medium" | "large" | "xl" {
    if (typeof localStorage === "undefined") return "medium";
    return (localStorage.getItem("olive-ai-text-size") as "small" | "medium" | "large" | "xl") || "medium";
}

/**
 * Apply text size to document root.
 */
export function applyTextSize(size: "small" | "medium" | "large" | "xl"): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("text-size-small", "text-size-medium", "text-size-large", "text-size-xl");
    root.classList.add(`text-size-${size}`);
    localStorage.setItem("olive-ai-text-size", size);
}

/**
 * Check if high contrast mode is enabled.
 */
export function isHighContrast(): boolean {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem("olive-ai-high-contrast") === "true";
}

/**
 * Toggle high contrast mode.
 */
export function toggleHighContrast(enabled: boolean): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (enabled) {
        root.classList.add("high-contrast");
    } else {
        root.classList.remove("high-contrast");
    }
    localStorage.setItem("olive-ai-high-contrast", String(enabled));
}

/**
 * Calculate contrast ratio between two hex colors.
 * Returns ratio >= 4.5 for WCAG AA compliance on normal text.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
    function hexToRgb(hex: string): [number, number, number] {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return [0, 0, 0];
        return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
    }

    function luminance(r: number, g: number, b: number): number {
        const [rs, gs, bs] = [r, g, b].map((c) => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    const [r1, g1, b1] = hexToRgb(hex1);
    const [r2, g2, b2] = hexToRgb(hex2);
    const l1 = luminance(r1, g1, b1);
    const l2 = luminance(r2, g2, b2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color combination meets WCAG AA standards.
 */
export function meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
}
