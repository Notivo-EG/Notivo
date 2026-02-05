'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploaderProps {
    onFilesAdded: (files: File[]) => void;
    errors?: { file: File; error: string }[];
    onClearErrors?: () => void;
}

export function FileUploader({ onFilesAdded, errors = [], onClearErrors }: FileUploaderProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        onFilesAdded(acceptedFiles);
    }, [onFilesAdded]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
        },
        maxSize: 50 * 1024 * 1024, // 50MB
    });

    return (
        <div className="space-y-4">
            {/* Wrapper div for animations */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Dropzone div */}
                <div
                    {...getRootProps()}
                    className={`
            relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-8
            transition-all duration-300 ease-out
            ${isDragActive && !isDragReject
                            ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                            : isDragReject
                                ? 'border-destructive bg-destructive/5'
                                : 'border-border hover:border-blue-400 hover:bg-accent/50'
                        }
          `}
                >
                    <input {...getInputProps()} />

                    {/* Background animation */}
                    <AnimatePresence>
                        {isDragActive && !isDragReject && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-violet-500/10"
                            />
                        )}
                    </AnimatePresence>

                    <div className="relative flex flex-col items-center gap-4 text-center">
                        <motion.div
                            animate={{
                                scale: isDragActive ? 1.1 : 1,
                                y: isDragActive ? -5 : 0,
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className={`
                flex h-16 w-16 items-center justify-center rounded-2xl
                ${isDragActive && !isDragReject
                                    ? 'bg-gradient-to-br from-blue-500 to-violet-500 shadow-lg shadow-blue-500/30'
                                    : isDragReject
                                        ? 'bg-destructive'
                                        : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700'
                                }
              `}
                        >
                            {isDragReject ? (
                                <AlertCircle className="h-8 w-8 text-destructive-foreground" />
                            ) : (
                                <Upload className={`h-8 w-8 ${isDragActive ? 'text-white' : 'text-muted-foreground'}`} />
                            )}
                        </motion.div>

                        <div>
                            <motion.p
                                animate={{ scale: isDragActive ? 1.02 : 1 }}
                                className="text-lg font-semibold text-foreground"
                            >
                                {isDragActive && !isDragReject
                                    ? 'Drop your files here'
                                    : isDragReject
                                        ? 'Invalid file type or size'
                                        : 'Drag & drop your documents'}
                            </motion.p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                or click to browse your files
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <FileTypeBadge icon={<FileText className="h-3 w-3" />} label="PDF" />
                            <FileTypeBadge icon={<FileText className="h-3 w-3" />} label="DOCX" />
                            <FileTypeBadge icon={<FileText className="h-3 w-3" />} label="TXT" />
                            <span className="text-xs text-muted-foreground">Max 50MB</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Error messages */}
            <AnimatePresence>
                {errors.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                {errors.map((err, i) => (
                                    <p key={i} className="text-sm text-destructive">
                                        <span className="font-medium">{err.file.name}:</span> {err.error}
                                    </p>
                                ))}
                            </div>
                            {onClearErrors && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={onClearErrors}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function FileTypeBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {icon}
            {label}
        </span>
    );
}
