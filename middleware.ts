// middleware.ts — Next.js Edge Middleware for route protection
// Reads auth token from cookies (SSR-safe, no localStorage)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
    "/dashboard",
    "/scan",
    "/pregnancy",
    "/olive",
    "/medications",
    "/reminders",
    "/prescriptions",
    "/profile",
    "/drugs",
    "/doctors",
];

const PUBLIC_ROUTES = [
    "/login",
    "/signup", 
    "/auth",
    "/verify-phone",
    "/verify-email",
    "/confirm-email",
    "/",
];

/** Decode JWT payload (base64url) — no verification, edge-safe */
function decodeJwtPayload(token: string): { exp?: number; sub?: string } | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(padded);
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

function isExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return true;
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip static assets, API routes, and _next
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    const token = request.cookies.get("olive_token")?.value;
    const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
    const isPublicAuth = ["/login", "/signup", "/auth"].some((r) => pathname.startsWith(r));

    // ── Protected route without token → redirect to auth ──────
    if (isProtected) {
        if (!token) {
            const authUrl = new URL("/auth?mode=login", request.url);
            return NextResponse.redirect(authUrl);
        }

        // Token expired → redirect with reason
        if (isExpired(token)) {
            const authUrl = new URL("/auth?mode=login", request.url);
            authUrl.searchParams.set("reason", "session_expired");
            // Clear the cookie via response
            const response = NextResponse.redirect(authUrl);
            response.cookies.delete("olive_token");
            response.cookies.delete("olive_user_id");
            return response;
        }
    }

    // ── Auth pages WITH valid token → redirect to dashboard ──
    if (isPublicAuth && token && !isExpired(token)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
