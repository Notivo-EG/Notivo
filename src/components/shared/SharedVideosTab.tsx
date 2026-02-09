"use client";

import { useState } from "react";
import { Video, Play, Clock, Download } from "lucide-react";
import { CustomVideoPlayer } from "@/components/ui/CustomVideoPlayer";

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

export function SharedVideosTab({ videos }: { videos: GeneratedVideo[] }) {
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);

  return (
    <div>
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
                    From:{" "}
                    {selectedVideo.source_materials
                      .map((s: any) =>
                        s.index ? `#${s.index}` : s.title?.slice(0, 10)
                      )
                      .join(", ")}
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

      {videos.length === 0 ? (
        <div className="h-[300px] border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30">
          <Video className="w-10 h-10 mb-4 opacity-50" />
          <p>No videos generated yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {videos
            .filter((v) => v.status === "completed")
            .map((video) => (
              <div
                key={video.id}
                className={`bg-card-bg border rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-primary/50 ${
                  selectedVideo?.id === video.id
                    ? "border-primary"
                    : "border-card-border"
                }`}
              >
                <div
                  onClick={() => setSelectedVideo(video)}
                  className="aspect-video bg-foreground/5 flex items-center justify-center"
                >
                  <Play className="w-10 h-10 text-foreground/20" />
                </div>
                <div className="p-4">
                  <p className="font-medium text-foreground text-sm truncate">
                    {video.title}
                  </p>
                  <p className="text-xs text-foreground/40 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                  {video.source_materials && video.source_materials.length > 0 && (
                    <p className="text-xs text-foreground/30 mt-1">
                      From:{" "}
                      {video.source_materials
                        .map((s: any) =>
                          s.index ? `#${s.index}` : s.title?.slice(0, 10)
                        )
                        .join(", ")}
                    </p>
                  )}
                  <button
                    onClick={() => setSelectedVideo(video)}
                    className="w-full mt-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3" /> Play
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
