"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    isProcessing?: boolean;
    label?: string;
    acceptedTypes?: string; // e.g., "application/pdf,image/*"
}

export function FileUpload({ onFileSelect, isProcessing = false, label = "Upload Syllabus or Slides", acceptedTypes = "application/pdf,image/*" }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        setSelectedFile(file);
        onFileSelect(file);
    };

    const resetFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!selectedFile ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        key="dropzone"
                    >
                        <form
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                            className={`relative text-center p-10 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer group
                            ${dragActive
                                    ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                }`}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                className="hidden"
                                accept={acceptedTypes}
                                onChange={handleChange}
                            />

                            <div className="flex flex-col items-center gap-4">
                                <div className={`p-4 rounded-full bg-white/5 transition-colors ${dragActive ? "text-blue-400" : "text-white/40 group-hover:text-white"}`}>
                                    <Upload size={32} />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-white text-lg">{label}</p>
                                    <p className="text-white/40 text-sm">Drag & drop or click to browse</p>
                                </div>
                                <div className="text-xs font-mono text-white/30 uppercase tracking-widest pt-2">
                                    PDF • PNG • JPG
                                </div>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key="selected"
                        className="relative p-6 rounded-[2rem] bg-black/40 border border-white/10 backdrop-blur-xl flex items-center justify-between gap-4 overflow-hidden"
                    >
                        {/* Progress Bar (Indeterminate for now) */}
                        {isProcessing && (
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5">
                                <div className="h-full bg-blue-500 animate-loading-bar" style={{ width: "50%" }} />
                            </div>
                        )}

                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                                <FileText size={24} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-white truncate">{selectedFile.name}</p>
                                <p className="text-white/40 text-sm">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {isProcessing ? "Analyzing..." : "Ready to process"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isProcessing ? (
                                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                            ) : (
                                <button
                                    onClick={resetFile}
                                    className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Add global CSS for loading animation if needed, or rely on Tailwind animate-pulse
