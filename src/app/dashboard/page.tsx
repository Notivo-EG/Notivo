"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    Plus,
    ArrowRight,
    MoreVertical,
    MapPin,
    Loader2,
    Pencil,
    Trash2,
    Search,
    Building2,
    X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/context/PreferencesContext";

const UNIVERSITIES = [
    "Cairo University",
    "Ain Shams University",
    "Alexandria University",
    "MIT",
    "Stanford University",
    "Harvard University",
];

const MAJORS = [
    "Computer Science",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Medicine",
    "Pharmacy",
    "Civil Engineering",
    "Architecture",
    "Business Administration",
];

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
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Edit modal state
    const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
    const [editStep, setEditStep] = useState<1 | 2>(1);
    const [editUniversity, setEditUniversity] = useState("");
    const [editMajor, setEditMajor] = useState("");
    const [editUniSearch, setEditUniSearch] = useState("");
    const [editMajorSearch, setEditMajorSearch] = useState("");
    const [editSaving, setEditSaving] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDelete = async (enrollmentId: string) => {
        if (!confirm("Are you sure you want to delete this enrollment? All related courses will also be deleted.")) return;

        try {
            const { error } = await supabase
                .from('enrollments')
                .delete()
                .eq('id', enrollmentId);

            if (error) throw error;

            setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
            setOpenMenuId(null);
        } catch (err) {
            console.error("Error deleting enrollment:", err);
            alert("Failed to delete enrollment");
        }
    };

    const openEditModal = (enrollment: Enrollment) => {
        setEditingEnrollment(enrollment);
        setEditUniversity(enrollment.university_name);
        setEditMajor(enrollment.program_name);
        setEditStep(1);
        setEditUniSearch("");
        setEditMajorSearch("");
        setOpenMenuId(null);
    };

    const closeEditModal = () => {
        setEditingEnrollment(null);
        setEditSaving(false);
    };

    const handleEditSave = async () => {
        if (!editingEnrollment) return;

        if (editStep === 1 && editUniversity) {
            setEditStep(2);
            return;
        }

        if (editStep === 2 && editMajor) {
            try {
                setEditSaving(true);
                const { error } = await supabase
                    .from('enrollments')
                    .update({
                        university_name: editUniversity,
                        program_name: editMajor,
                    })
                    .eq('id', editingEnrollment.id);

                if (error) throw error;

                setEnrollments(prev =>
                    prev.map(e =>
                        e.id === editingEnrollment.id
                            ? { ...e, university_name: editUniversity, program_name: editMajor }
                            : e
                    )
                );
                closeEditModal();
            } catch (err) {
                console.error("Error updating enrollment:", err);
                alert("Failed to update enrollment");
            } finally {
                setEditSaving(false);
            }
        }
    };

    const filteredEditUniversities = UNIVERSITIES.filter(u =>
        u.toLowerCase().includes(editUniSearch.toLowerCase())
    );
    const filteredEditMajors = MAJORS.filter(m =>
        m.toLowerCase().includes(editMajorSearch.toLowerCase())
    );

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
                    .select('*, student_courses(id, status)')
                    .eq('user_id', user.id);

                if (error) throw error;

                // Calculate progress: (done courses / total courses) * 100
                const enrollmentsWithProgress = (data || []).map(e => {
                    const courses = (e.student_courses ?? []) as { id: string; status: string }[];
                    const total = courses.length;
                    const done = courses.filter(c => c.status === 'done').length;
                    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { student_courses: _sc, ...rest } = e;
                    return { ...rest, progress };
                });
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
                    <Link href="/setup?new=true" onClick={() => playSound("click")}>
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
                                    <div className="relative" ref={openMenuId === enrollment.id ? menuRef : undefined}>
                                        <button
                                            onClick={() => {
                                                playSound("click");
                                                setOpenMenuId(openMenuId === enrollment.id ? null : enrollment.id);
                                            }}
                                            className="p-2 rounded-full hover:bg-foreground/5 text-foreground/20 hover:text-foreground transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>

                                        <AnimatePresence>
                                            {openMenuId === enrollment.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute right-0 top-full mt-2 w-44 bg-card-bg/90 dark:bg-black/80 backdrop-blur-xl border border-card-border rounded-xl shadow-2xl overflow-hidden z-50"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            playSound("click");
                                                            openEditModal(enrollment);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            playSound("click");
                                                            handleDelete(enrollment.id);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
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

                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingEnrollment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEditModal} />

                        {/* Modal Card */}
                        <motion.div
                            key={editStep}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.3 }}
                            className="relative w-full max-w-lg bg-card-bg/95 dark:bg-[#0a0a1a]/95 backdrop-blur-xl rounded-[2rem] p-8 border border-card-border shadow-2xl"
                        >
                            {/* Close button */}
                            <button
                                onClick={closeEditModal}
                                className="absolute top-5 right-5 p-2 rounded-full hover:bg-foreground/5 text-foreground/30 hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Step indicator */}
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${editStep >= 1 ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-foreground/10"}`} />
                                <div className="w-10 h-0.5 bg-foreground/10 relative overflow-hidden rounded-full">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: editStep >= 2 ? "100%" : "50%" }}
                                        className="h-full bg-blue-500"
                                    />
                                </div>
                                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${editStep >= 2 ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" : "bg-foreground/10"}`} />
                            </div>

                            {editStep === 1 ? (
                                <>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">Edit University</h2>
                                            <p className="text-foreground/50 text-sm">Where are you studying?</p>
                                        </div>
                                    </div>

                                    {/* Search */}
                                    <div className="relative mb-4 group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            type="text"
                                            value={editUniSearch}
                                            onChange={(e) => setEditUniSearch(e.target.value)}
                                            placeholder="Search universities..."
                                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                                        />
                                    </div>

                                    {/* University List */}
                                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                        {filteredEditUniversities.map((uni) => (
                                            <button
                                                key={uni}
                                                onClick={() => setEditUniversity(uni)}
                                                className={`w-full p-3.5 rounded-xl text-left transition-all border text-sm ${editUniversity === uni
                                                    ? "bg-blue-600/15 border-blue-500/30 text-foreground shadow-sm"
                                                    : "bg-foreground/[0.02] border-transparent text-foreground/70 hover:bg-foreground/5"
                                                    }`}
                                            >
                                                <span className="font-medium">{uni}</span>
                                            </button>
                                        ))}
                                        {filteredEditUniversities.length === 0 && editUniSearch && (
                                            <button
                                                onClick={() => setEditUniversity(editUniSearch)}
                                                className="w-full p-3.5 rounded-xl text-left transition-all border bg-foreground/[0.02] border-dashed border-foreground/15 text-foreground/60 hover:text-foreground hover:border-blue-500/50 hover:bg-blue-500/10 text-sm"
                                            >
                                                <span className="block text-xs text-foreground/40">Not found? Use:</span>
                                                <span className="font-bold text-blue-400">&quot;{editUniSearch}&quot;</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                            <GraduationCap className="w-6 h-6 text-cyan-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">Edit Major</h2>
                                            <p className="text-foreground/50 text-sm">What are you studying at {editUniversity}?</p>
                                        </div>
                                    </div>

                                    {/* Search */}
                                    <div className="relative mb-4 group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-cyan-400 transition-colors" />
                                        <input
                                            type="text"
                                            value={editMajorSearch}
                                            onChange={(e) => setEditMajorSearch(e.target.value)}
                                            placeholder="Search majors..."
                                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
                                        />
                                    </div>

                                    {/* Major List */}
                                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                        {filteredEditMajors.map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => setEditMajor(m)}
                                                className={`w-full p-3.5 rounded-xl text-left transition-all border text-sm ${editMajor === m
                                                    ? "bg-cyan-600/15 border-cyan-500/30 text-foreground shadow-sm"
                                                    : "bg-foreground/[0.02] border-transparent text-foreground/70 hover:bg-foreground/5"
                                                    }`}
                                            >
                                                <span className="font-medium">{m}</span>
                                            </button>
                                        ))}
                                        {filteredEditMajors.length === 0 && editMajorSearch && (
                                            <button
                                                onClick={() => setEditMajor(editMajorSearch)}
                                                className="w-full p-3.5 rounded-xl text-left transition-all border bg-foreground/[0.02] border-dashed border-foreground/15 text-foreground/60 hover:text-foreground hover:border-cyan-500/50 hover:bg-cyan-500/10 text-sm"
                                            >
                                                <span className="block text-xs text-foreground/40">Not found? Use:</span>
                                                <span className="font-bold text-cyan-400">&quot;{editMajorSearch}&quot;</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3 mt-6">
                                {editStep === 2 && (
                                    <button
                                        onClick={() => setEditStep(1)}
                                        className="px-5 py-3 rounded-full text-sm font-medium text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
                                    >
                                        Back
                                    </button>
                                )}
                                <button
                                    onClick={handleEditSave}
                                    disabled={(editStep === 1 ? !editUniversity : !editMajor) || editSaving}
                                    className={`flex-1 py-3 rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-foreground/10 ${(editStep === 1 ? editUniversity : editMajor) && !editSaving
                                        ? editStep === 1
                                            ? "bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-purple-500/20 text-foreground hover:brightness-125 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                            : "bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 text-foreground hover:brightness-125 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                                        : "bg-foreground/5 text-foreground/20 cursor-not-allowed border-transparent"
                                        }`}
                                >
                                    {editSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <span>{editStep === 1 ? "Next" : "Save Changes"}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

