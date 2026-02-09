"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/context/PreferencesContext";
import { generateQuizAction, evaluateQuizAction } from "@/app/actions";
import { MaterialSelector } from "@/components/course/ui/MaterialSelector";
import {
    Loader2,
    Brain,
    HelpCircle,
    Clock,
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Timer,
    Upload,
    Image as ImageIcon,
    RefreshCw,
    Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

export function QuizTab({ courseId }: { courseId: string }) {
    const { playSound } = usePreferences();
    const [quizState, setQuizState] = useState<'config' | 'loading' | 'active' | 'grading' | 'results'>('config');
    const [config, setConfig] = useState({
        mcqConcepts: 3,
        mcqProblems: 1,
        trueFalse: 3,
        writtenConcepts: 1,
        writtenProblems: 1,
        timeLimit: 20 // minutes
    });
    // Material Selection
    const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [results, setResults] = useState<any>(null); // { results: [], percentage: number }

    const startQuiz = async () => {
        playSound('click');
        setQuizState('loading');
        const res = await generateQuizAction(courseId, config, selectedMaterialIds);
        if (res.success) {
            setQuestions(res.questions);
            setAnswers({});
            setQuizState('active');
        } else {
            alert("Failed to generate quiz: " + res.error);
            setQuizState('config');
        }
    };

    const submitQuiz = async () => {
        playSound('click');
        setQuizState('grading');

        // Prepare FormData
        const formData = new FormData();
        const quizData = {
            questions,
            userAnswers: Object.fromEntries(
                Object.entries(answers).map(([qid, ans]) => [
                    qid,
                    { type: ans.type, value: ans.type === 'image' ? 'image_upload' : ans.value }
                ])
            )
        };
        formData.append('quizData', JSON.stringify(quizData));

        // Append Images
        Object.entries(answers).forEach(([qid, ans]) => {
            if (ans.type === 'image' && ans.file) {
                formData.append(`file_${qid}`, ans.file);
            }
        });

        const res = await evaluateQuizAction(formData);
        if (res.success) {
            setResults(res);
            setQuizState('results');
        } else {
            alert("Grading failed: " + res.error);
            setQuizState('active'); // Go back to allow retry
        }
    };

    return (
        <div className="relative min-h-[500px]">
            {quizState === 'config' && (
                <QuizConfigView
                    config={config}
                    setConfig={setConfig}
                    onStart={startQuiz}
                    courseId={courseId}
                    selectedMaterialIds={selectedMaterialIds}
                    setSelectedMaterialIds={setSelectedMaterialIds}
                />
            )}
            {quizState === 'loading' && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    <p className="text-foreground/60 animate-pulse">Consulting the Professor...</p>
                </div>
            )}
            {quizState === 'active' && (
                <QuizActiveView
                    questions={questions}
                    answers={answers}
                    setAnswers={setAnswers}
                    timeLimit={config.timeLimit}
                    onSubmit={submitQuiz}
                />
            )}
            {quizState === 'grading' && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Brain className="w-12 h-12 animate-pulse text-purple-500" />
                    <p className="text-foreground/60 animate-pulse">Grading your answers...</p>
                    <p className="text-xs text-foreground/40">Visual Vision Model Analyzing Handwriting...</p>
                </div>
            )}
            {quizState === 'results' && results && (
                <QuizResultsView results={results} questions={questions} answers={answers} onRetry={() => setQuizState('config')} />
            )}
        </div>
    );
}

