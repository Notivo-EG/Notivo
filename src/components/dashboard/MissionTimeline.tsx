"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";

interface TimelineEvent {
    id: string;
    title: string;
    time: string;
    type: "class" | "study" | "exam";
    location?: string;
    status: "past" | "current" | "future";
    courseColor: string; // e.g. "blue", "cyan", "purple"
}

const MOCK_SCHEDULE: TimelineEvent[] = [
    {
        id: "1",
        title: "Calculus II Lecture",
        time: "09:00 AM",
        type: "class",
        location: "Hall 3B",
        status: "past",
        courseColor: "blue",
    },
    {
        id: "2",
        title: "Deep Work: Linear Algebra",
        time: "11:30 AM",
        type: "study",
        location: "Library Quiet Zone",
        status: "current",
        courseColor: "cyan",
    },
    {
        id: "3",
        title: "Physics Lab",
        time: "02:00 PM",
        type: "class",
        location: "Lab Complex A",
        status: "future",
        courseColor: "purple",
    },
    {
        id: "4",
        title: "CS Assignment Due",
        time: "11:59 PM",
        type: "exam",
        status: "future",
        courseColor: "red",
    },
];

export function MissionTimeline() {
    return (
        <div className="w-full h-full flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <Clock className="w-5 h-5 text-cyan-400" />
                Mission Timeline
            </h2>

            <div className="relative flex-1 pl-4">
                {/* Continuous Vertical Line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-900/50 via-cyan-500/50 to-blue-900/50" />

                <div className="space-y-8">
                    {MOCK_SCHEDULE.map((event, index) => (
                        <TimelineItem key={event.id} event={event} index={index} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function TimelineItem({ event, index }: { event: TimelineEvent; index: number }) {
    const isCurrent = event.status === "current";
    const isPast = event.status === "past";

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative flex gap-6 ${isPast ? "opacity-50 blur-[1px] hover:blur-0 transition-all" : "opacity-100"}`}
        >
            {/* Node on the line */}
            <div className="relative z-10 flex-shrink-0 mt-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
          ${isCurrent
                        ? "bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse"
                        : isPast
                            ? "bg-slate-800 border-slate-700"
                            : "bg-[#050510] border-white/20"
                    }`}
                >
                    {event.type === "class" && <BookOpen className="w-4 h-4 text-white" />}
                    {event.type === "study" && <Clock className="w-4 h-4 text-white" />}
                    {event.type === "exam" && <AlertCircle className="w-4 h-4 text-white" />}
                </div>
            </div>

            {/* Content Card */}
            <div className={`flex-1 p-4 rounded-xl border border-white/5 
        ${isCurrent ? "glass bg-white/5 border-cyan-500/30" : "bg-transparent"}
      `}>
                <div className="flex justify-between items-start mb-1">
                    <span className={`font-mono text-sm ${isCurrent ? "text-cyan-400 font-bold" : "text-white/50"}`}>
                        {event.time}
                    </span>
                    {event.status === "current" && (
                        <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Active
                        </span>
                    )}
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{event.title}</h3>

                {event.location && (
                    <div className="flex items-center gap-1 text-sm text-white/40">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
