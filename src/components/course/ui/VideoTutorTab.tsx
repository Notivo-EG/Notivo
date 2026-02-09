"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MaterialSelector } from "./MaterialSelector";
import { VIDEO_API_URL } from "@/lib/videoApi";
import { PlayCircle, Download, Trash2, Clock } from "lucide-react";

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

type Status = 'idle' | 'uploading' | 'generating' | 'completed' | 'error';
type Stage = 'analyzing' | 'generating_script' | 'generating_audio' | 'generating_manim' | 'rendering' | 'composing';

export function VideoTutorTab({ courseId }: VideoTutorTabProps) {
    const supabase = createClient();

    // State
    const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
    const [jobId, setJobId] = useState<string | null>(null);
    const [status, setStatus] = useState<Status>('idle');
    const [progress, setProgress] = useState({ percent: 0, message: 'Initializing...' });
    const [currentStage, setCurrentStage] = useState<Stage | null>(null);
    const [completedStages, setCompletedStages] = useState<Stage[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Video History
    const [videoHistory, setVideoHistory] = useState<GeneratedVideo[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);

    // Configuration State
    const [voice, setVoice] = useState("Charon");
    const [voiceStyle, setVoiceStyle] = useState("educational");
    const [detailLevel, setDetailLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [maxDuration, setMaxDuration] = useState(180);
    const [nativeAnalysis, setNativeAnalysis] = useState(true);

    const eventSourceRef = useRef<EventSource | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Fetch video history on mount
    useEffect(() => {
        fetchVideoHistory();
    }, [courseId]);

    const fetchVideoHistory = async () => {
        console.log('Fetching video history for courseId:', courseId);
        const { data, error } = await supabase
            .from('generated_videos')
            .select('*')
            .eq('student_course_id', courseId)
            .order('created_at', { ascending: false });

        console.log('Video history result:', { data, error });

        if (error) {
            console.error('Error fetching video history:', error);
        }

        if (data) {
            setVideoHistory(data);
        }
    };

    // Format duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get MIME type from filename
    const getMimeType = (filename: string) => {
        const ext = filename.toLowerCase().split('.').pop();
        const mimeTypes: Record<string, string> = {
            'pdf': 'application/pdf',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg'
        };
        return mimeTypes[ext || ''] || 'application/octet-stream';
    };

    // Save video to database
    const saveVideoToDatabase = async (jobId: string, materialTitles: string[]) => {
        const videoUrl = `${VIDEO_API_URL}/api/video/${jobId}`;

        const { data, error } = await supabase
            .from('generated_videos')
            .insert({
                student_course_id: courseId,
                job_id: jobId,
                title: `Video - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                video_url: videoUrl,
                status: 'completed',
                config: { voice, voiceStyle, detailLevel, maxDuration },
                source_materials: materialTitles.map(title => ({ title }))
            })
            .select()
            .single();

        if (data) {
            setVideoHistory(prev => [data, ...prev]);
        }

        return data;
    };

    // Delete video
    const deleteVideo = async (videoId: string) => {
        const { error } = await supabase
            .from('generated_videos')
            .delete()
            .eq('id', videoId);

        if (!error) {
            setVideoHistory(prev => prev.filter(v => v.id !== videoId));
            if (selectedVideo?.id === videoId) {
                setSelectedVideo(null);
            }
        }
    };

    // Start generation
    const startGeneration = async () => {
        if (selectedMaterialIds.length === 0) return;

        setStatus('uploading');
        setError(null);
        setProgress({ percent: 0, message: 'Fetching materials from knowledge base...' });
        setCurrentStage(null);
        setCompletedStages([]);
        setSelectedVideo(null);

        try {
            // 1. Fetch materials from Supabase
            const { data: materials, error: fetchError } = await supabase
                .from('course_materials')
                .select('id, title, content_url, type')
                .in('id', selectedMaterialIds);

            if (fetchError || !materials) {
                throw new Error('Failed to fetch materials from knowledge base');
            }

            const materialTitles = materials.map(m => m.title);

            setProgress({ percent: 10, message: 'Downloading files...' });

            // 2. Download each file and convert to base64
            const filesData = await Promise.all(
                materials.map(async (m) => {
                    const response = await fetch(m.content_url);
                    const blob = await response.blob();
                    const arrayBuffer = await blob.arrayBuffer();

                    const base64 = btoa(
                        new Uint8Array(arrayBuffer)
                            .reduce((data, byte) => data + String.fromCharCode(byte), '')
                    );

                    return {
                        filename: m.title.endsWith('.pdf') ? m.title : `${m.title}.pdf`,
                        content: base64,
                        base64: true,
                        mimeType: getMimeType(m.title) || 'application/pdf'
                    };
                })
            );

            setProgress({ percent: 20, message: 'Starting video generation...' });
            setStatus('generating');

            // 3. Send to Flask API
            const response = await fetch(`${VIDEO_API_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: filesData,
                    config: {
                        voice,
                        voice_style: voiceStyle,
                        detail_level: detailLevel,
                        max_duration: maxDuration,
                        native_analysis: nativeAnalysis
                    }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to start generation');
            }

            const data = await response.json();
            setJobId(data.job_id);

            // Start SSE for progress updates
            startProgressStream(data.job_id, materialTitles);

        } catch (e: any) {
            setStatus('error');
            setError(e.message);
        }
    };

    // Start SSE stream
    const startProgressStream = (id: string, materialTitles: string[]) => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const eventSource = new EventSource(`${VIDEO_API_URL}/api/status/stream/${id}`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                setStatus('error');
                setError(data.error);
                eventSource.close();
                return;
            }

            updateProgress(data);

            if (data.finished) {
                eventSource.close();
                if (data.status === 'completed') {
                    setStatus('completed');
                    // Save to database
                    await saveVideoToDatabase(id, materialTitles);
                } else if (data.status === 'failed') {
                    setStatus('error');
                    setError(data.error || 'Video generation failed');
                }
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
            pollStatus(id, materialTitles);
        };
    };

    // Fallback polling
    const pollStatus = async (id: string, materialTitles: string[]) => {
        const poll = async () => {
            try {
                const response = await fetch(`${VIDEO_API_URL}/api/jobs/${id}`);
                const data = await response.json();

                updateProgress(data);

                if (data.status === 'completed') {
                    setStatus('completed');
                    await saveVideoToDatabase(id, materialTitles);
                } else if (data.status === 'failed' || data.status === 'cancelled') {
                    setStatus('error');
                    setError(data.error || 'Video generation failed');
                } else {
                    setTimeout(poll, 1000);
                }
            } catch {
                setStatus('error');
                setError('Lost connection to server');
            }
        };
        poll();
    };

    // Update progress UI
    const updateProgress = (data: any) => {
        const progressData = data.progress || {};
        setProgress({
            percent: progressData.percent || 0,
            message: progressData.message || data.status || 'Processing...'
        });

        const stageOrder: Stage[] = [
            'analyzing', 'generating_script', 'generating_audio',
            'generating_manim', 'rendering', 'composing'
        ];

        const currentIndex = stageOrder.indexOf(data.status);
        if (currentIndex >= 0) {
            setCurrentStage(data.status);
            setCompletedStages(stageOrder.slice(0, currentIndex));
        }
    };

    // Download video
    const downloadVideo = (url: string, jobId: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `video_${jobId.slice(0, 8)}.mp4`;
        link.click();
    };

    // Reset app
    const resetApp = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        setSelectedMaterialIds([]);
        setJobId(null);
        setStatus('idle');
        setProgress({ percent: 0, message: 'Initializing...' });
        setCurrentStage(null);
        setCompletedStages([]);
        setError(null);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    const stages: { id: Stage; label: string; icon: string }[] = [
        { id: 'analyzing', label: 'Analyzing', icon: '📊' },
        { id: 'generating_script', label: 'Script', icon: '📝' },
        { id: 'generating_audio', label: 'Audio', icon: '🔊' },
        { id: 'generating_manim', label: 'Animation', icon: '🎨' },
        { id: 'rendering', label: 'Rendering', icon: '🎬' },
        { id: 'composing', label: 'Composing', icon: '✂️' },
    ];

    // Current video to display (either from generation or selected from history)
    const currentVideoUrl = selectedVideo?.video_url || (status === 'completed' && jobId ? `${VIDEO_API_URL}/api/video/${jobId}` : null);

    return (
        <div className="video-generator-app">
            <style jsx global>{`
                .video-generator-app {
                    --bg-primary: #0a0a0f;
                    --bg-secondary: #12121a;
                    --bg-card: rgba(25, 25, 35, 0.8);
                    --text-primary: #ffffff;
                    --text-secondary: #a0a0b0;
                    --accent-primary: #6366f1;
                    --accent-secondary: #8b5cf6;
                    --accent-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
                    --success: #10b981;
                    --error: #ef4444;
                    --border-color: rgba(255, 255, 255, 0.1);
                    --shadow-color: rgba(99, 102, 241, 0.2);
                    --glass-blur: 20px;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    color: var(--text-primary);
                    line-height: 1.6;
                }

                .video-generator-app .glass-card {
                    background: var(--bg-card);
                    backdrop-filter: blur(var(--glass-blur));
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    margin-bottom: 24px;
                }

                .video-generator-app .section-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 16px;
                    color: var(--text-primary);
                }

                .video-generator-app .config-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                }

                @media (max-width: 600px) {
                    .video-generator-app .config-grid { grid-template-columns: 1fr; }
                }

                .video-generator-app .config-item label {
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 8px;
                    color: var(--text-secondary);
                }

                .video-generator-app .config-item select {
                    width: 100%;
                    padding: 12px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-size: 14px;
                }

                .video-generator-app .slider-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .video-generator-app .slider-container input[type="range"] {
                    flex: 1;
                    -webkit-appearance: none;
                    height: 6px;
                    background: var(--bg-secondary);
                    border-radius: 3px;
                }

                .video-generator-app .slider-container input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    background: var(--accent-gradient);
                    border-radius: 50%;
                }

                .video-generator-app .slider-container span {
                    min-width: 45px;
                    font-size: 14px;
                    color: var(--accent-primary);
                    font-weight: 600;
                }

                .video-generator-app .radio-group {
                    display: flex;
                    gap: 16px;
                }

                .video-generator-app .radio-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    font-size: 14px;
                }

                .video-generator-app .radio-label input[type="radio"] {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    border: 2px solid var(--border-color);
                    border-radius: 50%;
                }

                .video-generator-app .radio-label input[type="radio"]:checked {
                    border-color: var(--accent-primary);
                    background: var(--accent-primary);
                    box-shadow: inset 0 0 0 3px var(--bg-primary);
                }

                .video-generator-app .toggle-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .video-generator-app .toggle-switch {
                    position: relative;
                    width: 50px;
                    height: 26px;
                }

                .video-generator-app .toggle-switch input { opacity: 0; width: 0; height: 0; }

                .video-generator-app .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    inset: 0;
                    background-color: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 26px;
                    transition: all 0.3s;
                }

                .video-generator-app .toggle-slider::before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: var(--text-secondary);
                    border-radius: 50%;
                    transition: all 0.3s;
                }

                .video-generator-app .toggle-switch input:checked + .toggle-slider {
                    background: var(--accent-gradient);
                    border-color: var(--accent-primary);
                }

                .video-generator-app .toggle-switch input:checked + .toggle-slider::before {
                    transform: translateX(24px);
                    background-color: white;
                }

                .video-generator-app .toggle-label { font-size: 13px; color: var(--text-secondary); }
                .video-generator-app .config-item label .hint { display: block; font-size: 11px; opacity: 0.7; margin-top: 2px; }

                .video-generator-app .generate-btn {
                    width: 100%;
                    padding: 16px 24px;
                    background: var(--accent-gradient);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.3s;
                }

                .video-generator-app .generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .video-generator-app .generate-btn.loading .btn-icon { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                .video-generator-app .progress-bar-container {
                    width: 100%;
                    height: 8px;
                    background: var(--bg-secondary);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 16px;
                }

                .video-generator-app .progress-bar {
                    height: 100%;
                    background: var(--accent-gradient);
                    border-radius: 4px;
                    transition: width 0.3s;
                }

                .video-generator-app .progress-text { text-align: center; color: var(--text-secondary); margin-bottom: 20px; }

                .video-generator-app .progress-stages {
                    display: flex;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .video-generator-app .stage {
                    padding: 8px 12px;
                    background: var(--bg-secondary);
                    border-radius: 20px;
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .video-generator-app .stage.active {
                    background: rgba(99, 102, 241, 0.3);
                    color: var(--accent-primary);
                    animation: stagePulse 1.5s infinite;
                }

                .video-generator-app .stage.completed {
                    background: rgba(16, 185, 129, 0.2);
                    color: var(--success);
                }

                @keyframes stagePulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
                    50% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
                }

                .video-generator-app .video-container {
                    width: 100%;
                    border-radius: 12px;
                    overflow: hidden;
                    margin-bottom: 20px;
                    background: var(--bg-secondary);
                }

                .video-generator-app .video-container video { width: 100%; display: block; }

                .video-generator-app .result-actions { display: flex; gap: 12px; }

                .video-generator-app .download-btn, .video-generator-app .new-btn, .video-generator-app .retry-btn {
                    flex: 1;
                    padding: 14px 20px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }

                .video-generator-app .download-btn { background: var(--success); color: white; border: none; }
                .video-generator-app .new-btn { background: transparent; color: var(--text-primary); border: 1px solid var(--border-color); }
                .video-generator-app .retry-btn { background: var(--accent-primary); color: white; border: none; width: 100%; }

                .video-generator-app .error-section { border-color: var(--error); }
                .video-generator-app .error-section h2 { color: var(--error); }
                .video-generator-app .error-message { color: var(--text-secondary); margin-bottom: 16px; font-size: 14px; }

                .video-generator-app .video-history-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 16px;
                }

                .video-generator-app .video-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .video-generator-app .video-card:hover {
                    border-color: var(--accent-primary);
                    transform: translateY(-2px);
                }

                .video-generator-app .video-card.selected {
                    border-color: var(--accent-primary);
                    box-shadow: 0 0 0 2px var(--accent-primary);
                }

                .video-generator-app .video-card-preview {
                    aspect-ratio: 16/9;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .video-generator-app .video-card-info {
                    padding: 12px;
                }

                .video-generator-app .video-card-title {
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .video-generator-app .video-card-date {
                    font-size: 12px;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .video-generator-app .video-card-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 8px;
                }

                .video-generator-app .video-card-actions button {
                    flex: 1;
                    padding: 6px;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    gap: 4px;
                }

                .video-generator-app .video-card-actions .play-btn {
                    background: var(--accent-primary);
                    color: white;
                }

                .video-generator-app .video-card-actions .delete-btn {
                    background: rgba(239, 68, 68, 0.2);
                    color: var(--error);
                }
            `}</style>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* LEFT COLUMN: Controls */}
                <div>
                    {/* Material Selection */}
                    <section className="glass-card">
                        <h2 className="section-title">📚 Select Source Materials</h2>
                        <MaterialSelector
                            courseId={courseId}
                            selectedIds={selectedMaterialIds}
                            onSelectionChange={setSelectedMaterialIds}
                        />
                    </section>

                    {/* Configuration */}
                    <section className="glass-card">
                        <h2 className="section-title">⚙️ Configuration</h2>
                        <div className="config-grid">
                            <div className="config-item">
                                <label>Voice</label>
                                <select value={voice} onChange={(e) => setVoice(e.target.value)}>
                                    <optgroup label="Male Voices">
                                        <option value="Charon">Charon - Smooth, Rich</option>
                                        <option value="Alnilam">Alnilam - Energetic</option>
                                        <option value="Fenrir">Fenrir - Strong, Bold</option>
                                    </optgroup>
                                    <optgroup label="Female Voices">
                                        <option value="Kore">Kore - Energetic</option>
                                        <option value="Aoede">Aoede - Clear</option>
                                        <option value="Zephyr">Zephyr - Light</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div className="config-item">
                                <label>Style</label>
                                <select value={voiceStyle} onChange={(e) => setVoiceStyle(e.target.value)}>
                                    <option value="educational">Educational</option>
                                    <option value="excited">Excited</option>
                                    <option value="calm">Calm</option>
                                    <option value="professional">Professional</option>
                                </select>
                            </div>
                            <div className="config-item">
                                <label>Detail Level</label>
                                <div className="radio-group">
                                    {['low', 'medium', 'high'].map(level => (
                                        <label key={level} className="radio-label">
                                            <input
                                                type="radio"
                                                name="detail"
                                                checked={detailLevel === level}
                                                onChange={() => setDetailLevel(level as any)}
                                            />
                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="config-item">
                                <label>Max Duration</label>
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        min="60"
                                        max="600"
                                        step="30"
                                        value={maxDuration}
                                        onChange={(e) => setMaxDuration(parseInt(e.target.value))}
                                    />
                                    <span>{formatDuration(maxDuration)}</span>
                                </div>
                            </div>
                            <div className="config-item">
                                <label>
                                    Native Analysis
                                    <span className="hint">AI sees images in PDFs</span>
                                </label>
                                <div className="toggle-container">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={nativeAnalysis}
                                            onChange={() => setNativeAnalysis(!nativeAnalysis)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="toggle-label">{nativeAnalysis ? 'ON' : 'OFF'}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Generate Button */}
                    <button
                        className={`generate-btn ${status === 'uploading' || status === 'generating' ? 'loading' : ''}`}
                        onClick={startGeneration}
                        disabled={selectedMaterialIds.length === 0 || status === 'uploading' || status === 'generating'}
                    >
                        <span className="btn-icon">✨</span>
                        {status === 'uploading' ? 'Preparing...' : status === 'generating' ? 'Generating...' : 'Generate Video'}
                    </button>

                    {/* Progress */}
                    {(status === 'uploading' || status === 'generating') && (
                        <section className="glass-card" style={{ marginTop: '24px' }}>
                            <h2 className="section-title">Generation Progress</h2>
                            <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${progress.percent}%` }}></div>
                            </div>
                            <p className="progress-text">{progress.message}</p>
                            <div className="progress-stages">
                                {stages.map((stage) => (
                                    <div
                                        key={stage.id}
                                        className={`stage ${currentStage === stage.id ? 'active' : ''} ${completedStages.includes(stage.id) ? 'completed' : ''}`}
                                    >
                                        {stage.icon} {stage.label}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Error */}
                    {status === 'error' && (
                        <section className="glass-card error-section" style={{ marginTop: '24px' }}>
                            <h2 className="section-title">❌ Error</h2>
                            <p className="error-message">{error}</p>
                            <button className="retry-btn" onClick={resetApp}>Try Again</button>
                        </section>
                    )}
                </div>

                {/* RIGHT COLUMN: Video Player & History */}
                <div>
                    {/* Video Player */}
                    {currentVideoUrl && (
                        <section className="glass-card">
                            <h2 className="section-title">🎬 {selectedVideo ? selectedVideo.title : 'Latest Video'}</h2>
                            <div className="video-container">
                                <video key={currentVideoUrl} controls autoPlay={status === 'completed'}>
                                    <source src={currentVideoUrl} type="video/mp4" />
                                </video>
                            </div>
                            <div className="result-actions">
                                <button className="download-btn" onClick={() => downloadVideo(currentVideoUrl, selectedVideo?.job_id || jobId || '')}>
                                    <Download size={16} /> Download
                                </button>
                                <button className="new-btn" onClick={resetApp}>
                                    🔄 New Video
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Video History */}
                    <section className="glass-card">
                        <h2 className="section-title">📼 Video Library ({videoHistory.length})</h2>
                        {videoHistory.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0' }}>
                                No videos generated yet. Create your first video above!
                            </p>
                        ) : (
                            <div className="video-history-grid">
                                {videoHistory.map((video) => (
                                    <div
                                        key={video.id}
                                        className={`video-card ${selectedVideo?.id === video.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedVideo(video)}
                                    >
                                        <div className="video-card-preview">
                                            <PlayCircle size={32} style={{ opacity: 0.5 }} />
                                        </div>
                                        <div className="video-card-info">
                                            <div className="video-card-title">{video.title}</div>
                                            <div className="video-card-date">
                                                <Clock size={12} />
                                                {new Date(video.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="video-card-actions">
                                                <button
                                                    className="play-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedVideo(video);
                                                    }}
                                                >
                                                    <PlayCircle size={14} /> Play
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteVideo(video.id);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
