// hooks/useCamera.ts — WebRTC camera hook for drug scanning
import { useState, useCallback, useRef } from "react";

export function useCamera() {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const startCamera = useCallback(async () => {
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment", // rear camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                // Must call play() explicitly — some browsers require it
                try {
                    await videoRef.current.play();
                } catch {
                    // play() may fail on some browsers; video still works via srcObject
                }
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
    }, []);

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
