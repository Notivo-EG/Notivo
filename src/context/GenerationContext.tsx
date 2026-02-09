"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type GenerationType = 'video' | 'song' | 'flashcard' | 'quiz' | 'infographic';

export interface GenerationTask {
    id: string;
    type: GenerationType;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    message: string;
    courseId: string;
}

interface GenerationContextType {
    tasks: GenerationTask[];
    addTask: (task: GenerationTask) => void;
    updateTask: (id: string, updates: Partial<GenerationTask>) => void;
    removeTask: (id: string) => void;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export function GenerationProvider({ children }: { children: ReactNode }) {
    const [tasks, setTasks] = useState<GenerationTask[]>([]);

    const addTask = (task: GenerationTask) => {
        setTasks(prev => [...prev, task]);
    };

    const updateTask = (id: string, updates: Partial<GenerationTask>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const removeTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    return (
        <GenerationContext.Provider value={{ tasks, addTask, updateTask, removeTask }}>
            {children}
        </GenerationContext.Provider>
    );
}

export function useGeneration() {
    const context = useContext(GenerationContext);
    if (!context) {
        throw new Error("useGeneration must be used within a GenerationProvider");
    }
    return context;
}
