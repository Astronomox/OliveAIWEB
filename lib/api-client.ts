// lib/api-client.ts — Medi-Sync AI API Client
import { APIError } from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://olive-backend-bly2.onrender.com";

class APIClient {
    private token: string | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem("olive-ai-token");
        }
    }

    setToken(token: string | null) {
        this.token = token;
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem("olive-ai-token", token);
            } else {
                localStorage.removeItem("olive-ai-token");
            }
        }
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;

        const headers = new Headers(options.headers);
        if (this.token) {
            headers.set("Authorization", `Bearer ${this.token}`);
        }
        if (!(options.body instanceof FormData)) {
            headers.set("Content-Type", "application/json");
        }

        const config = {
            ...options,
            headers,
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            let errorData: any;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { detail: "An unexpected error occurred" };
            }
            throw errorData as APIError;
        }

        if (response.status === 204) return {} as T;
        return response.json();
    }

    get<T>(endpoint: string, options: RequestInit = {}) {
        return this.request<T>(endpoint, { ...options, method: "GET" });
    }

    post<T>(endpoint: string, body?: any, options: RequestInit = {}) {
        const isFormData = body instanceof FormData;
        return this.request<T>(endpoint, {
            ...options,
            method: "POST",
            body: isFormData ? body : JSON.stringify(body),
        });
    }

    put<T>(endpoint: string, body?: any, options: RequestInit = {}) {
        const isFormData = body instanceof FormData;
        return this.request<T>(endpoint, {
            ...options,
            method: "PUT",
            body: isFormData ? body : JSON.stringify(body),
        });
    }

    delete<T>(endpoint: string, options: RequestInit = {}) {
        return this.request<T>(endpoint, { ...options, method: "DELETE" });
    }
}

export const apiClient = new APIClient();
