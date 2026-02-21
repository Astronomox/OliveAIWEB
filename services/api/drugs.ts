// services/api/drugs.ts — Drug service (typed)
import { api, type ApiResponse } from "@/lib/api";
import type {
    DrugResponse,
    DrugSearchResponse,
    GenericResponse,
    DrugVerificationRequest,
    DrugVerificationResponse,
    SuccessResponse,
} from "@/types/api";

export const drugsApi = {
    /** GET /api/drugs/search?q=xxx — debounced search */
    search(query: string): Promise<ApiResponse<DrugSearchResponse>> {
        return api.get<DrugSearchResponse>(`/api/drugs/search?q=${encodeURIComponent(query)}`);
    },

    /** GET /api/drugs/{emdex_id} — full drug detail */
    get(emdexId: string): Promise<ApiResponse<DrugResponse>> {
        return api.get<DrugResponse>(`/api/drugs/${emdexId}`);
    },

    /** GET /api/drugs/{drug_name}/generics */
    getGenerics(drugName: string): Promise<ApiResponse<GenericResponse[]>> {
        return api.get<GenericResponse[]>(`/api/drugs/${encodeURIComponent(drugName)}/generics`);
    },

    /** GET /api/drugs/prices/compare?drug_name=xxx */
    comparePrices(drugName: string): Promise<ApiResponse<SuccessResponse>> {
        return api.get<SuccessResponse>(`/api/drugs/prices/compare?drug_name=${encodeURIComponent(drugName)}`);
    },

    /** POST /api/drugs/verify — NAFDAC registration number */
    verify(data: DrugVerificationRequest): Promise<ApiResponse<DrugVerificationResponse>> {
        return api.post<DrugVerificationResponse>("/api/drugs/verify", data);
    },

    /** POST /api/drugs/sync-emdex — ADMIN ONLY */
    syncEmdex(force = false): Promise<ApiResponse<SuccessResponse>> {
        return api.post<SuccessResponse>(`/api/drugs/sync-emdex?force=${force}`);
    },
};
