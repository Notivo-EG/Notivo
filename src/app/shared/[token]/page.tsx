"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Layers,
  FileText,
  Video,
  Music,
  PenTool,
  Image,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { SharedContentTab } from "@/components/shared/SharedContentTab";
import { SharedFlashcardsTab } from "@/components/shared/SharedFlashcardsTab";
import { SharedSongsTab } from "@/components/shared/SharedSongsTab";
import { SharedVideosTab } from "@/components/shared/SharedVideosTab";
import { SharedInfographicsTab } from "@/components/shared/SharedInfographicsTab";
import { SharedExamsTab } from "@/components/shared/SharedExamsTab";

type Tab =
  | "content"
  | "flashcards"
  | "infographic"
  | "songs"
  | "videos"
  | "exam";

interface SharedData {
  course: {
    id: string;
    code: string;
    name: string;
    ownerName: string;
    university?: string;
    program?: string;
  };
  materials: any[];
  flashcards: any[];
  songs: any[];
  videos: any[];
  infographics: any[];
  exams: any[];
}

export default function SharedCoursePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("content");

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/shared/${token}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load shared content");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-foreground/30" />
          <p className="text-foreground/40 text-sm">Loading shared course...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400" />
          <h2 className="text-xl font-bold text-foreground">
            Link Not Found
          </h2>
          <p className="text-foreground/60">
            {error ||
              "This share link doesn't exist or has been removed."}
          </p>
          <a
            href="/"
            className="mt-4 px-6 py-2 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition-all"
          >
            Go to Notiva
          </a>
        </div>
      </div>
    );
  }

  const { course, materials, flashcards, songs, videos, infographics, exams } =
    data;

  // Count items for badge display
  const tabCounts: Record<Tab, number> = {
    content: materials.length,
    flashcards: flashcards.length,
    infographic: infographics.length,
    songs: songs.length,
    videos: videos.filter((v) => v.status === "completed").length,
    exam: exams.length,
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12 relative overflow-hidden text-foreground">
      {/* Background Glow */}
      <div className="fixed left-1/2 top-1/4 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-600/10 via-purple-500/5 to-transparent blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Shared Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm">
            <ExternalLink className="w-4 h-4" />
            Shared by{" "}
            <span className="font-bold">{course.ownerName}</span>
            {course.university && (
              <span className="text-foreground/40">
                • {course.university}
              </span>
            )}
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10"
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center backdrop-blur-md shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-1">
                {course.name}
              </h1>
              <p className="text-foreground/60 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-foreground/10 border border-foreground/5 text-xs font-mono">
                  {course.code}
                </span>
                <span>•</span>
                <span>{materials.length} materials</span>
                <span>•</span>
                <span>{flashcards.length} flashcards</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-10 border-b border-white/10 pb-1">
          <SharedTabButton
            active={activeTab === "content"}
            onClick={() => setActiveTab("content")}
            icon={Layers}
            label="Content Engine"
            count={tabCounts.content}
          />
          <SharedTabButton
            active={activeTab === "flashcards"}
            onClick={() => setActiveTab("flashcards")}
            icon={FileText}
            label="Flashcards"
            count={tabCounts.flashcards}
          />
          <SharedTabButton
            active={activeTab === "infographic"}
            onClick={() => setActiveTab("infographic")}
            icon={Image}
            label="Infographic"
            count={tabCounts.infographic}
          />
          <SharedTabButton
            active={activeTab === "songs"}
            onClick={() => setActiveTab("songs")}
            icon={Music}
            label="Songs"
            count={tabCounts.songs}
          />
          <SharedTabButton
            active={activeTab === "videos"}
            onClick={() => setActiveTab("videos")}
            icon={Video}
            label="Video Tutor"
            count={tabCounts.videos}
          />
          <SharedTabButton
            active={activeTab === "exam"}
            onClick={() => setActiveTab("exam")}
            icon={PenTool}
            label="Exams"
            count={tabCounts.exam}
          />
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "content" && (
            <SharedContentTab materials={materials} />
          )}
          {activeTab === "flashcards" && (
            <SharedFlashcardsTab flashcards={flashcards} />
          )}
          {activeTab === "infographic" && (
            <SharedInfographicsTab infographics={infographics} />
          )}
          {activeTab === "songs" && <SharedSongsTab songs={songs} />}
          {activeTab === "videos" && <SharedVideosTab videos={videos} />}
          {activeTab === "exam" && <SharedExamsTab exams={exams} />}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center pb-8">
          <p className="text-foreground/30 text-sm">
            Powered by{" "}
            <a href="/" className="text-primary hover:underline font-medium">
              Notiva
            </a>{" "}
            — AI Academic Architect
          </p>
        </div>
      </div>
    </div>
  );
}

function SharedTabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl border-b-2 transition-all font-medium ${
        active
          ? "border-purple-500 text-foreground bg-foreground/5"
          : "border-transparent text-foreground/40 hover:text-foreground hover:bg-foreground/5"
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? "text-purple-400" : ""}`} />
      {label}
      {count > 0 && (
        <span
          className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            active
              ? "bg-purple-500/20 text-purple-400"
              : "bg-foreground/10 text-foreground/40"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
