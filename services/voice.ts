// services/voice.ts — Web Speech API service for voice input/output
import type { VoiceState, Language } from "@/types";

/** Speech recognition result callback */
type OnResultCallback = (transcript: string, isFinal: boolean) => void;
type OnStateChangeCallback = (state: VoiceState) => void;

/** Check if Web Speech API is available in the current browser */
export function isSpeechRecognitionSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(
        window.SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition
    );
}

export function isSpeechSynthesisSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!window.speechSynthesis;
}

/**
 * Create and manage a speech recognition session.
 * Handles browser prefixes and provides a clean API.
 */
export function createSpeechRecognition(options: {
    language: Language;
    onResult: OnResultCallback;
    onStateChange: OnStateChangeCallback;
    onError: (error: string) => void;
}): { start: () => void; stop: () => void } | null {
    if (!isSpeechRecognitionSupported()) return null;

    const SpeechRecognition =
        window.SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition })
            .webkitSpeechRecognition;

    const recognition = new SpeechRecognition();

    // Configure recognition
    recognition.continuous = false; // Single utterance mode
    recognition.interimResults = true; // Show live transcript
    recognition.maxAlternatives = 1;

    // Set language — Nigerian English primary, fallbacks for Pidgin
    recognition.lang = options.language === "pidgin" ? "en-NG" : "en-NG";

    recognition.onstart = () => {
        options.onStateChange("listening");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        options.onResult(transcript, result.isFinal);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessages: Record<string, string> = {
            "no-speech": "No speech detected. Please try again.",
            "audio-capture": "No microphone found. Please check your microphone.",
            "not-allowed": "Microphone access denied. Please allow microphone access.",
            network: "Network error. Voice works best with internet.",
            aborted: "Voice input was cancelled.",
        };
        options.onError(errorMessages[event.error] || `Voice error: ${event.error}`);
        options.onStateChange("error");
    };

    recognition.onend = () => {
        options.onStateChange("idle");
    };

    return {
        start: () => {
            try {
                recognition.start();
            } catch (e) {
                options.onError("Could not start voice recognition. Please try again.");
                options.onStateChange("error");
            }
        },
        stop: () => {
            try {
                recognition.stop();
            } catch {
                // Already stopped
            }
        },
    };
}

/** Voice speed mapping */
const VOICE_SPEEDS: Record<string, number> = {
    slow: 0.7,
    normal: 0.85,
    fast: 1.1,
};

/**
 * Speak text aloud using Web Speech Synthesis API.
 * Returns a promise that resolves when speech finishes or is cancelled.
 */
export function speakText(
    text: string,
    options?: {
        language?: Language;
        speed?: "slow" | "normal" | "fast";
        onStart?: () => void;
        onEnd?: () => void;
    }
): { cancel: () => void } {
    if (!isSpeechSynthesisSupported()) {
        options?.onEnd?.();
        return { cancel: () => { } };
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = VOICE_SPEEDS[options?.speed || "normal"];
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a female English voice, preferring Nigerian/British
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
        (v) =>
            v.lang.startsWith("en") &&
            (v.name.toLowerCase().includes("female") ||
                v.name.toLowerCase().includes("zira") ||
                v.name.toLowerCase().includes("samantha") ||
                v.name.toLowerCase().includes("google uk english female"))
    );

    if (preferredVoice) {
        utterance.voice = preferredVoice;
    } else {
        // Fallback: any English voice
        const englishVoice = voices.find((v) => v.lang.startsWith("en"));
        if (englishVoice) utterance.voice = englishVoice;
    }

    utterance.onstart = () => options?.onStart?.();
    utterance.onend = () => options?.onEnd?.();
    utterance.onerror = () => options?.onEnd?.();

    window.speechSynthesis.speak(utterance);

    return {
        cancel: () => {
            window.speechSynthesis.cancel();
            options?.onEnd?.();
        },
    };
}

/** Stop any currently playing speech */
export function stopSpeaking(): void {
    if (isSpeechSynthesisSupported()) {
        window.speechSynthesis.cancel();
    }
}
