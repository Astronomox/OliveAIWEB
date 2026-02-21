// hooks/useVoice.ts — Hook for managing voice recognition and synthesis
import { useState, useCallback, useEffect, useRef } from "react";
import { createSpeechRecognition, speakText, stopSpeaking } from "@/services/voice";
import type { VoiceState, Language } from "@/types";

export function useVoice(language: Language = "en") {
    const [state, setState] = useState<VoiceState>("idle");
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    const startListening = useCallback(() => {
        setTranscript("");
        setError(null);

        if (!recognitionRef.current) {
            recognitionRef.current = createSpeechRecognition({
                language,
                onResult: (text, isFinal) => {
                    setTranscript(text);
                },
                onStateChange: (newState) => setState(newState),
                onError: (err) => {
                    setError(err);
                    setState("error");
                },
            });
        }

        if (recognitionRef.current) {
            stopSpeaking(); // Stop Mama talking before we start listening
            recognitionRef.current.start();
        }
    }, [language]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const speak = useCallback((text: string, onEnd?: () => void) => {
        setState("speaking");
        return speakText(text, {
            language,
            onEnd: () => {
                setState("idle");
                onEnd?.();
            },
            onStart: () => setState("speaking"),
        });
    }, [language]);

    const cancelSpeech = useCallback(() => {
        stopSpeaking();
        setState("idle");
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopListening();
            stopSpeaking();
        };
    }, [stopListening]);

    return {
        state,
        transcript,
        error,
        startListening,
        stopListening,
        speak,
        cancelSpeech,
    };
}
