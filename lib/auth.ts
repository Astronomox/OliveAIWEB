// lib/auth.ts — Token & auth management (NON-NEGOTIABLE single source)
// Cookie + localStorage dual storage. JWT decode without verification (client-side).

const TOKEN_KEY = "smama_token";
const USER_ID_KEY = "smama_user_id";
const USER_CACHE_KEY = "smama_user";

// ─── JWT Payload Type ──────────────────────────────────────────
export interface JWTPayload {
    sub?: string;       // user_id
    user_id?: string;
    email?: string;
    exp?: number;
    iat?: number;
    [key: string]: unknown;
}

// ─── Cookie helpers ────────────────────────────────────────────
function setCookie(name: string, value: string, days = 7) {
    if (typeof document === "undefined") return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict; Secure`;
}

function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict; Secure`;
}

// ─── Token Management ──────────────────────────────────────────

/** Store token in both localStorage AND cookie */
export function setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
    setCookie(TOKEN_KEY, token);
}

/** Read token — cookie first (SSR safe), fallback to localStorage */
export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return getCookie(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

/** Clear token from everywhere */
export function clearToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    deleteCookie(TOKEN_KEY);
}

// ─── User ID Management ────────────────────────────────────────

export function setUserId(id: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_ID_KEY, id);
    setCookie(USER_ID_KEY, id);
}

export function getUserId(): string | null {
    if (typeof window === "undefined") return null;
    return getCookie(USER_ID_KEY) || localStorage.getItem(USER_ID_KEY);
}

export function clearUserId(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(USER_ID_KEY);
    deleteCookie(USER_ID_KEY);
}

// ─── User Cache ────────────────────────────────────────────────

export function setCachedUser(user: unknown): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

export function getCachedUser<T>(): T | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
}

// ─── Full Clear ────────────────────────────────────────────────

/** Clear ALL auth data from client — called on logout or 401 */
export function clearAuth(): void {
    clearToken();
    clearUserId();
    if (typeof window === "undefined") return;
    localStorage.removeItem(USER_CACHE_KEY);
    localStorage.removeItem("smama_user_profile");
}

// ─── JWT Decode (client-side, no verification) ─────────────────

/** Decode JWT payload without verifying signature */
export function getTokenPayload(): JWTPayload | null {
    const token = getToken();
    if (!token) return null;
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = parts[1];
        // Base64url → Base64 → decode
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(padded);
        return JSON.parse(decoded) as JWTPayload;
    } catch {
        return null;
    }
}

/** Check if token is expired or within 5 min of expiry (proactive window) */
export function isTokenExpired(): boolean {
    const payload = getTokenPayload();
    if (!payload || !payload.exp) return true;
    const nowSec = Math.floor(Date.now() / 1000);
    const bufferSec = 5 * 60; // 5-minute proactive window
    return payload.exp - bufferSec <= nowSec;
}

/** Full auth check: token exists AND is not expired */
export function isAuthenticated(): boolean {
    const token = getToken();
    if (!token) return false;
    return !isTokenExpired();
}

/** Extract user_id from JWT payload */
export function getUserIdFromToken(): string | null {
    const payload = getTokenPayload();
    if (!payload) return null;
    return (payload.sub || payload.user_id || null) as string | null;
}

// ─── Auth Headers ──────────────────────────────────────────────

/** Returns Authorization header for API calls */
export function getAuthHeaders(): { Authorization: string } | Record<string, never> {
    const token = getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}
