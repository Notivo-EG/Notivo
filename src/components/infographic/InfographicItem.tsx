'use client';

import { motion } from 'framer-motion';
import { Trash2, Eye, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Infographic } from '@/lib/types';

interface InfographicItemProps {
    infographic: Infographic;
    onClick: () => void;
    onDelete: () => void;
    index: number;
}

export function InfographicItem({ infographic, onClick, onDelete, index }: InfographicItemProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            transition={{
                duration: 0.2,
                delay: index * 0.05,
                type: 'spring',
                stiffness: 300,
                damping: 25,
            }}
            whileHover={{ scale: 1.02, x: -2 }}
            className="group relative overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
        >
            {/* Thumbnail */}
            <div
                onClick={onClick}
                className="relative aspect-video cursor-pointer overflow-hidden"
            >
                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <motion.img
                    key={infographic.imageUrl}
                    src={infographic.imageUrl}
                    alt={infographic.title}
                    className="h-full w-full object-cover relative z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ opacity: 1, scale: 1 }}
                        className="opacity-0 group-hover:opacity-100"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
                            <Eye className="h-5 w-5 text-slate-700" />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Info */}
            <div className="p-3">
                <h3 className="truncate text-sm font-medium text-foreground">
                    {infographic.title}
                </h3>

                <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(infographic.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {infographic.sources.length} source{infographic.sources.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
