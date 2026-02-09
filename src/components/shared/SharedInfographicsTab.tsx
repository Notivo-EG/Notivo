"use client";

import { useState } from "react";
import { Image as ImageIcon, Sparkles, X } from "lucide-react";

interface Infographic {
  id: string;
  title: string;
  image_url: string;
  source_materials?: any;
  created_at: string;
}

export function SharedInfographicsTab({
  infographics,
}: {
  infographics: Infographic[];
}) {
  const [viewing, setViewing] = useState<Infographic | null>(null);

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80">
        <ImageIcon className="w-5 h-5" />
        Course Infographics
      </h3>

      {infographics.length === 0 ? (
        <div className="h-[300px] border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30">
          <Sparkles className="w-10 h-10 mb-4 opacity-50" />
          <p>No infographics generated yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {infographics.map((ig) => (
            <div
              key={ig.id}
              className="group relative aspect-[3/4] bg-card-bg border border-card-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => setViewing(ig)}
            >
              <img
                src={ig.image_url}
                alt={ig.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-white font-bold text-sm line-clamp-2">
                  {ig.title}
                </p>
                <span className="text-white/60 text-xs mt-1">
                  {new Date(ig.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overlay Viewer */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewing(null)}
              className="absolute top-2 right-2 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={viewing.image_url}
              alt={viewing.title}
              className="w-full h-auto rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
