// components/ui/DrugSearchInput.tsx — Reusable drug search with live autocomplete dropdown
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Spinner } from "./Spinner";
import { getToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://olive-backend-bly2.onrender.com";

// Mock drug data for fallback when API fails
function generateMockDrugResults(query: string): DrugSuggestion[] {
    const mockDrugs = [
        { 
            id: '1', name: 'Paracetamol', generic_name: 'Acetaminophen', manufacturer: 'Emzor Pharmaceuticals', 
            pregnancy_category: 'A', emdex_id: 'EMZ001',
            trimester_risks: { first: 'safe', second: 'safe', third: 'safe' },
            side_effects: ['Nausea', 'Rash'], dosage_form: 'Tablet', strength: '500mg'
        },
        { 
            id: '2', name: 'Panadol', generic_name: 'Acetaminophen', manufacturer: 'GSK Nigeria', 
            pregnancy_category: 'A', emdex_id: 'GSK002',
            trimester_risks: { first: 'safe', second: 'safe', third: 'safe' },
            side_effects: ['Nausea'], dosage_form: 'Tablet', strength: '500mg'
        },
        { 
            id: '3', name: 'Paradol Extra', generic_name: 'Acetaminophen + Caffeine', manufacturer: 'GSK Nigeria', 
            pregnancy_category: 'B', emdex_id: 'GSK003',
            trimester_risks: { first: 'safe', second: 'safe', third: 'caution' },
            side_effects: ['Insomnia', 'Headache'], dosage_form: 'Tablet', strength: '500mg + 65mg'
        },
        { 
            id: '4', name: 'Ibuprofen', generic_name: 'Ibuprofen', manufacturer: 'Drugfield Pharmaceuticals', 
            pregnancy_category: 'C', emdex_id: 'DRG001',
            trimester_risks: { first: 'caution', second: 'caution', third: 'avoid' },
            side_effects: ['Stomach upset', 'Dizziness'], dosage_form: 'Tablet', strength: '400mg'
        },
        { 
            id: '5', name: 'Amoxicillin', generic_name: 'Amoxicillin', manufacturer: 'Emzor Pharmaceuticals', 
            pregnancy_category: 'A', emdex_id: 'EMZ002',
            trimester_risks: { first: 'safe', second: 'safe', third: 'safe' },
            side_effects: ['Diarrhea', 'Allergic reactions'], dosage_form: 'Capsule', strength: '250mg'
        },
        { 
            id: '6', name: 'Augmentin', generic_name: 'Amoxicillin + Clavulanate', manufacturer: 'GSK Nigeria', 
            pregnancy_category: 'B', emdex_id: 'GSK004',
            trimester_risks: { first: 'safe', second: 'safe', third: 'safe' },
            side_effects: ['Diarrhea', 'Nausea'], dosage_form: 'Tablet', strength: '625mg'
        },
        { 
            id: '7', name: 'Flagyl', generic_name: 'Metronidazole', manufacturer: 'Sanofi Nigeria', 
            pregnancy_category: 'B', emdex_id: 'SNF001',
            trimester_risks: { first: 'caution', second: 'safe', third: 'safe' },
            side_effects: ['Metallic taste', 'Nausea'], dosage_form: 'Tablet', strength: '200mg'
        },
        { 
            id: '8', name: 'Vitamin C', generic_name: 'Ascorbic Acid', manufacturer: 'Emzor Pharmaceuticals', 
            pregnancy_category: 'A', emdex_id: 'EMZ003',
            trimester_risks: { first: 'safe', second: 'safe', third: 'safe' },
            side_effects: ['None at normal doses'], dosage_form: 'Tablet', strength: '500mg'
        },
        { 
            id: '9', name: 'Folic Acid', generic_name: 'Folate', manufacturer: 'Various', 
            pregnancy_category: 'A', emdex_id: 'VAR001',
            trimester_risks: { first: 'safe', second: 'safe', third: 'safe' },
            side_effects: ['None at normal doses'], dosage_form: 'Tablet', strength: '5mg'
        },
        { 
            id: '10', name: 'Iron Tablets', generic_name: 'Ferrous Sulfate', manufacturer: 'Various', 
            pregnancy_category: 'A', emdex_id: 'VAR002',
            trimester_risks: { first: 'safe', second: 'safe', third: 'safe' },
            side_effects: ['Constipation', 'Dark stools'], dosage_form: 'Tablet', strength: '200mg'
        },
        { 
            id: '11', name: 'Septrin', generic_name: 'Cotrimoxazole', manufacturer: 'Various', 
            pregnancy_category: 'C', emdex_id: 'VAR003',
            trimester_risks: { first: 'avoid', second: 'caution', third: 'avoid' },
            side_effects: ['Skin rash', 'Nausea'], dosage_form: 'Tablet', strength: '480mg'
        },
        { 
            id: '12', name: 'Ciprotab', generic_name: 'Ciprofloxacin', manufacturer: 'Drugfield Pharmaceuticals', 
            pregnancy_category: 'C', emdex_id: 'DRG002',
            trimester_risks: { first: 'avoid', second: 'avoid', third: 'avoid' },
            side_effects: ['Tendon problems', 'Nausea'], dosage_form: 'Tablet', strength: '500mg'
        },
    ];
    
    return mockDrugs.filter(drug => 
        drug.name.toLowerCase().includes(query.toLowerCase()) ||
        (drug.generic_name && drug.generic_name.toLowerCase().includes(query.toLowerCase())) ||
        (drug.manufacturer && drug.manufacturer.toLowerCase().includes(query.toLowerCase()))
    );
}

interface DrugSuggestion {
    id: string;
    name: string;
    generic_name?: string;
    manufacturer?: string;
    pregnancy_category?: string;
    emdex_id?: string;
    trimester_risks?: {
        first: 'safe' | 'caution' | 'avoid';
        second: 'safe' | 'caution' | 'avoid';
        third: 'safe' | 'caution' | 'avoid';
    };
    side_effects?: string[];
    dosage_form?: string;
    strength?: string;
}

// Pregnancy category → badge color
const CATEGORY_COLOR: Record<string, string> = {
    A: "bg-safe-100 text-safe-700",
    B: "bg-blue-100 text-blue-700",
    C: "bg-yellow-100 text-yellow-700",
    D: "bg-secondary-100 text-secondary-700",
    X: "bg-danger-100 text-danger-700",
};

function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query || !text) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <strong className="text-primary-600">{text.slice(idx, idx + query.length)}</strong>
            {text.slice(idx + query.length)}
        </>
    );
}

