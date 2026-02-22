import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from './useToast';

export interface UseVoiceOptions {
  language?: string;
  continuous?: boolean;
  timeout?: number;
  onResult?: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export interface DrugScanResult {
  drugName: string;
  confidence: number;
  found: boolean;
  safetyInfo?: {
    isPregnancySafe: boolean;
    category: string;
    warnings: string[];
  };
}

export function useVoice(options: UseVoiceOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [drugScanResult, setDrugScanResult] = useState<DrugScanResult | null>(null);
  const [mode, setMode] = useState<'general' | 'drug_scan' | 'upload_verify'>('general');

  const recognitionRef = useRef<any>(null);
  const { addToast } = useToast();

  // Check if speech recognition is supported on mount
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const { isSpeechRecognitionSupported } = await import('@/services/voice');
        setIsSupported(isSpeechRecognitionSupported());
      } catch {
        setIsSupported(false);
      }
    };
    checkSupport();
  }, []);

  const startListening = useCallback(async (voiceMode: 'general' | 'drug_scan' | 'upload_verify' = 'general') => {
    if (!isSupported) {
      const errorMsg = 'Speech recognition is not supported in this browser';
      setError(errorMsg);
      options.onError?.(errorMsg);
      addToast('Speech recognition not supported', 'error');
      return;
    }

    if (isListening) {
      return;
    }

    try {
      setError(null);
      setMode(voiceMode);
      
      // Import voice service dynamically
      const { createSpeechRecognition } = await import('@/services/voice');
      
      const recognition = createSpeechRecognition({
        language: 'en-NG' as any,
        mode: voiceMode,
        onResult: (transcript: string, isFinal: boolean) => {
          setTranscript(transcript);
          if (isFinal) {
            setConfidence(0.9); // Estimate confidence for final results
            options.onResult?.(transcript, 0.9);
          }
        },
        onStateChange: (state: any) => {
          setIsListening(state === 'listening');
        },
        onError: (error: string) => {
          setError(error);
          setIsListening(false);
          options.onError?.(error);
          addToast(`Voice error: ${error}`, 'error');
        }
      });

      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        
        if (voiceMode === 'drug_scan') {
          addToast('Listening for drug name in English or local language...', 'info');
        } else if (voiceMode === 'upload_verify') {
          addToast('Say "confirm" or "cancel" to verify your upload...', 'info');
        } else {
          addToast('Listening...', 'info');
        }
      }
    } catch (err) {
      const errorMsg = `Failed to start voice recognition: ${err}`;
      setError(errorMsg);
      options.onError?.(errorMsg);
      addToast(errorMsg, 'error');
    }
  }, [isSupported, isListening, options, addToast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startDrugScan = useCallback(async () => {
    if (!isSupported) {
      addToast('Voice recognition not supported', 'error');
      return;
    }

    try {
      const { startVoiceDrugScan } = await import('@/services/voice');
      
      setError(null);
      setDrugScanResult(null);
      setMode('drug_scan');
      
      const result = await startVoiceDrugScan({
        language: 'en-NG' as any,
        onDrugDetected: (drugName: string, confidence: number) => {
          const result: DrugScanResult = {
            drugName,
            confidence,
            found: true,
            safetyInfo: undefined // Will be populated by the service
          };
          setDrugScanResult(result);
          addToast(`Found: ${drugName} (${Math.round(confidence * 100)}% confidence)`, 'success');
        },
        onStateChange: (state: any) => {
          setIsListening(state === 'listening');
        },
        onError: (error: string) => {
          setError(error);
          addToast(`Scan error: ${error}`, 'error');
        }
      });

      return result;
    } catch (err) {
      const errorMsg = `Drug scan failed: ${err}`;
      setError(errorMsg);
      addToast(errorMsg, 'error');
      setIsListening(false);
    }
  }, [isSupported, addToast]);

  const startUploadVerification = useCallback(async () => {
    if (!isSupported) {
      addToast('Voice recognition not supported', 'error');
      return;
    }

    try {
      const { startVoiceUploadVerification } = await import('@/services/voice');
      
      setError(null);
      setMode('upload_verify');
      
      const result = await startVoiceUploadVerification({
        language: 'en-NG' as any,
        onVerificationComplete: (confirmed: boolean) => {
          if (confirmed) {
            addToast('Upload confirmed!', 'success');
          } else {
            addToast('Upload cancelled', 'info');
          }
          setIsListening(false);
        },
        onStateChange: (state: any) => {
          setIsListening(state === 'listening');
        },
        onError: (error: string) => {
          setError(error);
          addToast(`Verification error: ${error}`, 'error');
          setIsListening(false);
        }
      });

      return result;
    } catch (err) {
      const errorMsg = `Upload verification failed: ${err}`;
      setError(errorMsg);
      addToast(errorMsg, 'error');
      setIsListening(false);
    }
  }, [isSupported, addToast]);

  const reset = useCallback(() => {
    stopListening();
    setTranscript('');
    setConfidence(0);
    setError(null);
    setDrugScanResult(null);
    setMode('general');
  }, [stopListening]);

  return {
    // State
    isListening,
    isSupported,
    transcript,
    confidence,
    error,
    drugScanResult,
    mode,
    
    // Actions
    startListening,
    stopListening,
    startDrugScan,
    startUploadVerification,
    reset
  };
}