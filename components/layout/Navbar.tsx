// components/layout/Navbar.tsx — Top navigation bar
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Bell, Leaf } from "lucide-react";
import { useAuth } from "../../hooks";

export const Navbar: React.FC = () => {
    const pathname = usePathname();
    const { user } = useAuth();
    const hideOn = ["/", "/onboarding", "/login", "/signup", "/verify-phone", "/verify-email", "/confirm-email"];
    if (hideOn.includes(pathname)) return null;

    const displayUser = user?.name?.split(' ')[0] || "Mama";

    return (
        <nav className="sticky top-0 z-40 h-16 bg-cream/80 dark:bg-charcoal/80 backdrop-blur-md border-b border-border px-4 lg:px-8 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
                    <Leaf className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="font-heading font-black text-xl leading-none text-primary-900 dark:text-primary-100">
                        Safely-Mama
                    </span>
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 tracking-widest uppercase">
                        AI Health Partner
                    </span>
                </div>
            </Link>

            <div className="flex items-center gap-2 lg:gap-4">
                <Link href="/reminders" className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-white/50 transition-all relative">
                    <Bell className="w-5 h-5" />
                </Link>
                <Link href="/profile" className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-full bg-white dark:bg-gray-800 border border-border hover:shadow-sm transition-all">
                    <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center border border-secondary-200">
                        <User className="w-4 h-4 text-secondary-600" />
                    </div>
                    <span className="hidden sm:inline text-sm font-bold">{displayUser} 🌿</span>
                </Link>
            </div>
        </nav>
    );
};
