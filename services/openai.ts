// services/openai.ts — OpenAI client-side service for Olive AI

import type { ChatMessage, Language, UserProfile } from "@/types";

export interface OpenAIResponse {
  reply: string;
  isEmergency?: boolean;
  emergencyData?: {
    condition: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendedAction: string;
  };
  drugSafetyWarning?: {
    drugName: string;
    riskLevel: 'safe' | 'caution' | 'avoid' | 'dangerous';
    pregnancyCategory: string;
    warning: string;
  };
}

/**
 * Send a message to OpenAI via our Next.js API route.
 * Provides intelligent responses with Nigerian context and pregnancy safety focus.
 */
export async function sendMessageToOliveOpenAI(options: {
    message: string;
    language: Language;
    conversationHistory: ChatMessage[];
    userProfile?: Partial<UserProfile>;
    onChunk?: (chunk: string) => void;
}): Promise<OpenAIResponse> {
    try {
        const response = await fetch("/api/openai", {
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

        // Handle streaming response
        if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                accumulated += chunk;
                
                // Call onChunk for real-time display if callback provided
                if (options.onChunk) {
                    options.onChunk(accumulated);
                }
            }

            // Parse the final accumulated response
            try {
                const data = JSON.parse(accumulated);
                return data;
            } catch {
                // If not valid JSON, return as simple reply
                return {
                    reply: accumulated,
                    isEmergency: false,
                };
            }
        }

        // Fallback for non-streaming response
        const data = await response.json();
        return data;

    } catch (error) {
        console.error('OpenAI service error:', error);
        
        // Fallback response with Nigerian context
        return {
            reply: "Sorry mama, I dey experience small technical problem now. Please try again or contact your doctor if e dey urgent.",
            isEmergency: false,
        };
    }
}

/**
 * Get drug safety information using OpenAI
 */
export async function getDrugSafetyAdvice(drugName: string, userProfile?: Partial<UserProfile>): Promise<OpenAIResponse> {
    const pregnancyInfo = userProfile?.weekNumber 
        ? ` I am ${userProfile.weekNumber} weeks pregnant`
        : userProfile?.isPregnant === 'yes' 
        ? " I am pregnant"
        : "";
    
    const message = `Is ${drugName} safe for pregnancy?${pregnancyInfo}. Please provide safety information in Nigerian Pidgin English.`;
    
    return sendMessageToOliveOpenAI({
        message,
        language: 'pidgin',
        conversationHistory: [],
        userProfile,
    });
}

/**
 * Get emergency health advice using OpenAI
 */
export async function getEmergencyAdvice(symptoms: string, userProfile?: Partial<UserProfile>): Promise<OpenAIResponse> {
    const pregnancyInfo = userProfile?.weekNumber 
        ? ` I am ${userProfile.weekNumber} weeks pregnant`
        : userProfile?.isPregnant === 'yes' 
        ? " I am pregnant"
        : "";
    
    const message = `EMERGENCY: I am experiencing ${symptoms}.${pregnancyInfo}. What should I do? Please respond in Nigerian Pidgin English.`;
    
    return sendMessageToOliveOpenAI({
        message,
        language: 'pidgin',
        conversationHistory: [],
        userProfile,
    });
}

/**
 * Get personalized pregnancy advice
 */
export async function getPregnancyAdvice(query: string, userProfile?: Partial<UserProfile>): Promise<OpenAIResponse> {
    const context = userProfile ? [
        userProfile.weekNumber ? `Pregnancy week: ${userProfile.weekNumber}` : '',
        userProfile.trimester ? `Trimester: ${userProfile.trimester}` : '',
        userProfile.isPregnant ? `Pregnancy status: ${userProfile.isPregnant}` : '',
        userProfile.language ? `Preferred language: ${userProfile.language}` : '',
    ].filter(Boolean).join(', ') : '';
    
    const enhancedQuery = context 
        ? `${query} (My details: ${context})`
        : query;
    
    return sendMessageToOliveOpenAI({
        message: enhancedQuery,
        language: 'en',
        conversationHistory: [],
        userProfile,
    });
}