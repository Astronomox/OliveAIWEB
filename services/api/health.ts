// services/api/health.ts — Health check + offline polling
import { api, type ApiResponse } from "@/lib/api";

export const healthApi = {
    /** GET /health — backend health check */
    check(): Promise<ApiResponse<Record<string, unknown>>> {
        return api.get<Record<string, unknown>>("/health");
    },
};
