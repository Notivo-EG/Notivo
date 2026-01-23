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
    RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FileUpload } from "@/components/FileUpload";
import { parseCourseTree, uploadBrainMaterial, generateFlashcards, generateQuizAction, evaluateQuizAction } from "@/app/actions";
import { usePreferences } from "@/context/PreferencesContext";

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

    const [brainTab, setBrainTab] = useState<'content' | 'flashcards' | 'videos' | 'extra' | 'quiz'>('content');

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
        <div className="min-h-screen bg-background px-6 py-12 relative overflow-hidden text-foreground">
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
                                                            ? "⚠️ Old exams flagged as Low Reliability"
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
                            active={brainTab === 'videos'}
                            onClick={() => setBrainTab('videos')}
                            icon={Youtube}
                            label="Video Tutor"
                        />
                        <TabButton
                            active={brainTab === 'extra'}
                            onClick={() => setBrainTab('extra')}
                            icon={Sparkles}
                            label="Go Deeper"
                        />
                        <TabButton
                            active={brainTab === 'quiz'}
                            onClick={() => setBrainTab('quiz')}
                            icon={HelpCircle}
                            label="AI Quiz"
                        />
                    </div>

                    <div className="min-h-[400px]">
                        {brainTab === 'content' && <ContentEngineTab courseId={courseId} />}
                        {brainTab === 'flashcards' && <FlashcardsTab courseId={courseId} />}
                        {brainTab === 'quiz' && <QuizTab courseId={courseId} />}
                        {brainTab === 'videos' && <VideoTutorTab />}
                        {brainTab === 'extra' && <ExtraCurricularTab />}
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

// import { uploadBrainMaterial } from "@/app/actions"; // Moved to top

