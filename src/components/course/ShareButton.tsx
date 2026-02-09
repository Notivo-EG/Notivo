"use client";

import { useState } from "react";
import { Share2, Check, Link as LinkIcon, Loader2 } from "lucide-react";

interface ShareButtonProps {
  courseId: string;
}

export function ShareButton({ courseId }: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleShare = async () => {
    if (copied) return; // Prevent double-click while showing "Copied"

    setIsLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create share link");
      }

      const data = await res.json();
      setShareUrl(data.shareUrl);

      // Copy to clipboard
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);

      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (error: any) {
      console.error("Share failed:", error);
      alert("Failed to create share link: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isLoading}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
        copied
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : "bg-card-bg text-foreground/60 hover:text-foreground border border-card-border hover:border-primary/30"
      } disabled:opacity-50`}
      title={shareUrl || "Share this course"}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : copied ? (
        <Check className="w-4 h-4" />
      ) : (
        <Share2 className="w-4 h-4" />
      )}
      {isLoading ? "Creating Link..." : copied ? "Link Copied!" : "Share"}
    </button>
  );
}
