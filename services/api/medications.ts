// services/api/medications.ts — Medication service (typed)
import { api, type ApiResponse } from "@/lib/api";
import type {
    MedicationCreate,
    MedicationUpdate,
    MedicationResponse,
    SuccessResponse,
} from "@/types/api";

export const medicationsApi = {
    /** POST /api/medications/{user_id} */
    create(userId: string, data: MedicationCreate): Promise<ApiResponse<MedicationResponse>> {
        // Validate reminder_times format before sending to backend
        const validatedData = {
            ...data,
            reminder_times: data.reminder_times.map(time => {
                // Ensure time is in HH:MM format
                if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) {
                    throw new Error(`Invalid reminder time format: ${time}. Expected HH:MM format.`);
                }
                return time;
            })
        };

        // Debug logging for development
        if (process.env.NODE_ENV === 'development') {
            console.log('📊 Medication Create:', {
                userId,
                drugName: data.drug_name,
                reminderTimes: data.reminder_times,
                validatedData
            });
        }

        return api.post<MedicationResponse>(`/api/medications/${userId}`, validatedData);
    },

    /** GET /api/medications/user/{user_id}?status=active */
    getAll(userId: string, status?: string): Promise<ApiResponse<MedicationResponse[]>> {
        const qs = status ? `?status=${status}` : "";
        return api.get<MedicationResponse[]>(`/api/medications/user/${userId}${qs}`);
    },

    /** GET /api/medications/{medication_id} */
    get(medicationId: number): Promise<ApiResponse<MedicationResponse>> {
        return api.get<MedicationResponse>(`/api/medications/${medicationId}`);
    },

    /** PUT /api/medications/{medication_id} */
    update(medicationId: number, data: MedicationUpdate): Promise<ApiResponse<MedicationResponse>> {
        return api.put<MedicationResponse>(`/api/medications/${medicationId}`, data);
    },

    /** DELETE /api/medications/{medication_id} */
    delete(medicationId: number): Promise<ApiResponse<SuccessResponse>> {
        return api.delete<SuccessResponse>(`/api/medications/${medicationId}`);
    },

    /** POST /api/medications/{medication_id}/side-effect?effect=xxx */
    addSideEffect(medicationId: number, effect: string): Promise<ApiResponse<SuccessResponse>> {
        return api.post<SuccessResponse>(
            `/api/medications/${medicationId}/side-effect?effect=${encodeURIComponent(effect)}`
        );
    },

    /** POST /api/medications/{medication_id}/compliance — Mark as Taken */
    recordCompliance(medicationId: number): Promise<ApiResponse<MedicationResponse>> {
        return api.post<MedicationResponse>(`/api/medications/${medicationId}/compliance`);
    },
};
