/**
 * lib/api.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single, canonical HTTP client for Olive AI.
 *
 * ARCHITECTURE FIX: Eliminates the three competing HTTP implementations
 * (lib/api.ts, lib/api-client.ts, services/backend.ts).  This is the ONE
 * source of truth for making requests to the FastAPI backend.
 *
 * Features:
 *   - Automatic JWT Authorization header injection
 *   - 401 → token refresh → retry once
 *   - Render.com cold-start wake-up on first mount (see wakeUpBackend())
 *   - Request timeout (10s default)
 *   - Typed response helpers: apiGet, apiPost, apiPut, apiDelete
 *   - Normalised ApiError class for consistent error handling across the app
 *
 * Free platform recommendation:
 *   - Backend hosting: Railway (free tier, no cold starts) or Render (free, cold starts)
 *   - If on Render free tier: the wakeUpBackend() call below prevents blank dashboards
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getToken, clearAuthData } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  status: number;
  error: { message: string; code?: string; detail?: any } | null;
}

// ─── Configuration ────────────────────────────────────────────────────────────

// Backend URL with fallbacks for DNS resolution issues
const getBackendURL = () => {
  // Always use the configured backend URL directly
  const fallbackURLs = [
    process.env.NEXT_PUBLIC_BACKEND_URL,
    process.env.NEXT_PUBLIC_API_URL,
    "https://olive-backend-bly2.onrender.com",
    // Add alternative deployment URLs if available
    // "https://olive-ai-backend.railway.app",
    // "https://olive-backend-alternative.onrender.com",
  ].filter(Boolean);
  
  return fallbackURLs[0] || "https://olive-backend-bly2.onrender.com";
};

const BACKEND_URL = getBackendURL();

// Add debug logging for backend URL
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_API === "true") {
  console.log("🌐 Backend URL:", BACKEND_URL);
}

const DEFAULT_TIMEOUT_MS = 10_000;
const WAKE_UP_TIMEOUT_MS = 30_000; // Render cold starts can take up to 30s

// ─── Error Class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details: unknown;

  constructor(message: string, status: number, code = "API_ERROR", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

// ─── Backend Wake-Up (Render Free Tier) ──────────────────────────────────────

let _wakeUpPromise: Promise<void> | null = null;
let _isAwake = false;

/**
 * Pings the backend health endpoint to wake up a sleeping Render.com free-tier
 * instance. Call this early in the app lifecycle (e.g., in the root layout or
 * dashboard useEffect) to avoid the user staring at a blank screen for 30s.
 *
 * This function is safe to call multiple times — it only fires one request.
 */
export async function wakeUpBackend(): Promise<void> {
  if (_isAwake) return;

  if (!_wakeUpPromise) {
    _wakeUpPromise = (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), WAKE_UP_TIMEOUT_MS);

        await fetch(`${BACKEND_URL}/health`, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timer);
        _isAwake = true;
      } catch {
        // Wake-up failed (instance unavailable or timed out).
        // The app continues — individual requests will show their own errors.
        _isAwake = false;
        _wakeUpPromise = null;
      }
    })();
  }

  return _wakeUpPromise;
}

// ─── Core Request Function ────────────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
  /** Skip adding the Authorization header (e.g., login, signup) */
  skipAuth?: boolean;
  /** Skip the 401-refresh retry (prevents infinite loop inside the refresh call) */
  skipRefresh?: boolean;
}

