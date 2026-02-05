'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PanelRightClose,
    PanelRightOpen,
    Search,
    ArrowUpDown,
    Trash2,
    Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InfographicItem } from './InfographicItem';
import { Infographic } from '@/lib/types';

interface SidebarProps {
    infographics: Infographic[];
    onViewInfographic: (infographic: Infographic) => void;
    onDeleteInfographic: (id: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: 'date' | 'name';
    onSortChange: (sort: 'date' | 'name') => void;
}

export function Sidebar({
    infographics,
    onViewInfographic,
    onDeleteInfographic,
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
}: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <>
            {/* Collapsed state toggle (always visible on mobile) */}
            <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="fixed right-4 top-20 z-40 lg:hidden"
            >
                {isCollapsed ? (
                    <PanelRightOpen className="h-4 w-4" />
                ) : (
                    <PanelRightClose className="h-4 w-4" />
                )}
            </Button>

            {/* Overlay for mobile */}
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCollapsed(true)}
                        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar panel */}
            <motion.aside
                initial={false}
                animate={{
                    x: isCollapsed ? '100%' : 0,
                    opacity: isCollapsed ? 0 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`
          fixed bottom-0 right-0 top-16 z-40 w-80 border-l border-border bg-background
          lg:static lg:z-auto lg:translate-x-0 lg:opacity-100
        `}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="border-b border-border p-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-foreground">Generated Infographics</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsCollapsed(true)}
                                className="hidden lg:flex"
                            >
                                <PanelRightClose className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search infographics..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Sort */}
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                {infographics.length} item{infographics.length !== 1 ? 's' : ''}
                            </span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
                                        Sort by {sortBy}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onSortChange('date')}>
                                        Sort by Date
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onSortChange('name')}>
                                        Sort by Name
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Infographic list */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {infographics.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-12 text-center"
                            >
                                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                                    <ImageIcon className="h-7 w-7 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium text-foreground">No infographics yet</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Generate your first infographic!
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div layout className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {infographics.map((infographic, index) => (
                                        <InfographicItem
                                            key={infographic.id}
                                            infographic={infographic}
                                            onClick={() => onViewInfographic(infographic)}
                                            onDelete={() => onDeleteInfographic(infographic.id)}
                                            index={index}
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* Collapsed toggle for desktop */}
            {isCollapsed && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:block"
                >
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsCollapsed(false)}
                        className="fixed right-4 top-20"
                    >
                        <PanelRightOpen className="h-4 w-4" />
                    </Button>
                </motion.div>
            )}
        </>
    );
}
