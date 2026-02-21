"use client";

import { useEffect } from "react";
import { wakeUpBackend } from "@/lib/api";

export function BackendWakeup() {
    useEffect(() => {
        // Ping backend to wake up Render.com free tier early
        wakeUpBackend().catch(() => { });
    }, []);

    return null;
}