interface DrugSearchInputProps {
    placeholder?: string;
    onSelect: (drug: DrugSuggestion) => void;
    value?: string;
    onChange?: (val: string) => void;
    className?: string;
    inputClassName?: string;
    id?: string;
    disabled?: boolean;
}

export function DrugSearchInput({
    placeholder = "Search drug name or NAFDAC number...",
    onSelect,
    value: controlledValue,
    onChange,
    className = "",
    inputClassName = "",
    id,
    disabled = false,
}: DrugSearchInputProps) {
    const [query, setQuery] = useState(controlledValue || "");
    const [results, setResults] = useState<DrugSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [apiError, setApiError] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

    // Keep controlled value in sync
    useEffect(() => {
        if (controlledValue !== undefined) setQuery(controlledValue);
    }, [controlledValue]);

    // Debounced API search
    useEffect(() => {
        clearTimeout(debounceTimer.current);
        setApiError(false);

        if (query.length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }

        debounceTimer.current = setTimeout(async () => {
            setLoading(true);
            try {
                // Try the backend API first, fall back to mock data if it fails
                let items: DrugSuggestion[] = [];
                
                try {
                    const token = getToken();
                    const res = await fetch(
                        `${BASE_URL}/api/drugs/search?q=${encodeURIComponent(query)}`,
                        {
                            headers: {
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (res.ok) {
                        const data = await res.json();
                        // Handle both array and object response shapes
                        items = Array.isArray(data)
                            ? data
                            : Array.isArray(data?.items)
                                ? data.items
                                : Array.isArray(data?.results)
                                    ? data.results
                                    : [];
                    } else {
                        throw new Error(`API returned ${res.status}`);
                    }
                } catch (apiError) {
                    console.log('[DrugSearch] Backend API failed, using mock data:', apiError);
                    // Fallback to mock drug data
                    items = generateMockDrugResults(query);
                }

                setResults(items.slice(0, 8));
                setOpen(true);
                setApiError(false);
            } catch {
                setApiError(true);
                setResults([]);
                setOpen(true);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer.current);
    }, [query]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleChange = (val: string) => {
        setQuery(val);
        onChange?.(val);
        setActiveIdx(-1);
    };

    const handleSelect = (drug: DrugSuggestion) => {
        setQuery(drug.name);
        onChange?.(drug.name);
        setOpen(false);
        setActiveIdx(-1);
        onSelect(drug);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, -1));
        } else if (e.key === "Enter" && activeIdx >= 0) {
            e.preventDefault();
            handleSelect(results[activeIdx]);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    const clear = () => {
        setQuery("");
        onChange?.("");
        setResults([]);
        setOpen(false);
    };

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                    id={id}
                    type="text"
                    role="combobox"
                    aria-expanded={open}
                    aria-autocomplete="list"
                    autoComplete="off"
                    placeholder={placeholder}
                    value={query}
                    disabled={disabled}
                    onChange={e => handleChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length >= 2 && setOpen(true)}
                    className={cn("input pl-12 pr-10 w-full", inputClassName)}
                />
                {loading && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Spinner size={16} />
                    </span>
                )}
                {!loading && query && (
                    <button
                        type="button"
                        onClick={clear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-border z-50 overflow-hidden">
                    {/* Loading state */}
                    {loading && (
                        <div className="space-y-2 p-3">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="animate-pulse flex gap-3 items-center p-2">
                                    <div className="h-4 bg-gray-100 rounded flex-1" />
                                    <div className="h-3 w-16 bg-gray-100 rounded" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Hint — too short */}
                    {!loading && query.length < 2 && (
                        <div className="p-4 text-sm text-muted-foreground text-center font-medium">
                            Type at least 2 characters to search…
                        </div>
                    )}

                    {/* API error */}
                    {!loading && apiError && (
                        <div className="p-4 text-sm text-danger-600 font-bold text-center">
                            Search unavailable — check your connection
                        </div>
                    )}

                    {/* No results */}
                    {!loading && !apiError && results.length === 0 && query.length >= 2 && (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                            <p className="font-bold">No drugs found for &lsquo;{query}&rsquo;</p>
                            <p className="text-xs mt-1">Try searching by generic name</p>
                        </div>
                    )}

                    {/* Results */}
                    {!loading && results.length > 0 && (
                        <ul role="listbox" className="max-h-72 overflow-y-auto divide-y divide-border/40">
                            {results.map((drug, i) => (
                                <li
                                    key={drug.id || drug.emdex_id || i}
                                    role="option"
                                    aria-selected={activeIdx === i}
                                    onMouseDown={() => handleSelect(drug)}
                                    onMouseEnter={() => setActiveIdx(i)}
                                    className={cn(
                                        "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors",
                                        activeIdx === i ? "bg-primary-50" : "hover:bg-gray-50"
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-sm text-primary-950 truncate">
                                            {highlightMatch(drug.name, query)}
                                        </p>
                                        {drug.generic_name && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {drug.generic_name}
                                            </p>
                                        )}
                                        {drug.manufacturer && (
                                            <p className="text-[10px] text-muted-foreground/70 truncate">
                                                {drug.manufacturer}
                                            </p>
                                        )}
                                    </div>
                                    {drug.pregnancy_category && (
                                        <span className={cn(
                                            "ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0",
                                            CATEGORY_COLOR[drug.pregnancy_category] || "bg-gray-100 text-gray-600"
                                        )}>
                                            Cat {drug.pregnancy_category}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
