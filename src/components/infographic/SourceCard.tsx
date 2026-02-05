'use client';

import { motion } from 'framer-motion';
import { FileText, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { SourceFile } from '@/lib/types';

interface SourceCardProps {
    file: SourceFile;
    onToggleSelection: (id: string) => void;
    onRemove: (id: string) => void;
    index: number;
}

export function SourceCard({ file, onToggleSelection, onRemove, index }: SourceCardProps) {
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const getFileIcon = (type: string) => {
        // In a production app, you'd have different icons for different file types
        return <FileText className="h-8 w-8" />;
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{
                duration: 0.3,
                delay: index * 0.05,
                type: 'spring',
                stiffness: 300,
                damping: 25,
            }}
            whileHover={{ y: -2, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
            className={`
        group relative rounded-xl border bg-card p-4 
        transition-all duration-200
        ${file.selected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10'
                    : 'border-border hover:border-blue-300'
                }
      `}
        >
            {/* Selection checkbox */}
            <div className="absolute left-3 top-3">
                <motion.div
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onToggleSelection(file.id)}
                    className="cursor-pointer"
                >
                    <Checkbox
                        checked={file.selected}
                        onCheckedChange={() => onToggleSelection(file.id)}
                        className={`
              h-5 w-5 rounded-md transition-all
              ${file.selected
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-border'
                            }
            `}
                    />
                </motion.div>
            </div>

            {/* Remove button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(file.id)}
                className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            >
                <X className="h-4 w-4 text-muted-foreground" />
            </Button>

            {/* File icon/thumbnail */}
            <div className="mb-4 mt-2 flex justify-center">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`
            flex h-16 w-16 items-center justify-center rounded-xl
            ${file.selected
                            ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white'
                            : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 dark:from-slate-800 dark:to-slate-700 dark:text-slate-400'
                        }
          `}
                >
                    {getFileIcon(file.type)}
                </motion.div>
            </div>

            {/* File info */}
            <div className="space-y-1 text-center">
                <p className="truncate text-sm font-medium text-foreground" title={file.name}>
                    {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                </p>
            </div>

            {/* Upload progress (if not complete) */}
            {file.uploadProgress < 100 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3"
                >
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${file.uploadProgress}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                        />
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
