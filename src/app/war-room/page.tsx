"use client";

import { motion } from "framer-motion";
import {
    Calendar,
    Upload,
    Scan,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Brain,
    Timer,
    FileText
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Mock AI Parsed Data
const MOCK_PARSED_SCHEDULE = [
    { course: "Calculus II", date: "2026-01-25", time: "09:00 AM", type: "Midterm", confidence: 0.98 },
    { course: "Physics II", date: "2026-02-05", time: "02:00 PM", type: "Midterm", confidence: 0.95 },
    { course: "Statics", date: "2026-02-02", time: "10:00 AM", type: "Final", confidence: 0.85 },
];

export default function WarRoomPage() {
    const [step, setStep] = useState<"upload" | "verify" | "plan">("upload");
    const [isScanning, setIsScanning] = useState(false);

    const handleUpload = () => {
        setIsScanning(true);
        // Simulate AI scanning delay
        setTimeout(() => {
            setIsScanning(false);
            setStep("verify");
        }, 2500);
    };

    return (
        <div className="min-h-screen bg-background px-6 py-12 relative overflow-hidden">
            {/* War Room Red Glow */}
            <div className="fixed left-0 top-0 w-full h-full bg-gradient-to-br from-caution/5 via-transparent to-transparent pointer-events-none" />
            <div className="fixed right-0 top-0 w-[500px] h-[500px] rounded-full bg-caution/10 blur-[150px] pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 rounded-2xl bg-caution/20 text-caution">
                        <Timer size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold">Exam War Room</h1>
                        <p className="text-foreground/60">Tactical planning center for upcoming assessments.</p>
                    </div>
                </div>

                {/* Step 1: Upload / OCR */}
                {step === "upload" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        // Ethereal Glass Card
                        className="bg-black/20 backdrop-blur-xl rounded-[2.5rem] p-12 text-center border-2 border-dashed border-white/10 hover:border-caution/50 transition-colors shadow-2xl relative"
                    >
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

                        {isScanning ? (
                            <div className="flex flex-col items-center py-10">
                                <motion.div
                                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="mb-6 relative"
                                >
                                    <Scan size={64} className="text-caution" />
                                    <motion.div
                                        className="absolute inset-0 bg-caution/20 blur-xl rounded-full"
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    />
                                </motion.div>
                                <h2 className="text-2xl font-bold mb-2 text-white">Analyzing Schedule...</h2>
                                <p className="text-white/50">Extracting dates, times, and subjects.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-10">
                                <div className="p-6 rounded-full bg-white/5 mb-6 backdrop-blur-md border border-white/5">
                                    <Upload size={48} className="text-white/40" />
                                </div>
                                <h2 className="text-3xl font-bold mb-4 text-white">Upload Exam Schedule</h2>
                                <p className="text-white/60 max-w-md mx-auto mb-8">
                                    Drop your exam PDF or screenshot here. Our AI will extract dates, match them to your courses, and build a battle plan.
                                </p>
                                {/* Ethereal Button (Caution Theme) */}
                                <button
                                    onClick={handleUpload}
                                    className="relative group px-8 py-4 rounded-full bg-gradient-to-r from-orange-500/20 via-red-500/20 to-amber-500/20 backdrop-blur-md text-white font-bold text-lg transition-all hover:brightness-125 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] active:scale-95 border border-white/10 overflow-hidden flex items-center gap-2"
                                >
                                    <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] pointer-events-none" />
                                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    <FileText size={20} className="relative z-10" />
                                    <span className="relative z-10">Select File</span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Step 2: Verification */}
                {step === "verify" && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                                <Scan className="text-caution" />
                                Detected Exams
                            </h2>
                            <span className="text-sm text-white/50">Please verify the extracted details.</span>
                        </div>

                        <div className="grid gap-4">
                            {MOCK_PARSED_SCHEDULE.map((exam, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-black/20 backdrop-blur-xl p-6 rounded-[2rem] flex items-center justify-between group border border-white/10 hover:border-caution/30 transition-colors shadow-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center font-bold text-xl text-white/80 border border-white/5">
                                            {new Date(exam.date).getDate()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl text-white">{exam.course}</h3>
                                            <p className="text-white/50 text-sm flex items-center gap-2">
                                                {exam.type} • {exam.time}
                                                {exam.confidence < 0.9 && (
                                                    <span className="text-caution text-xs px-2 py-0.5 rounded-full bg-caution/10 border border-caution/20 flex items-center gap-1">
                                                        <AlertTriangle size={10} /> Check
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right mr-4">
                                            <p className="text-xs font-bold uppercase tracking-wider text-white/40">Confidence</p>
                                            <p className={`font-bold ${exam.confidence > 0.9 ? "text-bio" : "text-caution"}`}>
                                                {Math.round(exam.confidence * 100)}%
                                            </p>
                                        </div>
                                        <button className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                                            Edit
                                        </button>
                                        <button className="p-2 rounded-xl bg-bio/20 text-bio hover:bg-bio/30 border border-bio/20 transition-colors">
                                            <CheckCircle2 size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-4 mt-8">
                            <button
                                onClick={() => setStep("upload")}
                                className="px-6 py-3 rounded-full hover:bg-white/5 text-white/60 hover:text-white transition-colors border border-transparent hover:border-white/10"
                            >
                                Re-scan
                            </button>
                            <button
                                onClick={() => setStep("plan")}
                                className="relative group px-8 py-3 rounded-full bg-gradient-to-r from-orange-500/20 via-red-500/20 to-amber-500/20 backdrop-blur-md text-white font-bold flex items-center gap-2 transition-all hover:brightness-125 border border-white/10 overflow-hidden"
                            >
                                <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] pointer-events-none" />
                                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <span className="relative z-10">Generate Battle Plan</span>
                                <ArrowRight size={20} className="relative z-10" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Tactical Plan */}
                {step === "plan" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black/20 backdrop-blur-xl rounded-[2.5rem] p-10 relative overflow-hidden border border-white/10 shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Brain size={120} className="text-white" />
                        </div>

                        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-white">
                            <Brain className="text-caution" />
                            Tactical Strategy Generated
                        </h2>

                        <p className="text-lg text-white/80 mb-8 max-w-2xl leading-relaxed">
                            Based on your current mastery of <strong>Calculus II</strong> (45%) and the upcoming midterm in <strong>6 days</strong>, we've restructured your week.
                        </p>

                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <PlanCard
                                title="Flashcard Blitz"
                                desc="Focus on formulas. Your retention rate is low."
                                type="urgent"
                            />
                            <PlanCard
                                title="Practice Exam A"
                                desc="Scheduled for Wednesday. Simulates actual timing."
                                type="standard"
                            />
                            <PlanCard
                                title="Drop Thermodynamics"
                                desc="Temporarily de-prioritized to free up 4 hours."
                                type="triage"
                            />
                        </div>

                        <Link href="/dashboard">
                            <button className="relative group w-full py-4 rounded-full bg-gradient-to-r from-orange-500/20 via-red-500/20 to-amber-500/20 backdrop-blur-md text-white font-bold text-lg transition-all hover:brightness-125 border border-white/10 overflow-hidden">
                                <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] pointer-events-none" />
                                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <span className="relative z-10">Apply to Calendar</span>
                            </button>
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function PlanCard({ title, desc, type }: { title: string, desc: string, type: "urgent" | "standard" | "triage" }) {
    const styles = {
        urgent: "border-red-500/50 bg-red-500/10",
        standard: "border-caution/50 bg-caution/10",
        triage: "border-blue-500/50 bg-blue-500/10"
    };

    return (
        <div className={`p-5 rounded-2xl border ${styles[type]}`}>
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-sm opacity-80">{desc}</p>
        </div>
    );
}
