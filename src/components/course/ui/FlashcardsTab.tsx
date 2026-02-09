"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/context/PreferencesContext";
import { useGeneration } from "@/context/GenerationContext";
import { generateFlashcards } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import {
    Loader2, Sparkles, Bookmark, Check, Layers,
    Brain, ArrowLeft, RefreshCw, CheckCircle2,
    Calendar, PlayCircle, Trash2
} from "lucide-react";

interface Material {
    id: string;
    title: string;
    type: string;
}

interface FlashcardDeck {
    id: string; // We'll group by date string for now or use a synthetic ID
    date: string;
    count: number;
    bookmarkedCount: number;
    reviewedCount: number;
    sourceIndexes: number[];
    cardIds: string[];
}

export function FlashcardsTab({ courseId }: { courseId: string }) {
    const supabase = createClient();
    const { playSound } = usePreferences();
    const { addTask, updateTask, tasks } = useGeneration();

    const [materials, setMaterials] = useState<Material[]>([]);
    const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [decks, setDecks] = useState<FlashcardDeck[]>([]);

    // View state
    const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [filter, setFilter] = useState<'all' | 'bookmarked' | 'done'>('all');

    const activeTask = tasks.find(
        t => t.type === 'flashcard' && t.courseId === courseId && (t.status === 'pending' || t.status === 'processing')
    );
    const isGenerating = !!activeTask;

    // Fetch materials & flashcards
    useEffect(() => {
        const loadData = async () => {
            // 1. Materials
            const { data: matData } = await supabase
                .from('course_materials')
                .select('id, title, created_at, type')
                .eq('student_course_id', courseId)
                .order('created_at', { ascending: false });

            if (matData) setMaterials(matData);

            // 2. Flashcards
            const { data: cardData } = await supabase
                .from('flashcards')
                .select('*')
                .eq('student_course_id', courseId)
                .order('created_at', { ascending: false }); // Newest first

            if (cardData) {
                setFlashcards(cardData);
                // Group into "Decks" based on creation time (within 1 min window) or just batch
                // For simplicity, let's group by Day + Hour, or simple distinct batch if we tracked it.
                // Since we don't have a batch ID, we'll simulate decks by date.
                // Or better: just ONE "All Cards" deck and maybe "Recent" decks if we had batch IDs.
                // The user asked for "list of flashcard decks".
                // We'll synthesise decks by grouping cards created close to each other.

                const groups: Record<string, any[]> = {};
                cardData.forEach(card => {
                    // Group by 5-minute window to capture a "session"
                    const date = new Date(card.created_at);
                    date.setSeconds(0);
                    date.setMilliseconds(0);
                    const minutes = date.getMinutes();
                    date.setMinutes(minutes - (minutes % 5)); // Round to nearest 5 min
                    const key = date.toISOString();
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(card);
                });

                const computedDecks: FlashcardDeck[] = Object.entries(groups).map(([dateIso, cards]) => ({
                    id: dateIso,
                    date: dateIso,
                    count: cards.length,
                    bookmarkedCount: cards.filter((c: any) => c.is_bookmarked).length,
                    reviewedCount: cards.filter((c: any) => c.review_count > 0).length,
                    sourceIndexes: [], // We can't easily retroactively know source indexes without DB change, leave empty for now
                    cardIds: cards.map((c: any) => c.id)
                })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setDecks(computedDecks);
            }
        };
        loadData();
    }, [courseId, supabase]);

    // MathJax re-render
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).MathJax) {
            setTimeout(() => {
                (window as any).MathJax.typesetPromise().catch((err: any) => console.log('MathJax error:', err));
            }, 100);
        }
    }, [currentIndex, isFlipped, showExplanation, flashcards, activeDeck]);

    const handleToggleMaterial = (id: string) => {
        if (selectedMaterialIds.includes(id)) {
            setSelectedMaterialIds(selectedMaterialIds.filter(i => i !== id));
        } else {
            setSelectedMaterialIds([...selectedMaterialIds, id]);
        }
    };

    const getSourceIndex = (materialId: string) => {
        const idx = materials.findIndex(m => m.id === materialId);
        return idx !== -1 ? materials.length - idx : null;
    };

    const handleGenerate = async () => {
        if (selectedMaterialIds.length === 0) return;

        const taskId = uuidv4();
        const sourceIndexes = selectedMaterialIds.map(id => getSourceIndex(id)).filter(Boolean) as number[];

        addTask({
            id: taskId,
            type: 'flashcard',
            status: 'processing',
            progress: 10,
            message: `Generating flashcards from #${sourceIndexes.join(', #')}...`,
            courseId,
        });

        try {
            updateTask(taskId, { progress: 30, message: 'Analyzing materials...' });
            const result = await generateFlashcards(courseId, selectedMaterialIds);

            if (result.success) {
                updateTask(taskId, { status: 'completed', progress: 100, message: 'Flashcards ready!' });
                // Refresh data
                const { data } = await supabase
                    .from('flashcards')
                    .select('*')
                    .eq('student_course_id', courseId)
                    .order('created_at', { ascending: false });

                if (data) {
                    setFlashcards(data);
                    // Re-process decks (copy-paste of logic above, ideally refactor to function)
                    const groups: Record<string, any[]> = {};
                    data.forEach(card => {
                        const date = new Date(card.created_at);
                        date.setSeconds(0);
                        date.setMilliseconds(0);
                        const minutes = date.getMinutes();
                        date.setMinutes(minutes - (minutes % 5));
                        const key = date.toISOString();
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(card);
                    });
                    const computedDecks = Object.entries(groups).map(([dateIso, cards]) => ({
                        id: dateIso,
                        date: dateIso,
                        count: cards.length,
                        bookmarkedCount: cards.filter((c: any) => c.is_bookmarked).length,
                        reviewedCount: cards.filter((c: any) => c.review_count > 0).length,
                        sourceIndexes: [],
                        cardIds: cards.map((c: any) => c.id)
                    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setDecks(computedDecks);
                }
            } else {
                updateTask(taskId, { status: 'failed', message: result.error || 'Generation failed' });
            }
        } catch (error: any) {
            console.error(error);
            updateTask(taskId, { status: 'failed', message: error.message || 'Generation failed' });
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
        if (!isFlipped && activeCards[currentIndex]) {
            markAsDone(activeCards[currentIndex].id);
        }
        setIsFlipped(!isFlipped);
    };

    const getDeckCards = (deckId: string) => {
        // Re-construct deck from time window logic
        // This is a bit fragile without a real Deck ID in DB, but works for "UI grouping"
        const deckDate = new Date(deckId);
        return flashcards.filter(c => {
            const cDate = new Date(c.created_at);
            return Math.abs(cDate.getTime() - deckDate.getTime()) < 5 * 60 * 1000; // 5 min window match
        });
    };

    const activeCards = activeDeck
        ? getDeckCards(activeDeck.id).filter(c => {
            if (filter === 'bookmarked') return c.is_bookmarked;
            if (filter === 'done') return c.review_count > 0;
            return true;
        })
        : [];

    const startPractice = (deck: FlashcardDeck) => {
        setActiveDeck(deck);
        setCurrentIndex(0);
        setIsFlipped(false);
        setFilter('all');
    };

    const nextCard = () => {
        setIsFlipped(false);
        setShowExplanation(false);
        if (activeCards.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % activeCards.length);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setShowExplanation(false);
        if (activeCards.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + activeCards.length) % activeCards.length);
    };

    const deleteDeck = async (e: React.MouseEvent, deck: FlashcardDeck) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this deck?")) return;

        const { error } = await supabase
            .from('flashcards')
            .delete()
            .in('id', deck.cardIds);

        if (!error) {
            setFlashcards(prev => prev.filter(c => !deck.cardIds.includes(c.id)));
            setDecks(prev => prev.filter(d => d.id !== deck.id));
        }
    };

    const currentCard = activeCards[currentIndex];

    // Main View
    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT: Material Selection & Generate (Hidden in Practice Mode) */}
            {!activeDeck && (
                <div className="lg:col-span-1 space-y-6">
                    {/* Material Selector */}
                    <div className="bg-card-bg border border-card-border rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-foreground/70 flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                Select Source Material
                            </h3>
                            <span className="text-xs text-foreground/40">
                                {selectedMaterialIds.length} selected
                            </span>
                        </div>

                        {materials.length === 0 ? (
                            <p className="text-sm text-foreground/40">No materials found. Upload PDFs in the Content Engine first.</p>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {materials.map((m, idx) => {
                                    const isSelected = selectedMaterialIds.includes(m.id);
                                    const visualIndex = materials.length - idx;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => handleToggleMaterial(m.id)}
                                            disabled={isGenerating}
                                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 group ${isSelected
                                                ? 'bg-primary/10 border-primary/50 text-foreground'
                                                : 'bg-card-bg border-card-border text-foreground/60 hover:bg-foreground/5'
                                                } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-foreground/10 text-foreground/40'}`}>
                                                #{visualIndex}
                                            </div>
                                            <span className="truncate text-sm font-medium flex-1">{m.title}</span>
                                            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || selectedMaterialIds.length === 0}
                        className="w-full py-4 rounded-2xl bg-foreground text-background font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Generate Deck
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* RIGHT: Decks or Practice */}
            <div className={activeDeck ? "lg:col-span-3" : "lg:col-span-2"}>
                {!activeDeck ? (
                    /* DECK LIST view */
                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80">
                            <Brain className="w-5 h-5" />
                            Flashcard Decks
                        </h3>

                        {decks.length === 0 ? (
                            <div className="h-[400px] border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30">
                                <Brain className="w-10 h-10 mb-4 opacity-50" />
                                <p>No flashcards yet.</p>
                                <p className="text-sm">Select materials and generate a deck.</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {decks.map((deck, i) => (
                                    <div
                                        key={deck.id}
                                        onClick={() => startPractice(deck)}
                                        className="group relative bg-card-bg border border-card-border rounded-2xl p-6 text-left transition-all hover:border-primary/50 hover:-translate-y-1 cursor-pointer"
                                    >
                                        <div className="absolute top-4 right-4 text-foreground/20 group-hover:text-primary/40 transition-colors">
                                            <Brain className="w-8 h-8" />
                                        </div>

                                        <h4 className="font-bold text-lg text-foreground mb-1">
                                            Deck #{decks.length - i}
                                        </h4>
                                        <p className="text-xs text-foreground/40 flex items-center gap-1 mb-4">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(deck.date).toLocaleString()}
                                        </p>

                                        <div className="flex items-center gap-4 text-sm text-foreground/60">
                                            <span className="flex items-center gap-1 bg-foreground/5 px-2 py-1 rounded-md">
                                                <Layers className="w-3 h-3" /> {deck.count} cards
                                            </span>
                                            {deck.bookmarkedCount > 0 && (
                                                <span className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-md">
                                                    <Bookmark className="w-3 h-3" /> {deck.bookmarkedCount}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex-1 h-1 bg-foreground/5 rounded-full overflow-hidden mr-4">
                                                <div
                                                    className="h-full bg-green-500/50"
                                                    style={{ width: `${(deck.reviewedCount / deck.count) * 100}%` }}
                                                />
                                            </div>
                                            <button
                                                onClick={(e) => deleteDeck(e, deck)}
                                                className="p-1.5 rounded-lg text-foreground/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                title="Delete Deck"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* PRACTICE MODE view */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                        {/* LEFT: Question List Sidebar */}
                        <div className="lg:col-span-1 bg-card-bg border border-card-border rounded-2xl flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-card-border bg-foreground/5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold flex items-center gap-2 text-foreground/80">
                                        <PlayCircle className="w-4 h-4 text-primary" />
                                        Questions ({activeCards.length})
                                    </h3>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => setActiveDeck(null)}
                                        className="px-3 py-1 rounded-full border border-card-border text-foreground/40 hover:text-foreground hover:bg-foreground/5 text-xs flex items-center gap-1 transition-all"
                                    >
                                        <ArrowLeft className="w-3 h-3" /> Back
                                    </button>
                                    {(['all', 'bookmarked', 'done'] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => { setFilter(f); setCurrentIndex(0); setIsFlipped(false); setShowExplanation(false); }}
                                            className={`text-[10px] px-2 py-1 rounded-full border transition-all flex-1 text-center ${filter === f
                                                ? 'bg-primary/10 border-primary/50 text-foreground'
                                                : 'border-card-border text-foreground/40 hover:text-foreground'}`}
                                        >
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                {activeCards.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-foreground/30 p-4 text-center">
                                        <p className="text-sm">No cards match filter.</p>
                                    </div>
                                ) : (
                                    activeCards.map((card, idx) => {
                                        const isActive = idx === currentIndex;
                                        return (
                                            <button
                                                key={card.id}
                                                onClick={() => { setCurrentIndex(idx); setIsFlipped(false); setShowExplanation(false); }}
                                                className={`w-full text-left p-3 rounded-xl border transition-all flex gap-3 ${isActive
                                                    ? 'bg-primary/10 border-primary/50'
                                                    : 'bg-transparent border-transparent hover:bg-foreground/5'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-foreground/10 text-foreground/40'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm truncate ${isActive ? 'text-foreground font-medium' : 'text-foreground/60'}`}>
                                                        {card.front}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {card.is_bookmarked && <Bookmark className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                                        {card.review_count > 0 && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Flashcard Interaction */}
                        <div className="lg:col-span-2 flex flex-col h-full">
                            {activeCards.length > 0 && currentCard ? (
                                <div className="flex-1 flex flex-col">
                                    {/* Card Container */}
                                    <div className="flex-1 flex items-center justify-center mb-6">
                                        <div
                                            className="cursor-pointer w-full max-w-xl aspect-[3/2]"
                                            onClick={handleFlip}
                                            style={{ perspective: '1000px' }}
                                        >
                                            <motion.div
                                                className="relative w-full h-full"
                                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                                                style={{ transformStyle: 'preserve-3d' }}
                                            >
                                                {/* Front */}
                                                <div
                                                    className="absolute inset-0 rounded-2xl bg-card-bg border border-card-border p-8 flex flex-col items-center justify-center text-center shadow-xl"
                                                    style={{ backfaceVisibility: 'hidden' }}
                                                >
                                                    <div className="absolute top-4 left-4">
                                                        <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                                                            {currentCard.type || "General"}
                                                        </span>
                                                    </div>
                                                    {currentCard.review_count > 0 && (
                                                        <div className="absolute top-4 right-4 text-green-400 text-xs flex items-center gap-1">
                                                            <Check className="w-3 h-3" /> Reviewed
                                                        </div>
                                                    )}
                                                    <div className="flex-1 flex items-center justify-center">
                                                        <div className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
                                                            {currentCard.front}
                                                        </div>
                                                    </div>
                                                    <p className="text-foreground/30 text-xs animate-pulse mt-4">Click to reveal</p>
                                                </div>

                                                {/* Back */}
                                                <div
                                                    className="absolute inset-0 rounded-2xl bg-card-bg border border-green-500/30 p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-green-500/10"
                                                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                                >
                                                    <div className="absolute top-4 left-4">
                                                        <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                                                            Answer
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-center w-full overflow-y-auto custom-scrollbar">
                                                        <div className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
                                                            {currentCard.back}
                                                        </div>
                                                    </div>
                                                    <p className="text-foreground/30 text-xs mt-4">Click to flip back</p>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-center gap-4">
                                            <button
                                                onClick={() => { prevCard(); playSound('click'); }}
                                                className="w-12 h-12 rounded-xl bg-card-bg border border-card-border flex items-center justify-center hover:bg-foreground/5 transition-all disabled:opacity-50"
                                                disabled={activeCards.length <= 1}
                                            >
                                                <ArrowLeft className="w-5 h-5 text-foreground" />
                                            </button>

                                            <button
                                                onClick={() => { handleFlip(); playSound('click'); }}
                                                className="px-8 py-3 rounded-xl bg-foreground text-background font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                                            >
                                                <RefreshCw className="w-4 h-4" /> Flip Card
                                            </button>

                                            <button
                                                onClick={() => { setShowExplanation(!showExplanation); playSound('click'); }}
                                                className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border ${showExplanation ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-card-bg border-card-border text-foreground/60 hover:bg-foreground/5'}`}
                                            >
                                                <Brain className="w-4 h-4" /> Explain
                                            </button>

                                            <button
                                                onClick={() => { nextCard(); playSound('click'); }}
                                                className="w-12 h-12 rounded-xl bg-card-bg border border-card-border flex items-center justify-center hover:bg-foreground/5 transition-all disabled:opacity-50"
                                                disabled={activeCards.length <= 1}
                                            >
                                                <ArrowLeft className="w-5 h-5 text-foreground rotate-180" />
                                            </button>
                                        </div>

                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => { toggleBookmark(currentCard.id, currentCard.is_bookmarked); playSound('click'); }}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm ${currentCard.is_bookmarked ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'border-card-border text-foreground/40 hover:text-foreground'}`}
                                            >
                                                <Bookmark className={`w-4 h-4 ${currentCard.is_bookmarked ? 'fill-yellow-400' : ''}`} />
                                                {currentCard.is_bookmarked ? 'Bookmarked' : 'Bookmark for Review'}
                                            </button>
                                        </div>

                                        {/* Explanation */}
                                        <AnimatePresence>
                                            {showExplanation && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center relative">
                                                        <button
                                                            onClick={() => setShowExplanation(false)}
                                                            className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded-full"
                                                        >
                                                            <ArrowLeft className="w-4 h-4 rotate-45" />
                                                        </button>
                                                        <h4 className="text-green-400 font-bold mb-2 flex items-center justify-center gap-2">
                                                            <Sparkles className="w-4 h-4" /> AI Explanation
                                                        </h4>
                                                        <p className="text-foreground/80 leading-relaxed text-sm">
                                                            {currentCard.explanation || "No explanation available."}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-foreground/30">
                                    No cards available.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
