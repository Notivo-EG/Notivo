"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/context/PreferencesContext";
import { FileUpload } from "@/components/FileUpload";
import { BookOpen, Layers, FileText, Loader2, Save } from "lucide-react";
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
