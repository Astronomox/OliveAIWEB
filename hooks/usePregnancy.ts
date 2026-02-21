// hooks/usePregnancy.ts — Pregnancy data management hook
import { useState, useEffect, useCallback } from "react";
import { getUserProfile, saveUserProfile } from "@/lib/db";
import type { UserProfile, Trimester } from "@/types";

export function usePregnancy() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshProfile = useCallback(async () => {
        const data = await getUserProfile();
        setProfile(data || null);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refreshProfile();
    }, [refreshProfile]);

    const updateTrimester = async (trimester: Trimester) => {
        if (!profile) return;
        const updated = { ...profile, trimester, updatedAt: new Date().toISOString() };
        await saveUserProfile(updated);
        setProfile(updated);
    };

    const updateWeek = async (weekNumber: number) => {
        if (!profile) return;
        const updated = { ...profile, weekNumber, updatedAt: new Date().toISOString() };
        await saveUserProfile(updated);
        setProfile(updated);
    };

    return {
        profile,
        isLoading,
        updateTrimester,
        updateWeek,
        refreshProfile,
    };
}
