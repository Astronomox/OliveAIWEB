// app/api/ocr/route.ts — Real Google Cloud Vision OCR
import { NextResponse } from "next/server";

const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

// Regex patterns for Nigerian drug packaging
const PATTERNS = {
    nafdac: /([A-Z]\d{1,2}-?\d{4,8})/gi,
    expiry: /(?:EXP|EXPIRY|USE\s*BEFORE|BEST\s*BEFORE)[:\s]+(\d{2}[\/-]\d{2,4})/gi,
    batch: /(?:BATCH|LOT|B\/N|BN)[:\s]+([A-Z0-9]+)/gi,
    strength: /(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g\b|IU|%)/gi,
    drugName: /^([A-Z][A-Z\s]+(?:TABLET|CAPSULE|SYRUP|INJECTION|CREAM|GEL|DROPS|SUSPENSION)?)/m,
};

function parseOCRText(text: string) {
    const nafdacMatches = Array.from(text.matchAll(PATTERNS.nafdac));
    const expiryMatches = Array.from(text.matchAll(PATTERNS.expiry));
    const batchMatches = Array.from(text.matchAll(PATTERNS.batch));
    const strengthMatches = Array.from(text.matchAll(PATTERNS.strength));

    // Extract drug name — usually the largest text (first line in block)
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const nameLine = lines.find(l => l.length > 3 && /[A-Z]{3,}/.test(l)) || lines[0] || "";

    return {
        rawText: text,
        drugName: nameLine,
        nafdacNumber: nafdacMatches[0]?.[1] || null,
        expiryDate: expiryMatches[0]?.[1] || null,
        batchNumber: batchMatches[0]?.[1] || null,
        strength: strengthMatches[0] ? `${strengthMatches[0][1]}${strengthMatches[0][2]}` : null,
        confidence: text.length > 20 ? 0.85 : 0.5,
    };
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const imageBase64: string = body.image || body.imageBase64;
        const mimeType: string = body.mimeType || "image/jpeg";

        if (!imageBase64) {
            return NextResponse.json({ success: false, error: "No image data provided" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_VISION_API_KEY;
        const projectId = process.env.GOOGLE_CLOUD_PROJECT;
        
        console.log("[OCR] Configuration check:", {
            hasApiKey: !!apiKey,
            projectId,
            credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });

        if (!apiKey) {
            // Provide a mock OCR response when Google Vision is not configured
            console.warn("[OCR] Google Vision API key not configured, returning mock response");
            const mockText = `PARACETAMOL
EMDEX PHARMACEUTICALS
NAFDAC REG NO: A4-0945L
BATCH NO: PCM001
EXP: 12/2025
500mg Tablets
Manufactured in Nigeria`;
            
            const parsed = parseOCRText(mockText);
            return NextResponse.json({
                success: true,
                ocrResult: parsed,
                note: "OCR service in demo mode - please configure Google Vision API for production use"
            });
        }

        // Call Google Cloud Vision API
        const visionRes = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                requests: [{
                    image: { content: imageBase64 },
                    features: [
                        { type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 },
                        { type: "TEXT_DETECTION", maxResults: 1 },
                    ],
                }],
            }),
        });

        if (!visionRes.ok) {
            const errText = await visionRes.text();
            console.error("[OCR] Vision API error:", errText);
            return NextResponse.json(
                { success: false, error: `Vision API returned ${visionRes.status}` },
                { status: 502 }
            );
        }

        const visionData = await visionRes.json();
        const fullText: string =
            visionData.responses?.[0]?.fullTextAnnotation?.text ||
            visionData.responses?.[0]?.textAnnotations?.[0]?.description ||
            "";

        if (!fullText) {
            return NextResponse.json({
                success: false,
                error: "No text detected in image",
                ocrResult: null,
            });
        }

        const parsed = parseOCRText(fullText);

        return NextResponse.json({
            success: true,
            ocrResult: parsed,
        });
    } catch (error) {
        console.error("[OCR] Error:", error);
        return NextResponse.json(
            { success: false, error: "Image processing failed — please try again" },
            { status: 500 }
        );
    }
}
