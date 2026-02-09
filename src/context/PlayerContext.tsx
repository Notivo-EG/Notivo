"use client";

import { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect } from "react";

export interface Track {
    id: string;
    title: string;
    audioUrl: string;
    coverUrl?: string;
    lyrics?: string;
    courseId?: string;
    style?: string;
}

interface PlayerContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    showLyrics: boolean;
    playTrack: (track: Track) => void;
    pause: () => void;
    resume: () => void;
    togglePlayPause: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    closePlayer: () => void;
    toggleLyrics: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(1);
    const [showLyrics, setShowLyrics] = useState(false);

    // Ensure audio element exists
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.volume = volume;

            audioRef.current.addEventListener('timeupdate', () => {
                setCurrentTime(audioRef.current?.currentTime || 0);
            });

            audioRef.current.addEventListener('durationchange', () => {
                setDuration(audioRef.current?.duration || 0);
            });

            audioRef.current.addEventListener('ended', () => {
                setIsPlaying(false);
            });

            audioRef.current.addEventListener('play', () => setIsPlaying(true));
            audioRef.current.addEventListener('pause', () => setIsPlaying(false));
        }

        return () => {
            audioRef.current?.pause();
        };
    }, []);

    const playTrack = useCallback((track: Track) => {
        if (audioRef.current) {
            // If same track, just resume
            if (currentTrack?.audioUrl === track.audioUrl) {
                audioRef.current.play();
                return;
            }

            audioRef.current.src = track.audioUrl;
            audioRef.current.play();
            setCurrentTrack(track);
            setCurrentTime(0);
        }
    }, [currentTrack?.audioUrl]);

    const pause = useCallback(() => {
        audioRef.current?.pause();
    }, []);

    const resume = useCallback(() => {
        audioRef.current?.play();
    }, []);

    const togglePlayPause = useCallback(() => {
        if (isPlaying) {
            pause();
        } else {
            resume();
        }
    }, [isPlaying, pause, resume]);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const setVolume = useCallback((vol: number) => {
        if (audioRef.current) {
            audioRef.current.volume = vol;
            setVolumeState(vol);
        }
    }, []);

    const closePlayer = useCallback(() => {
        audioRef.current?.pause();
        setCurrentTrack(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setShowLyrics(false);
    }, []);

    const toggleLyrics = useCallback(() => {
        setShowLyrics(prev => !prev);
    }, []);

    return (
        <PlayerContext.Provider value={{
            currentTrack,
            isPlaying,
            currentTime,
            duration,
            volume,
            showLyrics,
            playTrack,
            pause,
            resume,
            togglePlayPause,
            seek,
            setVolume,
            closePlayer,
            toggleLyrics,
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error("usePlayer must be used within a PlayerProvider");
    }
    return context;
}
