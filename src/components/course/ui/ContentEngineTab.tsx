"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/context/PreferencesContext";
import { FileUpload } from "@/components/FileUpload";
import { BookOpen, Layers, FileText, Loader2, Save, Upload, CheckCircle2, Trash2 } from "lucide-react";
import { uploadBrainMaterial } from "@/app/actions";

export function ContentEngineTab({ courseId }: { courseId: string }) {
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
                        label="Drop PDFs: Course Slides or Problem Sheets"
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

            {/* RIGHT: Knowledge Base List */}
            <div className="lg:col-span-2">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80">
                    <Layers className="w-5 h-5" />
                    Knowledge Base
                </h3>

                {materials.length === 0 ? (
                    <div className="h-[400px] border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30">
                        <Layers className="w-12 h-12 mb-4 opacity-50" />
                        <p>No materials uploaded yet.</p>
                        <p className="text-sm">Upload slides to activate the Content Engine.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {materials.map((m, idx) => {
                            const visualIndex = materials.length - idx;
                            return (
                                <div key={m.id} className="p-4 rounded-xl bg-card-bg border border-card-border flex items-center gap-4 hover:bg-foreground/5 transition-colors group">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${m.type === 'slide' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {m.type === 'slide' ? <Layers size={20} /> : <FileText size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-foreground/30">#{visualIndex}</span>
                                            <h4 className="font-medium text-foreground truncate">{m.title}</h4>
                                        </div>
                                        <p className="text-xs text-foreground/40 capitalize flex items-center gap-2 mt-0.5">
                                            {m.type} • {new Date(m.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        AI Ready
                                    </div>
                                    <button
                                        onClick={(e) => deleteMaterial(e, m.id)}
                                        className="p-2 rounded-lg text-foreground/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Delete Material"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div >
    );
}
