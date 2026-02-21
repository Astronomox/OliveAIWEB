// hooks/useAuth.ts — Authentication hook wired to lib/auth + live API
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usersApi } from "@/services/api";
import {
    getToken, getUserId, clearAuth, isTokenExpired,
    setCachedUser, getCachedUser, isAuthenticated as checkIsAuth,
} from "@/lib/auth";
import type { UserResponse } from "@/types/api";

export function useAuth() {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const checkAuth = useCallback(async () => {
        const token = getToken();
        const userId = getUserId();

        if (!token || !userId) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        // Proactive expiry check
        if (isTokenExpired()) {
            clearAuth();
            setUser(null);
            setIsLoading(false);
            return;
        }

        // Instant display from cache
        const cached = getCachedUser<UserResponse>();
        if (cached) setUser(cached);

        // Validate token by fetching user from API
        const res = await usersApi.getUser(userId);
        if (res.data) {
            setUser(res.data);
            setCachedUser(res.data);
        } else if (res.status === 401) {
            clearAuth();
            setUser(null);
        }
        // If it fails for other reasons, keep cached user
        setIsLoading(false);
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const logout = async () => {
        try {
            await usersApi.logout();
        } catch {
            // Fallback — always clear
        }
        clearAuth();
        setUser(null);
        router.push("/login");
    };

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refresh: checkAuth,
    };
}
