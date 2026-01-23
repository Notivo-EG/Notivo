"use client";

import { CourseTree } from "@/components/CourseTree";
import { ArrowLeft, ZoomIn, ZoomOut, Move } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

export default function CourseTreePage() {
    const [scale, setScale] = useState(1);

    return (
        <div className="h-screen w-screen bg-background overflow-hidden relative">
            {/* Background Grid */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }}
            />

            {/* Header */}
            <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
                <Link href="/major/cs-major">
                    <button className="p-4 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all group">
                        <ArrowLeft size={24} className="text-white group-hover:text-blue-400 transition-colors" />
                    </button>
                </Link>
                <div className="bg-black/20 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10">
                    <h1 className="font-bold text-white text-lg flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Interactive Concept Map
                    </h1>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3">
                <button
                    onClick={() => setScale(s => Math.min(s + 0.1, 2))}
                    className="p-4 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-110 transition-all text-white"
                >
                    <ZoomIn size={24} />
                </button>
                <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 text-center font-bold text-sm text-white/50">
                    {Math.round(scale * 100)}%
                </div>
                <button
                    onClick={() => setScale(s => Math.max(s - 0.1, 0.5))}
                    className="p-4 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-110 transition-all text-white"
                >
                    <ZoomOut size={24} />
                </button>
            </div>

            {/* Transform Layer for Pan/Zoom (Simplified for demo, would use proper library in prod) */}
            <div className="w-full h-full flex items-center justify-center">
                <motion.div
                    animate={{ scale }}
                    transition={{ type: "spring", damping: 20 }}
                    className="w-[1200px] h-[800px] relative"
                >
                    <CourseTree isSimulationOnly={true} />
                </motion.div>
            </div>

            {/* Hint */}
            <div className="absolute bottom-6 left-6 z-50 flex items-center gap-2 text-white/40 text-sm bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                <Move size={16} />
                <span>Use controls to zoom. Enabled Simulation Mode by default.</span>
            </div>
        </div>
    );
}
