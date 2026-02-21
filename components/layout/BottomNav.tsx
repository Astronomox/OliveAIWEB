// components/layout/BottomNav.tsx — Mobile bottom navigation
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Scan, Pill, Bell, User as UserIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export const BottomNav: React.FC = () => {
    const pathname = usePathname();
    const hideOn = ["/", "/onboarding", "/login", "/signup", "/verify-phone", "/verify-email", "/confirm-email"];
    if (hideOn.includes(pathname)) return null;

    const links = [
        { href: "/dashboard", label: "Home", icon: Home },
        { href: "/scan", label: "Scan", icon: Scan },
        { href: "/medications", label: "Meds", icon: Pill },
        { href: "/reminders", label: "Alerts", icon: Bell },
        { href: "/profile", label: "Profile", icon: UserIcon },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg border-t border-border px-4 pt-2 pb-6 flex items-center justify-around">
            {links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            "flex flex-col items-center gap-1 group relative",
                            isActive ? "text-primary-600" : "text-muted-foreground"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-2xl transition-all duration-300",
                            isActive ? "bg-primary-50 dark:bg-primary-900/30" : "group-hover:bg-gray-100 dark:group-hover:bg-gray-900",
                        )}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
                    </Link>
                );
            })}
        </div>
    );
};
