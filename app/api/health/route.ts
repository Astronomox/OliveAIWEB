// app/api/health/route.ts — Backend health check endpoint
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Check environment configuration
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://olive-backend-bly2.onrender.com';
        const googleVisionKey = !!process.env.GOOGLE_VISION_API_KEY;
        
        // Test backend connectivity
        let backendStatus = 'offline';
        let backendError = null;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`${backendUrl}/health`, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                backendStatus = 'online';
            } else {
                backendStatus = `error_${response.status}`;
            }
        } catch (error: any) {
            backendError = error.message;
            if (error.name === 'AbortError') {
                backendStatus = 'timeout';
            } else if (error.code === 'ENOTFOUND') {
                backendStatus = 'dns_error';
            } else {
                backendStatus = 'network_error';
            }
        }

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                backend: {
                    url: backendUrl,
                    status: backendStatus,
                    error: backendError
                },
                ocr: {
                    googleVision: googleVisionKey ? 'configured' : 'not_configured',
                    status: googleVisionKey ? 'available' : 'demo_mode'
                }
            },
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}