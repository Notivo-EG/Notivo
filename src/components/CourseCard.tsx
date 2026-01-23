"use client";

import { motion } from "framer-motion";
import { BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";

type HealthState = "healthy" | "decaying" | "critical";

interface CourseCardProps {
    title: string;
    code: string;
    daysLastOpened: number;
    progress?: number;
    onClick?: () => void;
}

export function CourseCard({ title, code, daysLastOpened, progress = 0, onClick }: CourseCardProps) {
    // Determine Health State
    let health: HealthState = "healthy";
    if (daysLastOpened > 7) health = "critical";
    else if (daysLastOpened > 3) health = "decaying";

    // Visual Config based on Health
    const config = {
        healthy: {
            borderColor: "border-bio/50",
            glow: "shadow-[0_0_20px_rgba(46,204,113,0.3)]",
            icon: <CheckCircle2 className="text-bio" size={18} />,
            statusText: "Healthy",
            textColor: "text-bio",
        },
        decaying: {
            borderColor: "border-ember/50",
            glow: "shadow-[0_0_15px_rgba(247,163,37,0.2)]",
            icon: <AlertCircle className="text-ember" size={18} />,
            statusText: "Decaying",
            textColor: "text-ember",
        },
        critical: {
            borderColor: "border-red-500/60",
            glow: "shadow-[0_0_30px_rgba(239,68,68,0.4)]",
            icon: <AlertCircle className="text-red-500" size={18} />,
            statusText: "Critical",
            textColor: "text-red-500",
        },
    };

    const currentConfig = config[health];

    // Animation for "Critical" state (Wiggling)
    const wiggleAnimation = health === "critical" ? {
        rotate: [0, -1, 1, -1, 0],
        transition: { repeat: Infinity, duration: 0.4, ease: "easeInOut" as const }
    } : undefined;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            animate={wiggleAnimation}
            onClick={onClick}
            className={`relative p-5 rounded-2xl bg-black/40 backdrop-blur-md border-2 transition-all duration-500 cursor-pointer group ${currentConfig.borderColor} ${currentConfig.glow} hover:border-bio hover:shadow-[0_0_30px_rgba(46,204,113,0.4)]`}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-white/5 group-hover:bg-bio/20 transition-colors`}>
                    <BookOpen className="w-6 h-6 text-foreground group-hover:text-bio transition-colors" />
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/5 group-hover:border-bio/30 transition-colors`}>
                    {currentConfig.icon}
                    <span className={`text-xs font-bold uppercase tracking-wider ${currentConfig.textColor} group-hover:text-bio transition-colors`}>
                        {daysLastOpened === 0 ? "Active" : `${daysLastOpened}d Idle`}
                    </span>
                </div>
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold mb-1 group-hover:text-bio transition-colors">{title}</h3>
            <p className="text-foreground/40 text-sm font-medium mb-4">{code}</p>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${health === "healthy" ? "bg-bio" :
                        health === "decaying" ? "bg-ember" : "bg-red-500"
                        } group-hover:bg-bio`}
                />
            </div>

            {/* Recovery Hint */}
            {health !== "healthy" && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-[2px] rounded-2xl">
                    <span className="font-bold text-bio flex items-center gap-2">
                        <CheckCircle2 size={20} />
                        Recover Stats
                    </span>
                </div>
            )}
        </motion.div>
    );
}
