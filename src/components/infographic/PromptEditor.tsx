'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown, RotateCcw, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    DEFAULT_GEMINI_PROMPT,
    getCustomPrompt,
    saveCustomPrompt,
    resetPromptToDefault
} from '@/lib/prompts';

interface PromptEditorProps {
    onPromptChange?: (prompt: string) => void;
}

export function PromptEditor({ onPromptChange }: PromptEditorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState(DEFAULT_GEMINI_PROMPT);
    const [saved, setSaved] = useState(false);
    const [isModified, setIsModified] = useState(false);

    // Load custom prompt on mount
    useEffect(() => {
        const customPrompt = getCustomPrompt();
        setPrompt(customPrompt);
        setIsModified(customPrompt !== DEFAULT_GEMINI_PROMPT);
    }, []);

    const handlePromptChange = (value: string) => {
        setPrompt(value);
        setIsModified(value !== DEFAULT_GEMINI_PROMPT);
        setSaved(false);
    };

    const handleSave = () => {
        saveCustomPrompt(prompt);
        onPromptChange?.(prompt);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        resetPromptToDefault();
        setPrompt(DEFAULT_GEMINI_PROMPT);
        setIsModified(false);
        onPromptChange?.(DEFAULT_GEMINI_PROMPT);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card"
        >
            {/* Header / Toggle button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent/50"
                whileTap={{ scale: 0.995 }}
            >
                <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">Advanced Settings</span>
                    {isModified && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                            Modified
                        </span>
                    )}
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
            </motion.button>

            {/* Collapsible content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-border p-4">
                            {/* Description */}
                            <div className="mb-4 flex items-start gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="mt-0.5 h-4 w-4 shrink-0 cursor-help text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="max-w-xs">
                                            <p>
                                                Customize the prompt sent to Gemini 2.5 Flash. Use{' '}
                                                <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">
                                                    {'{{DOCUMENT_CONTENT}}'}
                                                </code>{' '}
                                                as a placeholder for where the document text will be inserted.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <p className="text-sm text-muted-foreground">
                                    Customize the prompt for Gemini. Use{' '}
                                    <code className="rounded bg-slate-200 px-1 text-xs dark:bg-slate-700">
                                        {'{{DOCUMENT_CONTENT}}'}
                                    </code>{' '}
                                    as a placeholder.
                                </p>
                            </div>

                            {/* Textarea */}
                            <div className="relative">
                                <Textarea
                                    value={prompt}
                                    onChange={(e) => handlePromptChange(e.target.value)}
                                    placeholder="Enter your custom prompt..."
                                    className="min-h-[200px] resize-y font-mono text-sm"
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                                    {prompt.length} characters
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    disabled={!isModified}
                                >
                                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                                    Reset to Default
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={saved}
                                    className="min-w-[100px]"
                                >
                                    <AnimatePresence mode="wait">
                                        {saved ? (
                                            <motion.span
                                                key="saved"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="flex items-center gap-1"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                                Saved!
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key="save"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                            >
                                                Save Prompt
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
