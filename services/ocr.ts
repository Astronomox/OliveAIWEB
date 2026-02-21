// services/ocr.ts — OCR text extraction from drug images
import type { OCRResult } from "@/types";
import { extractNAFDACNumbers, extractExpiryDate } from "@/lib/bayesian";

/**
 * Convert a File or Blob to base64-encoded string (without data URI prefix).
 */
export async function imageToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URI prefix (e.g., "data:image/jpeg;base64,")
            const base64 = result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
    });
}

/**
 * Capture a frame from a video element (webcam) as a Blob.
 */
export function captureVideoFrame(video: HTMLVideoElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Could not create canvas context"));
                return;
            }
            ctx.drawImage(video, 0, 0);
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Failed to capture video frame"));
                },
                "image/jpeg",
                0.9
            );
        } catch (error) {
            reject(new Error("Failed to capture frame from camera"));
        }
    });
}

/**
 * Send an image to our OCR API route for text extraction.
 * The API route handles the Google Vision API call server-side.
 */
export async function extractTextFromImage(imageBase64: string): Promise<OCRResult> {
    const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64, mimeType: "image/jpeg" }),
    });

    if (!response.ok) {
        throw new Error(`OCR API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.ocrResult) {
        throw new Error(data.error || "Could not read drug packaging — please try again");
    }

    return data.ocrResult;
}

/**
 * Parse raw OCR text to extract structured drug information.
 * Used both server-side and as fallback client-side.
 */
export function parseOCRText(rawText: string): Omit<OCRResult, "rawText"> {
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

    // Extract NAFDAC number
    const nafdacNumbers = extractNAFDACNumbers(rawText);
    const nafdacNumber = nafdacNumbers.length > 0 ? nafdacNumbers[0] : null;

    // Extract expiry date
    const expiryDate = extractExpiryDate(rawText);

    // Extract batch number
    const batchPatterns = [
        /(?:batch|lot|b\/n|bn)[:\s#]*([A-Z0-9-]+)/i,
    ];
    let batchNumber: string | null = null;
    for (const pattern of batchPatterns) {
        const match = rawText.match(pattern);
        if (match) {
            batchNumber = match[1];
            break;
        }
    }

    // Extract manufacturer — look for keywords like "Manufactured by", "Mfg by"
    const mfgPatterns = [
        /(?:manufactured|mfg|made|produced)\s*(?:by|:)\s*(.+?)(?:\n|$)/i,
        /(?:manufacturer|mfg)[:\s]*(.+?)(?:\n|$)/i,
    ];
    let manufacturer: string | null = null;
    for (const pattern of mfgPatterns) {
        const match = rawText.match(pattern);
        if (match) {
            manufacturer = match[1].trim();
            break;
        }
    }

    // Drug name: typically the largest/first prominent text
    // Heuristic: first line that's not a NAFDAC number, manufacturer, or instruction
    let drugName: string | null = null;
    for (const line of lines) {
        if (
            line.length > 2 &&
            line.length < 60 &&
            !line.match(/nafdac|batch|lot|exp|manufactured|mfg|dosage|store|keep/i) &&
            !line.match(/^\d+$/)
        ) {
            drugName = line;
            break;
        }
    }

    // Calculate confidence based on how many fields we found
    let fieldsFound = 0;
    if (drugName) fieldsFound++;
    if (nafdacNumber) fieldsFound++;
    if (manufacturer) fieldsFound++;
    if (expiryDate) fieldsFound++;
    if (batchNumber) fieldsFound++;
    const confidence = fieldsFound / 5;

    return {
        drugName,
        nafdacNumber,
        manufacturer,
        expiryDate,
        batchNumber,
        confidence,
    };
}
