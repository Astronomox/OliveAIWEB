// hooks/useEmergency.ts — Emergency detection logic hook
import { useState, useCallback } from "react";
import { detectEmergency } from "@/constants/emergency";
import type { EmergencyDetection } from "@/types";

export function useEmergency() {
    const [emergency, setEmergency] = useState<EmergencyDetection | null>(null);

    const checkText = useCallback((text: string) => {
        const result = detectEmergency(text);
        if (result) {
            setEmergency(result);
            return true;
        }
        return false;
    }, []);

    const clearEmergency = useCallback(() => {
        setEmergency(null);
    }, []);

    return {
        emergency,
        checkText,
        clearEmergency,
        hasEmergency: !!emergency,
    };
}
