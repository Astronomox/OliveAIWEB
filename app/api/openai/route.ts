// app/api/openai/route.ts — OpenAI-powered Talk to Olive AI Backend

import OpenAI from 'openai';
import { NextResponse } from "next/server";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge"; // Enable edge runtime for better performance

export async function POST(req: Request) {
    try {
        const { message, language, conversationHistory, userProfile } = await req.json();

        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ 
                error: "OpenAI API key is not configured. Please check your environment variables." 
            }, { status: 500 });
        }

        // Build context about the user for personalized responses
        const userContext = buildUserContext(userProfile);
        
        // Build conversation history for context
        const messages = buildConversationMessages(conversationHistory, userContext, language);
        
        // Add the current user message
        messages.push({
            role: "user",
            content: message,
        });

        // Check for emergency keywords and drug safety queries
        const isEmergency = checkForEmergency(message);
        const drugQuery = extractDrugQuery(message);
        
        // Create the completion with streaming
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using the latest efficient model
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
            stream: true,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
        });

        // Create a streaming response
        const encoder = new TextEncoder();
        let fullResponse = "";
        
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const text = chunk.choices[0]?.delta?.content || '';
                        if (text) {
                            fullResponse += text;
                            controller.enqueue(encoder.encode(text));
                        }
                    }
                    
                    // After streaming is complete, send final response with metadata
                    const finalResponse = {
                        reply: fullResponse,
                        isEmergency,
                        emergencyData: isEmergency ? generateEmergencyData(message) : undefined,
                        drugSafetyWarning: drugQuery ? generateDrugSafetyWarning(drugQuery, userProfile) : undefined,
                    };
                    
                    controller.enqueue(encoder.encode('\n' + JSON.stringify(finalResponse)));
                    controller.close();
                    
                } catch (error) {
                    console.error('OpenAI streaming error:', error);
                    controller.error(error);
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error) {
        console.error('OpenAI API error:', error);
        
        return NextResponse.json({ 
            error: "Sorry mama, I dey experience small technical problem now. Please try again or contact your doctor if e dey urgent.",
            reply: "I no fit process your message now, but make you try again small time later. If na emergency, please call doctor or go hospital immediately."
        }, { status: 500 });
    }
}

/**
 * Build user context for personalized responses
 */
function buildUserContext(userProfile: any): string {
    if (!userProfile) return "";
    
    const context = [];
    
    if (userProfile.isPregnant === 'yes') {
        context.push("User is pregnant");
        if (userProfile.weekNumber) {
            context.push(`at ${userProfile.weekNumber} weeks`);
        }
        if (userProfile.trimester) {
            context.push(`in ${userProfile.trimester} trimester`);
        }
    }
    
    if (userProfile.name) {
        context.push(`User's name is ${userProfile.name}`);
    }
    
    if (userProfile.hasVisualImpairment) {
        context.push("User has visual impairment - use clear, descriptive language");
    }
    
    return context.length > 0 ? `User context: ${context.join(', ')}.` : "";
}

/**
 * Build conversation messages with system prompt
 */
function buildConversationMessages(history: any[], userContext: string, language: string): any[] {
    const systemPrompt = `You are Olive AI, a warm, supportive, and knowledgeable pregnancy health companion for Nigerian mothers. 

CORE PRINCIPLES:
- Always prioritize safety and encourage consulting healthcare providers for serious concerns
- Be culturally sensitive to Nigerian context
- Use a warm, motherly, and supportive tone
- Provide accurate medical information while emphasizing it's not a replacement for professional medical advice
- Be especially careful with drug safety recommendations

LANGUAGE STYLE:
${language === 'pidgin' 
    ? "- Respond in Nigerian Pidgin English with warmth and care (e.g., 'mama', 'belle woman', 'pikin')" 
    : "- Respond in clear, warm English with occasional Nigerian expressions for cultural connection"}

SAFETY PROTOCOLS:
- For drug safety questions: Always check pregnancy categories and provide clear warnings
- For emergency symptoms: Immediately advise seeking medical attention
- For serious medical concerns: Refer to healthcare providers
- For mental health concerns: Be supportive while recommending professional help

CONTEXT:
${userContext}

Remember: You provide supportive guidance, but users should always consult their doctors for medical decisions.`;

    const messages = [{
        role: "system",
        content: systemPrompt,
    }];
    
    // Add conversation history (limit to last 10 messages for context)
    if (history && history.length > 0) {
        const recentHistory = history.slice(-10);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.isUser ? "user" : "assistant",
                content: msg.text,
            });
        }
    }
    
    return messages;
}

/**
 * Check if the message contains emergency keywords
 */
function checkForEmergency(message: string): boolean {
    const emergencyKeywords = [
        'emergency', 'urgent', 'bleeding', 'severe pain', 'can\'t breathe', 
        'chest pain', 'unconscious', 'seizure', 'severe headache',
        'contractions', 'baby not moving', 'water broke', 'premature labor',
        'suicide', 'self-harm', 'want to die', 'overdose'
    ];
    
    const lowercaseMessage = message.toLowerCase();
    return emergencyKeywords.some(keyword => lowercaseMessage.includes(keyword));
}

/**
 * Extract drug names from the message
 */
function extractDrugQuery(message: string): string | null {
    const drugKeywords = ['drug', 'medicine', 'medication', 'tablet', 'capsule', 'syrup', 'safe to take'];
    const lowercaseMessage = message.toLowerCase();
    
    if (drugKeywords.some(keyword => lowercaseMessage.includes(keyword))) {
        // Simple extraction - in a real implementation, you'd use more sophisticated NLP
        const words = message.split(' ');
        // Look for capitalized words that might be drug names
        const potentialDrugs = words.filter(word => 
            word.length > 3 && 
            word[0] === word[0].toUpperCase() &&
            !['Is', 'Can', 'What', 'How', 'Where', 'When', 'Why'].includes(word)
        );
        return potentialDrugs.length > 0 ? potentialDrugs[0] : null;
    }
    
    return null;
}

/**
 * Generate emergency response data
 */
function generateEmergencyData(message: string) {
    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('bleeding') || lowercaseMessage.includes('blood')) {
        return {
            condition: "Bleeding during pregnancy",
            severity: 'critical' as const,
            recommendedAction: "Seek immediate medical attention. Go to the nearest hospital emergency room or call emergency services."
        };
    }
    
    if (lowercaseMessage.includes('chest pain') || lowercaseMessage.includes('can\'t breathe')) {
        return {
            condition: "Breathing difficulties or chest pain",
            severity: 'critical' as const,
            recommendedAction: "Call emergency services immediately. This requires urgent medical evaluation."
        };
    }
    
    if (lowercaseMessage.includes('contractions') || lowercaseMessage.includes('labor')) {
        return {
            condition: "Possible labor contractions",
            severity: 'high' as const,
            recommendedAction: "Contact your doctor immediately or go to the hospital if contractions are regular and painful."
        };
    }
    
    return {
        condition: "General emergency concern",
        severity: 'medium' as const,
        recommendedAction: "Contact your healthcare provider immediately or seek emergency medical care if symptoms are severe."
    };
}

/**
 * Generate drug safety warning
 */
function generateDrugSafetyWarning(drugName: string, userProfile: any) {
    // This would integrate with the Nigerian drugs database
    // For now, providing general guidance
    return {
        drugName,
        riskLevel: 'caution' as const,
        pregnancyCategory: "Unknown",
        warning: `Please consult your doctor before taking ${drugName} during pregnancy. Drug safety depends on many factors including your specific situation and pregnancy stage.`
    };
}