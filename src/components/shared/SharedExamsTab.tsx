"use client";

import { useState } from "react";
import { FileText, History, Play, ChevronDown, ChevronUp } from "lucide-react";

interface SavedExam {
  id: string;
  title: string;
  exam_data: any;
  score_data: any;
  created_at: string;
}

export function SharedExamsTab({ exams }: { exams: SavedExam[] }) {
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80">
        <History className="w-5 h-5" />
        Generated Exams
      </h3>

      {exams.length === 0 ? (
        <div className="h-[300px] border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center text-foreground/30">
          <FileText className="w-10 h-10 mb-4 opacity-50" />
          <p>No exams generated yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="p-4 rounded-xl bg-card-bg border border-card-border hover:border-primary/50 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold truncate pr-4">{exam.title}</h4>
              </div>
              <div className="text-sm text-foreground/60 mb-3">
                {new Date(exam.created_at).toLocaleDateString()}
              </div>
              {exam.score_data && (
                <div className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500 inline-block font-medium">
                  Score: {exam.score_data.points}/{exam.score_data.maxPoints} (
                  {Math.round(
                    (exam.score_data.points / exam.score_data.maxPoints) * 100
                  )}
                  %)
                </div>
              )}
              {exam.exam_data?.questions && (
                <button
                  onClick={() =>
                    setExpandedExamId(
                      expandedExamId === exam.id ? null : exam.id
                    )
                  }
                  className="mt-3 flex items-center gap-2 text-primary text-sm font-medium hover:underline"
                >
                  {expandedExamId === exam.id ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> Hide Questions
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> View{" "}
                      {exam.exam_data.questions.length} Questions
                    </>
                  )}
                </button>
              )}

              {/* Expanded Questions */}
              {expandedExamId === exam.id && exam.exam_data?.questions && (
                <div className="mt-4 space-y-3 border-t border-card-border pt-4">
                  {exam.exam_data.questions.map(
                    (q: any, idx: number) => (
                      <div
                        key={q.id || idx}
                        className="p-3 rounded-lg bg-foreground/5 text-sm"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-foreground/40">
                            Q{idx + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                              q.type === "mcq"
                                ? "bg-blue-500/20 text-blue-400"
                                : q.type === "true_false"
                                ? "bg-purple-500/20 text-purple-400"
                                : q.type === "complete"
                                ? "bg-green-500/20 text-green-400"
                                : q.type === "essay"
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-pink-500/20 text-pink-400"
                            }`}
                          >
                            {q.type?.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-foreground/80">
                          {q.question_text || q.question}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
