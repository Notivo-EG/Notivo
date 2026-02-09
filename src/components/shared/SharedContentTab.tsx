"use client";

import { Layers, FileText, CheckCircle2 } from "lucide-react";

interface Material {
  id: string;
  title: string;
  type: string;
  created_at: string;
}

export function SharedContentTab({ materials }: { materials: Material[] }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80">
        <Layers className="w-5 h-5" />
        Knowledge Base
      </h3>

      {materials.length === 0 ? (
        <div className="h-[300px] border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30">
          <Layers className="w-12 h-12 mb-4 opacity-50" />
          <p>No materials uploaded yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {materials.map((m, idx) => {
            const visualIndex = materials.length - idx;
            return (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-card-bg border border-card-border flex items-center gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    m.type === "slide"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-green-500/10 text-green-500"
                  }`}
                >
                  {m.type === "slide" ? (
                    <Layers size={20} />
                  ) : (
                    <FileText size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground/30">
                      #{visualIndex}
                    </span>
                    <h4 className="font-medium text-foreground truncate">
                      {m.title}
                    </h4>
                  </div>
                  <p className="text-xs text-foreground/40 capitalize flex items-center gap-2 mt-0.5">
                    {m.type} •{" "}
                    {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  AI Ready
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
