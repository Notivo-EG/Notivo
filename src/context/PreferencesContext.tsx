"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";

type SoundType = 'click' | 'on' | 'off' | 'success' | 'error';

type Preferences = {
    darkMode: boolean;
    reducedMotion: boolean;
    soundEffects: boolean;
    studyReminders: boolean; // Keep for DB compatibility
    examAlerts: boolean;     // Keep for DB compatibility
};

type PreferencesContextType = {
    preferences: Preferences;
    togglePreference: (key: keyof Preferences) => void;
    playSound: (type: SoundType) => void;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useState<Preferences>({
        darkMode: true,
        reducedMotion: false,
        soundEffects: true,
        studyReminders: false,
        examAlerts: false,
    });

    // Web Audio Context
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const supabase = createClient();

    // Initialize AudioContext on first user interaction (standard browser policy)
    useEffect(() => {
        const initAudio = () => {
            if (typeof window !== 'undefined' && !audioContext) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                    setAudioContext(new AudioContext());
                }
            }
        };

        window.addEventListener('click', initAudio, { once: true });
        return () => window.removeEventListener('click', initAudio);
    }, [audioContext]);

    // Initialize preferences
    useEffect(() => {
        // Load from localStorage
        const stored = localStorage.getItem("notiva_preferences");
        if (stored) {
            try {
                setPreferences(prev => ({ ...prev, ...JSON.parse(stored) }));
            } catch (e) { /* ignore */ }
        }

        // Load from Supabase if logged in
        const fetchRemote = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase.from('profiles').select('preferences').eq('id', user.id).single();
                    if (data?.preferences) {
                        const merged = { ...preferences, ...data.preferences };
                        setPreferences(merged);
                        localStorage.setItem("notiva_preferences", JSON.stringify(merged));
                    }
                }
            } catch (err) {
                console.error("Error fetching preferences:", err);
            }
        };
        fetchRemote();
    }, []);

    // Apply theme and motion classes
    useEffect(() => {
        const root = document.documentElement;

        // Theme
        if (preferences.darkMode) {
            root.classList.add("dark");
            root.classList.remove("light");
        } else {
            root.classList.add("light");
            root.classList.remove("dark");
        }

        // Reduced Motion
        if (preferences.reducedMotion) {
            root.classList.add("reduce-motion");
        } else {
            root.classList.remove("reduce-motion");
        }
    }, [preferences.darkMode, preferences.reducedMotion]);

    // Synthesized Sounds (No assets required)
    const playSynthesizedSound = useCallback((type: SoundType) => {
        if (!audioContext) return;

        // Resume context if suspended (browser requirements)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const now = audioContext.currentTime;

        if (type === 'click') {
            // Short high-pitch "pop"
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'on') {
            // Rising upbeat tone
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'off') {
            // Falling downbeat tone
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'success') {
            // Cheerful major chord arpeggio
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(1108, now + 0.1); // C#
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'error') {
            // Low buzz
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.2);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }

    }, [audioContext]);

    const playSound = useCallback((type: SoundType) => {
        if (!preferences.soundEffects) {
            return;
        }
        playSynthesizedSound(type);
    }, [preferences.soundEffects, playSynthesizedSound]);

    const togglePreference = async (key: keyof Preferences) => {
        const newVal = !preferences[key];
        const newPrefs = { ...preferences, [key]: newVal };

        setPreferences(newPrefs);
        localStorage.setItem("notiva_preferences", JSON.stringify(newPrefs));

        // Play feedback sound
        if (key === 'soundEffects') {
            if (newVal) playSound('on');
            // We can't easily play 'off' because we just turned it off, 
            // but we could bypass the check or just play nothing.
        } else if (key === 'darkMode') {
            playSound(newVal ? 'on' : 'off');
        } else if (key === 'reducedMotion') {
            playSound(newVal ? 'on' : 'off');
        } else {
            playSound('click');
        }

        // Persist to DB
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', user.id);
        }
    };

    return (
        <PreferencesContext.Provider value={{ preferences, togglePreference, playSound }}>
            <MotionConfig reducedMotion={preferences.reducedMotion ? "always" : "never"}>
                <LazyMotion features={domAnimation}>
                    {children}
                </LazyMotion>
            </MotionConfig>
        </PreferencesContext.Provider>
    );
}

export const usePreferences = () => {
    const context = useContext(PreferencesContext);
    if (!context) throw new Error("usePreferences must be used within a PreferencesProvider");
    return context;
};
