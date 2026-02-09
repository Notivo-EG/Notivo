"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { VIDEO_API_URL } from "@/lib/videoApi";
import { useGeneration } from "@/context/GenerationContext";
import { MaterialSelector } from "@/components/course/ui/MaterialSelector";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import {
    Video, Loader2, Play, Trash2, Download,
    Clock, Settings2
} from "lucide-react";
import { CustomVideoPlayer } from "@/components/ui/CustomVideoPlayer";

interface VideoTutorTabProps {
    courseId: string;
}

interface GeneratedVideo {
    id: string;
    job_id: string;
    title: string;
    video_url: string;
    config: any;
    source_materials: any[];
    status: string;
    created_at: string;
}

interface Material {
    id: string;
    title: string;
    type: string;
}

type Stage = 'analyzing' | 'generating_script' | 'generating_audio' | 'generating_manim' | 'rendering' | 'composing';

export function VideoTutorTab({ courseId }: VideoTutorTabProps) {
    const supabase = createClient();
    const { addTask, updateTask, tasks } = useGeneration();

    const [materials, setMaterials] = useState<Material[]>([]);
    const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
    const [videoHistory, setVideoHistory] = useState<GeneratedVideo[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);

    // Config
    const [voice, setVoice] = useState("Charon");
    const [voiceStyle, setVoiceStyle] = useState("educational");
    const [detailLevel, setDetailLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [maxDuration, setMaxDuration] = useState(180);
    const [showConfig, setShowConfig] = useState(false);

    // Generation state
    const [localProgress, setLocalProgress] = useState({ percent: 0, message: '' });
    const [currentStage, setCurrentStage] = useState<Stage | null>(null);
    const [completedStages, setCompletedStages] = useState<Stage[]>([]);
    const [, setJobId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const activeTask = tasks.find(
        t => t.type === 'video' && t.courseId === courseId && (t.status === 'pending' || t.status === 'processing')
    );
    const isGenerating = !!activeTask;

    // Fetch materials
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

    // Fetch video history
    useEffect(() => {
        fetchVideoHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    const fetchVideoHistory = async () => {
        const { data } = await supabase
            .from('generated_videos')
            .select('*')
            .eq('student_course_id', courseId)
            .order('created_at', { ascending: false });
        if (data) setVideoHistory(data);
    };



    const getSourceIndex = (materialId: string) => {
        const idx = materials.findIndex(m => m.id === materialId);
        return idx !== -1 ? materials.length - idx : null;
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const saveVideoToDatabase = async (jobId: string, materialTitles: string[], sourceIndexes: number[], videoUrl?: string) => {
        const finalUrl = videoUrl || `${VIDEO_API_URL}/api/video/${jobId}`;
        const { data } = await supabase
            .from('generated_videos')
            .insert({
                student_course_id: courseId,
                job_id: jobId,
                title: `Video - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                video_url: finalUrl,
                status: 'completed',
                config: { voice, voiceStyle, detailLevel, maxDuration },
                source_materials: materialTitles.map((title, i) => ({ title, index: sourceIndexes[i] }))
            })
            .select()
            .single();
        if (data) setVideoHistory(prev => [data, ...prev]);
        return data;
    };

    const deleteVideo = async (videoId: string) => {
        await supabase.from('generated_videos').delete().eq('id', videoId);
        setVideoHistory(prev => prev.filter(v => v.id !== videoId));
        if (selectedVideo?.id === videoId) setSelectedVideo(null);
    };

    const startGeneration = async () => {
        if (selectedMaterialIds.length === 0) return;

        const taskId = uuidv4();
        const sourceIndexes = selectedMaterialIds.map(id => getSourceIndex(id)).filter(Boolean) as number[];

        setError(null);
        setCurrentStage(null);
        setCompletedStages([]);
        setSelectedVideo(null);

        addTask({
            id: taskId,
            type: 'video',
            status: 'processing',
            progress: 0,
            message: `Generating video from #${sourceIndexes.join(', #')}...`,
            courseId,
        });

        try {
            setLocalProgress({ percent: 5, message: 'Fetching materials...' });
            updateTask(taskId, { progress: 5, message: 'Fetching materials...' });

            const { data: materialsData } = await supabase
                .from('course_materials')
                .select('id, title, content_url, type')
                .in('id', selectedMaterialIds);

            if (!materialsData) throw new Error('Failed to fetch materials');

            const materialTitles = materialsData.map(m => m.title);
            setLocalProgress({ percent: 15, message: 'Downloading files...' });
            updateTask(taskId, { progress: 15, message: 'Downloading files...' });

            const filesData = await Promise.all(
                materialsData.map(async (m) => {
                    const response = await fetch(m.content_url);
                    const blob = await response.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                    return {
                        filename: m.title.endsWith('.pdf') ? m.title : `${m.title}.pdf`,
                        content: base64,
                        base64: true,
                        mimeType: 'application/pdf'
                    };
                })
            );

            setLocalProgress({ percent: 25, message: 'Starting video generation...' });
            updateTask(taskId, { progress: 25, message: 'Starting video generation...' });

            const response = await fetch(`${VIDEO_API_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: filesData,
                    config: { voice, voice_style: voiceStyle, detail_level: detailLevel, max_duration: maxDuration, native_analysis: true }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to start generation');
            }

            const data = await response.json();
            setJobId(data.job_id);
            startProgressStream(data.job_id, taskId, materialTitles, sourceIndexes);

        } catch (e: any) {
            setError(e.message);
            updateTask(taskId, { status: 'failed', message: e.message || 'Generation failed' });
        }
    };

    const startProgressStream = (id: string, taskId: string, materialTitles: string[], sourceIndexes: number[]) => {
        if (eventSourceRef.current) eventSourceRef.current.close();

        const eventSource = new EventSource(`${VIDEO_API_URL}/api/status/stream/${id}`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                setError(data.error);
                updateTask(taskId, { status: 'failed', message: data.error });
                eventSource.close();
                return;
            }

            const progressData = data.progress || {};
            const percent = progressData.percent || 0;
            const message = progressData.message || data.status || 'Processing...';
            setLocalProgress({ percent, message });
            updateTask(taskId, { progress: percent, message });

            const stageOrder: Stage[] = ['analyzing', 'generating_script', 'generating_audio', 'generating_manim', 'rendering', 'composing'];
            const currentIndex = stageOrder.indexOf(data.status);
            if (currentIndex >= 0) {
                setCurrentStage(data.status);
                setCompletedStages(stageOrder.slice(0, currentIndex));
            }

            if (data.finished) {
                eventSource.close();
                if (data.status === 'completed') {
                    updateTask(taskId, { status: 'completed', progress: 100, message: 'Video ready!' });
                    // Prefer Supabase video_url when deployed to Cloud Run
                    await saveVideoToDatabase(id, materialTitles, sourceIndexes, data.video_url);
                } else if (data.status === 'failed') {
                    setError(data.error || 'Video generation failed');
                    updateTask(taskId, { status: 'failed', message: data.error || 'Generation failed' });
                }
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
        };
    };

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
    }, []);

    const stages: { id: Stage; label: string }[] = [
        { id: 'analyzing', label: 'Analyzing' },
        { id: 'generating_script', label: 'Script' },
        { id: 'generating_audio', label: 'Audio' },
        { id: 'generating_manim', label: 'Animation' },
        { id: 'rendering', label: 'Rendering' },
        { id: 'composing', label: 'Composing' },
    ];

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT: Material Selection & Generate */}
            <div className="lg:col-span-1 space-y-6">
                {/* Material Selector */}
                <div className="bg-card-bg border border-card-border rounded-2xl p-6">
                    <MaterialSelector
                        courseId={courseId}
                        selectedIds={selectedMaterialIds}
                        onSelectionChange={setSelectedMaterialIds}
                        multiSelect={true}
                    />
                </div>

                {/* Config Toggle */}
                <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="w-full flex items-center justify-between p-4 bg-card-bg border border-card-border rounded-2xl text-sm text-foreground/70 hover:bg-foreground/5 transition-all"
                >
                    <span className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4" />
                        Configuration
                    </span>
                    <span className="text-xs text-foreground/40">{showConfig ? 'Hide' : 'Show'}</span>
                </button>

                {/* Config Panel */}
                {showConfig && (
                    <div className="bg-card-bg border border-card-border rounded-2xl p-6 space-y-4">
                        <div>
                            <label className="text-xs text-foreground/50 mb-1 block">Voice</label>
                            <select value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full p-2 bg-foreground/5 border border-card-border rounded-lg text-sm text-foreground">
                                <option value="Charon">Charon - Smooth</option>
                                <option value="Alnilam">Alnilam - Energetic</option>
                                <option value="Fenrir">Fenrir - Bold</option>
                                <option value="Kore">Kore - Energetic (F)</option>
                                <option value="Aoede">Aoede - Clear (F)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-foreground/50 mb-1 block">Style</label>
                            <select value={voiceStyle} onChange={(e) => setVoiceStyle(e.target.value)} className="w-full p-2 bg-foreground/5 border border-card-border rounded-lg text-sm text-foreground">
                                <option value="educational">Educational</option>
                                <option value="excited">Excited</option>
                                <option value="calm">Calm</option>
                                <option value="professional">Professional</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-foreground/50 mb-1 block">Detail Level</label>
                            <div className="flex gap-2">
                                {['low', 'medium', 'high'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setDetailLevel(level as any)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${detailLevel === level
                                            ? 'bg-primary/10 border-primary/50 text-foreground'
                                            : 'bg-foreground/5 border-card-border text-foreground/50 hover:bg-foreground/10'
                                            }`}
                                    >
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-foreground/50 mb-1 block">Max Duration: {formatDuration(maxDuration)}</label>
                            <input
                                type="range"
                                min="60"
                                max="600"
                                step="30"
                                value={maxDuration}
                                onChange={(e) => setMaxDuration(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}

                {/* Generate Button */}
                <button
                    onClick={startGeneration}
                    disabled={isGenerating || selectedMaterialIds.length === 0}
                    className="w-full py-4 rounded-2xl bg-foreground text-background font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Video className="w-5 h-5" />
                            Generate Video
                        </>
                    )}
                </button>

                {/* Progress Info */}
                {isGenerating && (
                    <div className="bg-card-bg border border-card-border rounded-2xl p-4 space-y-3">
                        <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${localProgress.percent}%` }}
                            />
                        </div>
                        <p className="text-xs text-foreground/60 text-center">{localProgress.message}</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {stages.map((stage) => (
                                <span
                                    key={stage.id}
                                    className={`text-xs px-2 py-1 rounded-full ${completedStages.includes(stage.id)
                                        ? 'bg-green-500/20 text-green-400'
                                        : currentStage === stage.id
                                            ? 'bg-primary/20 text-primary animate-pulse'
                                            : 'bg-foreground/10 text-foreground/40'
                                        }`}
                                >
                                    {stage.label}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-foreground/40 text-center">
                            You can switch tabs - generation continues in the background.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}
            </div>

            {/* RIGHT: Video History */}
            <div className="lg:col-span-2">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80">
                    <Video className="w-5 h-5" />
                    Generated Videos
                </h3>

                {/* Selected Video Player */}
                {selectedVideo && (
                    <div className="mb-6 bg-card-bg border border-card-border rounded-2xl overflow-hidden shadow-lg p-2">
                        <CustomVideoPlayer
                            src={selectedVideo.video_url}
                            title={selectedVideo.title}
                            autoplay
                        />
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-foreground">{selectedVideo.title}</p>
                                <p className="text-xs text-foreground/40">
                                    {new Date(selectedVideo.created_at).toLocaleString()}
                                    {selectedVideo.source_materials && selectedVideo.source_materials.length > 0 && (
                                        <span className="ml-2">
                                            From: {selectedVideo.source_materials.map((s: any) => s.index ? `#${s.index}` : s.title?.slice(0, 10)).join(', ')}
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={selectedVideo.video_url}
                                    download
                                    className="p-2 bg-foreground/10 rounded-lg hover:bg-foreground/20 transition-all"
                                >
                                    <Download className="w-4 h-4 text-foreground/60" />
                                </a>
                                <button
                                    onClick={() => setSelectedVideo(null)}
                                    className="p-2 bg-foreground/10 rounded-lg hover:bg-foreground/20 transition-all text-foreground/60 text-xs"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {videoHistory.length === 0 ? (
                    <div className="h-[400px] border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30">
                        <Video className="w-10 h-10 mb-4 opacity-50" />
                        <p>No videos generated yet.</p>
                        <p className="text-sm">Select materials and generate your first video.</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {videoHistory.map((video) => (
                            <div
                                key={video.id}
                                className={`bg-card-bg border rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-primary/50 ${selectedVideo?.id === video.id ? 'border-primary' : 'border-card-border'}`}
                            >
                                <div
                                    onClick={() => setSelectedVideo(video)}
                                    className="aspect-video bg-foreground/5 flex items-center justify-center"
                                >
                                    <Play className="w-10 h-10 text-foreground/20" />
                                </div>
                                <div className="p-4">
                                    <p className="font-medium text-foreground text-sm truncate">{video.title}</p>
                                    <p className="text-xs text-foreground/40 flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(video.created_at).toLocaleDateString()}
                                    </p>
                                    {video.source_materials && video.source_materials.length > 0 && (
                                        <p className="text-xs text-foreground/30 mt-1">
                                            From: {video.source_materials.map((s: any) => s.index ? `#${s.index}` : s.title?.slice(0, 10)).join(', ')}
                                        </p>
                                    )}
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => setSelectedVideo(video)}
                                            className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all flex items-center justify-center gap-1"
                                        >
                                            <Play className="w-3 h-3" /> Play
                                        </button>
                                        <button
                                            onClick={() => deleteVideo(video.id)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
