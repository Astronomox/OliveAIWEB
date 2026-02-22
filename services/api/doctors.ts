// services/api/doctors.ts — Doctor service (typed)
import { api, type ApiResponse } from "@/lib/api";
import type {
    DoctorResponse,
    DoctorSearchResponse,
    ConsultationRequest,
    ConsultationResponse,
    SuccessResponse,
} from "@/types/api";

export const doctorsApi = {
    /** GET /api/doctors — get all doctors */
    getAll(params?: {
        specialization?: string;
        location?: string;
        availability_status?: string;
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<DoctorSearchResponse>> {
        const searchParams = new URLSearchParams();
        if (params?.specialization) searchParams.set("specialization", params.specialization);
        if (params?.location) searchParams.set("location", params.location);
        if (params?.availability_status) searchParams.set("availability_status", params.availability_status);
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));
        
        const queryString = searchParams.toString();
        return api.get<DoctorSearchResponse>(`/api/doctors${queryString ? `?${queryString}` : ""}`);
    },

    /** GET /api/doctors/search?q=xxx — search doctors by name or specialization */
    search(query: string): Promise<ApiResponse<DoctorSearchResponse>> {
        return api.get<DoctorSearchResponse>(`/api/doctors/search?q=${encodeURIComponent(query)}`);
    },

    /** GET /api/doctors/{doctor_id} — get doctor details */
    get(doctorId: string): Promise<ApiResponse<DoctorResponse>> {
        return api.get<DoctorResponse>(`/api/doctors/${doctorId}`);
    },

    /** GET /api/doctors/specializations — get list of available specializations */
    getSpecializations(): Promise<ApiResponse<string[]>> {
        return api.get<string[]>("/api/doctors/specializations");
    },

    /** POST /api/doctors/{doctor_id}/consult — request consultation */
    requestConsultation(doctorId: string, data: ConsultationRequest): Promise<ApiResponse<ConsultationResponse>> {
        return api.post<ConsultationResponse>(`/api/doctors/${doctorId}/consult`, data);
    },

    /** GET /api/consultations/user/{user_id} — get user's consultation history */
    getConsultations(userId: string): Promise<ApiResponse<ConsultationResponse[]>> {
        return api.get<ConsultationResponse[]>(`/api/consultations/user/${userId}`);
    },
};