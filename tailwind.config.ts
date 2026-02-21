// tailwind.config.ts — Olive AI design system
import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                /* Brand Primary — Deep Emerald Green */
                primary: {
                    50: "#E6F5F0",
                    100: "#C0E6D8",
                    200: "#96D4BE",
                    300: "#6BC3A4",
                    400: "#4BB591",
                    500: "#0A6B4B",
                    600: "#085F42",
                    700: "#065038",
                    800: "#04412D",
                    900: "#022E1F",
                    DEFAULT: "#0A6B4B",
                },
                /* Brand Secondary — Warm Gold */
                secondary: {
                    50: "#FEF7E8",
                    100: "#FDECC5",
                    200: "#FBDF9E",
                    300: "#F9D177",
                    400: "#F7C44D",
                    500: "#F5A623",
                    600: "#D98E1A",
                    700: "#B87614",
                    800: "#965E0F",
                    900: "#6B430A",
                    DEFAULT: "#F5A623",
                },
                /* Status Colors */
                safe: {
                    50: "#E6FAF3",
                    100: "#B3F0DD",
                    200: "#80E6C7",
                    300: "#4DDCB1",
                    400: "#26D4A1",
                    500: "#00B894",
                    600: "#009A7B",
                    700: "#007D64",
                    800: "#00604D",
                    900: "#004436",
                    DEFAULT: "#00B894",
                },
                caution: {
                    50: "#FEF5E7",
                    100: "#FDE6C3",
                    200: "#FBD59B",
                    300: "#F9C473",
                    400: "#F7B54F",
                    500: "#F39C12",
                    600: "#D4870F",
                    700: "#B3720C",
                    800: "#925C0A",
                    900: "#6B4307",
                    DEFAULT: "#F39C12",
                },
                danger: {
                    50: "#FBEAEA",
                    100: "#F5CBCB",
                    200: "#EDA8A8",
                    300: "#E68585",
                    400: "#E06A6A",
                    500: "#D63031",
                    600: "#BC2A2B",
                    700: "#9E2324",
                    800: "#801C1D",
                    900: "#5C1415",
                    DEFAULT: "#D63031",
                },
                /* Background */
                cream: "#FDFAF6",
                charcoal: "#1A1A2E",
                /* Neutral / UI */
                border: "#E8E8E8",
                muted: "#6B7280",
                "muted-foreground": "#9CA3AF",
            },
            fontFamily: {
                heading: ["var(--font-jakarta)", "system-ui", "sans-serif"],
                body: ["var(--font-inter)", "system-ui", "sans-serif"],
            },
            fontSize: {
                /* Accessibility — generous minimum sizes */
                "body-sm": ["0.875rem", { lineHeight: "1.5" }],
                body: ["1rem", { lineHeight: "1.6" }],
                "body-lg": ["1.125rem", { lineHeight: "1.6" }],
                "heading-sm": ["1.25rem", { lineHeight: "1.3" }],
                heading: ["1.5rem", { lineHeight: "1.3" }],
                "heading-lg": ["2rem", { lineHeight: "1.2" }],
                "heading-xl": ["2.5rem", { lineHeight: "1.1" }],
                "heading-2xl": ["3rem", { lineHeight: "1.1" }],
            },
            spacing: {
                "touch-min": "48px",
                "touch-lg": "60px",
                18: "4.5rem",
                88: "22rem",
            },
            borderRadius: {
                "2xl": "1rem",
                "3xl": "1.5rem",
                "4xl": "2rem",
            },
            boxShadow: {
                card: "0 2px 16px rgba(0, 0, 0, 0.06)",
                "card-hover": "0 8px 30px rgba(10, 107, 75, 0.12)",
                glow: "0 0 20px rgba(10, 107, 75, 0.25)",
                "glow-danger": "0 0 20px rgba(214, 48, 49, 0.35)",
            },
            animation: {
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
                "scan-line": "scan-line 2s ease-in-out infinite",
                "fade-in": "fade-in 0.5s ease-out",
                "fade-in-up": "fade-in-up 0.6s ease-out",
                "slide-up": "slide-up 0.4s ease-out",
                "slide-down": "slide-down 0.3s ease-out",
                float: "float 6s ease-in-out infinite",
                shimmer: "shimmer 2s linear infinite",
            },
            keyframes: {
                "pulse-ring": {
                    "0%": { transform: "scale(0.8)", opacity: "1" },
                    "100%": { transform: "scale(2.2)", opacity: "0" },
                },
                "scan-line": {
                    "0%, 100%": { top: "0%" },
                    "50%": { top: "100%" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "fade-in-up": {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-up": {
                    "0%": { opacity: "0", transform: "translateY(100%)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-down": {
                    "0%": { opacity: "0", transform: "translateY(-10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
            screens: {
                xs: "375px",
                sm: "640px",
                md: "768px",
                lg: "1024px",
                xl: "1280px",
                "2xl": "1440px",
            },
        },
    },
    plugins: [],
};

export default config;
