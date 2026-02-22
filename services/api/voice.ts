// services/api/voice.ts — Voice/Speech API service for backend transcription & synthesis
import { api, type ApiResponse } from "@/lib/api";
import type {
    TranscriptionResponse,
    TextToSpeechResponse,
    VoiceTranscribeRequest,
    VoiceSynthesizeRequest,
    SuccessResponse,
} from "@/types/api";

export const voiceApi = {
    /**
     * POST /api/voice/transcribe — Convert speech audio file to text using backend speech recognition
     * Supports various audio formats (mp3, wav, ogg, webm, etc.)
     */
    async transcribe(
        file: File | Blob,
        language?: string
    ): Promise<ApiResponse<TranscriptionResponse>> {
        try {
            if (!file) {
                throw new Error("No audio file provided");
            }

            // Validate file is audio
            if (!file.type.startsWith("audio/")) {
                throw new Error(`Invalid file type. Expected audio file, got ${file.type}`);
            }

            const formData = new FormData();
            formData.append("audio_file", file); // Key MUST be 'audio_file' as per backend spec
            if (language) {
                formData.append("language", language);
            }

            // Debug logging
            if (process.env.NODE_ENV === "development") {
                console.log("🎤 Voice Transcribe:", {
                    fileName: file instanceof File ? file.name : "blob",
                    fileSize: file.size,
                    fileType: file.type,
                    language,
                });
            }

            return api.post<TranscriptionResponse>("/api/voice/transcribe", formData);
        } catch (error) {
            if (error && typeof error === "object" && "status" in error && error.status === 422) {
                console.error("📋 422 Voice Transcribe Error:", {
                    error,
                    details: "details" in error ? error.details : null,
                });
            }
            throw error;
        }
    },

    /**
     * POST /api/voice/synthesize — Convert text to speech using backend TTS
     * Returns audio URL or audio data depending on format requested
     */
    async synthesize(
        text: string,
        options?: {
            language?: string;
            speed?: "slow" | "normal" | "fast";
            gender?: "male" | "female";
            format?: "mp3" | "wav" | "ogg";
        }
    ): Promise<ApiResponse<TextToSpeechResponse>> {
        try {
            if (!text || text.trim().length === 0) {
                throw new Error("Text cannot be empty");
            }

            const payload: VoiceSynthesizeRequest = {
                text,
                language: options?.language || "en",
                speed: options?.speed || "normal",
                gender: options?.gender || "female",
            };

            // Debug logging
            if (process.env.NODE_ENV === "development") {
                console.log("🔊 Voice Synthesize:", {
                    textLength: text.length,
                    language: options?.language,
                    speed: options?.speed,
                    gender: options?.gender,
                    format: options?.format,
                });
            }

            const endpoint = options?.format
                ? `/api/voice/synthesize?format=${options.format}`
                : "/api/voice/synthesize";

            return api.post<TextToSpeechResponse>(endpoint, payload);
        } catch (error) {
            if (error && typeof error === "object" && "status" in error && error.status === 422) {
                console.error("📋 422 Voice Synthesize Error:", {
                    error,
                    details: "details" in error ? error.details : null,
                });
            }
            throw error;
        }
    },

    /**
     * POST /api/voice/transcribe-and-process — Transcribe audio and extract medications/info
     * Smart endpoint that transcribes and then extracts structured data about medications mentioned
     */
    async transcribeAndProcess(
        file: File | Blob,
        language?: string
    ): Promise<ApiResponse<any>> {
        try {
            if (!file) {
                throw new Error("No audio file provided");
            }

            const formData = new FormData();
            formData.append("audio_file", file);
            if (language) {
                formData.append("language", language);
            }

            if (process.env.NODE_ENV === "development") {
                console.log("🎙️ Voice Transcribe & Process:", {
                    fileName: file instanceof File ? file.name : "blob",
                    fileSize: file.size,
                    language,
                });
            }

            return api.post<any>("/api/voice/transcribe-and-process", formData);
        } catch (error) {
            console.error("Voice transcribe & process error:", error);
            throw error;
        }
    },

    /**
     * GET /api/voice/supported-languages — Get list of supported languages for voice services
     */
    getSupportedLanguages(): Promise<ApiResponse<string[]>> {
        return api.get<string[]>("/api/voice/supported-languages");
    },

    /**
     * POST /api/voice/test — Test voice service connectivity and health
     */
    async testVoiceService(): Promise<ApiResponse<SuccessResponse>> {
        return api.post<SuccessResponse>("/api/voice/test");
    },
};
