"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGeneration } from "@/context/GenerationContext";
import { MaterialSelector } from "./MaterialSelector";
import { v4 as uuidv4 } from "uuid";
import {
    generateExam,
    evaluateAnswer,
    saveExam,
    getExams,
    deleteExam,
    buildFigurePrompt,
    saveFigureImage,
    getFigureImages,
    ExamOptions,
    ExamResult,
    Question,
    EvaluationResult,
} from "@/services/geminiExamService";
import { generateInfographic } from "@/lib/nanoBanana";
import {
    Download,
    RotateCcw,
    CheckCircle2,
    CheckCircle,
    XCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Trash2,
    History,
    Play,
    Image as ImageIcon,
    ArrowLeft,
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface ExamGeneratorTabProps {
    courseId: string;
}

type UserAnswers = Record<number, string | boolean | Record<string, string>>;

export function ExamGeneratorTab({ courseId }: ExamGeneratorTabProps) {
    const supabase = createClient();
    const { addTask, updateTask, tasks } = useGeneration();

    // Material selection
    const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

    // Exam options
    const [options, setOptions] = useState<ExamOptions>({
        difficulty: "medium",
        study_type: "apply",
        mcq_count: 3,
        mcq_options: 4,
        true_false_count: 2,
        complete_count: 2,
        essay_count: 2,
        figure_count: 1,
    });

    // Generation state
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState("");
    const [error, setError] = useState("");
    const [examResults, setExamResults] = useState<ExamResult | null>(null);

    // Quiz state
    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [submitted, setSubmitted] = useState(false);
    const [showExplanations, setShowExplanations] = useState(false);
    const [evaluations, setEvaluations] = useState<Record<number, EvaluationResult>>({});
    const [evaluatingIds, setEvaluatingIds] = useState<Record<number, boolean>>({});

    // Config collapsed state
    const [configExpanded, setConfigExpanded] = useState(true);

    // View mode

    // Saved exams state
    const [savedExams, setSavedExams] = useState<any[]>([]);
    const [loadingExams, setLoadingExams] = useState(false);

    // Figure image state
    const [figureImages, setFigureImages] = useState<Record<number, string>>({});
    const [figureGenerating, setFigureGenerating] = useState<Record<number, boolean>>({});

    // Check if exam generation is already running
    const activeExamTask = tasks.find(
        t => t.type === 'quiz' && t.courseId === courseId && (t.status === 'pending' || t.status === 'processing')
    );

    // Fetch saved exams
    const fetchSavedExams = useCallback(async () => {
        setLoadingExams(true);
        try {
            const exams = await getExams(courseId);
            setSavedExams(exams || []);
        } catch (error) {
            console.error("Failed to fetch exams:", error);
        } finally {
            setLoadingExams(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchSavedExams();
    }, [fetchSavedExams]);

    // Generate figure images for all figure-type questions
    const generateFigureImagesForExam = async (exam: ExamResult, examId?: string) => {
        const figureQuestions = exam.questions.filter(
            (q) => q.type === "figure" && q.figure_description
        );

        if (figureQuestions.length === 0) return;

        // Mark all as generating
        const generatingState: Record<number, boolean> = {};
        figureQuestions.forEach((q) => (generatingState[q.id] = true));
        setFigureGenerating((prev) => ({ ...prev, ...generatingState }));

        // Generate in parallel
        await Promise.allSettled(
            figureQuestions.map(async (q) => {
                try {
                    // Stage 1: Build the filled Nano Banana prompt via Gemini text
                    const filledPrompt = await buildFigurePrompt(q.figure_description!);

                    // Stage 2: Generate the image via /api/generate
                    const imageUrl = await generateInfographic({
                        prompt: filledPrompt,
                        aspectRatio: "1:1",
                    });

                    setFigureImages((prev) => ({ ...prev, [q.id]: imageUrl }));

                    // Save to database if we have an exam ID
                    if (examId) {
                        try {
                            await saveFigureImage(examId, q.id, imageUrl, filledPrompt);
                        } catch (saveErr) {
                            console.error("Failed to save figure image to DB:", saveErr);
                        }
                    }
                } catch (err) {
                    console.error(`Failed to generate figure image for Q${q.id}:`, err);
                } finally {
                    setFigureGenerating((prev) => ({ ...prev, [q.id]: false }));
                }
            })
        );
    };

    // Load saved exam
    const handleLoadExam = async (exam: any) => {
        setExamResults(exam.exam_data);
        setUserAnswers({});
        setSubmitted(false);
        setEvaluations({});
        setShowExplanations(false);
        setFigureImages({});
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Load saved figure images from database
        try {
            const figures = await getFigureImages(exam.id);
            const imageMap: Record<number, string> = {};
            figures.forEach((f) => (imageMap[f.question_id] = f.image_url));
            setFigureImages(imageMap);
        } catch (err) {
            console.error("Failed to load figure images:", err);
        }
    };

    // Delete exam
    const handleDeleteExam = async (examId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this exam?")) return;
        try {
            await deleteExam(examId);
            await fetchSavedExams();
        } catch (error) {
            console.error("Failed to delete exam", error);
            alert("Failed to delete exam.");
        }
    };

    // Render LaTeX
    const renderLatex = useCallback((text: string | undefined): React.ReactNode => {
        if (!text) return "";

        try {
            let processedText = String(text);

            // Handle double-escaped backslashes
            processedText = processedText.replace(/\\\\/g, "\\");

            // Handle block LaTeX ($$...$$)
            processedText = processedText.replace(
                /\$\$([\s\S]*?)\$\$/g,
                (match, latex) => {
                    try {
                        return katex.renderToString(latex.trim(), {
                            displayMode: true,
                            throwOnError: false,
                            trust: true,
                        });
                    } catch (e) {
                        return match;
                    }
                }
            );

            // Handle inline LaTeX ($...$)
            processedText = processedText.replace(
                /\$([^\$]+?)\$/g,
                (match, latex) => {
                    try {
                        return katex.renderToString(latex.trim(), {
                            displayMode: false,
                            throwOnError: false,
                            trust: true,
                        });
                    } catch (e) {
                        return match;
                    }
                }
            );

            return <span dangerouslySetInnerHTML={{ __html: processedText }} />;
        } catch (e) {
            return text;
        }
    }, []);

    // Generate exam
    const handleGenerateExam = async () => {
        if (selectedMaterialIds.length === 0) {
            setError("Please select at least one PDF file");
            return;
        }

        const taskId = uuidv4();

        setLoading(true);
        setError("");
        setExamResults(null);
        setUserAnswers({});
        setSubmitted(false);
        setEvaluations({});

        // Add task to global context
        addTask({
            id: taskId,
            type: 'quiz',
            status: 'processing',
            progress: 10,
            message: `Generating exam from ${selectedMaterialIds.length} file(s)...`,
            courseId,
        });

        try {
            setProgress("Fetching materials from knowledge base...");
            updateTask(taskId, { progress: 20, message: "Fetching materials..." });

            // Fetch materials from Supabase
            const { data: materials, error: fetchError } = await supabase
                .from("course_materials")
                .select("id, title, content_url, type")
                .in("id", selectedMaterialIds);

            if (fetchError || !materials) {
                throw new Error("Failed to fetch materials from knowledge base");
            }

            setProgress("Downloading files...");
            updateTask(taskId, { progress: 40, message: "Downloading files..." });

            // Download each file and convert to base64
            const filesData = await Promise.all(
                materials.map(async (m) => {
                    const response = await fetch(m.content_url);
                    const blob = await response.blob();
                    const arrayBuffer = await blob.arrayBuffer();

                    const base64 = btoa(
                        new Uint8Array(arrayBuffer).reduce(
                            (data, byte) => data + String.fromCharCode(byte),
                            ""
                        )
                    );

                    return {
                        filename: m.title.endsWith(".pdf") ? m.title : `${m.title}.pdf`,
                        content: base64,
                        mimeType: "application/pdf",
                    };
                })
            );

            setProgress("Generating exam with AI...");
            updateTask(taskId, { progress: 60, message: "Generating exam with AI..." });

            const result = await generateExam(filesData, options);

            setExamResults(result);
            setFigureImages({});
            setProgress("");
            updateTask(taskId, { status: 'completed', progress: 100, message: "Exam ready!" });

            // Auto-save the exam
            try {
                const now = new Date();
                const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                const topic = result.quiz_metadata.detected_content_focus?.[0] || result.quiz_metadata.title;
                const diff = options.difficulty.charAt(0).toUpperCase() + options.difficulty.slice(1);
                const examTitle = `${topic} — ${diff} · ${dateStr}, ${timeStr}`;

                const savedExamId = await saveExam(courseId, examTitle, result);
                await fetchSavedExams();

                // Trigger figure image generation with the saved exam ID so images get linked
                generateFigureImagesForExam(result, savedExamId);
            } catch (saveErr) {
                console.error("Auto-save failed:", saveErr);
                // Still trigger figure generation without exam ID
                generateFigureImagesForExam(result);
            }
        } catch (err: any) {
            console.error("Error generating exam:", err);
            setError(err.message || "Failed to generate exam. Please try again.");
            updateTask(taskId, { status: 'failed', message: err.message || "Generation failed" });
        } finally {
            setLoading(false);
        }
    };

    // Handle answer change
    const handleAnswerChange = (
        questionId: number,
        answer: string | boolean | Record<string, string>
    ) => {
        if (submitted) return;
        setUserAnswers((prev) => ({
            ...prev,
            [questionId]: answer,
        }));
    };

    // Check if answer is correct
    const isCorrect = (question: Question): boolean | null => {
        const userAnswer = userAnswers[question.id];
        if (userAnswer === undefined) return null;

        if (question.type === "mcq") {
            return userAnswer === question.correct_answer;
        } else if (question.type === "true_false") {
            return userAnswer === question.correct_answer;
        } else if (question.type === "complete" || question.type === "essay") {
            const evaluation = evaluations[question.id];
            if (evaluation) {
                return evaluation.evaluation_summary?.status === "correct";
            }
            if (question.type === "complete") {
                const acceptedAnswers = question.answers || [question.correct_answer];
                return acceptedAnswers.some(
                    (ans) =>
                        String(userAnswer).toLowerCase().trim() ===
                        String(ans).toLowerCase().trim()
                );
            }
            return null;
        } else if (question.type === "figure") {
            const labels = question.labels_to_identify || [];
            const expectedLabels = question.expected_labels || {};

            if (labels.length > 0 && typeof userAnswer === "object") {
                const allCorrect = labels.every(
                    (labelId) =>
                        (userAnswer as Record<string, string>)[labelId]
                            ?.toLowerCase()
                            .trim() === expectedLabels[labelId]?.toLowerCase().trim()
                );
                return allCorrect;
            }
            const evaluation = evaluations[question.id];
            if (evaluation) {
                return evaluation.evaluation_summary?.status === "correct";
            }
            return null;
        }
        return false;
    };

    // Calculate score
    const calculateScore = () => {
        if (!examResults?.questions)
            return { correct: 0, total: 0, points: 0, maxPoints: 0 };

        let totalPoints = 0;
        let maxPoints = 0;
        let correct = 0;

        examResults.questions.forEach((q) => {
            const qMaxPoints = q.rubric?.total_points || 1;
            maxPoints += qMaxPoints;

            const evaluation = evaluations[q.id];
            if (evaluation?.evaluation_summary) {
                totalPoints += evaluation.evaluation_summary.total_score_awarded || 0;
                if (evaluation.evaluation_summary.status === "correct") correct++;
            } else if (isCorrect(q) === true) {
                totalPoints += qMaxPoints;
                correct++;
            }
        });

        return {
            correct,
            total: examResults.questions.length,
            points: totalPoints,
            maxPoints,
        };
    };

    // AI evaluation
    const handleEvaluate = async (question: Question) => {
        const userAnswer = userAnswers[question.id];
        if (!userAnswer || (typeof userAnswer === "string" && !userAnswer.trim())) {
            return;
        }

        setEvaluatingIds((prev) => ({ ...prev, [question.id]: true }));

        try {
            const evaluation = await evaluateAnswer(
                question,
                typeof userAnswer === "string" ? userAnswer : JSON.stringify(userAnswer)
            );
            setEvaluations((prev) => ({
                ...prev,
                [question.id]: evaluation,
            }));
        } catch (error: any) {
            console.error("Evaluation error:", error);
        } finally {
            setEvaluatingIds((prev) => ({ ...prev, [question.id]: false }));
        }
    };

    // Submit answers
    const handleSubmit = () => {
        setSubmitted(true);
        setShowExplanations(true);
    };

    // Reset quiz
    const handleReset = () => {
        setUserAnswers({});
        setSubmitted(false);
        setShowExplanations(false);
        setEvaluations({});
    };

    // Download JSON
    const downloadJSON = () => {
        if (!examResults) return;
        const dataStr = JSON.stringify(examResults, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `exam-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Question type label
    const getQuestionTypeLabel = (type: string) => {
        switch (type) {
            case "mcq":
                return "Multiple Choice";
            case "true_false":
                return "True / False";
            case "complete":
                return "Fill in the Blank";
            case "essay":
                return "Essay";
            case "figure":
                return "Figure / Diagram";
            default:
                return type;
        }
    };

    // Render MCQ
    const renderMCQ = (question: Question) => {
        const userAnswer = userAnswers[question.id];

        return (
            <div className="space-y-2 mt-4">
                {question.options?.map((option) => {
                    let optionClass =
                        "w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3";

                    if (submitted) {
                        if (option.label === question.correct_answer) {
                            optionClass += " bg-green-500/20 border-green-500/50";
                        } else if (
                            option.label === userAnswer &&
                            option.label !== question.correct_answer
                        ) {
                            optionClass += " bg-red-500/20 border-red-500/50";
                        } else {
                            optionClass += " bg-card-bg border-card-border opacity-60";
                        }
                    } else if (option.label === userAnswer) {
                        optionClass += " bg-primary/20 border-primary/50";
                    } else {
                        optionClass +=
                            " bg-card-bg border-card-border hover:bg-accent/30 cursor-pointer";
                    }

                    return (
                        <button
                            key={option.label}
                            className={optionClass}
                            onClick={() => handleAnswerChange(question.id, option.label)}
                            disabled={submitted}
                        >
                            <span className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold shrink-0">
                                {option.label}
                            </span>
                            <span className="flex-1 text-left">{renderLatex(option.text)}</span>
                        </button>
                    );
                })}
            </div>
        );
    };

    // Render True/False
    const renderTrueFalse = (question: Question) => {
        const userAnswer = userAnswers[question.id];

        const getButtonClass = (value: boolean) => {
            let className =
                "flex-1 py-3 px-6 rounded-xl border font-medium transition-all";

            if (submitted) {
                if (value === question.correct_answer) {
                    className += " bg-green-500/20 border-green-500/50";
                } else if (value === userAnswer && value !== question.correct_answer) {
                    className += " bg-red-500/20 border-red-500/50";
                } else {
                    className += " bg-card-bg border-card-border opacity-60";
                }
            } else if (value === userAnswer) {
                className += " bg-primary/20 border-primary/50";
            } else {
                className +=
                    " bg-card-bg border-card-border hover:bg-accent/30 cursor-pointer";
            }

            return className;
        };

        return (
            <div className="flex gap-4 mt-4">
                <button
                    className={getButtonClass(true)}
                    onClick={() => handleAnswerChange(question.id, true)}
                    disabled={submitted}
                >
                    True
                </button>
                <button
                    className={getButtonClass(false)}
                    onClick={() => handleAnswerChange(question.id, false)}
                    disabled={submitted}
                >
                    False
                </button>
            </div>
        );
    };

    // Render Complete
    const renderComplete = (question: Question) => {
        const userAnswer = (userAnswers[question.id] as string) || "";
        const evaluation = evaluations[question.id];
        const isEvaluating = evaluatingIds[question.id];

        let inputClass =
            "w-full p-3 rounded-xl bg-card-bg border border-card-border text-foreground";

        if (submitted || evaluation) {
            const status = evaluation?.evaluation_summary?.status;
            if (status === "correct") inputClass += " border-green-500/50";
            else if (status === "partial") inputClass += " border-yellow-500/50";
            else inputClass += " border-red-500/50";
        }

        return (
            <div className="mt-4 space-y-3">
                <input
                    type="text"
                    className={inputClass}
                    placeholder="Type your answer here..."
                    value={userAnswer}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    disabled={submitted && !!evaluation}
                />

                {!evaluation && userAnswer.trim() && (
                    <button
                        className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all flex items-center gap-2"
                        onClick={() => handleEvaluate(question)}
                        disabled={isEvaluating}
                    >
                        {isEvaluating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                        {isEvaluating ? "Evaluating..." : "Evaluate with AI"}
                    </button>
                )}

                {submitted && !evaluation && (
                    <div className="text-sm text-foreground/60">
                        <strong>Accepted answers:</strong>{" "}
                        {(question.answers || [String(question.correct_answer)]).join(", ")}
                    </div>
                )}

                {evaluation && renderEvaluationResult(evaluation)}
            </div>
        );
    };

    // Render Essay
    const renderEssay = (question: Question) => {
        const userAnswer = (userAnswers[question.id] as string) || "";
        const evaluation = evaluations[question.id];
        const isEvaluating = evaluatingIds[question.id];

        let textareaClass =
            "w-full p-3 rounded-xl bg-card-bg border border-card-border text-foreground min-h-[120px] resize-y";

        if (evaluation) {
            const status = evaluation?.evaluation_summary?.status;
            if (status === "correct") textareaClass += " border-green-500/50";
            else if (status === "partial") textareaClass += " border-yellow-500/50";
            else textareaClass += " border-red-500/50";
        }

        return (
            <div className="mt-4 space-y-3">
                <textarea
                    className={textareaClass}
                    placeholder="Write your essay answer here..."
                    value={userAnswer}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    disabled={submitted && !!evaluation}
                />

                {!evaluation && userAnswer.trim() && (
                    <button
                        className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all flex items-center gap-2"
                        onClick={() => handleEvaluate(question)}
                        disabled={isEvaluating}
                    >
                        {isEvaluating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                        {isEvaluating ? "Evaluating with AI..." : "Evaluate with AI"}
                    </button>
                )}

                {evaluation && renderEvaluationResult(evaluation)}
            </div>
        );
    };

    // Render Figure
    const renderFigure = (question: Question) => {
        const figDesc = question.figure_description;
        const labels = question.labels_to_identify || [];
        const expectedLabels = question.expected_labels || {};
        const evaluation = evaluations[question.id];
        const isEvaluating = evaluatingIds[question.id];

        const userLabelAnswers =
            (userAnswers[question.id] as Record<string, string>) || {};

        const handleLabelChange = (labelId: string, value: string) => {
            handleAnswerChange(question.id, {
                ...userLabelAnswers,
                [labelId]: value,
            });
        };

        const figImage = figureImages[question.id];
        const figLoading = figureGenerating[question.id];

        return (
            <div className="mt-4 space-y-4">
                {/* Generated Figure Image */}
                {figLoading && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                        <span className="text-sm text-blue-400 font-medium">Generating figure image...</span>
                    </div>
                )}
                {figImage && (
                    <div className="rounded-xl overflow-hidden border border-foreground/10 max-w-sm mx-auto">
                        <img
                            src={figImage}
                            alt={figDesc?.description || "Exam figure"}
                            className="w-full h-auto"
                        />
                    </div>
                )}

                {/* Label Identification */}
                {labels.length > 0 && (
                    <div className="space-y-2">
                        <strong>Identify the following labels:</strong>
                        <div className="space-y-2">
                            {labels.map((labelId) => (
                                <div key={labelId} className="flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                                        {labelId}
                                    </span>
                                    <input
                                        type="text"
                                        className={`flex-1 p-2 rounded-lg bg-card-bg border ${submitted
                                            ? userLabelAnswers[labelId]?.toLowerCase().trim() ===
                                                expectedLabels[labelId]?.toLowerCase().trim()
                                                ? "border-green-500/50"
                                                : "border-red-500/50"
                                            : "border-card-border"
                                            }`}
                                        placeholder={`What is ${labelId}?`}
                                        value={userLabelAnswers[labelId] || ""}
                                        onChange={(e) => handleLabelChange(labelId, e.target.value)}
                                        disabled={submitted}
                                    />
                                    {submitted && (
                                        <span className="text-sm text-foreground/60">
                                            ({expectedLabels[labelId]})
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Essay-style answer for non-label questions */}
                {labels.length === 0 && (
                    <div className="space-y-3">
                        <textarea
                            className="w-full p-3 rounded-xl bg-card-bg border border-card-border text-foreground min-h-[100px]"
                            placeholder="Describe or answer based on the figure..."
                            value={(userAnswers[question.id] as string) || ""}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            disabled={submitted && !!evaluation}
                        />

                        {!evaluation &&
                            (userAnswers[question.id] as string)?.trim() && (
                                <button
                                    className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all flex items-center gap-2"
                                    onClick={() => handleEvaluate(question)}
                                    disabled={isEvaluating}
                                >
                                    {isEvaluating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    {isEvaluating ? "Evaluating..." : "Evaluate with AI"}
                                </button>
                            )}

                        {evaluation && renderEvaluationResult(evaluation)}
                    </div>
                )}
            </div>
        );
    };

    // Render AI evaluation result
    const renderEvaluationResult = (evaluation: EvaluationResult) => {
        const summary = evaluation.evaluation_summary;
        const breakdown = evaluation.rubric_breakdown;
        const details = evaluation.grading_details;

        const getStatusClass = () => {
            switch (summary?.status) {
                case "correct":
                    return "bg-green-500/20 border-green-500/50";
                case "partial":
                    return "bg-yellow-500/20 border-yellow-500/50";
                case "incorrect":
                    return "bg-red-500/20 border-red-500/50";
                default:
                    return "";
            }
        };

        return (
            <div className={`p-4 rounded-xl border ${getStatusClass()}`}>
                <div className="flex items-center justify-between mb-3">
                    <span className="font-bold flex items-center gap-2">
                        {summary?.status === "correct" && <><CheckCircle2 className="w-5 h-5 text-green-500" /> Correct!</>}
                        {summary?.status === "partial" && "⚠️ Partially Correct"}
                        {summary?.status === "incorrect" && "❌ Incorrect"}
                    </span>
                    <span className="text-sm">
                        {summary?.total_score_awarded} / {summary?.max_possible_points} pts (
                        {summary?.percentage}%)
                    </span>
                </div>

                {breakdown && breakdown.length > 0 && (
                    <div className="mb-3">
                        <strong className="text-sm">Rubric Breakdown:</strong>
                        <div className="mt-2 space-y-1">
                            {breakdown.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`text-sm p-2 rounded-lg ${item.met ? "bg-green-500/10" : "bg-red-500/10"
                                        }`}
                                >
                                    <div className="flex justify-between">
                                        <span>{item.criterion_name}</span>
                                        <span>
                                            {item.points_earned} / {item.max_points}
                                        </span>
                                    </div>
                                    <p className="text-xs text-foreground/60 mt-1">
                                        {renderLatex(item.commentary)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {details && (
                    <div className="space-y-2 text-sm">
                        {details.conceptual_feedback && (
                            <div>
                                <strong>Feedback:</strong>
                                <p className="mt-1">{renderLatex(details.conceptual_feedback)}</p>
                            </div>
                        )}
                        {details.suggested_correction && (
                            <div className="p-2 rounded-lg bg-foreground/5">
                                <strong>Suggested Correction:</strong>
                                <p className="mt-1">
                                    {renderLatex(details.suggested_correction)}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Render question
    const renderQuestion = (question: Question, index: number) => {
        const evaluation = evaluations[question.id];

        let result = null;
        if (submitted) {
            if (evaluation?.evaluation_summary) {
                result = evaluation.evaluation_summary.status;
            } else {
                result = isCorrect(question) ? "correct" : "incorrect";
            }
        }

        let cardClass =
            "p-6 rounded-2xl bg-card-bg/60 backdrop-blur border border-card-border";
        if (result === "correct") cardClass += " border-green-500/30";
        else if (result === "partial") cardClass += " border-yellow-500/30";
        else if (result === "incorrect") cardClass += " border-red-500/30";

        return (
            <div key={question.id} className={cardClass}>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold">Question {index + 1}</span>
                    <div className="flex items-center gap-2">
                        {question.rubric?.total_points && (
                            <span className="px-2 py-1 text-xs rounded-full bg-foreground/10">
                                {question.rubric.total_points} pts
                            </span>
                        )}
                        <span
                            className={`px-3 py-1 text-xs rounded-full font-medium ${question.type === "mcq"
                                ? "bg-blue-500/20 text-blue-400"
                                : question.type === "true_false"
                                    ? "bg-purple-500/20 text-purple-400"
                                    : question.type === "complete"
                                        ? "bg-green-500/20 text-green-400"
                                        : question.type === "essay"
                                            ? "bg-orange-500/20 text-orange-400"
                                            : "bg-pink-500/20 text-pink-400"
                                }`}
                        >
                            {getQuestionTypeLabel(question.type)}
                        </span>
                    </div>
                </div>

                <div className="text-foreground/90">
                    {renderLatex(question.question_text)}
                </div>

                {/* Render question based on type */}
                {question.type === "mcq" && renderMCQ(question)}
                {question.type === "true_false" && renderTrueFalse(question)}
                {question.type === "complete" && renderComplete(question)}
                {question.type === "essay" && renderEssay(question)}
                {question.type === "figure" && renderFigure(question)}

                {/* Result indicator */}
                {submitted &&
                    !evaluation &&
                    (question.type === "mcq" || question.type === "true_false") && (
                        <div
                            className={`mt-4 flex items-center gap-2 ${result === "correct" ? "text-green-400" : "text-red-400"
                                }`}
                        >
                            {result === "correct" ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <XCircle className="w-5 h-5" />
                            )}
                            {result === "correct" ? "Correct!" : "Incorrect"}
                        </div>
                    )}

                {/* Explanation */}
                {submitted &&
                    showExplanations &&
                    question.explanation &&
                    !evaluation && (
                        <div className="mt-4 p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                            <strong>Explanation:</strong>
                            <div className="mt-2 text-sm text-foreground/80">
                                {renderLatex(question.explanation)}
                            </div>
                        </div>
                    )}

                {/* Sample answer */}
                {submitted && showExplanations && question.sample_answer && (
                    <div className="mt-4 p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                        <strong>Sample Answer:</strong>
                        <div className="mt-2 text-sm text-foreground/80">
                            {renderLatex(question.sample_answer)}
                        </div>
                    </div>
                )}

                {/* Source reference */}
                {question.source_ref && (
                    <div className="mt-4 text-xs text-foreground/40">
                        {question.source_ref}
                    </div>
                )}
            </div>
        );
    };

    const renderSavedExams = () => {
        if (loadingExams) {
            return (
                <div className="p-8 text-center text-foreground/60">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading history...
                </div>
            );
        }

        if (savedExams.length === 0) {
            return (
                <div className="p-8 text-center text-foreground/60">
                    No saved exams found. Generate one to get started!
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedExams.map((exam) => (
                    <div
                        key={exam.id}
                        className="p-4 rounded-xl bg-card-bg border border-card-border hover:border-primary/50 transition-all cursor-pointer group relative"
                        onClick={() => handleLoadExam(exam)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold truncate pr-8">{exam.title}</h3>
                            <button
                                onClick={(e) => handleDeleteExam(exam.id, e)}
                                className="p-1 hover:bg-red-500/20 rounded text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4"
                                title="Delete Exam"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-sm text-foreground/60 mb-3">
                            {new Date(exam.created_at).toLocaleDateString()}
                        </div>
                        {exam.score_data && (
                            <div className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500 inline-block font-medium">
                                Score: {exam.score_data.points}/{exam.score_data.maxPoints} ({Math.round((exam.score_data.points / exam.score_data.maxPoints) * 100)}%)
                            </div>
                        )}
                        <div className="mt-3 flex items-center gap-2 text-primary text-sm font-medium">
                            <Play className="w-3 h-3" /> Take Exam
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const score = calculateScore();
    const answeredCount = Object.keys(userAnswers).length;
    const totalQuestions = examResults?.questions?.length || 0;

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT: Material Selection, Config & Generate */}
            {!examResults && (
                <div className="lg:col-span-1 space-y-6">
                    {/* Material Selector */}
                            <div className="bg-card-bg border border-card-border rounded-2xl p-6">
                                <MaterialSelector
                                    courseId={courseId}
                                    selectedIds={selectedMaterialIds}
                                    onSelectionChange={setSelectedMaterialIds}
                                />
                            </div>

                            {/* Configuration */}
                            <div className="bg-card-bg border border-card-border rounded-2xl p-6">
                                <button
                                    className="w-full flex items-center justify-between"
                                    onClick={() => setConfigExpanded(!configExpanded)}
                                >
                                    <h3 className="text-sm font-bold text-foreground/70 flex items-center gap-2">
                                        Exam Configuration
                                    </h3>
                                    {configExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-foreground/40" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-foreground/40" />
                                    )}
                                </button>

                                {configExpanded && (
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        {/* Difficulty */}
                                        <div>
                                            <label className="block text-xs font-medium text-foreground/50 mb-1">
                                                Difficulty
                                            </label>
                                            <select
                                                value={options.difficulty}
                                                onChange={(e) =>
                                                    setOptions({
                                                        ...options,
                                                        difficulty: e.target.value as "easy" | "medium" | "hard",
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-sm"
                                                disabled={loading}
                                            >
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        </div>

                                        {/* Study Type */}
                                        <div>
                                            <label className="block text-xs font-medium text-foreground/50 mb-1">
                                                Study Type
                                            </label>
                                            <select
                                                value={options.study_type}
                                                onChange={(e) =>
                                                    setOptions({
                                                        ...options,
                                                        study_type: e.target.value as
                                                            | "memorize"
                                                            | "understand"
                                                            | "apply",
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-sm"
                                                disabled={loading}
                                            >
                                                <option value="memorize">Memorize</option>
                                                <option value="understand">Understand</option>
                                                <option value="apply">Apply</option>
                                            </select>
                                        </div>

                                        {/* MCQ Options */}
                                        <div>
                                            <label className="block text-xs font-medium text-foreground/50 mb-1">
                                                MCQ Options
                                            </label>
                                            <select
                                                value={options.mcq_options}
                                                onChange={(e) =>
                                                    setOptions({
                                                        ...options,
                                                        mcq_options: parseInt(e.target.value),
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-sm"
                                                disabled={loading}
                                            >
                                                <option value={3}>3 options</option>
                                                <option value={4}>4 options</option>
                                                <option value={5}>5 options</option>
                                            </select>
                                        </div>

                                        {/* Question Counts */}
                                        <div>
                                            <label className="block text-xs font-medium text-foreground/50 mb-1">
                                                MCQ Count
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                value={options.mcq_count}
                                                onChange={(e) =>
                                                    setOptions({
                                                        ...options,
                                                        mcq_count: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-sm"
                                                disabled={loading}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-foreground/50 mb-1">
                                                True/False
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                value={options.true_false_count}
                                                onChange={(e) =>
                                                    setOptions({
                                                        ...options,
                                                        true_false_count: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-sm"
                                                disabled={loading}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-foreground/50 mb-1">
                                                Fill in Blank
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                value={options.complete_count}
                                                onChange={(e) =>
                                                    setOptions({
                                                        ...options,
                                                        complete_count: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-sm"
                                                disabled={loading}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-foreground/50 mb-1">
                                                Essay
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={5}
                                                value={options.essay_count}
                                                onChange={(e) =>
                                                    setOptions({
                                                        ...options,
                                                        essay_count: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-sm"
                                                disabled={loading}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-foreground/50 mb-1">
                                                Figure
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={5}
                                                value={options.figure_count}
                                                onChange={(e) =>
                                                    setOptions({
                                                        ...options,
                                                        figure_count: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-sm"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerateExam}
                                disabled={loading || selectedMaterialIds.length === 0}
                                className="w-full py-4 rounded-2xl bg-foreground text-background font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Generate Exam
                                    </>
                                )}
                            </button>

                    {loading && (
                        <p className="text-xs text-foreground/40 text-center">
                            You can switch tabs — generation continues in the background.
                        </p>
                    )}
                </div>
            )}

            {/* RIGHT: Results / Recent Exams */}
            <div className={examResults ? "lg:col-span-3" : "lg:col-span-2"}>
                {!examResults && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground/80">
                            <History className="w-5 h-5" /> Recent Exams
                        </h3>
                        {renderSavedExams()}
                    </div>
                )}

                {/* Exam Results - full width when active */}
                {examResults && (
                        <div className="space-y-6">
                            {/* Back Button */}
                            <button
                                onClick={() => {
                                    setExamResults(null);
                                    setUserAnswers({});
                                    setSubmitted(false);
                                    setEvaluations({});
                                    setShowExplanations(false);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card-bg border border-card-border text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Exam Generator
                            </button>

                            {/* Results Header */}
                            <div className="p-6 rounded-2xl bg-card-bg/60 backdrop-blur border border-card-border">
                                <h2 className="text-xl font-bold mb-4">
                                    Exam Generated Successfully!
                                </h2>

                                {examResults.quiz_metadata && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                        <div>
                                            <span className="text-foreground/60">Title:</span>
                                            <p className="font-medium">
                                                {renderLatex(examResults.quiz_metadata.title)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-foreground/60">Difficulty:</span>
                                            <p className="font-medium capitalize">
                                                {examResults.quiz_metadata.difficulty_level}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-foreground/60">Study Goal:</span>
                                            <p className="font-medium capitalize">
                                                {examResults.quiz_metadata.study_goal}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-foreground/60">Questions:</span>
                                            <p className="font-medium">{totalQuestions}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-3">
                                    {!submitted ? (
                                        <>
                                            <span className="text-sm text-foreground/60">
                                                Answered: {answeredCount} / {totalQuestions}
                                            </span>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={answeredCount === 0}
                                                className="px-6 py-2 rounded-xl bg-green-500 text-white font-medium disabled:opacity-50 hover:bg-green-600 transition-all"
                                            >
                                                Submit Answers
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="px-4 py-2 rounded-xl bg-primary/20 text-primary font-bold">
                                                Score: {score.points} / {score.maxPoints} (
                                                {Math.round((score.points / score.maxPoints) * 100) || 0}%)
                                            </div>
                                            <button
                                                onClick={() => setShowExplanations(!showExplanations)}
                                                className="px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 transition-all"
                                            >
                                                {showExplanations ? "Hide" : "Show"} Explanations
                                            </button>
                                            <button
                                                onClick={handleReset}
                                                className="px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 transition-all flex items-center gap-2"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                Try Again
                                            </button>
                                        </>
                                    )}

                                    <button
                                        onClick={downloadJSON}
                                        className="px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 transition-all flex items-center gap-2 ml-auto"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download JSON
                                    </button>
                                </div>
                            </div>

                            {/* Questions */}
                            <div className="space-y-4">
                                {examResults.questions?.map((question, index) =>
                                    renderQuestion(question, index)
                                )}
                            </div>

                            {/* Back to New Exam */}
                            <button
                                onClick={handleReset}
                                className="w-full py-3 rounded-xl border border-card-border text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-all text-sm font-medium"
                            >
                                Generate New Exam
                            </button>
                        </div>
                    )}
            </div>
        </div>
    );
}
