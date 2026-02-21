// lib/api.ts — Central Medi-Sync AI API Client (NON-NEGOTIABLE single source)
// Every API call MUST go through this client. No raw fetch() in components.
// Token management delegated to lib/auth.ts

import {
    getToken, clearAuth, isTokenExpired,
} from "@/lib/auth";

const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://olive-backend-bly2.onrender.com";

// ─── Typed Response Wrapper ────────────────────────────────────
export interface ApiResponse<T> {
    data: T | null;
    error: ApiError | null;
    status: number;
}

export interface ApiError {
    message: string;
    fieldErrors?: Record<string, string>;
    statusCode: number;
}

export interface ValidationDetail {
    loc: (string | number)[];
    msg: string;
    type: string;
}

// ─── Re-export auth helpers so existing imports keep working ───
export {
    getToken, getUserId, setToken, setUserId, clearAuth,
} from "@/lib/auth";

// ─── Offline event bus ─────────────────────────────────────────
type OfflineListener = (offline: boolean) => void;
const offlineListeners: OfflineListener[] = [];

export function onOfflineChange(fn: OfflineListener) {
    offlineListeners.push(fn);
    return () => {
        const idx = offlineListeners.indexOf(fn);
        if (idx !== -1) offlineListeners.splice(idx, 1);
    };
}

function notifyOffline(offline: boolean) {
    offlineListeners.forEach((fn) => fn(offline));
}

// ─── Retry helper ──────────────────────────────────────────────
async function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

// ─── Core request function ─────────────────────────────────────
async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3
): Promise<ApiResponse<T>> {
    const url = `${BASE_URL}${endpoint}`;

    // Proactive token expiry check (skip for login/register/public endpoints)
    const isAuthEndpoint = endpoint.includes("/login") || endpoint.includes("/users/") && options.method === "POST" && !endpoint.includes("/verify");
    if (!isAuthEndpoint && isTokenExpired() && getToken()) {
        clearAuth();
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
            window.location.href = "/login?reason=session_expired";
        }
        return {
            data: null,
            error: { message: "Session expired. Please login again.", statusCode: 401 },
            status: 401,
        };
    }

    const headers = new Headers(options.headers);
    const token = getToken();
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    // Don't set Content-Type for FormData (browser sets multipart boundary)
    if (!(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const config: RequestInit = { ...options, headers };

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await fetch(url, config);

            // ── 401: Unauthorized → clear token → redirect ──────────
            if (response.status === 401) {
                clearAuth();
                if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
                    window.location.href = "/login?reason=unauthorized";
                }
                return {
                    data: null,
                    error: { message: "Session expired. Please login again.", statusCode: 401 },
                    status: 401,
                };
            }

            // ── 409: Conflict (duplicate registration) ──────────────
            if (response.status === 409) {
                let message = "An account with this email or phone already exists";
                try {
                    const body = await response.json();
                    message = typeof body.detail === "string" ? body.detail : body.message || message;
                } catch { }
                return {
                    data: null,
                    error: { message, statusCode: 409 },
                    status: 409,
                };
            }

            // ── 422: Validation Error → extract field errors ────────
            if (response.status === 422) {
                let fieldErrors: Record<string, string> = {};
                let message = "Validation failed";
                try {
                    const body = await response.json();
                    if (body.detail && Array.isArray(body.detail)) {
                        (body.detail as ValidationDetail[]).forEach((d) => {
                            const field = d.loc[d.loc.length - 1]?.toString() || "unknown";
                            fieldErrors[field] = d.msg;
                        });
                        message = Object.values(fieldErrors).join(". ");
                    } else if (typeof body.detail === "string") {
                        message = body.detail;
                    }
                } catch { }
                return {
                    data: null,
                    error: { message, fieldErrors, statusCode: 422 },
                    status: 422,
                };
            }

            // ── 503 / Server Error → retry ──────────────────────────
            if (response.status >= 500) {
                if (attempt < retries - 1) {
                    await sleep(Math.pow(2, attempt) * 500);
                    continue;
                }
                notifyOffline(true);
                return {
                    data: null,
                    error: { message: "Server is temporarily unavailable. Please try again.", statusCode: response.status },
                    status: response.status,
                };
            }

            // ── Other errors ────────────────────────────────────────
            if (!response.ok) {
                let message = "An unexpected error occurred";
                try {
                    const body = await response.json();
                    message = typeof body.detail === "string" ? body.detail : body.message || message;
                } catch { }
                return {
                    data: null,
                    error: { message, statusCode: response.status },
                    status: response.status,
                };
            }

            // ── Success ─────────────────────────────────────────────
            notifyOffline(false);
            if (response.status === 204) {
                return { data: {} as T, error: null, status: 204 };
            }
            const data = (await response.json()) as T;
            return { data, error: null, status: response.status };

        } catch (networkError) {
            // Network failure → retry with exponential backoff
            if (attempt < retries - 1) {
                await sleep(Math.pow(2, attempt) * 500);
                continue;
            }
            notifyOffline(true);
            return {
                data: null,
                error: { message: "Network error — please check your connection.", statusCode: 0 },
                status: 0,
            };
        }
    }

    return {
        data: null,
        error: { message: "Request failed after retries.", statusCode: 0 },
        status: 0,
    };
}

// ─── Public HTTP methods ───────────────────────────────────────
export const api = {
    get<T>(endpoint: string) {
        return request<T>(endpoint, { method: "GET" });
    },

    post<T>(endpoint: string, body?: unknown) {
        const isFormData = body instanceof FormData;
        return request<T>(endpoint, {
            method: "POST",
            body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
        });
    },

    put<T>(endpoint: string, body?: unknown) {
        const isFormData = body instanceof FormData;
        return request<T>(endpoint, {
            method: "PUT",
            body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
        });
    },

    delete<T>(endpoint: string) {
        return request<T>(endpoint, { method: "DELETE" });
    },
};