function QuizConfigView({ config, setConfig, onStart, courseId, selectedMaterialIds, setSelectedMaterialIds }: any) {
    const { playSound } = usePreferences();
    const updateCount = (key: string, delta: number) => {
        playSound('click');
        setConfig((prev: any) => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }));
    };

    const totalQs = config.mcqConcepts + config.mcqProblems + config.trueFalse + config.writtenConcepts + config.writtenProblems;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-2 text-foreground">Quiz Configuration</h2>
                <p className="text-foreground/60">Customize your exam experience.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {/* Question Counts */}
                    <div className="p-6 rounded-[2rem] bg-card-bg border border-card-border space-y-4">
                        <h3 className="font-bold flex items-center gap-2 text-foreground">
                            <StackIcon icon={HelpCircle} color="blue" /> Question Composition
                        </h3>

                        <CounterRow label="MCQ (Concepts)" value={config.mcqConcepts} onChange={(d: number) => updateCount('mcqConcepts', d)} />
                        <CounterRow label="MCQ (Problems)" value={config.mcqProblems} onChange={(d: number) => updateCount('mcqProblems', d)} />
                        <CounterRow label="True / False" value={config.trueFalse} onChange={(d: number) => updateCount('trueFalse', d)} />
                        <div className="h-px bg-foreground/5 my-2" />
                        <CounterRow label="Written (Theory)" value={config.writtenConcepts} onChange={(d: number) => updateCount('writtenConcepts', d)} />
                        <CounterRow label="Written (Problems)" value={config.writtenProblems} onChange={(d: number) => updateCount('writtenProblems', d)} />
                    </div>

                    {/* Material Selection */}
                    <div className="p-6 rounded-[2rem] bg-card-bg border border-card-border space-y-4">
                        <h3 className="font-bold flex items-center gap-2 text-foreground">
                            <StackIcon icon={Sparkles} color="yellow" /> Source Material scope
                        </h3>
                        <p className="text-xs text-foreground/40">Select specific materials or leave empty to use all coverage.</p>
                        <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            <MaterialSelector
                                courseId={courseId}
                                selectedIds={selectedMaterialIds}
                                onSelectionChange={setSelectedMaterialIds}
                            />
                        </div>
                    </div>
                </div>

                {/* Settings */}
                <div className="space-y-6">
                    <div className="p-6 rounded-[2rem] bg-card-bg border border-card-border space-y-4">
                        <h3 className="font-bold flex items-center gap-2 text-foreground">
                            <StackIcon icon={Clock} color="purple" /> Time Limit
                        </h3>
                        <div className="flex items-center justify-between">
                            <span className="text-foreground/60">Duration (Minutes)</span>
                            <div className="flex items-center gap-3 bg-foreground/5 rounded-xl p-1">
                                <button onClick={() => updateCount('timeLimit', -5)} className="w-8 h-8 rounded-lg hover:bg-foreground/10 flex items-center justify-center">-</button>
                                <span className="font-mono font-bold w-12 text-center text-foreground">{config.timeLimit}</span>
                                <button onClick={() => updateCount('timeLimit', 5)} className="w-8 h-8 rounded-lg hover:bg-foreground/10 flex items-center justify-center">+</button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 flex flex-col items-center justify-center text-center gap-2">
                        <span className="text-4xl font-bold text-foreground">{totalQs}</span>
                        <span className="text-sm text-foreground/50 uppercase tracking-wider font-bold">Questions Selected</span>
                        {selectedMaterialIds.length > 0 && (
                            <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                                Focused on {selectedMaterialIds.length} file(s)
                            </span>
                        )}
                    </div>

                    <button
                        onClick={onStart}
                        disabled={totalQs === 0}
                        className="w-full py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                        Generate Quiz
                    </button>
                </div>
            </div>
        </div>
    );
}

function CounterRow({ label, value, onChange }: any) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-foreground/80 font-medium">{label}</span>
            <div className="flex items-center gap-3">
                <button onClick={() => onChange(-1)} className="w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-foreground/60 transition-colors">-</button>
                <span className="w-6 text-center font-bold text-foreground">{value}</span>
                <button onClick={() => onChange(1)} className="w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-foreground/60 transition-colors">+</button>
            </div>
        </div>
    );
}

function StackIcon({ icon: Icon, color }: any) {
    return (
        <div className={`p-1.5 rounded-lg bg-${color}-500/10 text-${color}-500`}>
            <Icon size={16} />
        </div>
    );
}

