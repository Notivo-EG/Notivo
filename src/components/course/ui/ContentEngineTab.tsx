"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/context/PreferencesContext";
import { FileUpload } from "@/components/FileUpload";
import { BookOpen, Layers, FileText, Loader2, Save, Upload, CheckCircle2, Trash2, ChevronDown, ChevronRight, GraduationCap, FlaskConical, ScrollText, FileSpreadsheet, Notebook, BookMarked, ClipboardList } from "lucide-react";
import { uploadBrainMaterial } from "@/app/actions";

// Category configuration with icons and display names
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
    lecture_slides: { label: "Lecture Slides", icon: Layers, color: "bg-blue-500/10 text-blue-500" },
    textbook: { label: "Textbook", icon: BookMarked, color: "bg-purple-500/10 text-purple-500" },
    past_exam: { label: "Past Exams", icon: ClipboardList, color: "bg-red-500/10 text-red-500" },
    problem_sheet: { label: "Problem Sheets", icon: FileSpreadsheet, color: "bg-orange-500/10 text-orange-500" },
    notes: { label: "Notes", icon: Notebook, color: "bg-green-500/10 text-green-500" },
    research_paper: { label: "Research Papers", icon: ScrollText, color: "bg-cyan-500/10 text-cyan-500" },
    lab_report: { label: "Lab Reports", icon: FlaskConical, color: "bg-pink-500/10 text-pink-500" },
    syllabus: { label: "Syllabus", icon: GraduationCap, color: "bg-yellow-500/10 text-yellow-500" },
    // Legacy types for backwards compatibility
    slide: { label: "Lecture Slides", icon: Layers, color: "bg-blue-500/10 text-blue-500" },
    sheet: { label: "Problem Sheets", icon: FileSpreadsheet, color: "bg-orange-500/10 text-orange-500" },
};

