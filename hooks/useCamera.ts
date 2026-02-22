// hooks/useCamera.ts — WebRTC camera hook for drug scanning
import { useState, useCallback, useRef } from "react";

export function useCamera() {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const startCamera = useCallback(async () => {
        setError(null);
        
        // Don't restart if already active
        if (stream) return;
        
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment", // rear camera on mobile
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    frameRate: { ideal: 30, max: 30 }
                },
                audio: false,
            });
            
            setStream(mediaStream);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.playsInline = true;
                videoRef.current.muted = true;
                
                // Wait for video metadata before playing
                videoRef.current.onloadedmetadata = async () => {
                    try {
                        await videoRef.current?.play();
                    } catch {
                        console.log("[Camera] Play failed, but stream is active");
                    }
                };
            }
        } catch (err: any) {
            console.error("[Camera] Access error:", err);
            if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
                setError("Camera permission denied. Go to your browser settings and allow camera access.");
            } else if (err?.name === "NotFoundError") {
                setError("No camera found on this device. Use the Upload tab instead.");
            } else {
                setError("Could not access camera. Please try again or use the Upload tab.");
            }
        }
    }, [stream]);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, [stream]);

    const captureFrame = useCallback((): string | null => {
        if (!videoRef.current) return null;
        const video = videoRef.current;

        // Must have actual video dimensions
        if (!video.videoWidth || !video.videoHeight) return null;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0);
        return canvas.toDataURL("image/jpeg", 0.9);
    }, []);

    return {
        videoRef,
        stream,
        error,
        startCamera,
        stopCamera,
        captureFrame,
        isActive: !!stream,
    };
}