function ContentEngineTab({ courseId }: { courseId: string }) {
    const supabase = createClient();
    const { playSound } = usePreferences();
    const [isUploading, setIsUploading] = useState(false);
    const [materials, setMaterials] = useState<any[]>([]);

    useEffect(() => {
        const fetchMaterials = async () => {
            const { data } = await supabase
                .from('course_materials')
                .select('*')
                .eq('student_course_id', courseId)
                .order('created_at', { ascending: false });
            if (data) setMaterials(data);
        };
        fetchMaterials();
    }, [courseId, supabase]);

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            // Auto-detect type based on name/extension for now, simple logic
            const type = file.name.toLowerCase().includes("sheet") ? "sheet" : "slide";
            formData.append("type", type);

            const result = await uploadBrainMaterial(formData, courseId);
            if (result.success) {
                // Refresh list
                const { data } = await supabase
                    .from('course_materials')
                    .select('*')
                    .eq('student_course_id', courseId)
                    .order('created_at', { ascending: false });
                if (data) setMaterials(data);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error(error);
            alert("Upload failed. Make sure you created the 'materials' bucket!");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="space-y-6">
                <div className="p-1">
                    <FileUpload
                        onFileSelect={handleUpload}
                        isProcessing={isUploading}
                        label="Drop PDFs: Course Slides or Problem Sheets"
                    />
                </div>

                <div className="p-8 rounded-[2.5rem] bg-card-bg border border-card-border">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <BookOpen className="text-blue-400" />
                        <span className="text-foreground">Reference Textbook</span>
                    </h3>
                    <div className="flex gap-2">
                        <input
                            placeholder="Enter Textbook Name (e.g. Calculus by Stewart)"
                            className="flex-1 bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-foreground placeholder:text-foreground/30"
                        />
                        <button className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold transition-colors text-white">
                            Set
                        </button>
                    </div>
                    <p className="text-foreground/30 text-sm mt-3">
                        Or upload a PDF if you have it. The AI uses this to "Prune" reading lists.
                    </p>
                </div>
            </div>

            {/* Status Section */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground/60">Knowledge Base</h3>
                {materials.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-card-bg border border-card-border flex flex-col items-center justify-center h-[300px] text-center">
                        <Layers className="w-12 h-12 text-foreground/20 mb-4" />
                        <p className="text-foreground/40">No materials uploaded yet.</p>
                        <p className="text-foreground/20 text-sm">Upload slides to activate the Content Engine.</p>
                    </div>
                ) : (
                    <div className="space-y-3 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {materials.map((m) => (
                            <div key={m.id} className="p-4 rounded-xl bg-card-bg border border-card-border flex items-center gap-4 hover:bg-foreground/5 transition-colors">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.type === 'slide' ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400' : 'bg-green-500/10 text-green-500 dark:text-green-400'}`}>
                                    {m.type === 'slide' ? <Layers size={20} /> : <FileText size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground truncate">{m.title}</h4>
                                    <p className="text-xs text-foreground/40 capitalize">{m.type} • Week {m.week_number || '?'}</p>
                                </div>
                                <div className="text-xs px-2 py-1 rounded bg-foreground/10 text-foreground/60">
                                    AI Ready
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// import {generateFlashcards} from "@/app/actions"; // Moved to top
// import {Bookmark, Check, ChevronRight} from "lucide-react"; // Moved to top

function FlashcardsTab({ courseId }: { courseId: string }) {
    const supabase = createClient();
    const { playSound } = usePreferences();
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [filter, setFilter] = useState<'all' | 'bookmarked' | 'done'>('all');

    useEffect(() => {
        const fetchFlashcards = async () => {
            const { data } = await supabase
                .from('flashcards')
                .select('*')
                .eq('student_course_id', courseId)
                .order('created_at', { ascending: true });
            if (data) setFlashcards(data);
        };
        fetchFlashcards();
    }, [courseId, supabase]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateFlashcards(courseId);
            if (result.success) {
                const { data } = await supabase
                    .from('flashcards')
                    .select('*')
                    .eq('student_course_id', courseId)
                    .order('created_at', { ascending: true });
                if (data) setFlashcards(data);
                setCurrentIndex(0);
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error(error);
            alert("Generation failed!");
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleBookmark = async (cardId: string, currentVal: boolean) => {
        await supabase.from('flashcards').update({ is_bookmarked: !currentVal }).eq('id', cardId);
        setFlashcards(prev => prev.map(c => c.id === cardId ? { ...c, is_bookmarked: !currentVal } : c));
    };

    const markAsDone = async (cardId: string) => {
        const card = flashcards.find(c => c.id === cardId);
        if (card && card.review_count === 0) {
            await supabase.from('flashcards').update({ review_count: 1, last_reviewed: new Date().toISOString() }).eq('id', cardId);
            setFlashcards(prev => prev.map(c => c.id === cardId ? { ...c, review_count: 1, last_reviewed: new Date().toISOString() } : c));
        }
    };

    const handleFlip = () => {
        if (!isFlipped) {
            markAsDone(flashcards[currentIndex].id);
        }
        setIsFlipped(!isFlipped);
    };

    const nextCard = () => {
        setIsFlipped(false);
        const filtered = getFilteredCards();
        const nextIdx = filtered.findIndex((c, i) => i > currentIndex) !== -1 ? filtered.findIndex((c, i) => i > currentIndex) : 0;
        setCurrentIndex(flashcards.indexOf(filtered[nextIdx >= filtered.length ? 0 : nextIdx]));
    };

    const prevCard = () => {
        setIsFlipped(false);
        const filtered = getFilteredCards();
        const prevIdx = [...filtered].reverse().findIndex((c) => flashcards.indexOf(c) < currentIndex);
        const actualIdx = prevIdx >= 0 ? filtered.length - 1 - prevIdx : filtered.length - 1;
        setCurrentIndex(flashcards.indexOf(filtered[actualIdx]));
    };

    const getFilteredCards = () => {
        if (filter === 'bookmarked') return flashcards.filter(c => c.is_bookmarked);
        if (filter === 'done') return flashcards.filter(c => c.review_count > 0);
        return flashcards;
    };

    const filteredCards = getFilteredCards();

    if (flashcards.length === 0) {
        return (
            <div className="text-center py-20">
                <FileText className="w-16 h-16 text-foreground/10 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-foreground/60 mb-4">No Flashcards Yet</h2>
                <p className="text-foreground/40 max-w-md mx-auto mb-8">
                    Upload materials in the Content Engine tab first, then generate flashcards here!
                </p>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all flex items-center gap-3 mx-auto"
                >
                    {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    {isGenerating ? "Generating..." : "Generate Flashcards from Materials"}
                </button>
            </div>
        );
    }

    const currentCard = flashcards[currentIndex];
    const currentFilteredIndex = filteredCards.indexOf(currentCard);

    return (
        <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
                {/* Filters */}
                <div className="p-4 rounded-2xl bg-card-bg border border-card-border space-y-2">
                    {(['all', 'bookmarked', 'done'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setCurrentIndex(0); setIsFlipped(false); playSound('click'); }}
                            className={`w-full text-left px-4 py-2 rounded-xl flex items-center justify-between transition-colors ${filter === f ? 'bg-purple-600/20 text-foreground' : 'text-foreground/40 hover:bg-foreground/5'}`}
                        >
                            <span className="capitalize flex items-center gap-2">
                                {f === 'bookmarked' && <Bookmark className="w-4 h-4" />}
                                {f === 'done' && <Check className="w-4 h-4" />}
                                {f === 'all' && <Layers className="w-4 h-4" />}
                                {f}
                            </span>
                            <span className="text-xs bg-foreground/10 px-2 py-0.5 rounded">
                                {f === 'all' ? flashcards.length : f === 'bookmarked' ? flashcards.filter(c => c.is_bookmarked).length : flashcards.filter(c => c.review_count > 0).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Card List */}
                <div className="max-h-[400px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {filteredCards.map((card, i) => (
                        <button
                            key={card.id}
                            onClick={() => { setCurrentIndex(flashcards.indexOf(card)); setIsFlipped(false); playSound('click'); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${flashcards.indexOf(card) === currentIndex ? 'bg-blue-600/30 text-foreground' : 'text-foreground/50 hover:bg-foreground/5'}`}
                        >
                            <span className="w-5 h-5 rounded bg-foreground/10 flex items-center justify-center text-xs">{i + 1}</span>
                            <span className="truncate flex-1">{card.front.slice(0, 30)}...</span>
                            {card.is_bookmarked && <Bookmark className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                            {card.review_count > 0 && <Check className="w-3 h-3 text-green-400" />}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full text-sm text-purple-400 hover:text-purple-300 flex items-center justify-center gap-2 py-2"
                >
                    {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    Regenerate All
                </button>
            </div>

            {/* Main Card Area */}
            <div className="lg:col-span-3">
                {filteredCards.length === 0 ? (
                    <div className="text-center py-20 text-foreground/40">
                        No cards match this filter.
                    </div>
                ) : (
                    <>
                        {/* Card Counter & Actions */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-foreground/40">
                                Card {currentFilteredIndex + 1} of {filteredCards.length}
                            </p>
                            <button
                                onClick={() => { toggleBookmark(currentCard.id, currentCard.is_bookmarked); playSound('click'); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${currentCard.is_bookmarked ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-foreground/5 border-foreground/10 text-foreground/40 hover:text-foreground'}`}
                            >
                                <Bookmark className={`w-4 h-4 ${currentCard.is_bookmarked ? 'fill-yellow-400' : ''}`} />
                                {currentCard.is_bookmarked ? 'Bookmarked' : 'Bookmark'}
                            </button>
                        </div>

                        {/* 3D Flashcard */}
                        <div
                            className="perspective-1000 cursor-pointer"
                            onClick={handleFlip}
                            style={{ perspective: '1000px' }}
                        >
                            <motion.div
                                className="relative h-[320px] w-full"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Front */}
                                <div
                                    className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-card-border backdrop-blur-md p-8 flex flex-col items-center justify-center text-center shadow-xl"
                                    style={{ backfaceVisibility: 'hidden' }}
                                >
                                    <p className="text-xs text-blue-400 uppercase tracking-wider mb-4">Question</p>
                                    <p className="text-2xl font-bold text-foreground">{currentCard.front}</p>
                                    <p className="absolute bottom-6 text-foreground/20 text-sm">Click to reveal answer</p>
                                    {currentCard.review_count > 0 && (
                                        <div className="absolute top-4 right-4 flex items-center gap-1 text-green-400 text-xs">
                                            <Check className="w-4 h-4" /> Reviewed
                                        </div>
                                    )}
                                </div>

                                {/* Back */}
                                <div
                                    className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-green-600/20 to-blue-600/10 border border-card-border backdrop-blur-md p-8 flex flex-col items-center justify-center text-center shadow-xl"
                                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                >
                                    <p className="text-xs text-green-400 uppercase tracking-wider mb-4">Answer</p>
                                    <p className="text-xl text-foreground">{currentCard.back}</p>
                                    <p className="absolute bottom-6 text-foreground/20 text-sm">Click to flip back</p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                onClick={() => { prevCard(); playSound('click'); }}
                                className="w-12 h-12 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center hover:bg-foreground/10 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-foreground/60" />
                            </button>
                            <button
                                onClick={() => { nextCard(); playSound('click'); }}
                                className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center gap-2"
                            >
                                Next Card <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => { nextCard(); playSound('click'); }}
                                className="w-12 h-12 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center hover:bg-foreground/10 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-foreground/60 rotate-180" />
                            </button>
                        </div>

                        {/* Tags */}
                        {currentCard.tags && currentCard.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center mt-6">
                                {currentCard.tags.map((tag: string, i: number) => (
                                    <span key={i} className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function VideoTutorTab() {
    return (
        <div className="text-center py-20">
            <Youtube className="w-16 h-16 text-foreground/10 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground/60">AI Video Tutor</h2>
            <p className="text-foreground/40 max-w-md mx-auto mt-2">
                We will find the best YouTube videos for your specific topics. <br />
                Coming soon: "Timestamped Explanations".
            </p>
        </div>
    );
}

function ExtraCurricularTab() {
    return (
        <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-foreground/10 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground/60">"Go Deeper"</h2>
            <p className="text-foreground/40 max-w-md mx-auto mt-2">
                Love this subject? We'll build a career & project roadmap for you.
            </p>
        </div>
    );
}

// LEVEL 4: QUIZ COMPONENTS

function QuizTab({ courseId }: { courseId: string }) {
    const { playSound } = usePreferences();
    const [quizState, setQuizState] = useState<'config' | 'loading' | 'active' | 'grading' | 'results'>('config');
    const [config, setConfig] = useState({
        mcqConcepts: 3,
        mcqProblems: 1,
        trueFalse: 3,
        writtenConcepts: 1,
        writtenProblems: 1,
        timeLimit: 20 // minutes
    });
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [results, setResults] = useState<any>(null); // { results: [], percentage: number }

    const startQuiz = async () => {
        playSound('click');
        setQuizState('loading');
        const res = await generateQuizAction(courseId, config);
        if (res.success) {
            setQuestions(res.questions);
            setAnswers({});
            setQuizState('active');
        } else {
            alert("Failed to generate quiz: " + res.error);
            setQuizState('config');
        }
    };

    const submitQuiz = async () => {
        playSound('click');
        setQuizState('grading');

        // Prepare FormData
        const formData = new FormData();
        const quizData = {
            questions,
            userAnswers: Object.fromEntries(
                Object.entries(answers).map(([qid, ans]) => [
                    qid,
                    { type: ans.type, value: ans.type === 'image' ? 'image_upload' : ans.value }
                ])
            )
        };
        formData.append('quizData', JSON.stringify(quizData));

        // Append Images
        Object.entries(answers).forEach(([qid, ans]) => {
            if (ans.type === 'image' && ans.file) {
                formData.append(`file_${qid}`, ans.file);
            }
        });

        const res = await evaluateQuizAction(formData);
        if (res.success) {
            setResults(res);
            setQuizState('results');
        } else {
            alert("Grading failed: " + res.error);
            setQuizState('active'); // Go back to allow retry
        }
    };

    return (
        <div className="relative min-h-[500px]">
            {quizState === 'config' && (
                <QuizConfigView config={config} setConfig={setConfig} onStart={startQuiz} />
            )}
            {quizState === 'loading' && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    <p className="text-foreground/60 animate-pulse">Consulting the Professor...</p>
                </div>
            )}
            {quizState === 'active' && (
                <QuizActiveView
                    questions={questions}
                    answers={answers}
                    setAnswers={setAnswers}
                    timeLimit={config.timeLimit}
                    onSubmit={submitQuiz}
                />
            )}
            {quizState === 'grading' && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Brain className="w-12 h-12 animate-pulse text-purple-500" />
                    <p className="text-foreground/60 animate-pulse">Grading your answers...</p>
                    <p className="text-xs text-foreground/40">Visual Vision Model Analyzing Handwriting...</p>
                </div>
            )}
            {quizState === 'results' && results && (
                <QuizResultsView results={results} questions={questions} answers={answers} onRetry={() => setQuizState('config')} />
            )}
        </div>
    );
}

function QuizConfigView({ config, setConfig, onStart }: any) {
    const { playSound } = usePreferences();
    const updateCount = (key: string, delta: number) => {
        playSound('click');
        setConfig((prev: any) => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }));
    };

    const totalQs = config.mcqConcepts + config.mcqProblems + config.trueFalse + config.writtenConcepts + config.writtenProblems;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-2 text-foreground">Quiz Configuration</h2>
                <p className="text-foreground/60">Customize your exam experience.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Question Counts */}
                <div className="p-6 rounded-[2rem] bg-card-bg border border-card-border space-y-4">
                    <h3 className="font-bold flex items-center gap-2 text-foreground">
                        <StackIcon icon={HelpCircle} color="blue" /> Question Composition
                    </h3>

                    <CounterRow label="MCQ (Concepts)" value={config.mcqConcepts} onChange={(d: number) => updateCount('mcqConcepts', d)} />
                    <CounterRow label="MCQ (Problems)" value={config.mcqProblems} onChange={(d: number) => updateCount('mcqProblems', d)} />
                    <CounterRow label="True / False" value={config.trueFalse} onChange={(d: number) => updateCount('trueFalse', d)} />
                    <div className="h-px bg-foreground/5 my-2" />
                    <CounterRow label="Written (Theory)" value={config.writtenConcepts} onChange={(d: number) => updateCount('writtenConcepts', d)} />
                    <CounterRow label="Written (Problems)" value={config.writtenProblems} onChange={(d: number) => updateCount('writtenProblems', d)} />
                </div>

                {/* Settings */}
                <div className="space-y-6">
                    <div className="p-6 rounded-[2rem] bg-card-bg border border-card-border space-y-4">
                        <h3 className="font-bold flex items-center gap-2 text-foreground">
                            <StackIcon icon={Clock} color="purple" /> Time Limit
                        </h3>
                        <div className="flex items-center justify-between">
                            <span className="text-foreground/60">Duration (Minutes)</span>
                            <div className="flex items-center gap-3 bg-foreground/5 rounded-xl p-1">
                                <button onClick={() => updateCount('timeLimit', -5)} className="w-8 h-8 rounded-lg hover:bg-foreground/10 flex items-center justify-center">-</button>
                                <span className="font-mono font-bold w-12 text-center text-foreground">{config.timeLimit}</span>
                                <button onClick={() => updateCount('timeLimit', 5)} className="w-8 h-8 rounded-lg hover:bg-foreground/10 flex items-center justify-center">+</button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 flex flex-col items-center justify-center text-center gap-2">
                        <span className="text-4xl font-bold text-foreground">{totalQs}</span>
                        <span className="text-sm text-foreground/50 uppercase tracking-wider font-bold">Questions Selected</span>
                    </div>

                    <button
                        onClick={onStart}
                        disabled={totalQs === 0}
                        className="w-full py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                        Generate Quiz
                    </button>
                </div>
            </div>
        </div>
    );
}

function CounterRow({ label, value, onChange }: any) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-foreground/80 font-medium">{label}</span>
            <div className="flex items-center gap-3">
                <button onClick={() => onChange(-1)} className="w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-foreground/60 transition-colors">-</button>
                <span className="w-6 text-center font-bold text-foreground">{value}</span>
                <button onClick={() => onChange(1)} className="w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-foreground/60 transition-colors">+</button>
            </div>
        </div>
    );
}

function StackIcon({ icon: Icon, color }: any) {
    return (
        <div className={`p-1.5 rounded-lg bg-${color}-500/10 text-${color}-500`}>
            <Icon size={16} />
        </div>
    );
}

function QuizActiveView({ questions, answers, setAnswers, timeLimit, onSubmit }: any) {
    const { playSound } = usePreferences();
    const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev: number) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onSubmit(); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const currentQ = questions[currentIndex];
    const currentAns = answers[currentQ.id];

    const handleAnswer = (val: any, type: 'option' | 'text' | 'image', file?: File) => {
        setAnswers((prev: any) => ({
            ...prev,
            [currentQ.id]: { value: val, type, file }
        }));
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-full min-h-[600px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-background/80 backdrop-blur-md z-20 py-4 border-b border-foreground/5">
                <div className="flex items-center gap-4">
                    <span className="text-foreground/40 font-mono text-sm">Question {currentIndex + 1} / {questions.length}</span>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${currentQ.type === 'written' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                        {currentQ.type}
                    </div>
                </div>
                <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
                    <Timer size={20} />
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Question Card */}
            <div className="flex-1 flex flex-col justify-center">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 rounded-[2rem] bg-card-bg border border-card-border shadow-lg"
                >
                    <h2 className="text-2xl font-bold mb-8 text-foreground leading-relaxed">{currentQ.question}</h2>

                    <div className="space-y-4">
                        {/* MCQ Options */}
                        {currentQ.type === 'mcq' && currentQ.options?.map((opt: string, i: number) => (
                            <button
                                key={i}
                                onClick={() => handleAnswer(opt, 'option')}
                                className={`w-full p-4 rounded-xl text-left border transition-all flex items-center gap-4 group ${currentAns?.value === opt
                                    ? 'bg-blue-600/20 border-blue-500 text-foreground'
                                    : 'bg-foreground/5 border-transparent text-foreground/60 hover:bg-foreground/10'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${currentAns?.value === opt ? 'bg-blue-500 border-blue-500 text-white' : 'border-foreground/20 text-foreground/40'
                                    }`}>
                                    {String.fromCharCode(65 + i)}
                                </div>
                                <span className="text-lg">{opt}</span>
                            </button>
                        ))}

                        {/* True/False */}
                        {currentQ.type === 'true_false' && (
                            <div className="flex gap-4">
                                {['True', 'False'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => handleAnswer(opt, 'option')}
                                        className={`flex-1 p-6 rounded-xl border text-center font-bold text-xl transition-all ${currentAns?.value === opt
                                            ? 'bg-blue-600/20 border-blue-500 text-foreground'
                                            : 'bg-foreground/5 border-transparent text-foreground/60 hover:bg-foreground/10'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Written */}
                        {currentQ.type === 'written' && (
                            <div className="space-y-6">
                                <textarea
                                    value={currentAns?.type === 'text' ? currentAns.value : ''}
                                    onChange={(e) => handleAnswer(e.target.value, 'text')}
                                    placeholder="Type your answer here..."
                                    className="w-full h-40 bg-foreground/5 border border-foreground/10 rounded-xl p-4 text-foreground focus:outline-none focus:border-blue-500 resize-none"
                                />

                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-foreground/10" />
                                    <span className="text-foreground/40 text-sm">OR</span>
                                    <div className="h-px flex-1 bg-foreground/10" />
                                </div>

                                {/* Image Upload */}
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    handleAnswer(ev.target?.result, 'image', file);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${currentAns?.type === 'image' ? 'border-green-500/50 bg-green-500/10' : 'border-foreground/10 bg-foreground/5 group-hover:bg-foreground/10'
                                        }`}>
                                        {currentAns?.type === 'image' ? (
                                            <>
                                                <div className="w-12 h-12 rounded-lg overflow-hidden relative mb-2">
                                                    <img src={currentAns.value} alt="Preview" className="object-cover w-full h-full" />
                                                </div>
                                                <p className="text-green-400 font-bold">Image Uploaded</p>
                                                <p className="text-xs text-foreground/40">Click to change</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-foreground/40" />
                                                <p className="text-foreground/60 font-medium">Upload Handwritten Answer</p>
                                                <p className="text-xs text-foreground/30">AI will grade your paper</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between mt-8 py-6">
                <button
                    onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); playSound('click'); }}
                    disabled={currentIndex === 0}
                    className="px-6 py-3 rounded-full hover:bg-foreground/10 text-foreground/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                    <ArrowLeft size={18} /> Previous
                </button>

                <div className="flex gap-2">
                    {questions.map((_: any, i: number) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-blue-500' : answers[questions[i].id] ? 'bg-foreground/40' : 'bg-foreground/10'
                            }`} />
                    ))}
                </div>

                {currentIndex === questions.length - 1 ? (
                    <button
                        onClick={onSubmit}
                        className="px-8 py-3 rounded-full bg-green-600 hover:bg-green-500 text-white font-bold transition-all shadow-lg shadow-green-500/20 active:scale-95 flex items-center gap-2"
                    >
                        Submit Quiz <CheckCircle2 size={18} />
                    </button>
                ) : (
                    <button
                        onClick={() => { setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1)); playSound('click'); }}
                        className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                    >
                        Next <ChevronRight size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}

function QuizResultsView({ results, questions, answers, onRetry }: any) {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-12">
                <div className="inline-block p-4 rounded-full bg-card-bg border border-card-border shadow-xl mb-6">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-foreground/10" />
                            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent"
                                className={`${results.percentage >= 70 ? 'text-green-500' : 'text-orange-500'} transition-all duration-1000 ease-out`}
                                strokeDasharray={377}
                                strokeDashoffset={377 - (377 * results.percentage) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute text-3xl font-bold text-foreground">{results.percentage}%</span>
                    </div>
                </div>
                <h2 className="text-4xl font-bold text-foreground mb-2">
                    {results.percentage >= 90 ? "Outstanding!" : results.percentage >= 70 ? "Good Job!" : "Keep Practicing"}
                </h2>
                <p className="text-foreground/60">Here is how you performed.</p>
            </div>

            <div className="space-y-6">
                {questions.map((q: any, i: number) => {
                    const result = results.results.find((r: any) => r.questionId === q.id);
                    const isCorrect = result?.correct;
                    const userAnswer = answers[q.id];

                    return (
                        <div key={q.id} className={`p-6 rounded-2xl border ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-sm ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {i + 1}
                                    </span>
                                    <span className="text-foreground/60 font-mono text-xs uppercase">{q.type}</span>
                                </div>
                                <span className={`font-bold ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                    {result?.score}%
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-4">{q.question}</h3>

                            <div className="grid md:grid-cols-2 gap-6 text-sm">
                                <div className="p-4 rounded-xl bg-foreground/5">
                                    <p className="text-xs text-foreground/40 uppercase font-bold mb-2">Your Answer</p>
                                    {userAnswer?.type === 'image' ? (
                                        <div className="flex items-center gap-2 text-blue-400">
                                            <ImageIcon size={16} /> <span>Image Uploaded</span>
                                        </div>
                                    ) : (
                                        <p className="text-foreground font-medium">{userAnswer?.value || '(No Answer)'}</p>
                                    )}
                                </div>
                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                    <p className="text-xs text-blue-400 uppercase font-bold mb-2">Correct / Rubric</p>
                                    <p className="text-foreground/80">{q.correctAnswer}</p>
                                </div>
                            </div>

                            {result?.feedback && (
                                <div className="mt-4 pt-4 border-t border-foreground/10">
                                    <p className="flex items-start gap-2 text-foreground/80">
                                        <Brain className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                                        <span>{result.feedback}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-center mt-12 pb-20">
                <button
                    onClick={onRetry}
                    className="px-8 py-4 rounded-full bg-foreground text-background font-bold text-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <RefreshCw size={20} /> Start New Quiz
                </button>
            </div>
        </div>
    );
}
