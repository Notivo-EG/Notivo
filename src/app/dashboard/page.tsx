"use client";

import { motion } from "framer-motion";
import {
    GraduationCap,
    Plus,
    ArrowRight,
    Settings,
    MoreVertical,
    MapPin,
    Calendar,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/context/PreferencesContext";

// Define the shape of our enrollment data (matching the SQL table + join)
interface Enrollment {
    id: string;
    university_name: string;
    program_name: string;
    is_minor: boolean;
    ui_theme: string;
    // We can calculate progress later by joining with student_courses
    progress?: number;
}

export default function GlobalDashboard() {
    const supabase = createClient();
    const router = useRouter();
    const { playSound } = usePreferences();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }

                const { data, error } = await supabase
                    .from('enrollments')
                    .select('*')
                    .eq('user_id', user.id);

                if (error) throw error;

                // For now, we mock progress as 0 since we haven't built course tracking yet
                const enrollmentsWithProgress = (data || []).map(e => ({ ...e, progress: 0 }));
                setEnrollments(enrollmentsWithProgress);
            } catch (err) {
                console.error("Error fetching enrollments:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEnrollments();
    }, [supabase, router]);

    return (
        <div className="min-h-screen bg-background px-6 py-8 md:px-12 md:py-12 relative overflow-hidden text-foreground">
            {/* Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen dark:mix-blend-normal" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full mix-blend-screen dark:mix-blend-normal" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">Academic Overview</h1>
                        <p className="text-foreground/60 text-lg">Your tracked degrees and certifications</p>
                    </div>

                    {/* Add New Major Button */}
                    <Link href="/setup" onClick={() => playSound("click")}>
                        <button className="relative group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 dark:from-cyan-500/20 dark:via-blue-500/20 dark:to-purple-500/20 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-full font-medium text-slate-800 dark:text-white transition-all hover:brightness-110 md:hover:brightness-125 dark:hover:brightness-150 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-95 border border-card-border overflow-hidden">
                            <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] pointer-events-none" />
                            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            <Plus className="w-5 h-5 relative z-10" />
                            <span className="relative z-10">Add New Major</span>
                        </button>
                    </Link>
                </header>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-foreground/30" />
                    </div>
                ) : (
                    /* Majors Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {enrollments.map((enrollment, index) => (
                            <motion.div
                                key={enrollment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                // Tinted Glass Card - Theme Aware
                                className={`group relative p-8 rounded-[2.5rem] border border-card-border flex flex-col transition-all hover:-translate-y-1 hover:border-foreground/10 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/50 backdrop-blur-xl bg-card-bg/60 dark:bg-opacity-10
                                    ${enrollment.ui_theme !== 'cyber' ? 'shadow-[0_8px_32px_rgba(30,58,138,0.05)] dark:shadow-[0_8px_32px_rgba(30,58,138,0.1)]' : 'shadow-[0_8px_32px_rgba(100,58,138,0.05)] dark:shadow-[0_8px_32px_rgba(100,58,138,0.1)]'}`}
                            >
                                {/* Inner Glint */}
                                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent opacity-50" />

                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden backdrop-blur-md
                                        ${enrollment.ui_theme !== 'cyber' ? 'bg-blue-500/10 text-blue-500 dark:text-blue-300' : 'bg-purple-500/10 text-purple-500 dark:text-purple-300'}`}>
                                        <div className="absolute inset-0 bg-foreground/5 dark:bg-white/5" />
                                        <GraduationCap className="w-8 h-8 drop-shadow-lg relative z-10" />
                                    </div>
                                    <button onClick={() => playSound("click")} className="p-2 rounded-full hover:bg-foreground/5 text-foreground/20 hover:text-foreground transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Info */}
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/40 mb-2">
                                        <span className={enrollment.ui_theme !== 'cyber' ? 'text-blue-500 dark:text-blue-400' : 'text-purple-500 dark:text-purple-400'}>
                                            {enrollment.is_minor ? "Minor" : "Major"}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2 tracking-tight text-foreground">{enrollment.program_name}</h2>
                                    <div className="flex items-center gap-2 text-foreground/50 text-sm font-medium">
                                        <MapPin className="w-4 h-4" />
                                        {enrollment.university_name}
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="mt-auto">
                                    <div className="flex justify-between text-sm mb-3 font-medium">
                                        <span className="text-foreground/60">Progress</span>
                                        <span className="text-foreground">{enrollment.progress}%</span>
                                    </div>
                                    {/* Track */}
                                    <div className="h-4 w-full bg-foreground/5 dark:bg-black/40 rounded-full overflow-hidden mb-8 shadow-inner border border-foreground/5">
                                        {/* Fill */}
                                        <div
                                            className={`h-full rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] relative
                                                ${enrollment.ui_theme !== 'cyber'
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-400'
                                                    : 'bg-gradient-to-r from-purple-600 to-purple-400'
                                                }`}
                                            style={{ width: `${enrollment.progress}%` }}
                                        >
                                            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/40" />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-4">
                                        <Link href={`/major/${enrollment.id}`} className="flex-1" onClick={() => playSound("click")}>
                                            <button className={`relative w-full py-4 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 group/btn border border-card-border backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-95 overflow-hidden
                                                ${enrollment.ui_theme !== 'cyber'
                                                    ? 'bg-gradient-to-r from-blue-600/10 via-indigo-500/10 to-purple-500/10 text-blue-600 dark:text-white dark:from-blue-600/20 dark:via-indigo-500/20 dark:to-purple-500/20 hover:brightness-110'
                                                    : 'bg-gradient-to-r from-purple-600/10 via-pink-500/10 to-orange-500/10 text-purple-600 dark:text-white dark:from-purple-600/20 dark:via-pink-500/20 dark:to-orange-500/20 hover:brightness-110'
                                                }`}>
                                                <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] pointer-events-none" />
                                                <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                                <span className="relative z-10">View Tree</span>
                                                <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover/btn:translate-x-1" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Quick Access Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            onClick={() => playSound("click")}
                            className="p-8 rounded-[2.5rem] border border-dashed border-foreground/10 hover:border-foreground/30 flex flex-col items-center justify-center text-center gap-6 transition-colors group cursor-pointer bg-card-bg/30 hover:bg-card-bg/60"
                        >
                            <div className="w-20 h-20 rounded-full bg-foreground/5 group-hover:bg-foreground/10 flex items-center justify-center transition-colors shadow-inner backdrop-blur-md">
                                <Calendar className="w-8 h-8 text-foreground/40 group-hover:text-foreground transition-colors" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Global War Room</h3>
                                <p className="text-foreground/40 text-sm max-w-[200px] mx-auto">View all upcoming exams across all majors</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}

