"use client";

import { usePlayer } from "@/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    Pause,
    X,
    Volume2,
    VolumeX,
    Music,
    Mic2,
} from "lucide-react";
import { useEffect, useRef } from "react";

function formatTime(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function GlobalPlayer() {
    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        showLyrics,
        togglePlayPause,
        seek,
        setVolume,
        closePlayer,
        toggleLyrics,
    } = usePlayer();

    const progressRef = useRef<HTMLDivElement>(null);
    const lyricsRef = useRef<HTMLDivElement>(null);

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current || !duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seek(percent * duration);
    };

    useEffect(() => {
        if (lyricsRef.current && showLyrics) {
            const scrollPercent = duration > 0 ? currentTime / duration : 0;
            const maxScroll = lyricsRef.current.scrollHeight - lyricsRef.current.clientHeight;
            lyricsRef.current.scrollTop = maxScroll * scrollPercent;
        }
    }, [currentTime, duration, showLyrics]);

    if (!currentTrack) return null;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50"
            >
                {/* Lyrics Panel */}
                <AnimatePresence>
                    {showLyrics && currentTrack.lyrics && (
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute bottom-full left-0 right-0 h-[60vh] sm:h-[500px] bg-card-bg/95 backdrop-blur-2xl border-t border-card-border shadow-2xl z-40 flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-8 py-6 border-b border-card-border/50 bg-gradient-to-b from-foreground/5 to-transparent">
                                <div>
                                    <h3 className="text-2xl font-bold text-foreground tracking-tight">Lyrics</h3>
                                    <p className="text-sm text-foreground/50 mt-1 font-medium">{currentTrack.title}</p>
                                </div>
                                <button
                                    onClick={toggleLyrics}
                                    className="p-2 rounded-full hover:bg-foreground/10 text-foreground/50 hover:text-foreground transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Lyrics Scroll Area */}
                            <div
                                ref={lyricsRef}
                                className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-10 text-center bg-gradient-to-b from-transparent via-background/5 to-background/20"
                            >
                                <div className="max-w-4xl mx-auto space-y-6 py-10">
                                    {currentTrack.lyrics.split('\n').filter(line => line.trim() !== '').map((line, index, array) => {
                                        const totalLines = array.length;
                                        const progressPercent = duration > 0 ? currentTime / duration : 0;
                                        const currentLineIndex = Math.min(Math.floor(progressPercent * totalLines), totalLines - 1);
                                        const isActive = index === currentLineIndex;

                                        return (
                                            <p
                                                key={index}
                                                className={`text-xl sm:text-2xl md:text-3xl font-bold transition-all duration-500 ease-out transform origin-center cursor-pointer hover:opacity-100 ${isActive
                                                        ? 'text-white opacity-100 scale-105 blur-none'
                                                        : 'text-foreground opacity-30 scale-100 blur-[1px]'
                                                    }`}
                                                style={{ textShadow: isActive ? "0 0 20px rgba(255,255,255,0.3)" : "none" }}
                                                onClick={() => {
                                                    // Optional: Seek to approximate part of song
                                                    const seekTime = (index / totalLines) * duration;
                                                    seek(seekTime);
                                                }}
                                            >
                                                {line}
                                            </p>
                                        );
                                    })}
                                </div>
                                <div className="h-40" /> {/* Spacer for bottom scroll */}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Player Bar */}
                <div className="bg-card-bg/95 backdrop-blur-xl border-t border-card-border">
                    {/* Progress Bar */}
                    <div
                        ref={progressRef}
                        onClick={handleProgressClick}
                        className="h-1 w-full bg-foreground/10 cursor-pointer group"
                    >
                        <div
                            className="h-full bg-foreground relative transition-all"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 px-6 py-3">
                        {/* Track Info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            {currentTrack.coverUrl ? (
                                <img
                                    src={currentTrack.coverUrl}
                                    alt=""
                                    className="w-14 h-14 rounded-xl object-cover"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-xl bg-foreground/10 flex items-center justify-center">
                                    <Music className="w-6 h-6 text-foreground/40" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="font-bold text-foreground truncate">
                                    {currentTrack.title}
                                </p>
                                <p className="text-xs text-foreground/50 truncate">
                                    {currentTrack.style || "AI Generated"}
                                </p>
                            </div>
                        </div>

                        {/* Center Controls */}
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-foreground/50 w-12 text-right tabular-nums">
                                {formatTime(currentTime)}
                            </span>

                            <button
                                onClick={togglePlayPause}
                                className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                            >
                                {isPlaying ? (
                                    <Pause className="w-5 h-5 text-background" />
                                ) : (
                                    <Play className="w-5 h-5 text-background ml-0.5" />
                                )}
                            </button>

                            <span className="text-xs text-foreground/50 w-12 tabular-nums">
                                {formatTime(duration)}
                            </span>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-2 flex-1 justify-end">
                            {currentTrack.lyrics && (
                                <button
                                    onClick={toggleLyrics}
                                    className={`p-2 rounded-full transition-all ${showLyrics
                                        ? 'bg-primary/20 text-primary'
                                        : 'hover:bg-foreground/10 text-foreground/60 hover:text-foreground'
                                        }`}
                                    title="Show Lyrics"
                                >
                                    <Mic2 className="w-5 h-5" />
                                </button>
                            )}

                            {/* Volume Control */}
                            <div className="flex items-center gap-2 group">
                                <button
                                    onClick={() => setVolume(volume === 0 ? 1 : 0)}
                                    className="p-2 text-foreground/50 hover:text-foreground transition-colors"
                                >
                                    {volume === 0 ? (
                                        <VolumeX className="w-5 h-5" />
                                    ) : (
                                        <Volume2 className="w-5 h-5" />
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="w-20 h-1 bg-foreground/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                            </div>

                            {/* Close */}
                            <button
                                onClick={closePlayer}
                                className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-all"
                                title="Close Player"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
