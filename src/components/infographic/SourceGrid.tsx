'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SourceCard } from './SourceCard';
import { SourceFile } from '@/lib/types';

interface SourceGridProps {
    files: SourceFile[];
    onToggleSelection: (id: string) => void;
    onRemove: (id: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    selectedCount: number;
}

export function SourceGrid({
    files,
    onToggleSelection,
    onRemove,
    onSelectAll,
    onDeselectAll,
    selectedCount,
}: SourceGridProps) {
    if (files.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
            >
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700"
                >
                    <FileX className="h-10 w-10 text-muted-foreground" />
                </motion.div>
                <h3 className="text-lg font-semibold text-foreground">No documents yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Upload some documents to get started
                </p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Selection controls */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {selectedCount} of {files.length} selected
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onSelectAll}
                        className="text-xs"
                    >
                        <CheckSquare className="mr-1 h-3.5 w-3.5" />
                        Select All
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDeselectAll}
                        className="text-xs"
                    >
                        <Square className="mr-1 h-3.5 w-3.5" />
                        Deselect All
                    </Button>
                </div>
            </motion.div>

            {/* File grid */}
            <motion.div
                layout
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
                <AnimatePresence mode="popLayout">
                    {files.map((file, index) => (
                        <SourceCard
                            key={file.id}
                            file={file}
                            onToggleSelection={onToggleSelection}
                            onRemove={onRemove}
                            index={index}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
