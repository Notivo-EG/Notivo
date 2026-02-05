'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Download, FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Infographic } from '@/lib/types';

interface OverlayViewerProps {
    infographic: Infographic | null;
    onClose: () => void;
}

export function OverlayViewer({ infographic, onClose }: OverlayViewerProps) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset on open
    useEffect(() => {
        if (infographic) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [infographic]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!infographic) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case '+':
                case '=':
                    handleZoomIn();
                    break;
                case '-':
                    handleZoomOut();
                    break;
                case '0':
                    handleReset();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [infographic, onClose]);

    // Mouse wheel zoom
    useEffect(() => {
        if (!infographic) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setScale(prev => Math.min(Math.max(0.5, prev + delta), 3));
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, [infographic]);

    const handleZoomIn = useCallback(() => {
        setScale(prev => Math.min(prev + 0.25, 3));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale(prev => Math.max(prev - 0.25, 0.5));
    }, []);

    const handleReset = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    const handleDownload = useCallback(() => {
        if (!infographic) return;

        const link = document.createElement('a');
        link.href = infographic.imageUrl;
        link.download = `${infographic.title.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [infographic]);

    const handleDragStart = useCallback(() => {
        if (scale > 1) {
            setIsDragging(true);
        }
    }, [scale]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleDrag = useCallback((e: React.MouseEvent) => {
        if (!isDragging || scale <= 1) return;

        setPosition(prev => ({
            x: prev.x + e.movementX,
            y: prev.y + e.movementY,
        }));
    }, [isDragging, scale]);

    if (!infographic) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
                ref={containerRef}
            >
                {/* Top bar */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur-xl"
                >
                    <div>
                        <h2 className="text-lg font-semibold text-white">{infographic.title}</h2>
                        <p className="text-sm text-white/60">
                            {infographic.sources.length} source{infographic.sources.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Zoom controls */}
                        <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleZoomOut}
                                className="h-8 w-8 text-white hover:bg-white/20"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="min-w-[3rem] text-center text-sm text-white">
                                {Math.round(scale * 100)}%
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleZoomIn}
                                className="h-8 w-8 text-white hover:bg-white/20"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleReset}
                                className="h-8 w-8 text-white hover:bg-white/20"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDownload}
                            className="h-8 w-8 text-white hover:bg-white/20"
                        >
                            <Download className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 text-white hover:bg-white/20"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </motion.div>

                {/* Image container */}
                <div
                    className={`flex-1 overflow-hidden ${scale > 1 ? 'cursor-grab' : 'cursor-default'} ${isDragging ? 'cursor-grabbing' : ''}`}
                    onMouseDown={handleDragStart}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onMouseMove={handleDrag}
                >
                    <motion.div
                        className="flex h-full items-center justify-center p-8"
                        animate={{
                            scale,
                            x: position.x,
                            y: position.y,
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <motion.img
                            src={infographic.imageUrl}
                            alt={infographic.title}
                            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            draggable={false}
                        />
                    </motion.div>
                </div>

                {/* Source info panel */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="border-t border-white/10 bg-black/50 px-4 py-3 backdrop-blur-xl"
                >
                    <div className="flex items-center gap-2 text-sm text-white/80">
                        <FileText className="h-4 w-4" />
                        <span>Sources:</span>
                        <div className="flex flex-wrap gap-2">
                            {infographic.sources.map((source) => (
                                <span
                                    key={source.id}
                                    className="rounded-full bg-white/10 px-2 py-0.5 text-xs"
                                >
                                    {source.name}
                                </span>
                            ))}
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-white/40">
                        Tip: Use mouse wheel to zoom, drag to pan when zoomed. Press Escape to close.
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
