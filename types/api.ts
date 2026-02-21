// types/api.ts — Types matching the LIVE Medi-Sync AI OpenAPI schema exactly
// These are the REAL types returned by the backend. No made-up fields.

/* ═══════════════════════════════════════════════
   Auth & User Types
   ═══════════════════════════════════════════════ */

export interface UserCreate {
    phone_number: string;
    email?: string | null;
    name?: string | null;
    age?: number | null;
    gender?: string | null;
    language_preference?: string | null;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface UserResponse {
    id: string;
    phone_number: string;
    email?: string | null;
    name?: string | null;
    age?: number | null;
    gender?: string | null;
    language_preference?: string | null;
    reminders_enabled: boolean;
    email_reminders_enabled: boolean;
    email_verified: boolean;
    created_at: string;
}

export interface UserUpdate {
    name?: string | null;
    age?: number | null;
    gender?: string | null;
    email?: string | null;
    language_preference?: string | null;
    reminders_enabled?: boolean | null;
    email_reminders_enabled?: boolean | null;
    password?: string | null;
}

export interface TokenResponse {
    user: UserResponse;
    access_token: string;
    token_type: string;
}

/* ═══════════════════════════════════════════════
   Prescription Types
   ═══════════════════════════════════════════════ */

export interface PrescriptionCreate {
    image_url?: string | null;
    ocr_text?: string | null;
}

export interface PrescriptionUpdate {
    status?: string | null;
    verified_by_user?: boolean | null;
}

export interface DrugInput {
    drug_name: string;
    dosage?: string | null;
    frequency?: string | null;
    duration?: string | null;
    emdex_id?: string | null;
}

export interface PrescriptionResponse {
    id: number;
    user_id: string;
    image_url?: string | null;
    ocr_text?: string | null;
    ocr_confidence?: number | null;
    status: string;
    verified_by_user: boolean;
    created_at: string;
    drugs?: DrugInput[] | null;
}

export interface OCRApiResponse {
    text: string;
    confidence: number;
    drugs: DrugInput[];
}

/* ═══════════════════════════════════════════════
   Medication Types
   ═══════════════════════════════════════════════ */

export interface MedicationCreate {
    prescription_id?: number | null;
    drug_name: string;
    dosage?: string | null;
    frequency?: string | null;
    start_date: string;
    end_date?: string | null;
    reminder_times: string[];
    side_effects?: string[] | null;
}

export interface MedicationUpdate {
    dosage?: string | null;
    frequency?: string | null;
    end_date?: string | null;
    reminder_times?: string[] | null;
    status?: string | null;
    side_effects?: string[] | null;
}

export interface MedicationResponse {
    id: number;
    user_id: string;
    prescription_id: number | null;
    drug_name: string;
    dosage: string | null;
    frequency: string | null;
    start_date: string;
    end_date: string | null;
    reminder_times: string | null;
    reminders_sent: number;
    status: string;
    side_effects: string | null;
    created_at: string;
}

/* ═══════════════════════════════════════════════
   Reminder Types
   ═══════════════════════════════════════════════ */

export interface ReminderResponse {
    id: number;
    user_id: string;
    medication_id: number;
    reminder_datetime: string;
    sent: boolean;
    delivery_status: string;
    whatsapp_message_id: string | null;
    created_at: string;
    drug_name?: string | null;
    dosage?: string | null;
}

export interface ReminderUpdate {
    delivery_status?: string | null;
    sent?: boolean | null;
}

export interface ReminderStatsResponse {
    total: number;
    sent: number;
    taken: number;
    pending: number;
}

export interface RemindersResult {
    sent: number;
    failed: number;
    errors?: Record<string, unknown>[];
}

/* ═══════════════════════════════════════════════
   Drug Types
   ═══════════════════════════════════════════════ */

export interface DrugResponse {
    emdex_id: string;
    name: string;
    generic_name: string | null;
    price_naira: number;
    manufacturer: string;
    generics?: GenericResponse[];
}

export interface DrugSearchResponse {
    results: DrugResponse[];
}

export interface GenericResponse {
    name: string;
    price_naira: number;
    manufacturer: string;
    savings: number;
}

export interface DrugVerificationRequest {
    reg_number: string;
}

export interface DrugVerificationResponse {
    status: string;
    message: string;
    product_details?: Record<string, unknown> | null;
    verification_tips: string[];
}

/* ═══════════════════════════════════════════════
   Common Response Types
   ═══════════════════════════════════════════════ */

export interface SuccessResponse {
    success: boolean;
    message?: string | null;
    data?: Record<string, unknown> | null;
}
