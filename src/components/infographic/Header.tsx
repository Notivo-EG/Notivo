'use client';

import { motion } from 'framer-motion';
import { FileImage, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 shadow-lg shadow-blue-500/25">
                            <FileImage className="h-5 w-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-xl font-bold text-transparent">
                            InfographAI
                        </span>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-6 md:flex">
                        <NavLink href="#" active>Dashboard</NavLink>
                        <NavLink href="#">History</NavLink>
                        <NavLink href="#">Settings</NavLink>
                    </nav>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <motion.div
                            animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </motion.div>
                    </Button>
                </div>

                {/* Mobile Menu */}
                <motion.nav
                    initial={false}
                    animate={{
                        height: isMobileMenuOpen ? 'auto' : 0,
                        opacity: isMobileMenuOpen ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden md:hidden"
                >
                    <div className="space-y-1 pb-4">
                        <MobileNavLink href="#" active>Dashboard</MobileNavLink>
                        <MobileNavLink href="#">History</MobileNavLink>
                        <MobileNavLink href="#">Settings</MobileNavLink>
                    </div>
                </motion.nav>
            </div>
        </motion.header>
    );
}

function NavLink({
    href,
    children,
    active = false
}: {
    href: string;
    children: React.ReactNode;
    active?: boolean;
}) {
    return (
        <motion.a
            href={href}
            className={`relative px-1 py-2 text-sm font-medium transition-colors ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
            whileHover={{ y: -1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
            {children}
            {active && (
                <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                />
            )}
        </motion.a>
    );
}

function MobileNavLink({
    href,
    children,
    active = false
}: {
    href: string;
    children: React.ReactNode;
    active?: boolean;
}) {
    return (
        <a
            href={href}
            className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
        >
            {children}
        </a>
    );
}
