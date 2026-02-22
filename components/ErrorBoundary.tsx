'use client';

import { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        // Only log non-MetaMask errors to avoid console spam
        if (!error.message.includes('MetaMask')) {
            console.error('Error caught by boundary:', error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            // Don't show error UI for MetaMask-related errors
            if (this.state.error?.message.includes('MetaMask')) {
                return this.props.children;
            }

            return this.props.fallback || (
                <div className="flex items-center justify-center min-h-screen bg-cream">
                    <div className="text-center p-8">
                        <h2 className="text-xl font-bold text-primary-900 mb-2">Something went wrong</h2>
                        <p className="text-primary-600 mb-4">Please refresh the page to try again.</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}