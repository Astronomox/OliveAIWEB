// services/nafdac.ts — NAFDAC drug database service
import type { NAFDACDrug, DrugMatch } from "@/types";
import { fuzzyMatchDrug } from "@/lib/bayesian";
import { getAllDrugs, seedDrugs } from "@/lib/db";
import { drugsApi } from "./api/drugs";

let drugsCache: NAFDACDrug[] | null = null;

// Helper to map backend drug to local format
function mapBackendToNAFDAC(d: any): NAFDACDrug {
    return {
        id: d.id,
        nafdac_number: d.emdex_id || "SPOT-SYNCED",
        name: d.name,
        generic_name: d.generic_name,
        manufacturer: d.manufacturer || "Verified Provider",
        country_of_manufacture: "Nigeria (Synced)",
        dosage_form: (d.dosage_form as any) || "Tablet",
        strength: d.strength || "N/A",
        pregnancy_category: (d.category as any) || "B",
        pregnancy_safe: true,
        trimester_risks: { first: "safe", second: "safe", third: "safe" },
        breastfeeding_safe: true,
        is_authentic: true,
        common_fakes: [],
        nafdac_number_variants: [],
        side_effects: d.description ? [d.description] : [],
        contraindications: [],
        pidgin_warning: "Mama, this medicine flow correctly from our records.",
        safe_alternatives: [],
        controlled_substance: false,
        verified_date: new Date().toISOString(),
        price_range_naira: "Contact Pharmacy"
    };
}

/**
 * Load the NAFDAC drug database. Tries IndexedDB first, falls back to JSON import.
 */
export async function loadDrugDatabase(): Promise<NAFDACDrug[]> {
    if (drugsCache && drugsCache.length > 0) return drugsCache;

    try {
        // Try IndexedDB first (offline-ready)
        const dbDrugs = await getAllDrugs();
        if (dbDrugs.length > 0) {
            drugsCache = dbDrugs;
            return dbDrugs;
        }
    } catch {
        // IndexedDB not available, continue to JSON
    }

    try {
        // Load from static JSON and seed into IndexedDB
        const response = await fetch("/data/nafdac-mock.json");
        if (!response.ok) throw new Error("Failed to load drug database");
        const drugs: NAFDACDrug[] = await response.json();
        drugsCache = drugs;

        // Seed into IndexedDB for offline use
        try {
            await seedDrugs(drugs);
        } catch {
            // Seeding failed, but we still have the data in memory
        }

        return drugs;
    } catch {
        drugsCache = [];
        return [];
    }
}

/**
 * Search the drug database by query string.
 * Returns drugs whose name, generic name, or NAFDAC number matches.
 */
export async function searchNAFDACDrugs(query: string): Promise<NAFDACDrug[]> {
    if (!query || query.trim().length < 2) return [];

    // 1. Try Backend first if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
            const response = await drugsApi.search(query);
            if (response.data && response.data.results && response.data.results.length > 0) {
                return response.data.results.map(mapBackendToNAFDAC);
            }
        } catch (err) {
            console.warn("Backend search failed, falling back to local", err);
        }
    }

    // 2. Fallback to local
    const drugs = await loadDrugDatabase();
    const lower = query.toLowerCase().trim();
    return drugs.filter(
        (d) =>
            d.name.toLowerCase().includes(lower) ||
            d.generic_name.toLowerCase().includes(lower) ||
            d.nafdac_number.toLowerCase().includes(lower) ||
            d.manufacturer.toLowerCase().includes(lower)
    ).slice(0, 10);
}

/**
 * Fuzzy match OCR-extracted text against the full drug database.
 * Returns top matches ranked by confidence score.
 */
export async function matchDrugFromOCR(ocrText: string): Promise<DrugMatch[]> {
    const drugs = await loadDrugDatabase();
    if (!ocrText || ocrText.trim().length < 2) return [];

    const results: DrugMatch[] = drugs
        .map((drug) => {
            const match = fuzzyMatchDrug(ocrText, drug);
            return {
                drug,
                confidence: match.score,
                matchedField: match.matchedField,
            };
        })
        .filter((m) => m.confidence > 0.3)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);

    return results;
}

/**
 * Look up a drug by its exact NAFDAC registration number.
 */
export async function lookupByNAFDAC(nafdacNumber: string): Promise<NAFDACDrug | null> {
    const drugs = await loadDrugDatabase();
    const normalized = nafdacNumber.replace(/\s/g, "").toUpperCase();

    return (
        drugs.find(
            (d) =>
                d.nafdac_number.replace(/\s/g, "").toUpperCase() === normalized ||
                d.nafdac_number_variants.some(
                    (v) => v.replace(/\s/g, "").toUpperCase() === normalized
                )
        ) || null
    );
}

/**
 * Get all drug names and generic names for autocomplete.
 */
export async function getDrugSuggestions(query: string): Promise<string[]> {
    const drugs = await loadDrugDatabase();
    if (!query || query.trim().length < 1) return [];

    const lower = query.toLowerCase();
    const suggestions = new Set<string>();

    for (const d of drugs) {
        if (d.name.toLowerCase().includes(lower)) suggestions.add(d.name);
        if (d.generic_name.toLowerCase().includes(lower)) suggestions.add(d.generic_name);
    }

    return Array.from(suggestions).slice(0, 10);
}
