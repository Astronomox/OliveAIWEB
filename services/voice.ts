// services/voice.ts — Enhanced Web Speech API service for voice input/output with drug scanning
import type { VoiceState, Language } from "@/types";

/** Speech recognition result callback */
type OnResultCallback = (transcript: string, isFinal: boolean) => void;
type OnStateChangeCallback = (state: VoiceState) => void;

/** Voice recognition modes */
export type VoiceMode = "general" | "drug_scan" | "upload_verify";

/** Check if Web Speech API is available in the current browser */
export function isSpeechRecognitionSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        (window as any).mozSpeechRecognition
    );
}

export function isSpeechSynthesisSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!window.speechSynthesis && !!window.SpeechSynthesisUtterance;
}

/**
 * Enhanced speech recognition with drug scanning capabilities
 */
export function createSpeechRecognition(options: {
    language: Language;
    mode: VoiceMode;
    onResult: OnResultCallback;
    onStateChange: OnStateChangeCallback;
    onError: (error: string) => void;
}): { start: () => void; stop: () => void; destroy: () => void } | null {
    if (!isSpeechRecognitionSupported()) return null;

    const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        (window as any).mozSpeechRecognition;

    const recognition = new SpeechRecognition();

    // Enhanced configuration based on mode
    recognition.continuous = options.mode === "general" ? false : true; // Continuous for drug scanning
    recognition.interimResults = true; // Show live transcript
    recognition.maxAlternatives = 3; // More alternatives for drug names
    
    // Set language with better Nigerian English support
    recognition.lang = options.language === "pidgin" ? "en-NG" : "en-US";
    
    // For drug scanning, add pharmaceutical vocabulary hints
    if (recognition.grammars && options.mode !== "general") {
        const grammar = "#JSGF V1.0; grammar drugNames; public <drugName> = paracetamol | panadol | amoxicillin | augmentin | ibuprofen | flagyl | coartem | chloroquine | vitamin | folic acid | iron tablets | septrin;";
        const speechRecognitionList = new (window as any).webkitSpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        recognition.grammars = speechRecognitionList;
    }

    let isDestroyed = false;

    recognition.onstart = () => {
        if (!isDestroyed) {
            options.onStateChange("listening");
        }
    };

    recognition.onresult = (event: any) => {
        if (isDestroyed) return;
        
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        
        // Enhanced processing for drug names
        if (options.mode === "drug_scan" || options.mode === "upload_verify") {
            const processedTranscript = processDrugNameRecognition(transcript);
            options.onResult(processedTranscript, result.isFinal);
        } else {
            options.onResult(transcript, result.isFinal);
        }
    };

    recognition.onerror = (event: any) => {
        if (isDestroyed) return;
        
        const errorMessages: Record<string, string> = {
            "no-speech": "No speech detected. Please try again.",
            "audio-capture": "No microphone found. Please check your microphone.",
            "not-allowed": "Microphone access denied. Please allow microphone access.",
            network: "Network error. Voice works best with internet.",
            aborted: "Voice input was cancelled.",
        };
        
        const errorMessage = errorMessages[event.error] || `Voice error: ${event.error}`;
        options.onError(errorMessage);
        options.onStateChange("error");
    };

    recognition.onend = () => {
        if (!isDestroyed) {
            options.onStateChange("idle");
        }
    };

    return {
        start: () => {
            if (isDestroyed) return;
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
        destroy: () => {
            isDestroyed = true;
            try {
                recognition.stop();
                recognition.onstart = null;
                recognition.onresult = null;
                recognition.onerror = null;
                recognition.onend = null;
            } catch {
                // Already destroyed
            }
        },
    };
}

/**
 * Process and clean up drug name recognition for better accuracy
 */
function processDrugNameRecognition(transcript: string): string {
    const drugNameMappings: Record<string, string> = {
        // Common misheard drug names
        "para set a mol": "paracetamol",
        "para seater mol": "paracetamol", 
        "paracitamol": "paracetamol",
        "panadoll": "panadol",
        "pan a doll": "panadol",
        "amoxycillin": "amoxicillin",
        "amoxillin": "amoxicillin",
        "augmentin": "augmentin",
        "ibuprofen": "ibuprofen",
        "eye be profen": "ibuprofen",
        "flagyl": "flagyl",
        "flag yl": "flagyl",
        "co artem": "coartem",
        "core tem": "coartem",
        "chloroquine": "chloroquine",
        "chlorine": "chloroquine",
        "vitamin c": "vitamin c",
        "vitamin see": "vitamin c",
        "folic acid": "folic acid",
        "folk acid": "folic acid",
        "iron tablet": "iron tablets",
        "iron tablets": "iron tablets",
        "septrin": "septrin",
        "sept rin": "septrin",
    };
    
    let processed = transcript.toLowerCase().trim();
    
    // Check for exact matches first
    for (const [mishearing, correct] of Object.entries(drugNameMappings)) {
        if (processed.includes(mishearing)) {
            processed = processed.replace(mishearing, correct);
        }
    }
    
    return processed;
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

/**
 * Voice-enabled drug scanning functionality
 */
export async function startVoiceDrugScan(options: {
    language: Language;
    onDrugDetected: (drugName: string, confidence: number) => void;
    onStateChange: OnStateChangeCallback;
    onError: (error: string) => void;
}): Promise<{ stop: () => void } | null> {
    if (!isSpeechRecognitionSupported()) {
        options.onError("Voice recognition is not supported in this browser");
        return null;
    }

    // Provide voice instructions
    await speakText(
        options.language === "pidgin" 
            ? "I dey ready to hear the drug name. Please talk the drug name clearly."
            : "I'm ready to listen for the drug name. Please speak the drug name clearly.",
        { 
            language: options.language,
            onEnd: () => {
                // Start listening after instructions
                startListening();
            }
        }
    );

    let recognition: ReturnType<typeof createSpeechRecognition> | null = null;

    function startListening() {
        recognition = createSpeechRecognition({
            language: options.language,
            mode: "drug_scan",
            onResult: (transcript, isFinal) => {
                if (isFinal) {
                    // Analyze the transcript for drug names
                    const detectedDrug = analyzeDrugTranscript(transcript);
                    if (detectedDrug.name) {
                        options.onDrugDetected(detectedDrug.name, detectedDrug.confidence);
                        
                        // Provide confirmation
                        speakText(
                            options.language === "pidgin"
                                ? `I hear ${detectedDrug.name}. Make I check am for you.`
                                : `I heard ${detectedDrug.name}. Let me check that for you.`,
                            { language: options.language }
                        );
                    } else {
                        // Ask to repeat
                        speakText(
                            options.language === "pidgin"
                                ? "I no hear the drug name clearly. Please talk am again."
                                : "I didn't hear the drug name clearly. Please repeat it.",
                            { language: options.language }
                        );
                    }
                }
            },
            onStateChange: options.onStateChange,
            onError: options.onError,
        });

        recognition?.start();
    }

    return {
        stop: () => {
            recognition?.stop();
            stopSpeaking();
        }
    };
}

/**
 * Voice-enabled upload verification
 */
export async function startVoiceUploadVerification(options: {
    language: Language;
    expectedDrugName?: string;
    onVerificationComplete: (confirmed: boolean, spokenName?: string) => void;
    onStateChange: OnStateChangeCallback;
    onError: (error: string) => void;
}): Promise<{ stop: () => void } | null> {
    if (!isSpeechRecognitionSupported()) {
        options.onError("Voice recognition is not supported in this browser");
        return null;
    }

    const prompt = options.expectedDrugName 
        ? (options.language === "pidgin"
            ? `I see ${options.expectedDrugName} for the picture. Talk 'yes' if e correct, or talk the correct drug name.`
            : `I can see ${options.expectedDrugName} in the image. Say 'yes' if correct, or speak the correct drug name.`)
        : (options.language === "pidgin" 
            ? "Please talk the drug name wey you see for the picture."
            : "Please speak the drug name you see in the image.");

    // Provide instructions
    await speakText(prompt, { 
        language: options.language,
        onEnd: () => startListening()
    });

    let recognition: ReturnType<typeof createSpeechRecognition> | null = null;

    function startListening() {
        recognition = createSpeechRecognition({
            language: options.language,
            mode: "upload_verify",
            onResult: (transcript, isFinal) => {
                if (isFinal) {
                    const response = transcript.toLowerCase().trim();
                    
                    // Check for confirmation words
                    if (["yes", "yeah", "correct", "right", "na true", "yes o"].some(word => response.includes(word))) {
                        options.onVerificationComplete(true);
                        speakText(
                            options.language === "pidgin" ? "Ok, I don confirm am." : "Okay, confirmed.",
                            { language: options.language }
                        );
                    } else {
                        // Extract drug name from response
                        const detectedDrug = analyzeDrugTranscript(transcript);
                        if (detectedDrug.name) {
                            options.onVerificationComplete(false, detectedDrug.name);
                            speakText(
                                options.language === "pidgin" 
                                    ? `Ok, I hear say na ${detectedDrug.name}. Make I check am.`
                                    : `Okay, I heard ${detectedDrug.name}. Let me check that.`,
                                { language: options.language }
                            );
                        } else {
                            speakText(
                                options.language === "pidgin"
                                    ? "I no hear clearly. Please try again."
                                    : "I didn't hear clearly. Please try again.",
                                { language: options.language }
                            );
                        }
                    }
                }
            },
            onStateChange: options.onStateChange,
            onError: options.onError,
        });

        recognition?.start();
    }

    return {
        stop: () => {
            recognition?.stop();
            stopSpeaking();
        }
    };
}

/**
 * Analyze transcript to detect drug names with confidence scoring
 */
function analyzeDrugTranscript(transcript: string): { name: string | null; confidence: number } {
    const processed = transcript.toLowerCase().trim();
    
    // Common Nigerian drug names with variants
    const drugDatabase = [
        { names: ["paracetamol", "para", "panadol"], canonical: "paracetamol" },
        { names: ["panadol", "pana"], canonical: "panadol" },
        { names: ["amoxicillin", "amoxy", "amoxil"], canonical: "amoxicillin" },
        { names: ["augmentin", "aug"], canonical: "augmentin" },
        { names: ["ibuprofen", "ibu", "brufen"], canonical: "ibuprofen" },
        { names: ["flagyl", "metronidazole"], canonical: "flagyl" },
        { names: ["coartem", "artemether"], canonical: "coartem" },
        { names: ["chloroquine", "chloro", "nivaquine"], canonical: "chloroquine" },
        { names: ["vitamin c", "vitamin", "ascorbic"], canonical: "vitamin c" },
        { names: ["folic acid", "folate", "folic"], canonical: "folic acid" },
        { names: ["iron tablets", "iron", "ferrous"], canonical: "iron tablets" },
        { names: ["septrin", "cotrimoxazole", "septran"], canonical: "septrin" },
        { names: ["ciprotab", "ciprofloxacin", "cipro"], canonical: "ciprotab" },
        { names: ["azithromycin", "zithromax"], canonical: "azithromycin" },
    ];

    let bestMatch = { name: null as string | null, confidence: 0 };

    for (const drug of drugDatabase) {
        for (const variant of drug.names) {
            if (processed.includes(variant)) {
                const confidence = variant.length / processed.length * 100;
                if (confidence > bestMatch.confidence) {
                    bestMatch = { name: drug.canonical, confidence };
                }
            }
        }
    }

    // Only return matches with confidence > 30%
    return bestMatch.confidence > 30 ? bestMatch : { name: null, confidence: 0 };
}
