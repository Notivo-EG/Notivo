"use client";

import { useRef, useState, useEffect } from "react";
import {
    Play, Pause, Volume2, VolumeX, Maximize, Minimize,
    SkipBack, SkipForward, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CustomVideoPlayerProps {
    src: string;
    poster?: string;
    autoplay?: boolean;
    onEnded?: () => void;
    title?: string;
}

export function CustomVideoPlayer({ src, poster, autoplay = false, onEnded, title }: CustomVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (videoRef.current) {
            if (autoplay) {
                videoRef.current.play().catch(() => {
                    // Autoplay prevented
                    setIsPlaying(false);
                });
            }
        }
    }, [src, autoplay]);

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setProgress((current / total) * 100);
            if (total !== duration) setDuration(total);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (videoRef.current && containerRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percent = clickX / rect.width;
            videoRef.current.currentTime = percent * videoRef.current.duration;
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            setIsMuted(val === 0);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    return (
        <div
            ref={containerRef}
            className="relative group bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                    setIsPlaying(false);
                    onEnded?.();
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlay}
            />

            {/* Overlay Play Button (Big) */}
            <AnimatePresence>
                {!isPlaying && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onClick={togglePlay}
                        className="absolute inset-0 m-auto w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all z-10"
                    >
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Controls Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12 z-20"
            >
                {/* Progress Bar */}
                <div
                    className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-4 group/progress relative"
                    onClick={handleSeek}
                >
                    <div
                        className="h-full bg-primary rounded-full relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg scale-0 group-hover/progress:scale-100" />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white/90 hover:text-white transition-colors">
                            {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
                        </button>

                        <div className="flex items-center gap-2 group/vol">
                            <button onClick={toggleMute} className="text-white/90 hover:text-white transition-colors">
                                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                />
                            </div>
                        </div>

                        <div className="text-xs text-white/60 font-medium tabular-nums">
                            {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {title && <span className="text-sm text-white/80 font-medium hidden sm:block">{title}</span>}
                        <button onClick={toggleFullscreen} className="text-white/90 hover:text-white transition-colors">
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
