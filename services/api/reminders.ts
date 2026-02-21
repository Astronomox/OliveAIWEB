// services/api/reminders.ts — Reminder service (typed)
import { api, type ApiResponse } from "@/lib/api";
import type {
    ReminderResponse,
    ReminderUpdate,
    ReminderStatsResponse,
    RemindersResult,
    SuccessResponse,
} from "@/types/api";

export const remindersApi = {
    /** POST /api/reminders/{medication_id} — schedule reminders (body: string[]) */
    schedule(medicationId: number, times: string[]): Promise<ApiResponse<ReminderResponse[]>> {
        return api.post<ReminderResponse[]>(`/api/reminders/${medicationId}`, times);
    },

    /** GET /api/reminders/user/{user_id}?status=pending&days=7 */
    getAll(userId: string, status?: string, days?: number): Promise<ApiResponse<ReminderResponse[]>> {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (days) params.set("days", String(days));
        const qs = params.toString() ? `?${params.toString()}` : "";
        return api.get<ReminderResponse[]>(`/api/reminders/user/${userId}${qs}`);
    },

    /** GET /api/reminders/user/{user_id}/stats */
    getStats(userId: string): Promise<ApiResponse<ReminderStatsResponse>> {
        return api.get<ReminderStatsResponse>(`/api/reminders/user/${userId}/stats`);
    },

    /** GET /api/reminders/{reminder_id} */
    get(reminderId: number): Promise<ApiResponse<ReminderResponse>> {
        return api.get<ReminderResponse>(`/api/reminders/${reminderId}`);
    },

    /** PUT /api/reminders/{reminder_id} */
    update(reminderId: number, data: ReminderUpdate): Promise<ApiResponse<ReminderResponse>> {
        return api.put<ReminderResponse>(`/api/reminders/${reminderId}`, data);
    },

    /** DELETE /api/reminders/{reminder_id} */
    delete(reminderId: number): Promise<ApiResponse<SuccessResponse>> {
        return api.delete<SuccessResponse>(`/api/reminders/${reminderId}`);
    },

    /** POST /api/reminders/{reminder_id}/send — test send */
    send(reminderId: number): Promise<ApiResponse<SuccessResponse>> {
        return api.post<SuccessResponse>(`/api/reminders/${reminderId}/send`);
    },

    /** POST /api/reminders/pending/send-all — fire all due */
    sendAllPending(): Promise<ApiResponse<RemindersResult>> {
        return api.post<RemindersResult>("/api/reminders/pending/send-all");
    },

    /** POST /api/reminders/{reminder_id}/snooze?minutes=X */
    snooze(reminderId: number, minutes = 10): Promise<ApiResponse<SuccessResponse>> {
        return api.post<SuccessResponse>(`/api/reminders/${reminderId}/snooze?minutes=${minutes}`);
    },

    /** POST /api/reminders/{reminder_id}/taken */
    markTaken(reminderId: number): Promise<ApiResponse<SuccessResponse>> {
        return api.post<SuccessResponse>(`/api/reminders/${reminderId}/taken`);
    },
};
