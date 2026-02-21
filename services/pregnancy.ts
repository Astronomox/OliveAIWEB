// services/pregnancy.ts — Pregnancy risk classification service
import type { NAFDACDrug, Trimester, RiskLevel, PregnancyCheckResult } from "@/types";
import { searchNAFDACDrugs } from "./nafdac";

/** Plain-language explanations for each risk level, by language */
const RISK_EXPLANATIONS = {
    safe: {
        en: "This medication is generally considered safe during your current trimester. Always follow the recommended dosage.",
        pidgin: "This medicine safe for your belle — you fit take am. But follow the dose wey doctor give you.",
    },
    caution: {
        en: "Use this medication only if your doctor prescribes it. There may be some risks, so do not self-medicate.",
        pidgin: "Only take this medicine if doctor give you. E get small risk, so no just take am by yourself.",
    },
    danger: {
        en: "Do NOT take this medication during pregnancy. It can harm your baby. Ask your doctor for a safer alternative.",
        pidgin: "NO take this medicine at all — e go harm your pikin for belle. Tell your doctor make e give you another one wey safe.",
    },
};

/** WHO category descriptions */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
    A: "Studies show no risk to the baby. Safe to use.",
    B: "Animal studies show no risk. Likely safe for humans.",
    C: "May have risks. Use only if benefit outweighs the risk.",
    D: "Evidence of risk. Use ONLY in life-threatening situations.",
    X: "PROVEN to cause birth defects. NEVER use during pregnancy.",
};

/**
 * Get the risk level for a specific drug in a specific trimester.
 */
export function getDrugRiskForTrimester(drug: NAFDACDrug, trimester: Trimester): RiskLevel {
    return drug.trimester_risks[trimester];
}

/**
 * Check if a drug is safe during pregnancy overall.
 */
export function isDrugPregnancySafe(drug: NAFDACDrug): boolean {
    return drug.pregnancy_safe;
}

/**
 * Get a complete pregnancy check result for display.
 */
export async function checkDrugPregnancySafety(
    drugNameOrId: string,
    trimester: Trimester,
    language: "en" | "pidgin" = "en"
): Promise<PregnancyCheckResult | null> {
    // Search for the drug
    const matches = await searchNAFDACDrugs(drugNameOrId);
    if (matches.length === 0) return null;

    const drug = matches[0];
    const currentRisk = getDrugRiskForTrimester(drug, trimester);

    // Find safe alternatives if drug is dangerous
    let alternatives: NAFDACDrug[] = [];
    if (currentRisk === "danger" && drug.safe_alternatives.length > 0) {
        for (const altName of drug.safe_alternatives) {
            const altMatches = await searchNAFDACDrugs(altName);
            if (altMatches.length > 0) {
                alternatives.push(altMatches[0]);
            }
        }
    }

    // Build trimester-specific warnings
    const trimesterWarnings: Record<Trimester, string> = {
        first: buildTrimesterWarning(drug, "first", language),
        second: buildTrimesterWarning(drug, "second", language),
        third: buildTrimesterWarning(drug, "third", language),
    };

    return {
        drug,
        riskData: {
            drugId: drug.id,
            generic_name: drug.generic_name,
            category: drug.pregnancy_category,
            overall_safe: drug.pregnancy_safe,
            trimester_risks: drug.trimester_risks,
            explanation_en: RISK_EXPLANATIONS[currentRisk].en,
            explanation_pidgin: RISK_EXPLANATIONS[currentRisk].pidgin,
            trimester_warnings: trimesterWarnings,
            safe_alternatives: drug.safe_alternatives,
            breastfeeding_safe: drug.breastfeeding_safe,
            breastfeeding_note: drug.breastfeeding_safe
                ? "Generally considered safe during breastfeeding."
                : "May pass into breast milk. Consult your doctor.",
        },
        currentRisk,
        currentTrimester: trimester,
        explanation: RISK_EXPLANATIONS[currentRisk][language],
        pidginExplanation: RISK_EXPLANATIONS[currentRisk].pidgin,
        alternatives,
    };
}

/**
 * Build a trimester-specific warning message.
 */
function buildTrimesterWarning(drug: NAFDACDrug, trimester: Trimester, language: "en" | "pidgin"): string {
    const risk = drug.trimester_risks[trimester];
    const trimesterNames = { first: "first trimester (weeks 1-12)", second: "second trimester (weeks 13-26)", third: "third trimester (weeks 27-40)" };
    const trimesterNamesPidgin = { first: "first 3 months", second: "middle 3 months", third: "last 3 months" };

    if (language === "pidgin") {
        if (risk === "safe") return `This medicine safe for ${trimesterNamesPidgin[trimester]}.`;
        if (risk === "caution") return `Take am with care for ${trimesterNamesPidgin[trimester]}. Doctor must approve.`;
        return `No take am for ${trimesterNamesPidgin[trimester]} at all! E dangerous.`;
    }

    if (risk === "safe") return `Considered safe during the ${trimesterNames[trimester]}.`;
    if (risk === "caution") return `Use with caution during the ${trimesterNames[trimester]}. Doctor supervision required.`;
    return `AVOID during the ${trimesterNames[trimester]}. Risk of harm to the baby.`;
}

/**
 * Get the WHO pregnancy category description.
 */
export function getCategoryDescription(category: string): string {
    return CATEGORY_DESCRIPTIONS[category] || "Category not available.";
}

/** Baby size comparisons by week number */
export const BABY_SIZE_BY_WEEK: Record<number, { emoji: string; name: string }> = {
    4: { emoji: "🌰", name: "poppy seed" },
    5: { emoji: "🫘", name: "sesame seed" },
    6: { emoji: "🫘", name: "lentil" },
    7: { emoji: "🫐", name: "blueberry" },
    8: { emoji: "🫒", name: "kidney bean" },
    9: { emoji: "🍇", name: "grape" },
    10: { emoji: "🍊", name: "kumquat" },
    12: { emoji: "🍋", name: "lime" },
    14: { emoji: "🍋", name: "lemon" },
    16: { emoji: "🥑", name: "avocado" },
    18: { emoji: "🫑", name: "bell pepper" },
    20: { emoji: "🍌", name: "banana" },
    22: { emoji: "🥕", name: "carrot" },
    24: { emoji: "🌽", name: "corn cob" },
    26: { emoji: "🥬", name: "lettuce head" },
    28: { emoji: "🍆", name: "eggplant" },
    30: { emoji: "🥥", name: "coconut" },
    32: { emoji: "🍈", name: "cantaloupe" },
    34: { emoji: "🍍", name: "pineapple" },
    36: { emoji: "🥦", name: "large cabbage" },
    38: { emoji: "🎃", name: "small pumpkin" },
    40: { emoji: "🍉", name: "watermelon" },
};

/** Get the closest baby size for a given week */
export function getBabySize(week: number): { emoji: string; name: string } {
    const weeks = Object.keys(BABY_SIZE_BY_WEEK).map(Number).sort((a, b) => a - b);
    let closest = weeks[0];
    for (const w of weeks) {
        if (w <= week) closest = w;
        else break;
    }
    return BABY_SIZE_BY_WEEK[closest] || { emoji: "👶", name: "your baby" };
}
