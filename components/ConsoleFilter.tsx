'use client';

import { useEffect } from 'react';

export function ConsoleFilter() {
    useEffect(() => {
        // Only run in development and client-side
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            const originalConsoleError = console.error;
            
            console.error = (...args) => {
                const message = args.join(' ');
                
                // Suppress MetaMask and other extension-related errors
                const suppressedPatterns = [
                    'MetaMask',
                    'chrome-extension://',
                    'extension not found',
                    'Failed to connect to',
                    'cz-shortcut-listen',
                    'Extra attributes from the server'
                ];
                
                const shouldSuppress = suppressedPatterns.some(pattern => 
                    message.toLowerCase().includes(pattern.toLowerCase())
                );
                
                if (!shouldSuppress) {
                    originalConsoleError.apply(console, args);
                }
            };

            // Suppress uncaught promise rejections from browser extensions
            const handleRejection = (event: PromiseRejectionEvent) => {
                const message = event.reason?.message || '';
                
                if (message.includes('MetaMask') || message.includes('extension')) {
                    event.preventDefault();
                }
            };

            window.addEventListener('unhandledrejection', handleRejection);

            // Cleanup
            return () => {
                console.error = originalConsoleError;
                window.removeEventListener('unhandledrejection', handleRejection);
            };
        }
    }, []);

    return null;
}