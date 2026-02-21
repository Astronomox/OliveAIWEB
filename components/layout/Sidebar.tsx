// components/layout/Sidebar.tsx — Desktop sidebar navigation
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, Scan, MessageCircle, HeartPulse, User as UserIcon, LogOut,
    Pill, Bell, ClipboardList, Search
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks";

export const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const { logout, isAuthenticated } = useAuth();
    const hideOn = ["/", "/onboarding", "/login", "/signup", "/auth", "/verify-phone", "/verify-email", "/confirm-email"];
    if (hideOn.includes(pathname)) return null;

    const links = [
        { href: "/dashboard", label: "Home Dashboard", icon: Home },
        { href: "/scan", label: "Drug Scanner", icon: Scan },
        { href: "/prescriptions", label: "Prescriptions", icon: ClipboardList },
        { href: "/medications", label: "Medications", icon: Pill },
        { href: "/reminders", label: "Reminders", icon: Bell },
        { href: "/drugs", label: "Drug Search", icon: Search },
        { href: "/pregnancy", label: "Safety Filter", icon: HeartPulse },
        { href: "/mama", label: "Talk to Mama", icon: MessageCircle },
        { href: "/profile", label: "My Settings", icon: UserIcon },
    ];

    return (
        <aside className="hidden lg:flex flex-col w-72 h-[calc(100vh-4rem)] sticky top-16 border-r border-border p-6 bg-cream/30">
            <div className="space-y-1.5">
                {links.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (pathname && pathname.startsWith(href + "/"));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-200 text-sm",
                                isActive
                                    ? "bg-primary-500 text-white shadow-lg"
                                    : "text-muted-foreground hover:bg-white hover:text-primary-600"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{label}</span>
                        </Link>
                    );
                })}

                {isAuthenticated && (
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm text-danger-600 hover:bg-danger-50 transition-all duration-200 mt-4"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                )}
            </div>

            <div className="mt-auto p-5 rounded-3xl bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-100 dark:border-secondary-800">
                <p className="text-sm font-bold text-secondary-800 dark:text-secondary-400 mb-2">Mama AI Tip:</p>
                <p className="text-xs text-secondary-700 dark:text-secondary-300 leading-relaxed italic">
                    &quot;Don&apos;t forget to take your folic acid today, Mama 🌿&quot;
                </p>
            </div>
        </aside>
    );
};
