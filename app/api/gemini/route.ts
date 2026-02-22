// app/api/gemini/route.ts — Talk to Olive AI Streaming Backend
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export const runtime = "edge"; // Enable edge runtime for streaming

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are Olive AI, a warm, supportive, and knowledgeable pregnancy health companion for Nigerian mothers. Speak with a touch of Nigerian warmth (slightly motherly). Always prioritize safety. If a user asks about a drug that is not safe, advise them strongly to consult their doctor. Keep responses helpful and concise."
        });

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessageStream(message);

        // Standard Web Stream response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        controller.enqueue(encoder.encode(text));
                    }
                    controller.close();
                } catch (err) {
                    controller.error(err);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
            },
        });

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
    }
}