/**
 * Core fetch wrapper. Handles:
 * - Base URL prepending
 * - Content-Type / Accept headers
 * - JWT injection
 * - Timeout via AbortController
 * - Error response normalization into ApiError
 * - 401 retry with token refresh (once)
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, timeoutMs = DEFAULT_TIMEOUT_MS, skipAuth = false, skipRefresh = false, ...fetchOptions } = options;

  // Build headers
  const headers = new Headers(fetchOptions.headers);

  // Content-Type handling for different body types
  if (body instanceof FormData) {
    // For FormData (file uploads), let the browser set Content-Type with boundary
    // Don't set Content-Type manually for FormData
  } else if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  // Inject JWT
  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Timeout via AbortController
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;

  // Prepare request body based on type
  let requestBody: string | FormData | undefined;
  if (body instanceof FormData) {
    requestBody = body; // Pass FormData directly without modification
  } else if (body !== undefined) {
    requestBody = JSON.stringify(body);
  } else {
    requestBody = undefined;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: requestBody,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(`Request to ${path} timed out after ${timeoutMs}ms`, 0, "TIMEOUT");
    }
    throw new ApiError(`Network error: ${(err as Error).message}`, 0, "NETWORK_ERROR");
  } finally {
    clearTimeout(timer);
  }

  // ── 401: Attempt token refresh once ──────────────────────────────────────
  if (response.status === 401 && !skipRefresh && !skipAuth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry original request with new token
      return request<T>(path, { ...options, skipRefresh: true });
    } else {
      // Refresh failed — user must log in again
      clearAuthData();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError("Session expired. Please log in again.", 401, "SESSION_EXPIRED");
    }
  }

  // ── Non-OK responses ──────────────────────────────────────────────────────
  if (!response.ok) {
    let errorBody: { detail?: string; message?: string; code?: string } = {};
    try {
      errorBody = await response.json();
    } catch {
      // Non-JSON error body — use status text
    }

    const message =
      errorBody.detail ?? errorBody.message ?? `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, errorBody.code ?? "API_ERROR", errorBody);
  }

  // ── 204 No Content ────────────────────────────────────────────────────────
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  // ── Parse JSON ────────────────────────────────────────────────────────────
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("Failed to parse server response as JSON", response.status, "PARSE_ERROR");
  }
}

// ─── Token Refresh ────────────────────────────────────────────────────────────

async function tryRefreshToken(): Promise<boolean> {
  // Import here to avoid circular dependency at module load time
  const { getAuthTokens, setAuthData, parseAuthResponse } = await import("@/lib/auth");

  const tokens = getAuthTokens();
  if (!tokens?.refreshToken) return false;

  try {
    const response = await request<{
      access_token: string;
      refresh_token?: string;
      token_type: string;
    }>("/auth/refresh", {
      method: "POST",
      body: { refresh_token: tokens.refreshToken },
      skipAuth: true,
      skipRefresh: true,
    });

    const parsed = parseAuthResponse(response);
    if (!parsed) return false;

    // Preserve existing user data while updating tokens
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = getCurrentUser();
    if (currentUser) {
      setAuthData(currentUser, parsed.tokens);
    }

    return true;
  } catch {
    return false;
  }
}

// ─── Typed HTTP Helpers ───────────────────────────────────────────────────────

export async function apiGet<T>(path: string, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
  return request<T>(path, { ...options, method: "GET" });
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">
): Promise<T> {
  return request<T>(path, { ...options, method: "POST", body });
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">
): Promise<T> {
  return request<T>(path, { ...options, method: "PUT", body });
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">
): Promise<T> {
  return request<T>(path, { ...options, method: "PATCH", body });
}

export async function apiDelete<T>(
  path: string,
  options?: Omit<RequestOptions, "method">
): Promise<T> {
  return request<T>(path, { ...options, method: "DELETE" });
}

// ─── Compatibility: api object wrapper ───────────────────────────────────────

/**
 * Modern wrapper that returns an ApiResponse object instead of throwing.
 * This matches the pattern expected by the services/api/ folder.
 */
async function wrap<T>(promise: Promise<T>, statusOnSuccess = 200): Promise<ApiResponse<T>> {
  try {
    const data = await promise;
    return { data, status: statusOnSuccess, error: null };
  } catch (err) {
    if (err instanceof ApiError) {
      return {
        data: null,
        status: err.status,
        error: { message: err.message, code: err.code, detail: err.details },
      };
    }
    return {
      data: null,
      status: 0,
      error: { message: (err as Error).message || "Unknown error" },
    };
  }
}

export const api = {
  get: <T>(path: string, opt?: any) => wrap<T>(apiGet<T>(path, opt)),
  post: <T>(path: string, body?: any, opt?: any) => wrap<T>(apiPost<T>(path, body, opt), 201),
  put: <T>(path: string, body?: any, opt?: any) => wrap<T>(apiPut<T>(path, body, opt)),
  patch: <T>(path: string, body?: any, opt?: any) => wrap<T>(apiPatch<T>(path, body, opt)),
  delete: <T>(path: string, opt?: any) => wrap<T>(apiDelete<T>(path, opt)),
  upload: <T>(path: string, fd: FormData, opt?: any) => wrap<T>(apiUpload<T>(path, fd, opt), 201),
};

// ─── Multipart / FormData Upload ──────────────────────────────────────────────

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options?: Omit<RequestOptions, "method" | "body" | "headers">
): Promise<T> {
  // Note: Do NOT set Content-Type manually — the browser sets it with the
  // correct multipart boundary when FormData is passed directly.
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options?.timeoutMs ?? 60_000);

  try {
    const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      let errorBody: { detail?: string } = {};
      try { errorBody = await response.json(); } catch { /* ignore */ }
      throw new ApiError(errorBody.detail ?? "Upload failed", response.status, "UPLOAD_ERROR");
    }

    return response.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Upload network error: ${(err as Error).message}`, 0, "NETWORK_ERROR");
  }
}

// ─── Utility: Safe Settled Fetches ────────────────────────────────────────────

/**
 * Like Promise.allSettled but returns typed results.
 * Use this instead of Promise.all for dashboard parallel fetches so
 * one failed API call doesn't kill the entire dashboard.
 *
 * @example
 * const [medications, reminders, profile] = await safeParallelFetch([
 *   () => apiGet('/medications'),
 *   () => apiGet('/reminders'),
 *   () => apiGet('/profile'),
 * ]);
 */
export async function safeParallelFetch<T extends readonly (() => Promise<unknown>)[]>(
  fetchers: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> | null }> {
  const results = await Promise.allSettled(fetchers.map((fn) => fn()));

  return results.map((result) =>
    result.status === "fulfilled" ? result.value : null
  ) as { [K in keyof T]: Awaited<ReturnType<T[K]>> | null };
}

export { BACKEND_URL };