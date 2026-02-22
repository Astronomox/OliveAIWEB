// types/index.ts — All TypeScript interfaces for Olive AI

/* ═══════════════════════════════════════════════
   NAFDAC Drug Types
   ═══════════════════════════════════════════════ */

/** Risk level for a drug in a specific context */
export type RiskLevel = "safe" | "caution" | "danger";

/** WHO Pregnancy Drug Categories */
export type PregnancyCategory = "A" | "B" | "C" | "D" | "X";

/** Trimester identifiers */
export type Trimester = "first" | "second" | "third";

/** Dosage form */
export type DosageForm =
    | "Tablet"
    | "Capsule"
    | "Syrup"
    | "Suspension"
    | "Injection"
    | "Cream"
    | "Ointment"
    | "Drops"
    | "Powder"
    | "Sachet"
    | "Suppository"
    | "Inhaler"
    | "Solution";

/** A single drug entry from the NAFDAC mock database */
export interface NAFDACDrug {
    id: string;
    nafdac_number: string;
    name: string;
    generic_name: string;
    manufacturer: string;
    country_of_manufacture: string;
    dosage_form: DosageForm;
    strength: string;
    pregnancy_category: PregnancyCategory;
    pregnancy_safe: boolean;
    trimester_risks: {
        first: RiskLevel;
        second: RiskLevel;
        third: RiskLevel;
    };
    breastfeeding_safe: boolean;
    is_authentic: boolean;
    common_fakes: string[];
    nafdac_number_variants: string[];
    side_effects: string[];
    contraindications: string[];
    pidgin_warning: string;
    safe_alternatives: string[];
    controlled_substance: boolean;
    verified_date: string;
    price_range_naira: string;
}

/* ═══════════════════════════════════════════════
   Drug Scan Types
   ═══════════════════════════════════════════════ */

/** Raw text extraction from OCR */
export interface OCRResult {
    rawText: string;
    drugName: string | null;
    nafdacNumber: string | null;
    manufacturer: string | null;
    expiryDate: string | null;
    batchNumber: string | null;
    strength: string | null;
    confidence: number;
}

/** A matched drug with confidence score from bayesian/fuzzy matching */
export interface DrugMatch {
    drug: NAFDACDrug;
    confidence: number;
    matchedField: "name" | "nafdac_number" | "generic_name" | "manufacturer";
    recommendation?: string;
}

/** The complete result of scanning and matching a drug */
export interface DrugScanResult {
    status: "authentic" | "counterfeit" | "unverified";
    ocrResult: OCRResult;
    matches: DrugMatch[];
    bestMatch: DrugMatch | null;
    expiryValid: boolean | null;
    scannedAt: string;
    imageDataUrl?: string;
    recommendation?: string; // Added for pregnancy history
    drug?: NAFDACDrug;       // Added for legacy/simplified history
    confidence?: number;     // Added for legacy/simplified history
}

/* ═══════════════════════════════════════════════
   Pregnancy Types
   ═══════════════════════════════════════════════ */

/** Pregnancy risk data for a specific drug */
export interface PregnancyRiskData {
    drugId: string;
    generic_name: string;
    category: PregnancyCategory;
    overall_safe: boolean;
    trimester_risks: {
        first: RiskLevel;
        second: RiskLevel;
        third: RiskLevel;
    };
    explanation_en: string;
    explanation_pidgin: string;
    trimester_warnings: {
        first: string;
        second: string;
        third: string;
    };
    safe_alternatives: string[];
    breastfeeding_safe: boolean;
    breastfeeding_note: string;
}

/** Pregnancy check result for display */
export interface PregnancyCheckResult {
    drug: NAFDACDrug;
    riskData: PregnancyRiskData;
    currentRisk: RiskLevel;
    currentTrimester: Trimester;
    explanation: string;
    pidginExplanation: string;
    alternatives: NAFDACDrug[];
}

