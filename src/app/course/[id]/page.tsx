"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    BookOpen,
    FileText,
    AlertTriangle,
    Youtube,
    Brain,
    Settings,
    Play,
    Clock,
    Sparkles,
    Loader2,
    Save,
    CheckCircle2,
    Layers,
    PlayCircle,
    Star,
    Bookmark,
    Check,
    Video, // Added Video icon
    ChevronRight,
    MessageSquare,
    Link as LinkIcon,
    Timer,
    PenTool,
    Image as ImageIcon,
    Upload,
    CheckSquare,
    XCircle,
    HelpCircle,
    RefreshCw,
    Image,
    Music,
    Pause
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FileUpload } from "@/components/FileUpload";
import { parseCourseTree, generateSong } from "@/app/actions";
import { usePreferences } from "@/context/PreferencesContext";
import { CourseInfographicTab } from "@/components/infographic/CourseInfographicTab";
import { SongsTab } from '@/components/course/ui/SongsTab';
import { VideoTutorTab } from '@/components/course/ui/VideoTutorTab';
import { FlashcardsTab } from "@/components/course/ui/FlashcardsTab";
import { QuizTab } from "@/components/course/ui/QuizTab";
import { ExtraCurricularTab } from "@/components/course/ui/ExtraCurricularTab";
import { ExamGeneratorTab } from "@/components/course/ui/ExamGeneratorTab";
import { ShareButton } from "@/components/course/ShareButton";

// Types
interface Course {
    id: string;
    enrollment_id: string;
    code: string;
    name: string;
    source_config: {
        professorNew?: boolean;
        resourceWeight?: "sheet-heavy" | "balanced" | "reference-heavy";
    };
}

interface LectureNode {
    title: string;
    description: string;
    importance: "high" | "medium" | "low";
    topics: string[];
}

