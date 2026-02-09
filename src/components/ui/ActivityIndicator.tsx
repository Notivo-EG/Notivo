"use client";

import { useGeneration } from "@/context/GenerationContext";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function ActivityIndicator() {
    const { tasks, removeTask } = useGeneration();
    const [show, setShow] = useState(false);

    const activeTasks = tasks.filter(t => t.status === 'processing' || t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'failed');

    useEffect(() => {
        if (activeTasks.length > 0 || completedTasks.length > 0) {
            setShow(true);
        } else {
            const timer = setTimeout(() => setShow(false), 3000); // Hide after 3s if no tasks
            return () => clearTimeout(timer);
        }
    }, [activeTasks.length, completedTasks.length]);

    // Auto-remove completed tasks after 5 seconds
    useEffect(() => {
        completedTasks.forEach(task => {
            const timer = setTimeout(() => {
                removeTask(task.id);
            }, 5000);
            return () => clearTimeout(timer);
        });
    }, [completedTasks, removeTask]);

    if (!show && tasks.length === 0) return null;

    return (
        <div className="fixed bottom-24 right-6 z-[60] flex flex-col gap-2">
            <AnimatePresence>
                {tasks.map(task => (
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        className="p-4 rounded-xl shadow-2xl backdrop-blur-md border flex items-center gap-3 min-w-[300px] max-w-sm"
                        style={{
                            background: task.status === 'failed' ? 'rgba(239, 68, 68, 0.1)' :
                                task.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' :
                                    'rgba(15, 23, 42, 0.8)',
                            borderColor: task.status === 'failed' ? 'rgba(239, 68, 68, 0.2)' :
                                task.status === 'completed' ? 'rgba(34, 197, 94, 0.2)' :
                                    'rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        {task.status === 'processing' || task.status === 'pending' ? (
                            <div className="relative">
                                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-blue-400">
                                    {Math.round(task.progress)}
                                </span>
                            </div>
                        ) : task.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                        )}

                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground">{task.type === 'video' ? 'Video Generation' : task.type === 'song' ? 'Song Generation' : 'Generation'}</p>
                            <p className="text-xs text-foreground/60 truncate">{task.message}</p>
                        </div>

                        {(task.status === 'completed' || task.status === 'failed') && (
                            <button
                                onClick={() => removeTask(task.id)}
                                className="p-1 hover:bg-white/10 rounded-full"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="w-4 h-4 text-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
