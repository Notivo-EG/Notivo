"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/context/PreferencesContext";
import { Music, Loader2, Sparkles, PlayCircle, Play } from "lucide-react";
import { motion } from "framer-motion";
import { generateSong } from "@/app/actions";

type MusicalStyle = 'Electronic Pop' | 'Hip Hop' | 'Acoustic Folk' | 'Lo-fi Chill' | 'Rock Anthem' | 'Jazz Educational';

const MUSICAL_STYLES: { value: MusicalStyle; label: string; emoji: string }[] = [
    { value: 'Electronic Pop', label: 'Electronic Pop', emoji: '🎹' },
    { value: 'Hip Hop', label: 'Hip Hop', emoji: '🎤' },
    { value: 'Acoustic Folk', label: 'Acoustic Folk', emoji: '🎸' },
    { value: 'Lo-fi Chill', label: 'Lo-fi Chill', emoji: '🎧' },
    { value: 'Rock Anthem', label: 'Rock Anthem', emoji: '🎸' },
    { value: 'Jazz Educational', label: 'Jazz Educational', emoji: '🎷' },
];

export function SongsTab({ courseId }: { courseId: string }) {
    const supabase = createClient();
    const { playSound } = usePreferences();
    const [songs, setSongs] = useState<any[]>([]);
    const [selectedStyle, setSelectedStyle] = useState<MusicalStyle>('Electronic Pop');
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentSong, setCurrentSong] = useState<{ title: string; audioUrl: string; coverUrl?: string } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    // const audioRef = useRef<HTMLAudioElement | null>(null); // Removed unused ref

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

    const handleGenerate = async () => {
        setIsGenerating(true);
        playSound('click');
        try {
            const result = await generateSong(courseId, selectedStyle);
            if (result.success && result.data) {
                setCurrentSong({
                    title: result.data.title,
                    audioUrl: result.data.audioUrl,
                    coverUrl: result.data.coverUrl,
                });
                // Refresh the list
                const { data } = await supabase
                    .from('generated_songs')
                    .select('*')
                    .eq('student_course_id', courseId)
                    .order('created_at', { ascending: false });
                if (data) setSongs(data);
            } else {
                alert(result.error || 'Failed to generate song');
            }
        } catch (error: any) {
            console.error(error);
            alert('Song generation failed: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const playSong = (song: any) => {
        setCurrentSong({
            title: song.title,
            audioUrl: song.audio_url,
            coverUrl: song.cover_url,
        });
        setIsPlaying(true);
        playSound('click');
    };

    return (
        <div className="space-y-8">
            {/* Generator Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-blue-500/10 border border-pink-500/20 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                        <Music className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">AI Song Generator</h3>
                        <p className="text-foreground/60 text-sm">Transform your course materials into catchy educational songs</p>
                    </div>
                </div>

                {/* Style Selector */}
                <div className="mb-6">
                    <p className="text-sm text-foreground/60 mb-3">Select a musical style:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {MUSICAL_STYLES.map((style) => (
                            <button
                                key={style.value}
                                onClick={() => { setSelectedStyle(style.value); playSound('click'); }}
                                className={`p-4 rounded-2xl text-left transition-all border ${selectedStyle === style.value
                                    ? 'bg-pink-500/20 border-pink-500/50 text-foreground shadow-[0_0_20px_rgba(236,72,153,0.2)]'
                                    : 'bg-card-bg border-card-border text-foreground/60 hover:bg-foreground/5'
                                    }`}
                            >
                                <span className="text-2xl mb-2 block">{style.emoji}</span>
                                <span className="font-medium">{style.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-lg hover:shadow-[0_4px_30px_rgba(236,72,153,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Generating... (2-5 mins)
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-6 h-6" />
                            Generate Educational Song
                        </>
                    )}
                </button>
            </div>

            {/* Audio Player */}
            {currentSong && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 backdrop-blur-md"
                >
                    <div className="flex items-center gap-4 mb-4">
                        {currentSong.coverUrl ? (
                            <img src={currentSong.coverUrl} alt="Cover" className="w-20 h-20 rounded-2xl object-cover" />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                                <Music className="w-10 h-10 text-white" />
                            </div>
                        )}
                        <div className="flex-1">
                            <h4 className="text-lg font-bold text-foreground">{currentSong.title}</h4>
                            <p className="text-foreground/60 text-sm">AI Generated • {selectedStyle}</p>
                        </div>
                    </div>
                    <audio
                        controls
                        autoPlay
                        className="w-full rounded-xl"
                        src={currentSong.audioUrl}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />
                </motion.div>
            )}

            {/* Song History */}
            {songs.length > 0 && (
                <div>
                    <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-purple-400" />
                        Previously Generated Songs
                    </h4>
                    <div className="space-y-3">
                        {songs.map((song) => (
                            <button
                                key={song.id}
                                onClick={() => playSong(song)}
                                className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4 ${currentSong?.audioUrl === song.audio_url
                                    ? 'bg-pink-500/20 border border-pink-500/30'
                                    : 'bg-card-bg border border-card-border hover:bg-foreground/5'
                                    }`}
                            >
                                {song.cover_url ? (
                                    <img src={song.cover_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                                        <Music className="w-6 h-6 text-white" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">{song.title}</p>
                                    <p className="text-sm text-foreground/40">{song.style}</p>
                                </div>
                                <Play className="w-5 h-5 text-foreground/40" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {songs.length === 0 && !isGenerating && (
                <div className="text-center py-12 text-foreground/40">
                    <Music className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No songs generated yet.</p>
                </div>
            )}
        </div>
    );
}
