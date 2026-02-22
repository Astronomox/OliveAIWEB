// services/gemini.ts — Gemini AI client-side service

import type { ChatMessage, Language, UserProfile, GeminiResponse } from "@/types";

/**
 * Send a message to the Gemini API via our Next.js API route.
 * Streams the response for real-time display.
 */
export async function sendMessageToOlive(options: {
    message: string;
    language: Language;
    conversationHistory: ChatMessage[];
    userProfile?: Partial<UserProfile>;
    onChunk?: (chunk: string) => void;
}): Promise<GeminiResponse> {
    try {
        const response = await fetch("/api/gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: options.message,
                language: options.language,
                conversationHistory: options.conversationHistory.slice(-10), // Last 10 messages for context
                userProfile: options.userProfile,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const data = await response.json();

        // Stream simulation: call onChunk with progressive text if callback provided
        if (options.onChunk && data.reply) {
            const words = data.reply.split(" ");
            let accumulated = "";
            for (let i = 0; i < words.length; i++) {
                accumulated += (i > 0 ? " " : "") + words[i];
                options.onChunk(accumulated);
                // Small delay between words for typing effect
                await new Promise((resolve) => setTimeout(resolve, 30));
            }
        }

        return {
            reply: data.reply,
            isEmergency: data.isEmergency || false,
            emergencyData: data.emergencyData || undefined,
        };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Failed to reach Olive. Please try again.";
        throw new Error(errorMessage);
    }
}

/**
 * Pre-fill prompt for drug-related queries.
 * Used when user taps "Ask Olive about this drug" from scan/pregnancy screens.
 */
export function buildDrugQueryPrompt(drugName: string, context?: string): string {
    if (context) {
        return `I want to ask about the drug "${drugName}". ${context}`;
    }
    return `Tell me about the drug "${drugName}". Is it safe? What should I know?`;
}
