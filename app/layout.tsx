// app/layout.tsx — Root layout for the Olive AI web app
import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { BackendWakeup } from "@/components/layout/BackendWakeup";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
    title: "Olive AI | Medi-Sync Health Partner",
    description: "AI-powered medication safety, prescription scanning, and maternal wellness companion for Nigerian mothers.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Olive AI",
    },
};

export const viewport: Viewport = {
    themeColor: "#0A6B4B",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={cn(inter.variable, jakarta.variable)}>
            <body className="flex flex-col min-h-screen bg-cream text-charcoal selection:bg-primary-100 selection:text-primary-900 font-body">
                <BackendWakeup />
                <Navbar />

                <div className="flex flex-1">
                    <Sidebar />

                    <main className="flex-1 w-full px-4 pt-6 pb-32 lg:pb-12 overflow-x-hidden">
                        {/* Skip to main content link for keyboard users */}
                        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-primary-500 focus:text-white focus:p-4 focus:rounded-b-2xl">
                            Skip to main content
                        </a>

                        <div id="main-content">
                            {children}
                        </div>
                    </main>
                </div>

                <BottomNav />
            </body>
        </html>
    );
}
