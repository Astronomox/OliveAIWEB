// services/api/users.ts — User service (typed, uses central api client + lib/auth)
import { api, type ApiResponse } from "@/lib/api";
import { setToken, setUserId, clearAuth, setCachedUser } from "@/lib/auth";
import type {
    UserCreate,
    LoginRequest,
    TokenResponse,
    UserResponse,
    UserUpdate,
    SuccessResponse,
} from "@/types/api";

export const usersApi = {
    /** POST /api/users/ — Register */
    async register(data: UserCreate): Promise<ApiResponse<TokenResponse>> {
        const res = await api.post<TokenResponse>("/api/users/", data);
        if (res.data) {
            setToken(res.data.access_token);
            setUserId(res.data.user.id);
            setCachedUser(res.data.user);
        }
        return res;
    },

    /** POST /api/users/login — Login */
    async login(creds: LoginRequest): Promise<ApiResponse<TokenResponse>> {
        const res = await api.post<TokenResponse>("/api/users/login", creds);
        if (res.data) {
            setToken(res.data.access_token);
            setUserId(res.data.user.id);
            setCachedUser(res.data.user);
        }
        return res;
    },

    /** POST /api/users/logout */
    async logout(): Promise<ApiResponse<SuccessResponse>> {
        const res = await api.post<SuccessResponse>("/api/users/logout");
        clearAuth(); // Always clear regardless of API response
        return res;
    },

    /** GET /api/users/{user_id} */
    getUser(userId: string): Promise<ApiResponse<UserResponse>> {
        return api.get<UserResponse>(`/api/users/${userId}`);
    },

    /** PUT /api/users/{user_id} */
    async updateUser(userId: string, data: UserUpdate): Promise<ApiResponse<UserResponse>> {
        const res = await api.put<UserResponse>(`/api/users/${userId}`, data);
        if (res.data) setCachedUser(res.data);
        return res;
    },

    /** DELETE /api/users/{user_id} */
    deleteUser(userId: string): Promise<ApiResponse<SuccessResponse>> {
        return api.delete<SuccessResponse>(`/api/users/${userId}`);
    },

    /** GET /api/users/phone/{phone_number} — check if phone exists */
    getUserByPhone(phone: string): Promise<ApiResponse<UserResponse>> {
        return api.get<UserResponse>(`/api/users/phone/${encodeURIComponent(phone)}`);
    },

    /** POST /api/users/{user_id}/verify-phone — send OTP */
    verifyPhone(userId: string, otp?: string): Promise<ApiResponse<SuccessResponse>> {
        if (otp) {
            return api.post<SuccessResponse>(`/api/users/${userId}/verify-phone`, { otp_code: otp });
        }
        return api.post<SuccessResponse>(`/api/users/${userId}/verify-phone`);
    },

    /** POST /api/users/{user_id}/verify-email — send verification email */
    verifyEmail(userId: string): Promise<ApiResponse<SuccessResponse>> {
        return api.post<SuccessResponse>(`/api/users/${userId}/verify-email`);
    },

    /** POST /api/users/{user_id}/confirm-email?otp_code=xxx */
    confirmEmail(userId: string, otpCode: string): Promise<ApiResponse<SuccessResponse>> {
        return api.post<SuccessResponse>(`/api/users/${userId}/confirm-email?otp_code=${encodeURIComponent(otpCode)}`);
    },

    /** Get cached user from sessionStorage */
    getCachedUser(): UserResponse | null {
        const { getCachedUser: getAuthCachedUser } = require("@/lib/auth");
        return getAuthCachedUser<UserResponse>();
    },
};