function QuizActiveView({ questions, answers, setAnswers, timeLimit, onSubmit }: any) {
    const { playSound } = usePreferences();
    const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev: number) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onSubmit(); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const currentQ = questions[currentIndex];
    const currentAns = answers[currentQ.id];

    const handleAnswer = (val: any, type: 'option' | 'text' | 'image', file?: File) => {
        setAnswers((prev: any) => ({
            ...prev,
            [currentQ.id]: { value: val, type, file }
        }));
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-full min-h-[600px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-background/80 backdrop-blur-md z-20 py-4 border-b border-foreground/5">
                <div className="flex items-center gap-4">
                    <span className="text-foreground/40 font-mono text-sm">Question {currentIndex + 1} / {questions.length}</span>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${currentQ.type === 'written' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                        {currentQ.type}
                    </div>
                </div>
                <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
                    <Timer size={20} />
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Question Card */}
            <div className="flex-1 flex flex-col justify-center">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 rounded-[2rem] bg-card-bg border border-card-border shadow-lg"
                >
                    <h2 className="text-2xl font-bold mb-8 text-foreground leading-relaxed">{currentQ.question}</h2>

                    <div className="space-y-4">
                        {/* MCQ Options */}
                        {currentQ.type === 'mcq' && currentQ.options?.map((opt: string, i: number) => (
                            <button
                                key={i}
                                onClick={() => handleAnswer(opt, 'option')}
                                className={`w-full p-4 rounded-xl text-left border transition-all flex items-center gap-4 group ${currentAns?.value === opt
                                    ? 'bg-blue-600/20 border-blue-500 text-foreground'
                                    : 'bg-foreground/5 border-transparent text-foreground/60 hover:bg-foreground/10'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${currentAns?.value === opt ? 'bg-blue-500 border-blue-500 text-white' : 'border-foreground/20 text-foreground/40'
                                    }`}>
                                    {String.fromCharCode(65 + i)}
                                </div>
                                <span className="text-lg">{opt}</span>
                            </button>
                        ))}

                        {/* True/False */}
                        {currentQ.type === 'true_false' && (
                            <div className="flex gap-4">
                                {['True', 'False'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => handleAnswer(opt, 'option')}
                                        className={`flex-1 p-6 rounded-xl border text-center font-bold text-xl transition-all ${currentAns?.value === opt
                                            ? 'bg-blue-600/20 border-blue-500 text-foreground'
                                            : 'bg-foreground/5 border-transparent text-foreground/60 hover:bg-foreground/10'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Written */}
                        {currentQ.type === 'written' && (
                            <div className="space-y-6">
                                <textarea
                                    value={currentAns?.type === 'text' ? currentAns.value : ''}
                                    onChange={(e) => handleAnswer(e.target.value, 'text')}
                                    placeholder="Type your answer here..."
                                    className="w-full h-40 bg-foreground/5 border border-foreground/10 rounded-xl p-4 text-foreground focus:outline-none focus:border-blue-500 resize-none"
                                />

                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-foreground/10" />
                                    <span className="text-foreground/40 text-sm">OR</span>
                                    <div className="h-px flex-1 bg-foreground/10" />
                                </div>

                                {/* Image Upload */}
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    handleAnswer(ev.target?.result, 'image', file);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${currentAns?.type === 'image' ? 'border-green-500/50 bg-green-500/10' : 'border-foreground/10 bg-foreground/5 group-hover:bg-foreground/10'
                                        }`}>
                                        {currentAns?.type === 'image' ? (
                                            <>
                                                <div className="w-12 h-12 rounded-lg overflow-hidden relative mb-2">
                                                    <img src={currentAns.value} alt="Preview" className="object-cover w-full h-full" />
                                                </div>
                                                <p className="text-green-400 font-bold">Image Uploaded</p>
                                                <p className="text-xs text-foreground/40">Click to change</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-foreground/40" />
                                                <p className="text-foreground/60 font-medium">Upload Handwritten Answer</p>
                                                <p className="text-xs text-foreground/30">AI will grade your paper</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between mt-8 py-6">
                <button
                    onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); playSound('click'); }}
                    disabled={currentIndex === 0}
                    className="px-6 py-3 rounded-full hover:bg-foreground/10 text-foreground/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                    <ArrowLeft size={18} /> Previous
                </button>

                <div className="flex gap-2">
                    {questions.map((_: any, i: number) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-blue-500' : answers[questions[i].id] ? 'bg-foreground/40' : 'bg-foreground/10'
                            }`} />
                    ))}
                </div>

                {currentIndex === questions.length - 1 ? (
                    <button
                        onClick={onSubmit}
                        className="px-8 py-3 rounded-full bg-green-600 hover:bg-green-500 text-white font-bold transition-all shadow-lg shadow-green-500/20 active:scale-95 flex items-center gap-2"
                    >
                        Submit Quiz <CheckCircle2 size={18} />
                    </button>
                ) : (
                    <button
                        onClick={() => { setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1)); playSound('click'); }}
                        className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                    >
                        Next <ChevronRight size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}

function QuizResultsView({ results, questions, answers, onRetry }: any) {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-12">
                <div className="inline-block p-4 rounded-full bg-card-bg border border-card-border shadow-xl mb-6">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-foreground/10" />
                            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent"
                                className={`${results.percentage >= 70 ? 'text-green-500' : 'text-orange-500'} transition-all duration-1000 ease-out`}
                                strokeDasharray={377}
                                strokeDashoffset={377 - (377 * results.percentage) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute text-3xl font-bold text-foreground">{results.percentage}%</span>
                    </div>
                </div>
                <h2 className="text-4xl font-bold text-foreground mb-2">
                    {results.percentage >= 90 ? "Outstanding!" : results.percentage >= 70 ? "Good Job!" : "Keep Practicing"}
                </h2>
                <p className="text-foreground/60">Here is how you performed.</p>
            </div>

            <div className="space-y-6">
                {questions.map((q: any, i: number) => {
                    const result = results.results.find((r: any) => r.questionId === q.id);
                    const isCorrect = result?.correct;
                    const userAnswer = answers[q.id];

                    return (
                        <div key={q.id} className={`p-6 rounded-2xl border ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-sm ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {i + 1}
                                    </span>
                                    <span className="text-foreground/60 font-mono text-xs uppercase">{q.type}</span>
                                </div>
                                <span className={`font-bold ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                    {result?.score}%
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-4">{q.question}</h3>

                            <div className="grid md:grid-cols-2 gap-6 text-sm">
                                <div className="p-4 rounded-xl bg-foreground/5">
                                    <p className="text-xs text-foreground/40 uppercase font-bold mb-2">Your Answer</p>
                                    {userAnswer?.type === 'image' ? (
                                        <div className="flex items-center gap-2 text-blue-400">
                                            <ImageIcon size={16} /> <span>Image Uploaded</span>
                                        </div>
                                    ) : (
                                        <p className="text-foreground font-medium">{userAnswer?.value || '(No Answer)'}</p>
                                    )}
                                </div>
                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                    <p className="text-xs text-blue-400 uppercase font-bold mb-2">Correct / Rubric</p>
                                    <p className="text-foreground/80">{q.correctAnswer}</p>
                                </div>
                            </div>

                            {result?.feedback && (
                                <div className="mt-4 pt-4 border-t border-foreground/10">
                                    <p className="flex items-start gap-2 text-foreground/80">
                                        <Brain className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                                        <span>{result.feedback}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-center mt-12 pb-20">
                <button
                    onClick={onRetry}
                    className="px-8 py-4 rounded-full bg-foreground text-background font-bold text-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <RefreshCw size={20} /> Start New Quiz
                </button>
            </div>
        </div>
    );
}