export default function CoursePage() {
    const params = useParams();
    const courseId = params.id as string;
    const router = useRouter();
    const supabase = createClient();
    const { playSound } = usePreferences();

    const [brainTab, setBrainTab] = useState<'content' | 'flashcards' | 'infographic' | 'videos' | 'extra' | 'quiz' | 'songs' | 'exam'>('content');

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    // Settings State
    const [professorNew, setProfessorNew] = useState(false);
    const [resourceWeight, setResourceWeight] = useState<"sheet-heavy" | "balanced" | "reference-heavy">("balanced");
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // AI Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState<{ lectures: LectureNode[] } | null>(null);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const { data, error } = await supabase
                    .from('student_courses')
                    .select('*')
                    .eq('id', courseId)
                    .single();

                if (error) throw error;
                setCourse(data);

                // Initialize settings from DB
                if (data.source_config) {
                    setProfessorNew(data.source_config.professorNew || false);
                    setResourceWeight(data.source_config.resourceWeight || "balanced");
                }
            } catch (err) {
                console.error("Error fetching course:", err);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) fetchCourse();
    }, [courseId, supabase]);

    const saveSettings = async () => {
        if (!course) return;
        setIsSavingSettings(true);
        try {
            const newConfig = {
                ...course.source_config,
                professorNew,
                resourceWeight
            };

            const { error } = await supabase
                .from('student_courses')
                .update({ source_config: newConfig })
                .eq('id', courseId);

            if (error) throw error;

            // Update local state
            setCourse({ ...course, source_config: newConfig });
            setShowSettings(false);
        } catch (err) {
            console.error("Error saving settings:", err);
            alert("Failed to save settings");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const result = await parseCourseTree(formData);

            if (result.success) {
                console.log("AI Parsed Data:", result.data);
                setParsedData(result.data);
                // TODO: Save this structure to DB as "draft" or "mastery_profile"
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            console.error("Processing failed:", err);
            alert("AI Failed to analyze file. Check console.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-foreground/30" />
            </div>
        );
    }

    if (!course) return <div className="text-foreground text-center py-20">Course not found</div>;

    return (
        <div className="min-h-screen bg-background px-6 py-12 mt-20 md:mt-0 relative overflow-hidden text-foreground">
            {/* Background Glow */}
            <div className="fixed left-1/2 top-1/4 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-600/10 via-purple-500/5 to-transparent blur-[150px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Navigation */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                >
                    <Link
                        href={`/major/${course.enrollment_id}`}
                        onClick={() => playSound('click')}
                        className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Major Dashboard
                    </Link>
                </motion.div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10"
                >
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center backdrop-blur-md shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                            <BookOpen className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-foreground mb-1">{course.name}</h1>
                            <p className="text-foreground/60 flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full bg-foreground/10 border border-foreground/5 text-xs font-mono">{course.code}</span>
                                <span>•</span>
                                <span>{parsedData ? parsedData.lectures.length : 0} lectures parsed</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <ShareButton courseId={courseId} />
                        <button
                            onClick={() => { setShowSettings(!showSettings); playSound('click'); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${showSettings ? 'bg-foreground text-background' : 'bg-card-bg text-foreground/60 hover:text-foreground border border-card-border'}`}
                        >
                            <Settings className="w-4 h-4" />
                            Course Settings
                        </button>
                    </div>
                </motion.div>

                {/* Settings Panel (Always Available) */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-10 overflow-hidden"
                        >
                            <div className="p-6 rounded-[2rem] bg-card-bg/80 backdrop-blur-xl border border-card-border shadow-lg">
                                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-foreground">
                                    <Brain className="w-5 h-5 text-blue-400" />
                                    Subject Personality
                                </h3>

                                <div className="grid md:grid-cols-2 gap-8 mb-8">
                                    {/* Resource Weighting */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground/80 mb-3">
                                            Resource Dependency
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                { value: "sheet-heavy", label: "Sheet-Dependent", desc: "Focus on tutorials & problem sheets" },
                                                { value: "balanced", label: "Balanced (50/50)", desc: "Mix of slides and sheets" },
                                                { value: "reference-heavy", label: "Reference-Dependent", desc: "Focus on textbook chapters" },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => { setResourceWeight(option.value as any); playSound('click'); }}
                                                    className={`w-full p-4 rounded-xl text-left transition-all border ${resourceWeight === option.value
                                                        ? "bg-blue-600/20 border-blue-500/50 text-foreground shadow-[0_0_15px_rgba(37,99,235,0.15)]"
                                                        : "bg-card-bg border-transparent text-foreground/60 hover:bg-foreground/5"
                                                        }`}
                                                >
                                                    <p className="font-medium">{option.label}</p>
                                                    <p className="text-sm opacity-60">{option.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Professor Logic */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground/80 mb-3">
                                            Professor & Course Status
                                        </label>
                                        <button
                                            onClick={() => { setProfessorNew(!professorNew); playSound('click'); }}
                                            className={`w-full p-5 rounded-xl text-left transition-all border ${professorNew
                                                ? "bg-red-500/20 border-red-500/50 text-foreground shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                                                : "bg-card-bg border-transparent text-foreground/60 hover:bg-foreground/5"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <AlertTriangle className={`w-5 h-5 ${professorNew ? "text-red-400" : "text-foreground/40"}`} />
                                                <div>
                                                    <p className="font-medium">New Professor / New Course</p>
                                                    <p className="text-sm opacity-60">
                                                        {professorNew
                                                            ? "Old exams flagged as Low Reliability"
                                                            : "Old exams are considered reliable"}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => { saveSettings(); playSound('click'); }}
                                        disabled={isSavingSettings}
                                        className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center gap-2"
                                    >
                                        {isSavingSettings ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        Save Personality
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* -------------------- BRAIN (Main Content) -------------------- */}
                <div>
                    {/* Sub-Navigation */}
                    <div className="flex flex-wrap gap-2 mb-10 border-b border-white/10 pb-1">
                        <TabButton
                            active={brainTab === 'content'}
                            onClick={() => setBrainTab('content')}
                            icon={Layers}
                            label="Content Engine"
                        />
                        <TabButton
                            active={brainTab === 'flashcards'}
                            onClick={() => setBrainTab('flashcards')}
                            icon={FileText}
                            label="Flashcards"
                        />
                        <TabButton
                            active={brainTab === 'infographic'}
                            onClick={() => setBrainTab('infographic')}
                            icon={Image}
                            label="Infographic"
                        />

                        <TabButton
                            active={brainTab === 'songs'}
                            onClick={() => setBrainTab('songs')}
                            icon={Music}
                            label="Songs"
                        />
                        <TabButton
                            active={brainTab === 'videos'}
                            onClick={() => setBrainTab('videos')}
                            icon={Video}
                            label="Video Tutor"
                        />
                        <TabButton
                            active={brainTab === 'exam'}
                            onClick={() => setBrainTab('exam')}
                            icon={PenTool}
                            label="Exam Generator"
                        />
                    </div>

                    <div className="min-h-[400px]">
                        {brainTab === 'content' && <ContentEngineTab courseId={courseId} />}
                        {brainTab === 'flashcards' && <FlashcardsTab courseId={courseId} />}
                        {brainTab === 'infographic' && <CourseInfographicTab courseId={courseId} />}
                        {brainTab === 'videos' && <VideoTutorTab courseId={courseId} />}
                        {brainTab === 'songs' && <SongsTab courseId={courseId} />}
                        {brainTab === 'exam' && <ExamGeneratorTab courseId={courseId} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    const { playSound } = usePreferences();
    return (
        <button
            onClick={() => { onClick(); playSound('click'); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl border-b-2 transition-all font-medium ${active
                ? "border-purple-500 text-foreground bg-foreground/5"
                : "border-transparent text-foreground/40 hover:text-foreground hover:bg-foreground/5"
                }`}
        >
            <Icon className={`w-4 h-4 ${active ? "text-purple-400" : ""}`} />
            {label}
        </button>
    );
}


import { ContentEngineTab } from "@/components/course/ui/ContentEngineTab";







// LEVEL 4: QUIZ COMPONENTS
