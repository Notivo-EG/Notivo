'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

import { Header } from '@/components/infographic/Header';
import { FileUploader } from '@/components/infographic/FileUploader';
import { SourceGrid } from '@/components/infographic/SourceGrid';
import { GenerateButton } from '@/components/infographic/GenerateButton';
import { PromptEditor } from '@/components/infographic/PromptEditor';
import { Sidebar } from '@/components/infographic/Sidebar';
import { OverlayViewer } from '@/components/infographic/OverlayViewer';

import { useFileUpload } from '@/hooks/useFileUpload';
import { useInfographics } from '@/hooks/useInfographics';
import { processDocuments } from '@/lib/gemini-client';
import { generateInfographic } from '@/lib/nanoBanana';
import { GenerationState, Infographic } from '@/lib/types';
import { getCustomPrompt } from '@/lib/prompts';

export default function Home() {
  const {
    files,
    selectedFiles,
    hasSelectedFiles,
    errors,
    addFiles,
    removeFile,
    toggleSelection,
    selectAll,
    deselectAll,
    clearErrors,
  } = useFileUpload();

  const {
    infographics,
    addInfographic,
    removeInfographic,
  } = useInfographics();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  const [generationState, setGenerationState] = useState<GenerationState>({
    status: 'idle',
    progress: 0,
    message: '',
    currentStage: 'idle',
  });

  const [viewingInfographic, setViewingInfographic] = useState<Infographic | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string | undefined>(undefined);
  const [isMock, setIsMock] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!hasSelectedFiles) return;

    try {
      // Stage 1: Processing documents with Gemini
      setGenerationState({
        status: 'processing',
        progress: 0,
        message: 'Analyzing documents...',
        currentStage: 'analyzing',
      });

      const prompt = customPrompt || getCustomPrompt();
      const geminiResponse = await processDocuments({
        files: selectedFiles.map(f => f.file),
        customPrompt: prompt,
        onProgress: (progress) => {
          setGenerationState(prev => ({
            ...prev,
            progress: Math.round(progress * 0.4), // 0-40%
            message: progress < 50 ? 'Reading documents...' : 'Extracting insights...',
          }));
        },
      });

      console.log('Gemini Raw Response:', geminiResponse);

      if (geminiResponse.status === 'error') {
        throw new Error(geminiResponse.error || 'Failed to process documents');
      }

      // Stage 2: Generating infographic with Nano Banana Pro
      setGenerationState({
        status: 'generating',
        progress: 45,
        message: geminiResponse.data?.aspectRatio ? `Generating infographic (${geminiResponse.data.aspectRatio})...` : 'Generating infographic...',
        currentStage: 'generating',
      });

      const generationResponse = await generateInfographic({
        prompt: geminiResponse.data?.infographicPrompt || '',
        aspectRatio: geminiResponse.data?.aspectRatio,
        onProgress: (progress) => {
          setGenerationState(prev => ({
            ...prev,
            progress: 45 + Math.round(progress * 0.45), // 45-90%
            message: 'Creating visual elements...',
          }));
        },
      });

      const imageUrl = typeof generationResponse === 'string'
        ? generationResponse
        : (generationResponse as any).imageUrl;

      // Stage 3: Finalizing
      setGenerationState({
        status: 'generating',
        progress: 95,
        message: 'Finalizing...',
        currentStage: 'finalizing',
      });

      // Create and save infographic
      const newInfographic: Infographic = {
        id: uuidv4(),
        title: `Infographic - ${new Date().toLocaleDateString()}`,
        imageUrl,
        sources: selectedFiles.map(f => ({ id: f.id, name: f.name })),
        createdAt: new Date().toISOString(),
      };

      addInfographic(newInfographic);
      setIsMock(!!geminiResponse.isMock || !!(imageUrl as any).isMock);

      setGenerationState({
        status: 'complete',
        progress: 100,
        message: 'Complete!',
        currentStage: 'idle',
      });

      // Reset after a moment
      setTimeout(() => {
        setGenerationState({
          status: 'idle',
          progress: 0,
          message: '',
          currentStage: 'idle',
        });
      }, 2000);

    } catch (error) {
      console.error('Generation error:', error);
      setGenerationState({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'An error occurred',
        currentStage: 'idle',
      });
    }
  }, [hasSelectedFiles, selectedFiles, customPrompt, addInfographic]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />

      <div className="flex">
        {/* Main content */}
        <main className="flex-1 px-4 pb-12 pt-24 sm:px-6 lg:px-8 lg:pr-[340px]">
          <div className="mx-auto max-w-4xl">
            {/* Hero section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 text-center"
            >
              <h1 className="bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
                Transform Documents into
                <br />
                Stunning Infographics
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Upload your PDFs and let AI create beautiful visual summaries
              </p>
            </motion.div>

            {/* Mock Mode Banner */}
            <AnimatePresence>
              {isMock && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8"
                >
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        ⚠️ Running in Mock Mode
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        No API keys were found in your environment. The application is currently using
                        simulated insights and placeholder stock images which are not related to your documents.
                      </p>
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                        To get real results, please add GEMINI_API_KEY and NANO_BANANA_API_KEY to your .env.local file.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload zone */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <FileUploader
                onFilesAdded={addFiles}
                errors={errors}
                onClearErrors={clearErrors}
              />
            </motion.section>

            {/* Source selection */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8"
                >
                  <h2 className="mb-4 text-lg font-semibold text-foreground">
                    Select Sources
                  </h2>
                  <SourceGrid
                    files={files}
                    onToggleSelection={toggleSelection}
                    onRemove={removeFile}
                    onSelectAll={selectAll}
                    onDeselectAll={deselectAll}
                    selectedCount={selectedFiles.length}
                  />
                </motion.section>
              )}
            </AnimatePresence>

            {/* Prompt editor */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <PromptEditor onPromptChange={setCustomPrompt} />
            </motion.section>

            {/* Generate button */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <GenerateButton
                onClick={handleGenerate}
                disabled={!hasSelectedFiles}
                generationState={generationState}
                selectedCount={selectedFiles.length}
              />
            </motion.section>

            {/* Success message */}
            <AnimatePresence>
              {generationState.status === 'complete' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20"
                >
                  <p className="font-medium text-green-700 dark:text-green-300">
                    🎉 Infographic created successfully! Check the sidebar to view it.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {generationState.status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mt-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-center"
                >
                  <p className="font-medium text-destructive">
                    {generationState.message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Sidebar */}
        <Sidebar
          infographics={infographics}
          onViewInfographic={setViewingInfographic}
          onDeleteInfographic={removeInfographic}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Overlay viewer */}
      <AnimatePresence>
        {viewingInfographic && (
          <OverlayViewer
            infographic={viewingInfographic}
            onClose={() => setViewingInfographic(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
