"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/context/PreferencesContext";
import { useGeneration } from "@/context/GenerationContext";
import { usePlayer } from "@/context/PlayerContext";
import { MaterialSelector } from "@/components/course/ui/MaterialSelector";
import { Music, Loader2, Sparkles, Play, Pause, Trash2 } from "lucide-react";
import { generateSong } from "@/app/actions";
import { v4 as uuidv4 } from "uuid";

type MusicalStyle = 'Electronic Pop' | 'Hip Hop' | 'Acoustic Folk' | 'Lo-fi Chill' | 'Rock Anthem' | 'Jazz Educational';

const MUSICAL_STYLES: { value: MusicalStyle; label: string }[] = [
    { value: 'Electronic Pop', label: 'Electronic Pop' },
    { value: 'Hip Hop', label: 'Hip Hop' },
    { value: 'Acoustic Folk', label: 'Acoustic Folk' },
    { value: 'Lo-fi Chill', label: 'Lo-fi Chill' },
    { value: 'Rock Anthem', label: 'Rock Anthem' },
    { value: 'Jazz Educational', label: 'Jazz Educational' },
];

interface Material {
    id: string;
    title: string;
    type: string;
}

export function SongsTab({ courseId }: { courseId: string }) {
    const supabase = createClient();
    const { playSound } = usePreferences();
    const { addTask, updateTask, tasks } = useGeneration();
    const { playTrack, currentTrack, isPlaying } = usePlayer();

    const [materials, setMaterials] = useState<Material[]>([]);
    const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
    const [songs, setSongs] = useState<any[]>([]);
    const [selectedStyle, setSelectedStyle] = useState<MusicalStyle>('Electronic Pop');

    // Check if a song generation is already running
    const activeSongTask = tasks.find(
        t => t.type === 'song' && t.courseId === courseId && (t.status === 'pending' || t.status === 'processing')
    );
    const isGenerating = !!activeSongTask;

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

    // Fetch songs
    useEffect(() => {
        const fetchSongs = async () => {
            const { data } = await supabase
                .from('generated_songs')
                .select('*')
                .eq('student_course_id', courseId)
                .order('created_at', { ascending: false });
            if (data) setSongs(data);
        };
        fetchSongs();
    }, [courseId, supabase]);

    // Poll for completion
    useEffect(() => {
        if (!activeSongTask) return;
        const interval = setInterval(async () => {
            const { data } = await supabase
                .from('generated_songs')
                .select('*')
                .eq('student_course_id', courseId)
                .order('created_at', { ascending: false });
            if (data && data.length > songs.length) {
                setSongs(data);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [activeSongTask, courseId, supabase, songs.length]);



    const getSourceIndex = (materialId: string) => {
        const idx = materials.findIndex(m => m.id === materialId);
        return idx !== -1 ? materials.length - idx : null;
    };

    const handleGenerate = async () => {
        if (selectedMaterialIds.length === 0) return;
        playSound('click');

        const taskId = uuidv4();
        const sourceIndexes = selectedMaterialIds.map(id => getSourceIndex(id)).filter(Boolean) as number[];

        addTask({
            id: taskId,
            type: 'song',
            status: 'processing',
            progress: 0,
            message: `Generating ${selectedStyle} song from #${sourceIndexes.join(', #')}...`,
            courseId,
        });

        try {
            const result = await generateSong(courseId, selectedStyle);

            if (result.success && result.data) {
                updateTask(taskId, {
                    status: 'completed',
                    progress: 100,
                    message: `"${result.data.title}" ready!`,
                });

                playTrack({
                    id: taskId,
                    title: result.data.title,
                    audioUrl: result.data.audioUrl,
                    coverUrl: result.data.coverUrl,
                    lyrics: (result.data as any).lyrics,
                    courseId,
                    style: selectedStyle,
                });

                const { data } = await supabase
                    .from('generated_songs')
                    .select('*')
                    .eq('student_course_id', courseId)
                    .order('created_at', { ascending: false });
                if (data) setSongs(data);
            } else {
                updateTask(taskId, {
                    status: 'failed',
                    message: result.error || 'Generation failed',
                });
            }
        } catch (error: any) {
            console.error(error);
            updateTask(taskId, {
                status: 'failed',
                message: error.message || 'Generation failed',
            });
        }
    };

    const handlePlaySong = (song: any) => {
        playSound('click');
        playTrack({
            id: song.id,
            title: song.title,
            audioUrl: song.audio_url,
            coverUrl: song.cover_url,
            lyrics: song.lyrics,
            courseId,
            style: song.style,
        });
    };

    const isCurrentlyPlaying = (song: any) => {
        return currentTrack?.audioUrl === song.audio_url && isPlaying;
    };

    const deleteSong = async (id: string) => {
        const { error } = await supabase.from('generated_songs').delete().eq('id', id);
        if (!error) {
            setSongs(prev => prev.filter(s => s.id !== id));
            // If the deleted song was playing, we might want to stop it or let it finish.
            // For now, let's leave it playing or handle it if needed.
        }
    };

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

                {/* Style Selector */}
                <div className="bg-card-bg border border-card-border rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-foreground/70 mb-3 flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Musical Style
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {MUSICAL_STYLES.map((style) => (
                            <button
                                key={style.value}
                                onClick={() => { setSelectedStyle(style.value); playSound('click'); }}
                                disabled={isGenerating}
                                className={`p-3 rounded-xl text-left transition-all border text-sm ${selectedStyle === style.value
                                    ? 'bg-primary/10 border-primary/50 text-foreground'
                                    : 'bg-card-bg border-card-border text-foreground/60 hover:bg-foreground/5'
                                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="font-medium">{style.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || selectedMaterialIds.length === 0}
                    className="w-full py-4 rounded-2xl bg-foreground text-background font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating... (2-5 mins)
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Generate Song
                        </>
                    )}
                </button>

                {isGenerating && (
                    <p className="text-xs text-foreground/40 text-center">
                        You can switch tabs - generation continues in the background.
                    </p>
                )}
            </div>

            {/* RIGHT: Generated Songs */}
            <div className="lg:col-span-2">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80">
                    <Music className="w-5 h-5" />
                    Generated Songs
                </h3>

                {songs.length === 0 ? (
                    <div className="h-[400px] border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30">
                        <Music className="w-10 h-10 mb-4 opacity-50" />
                        <p>No songs generated yet.</p>
                        <p className="text-sm">Select materials and generate your first song.</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {songs.map((song) => (
                            <div
                                key={song.id}
                                className={`p-4 rounded-2xl text-left transition-all flex items-center gap-4 border ${currentTrack?.audioUrl === song.audio_url
                                    ? 'bg-primary/10 border-primary/30'
                                    : 'bg-card-bg border-card-border hover:bg-foreground/5'
                                    }`}
                            >
                                <button
                                    onClick={() => handlePlaySong(song)}
                                    className="flex items-center gap-4 flex-1 min-w-0"
                                >
                                    {song.cover_url ? (
                                        <img src={song.cover_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-foreground/10 flex items-center justify-center">
                                            <Music className="w-6 h-6 text-foreground/40" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">{song.title}</p>
                                        <p className="text-sm text-foreground/40">{song.style}</p>
                                        {song.source_indexes && song.source_indexes.length > 0 && (
                                            <p className="text-xs text-foreground/30 mt-1">
                                                From: {song.source_indexes.map((i: number) => `#${i}`).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                    {isCurrentlyPlaying(song) ? (
                                        <Pause className="w-5 h-5 text-primary shrink-0" />
                                    ) : (
                                        <Play className="w-5 h-5 text-foreground/40 shrink-0" />
                                    )}
                                </button>
                                {/* Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSong(song.id);
                                    }}
                                    className="p-2 rounded-lg text-foreground/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Delete Song"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
