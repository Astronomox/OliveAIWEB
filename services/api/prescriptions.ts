// services/api/prescriptions.ts — Prescription service (typed)
import { api, type ApiResponse } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import type {
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse,
    DrugInput,
    OCRApiResponse,
    SuccessResponse,
} from "@/types/api";

export const prescriptionsApi = {
    /** POST /api/prescriptions/{user_id} */
    create(userId: string, data: PrescriptionCreate): Promise<ApiResponse<PrescriptionResponse>> {
        return api.post<PrescriptionResponse>(`/api/prescriptions/${userId}`, data);
    },

    /** GET /api/prescriptions/{user_id} — all prescriptions */
    getAll(userId: string): Promise<ApiResponse<PrescriptionResponse[]>> {
        return api.get<PrescriptionResponse[]>(`/api/prescriptions/${userId}`);
    },

    /** POST /api/prescriptions/{user_id}/upload — multipart image upload + OCR */
    async upload(userId: string, file: File, autoMatch = true): Promise<ApiResponse<OCRApiResponse>> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("auto_match", String(autoMatch));
        return api.post<OCRApiResponse>(`/api/prescriptions/${userId}/upload`, formData);
    },

    /** GET /api/prescriptions/{prescription_id} — single */
    get(prescriptionId: number): Promise<ApiResponse<PrescriptionResponse>> {
        return api.get<PrescriptionResponse>(`/api/prescriptions/${prescriptionId}`);
    },

    /** PUT /api/prescriptions/{prescription_id} */
    update(prescriptionId: number, data: PrescriptionUpdate): Promise<ApiResponse<PrescriptionResponse>> {
        return api.put<PrescriptionResponse>(`/api/prescriptions/${prescriptionId}`, data);
    },

    /** DELETE /api/prescriptions/{prescription_id} */
    delete(prescriptionId: number): Promise<ApiResponse<SuccessResponse>> {
        return api.delete<SuccessResponse>(`/api/prescriptions/${prescriptionId}`);
    },

    /** POST /api/prescriptions/{prescription_id}/drugs */
    addDrug(prescriptionId: number, drug: DrugInput): Promise<ApiResponse<SuccessResponse>> {
        return api.post<SuccessResponse>(`/api/prescriptions/${prescriptionId}/drugs`, drug);
    },
};
