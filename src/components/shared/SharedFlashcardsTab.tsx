"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Bookmark,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Layers,
  PlayCircle,
  Sparkles,
} from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  type?: string;
  is_bookmarked: boolean;
  review_count: number;
  created_at: string;
}

interface FlashcardDeck {
  id: string;
  date: string;
  count: number;
  bookmarkedCount: number;
  reviewedCount: number;
  cards: Flashcard[];
}

function groupIntoDecks(flashcards: Flashcard[]): FlashcardDeck[] {
  const groups: Record<string, Flashcard[]> = {};
  flashcards.forEach((card) => {
    const date = new Date(card.created_at);
    date.setSeconds(0);
    date.setMilliseconds(0);
    const minutes = date.getMinutes();
    date.setMinutes(minutes - (minutes % 5));
    const key = date.toISOString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  });

  return Object.entries(groups)
    .map(([dateIso, cards]) => ({
      id: dateIso,
      date: dateIso,
      count: cards.length,
      bookmarkedCount: cards.filter((c) => c.is_bookmarked).length,
      reviewedCount: cards.filter((c) => c.review_count > 0).length,
      cards,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function SharedFlashcardsTab({
  flashcards,
}: {
  flashcards: Flashcard[];
}) {
  const decks = groupIntoDecks(flashcards);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [filter, setFilter] = useState<"all" | "bookmarked">("all");

  const activeCards = activeDeck
    ? activeDeck.cards.filter((c) => {
        if (filter === "bookmarked") return c.is_bookmarked;
        return true;
      })
    : [];

  const currentCard = activeCards[currentIndex];

  const startPractice = (deck: FlashcardDeck) => {
    setActiveDeck(deck);
    setCurrentIndex(0);
    setIsFlipped(false);
    setFilter("all");
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

  return (
    <div>
      {!activeDeck ? (
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80">
            <Brain className="w-5 h-5" />
            Flashcard Decks
          </h3>

          {decks.length === 0 ? (
            <div className="h-[300px] border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30">
              <Brain className="w-10 h-10 mb-4 opacity-50" />
              <p>No flashcards yet.</p>
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
                  <div className="mt-4 h-1 bg-foreground/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500/50"
                      style={{
                        width: `${(deck.reviewedCount / deck.count) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* PRACTICE MODE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
          {/* LEFT: Question List */}
          <div className="lg:col-span-1 bg-card-bg border border-card-border rounded-2xl flex flex-col overflow-hidden max-h-[600px]">
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
                {(["all", "bookmarked"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      setCurrentIndex(0);
                      setIsFlipped(false);
                      setShowExplanation(false);
                    }}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-all flex-1 text-center ${
                      filter === f
                        ? "bg-primary/10 border-primary/50 text-foreground"
                        : "border-card-border text-foreground/40 hover:text-foreground"
                    }`}
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
                      onClick={() => {
                        setCurrentIndex(idx);
                        setIsFlipped(false);
                        setShowExplanation(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex gap-3 ${
                        isActive
                          ? "bg-primary/10 border-primary/50"
                          : "bg-transparent border-transparent hover:bg-foreground/5"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-foreground/10 text-foreground/40"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm truncate ${
                            isActive
                              ? "text-foreground font-medium"
                              : "text-foreground/60"
                          }`}
                        >
                          {card.front}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {card.is_bookmarked && (
                            <Bookmark className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          )}
                          {card.review_count > 0 && (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Flashcard Interaction */}
          <div className="lg:col-span-2 flex flex-col">
            {activeCards.length > 0 && currentCard ? (
              <div className="flex-1 flex flex-col">
                {/* Card */}
                <div className="flex-1 flex items-center justify-center mb-6">
                  <div
                    className="cursor-pointer w-full max-w-xl aspect-[3/2]"
                    onClick={() => setIsFlipped(!isFlipped)}
                    style={{ perspective: "1000px" }}
                  >
                    <motion.div
                      className="relative w-full h-full"
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{
                        duration: 0.6,
                        type: "spring",
                        stiffness: 100,
                      }}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* Front */}
                      <div
                        className="absolute inset-0 rounded-2xl bg-card-bg border border-card-border p-8 flex flex-col items-center justify-center text-center shadow-xl"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <div className="absolute top-4 left-4">
                          <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                            {currentCard.type || "General"}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
                            {currentCard.front}
                          </div>
                        </div>
                        <p className="text-foreground/30 text-xs animate-pulse mt-4">
                          Click to reveal
                        </p>
                      </div>

                      {/* Back */}
                      <div
                        className="absolute inset-0 rounded-2xl bg-card-bg border border-green-500/30 p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-green-500/10"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
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
                        <p className="text-foreground/30 text-xs mt-4">
                          Click to flip back
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={prevCard}
                      className="w-12 h-12 rounded-xl bg-card-bg border border-card-border flex items-center justify-center hover:bg-foreground/5 transition-all disabled:opacity-50"
                      disabled={activeCards.length <= 1}
                    >
                      <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>

                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="px-8 py-3 rounded-xl bg-foreground text-background font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
                    >
                      <RefreshCw className="w-4 h-4" /> Flip Card
                    </button>

                    <button
                      onClick={() => setShowExplanation(!showExplanation)}
                      className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border ${
                        showExplanation
                          ? "bg-green-500/20 border-green-500/50 text-green-400"
                          : "bg-card-bg border-card-border text-foreground/60 hover:bg-foreground/5"
                      }`}
                    >
                      <Brain className="w-4 h-4" /> Explain
                    </button>

                    <button
                      onClick={nextCard}
                      className="w-12 h-12 rounded-xl bg-card-bg border border-card-border flex items-center justify-center hover:bg-foreground/5 transition-all disabled:opacity-50"
                      disabled={activeCards.length <= 1}
                    >
                      <ArrowLeft className="w-5 h-5 text-foreground rotate-180" />
                    </button>
                  </div>

                  {/* Explanation */}
                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
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
  );
}
