"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, GraduationCap, ArrowRight, Trash2, Calendar, Upload, CheckCircle, Brain, Loader2, Sparkles, X, LayoutDashboard, Calculator, ArrowLeft, Network, AlertCircle, Edit } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FileUpload } from "@/components/FileUpload";
import { parseCurriculumTree } from "@/app/actions";
import { usePreferences } from "@/context/PreferencesContext";

// Types
interface Course {
    id: string;
    code: string;
    name: string;
    status: "not_started" | "in_progress" | "completed";
    credits?: number;
    progress?: number;
    grade?: string;
    semester?: number;
    source_config?: {
        prerequisites?: string[];
        semester?: number;
    };
}

interface ParsedCourse {
    code: string;
    name: string;
    credits: number;
    status: "not_started" | "in_progress" | "completed";
    prerequisites: string[];
    suggested_semester?: number;
}

export default function MajorPage() {
    const params = useParams();
    const enrollmentId = params.id as string;
    const supabase = createClient();
    const { playSound } = usePreferences();

    const [enrollment, setEnrollment] = useState<any>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // Import State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [parsedPlan, setParsedPlan] = useState<ParsedCourse[] | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Manual Add State
    const [newCourseCode, setNewCourseCode] = useState("");
    const [newCourseName, setNewCourseName] = useState("");
    const [newCourseCredits, setNewCourseCredits] = useState(3);
    const [newCourseSemester, setNewCourseSemester] = useState<number | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isArchitectOpen, setIsArchitectOpen] = useState(true);

    // Edit State
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [collapsedSemesters, setCollapsedSemesters] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (enrollmentId) fetchData();
    }, [enrollmentId]);

    const fetchData = async () => {
        try {
            const { data: enrollData } = await supabase
                .from('enrollments')
                .select('*')
                .eq('id', enrollmentId)
                .single();
            setEnrollment(enrollData);

            const { data: courseData } = await supabase
                .from('student_courses')
                .select('*')
                .eq('enrollment_id', enrollmentId)
                .order('created_at', { ascending: true });

            if (courseData) {
                setCourses(courseData.map((c: any) => ({
                    ...c,
                    status: c.source_config?.ui_status || (c.status === 'done' ? 'completed' : c.status === 'enrolled' ? 'in_progress' : 'not_started')
                })));
                // Collapse Architect if user has content
                if (courseData.length > 0) setIsArchitectOpen(false);

                // Collapse all semesters by default
                const allSemesters = new Set(courseData.map((c: any) => c.source_config?.semester || c.semester || 0).filter((s: any) => typeof s === 'number'));
                setCollapsedSemesters(allSemesters);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        setIsAnalyzing(true);
        setParsedPlan(null);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const result = await parseCurriculumTree(formData);

            if (result.success) {
                console.log("AI Curriculum:", result.data);
                setParsedPlan(result.data.courses || []);
                setShowImportModal(true);
            } else {
                alert("AI Failed: " + result.error);
            }
        } catch (err) {
            console.error(err);
            alert("Upload failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const confirmImport = async () => {
        if (!parsedPlan) return;
        setIsImporting(true);
        try {
            // Validate & Transform
            const validCourses = parsedPlan.filter(c => c.code && c.name);

            if (validCourses.length === 0) {
                throw new Error("No valid courses found to import (missing code/name).");
            }

            const coursesToInsert = validCourses.map(c => {
                // Map AI status to DB Enum
                let dbStatus = 'locked'; // Default to 'locked' (future course)
                const aiStatus = (c.status || '').toLowerCase();

                if (aiStatus === 'completed' || aiStatus === 'done') dbStatus = 'done';
                if (aiStatus === 'in_progress' || aiStatus === 'enrolled') dbStatus = 'enrolled';

                return {
                    enrollment_id: enrollmentId,
                    code: c.code.trim().toUpperCase(),
                    name: c.name.trim(),
                    credits: typeof c.credits === 'number' ? c.credits : 3,
                    status: dbStatus,
                    source_config: {
                        prerequisites: c.prerequisites,
                        semester: c.suggested_semester,
                        ui_status: aiStatus === 'done' ? 'completed' : aiStatus // Store original intent
                    }
                };
            });

            console.log("Attempting to insert:", coursesToInsert.length, "courses");

            const { error } = await supabase
                .from('student_courses')
                .insert(coursesToInsert);

            if (error) {
                console.error("Supabase Insert Error:", error);
                throw error;
            }

            await fetchData();
            setShowImportModal(false);
            setParsedPlan(null);
            alert(`Successfully imported ${coursesToInsert.length} courses!`);
        } catch (err: any) {
            console.error("Full Import Error:", err);
            alert(`Failed to import: ${err.message || "Unknown error"}`);
        } finally {
            setIsImporting(false);
        }
    };

    const handleAddCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            const { error } = await supabase
                .from('student_courses')
                .insert([
                    {
                        enrollment_id: enrollmentId,
                        code: newCourseCode.trim().toUpperCase(),
                        name: newCourseName.trim(),
                        status: 'enrolled',
                        credits: newCourseCredits,
                        source_config: {
                            prerequisites: [],
                            semester: newCourseSemester,
                            ui_status: 'not_started'
                        }
                    }
                ]);

            if (error) throw error;
            setNewCourseSemester(null);
            setShowAddModal(false);
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setIsAdding(false);
        }
    };

    const handleEditClick = (course: Course) => {
        setEditingCourse(course);
    };

    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCourse) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('student_courses')
                .update({
                    code: editingCourse.code,
                    name: editingCourse.name,
                    credits: editingCourse.credits,
                    status: editingCourse.status === 'completed' ? 'done' : 'enrolled',
                    grade: editingCourse.grade || null,
                    source_config: {
                        ...editingCourse.source_config,
                        semester: editingCourse.source_config?.semester,
                        prerequisites: editingCourse.source_config?.prerequisites,
                        ui_status: editingCourse.status // Persist the detailed UI status
                    }
                })
                .eq('id', editingCourse.id);

            if (error) throw error;
            setEditingCourse(null);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Failed to update course");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (!confirm("Are you sure you want to delete this course?")) return;
        try {
            const { error } = await supabase
                .from('student_courses')
                .delete()
                .eq('id', courseId);
            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete course");
        }
    };

    const handleClearAll = async () => {
        if (!confirm("DANGER: This will delete ALL courses in this roadmap. Are you sure?")) return;
        try {
            const { error } = await supabase
                .from('student_courses')
                .delete()
                .eq('enrollment_id', enrollmentId);
            if (error) throw error;
            fetchData();
            setIsArchitectOpen(true); // Re-open architect for new import
        } catch (err) {
            console.error("Clear failed:", err);
            alert("Failed to clear roadmap");
        }
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading...</div>;

    const themeColor = enrollment?.ui_theme === 'purple' ? 'purple' : 'blue';

    return (
        <div className="min-h-screen bg-background relative text-foreground px-6 py-12 overflow-hidden">
            <div className={`fixed left-1/2 top-1/4 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-${themeColor}-600/10 via-${themeColor}-500/5 to-transparent blur-[150px] pointer-events-none`} />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <Link href="/dashboard" onClick={() => playSound('click')} className="text-foreground/40 hover:text-foreground transition-colors text-sm mb-4 inline-block flex items-center gap-2">
                            <ArrowLeft size={16} /> Back to Dashboard
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                            {enrollment?.major_name || "Major Dashboard"}
                        </h1>
                        <p className="text-foreground/40 text-lg">{enrollment?.university_name}</p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href={`/major/${enrollmentId}/playground`}
                            onClick={() => playSound('click')}
                            className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            <Network size={18} />
                            <span>Playground</span>
                        </Link>
                        <button
                            onClick={() => { setShowAddModal(true); playSound('click'); }}
                            className="px-6 py-3 rounded-full bg-card-bg hover:bg-foreground/10 border border-card-border transition-all flex items-center gap-2 font-medium text-foreground"
                        >
                            <Plus size={18} />
                            <span>Manual Entry</span>
                        </button>
                    </div>
                </div>

                {/* AI Architect Section */}
                <div className="mb-12">
                    {!isArchitectOpen ? (
                        <button
                            onClick={() => { setIsArchitectOpen(true); playSound('click'); }}
                            className="w-full py-6 rounded-[2rem] border border-dashed border-card-border bg-card-bg hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-all flex items-center justify-center gap-3 group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Brain size={20} className="text-blue-300" />
                            </div>
                            <span className="font-bold text-lg">Open The Architect Importer</span>
                        </button>
                    ) : (
                        <div className="relative">
                            <div className="absolute -top-3 right-8 z-20">
                                <button
                                    onClick={() => { setIsArchitectOpen(false); playSound('click'); }}
                                    className="p-2 rounded-full bg-card-bg border border-card-border text-foreground/40 hover:text-foreground transition-colors hover:bg-foreground/10"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-1 rounded-[2.5rem] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="bg-[#050510]/90 backdrop-blur-xl rounded-[2.3rem] p-8 md:p-10 text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

                                    <div className="relative z-10 max-w-2xl mx-auto">
                                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                            <Brain className="text-white w-8 h-8" />
                                        </div>
                                        <h2 className="text-3xl font-bold mb-3 text-white">The Architect</h2>
                                        <p className="text-white/60 mb-8 text-lg">
                                            Upload your **Curriculum Plan, Transcript, or Flowchart**.
                                            Gemini will analyze the structure and build your course roadmap automatically.
                                        </p>

                                        <div className="max-w-md mx-auto">
                                            <FileUpload
                                                onFileSelect={handleFileUpload}
                                                isProcessing={isAnalyzing}
                                                label="Drop Plan or Transcript PDF"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Courses Grid */}
                <div>
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-2xl font-bold">Your Roadmap</h2>
                        <div className="h-[1px] flex-1 bg-white/10"></div>
                        {courses.length > 0 && (
                            <button
                                onClick={() => { handleClearAll(); playSound('click'); }}
                                className="text-red-400 hover:text-red-300 text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 size={14} /> Clear All
                            </button>
                        )}
                    </div>

                    {courses.length === 0 ? (
                        <div className="text-center py-20 bg-card-bg rounded-[2rem] border border-card-border border-dashed">
                            <p className="text-foreground/30 text-lg">No courses yet. Use the Architect above to get started!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Group by semester */}
                            {Array.from(new Set(courses.map(c => c.source_config?.semester || c.semester || 0))).sort((a, b) => a - b).map(semester => {
                                const semesterCourses = courses.filter(c => (c.source_config?.semester || c.semester || 0) === semester);
                                const isCollapsed = collapsedSemesters.has(semester);
                                const toggleCollapse = () => {
                                    setCollapsedSemesters(prev => {
                                        const next = new Set(prev);
                                        if (next.has(semester)) {
                                            next.delete(semester);
                                        } else {
                                            next.add(semester);
                                        }
                                        return next;
                                    });
                                };
                                const completedCount = semesterCourses.filter(c => c.status === 'completed').length;

                                return (
                                    <div key={semester} className="rounded-2xl bg-card-bg/30 border border-card-border overflow-hidden">
                                        {/* Collapsible Header */}
                                        <button
                                            onClick={() => { toggleCollapse(); playSound('click'); }}
                                            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-foreground/5 transition-colors"
                                        >
                                            <motion.div
                                                animate={{ rotate: isCollapsed ? -90 : 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <ArrowRight className="w-4 h-4 text-foreground/40" />
                                            </motion.div>
                                            <h3 className="text-lg font-bold text-foreground/80">
                                                {semester === 0 ? "Unassigned" : `Semester ${semester}`}
                                            </h3>
                                            <div className="h-px flex-1 bg-foreground/10" />
                                            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
                                                {completedCount}/{semesterCourses.length} done
                                            </span>
                                            <span className="text-xs text-foreground/40 bg-foreground/5 px-2 py-1 rounded">
                                                {semesterCourses.length} courses
                                            </span>
                                        </button>

                                        {/* Collapsible Content */}
                                        <AnimatePresence>
                                            {!isCollapsed && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 pt-4">
                                                        {semesterCourses.map((course) => (
                                                            <Link
                                                                href={`/course/${course.id}`}
                                                                key={course.id}
                                                                className={`group relative p-6 rounded-[2rem] border transition-all ${course.status === 'completed'
                                                                    ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
                                                                    : 'bg-card-bg hover:bg-foreground/5 border-card-border hover:border-foreground/20'
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <span className="px-3 py-1 rounded-full bg-foreground/5 text-xs font-mono text-foreground/60 group-hover:bg-foreground/10 transition-colors">
                                                                        {course.code}
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        {course.grade && (
                                                                            <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold">
                                                                                {course.grade}
                                                                            </span>
                                                                        )}
                                                                        <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">
                                                                            <ArrowRight className="w-4 h-4 text-foreground/40 group-hover:-rotate-45 transition-transform duration-300" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-500 transition-colors line-clamp-2 text-foreground">
                                                                    {course.name}
                                                                </h3>
                                                                <div className="flex items-center gap-2 mt-4 text-xs font-medium text-foreground/40">
                                                                    <span className={`w-2 h-2 rounded-full ${course.status === 'completed' ? 'bg-green-500' :
                                                                        course.status === 'in_progress' ? 'bg-blue-500' : 'bg-foreground/20'
                                                                        }`} />
                                                                    {course.status === 'completed' ? 'COMPLETED' : course.status.replace('_', ' ').toUpperCase()}
                                                                    {course.credits && <span className="ml-auto">{course.credits} Credits</span>}
                                                                </div>

                                                                <div className="absolute -top-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-50">
                                                                    <button
                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(course); }}
                                                                        className="p-2 rounded-full bg-black/60 hover:bg-blue-500 hover:text-white text-white/60 transition-colors backdrop-blur-sm"
                                                                    >
                                                                        <Edit size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteCourse(course.id); }}
                                                                        className="p-2 rounded-full bg-black/60 hover:bg-red-500 hover:text-white text-white/60 transition-colors backdrop-blur-sm"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Import Verification Modal */}
                <AnimatePresence>
                    {showImportModal && parsedPlan && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                                onClick={() => setShowImportModal(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative w-full max-w-2xl bg-card-bg rounded-[2rem] border border-card-border shadow-2xl overflow-hidden max-h-[80vh] flex flex-col z-50 py-6"
                            >
                                <div className="px-8 pb-4 border-b border-card-border">
                                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-foreground">
                                        <Sparkles className="text-blue-400" />
                                        Blueprint Discovered
                                    </h2>
                                    <p className="text-foreground/60">
                                        The Architect found <b>{parsedPlan.length} courses</b> in your document.
                                        Please review before importing.
                                    </p>
                                </div>

                                <div className="overflow-y-auto flex-1 p-8 space-y-3">
                                    {parsedPlan.map((c, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-foreground/5 border border-foreground/5">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-mono text-blue-500 font-bold">{c.code}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded bg-foreground/10 text-foreground/50">{c.credits} Credits</span>
                                                </div>
                                                <p className="font-medium text-foreground/90">{c.name}</p>
                                            </div>
                                            {c.status === 'completed' && <CheckCircle className="text-green-500 w-5 h-5" />}
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 border-t border-card-border bg-foreground/5 flex justify-end gap-4">
                                    <button
                                        onClick={() => setShowImportModal(false)}
                                        className="px-6 py-3 rounded-full hover:bg-white/10 text-white/60 transition-colors font-medium"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        onClick={confirmImport}
                                        disabled={isImporting}
                                        className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center gap-2"
                                    >
                                        {isImporting ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
                                        Import {parsedPlan.length} Courses
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Manual Add Modal */}
                <AnimatePresence>
                    {showAddModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setShowAddModal(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative w-full max-w-md bg-[#1a1a24] rounded-3xl p-8 border border-white/10 shadow-2xl z-50"
                            >
                                <h3 className="text-2xl font-bold mb-6 text-white">Add Course Manually</h3>
                                <form onSubmit={handleAddCourse} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/60 mb-2">Course Code</label>
                                        <input
                                            value={newCourseCode}
                                            onChange={(e) => setNewCourseCode(e.target.value)}
                                            placeholder="e.g. CS101"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/60 mb-2">Course Name</label>
                                        <input
                                            value={newCourseName}
                                            onChange={(e) => setNewCourseName(e.target.value)}
                                            placeholder="e.g. Intro to Computer Science"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-white/60 mb-2">Credits</label>
                                            <input
                                                type="number"
                                                value={newCourseCredits}
                                                onChange={(e) => setNewCourseCredits(parseInt(e.target.value))}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                min={1}
                                                max={10}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-white/60 mb-2">Semester (Opt)</label>
                                            <input
                                                type="number"
                                                value={newCourseSemester || ''}
                                                onChange={(e) => setNewCourseSemester(e.target.value ? parseInt(e.target.value) : null)}
                                                placeholder="1-8"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                min={1}
                                                max={8}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-8">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isAdding}
                                            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex justify-center"
                                        >
                                            {isAdding ? <Loader2 className="animate-spin" /> : "Add Course"}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                {/* Edit Modal */}
                <AnimatePresence>
                    {editingCourse && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setEditingCourse(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-card-bg rounded-3xl p-8 border border-card-border shadow-2xl z-50 custom-scrollbar"
                            >
                                <h3 className="text-2xl font-bold mb-6 text-foreground">Edit Course</h3>
                                <form onSubmit={handleUpdateCourse} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground/60 mb-2">Course Code</label>
                                        <input
                                            value={editingCourse.code}
                                            onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })}
                                            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground/60 mb-2">Course Name</label>
                                        <input
                                            value={editingCourse.name}
                                            onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                                            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-foreground/60 mb-2">Credits</label>
                                            <input
                                                type="number"
                                                value={editingCourse.credits || 0}
                                                onChange={(e) => setEditingCourse({ ...editingCourse, credits: parseInt(e.target.value) })}
                                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                                                min={1}
                                                max={10}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-foreground/60 mb-2">Semester</label>
                                            <input
                                                type="number"
                                                value={editingCourse.source_config?.semester || ''}
                                                onChange={(e) => setEditingCourse({
                                                    ...editingCourse,
                                                    source_config: { ...editingCourse.source_config, semester: parseInt(e.target.value) || undefined }
                                                })}
                                                placeholder="1-8"
                                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                                                min={1}
                                                max={8}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground/60 mb-2">Prerequisites (Comma separated codes)</label>
                                        <input
                                            value={editingCourse.source_config?.prerequisites?.join(', ') || ''}
                                            onChange={(e) => {
                                                const prereqs = e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                                                setEditingCourse({
                                                    ...editingCourse,
                                                    source_config: { ...editingCourse.source_config, prerequisites: prereqs }
                                                });
                                            }}
                                            placeholder="e.g. MATH101, CS101"
                                            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    {/* Status & Grade Section */}
                                    <div className="border-t border-foreground/10 pt-4 mt-4">
                                        <h4 className="text-sm font-bold text-foreground/80 mb-3">Course Status</h4>
                                        <div className="flex gap-2 mb-4">
                                            {(['not_started', 'in_progress', 'completed'] as const).map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setEditingCourse({ ...editingCourse, status: s, grade: s === 'completed' ? editingCourse.grade : undefined })}
                                                    className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${editingCourse.status === s
                                                        ? s === 'completed' ? 'bg-green-600/30 border-green-500/50 text-green-300'
                                                            : s === 'in_progress' ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                                                                : 'bg-foreground/10 border-foreground/20 text-foreground'
                                                        : 'bg-foreground/5 border-foreground/10 text-foreground/40 hover:bg-foreground/10'
                                                        }`}
                                                >
                                                    {s === 'not_started' ? 'Not Started' : s === 'in_progress' ? 'In Progress' : 'Completed ✓'}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Grade Input - Only shown for completed courses */}
                                        {editingCourse.status === 'completed' && (
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-foreground/60">Grade (Optional)</label>
                                                <div className="flex gap-2">
                                                    {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'].map((g) => (
                                                        <button
                                                            key={g}
                                                            type="button"
                                                            onClick={() => setEditingCourse({ ...editingCourse, grade: editingCourse.grade === g ? undefined : g })}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${editingCourse.grade === g
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-foreground/5 text-foreground/40 hover:bg-foreground/10'
                                                                }`}
                                                        >
                                                            {g}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-foreground/30">Click again to remove grade</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 mt-8">
                                        <button
                                            type="button"
                                            onClick={() => setEditingCourse(null)}
                                            className="flex-1 px-4 py-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex justify-center"
                                        >
                                            {isSaving ? <Loader2 className="animate-spin" /> : "Save Changes"}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