export function ContentEngineTab({ courseId }: { courseId: string }) {
    const supabase = createClient();
    const { playSound } = usePreferences();
    const [isUploading, setIsUploading] = useState(false);
    const [materials, setMaterials] = useState<any[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchMaterials = async () => {
            const { data } = await supabase
                .from('course_materials')
                .select('*')
                .eq('student_course_id', courseId)
                .order('created_at', { ascending: false });
            if (data) {
                setMaterials(data);
                // Expand all categories that have materials by default
                const categories = new Set<string>(data.map((m: any) => m.type as string));
                setExpandedCategories(categories);
            }
        };
        fetchMaterials();
    }, [courseId, supabase]);

    // Group materials by category
    const groupedMaterials = useMemo(() => {
        const groups: Record<string, any[]> = {};
        materials.forEach(m => {
            const type = m.type || 'notes';
            if (!groups[type]) groups[type] = [];
            groups[type].push(m);
        });
        return groups;
    }, [materials]);

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const result = await uploadBrainMaterial(formData, courseId);
            if (result.success) {
                // Refresh list
                const { data } = await supabase
                    .from('course_materials')
                    .select('*')
                    .eq('student_course_id', courseId)
                    .order('created_at', { ascending: false });
                if (data) {
                    setMaterials(data);
                    // Expand the category of the newly uploaded material
                    if (result.category) {
                        setExpandedCategories(prev => new Set([...prev, result.category]));
                    }
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            console.error(error);
            alert(`Upload failed: ${error?.message || 'Unknown error. Check browser console.'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const deleteMaterial = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Delete this material? This will remove it from the knowledge base.")) return;

        // Find the material to get its storage path
        const material = materials.find(m => m.id === id);

        // Delete from storage if content_url exists
        if (material?.content_url) {
            try {
                // Extract storage path from the public URL
                const url = new URL(material.content_url);
                const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/materials\/(.+)/);
                if (pathMatch) {
                    await supabase.storage.from('materials').remove([pathMatch[1]]);
                }
            } catch (err) {
                console.error("Failed to delete file from storage:", err);
            }
        }

        // Delete from database
        const { error } = await supabase
            .from('course_materials')
            .delete()
            .eq('id', id);

        if (!error) {
            setMaterials(prev => prev.filter(m => m.id !== id));
        } else {
            console.error(error);
            alert("Failed to delete material");
        }
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const getCategoryConfig = (type: string) => {
        return CATEGORY_CONFIG[type] || { label: type, icon: FileText, color: "bg-foreground/10 text-foreground" };
    };

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT: Upload & Textbook */}
            <div className="lg:col-span-1 space-y-6">
                {/* Upload Section */}
                <div className="bg-card-bg border border-card-border rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-foreground/70 flex items-center gap-2 mb-4">
                        <Upload className="w-4 h-4" />
                        Upload Materials
                    </h3>
                    <FileUpload
                        onFileSelect={handleUpload}
                        isProcessing={isUploading}
                        label="Drop any PDF - AI will categorize it automatically"
                    />
                </div>

                {/* Reference Textbook */}
                <div className="bg-card-bg border border-card-border rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-foreground/70 flex items-center gap-2 mb-4">
                        <BookOpen className="w-4 h-4" />
                        Reference Textbook
                    </h3>
                    <div className="space-y-3">
                        <input
                            placeholder="Enter Textbook Name..."
                            className="w-full bg-foreground/5 border border-card-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors text-foreground placeholder:text-foreground/30"
                        />
                        <button className="w-full py-3 rounded-xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-opacity">
                            Set Textbook
                        </button>
                    </div>
                    <p className="text-foreground/30 text-xs mt-3">
                        The AI uses this to "Prune" reading lists.
                    </p>
                </div>
            </div>

            {/* RIGHT: Knowledge Base with Folders */}
            <div className="lg:col-span-2">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80">
                    <Layers className="w-5 h-5" />
                    Knowledge Base
                    {materials.length > 0 && (
                        <span className="text-sm font-normal text-foreground/40">
                            ({materials.length} {materials.length === 1 ? 'file' : 'files'})
                        </span>
                    )}
                </h3>

                {materials.length === 0 ? (
                    <div className="h-[400px] border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30">
                        <Layers className="w-12 h-12 mb-4 opacity-50" />
                        <p>No materials uploaded yet.</p>
                        <p className="text-sm">Upload PDFs - AI will organize them into categories.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(groupedMaterials).map(([category, items]) => {
                            const config = getCategoryConfig(category);
                            const Icon = config.icon;
                            const isExpanded = expandedCategories.has(category);

                            return (
                                <div key={category} className="bg-card-bg border border-card-border rounded-2xl overflow-hidden">
                                    {/* Category Header */}
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className="w-full p-4 flex items-center gap-3 hover:bg-foreground/5 transition-colors"
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h4 className="font-medium text-foreground">{config.label}</h4>
                                            <p className="text-xs text-foreground/40">
                                                {items.length} {items.length === 1 ? 'file' : 'files'}
                                            </p>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-foreground/40" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-foreground/40" />
                                        )}
                                    </button>

                                    {/* Category Items */}
                                    {isExpanded && (
                                        <div className="border-t border-card-border">
                                            {items.map((m, idx) => (
                                                <div
                                                    key={m.id}
                                                    className="px-4 py-3 flex items-center gap-3 hover:bg-foreground/5 transition-colors border-b border-card-border last:border-b-0"
                                                >
                                                    <div className="w-6 h-6 rounded flex items-center justify-center bg-foreground/5 text-xs text-foreground/40 shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-medium text-foreground text-sm truncate">{m.title}</h5>
                                                        <p className="text-xs text-foreground/40">
                                                            {new Date(m.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Ready
                                                    </div>
                                                    <button
                                                        onClick={(e) => deleteMaterial(e, m.id)}
                                                        className="p-2 rounded-lg text-foreground/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        title="Delete Material"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

