"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, FileText, Sparkles, Loader2, Image as ImageIcon } from "lucide-react";
import { generateInfographicAction } from "@/app/actions";
import { generateInfographic } from "@/lib/nanoBanana"; // Client-side image gen
import { useInfographics } from "@/hooks/useInfographics";
import { OverlayViewer } from "./OverlayViewer";
import { Infographic } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

interface CourseInfographicTabProps {
    courseId: string;
}

export function CourseInfographicTab({ courseId }: CourseInfographicTabProps) {
    const supabase = createClient();
    const { addInfographic, infographics } = useInfographics();

    // State
    const [materials, setMaterials] = useState<any[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'generating' | 'complete' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [viewingInfographic, setViewingInfographic] = useState<Infographic | null>(null);

    // Fetch Materials
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

    // Handle Generation
    const handleGenerate = async () => {
        if (!selectedMaterial) return;

        try {
            // Stage 1: Analyze with Gemini (Server Action)
            setStatus('analyzing');
            setProgress(10);
            setStatusMessage("Accessing Knowledge Base & Re-uploading to Gemini...");

            const result = await generateInfographicAction(courseId, selectedMaterial);

            if (!result.success || !result.data) {
                throw new Error(result.error || "Analysis failed");
            }

            const geminiData = result.data;
            setProgress(50);
            setStatus('generating');
            setStatusMessage("Designing Infographic (Nano Banana)...");

            // Stage 2: Generate Image (Client Side - Nano Banana)
            const generationResponse = await generateInfographic({
                prompt: geminiData.infographicPrompt,
                aspectRatio: geminiData.aspectRatio || "3:4",
                onProgress: (p) => setProgress(50 + (p * 0.4)) // 50-90%
            });

            const imageUrl = typeof generationResponse === 'string' ? generationResponse : (generationResponse as any).imageUrl;

            // Stage 3: Save & Finish
            const newInfographic: Infographic = {
                id: uuidv4(),
                title: `${geminiData.summary?.slice(0, 30)}...`,
                imageUrl: imageUrl,
                sources: materials.filter(m => m.id === selectedMaterial).map(m => ({ id: m.id, name: m.title })),
                createdAt: new Date().toISOString(),
                courseId: courseId
            };

            addInfographic(newInfographic); // Saves to localStorage hook

            setStatus('complete');
            setProgress(100);
            setStatusMessage("Done!");

        } catch (e: any) {
            console.error(e);
            setStatus('error');
            setStatusMessage(e.message);
        }
    };

    // Filter infographics for this course
    const courseInfographics = infographics.filter(i => i.courseId === courseId);

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT: Material Selection & Controls */}
            <div className="lg:col-span-1 space-y-6">

                {/* 1. Selector */}
                <div className="bg-card-bg border border-card-border rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Layers className="text-blue-400 w-5 h-5" />
                        Select Source Material
                    </h3>

                    {materials.length === 0 ? (
                        <p className="text-sm text-foreground/40">No materials found. Upload PDFs in the Content Engine first.</p>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {materials.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedMaterial(m.id)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${selectedMaterial === m.id
                                        ? 'bg-blue-600/20 border-blue-500/50 text-foreground'
                                        : 'bg-foreground/5 border-transparent text-foreground/60 hover:bg-foreground/10'
                                        }`}
                                >
                                    <FileText className="w-4 h-4 shrink-0" />
                                    <span className="truncate text-sm font-medium">{m.title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. Generate Action */}
                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl p-6 text-center">
                    <div className="mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
                            <Sparkles className="text-white w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-foreground">Generate Infographic</h3>
                        <p className="text-xs text-foreground/40 mt-1">Uses Gemini 2.0 Flash + Nano Banana v3</p>
                    </div>

                    {status === 'idle' || status === 'complete' || status === 'error' ? (
                        <button
                            onClick={handleGenerate}
                            disabled={!selectedMaterial}
                            className={`w-full py-3 rounded-xl font-bold transition-all ${selectedMaterial
                                ? 'bg-foreground text-background hover:scale-105'
                                : 'bg-foreground/10 text-foreground/30 cursor-not-allowed'
                                }`}
                        >
                            {status === 'error' ? 'Retry Generation' : 'Create Visual Summary'}
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-blue-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-blue-400 animate-pulse">{statusMessage}</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <p className="text-xs text-red-400 mt-2">{statusMessage}</p>
                    )}
                </div>
            </div>

            {/* RIGHT: Gallery */}
            <div className="lg:col-span-2">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80">
                    <ImageIcon className="w-5 h-5" />
                    Course Infographics
                </h3>

                {courseInfographics.length === 0 ? (
                    <div className="h-[400px] border-2 border-dashed border-foreground/10 rounded-3xl flex flex-col items-center justify-center text-foreground/30">
                        <Sparkles className="w-10 h-10 mb-4 opacity-50" />
                        <p>No infographics generated yet.</p>
                        <p className="text-sm">Select a specific material to visualize it.</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {courseInfographics.map(ig => (
                            <motion.div
                                key={ig.id}
                                layoutId={ig.id}
                                onClick={() => setViewingInfographic(ig)}
                                className="group relative aspect-[3/4] bg-card-bg border border-card-border rounded-2xl overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all"
                            >
                                <img src={ig.imageUrl} alt={ig.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                    <p className="text-white font-bold text-sm line-clamp-2">{ig.title}</p>
                                    <p className="text-white/60 text-xs mt-1">{new Date(ig.createdAt).toLocaleDateString()}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Overlay */}
            <AnimatePresence>
                {viewingInfographic && (
                    <OverlayViewer
                        infographic={viewingInfographic}
                        onClose={() => setViewingInfographic(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
