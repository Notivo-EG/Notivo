"use client";

import { motion } from "framer-motion";
import { Home, BookOpen, LayoutDashboard, Settings, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Don't show navbar on landing, login, signup pages
    if (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/setup") {
        return null;
    }

    return (
        <>
            {/* Desktop Sidebar - Theme Aware */}
            <nav className="hidden lg:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-8 bg-card-bg/80 backdrop-blur-xl border-r border-card-border z-50">
                {/* Logo */}
                <Link href="/dashboard" className="mb-10">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
                        <Image
                            src="/logo.png"
                            alt="Notiva Logo"
                            width={35}
                            height={35}
                            className="dark:invert"
                        />
                    </div>
                </Link>

                {/* Nav Items */}
                <div className="flex-1 flex flex-col items-center gap-6">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <Link key={item.href} href={item.href}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group
                                        ${isActive
                                            ? "text-foreground shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                            : "text-foreground/40 hover:text-foreground"
                                        }`}
                                >
                                    {/* Active/Hover Background */}
                                    <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${isActive
                                        ? "bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-card-border opacity-100"
                                        : "bg-foreground/5 opacity-0 group-hover:opacity-100"
                                        }`} />

                                    <Icon className="w-5 h-5 relative z-10" />
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Mobile Header - Theme Aware */}
            <nav className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card-bg/80 backdrop-blur-xl border-b border-card-border z-50 flex items-center justify-between px-4">
                <Link href="/dashboard">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                        <Image
                            src="/logo.png"
                            alt="Notiva Logo"
                            width={40}
                            height={40}
                            className="dark:invert"
                        />
                    </div>
                </Link>

                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground border border-card-border"
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </nav>

            {/* Mobile Overlay Menu */}
            {mobileOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="lg:hidden fixed top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-card-border z-40 p-4"
                >
                    <div className="space-y-2">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            const Icon = item.icon;

                            return (
                                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                                    <div
                                        className={`flex items-center gap-3 p-4 rounded-xl transition-all border ${isActive
                                            ? "bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-card-border text-foreground"
                                            : "border-transparent text-foreground/60 hover:bg-foreground/5"
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Spacer */}
            <div className="lg:hidden h-16" />
            <div className="hidden lg:block w-20" />
        </>
    );
}
