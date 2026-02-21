// hooks/useOffline.ts — Health polling + online/offline detection
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { healthApi } from "@/services/api";
import { remindersApi } from "@/services/api";

export function useOffline() {
    const [isOnline, setIsOnline] = useState(true);
    const [lastChecked, setLastChecked] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const checkHealth = useCallback(async () => {
        const res = await healthApi.check();
        const online = res.status === 200;
        setIsOnline(online);
        setLastChecked(new Date().toISOString());

        // Fire pending reminders on app load (background, no UI)
        if (online) {
            remindersApi.sendAllPending().catch(() => { });
        }
    }, []);

    useEffect(() => {
        // Initial check
        checkHealth();

        // Poll every 30s when online, 10s when offline
        const startPolling = () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(checkHealth, isOnline ? 30000 : 10000);
        };
        startPolling();

        // Browser online/offline events
        const goOnline = () => { setIsOnline(true); checkHealth(); };
        const goOffline = () => setIsOnline(false);
        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
        };
    }, [checkHealth, isOnline]);

    return { isOnline, lastChecked };
}