/* ═══════════════════════════════════════════════
   Voice / Chat Types
   ═══════════════════════════════════════════════ */

/** Language preference */
export type Language = "en" | "pidgin";

/** A single message in the AI conversation */
export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    language: Language;
    isEmergency?: boolean;
}

/** A full conversation session */
export interface Conversation {
    id: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
    previewText: string;
    title: string;
}

/** Voice recognition state */
export type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

/* ═══════════════════════════════════════════════
   User Profile Types
   ═══════════════════════════════════════════════ */

/** User profile information stored in IndexedDB */
export interface UserProfile {
    id: string;
    name: string;
    isPregnant: "yes" | "no" | "prefer_not_to_say";
    trimester: Trimester | null;
    weekNumber: number | null;
    hasVisualImpairment: boolean;
    language: Language;
    onboardingComplete: boolean;
    createdAt: string;
    updatedAt: string;
}

/** Accessibility settings */
export interface AccessibilitySettings {
    textSize: "small" | "medium" | "large" | "xl";
    highContrast: boolean;
    voiceSpeed: "slow" | "normal" | "fast";
    autoReadResults: boolean;
    darkMode: boolean;
}

/* ═══════════════════════════════════════════════
   Medication Reminder Types
   ═══════════════════════════════════════════════ */

/** Frequency options for reminders */
export type ReminderFrequency = "once" | "twice" | "thrice" | "custom";

/** A medication reminder */
export interface MedicationReminder {
    id: string;
    drugName: string;
    genericName?: string;
    dose: string;
    frequency: ReminderFrequency;
    times: string[]; // HH:MM format
    startDate: string;
    endDate?: string;
    isActive: boolean;
    language: Language;
    createdAt: string;
}

/* ═══════════════════════════════════════════════
   Health Log Types
   ═══════════════════════════════════════════════ */

/** A daily health log entry */
export interface HealthLogEntry {
    id: string;
    date: string;
    mood: "great" | "good" | "okay" | "poor" | "bad";
    symptoms: string[];
    notes: string;
    bloodPressure?: string;
    weight?: number;
    fetalMovement?: "active" | "normal" | "reduced" | "none";
    createdAt: string;
}

/* ═══════════════════════════════════════════════
   Emergency Types
   ═══════════════════════════════════════════════ */

/** Emergency severity levels */
export type EmergencySeverity = "critical" | "high" | "moderate";

/** An emergency contact */
export interface EmergencyContact {
    name: string;
    number: string;
    description: string;
    area?: string;
}

/** Emergency detection result */
export interface EmergencyDetection {
    isEmergency: boolean;
    severity: EmergencySeverity;
    condition: string;
    instruction: string;
    pidginInstruction: string;
    triggerKeywords: string[];
}

/* ═══════════════════════════════════════════════
   Offline / Sync Types
   ═══════════════════════════════════════════════ */

/** Sync status */
export interface SyncStatus {
    isOnline: boolean;
    lastSyncedAt: string | null;
    pendingActions: number;
}

/** Offline-queued action for background sync */
export interface QueuedAction {
    id: string;
    type: "ai_query" | "drug_lookup";
    payload: Record<string, unknown>;
    createdAt: string;
}

/* ═══════════════════════════════════════════════
   API Types
   ═══════════════════════════════════════════════ */

/** Gemini API request body */
export interface GeminiRequest {
    message: string;
    language: Language;
    conversationHistory: ChatMessage[];
    userProfile?: Partial<UserProfile>;
}

/** Gemini API response */
export interface GeminiResponse {
    reply: string;
    isEmergency: boolean;
    emergencyData?: EmergencyDetection;
}

/** OCR API request body */
export interface OCRRequest {
    imageBase64: string;
}

/** OCR API response */
export interface OCRResponse {
    success: boolean;
    ocrResult: OCRResult | null;
    error?: string;
}

