"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Calculator, Plus, Trash2, Save, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface GradeEntry {
    id: number;
    course: string;
    credits: number;
    grade: string;
}

const GRADE_POINTS: Record<string, number> = {
    "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0, "F": 0.0
};

export default function GPACalculator() {
    const [courses, setCourses] = useState<GradeEntry[]>([
        { id: 1, course: "Calculus I", credits: 3, grade: "A" },
        { id: 2, course: "Physics I", credits: 3, grade: "B+" },
        { id: 3, course: "Programming I", credits: 4, grade: "B" },
    ]);

    const addCourse = () => {
        setCourses([...courses, { id: Date.now(), course: "New Course", credits: 3, grade: "A" }]);
    };

    const removeCourse = (id: number) => {
        setCourses(courses.filter(c => c.id !== id));
    };

    const updateCourse = (id: number, field: keyof GradeEntry, value: string | number) => {
        setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    // Calculate GPA
    const totalPoints = courses.reduce((sum, c) => sum + (c.credits * (GRADE_POINTS[c.grade] || 0)), 0);
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";

    return (
        <div className="min-h-screen bg-background px-6 py-12 relative overflow-hidden">
            {/* Background Glow */}
            <div className="fixed left-0 top-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/10 via-purple-500/5 to-transparent blur-[150px] pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                <div className="flex items-center mb-8 gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20">
                        <Calculator size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white">GPA Forecaster</h1>
                        <p className="text-white/60">Experiment with grades to see your future GPA.</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Calculator Interface */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-black/20 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-lg">
                            <div className="grid grid-cols-12 gap-4 mb-4 text-sm font-bold text-white/40 uppercase tracking-wider px-2">
                                <div className="col-span-5">Course</div>
                                <div className="col-span-3">Credits</div>
                                <div className="col-span-3">Grade</div>
                                <div className="col-span-1"></div>
                            </div>

                            <div className="space-y-3">
                                {courses.map((course) => (
                                    <motion.div
                                        key={course.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="grid grid-cols-12 gap-4 items-center bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors border border-white/5 group"
                                    >
                                        <div className="col-span-5">
                                            <input
                                                type="text"
                                                value={course.course}
                                                onChange={(e) => updateCourse(course.id, "course", e.target.value)}
                                                className="w-full bg-transparent outline-none font-medium text-white placeholder:text-white/20"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                value={course.credits}
                                                onChange={(e) => updateCourse(course.id, "credits", Number(e.target.value))}
                                                className="w-full bg-transparent outline-none text-white/80"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <select
                                                value={course.grade}
                                                onChange={(e) => updateCourse(course.id, "grade", e.target.value)}
                                                className="w-full bg-transparent outline-none text-blue-400 font-bold cursor-pointer [&>option]:bg-[#0a0a0a]"
                                            >
                                                {Object.keys(GRADE_POINTS).map(g => (
                                                    <option key={g} value={g} className="text-white">{g}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <button onClick={() => removeCourse(course.id)} className="text-red-400/50 hover:text-red-400 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <button
                                onClick={addCourse}
                                className="w-full mt-6 py-4 rounded-2xl border border-dashed border-white/20 hover:border-blue-500/50 hover:bg-blue-500/5 flex items-center justify-center gap-2 transition-all text-white/60 hover:text-blue-400 group"
                            >
                                <Plus size={18} className="group-hover:scale-110 transition-transform" /> Add Course
                            </button>
                        </div>
                    </div>

                    {/* Results Sidebar */}
                    <div className="space-y-6">
                        <motion.div
                            layout
                            className="bg-black/20 backdrop-blur-xl rounded-[2.5rem] p-8 text-center border border-white/10 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-50" />
                            <div className="relative z-10">
                                <p className="text-sm font-bold uppercase tracking-widest text-white/50 mb-2">Projected GPA</p>
                                <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                                    {gpa}
                                </div>
                                <p className="text-sm text-white/60">{totalCredits} Total Credits</p>
                            </div>
                        </motion.div>

                        <div className="bg-black/20 backdrop-blur-xl rounded-[2.5rem] p-6 space-y-3 border border-white/10">
                            <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center gap-2 text-sm font-medium transition-all text-white hover:text-blue-300">
                                <Save size={16} /> Save Scenario
                            </button>
                            <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center gap-2 text-sm font-medium transition-all text-white hover:text-white/80">
                                <RefreshCw size={16} /> Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
