// constants/colors.ts — Olive AI brand color system

export const COLORS = {
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

    /* Status — Safe */
    safe: {
        light: "#E6FAF3",
        DEFAULT: "#00B894",
        dark: "#007D64",
    },

    /* Status — Caution */
    caution: {
        light: "#FEF5E7",
        DEFAULT: "#F39C12",
        dark: "#B3720C",
    },

    /* Status — Danger */
    danger: {
        light: "#FBEAEA",
        DEFAULT: "#D63031",
        dark: "#9E2324",
    },

    /* Backgrounds */
    background: {
        cream: "#FDFAF6",
        white: "#FFFFFF",
        dark: "#1A1A2E",
        darkCard: "#252542",
        darkElevated: "#2D2D52",
    },

    /* Text */
    text: {
        primary: "#1A1A2E",
        muted: "#6B7280",
        light: "#9CA3AF",
        white: "#FFFFFF",
        dark: "#F0F0F5",
    },

    /* UI */
    border: {
        light: "#E8E8E8",
        dark: "#3A3A5C",
    },
} as const;

/** Map risk level to color tokens */
export const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    safe: {
        bg: COLORS.safe.DEFAULT,
        text: COLORS.text.white,
        border: COLORS.safe.dark,
    },
    caution: {
        bg: COLORS.caution.DEFAULT,
        text: COLORS.text.primary,
        border: COLORS.caution.dark,
    },
    danger: {
        bg: COLORS.danger.DEFAULT,
        text: COLORS.text.white,
        border: COLORS.danger.dark,
    },
};

/** WHO Pregnancy category descriptions */
export const PREGNANCY_CATEGORY_INFO: Record<string, { label: string; description: string }> = {
    A: {
        label: "Category A — Safe",
        description: "Adequate studies show no risk to the fetus in any trimester.",
    },
    B: {
        label: "Category B — Likely Safe",
        description:
            "Animal studies show no risk, but no adequate human studies exist. Generally considered safe.",
    },
    C: {
        label: "Category C — Use with Caution",
        description:
            "Animal studies show adverse effects. Use only if potential benefits justify risks.",
    },
    D: {
        label: "Category D — Use Only if Necessary",
        description:
            "Evidence of human fetal risk. Use only in life-threatening situations when safer drugs are unavailable.",
    },
    X: {
        label: "Category X — Do NOT Use",
        description:
            "Studies show fetal abnormalities. Risks clearly outweigh any possible benefit. Contraindicated in pregnancy.",
    },
};
