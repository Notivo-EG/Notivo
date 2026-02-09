"use client";

import { Music, Play, Pause } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";

interface Song {
  id: string;
  title: string;
  audio_url: string;
  cover_url?: string;
  lyrics?: string;
  style?: string;
  source_materials?: any;
  created_at: string;
}

export function SharedSongsTab({ songs }: { songs: Song[] }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const handlePlaySong = (song: Song) => {
    playTrack({
      id: song.id,
      title: song.title,
      audioUrl: song.audio_url,
      coverUrl: song.cover_url,
      lyrics: song.lyrics,
      style: song.style,
    });
  };

  const isCurrentlyPlaying = (song: Song) => {
    return currentTrack?.audioUrl === song.audio_url && isPlaying;
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80">
        <Music className="w-5 h-5" />
        Generated Songs
      </h3>

      {songs.length === 0 ? (
        <div className="h-[300px] border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30">
          <Music className="w-10 h-10 mb-4 opacity-50" />
          <p>No songs generated yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {songs.map((song) => (
            <button
              key={song.id}
              onClick={() => handlePlaySong(song)}
              className={`p-4 rounded-2xl text-left transition-all flex items-center gap-4 border w-full ${
                currentTrack?.audioUrl === song.audio_url
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card-bg border-card-border hover:bg-foreground/5"
              }`}
            >
              {song.cover_url ? (
                <img
                  src={song.cover_url}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-foreground/10 flex items-center justify-center">
                  <Music className="w-6 h-6 text-foreground/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {song.title}
                </p>
                <p className="text-sm text-foreground/40">{song.style}</p>
              </div>
              {isCurrentlyPlaying(song) ? (
                <Pause className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <Play className="w-5 h-5 text-foreground/40 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
