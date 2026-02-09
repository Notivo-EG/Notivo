"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/context/PreferencesContext";
import { generateFlashcards } from "@/app/actions";
import { MaterialSelector } from "@/components/course/ui/MaterialSelector";
import {
    Loader2,
    Sparkles,
    Bookmark,
    Check,
    Layers,
    FileText,
    Brain,
    ArrowLeft,
    RefreshCw,
    Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FlashcardsTab({ courseId }: { courseId: string }) {
    const supabase = createClient();
    const { playSound } = usePreferences();
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [filter, setFilter] = useState<'all' | 'bookmarked' | 'done'>('all');

    // Material Selection for Generation
    const [isSelectingMaterials, setIsSelectingMaterials] = useState(false);
    const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

    useEffect(() => {
        const fetchFlashcards = async () => {
            const { data } = await supabase
                .from('flashcards')
                .select('*')
                .eq('student_course_id', courseId)
                .order('created_at', { ascending: true });
            if (data) setFlashcards(data);
        };
        fetchFlashcards();
    }, [courseId, supabase]);

    // Re-render MathJax when content changes
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).MathJax) {
            // Use setTimeout to ensure DOM is ready
            setTimeout(() => {
                (window as any).MathJax.typesetPromise().catch((err: any) => console.log('MathJax error:', err));
            }, 100);
        }
    }, [currentIndex, isFlipped, showExplanation, flashcards]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setIsSelectingMaterials(false);
        try {
            const result = await generateFlashcards(courseId, selectedMaterialIds);
            if (result.success) {
                const { data } = await supabase
                    .from('flashcards')
                    .select('*')
                    .eq('student_course_id', courseId)
                    .order('created_at', { ascending: true });
                if (data) setFlashcards(data);
                setCurrentIndex(0);
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error(error);
            alert("Generation failed!");
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleBookmark = async (cardId: string, currentVal: boolean) => {
        await supabase.from('flashcards').update({ is_bookmarked: !currentVal }).eq('id', cardId);
        setFlashcards(prev => prev.map(c => c.id === cardId ? { ...c, is_bookmarked: !currentVal } : c));
    };

    const markAsDone = async (cardId: string) => {
        const card = flashcards.find(c => c.id === cardId);
        if (card && card.review_count === 0) {
            await supabase.from('flashcards').update({ review_count: 1, last_reviewed: new Date().toISOString() }).eq('id', cardId);
            setFlashcards(prev => prev.map(c => c.id === cardId ? { ...c, review_count: 1, last_reviewed: new Date().toISOString() } : c));
        }
    };

    const handleFlip = () => {
        if (!isFlipped) {
            markAsDone(flashcards[currentIndex].id);
        }
        setIsFlipped(!isFlipped);
    };

    const nextCard = () => {
        setIsFlipped(false);
        setShowExplanation(false);
        const filtered = getFilteredCards();
        const nextIdx = filtered.findIndex((c, i) => i > currentIndex) !== -1 ? filtered.findIndex((c, i) => i > currentIndex) : 0;
        const targetCard = filtered[nextIdx >= filtered.length ? 0 : nextIdx];
        if (targetCard) setCurrentIndex(flashcards.indexOf(targetCard));
    };

    const prevCard = () => {
        setIsFlipped(false);
        setShowExplanation(false);
        const filtered = getFilteredCards();
        const prevIdx = [...filtered].reverse().findIndex((c) => flashcards.indexOf(c) < currentIndex);
        const actualIdx = prevIdx >= 0 ? filtered.length - 1 - prevIdx : filtered.length - 1;
        const targetCard = filtered[actualIdx];
        if (targetCard) setCurrentIndex(flashcards.indexOf(targetCard));
    };

    const getFilteredCards = () => {
        if (filter === 'bookmarked') return flashcards.filter(c => c.is_bookmarked);
        if (filter === 'done') return flashcards.filter(c => c.review_count > 0);
        return flashcards;
    };

    const filteredCards = getFilteredCards();

    // GENERATION VIEW (Material Selector)
    if (isSelectingMaterials || (flashcards.length === 0 && !isGenerating)) {
        return (
            <div className="max-w-2xl mx-auto py-10 space-y-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/20">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-3">Flashcard Generator</h2>
                    <p className="text-foreground/60">Select course materials to generate flashcards from.</p>
                </div>

                <div className="bg-card-bg border border-card-border rounded-3xl p-6">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-400" /> Source Materials
                    </h3>
                    <div className="max-h-[300px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
                        <MaterialSelector
                            courseId={courseId}
                            selectedIds={selectedMaterialIds}
                            onSelectionChange={setSelectedMaterialIds}
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={selectedMaterialIds.length === 0 || isGenerating}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg hover:shadow-[0_4px_20px_rgba(147,51,234,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                        {isGenerating ? "Generating..." : `Generate from ${selectedMaterialIds.length} Materials`}
                    </button>

                    {flashcards.length > 0 && (
                        <button
                            onClick={() => setIsSelectingMaterials(false)}
                            className="w-full mt-3 py-3 rounded-xl text-foreground/60 hover:bg-foreground/5 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // LOADING STATE
    if (isGenerating) {
        return (
            <div className="text-center py-20">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-6" />
                <h2 className="text-xl font-bold text-foreground">Generating Flashcards...</h2>
                <p className="text-foreground/60 mt-2">Analyzing your materials with Gemini.</p>
            </div>
        )
    }

    const currentCard = flashcards[currentIndex];
    // const currentFilteredIndex = filteredCards.indexOf(currentCard); // Unused

    return (
        <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
                {/* Filters */}
                <div className="p-4 rounded-2xl bg-card-bg border border-card-border space-y-2">
                    {(['all', 'bookmarked', 'done'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setCurrentIndex(0); setIsFlipped(false); setShowExplanation(false); playSound('click'); }}
                            className={`w-full text-left px-4 py-2 rounded-xl flex items-center justify-between transition-colors ${filter === f ? 'bg-purple-600/20 text-foreground' : 'text-foreground/40 hover:bg-foreground/5'}`}
                        >
                            <span className="capitalize flex items-center gap-2">
                                {f === 'bookmarked' && <Bookmark className="w-4 h-4" />}
                                {f === 'done' && <Check className="w-4 h-4" />}
                                {f === 'all' && <Layers className="w-4 h-4" />}
                                {f}
                            </span>
                            <span className="text-xs bg-foreground/10 px-2 py-0.5 rounded">
                                {f === 'all' ? flashcards.length : f === 'bookmarked' ? flashcards.filter(c => c.is_bookmarked).length : flashcards.filter(c => c.review_count > 0).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Card List */}
                <div className="max-h-[400px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {filteredCards.map((card, i) => (
                        <button
                            key={card.id}
                            onClick={() => { setCurrentIndex(flashcards.indexOf(card)); setIsFlipped(false); setShowExplanation(false); playSound('click'); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${flashcards.indexOf(card) === currentIndex ? 'bg-blue-600/30 text-foreground' : 'text-foreground/50 hover:bg-foreground/5'}`}
                        >
                            <span className="w-5 h-5 rounded bg-foreground/10 flex items-center justify-center text-xs">{i + 1}</span>
                            <span className="truncate flex-1">{card.front.slice(0, 30)}...</span>
                            {card.is_bookmarked && <Bookmark className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                            {card.review_count > 0 && <Check className="w-3 h-3 text-green-400" />}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setIsSelectingMaterials(true)}
                    disabled={isGenerating}
                    className="w-full text-sm text-purple-400 hover:text-purple-300 flex items-center justify-center gap-2 py-2"
                >
                    <Sparkles className="w-4 h-4" />
                    Regenerate All
                </button>
            </div>

            {/* Main Card Area */}
            <div className="lg:col-span-3">
                {filteredCards.length === 0 ? (
                    <div className="text-center py-20 text-foreground/40">
                        No cards match this filter.
                    </div>
                ) : (
                    <>
                        {/* 3D Flashcard Container */}
                        <div
                            className="perspective-1000 cursor-pointer mb-6"
                            onClick={handleFlip}
                            style={{ perspective: '1000px' }}
                        >
                            <motion.div
                                className="relative h-[400px] w-full"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Front Side */}
                                <div
                                    className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blue-600/20 via-[#1a1a2e] to-purple-600/10 border border-card-border backdrop-blur-md p-10 flex flex-col items-center justify-center text-center shadow-xl"
                                    style={{ backfaceVisibility: 'hidden' }}
                                >
                                    {/* Type Badge */}
                                    <div className="absolute top-6 left-6">
                                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                                            {currentCard.type || "General"}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col items-center justify-center w-full">
                                        <p className="text-xs text-blue-400 uppercase tracking-[0.2em] mb-6 font-semibold">Question</p>
                                        <div className="text-2xl md:text-3xl font-bold text-foreground leading-relaxed">
                                            {currentCard.front}
                                        </div>
                                    </div>

                                    <p className="absolute bottom-6 text-foreground/30 text-sm font-medium animate-pulse">
                                        Click to Reveal Answer
                                    </p>

                                    {currentCard.review_count > 0 && (
                                        <div className="absolute top-6 right-6 flex items-center gap-1.5 text-green-400 text-xs font-bold bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                                            <Check className="w-3.5 h-3.5" /> Reviewed
                                        </div>
                                    )}
                                </div>

                                {/* Back Side */}
                                <div
                                    className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-green-600/20 via-[#1a1a2e] to-blue-600/10 border border-[rgba(74,222,128,0.3)] backdrop-blur-md p-10 flex flex-col items-center justify-center text-center shadow-xl"
                                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                >
                                    {/* Type Badge */}
                                    <div className="absolute top-6 left-6">
                                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                                            {currentCard.type || "General"}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col items-center justify-center w-full">
                                        <p className="text-xs text-green-400 uppercase tracking-[0.2em] mb-6 font-semibold">Answer</p>
                                        <div className="text-xl md:text-2xl font-medium text-green-100 leading-relaxed">
                                            {currentCard.back}
                                        </div>
                                    </div>

                                    <p className="absolute bottom-6 text-foreground/30 text-sm font-medium">
                                        Click to flip back
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Controls & Explanation */}
                        <div className="space-y-6">
                            {/* Control Bar */}
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <button
                                    onClick={() => { prevCard(); playSound('click'); }}
                                    className="w-12 h-12 rounded-2xl bg-card-bg border border-card-border flex items-center justify-center hover:bg-foreground/5 hover:-translate-y-1 transition-all"
                                >
                                    <ArrowLeft className="w-5 h-5 text-foreground" />
                                </button>

                                <button
                                    onClick={() => { handleFlip(); playSound('click'); }}
                                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:shadow-[0_4px_20px_rgba(236,72,153,0.4)] hover:-translate-y-1 transition-all flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" /> Flip Card
                                </button>

                                <button
                                    onClick={() => { setShowExplanation(!showExplanation); playSound('click'); }}
                                    className={`px-8 py-3 rounded-2xl font-bold hover:-translate-y-1 transition-all flex items-center gap-2 border ${showExplanation ? 'bg-green-500 text-white border-green-500 shadow-[0_4px_20px_rgba(34,197,94,0.4)]' : 'bg-card-bg text-green-400 border-green-500/30 hover:border-green-500'}`}
                                >
                                    <Brain className="w-4 h-4" /> Explain
                                </button>

                                <button
                                    onClick={() => { nextCard(); playSound('click'); }}
                                    className="w-12 h-12 rounded-2xl bg-card-bg border border-card-border flex items-center justify-center hover:bg-foreground/5 hover:-translate-y-1 transition-all"
                                >
                                    <ArrowLeft className="w-5 h-5 text-foreground rotate-180" />
                                </button>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={() => { toggleBookmark(currentCard.id, currentCard.is_bookmarked); playSound('click'); }}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all ${currentCard.is_bookmarked ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-transparent border-transparent text-foreground/40 hover:text-foreground'}`}
                                >
                                    <Bookmark className={`w-4 h-4 ${currentCard.is_bookmarked ? 'fill-yellow-400' : ''}`} />
                                    {currentCard.is_bookmarked ? 'Bookmarked' : 'Add to Bookmarks'}
                                </button>
                            </div>

                            {/* Explanation Box */}
                            <AnimatePresence>
                                {showExplanation && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -10, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 mt-4 text-center">
                                            <h4 className="text-green-400 font-bold mb-2 flex items-center justify-center gap-2">
                                                <Sparkles className="w-4 h-4" /> AI Explanation
                                            </h4>
                                            <p className="text-foreground/80 leading-relaxed">
                                                {currentCard.explanation || "No advanced explanation available for this concept."}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
