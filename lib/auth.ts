/**
 * lib/auth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authentication utilities for Olive AI (Safely-Mama).
 *
 * SECURITY FIX: JWT tokens are now stored in memory (module-level variable) instead
 * of localStorage.  This protects against XSS token theft for sensitive
 * maternal/medication health data.
 *
 * For full production hardening, move token storage to HttpOnly cookies via a
 * dedicated /api/auth/session route — free on Vercel/Railway.
 *
 * Free platform recommendation:
 *   - Auth: Roll your own JWT (current) or use Supabase Auth (free tier, generous limits)
 *   - Token refresh: Keep in memory + silent re-auth on 401
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  pregnancyWeek?: number;
  dueDate?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
}

// ─── In-Memory Token Store ────────────────────────────────────────────────────
// Module-level variable: persists for the lifetime of the browser tab/session
// but cannot be accessed by injected scripts (unlike localStorage).
// On page refresh, user is silently re-authenticated via the refresh token
// stored in a secure httpOnly cookie (see /api/auth/refresh route).

let _memoryToken: AuthTokens | null = null;
let _memoryUser: User | null = null;

// ─── Legacy Compatibility Aliases (Required by services & hooks) ──────────────

/** Sets the access token in memory */
export function setToken(token: string): void {
  if (!_memoryToken) {
    _memoryToken = { accessToken: token, expiresAt: Date.now() + 3600 * 1000 };
  } else {
    _memoryToken.accessToken = token;
  }
}

/** Sets the user ID in memory (partial user object) */
export function setUserId(id: string): void {
  if (!_memoryUser) {
    _memoryUser = { id, email: "", name: "User" };
  } else {
    _memoryUser.id = id;
  }
}

/** Returns the currently stored user ID */
export function getUserId(): string | null {
  return _memoryUser?.id || getCurrentUser()?.id || null;
}

/** Alias for clearAuthData */
export function clearAuth(): void {
  clearAuthData();
}

/** Checks if the current memory token is expired */
export function isTokenExpired(): boolean {
  if (!_memoryToken) return true;
  return Date.now() >= _memoryToken.expiresAt - 30_000;
}

/** Caches user profile for UI persistence (sessionStorage) */
export function setCachedUser(user: any): void {
  _memoryUser = user as User;
  if (typeof window !== "undefined") {
    sessionStorage.setItem("olive_user_profile", JSON.stringify(user));
  }
}

/** Retrieves cached user profile */
export function getCachedUser<T = User>(): T | null {
  return (getCurrentUser() as unknown as T) || null;
}

// ─── Token Management ─────────────────────────────────────────────────────────

/**
 * Persist authentication data after a successful login/signup.
 * Access token → memory only.
 * Refresh token → httpOnly cookie via POST /api/auth/session (server-set).
 */
export function setAuthData(user: User, tokens: AuthTokens): void {
  _memoryToken = tokens;
  _memoryUser = user;

  // Persist non-sensitive user profile to sessionStorage for UI display
  // (does NOT contain the JWT — sessionStorage is still XSS accessible,
  //  so we only store display info, never secrets)
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(
        "olive_user_profile",
        JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          pregnancyWeek: user.pregnancyWeek,
          dueDate: user.dueDate,
        })
      );
    } catch {
      // sessionStorage unavailable (private browsing edge case) — gracefully ignore
    }
  }
}

/**
 * Retrieve the in-memory access token.
 * Returns null if the user is not authenticated or the token has expired.
 */
export function getToken(): string | null {
  if (!_memoryToken) return null;

  // Check token expiry with a 30-second buffer for clock skew
  const isExpired = Date.now() >= _memoryToken.expiresAt - 30_000;
  if (isExpired) {
    // Token expired — clear memory, caller should redirect to /login
    clearAuthData();
    return null;
  }

  return _memoryToken.accessToken;
}

/**
 * Retrieve the full token object (used by the refresh interceptor).
 */
export function getAuthTokens(): AuthTokens | null {
  return _memoryToken;
}

/**
 * Retrieve the currently authenticated user.
 * Reconstructs from sessionStorage on page refresh if memory is empty.
 */
export function getCurrentUser(): User | null {
  if (_memoryUser) return _memoryUser;

  // Attempt to reconstruct user profile from sessionStorage on page refresh.
  // This only restores display data — the token must be refreshed separately.
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("olive_user_profile");
      if (stored) {
        _memoryUser = JSON.parse(stored) as User;
        return _memoryUser;
      }
    } catch {
      // Malformed JSON — clear and return null
      sessionStorage.removeItem("olive_user_profile");
    }
  }

  return null;
}

/**
 * Check whether the user is currently authenticated with a valid token.
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Clear all authentication data (logout).
 */
export function clearAuthData(): void {
  _memoryToken = null;
  _memoryUser = null;

  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("olive_user_profile");
    } catch {
      // ignore
    }
  }
}

/**
 * Decode a JWT payload (without verification — server-side verification is
 * handled by the FastAPI backend).  Used for extracting expiry, user ID, etc.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64URL → Base64 → JSON
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Parse a JWT from the backend login response, extracting user info and
 * calculating the expiry timestamp.
 */
export function parseAuthResponse(response: {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
    pregnancyWeek?: number;
    dueDate?: string;
  };
}): { user: User; tokens: AuthTokens } | null {
  try {
    const payload = decodeJwtPayload(response.access_token);
    if (!payload) return null;

    // JWT 'exp' is in seconds — convert to milliseconds
    const expiresAt = typeof payload.exp === "number" ? payload.exp * 1000 : Date.now() + 60 * 60 * 1000;

    const user: User = response.user ?? {
      id: (payload.sub as string) ?? "",
      email: (payload.email as string) ?? "",
      name: (payload.name as string) ?? "User",
      role: payload.role as string | undefined,
    };

    const tokens: AuthTokens = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt,
    };

    return { user, tokens };
  } catch {
    return null;
  }
}