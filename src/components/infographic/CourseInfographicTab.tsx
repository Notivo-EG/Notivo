"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Sparkles, Loader2, Image as ImageIcon, CheckCircle2, Trash2 } from "lucide-react";
import { generateInfographicAction } from "@/app/actions";
import { generateInfographic } from "@/lib/nanoBanana";
import { useInfographics } from "@/hooks/useInfographics";
import { useGeneration } from "@/context/GenerationContext";
import { OverlayViewer } from "./OverlayViewer";
import { Infographic } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

interface CourseInfographicTabProps {
    courseId: string;
}

interface Material {
    id: string;
    title: string;
    type: string;
}

export function CourseInfographicTab({ courseId }: CourseInfographicTabProps) {
    const supabase = createClient();
    const { addInfographic, removeInfographic, infographics, isLoading, syncLocalData, hasLocalItems } = useInfographics(courseId);
    const { addTask, updateTask, tasks } = useGeneration();
    const [isSyncing, setIsSyncing] = useState(false);

    const [materials, setMaterials] = useState<Material[]>([]);
    const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
    const [viewingInfographic, setViewingInfographic] = useState<Infographic | null>(null);

    const activeTask = tasks.find(
        t => t.type === 'infographic' && t.courseId === courseId && (t.status === 'pending' || t.status === 'processing')
    );
    const isGenerating = !!activeTask;
    const progress = activeTask?.progress || 0;
    const statusMessage = activeTask?.message || "";

    useEffect(() => {
        const fetchMaterials = async () => {
            const { data } = await supabase
                .from('course_materials')
                .select('id, title, type')
                .eq('student_course_id', courseId)
                .order('created_at', { ascending: false });
            if (data) setMaterials(data);
        };
        fetchMaterials();
    }, [courseId, supabase]);

    const getSourceIndex = (materialId: string) => {
        const idx = materials.findIndex(m => m.id === materialId);
        return idx !== -1 ? materials.length - idx : null;
    };

    const handleGenerate = async () => {
        if (!selectedMaterialId) return;

        const taskId = uuidv4();
        const sourceIndex = getSourceIndex(selectedMaterialId);

        addTask({
            id: taskId,
            type: 'infographic',
            status: 'processing',
            progress: 10,
            message: `Analyzing PDF #${sourceIndex}...`,
            courseId,
        });

        try {
            updateTask(taskId, { progress: 10, message: "Accessing Knowledge Base..." });
            const result = await generateInfographicAction(courseId, selectedMaterialId);

            if (!result.success || !result.data) {
                throw new Error(result.error || "Analysis failed");
            }

            const geminiData = result.data;
            updateTask(taskId, { progress: 50, message: "Designing Infographic..." });

            const generationResponse = await generateInfographic({
                prompt: geminiData.infographicPrompt,
                aspectRatio: geminiData.aspectRatio || "3:4",
                onProgress: (p) => updateTask(taskId, { progress: 50 + (p * 0.4) })
            });

            const imageUrl = typeof generationResponse === 'string' ? generationResponse : (generationResponse as any).imageUrl;

            const selectedMaterialData = materials.find(m => m.id === selectedMaterialId);
            const newInfographic: Infographic = {
                id: uuidv4(),
                title: `${geminiData.summary?.slice(0, 30)}...`,
                imageUrl: imageUrl,
                sources: selectedMaterialData ? [{ id: selectedMaterialData.id, name: selectedMaterialData.title }] : [],
                sourceIndexes: sourceIndex ? [sourceIndex] : [],
                createdAt: new Date().toISOString(),
                courseId: courseId
            };

            addInfographic(newInfographic);
            updateTask(taskId, { status: 'completed', progress: 100, message: "Infographic ready!" });

        } catch (e: any) {
            console.error(e);
            updateTask(taskId, { status: 'failed', message: e.message || "Generation failed" });
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncLocalData();
        } catch (e) {
            console.error("Sync failed", e);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT: Material Selection & Generate */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-card-bg border border-card-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-foreground/70 flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Select Source Material
                        </h3>
                    </div>

                    {materials.length === 0 ? (
                        <p className="text-sm text-foreground/40">No materials found. Upload PDFs in the Content Engine first.</p>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {materials.map((m, idx) => {
                                const isSelected = selectedMaterialId === m.id;
                                const visualIndex = materials.length - idx;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => setSelectedMaterialId(m.id)}
                                        disabled={isGenerating}
                                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 group ${isSelected
                                            ? 'bg-primary/10 border-primary/50 text-foreground'
                                            : 'bg-card-bg border-card-border text-foreground/60 hover:bg-foreground/5'
                                            } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-foreground/10 text-foreground/40'}`}>
                                            #{visualIndex}
                                        </div>
                                        <span className="truncate text-sm font-medium flex-1">{m.title}</span>
                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Generate Button */}
                <div className="bg-card-bg border border-card-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-foreground/60" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground text-sm">Generate Infographic</h3>
                            <p className="text-xs text-foreground/40">Gemini 2.0 + Nano Banana</p>
                        </div>
                    </div>

                    {!isGenerating ? (
                        <button
                            onClick={handleGenerate}
                            disabled={!selectedMaterialId}
                            className="w-full py-3 rounded-xl bg-foreground text-background font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                        >
                            Create Visual Summary
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-foreground/60 animate-pulse text-center">{statusMessage}</p>
                        </div>
                    )}

                    {isGenerating && (
                        <p className="text-xs text-foreground/40 text-center mt-3">
                            You can switch tabs - generation continues in the background.
                        </p>
                    )}
                </div>

                {/* Sync Legacy Data */}
                {hasLocalItems && (
                    <div className="bg-card-bg border border-orange-500/30 rounded-2xl p-4">
                        <p className="text-xs text-foreground/60 mb-2">Found local infographics. Sync to database?</p>
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="w-full py-2 rounded-xl bg-foreground/10 text-foreground/70 text-xs font-bold hover:bg-foreground/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isSyncing ? <><Loader2 className="w-3 h-3 animate-spin" /> Syncing...</> : "Sync to Database"}
                        </button>
                    </div>
                )}
            </div>

            {/* RIGHT: Gallery */}
            <div className="lg:col-span-2">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80">
                    <ImageIcon className="w-5 h-5" />
                    Course Infographics
                </h3>

                {isLoading ? (
                    <div className="h-[400px] border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30">
                        <Loader2 className="w-10 h-10 mb-4 animate-spin opacity-50" />
                        <p>Loading infographics...</p>
                    </div>
                ) : infographics.length === 0 ? (
                    <div className="h-[400px] border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30">
                        <Sparkles className="w-10 h-10 mb-4 opacity-50" />
                        <p>No infographics generated yet.</p>
                        <p className="text-sm">Select a material to visualize it.</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {infographics.map(ig => (
                            <motion.div
                                key={ig.id}
                                layoutId={ig.id}
                                className="group relative aspect-[3/4] bg-card-bg border border-card-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
                            >
                                <img
                                    src={ig.imageUrl}
                                    alt={ig.title}
                                    className="w-full h-full object-cover"
                                    onClick={() => setViewingInfographic(ig)}
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 pointer-events-none">
                                    <p className="text-white font-bold text-sm line-clamp-2">{ig.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {ig.sourceIndexes && ig.sourceIndexes.length > 0 && (
                                            <span className="text-xs px-2 py-0.5 bg-foreground/20 rounded-full text-white/80">
                                                From: {ig.sourceIndexes.map(i => `#${i}`).join(', ')}
                                            </span>
                                        )}
                                        <span className="text-white/60 text-xs">{new Date(ig.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeInfographic(ig.id);
                                    }}
                                    className="absolute top-2 right-2 p-2 rounded-full bg-black/40 text-white/70 hover:bg-red-500/80 hover:text-white transition-all pointer-events-auto"
                                    title="Delete Infographic"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {viewingInfographic && (
                    <OverlayViewer infographic={viewingInfographic} onClose={() => setViewingInfographic(null)} />
                )}
            </AnimatePresence>
        </div >
    );
}
