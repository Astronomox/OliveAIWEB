// lib/bayesian.ts — Fuzzy matching for OCR drug text recognition

/**
 * Calculate Levenshtein distance between two strings.
 * Used to handle OCR errors and misspellings in drug names.
 */
export function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Normalize text for comparison — handles common OCR misreads.
 * Maps characters that OCR frequently confuses.
 */
export function normalizeOCRText(text: string): string {
    return (
        text
            .toLowerCase()
            .trim()
            // Common OCR character confusions
            .replace(/0/g, "o")
            .replace(/1/g, "l")
            .replace(/rn/g, "m")
            .replace(/vv/g, "w")
            .replace(/cl/g, "d")
            .replace(/\|/g, "l")
            .replace(/5/g, "s")
            .replace(/8/g, "b")
            // Remove special characters
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, " ")
    );
}

/**
 * Calculate similarity score between two strings (0 to 1).
 * 1 = perfect match, 0 = completely different.
 */
export function similarityScore(input: string, target: string): number {
    const normalizedInput = normalizeOCRText(input);
    const normalizedTarget = normalizeOCRText(target);

    if (normalizedInput === normalizedTarget) return 1;

    const maxLen = Math.max(normalizedInput.length, normalizedTarget.length);
    if (maxLen === 0) return 1;

    const distance = levenshteinDistance(normalizedInput, normalizedTarget);
    return 1 - distance / maxLen;
}

/**
 * Check if input contains the target as a substring (normalized).
 * Returns a score based on how much of the input matches.
 */
export function substringScore(input: string, target: string): number {
    const normalizedInput = normalizeOCRText(input);
    const normalizedTarget = normalizeOCRText(target);

    if (normalizedInput.includes(normalizedTarget)) return 0.95;
    if (normalizedTarget.includes(normalizedInput)) return 0.85;

    // Check individual words
    const inputWords = normalizedInput.split(" ");
    const targetWords = normalizedTarget.split(" ");

    let matchedWords = 0;
    for (const tw of targetWords) {
        if (inputWords.some((iw) => similarityScore(iw, tw) > 0.8)) {
            matchedWords++;
        }
    }

    return targetWords.length > 0 ? matchedWords / targetWords.length : 0;
}

/**
 * Check if a text matches known fake drug name variants.
 * Returns high confidence if it matches a known counterfeit spelling.
 */
export function checkFakeVariants(input: string, fakes: string[]): boolean {
    const normalizedInput = normalizeOCRText(input);
    return fakes.some((fake) => {
        const normalizedFake = normalizeOCRText(fake);
        return (
            normalizedInput.includes(normalizedFake) ||
            similarityScore(normalizedInput, normalizedFake) > 0.85
        );
    });
}

/** Result of fuzzy matching a drug */
export interface FuzzyMatchResult {
    id: string;
    score: number;
    matchedField: "name" | "nafdac_number" | "generic_name" | "manufacturer";
    isFakeVariant: boolean;
}

/**
 * Fuzzy match extracted OCR text against a drug database entry.
 * Combines multiple scoring strategies for robust matching.
 */
export function fuzzyMatchDrug(
    ocrText: string,
    drug: {
        id: string;
        name: string;
        generic_name: string;
        nafdac_number: string;
        manufacturer: string;
        common_fakes: string[];
        nafdac_number_variants: string[];
    }
): FuzzyMatchResult {
    const isFakeVariant = checkFakeVariants(ocrText, drug.common_fakes);
    let bestScore = 0;
    let bestField: FuzzyMatchResult["matchedField"] = "name";

    // Score against brand name
    const nameScore = Math.max(
        similarityScore(ocrText, drug.name),
        substringScore(ocrText, drug.name)
    );
    if (nameScore > bestScore) {
        bestScore = nameScore;
        bestField = "name";
    }

    // Score against generic name
    const genericScore = Math.max(
        similarityScore(ocrText, drug.generic_name),
        substringScore(ocrText, drug.generic_name)
    );
    if (genericScore > bestScore) {
        bestScore = genericScore;
        bestField = "generic_name";
    }

    // Score against NAFDAC number (exact or variant match)
    const nafdacNormalized = ocrText.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();
    for (const variant of [drug.nafdac_number, ...drug.nafdac_number_variants]) {
        const variantNorm = variant.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();
        if (nafdacNormalized.includes(variantNorm)) {
            bestScore = 0.98;
            bestField = "nafdac_number";
            break;
        }
    }

    // Score against manufacturer
    const mfgScore = substringScore(ocrText, drug.manufacturer);
    if (mfgScore > 0.7 && bestScore < 0.5) {
        // Only use manufacturer if nothing else matched well
        bestScore = mfgScore * 0.6; // Weight manufacturer matches lower
        bestField = "manufacturer";
    }

    return {
        id: drug.id,
        score: Math.min(bestScore, 1),
        matchedField: bestField,
        isFakeVariant,
    };
}

/**
 * Validate a NAFDAC registration number format.
 * Valid formats: A4-1234, B4-12345, 04-1234 etc.
 */
export function isValidNAFDACNumber(number: string): boolean {
    const pattern = /^[A-Z0-9]{1,2}\d?-\d{4,6}$/i;
    return pattern.test(number.trim());
}

/**
 * Extract potential NAFDAC numbers from raw OCR text.
 */
export function extractNAFDACNumbers(text: string): string[] {
    const pattern = /[A-Z0-9]{1,2}\d?-\d{4,6}/gi;
    const matches = text.match(pattern);
    return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Extract potential expiry dates from OCR text.
 * Handles formats: EXP 01/2025, EXPIRY: 2025-01, USE BEFORE 01.2025, etc.
 */
export function extractExpiryDate(text: string): string | null {
    const patterns = [
        /(?:exp(?:iry)?|use before|best before|bb)[:\s]*(\d{1,2}[\/.\\-]\d{2,4})/i,
        /(?:exp(?:iry)?|use before|best before|bb)[:\s]*(\d{4}[\/.\\-]\d{1,2})/i,
        /(\d{1,2}[\/.\\-]\d{4})\s*(?:exp)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[1];
    }
    return null;
}

/**
 * Check if an expiry date is still valid (not expired).
 */
export function isExpiryValid(expiryStr: string): boolean | null {
    try {
        // Try various date formats
        const cleaned = expiryStr.replace(/[\\./]/g, "-");
        const parts = cleaned.split("-");

        let year: number, month: number;

        if (parts[0].length === 4) {
            year = parseInt(parts[0]);
            month = parseInt(parts[1]) - 1;
        } else if (parts[1].length === 4) {
            month = parseInt(parts[0]) - 1;
            year = parseInt(parts[1]);
        } else if (parts.length === 2 && parts[1].length === 2) {
            month = parseInt(parts[0]) - 1;
            year = 2000 + parseInt(parts[1]);
        } else {
            return null;
        }

        if (isNaN(year) || isNaN(month)) return null;

        const expiryDate = new Date(year, month + 1, 0); // Last day of month
        return expiryDate > new Date();
    } catch {
        return null;
    }
}
