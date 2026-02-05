'use client';

import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GenerationState } from '@/lib/types';

interface GenerateButtonProps {
    onClick: () => void;
    disabled: boolean;
    generationState: GenerationState;
    selectedCount: number;
}

export function GenerateButton({
    onClick,
    disabled,
    generationState,
    selectedCount,
}: GenerateButtonProps) {
    const isLoading = generationState.status !== 'idle' && generationState.status !== 'complete' && generationState.status !== 'error';

    const getButtonText = () => {
        switch (generationState.status) {
            case 'processing':
                return 'Analyzing Documents...';
            case 'generating':
                return 'Creating Infographic...';
            case 'complete':
                return 'Generate Another';
            case 'error':
                return 'Try Again';
            default:
                return selectedCount > 0
                    ? `Generate Infographic (${selectedCount} files)`
                    : 'Select files to generate';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
        >
            {/* Glow effect */}
            <motion.div
                animate={{
                    opacity: disabled || isLoading ? 0 : [0.3, 0.6, 0.3],
                    scale: disabled || isLoading ? 0.95 : [1, 1.02, 1],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500 opacity-30 blur-lg"
            />

            <Button
                onClick={onClick}
                disabled={disabled || isLoading}
                size="lg"
                className={`
          relative h-14 w-full rounded-xl px-8 text-base font-semibold
          transition-all duration-300
          ${disabled || isLoading
                        ? 'bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        : 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
                    }
        `}
            >
                <motion.span
                    className="flex items-center gap-2"
                    whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
                    whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Sparkles className="h-5 w-5" />
                    )}
                    {getButtonText()}
                </motion.span>
            </Button>

            {/* Progress indicator */}
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 space-y-2"
                >
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{generationState.message}</span>
                        <span className="font-medium text-foreground">{generationState.progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${generationState.progress}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                        />
                    </div>
                    <div className="flex justify-center gap-2">
                        <StageDot active={generationState.currentStage === 'analyzing'} label="Analyzing" />
                        <StageDot active={generationState.currentStage === 'generating'} label="Generating" />
                        <StageDot active={generationState.currentStage === 'finalizing'} label="Finalizing" />
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

function StageDot({ active, label }: { active: boolean; label: string }) {
    return (
        <motion.div
            animate={{ scale: active ? 1.1 : 1 }}
            className="flex items-center gap-1"
        >
            <motion.div
                animate={{
                    backgroundColor: active ? 'rgb(59, 130, 246)' : 'rgb(203, 213, 225)',
                    scale: active ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.5, repeat: active ? Infinity : 0 }}
                className="h-2 w-2 rounded-full"
            />
            <span className={`text-xs ${active ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {label}
            </span>
        </motion.div>
    );
}