/** NAFDAC lookup API request */
export interface NAFDACLookupRequest {
    query: string;
    field?: "name" | "nafdac_number" | "generic_name";
}

/** NAFDAC lookup API response */
export interface NAFDACLookupResponse {
    success: boolean;
    matches: DrugMatch[];
    totalFound: number;
}

/* ═══════════════════════════════════════════════
   Component Prop Types
   ═══════════════════════════════════════════════ */

/** SafetyBadge props */
export interface SafetyBadgeProps {
    level: RiskLevel;
    label?: string;
    size?: "sm" | "md" | "lg";
    showIcon?: boolean;
    className?: string;
}

/** VoiceButton props */
export interface VoiceButtonProps {
    state: VoiceState;
    onStart: () => void;
    onStop: () => void;
    size?: "sm" | "md" | "lg";
    className?: string;
    disabled?: boolean;
}

/** DrugCard props */
export interface DrugCardProps {
    drug: NAFDACDrug;
    scanResult?: DrugScanResult;
    showPregnancySafety?: boolean;
    trimester?: Trimester;
    onAskOlive?: (drugName: string) => void;
    onReadAloud?: () => void;
    className?: string;
}

/** RiskMeter props */
export interface RiskMeterProps {
    level: RiskLevel;
    category: PregnancyCategory;
    label: string;
    showDetails?: boolean;
    className?: string;
}

/** OfflineBanner props */
export interface OfflineBannerProps {
    isOnline: boolean;
    lastSynced?: string;
    className?: string;
}

/** EmergencyOverlay props */
export interface EmergencyOverlayProps {
    isVisible: boolean;
    emergency: EmergencyDetection;
    onDismiss: () => void;
    caregiverPhone?: string;
}

/** ScanOverlay props */
export interface ScanOverlayProps {
    isScanning: boolean;
    className?: string;
}

/* ═══════════════════════════════════════════════
   Health Tips
   ═══════════════════════════════════════════════ */

/** A daily health tip */
export interface HealthTip {
    id: number;
    tip_en: string;
    tip_pidgin: string;
    category: "nutrition" | "exercise" | "safety" | "mental_health" | "baby" | "general";
    trimester_relevant?: Trimester[];
}
/* ═══════════════════════════════════════════════
   Medi-Sync Backend API Types
   ═══════════════════════════════════════════════ */

export interface BackendUser {
    id: string;
    email: string;
    phone_number?: string;
    full_name: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
}

export interface AuthToken {
    access_token: string;
    token_type: string;
    user: BackendUser;
}

export interface BackendDrug {
    id: string;
    name: string;
    generic_name: string;
    emdex_id?: string;
    description?: string;
    dosage_form?: string;
    strength?: string;
    manufacturer?: string;
    category?: string;
}

export interface BackendPrescription {
    id: string;
    user_id: string;
    doctor_name?: string;
    hospital_name?: string;
    status: "active" | "completed" | "cancelled";
    image_url?: string;
    scanned_text?: string;
    created_at: string;
    medications?: BackendMedication[];
}

export interface BackendMedication {
    id: string;
    user_id: string;
    drug_id: string;
    prescription_id?: string;
    dosage: string;
    frequency: string;
    start_date: string;
    end_date?: string;
    instructions?: string;
    reminder_times: string[]; // HH:MM
    is_active: boolean;
    drug?: BackendDrug;
}

export interface BackendReminder {
    id: string;
    medication_id: string;
    user_id: string;
    scheduled_time: string;
    status: "pending" | "sent" | "taken" | "snoozed" | "missed";
    compliance_id?: string;
    medication?: BackendMedication;
}

export interface ReminderStats {
    total_scheduled: number;
    total_taken: number;
    total_missed: number;
    compliance_rate: number;
}

export interface SuccessResponse {
    message: string;
    data?: any;
}

export interface APIError {
    detail: string | { msg: string; type: string; loc: any[] }[];
}
