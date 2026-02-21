// services/backend.ts — Comprehensive Medi-Sync AI Service
import { apiClient } from "../lib/api-client";
import {
    BackendUser,
    AuthToken,
    BackendPrescription,
    BackendMedication,
    BackendReminder,
    ReminderStats,
    BackendDrug,
    SuccessResponse
} from "../types";

/* ═══════════════════════════════════════════════
   Users Service
   ═══════════════════════════════════════════════ */
export const usersService = {
    create: (data: any) => apiClient.post<BackendUser>("/api/users/", data),

    login: async (credentials: any) => {
        const response = await apiClient.post<AuthToken>("/api/users/login", credentials);
        if (response.access_token) {
            apiClient.setToken(response.access_token);
            if (typeof window !== 'undefined') {
                localStorage.setItem("olive-ai-user", JSON.stringify(response.user));
            }
        }
        return response;
    },

    logout: () => {
        apiClient.setToken(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem("olive-ai-user");
        }
        return apiClient.post<SuccessResponse>("/api/users/logout");
    },

    get: (userId: string) => apiClient.get<BackendUser>(`/api/users/${userId}`),

    update: (userId: string, data: any) => apiClient.put<BackendUser>(`/api/users/${userId}`, data),

    delete: (userId: string) => apiClient.delete<SuccessResponse>(`/api/users/${userId}`),

    getByPhone: (phone: string) => apiClient.get<BackendUser>(`/api/users/phone/${phone}`),

    verifyPhone: (userId: string, code: string) => apiClient.post<SuccessResponse>(`/api/users/${userId}/verify-phone`, { code }),

    verifyEmail: (userId: string) => apiClient.post<SuccessResponse>(`/api/users/${userId}/verify-email`),

    confirmEmail: (userId: string, code: string) => apiClient.post<SuccessResponse>(`/api/users/${userId}/confirm-email`, { code }),

    getCurrentUser: (): BackendUser | null => {
        if (typeof window === 'undefined') return null;
        const user = localStorage.getItem("olive-ai-user");
        return user ? JSON.parse(user) : null;
    }
};

/* ═══════════════════════════════════════════════
   Prescriptions Service
   ═══════════════════════════════════════════════ */
export const prescriptionsService = {
    create: (userId: string, data: any) => apiClient.post<BackendPrescription>(`/api/prescriptions/${userId}`, data),

    getUserPrescriptions: (userId: string) => apiClient.get<BackendPrescription[]>(`/api/prescriptions/${userId}`),

    uploadImage: (userId: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiClient.post<BackendPrescription>(`/api/prescriptions/${userId}/upload`, formData);
    },

    get: (prescriptionId: string) => apiClient.get<BackendPrescription>(`/api/prescriptions/${prescriptionId}`),

    update: (prescriptionId: string, data: any) => apiClient.put<BackendPrescription>(`/api/prescriptions/${prescriptionId}`, data),

    delete: (prescriptionId: string) => apiClient.delete<SuccessResponse>(`/api/prescriptions/${prescriptionId}`),

    addDrug: (prescriptionId: string, drugData: any) => apiClient.post<BackendPrescription>(`/api/prescriptions/${prescriptionId}/drugs`, drugData),
};

/* ═══════════════════════════════════════════════
   Medications Service
   ═══════════════════════════════════════════════ */
export const medicationsService = {
    create: (userId: string, data: any) => apiClient.post<BackendMedication>(`/api/medications/${userId}`, data),

    get: (medicationId: string) => apiClient.get<BackendMedication>(`/api/medications/${medicationId}`),

    update: (medicationId: string, data: any) => apiClient.put<BackendMedication>(`/api/medications/${medicationId}`, data),

    delete: (medicationId: string) => apiClient.delete<SuccessResponse>(`/api/medications/${medicationId}`),

    getUserMedications: (userId: string) => apiClient.get<BackendMedication[]>(`/api/medications/user/${userId}`),

    addSideEffect: (medicationId: string, sideEffect: string) => apiClient.post<SuccessResponse>(`/api/medications/${medicationId}/side-effect`, { side_effect: sideEffect }),

    recordCompliance: (medicationId: string, taken: boolean) => apiClient.post<SuccessResponse>(`/api/medications/${medicationId}/compliance`, { taken, timestamp: new Date().toISOString() }),
};

/* ═══════════════════════════════════════════════
   Reminders Service
   ═══════════════════════════════════════════════ */
export const remindersService = {
    schedule: (medicationId: string, data: any) => apiClient.post<BackendReminder[]>(`/api/reminders/${medicationId}`, data),

    get: (reminderId: string) => apiClient.get<BackendReminder>(`/api/reminders/${reminderId}`),

    update: (reminderId: string, data: any) => apiClient.put<BackendReminder>(`/api/reminders/${reminderId}`, data),

    delete: (reminderId: string) => apiClient.delete<SuccessResponse>(`/api/reminders/${reminderId}`),

    getUserReminders: (userId: string) => apiClient.get<BackendReminder[]>(`/api/reminders/user/${userId}`),

    getUserStats: (userId: string) => apiClient.get<ReminderStats>(`/api/reminders/user/${userId}/stats`),

    sendManual: (reminderId: string) => apiClient.post<SuccessResponse>(`/api/reminders/${reminderId}/send`),

    sendAllPending: () => apiClient.post<SuccessResponse>("/api/reminders/pending/send-all"),

    snooze: (reminderId: string, minutes: number = 15) => apiClient.post<BackendReminder>(`/api/reminders/${reminderId}/snooze`, { minutes }),

    markTaken: (reminderId: string) => apiClient.post<SuccessResponse>(`/api/reminders/${reminderId}/taken`),
};

/* ═══════════════════════════════════════════════
   Drugs Service
   ═══════════════════════════════════════════════ */
export const drugsService = {
    search: (query: string) => apiClient.get<BackendDrug[]>(`/api/drugs/search?q=${encodeURIComponent(query)}`),

    get: (emdexId: string) => apiClient.get<BackendDrug>(`/api/drugs/${emdexId}`),

    getGenerics: (drugName: string) => apiClient.get<BackendDrug[]>(`/api/drugs/${encodeURIComponent(drugName)}/generics`),

    syncEmdex: () => apiClient.post<SuccessResponse>("/api/drugs/sync-emdex"),

    comparePrices: (drugName: string) => apiClient.get<any>(`/api/drugs/prices/compare?q=${encodeURIComponent(drugName)}`),
};
