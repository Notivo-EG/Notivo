"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

export interface ExamOptions {
    difficulty: "easy" | "medium" | "hard";
    study_type: "memorize" | "understand" | "apply";
    mcq_count: number;
    mcq_options: number;
    true_false_count: number;
    complete_count: number;
    essay_count: number;
    figure_count: number;
}

export interface QuestionOption {
    label: string;
    text: string;
}

export interface RubricCriterion {
    name: string;
    points: number;
    description: string;
}

export interface FigureElement {
    element_id: string;
    element_type: string;
    position: string;
    size?: string;
    color?: string;
    description: string;
    label_text?: string;
    connections?: string;
}

export interface FigureDescription {
    description: string;
    format?: {
        figure_type: string;
        overall_layout: string;
        dimensions?: string;
        elements: FigureElement[];
        annotations?: string;
        style_notes?: string;
        critical_details?: string;
    };
}

export interface Question {
    id: number;
    type: "mcq" | "true_false" | "complete" | "essay" | "figure";
    question_text: string;
    options?: QuestionOption[];
    correct_answer?: string | boolean;
    answers?: string[];
    distractor_analysis?: Record<string, string>;
    rubric?: {
        total_points: number;
        criteria: RubricCriterion[];
    };
    sample_answer?: string;
    explanation?: string;
    source_ref?: string;
    figure_description?: FigureDescription;
    labels_to_identify?: string[];
    expected_labels?: Record<string, string>;
}

export interface QuizMetadata {
    title: string;
    detected_content_focus: string[];
    difficulty_level: string;
    study_goal: string;
    sources_analyzed: string[];
}

export interface ExamResult {
    quiz_metadata: QuizMetadata;
    questions: Question[];
    answer_key_summary: Record<string, string>;
}

export interface EvaluationSummary {
    question_id: number;
    status: "correct" | "partial" | "incorrect";
    total_score_awarded: number;
    max_possible_points: number;
    percentage: number;
}

export interface RubricBreakdown {
    criterion_name: string;
    points_earned: number;
    max_points: number;
    met: boolean;
    commentary: string;
}

export interface EvaluationResult {
    evaluation_summary: EvaluationSummary;
    rubric_breakdown: RubricBreakdown[];
    grading_details: {
        mathematical_accuracy?: string;
        conceptual_feedback?: string;
        suggested_correction?: string;
    };
}

// Build the prompt based on options
function buildPrompt(options: ExamOptions): string {
    const prompt = {
        meta: {
            task: "analyze_and_generate_quiz",
            version: "5.5_cached_context_modular",
            input_source: "gemini_context_cache",
        },
        SYSTEM_ROLE:
            "You are an Expert Academic Assessment Engine. Your behavior adapts strictly to the 'study_type' defined in USER_PREFERENCES. You have been provided with files via context caching; use them as your primary and only knowledge source. Output ONLY raw JSON.",
        FORMATTING_MANDATE: {
            math_style: "LATEX",
            latex_rules: [
                "Use standard LaTeX for all mathematical expressions, derivations, chemical formulas, and units.",
                "CRITICAL: Escape backslashes for JSON compatibility. Use '\\\\' instead of '\\'. Example: '\\\\frac{V}{R}' or '\\\\sigma_{s}'.",
                "Enclose LaTeX in $...$ for inline or $$...$$ for blocks.",
                "NEVER use Unicode math symbols. Use only ASCII + LaTeX commands.",
            ],
            structural_rules: [
                "All text strings must be on a SINGLE LINE. No physical line breaks inside the JSON values.",
                "Ensure all JSON keys and string values are properly escaped.",
            ],
        },
        PEDAGOGICAL_MAPPING: {
            memorize: {
                focus: "Recall and Recognition",
                keywords: ["Define", "Identify", "List", "Name"],
                instruction:
                    "Focus on exact definitions, taxonomy, and labeling. Avoid complex calculations.",
            },
            understand: {
                focus: "Comprehension and Relationship",
                keywords: ["Explain", "Compare", "Contrast", "Interpret"],
                instruction:
                    "Focus on 'Why' and 'How'. Ask users to explain processes or interpret conceptual relationships.",
            },
            apply: {
                focus: "Application and Calculation",
                keywords: ["Calculate", "Solve", "Predict", "Derive"],
                instruction:
                    "Focus on problem-solving. Provide numerical scenarios and ask the user to use formulas from the cache to find the result.",
            },
        },
        USER_PREFERENCES: {
            difficulty: options.difficulty,
            study_type: options.study_type,
            total_questions:
                options.mcq_count +
                options.true_false_count +
                options.complete_count +
                options.essay_count +
                options.figure_count,
            distribution: {
                mcq: {
                    count: options.mcq_count,
                    options: options.mcq_options,
                },
                true_false: { count: options.true_false_count },
                complete: { count: options.complete_count },
                essay: { count: options.essay_count },
                figure: { count: options.figure_count },
            },
        },
        EXECUTION_STEPS: {
            step_1_cache_retrieval:
                "Access the cached file content. Index all unique formulas, constants, and key terminology found within the cached context.",
            step_2_alignment:
                "Retrieve the instruction from 'PEDAGOGICAL_MAPPING' corresponding to the user's 'study_type' and prioritize that question style.",
            step_3_coverage_audit:
                "Audit the cached materials to ensure questions are not repeated and cover the beginning, middle, and end of the provided files.",
            step_4_drafting:
                "Draft questions using the requested LaTeX formatting. For the 'source_ref', use the specific filename or page number identified in the cache.",
            step_5_refinement:
                "Generate 'distractor_analysis' for MCQs and comprehensive 'explanation' fields.",
        },
        OUTPUT_SCHEMA: {
            quiz_metadata: {
                title: "String",
                detected_content_focus: ["String"],
                difficulty_level: "String",
                study_goal: "String",
                sources_analyzed: ["String (Filenames from cache)"],
            },
            questions: [
                {
                    id: "Number",
                    type: "mcq | true_false | complete | essay | figure",
                    question_text: "String (Include escaped \\\\ LaTeX)",
                    options: [
                        {
                            label: "A",
                            text: "String (MUST use escaped \\\\ LaTeX for values/units if study_type is 'apply')",
                        },
                    ],
                    correct_answer:
                        "String or Boolean (For true_false: use true or false as boolean)",
                    answers: ["Array of variations for 'complete' type"],
                    distractor_analysis: {
                        A: "String (Reason why A is incorrect)",
                        B: "String (Reason why B is incorrect)",
                        C: "String (Reason why C is incorrect)",
                    },
                    rubric: {
                        total_points: "Number",
                        criteria: [
                            { name: "String", points: "Number", description: "String" },
                        ],
                    },
                    sample_answer: "String (Step-by-step logic in \\\\ LaTeX)",
                    explanation:
                        "String (State rule -> Show application -> Explain result)",
                    source_ref:
                        "String (Format: 'Filename, Page X' or 'Filename, Slide X' - ONLY filename and page/slide number)",
                    figure_description: {
                        description:
                            "For 'figure' type ONLY. EXTREMELY detailed description of the figure PROVIDED WITH THE QUESTION.",
                        format: {
                            figure_type: "String (e.g., 'labeled_diagram', 'circuit_diagram', 'graph')",
                            overall_layout: "String (Detailed description of the overall structure)",
                            dimensions: "String (Approximate size ratios, aspect ratio)",
                            elements: [
                                {
                                    element_id: "String (unique identifier like 'A', 'B', '1', '2')",
                                    element_type: "String (e.g., 'arrow', 'label', 'shape', 'line')",
                                    position: "String (PRECISE position)",
                                    size: "String (relative size)",
                                    color: "String (if applicable)",
                                    description: "String (detailed description)",
                                    label_text: "String (if this element has a label)",
                                    connections: "String (what does this element connect to)",
                                },
                            ],
                            annotations: "String (Any additional text or annotations)",
                            style_notes: "String (Scientific illustration style, etc.)",
                            critical_details: "String (What details are ESSENTIAL)",
                        },
                    },
                    labels_to_identify: ["Array of label IDs for labeling questions"],
                    expected_labels: {
                        A: "Correct name for label A",
                        B: "Correct name for label B",
                    },
                },
            ],
            answer_key_summary: { 1: "Value" },
        },
        CONSTRAINTS: [
            "Strictly follow LaTeX escaping with '\\\\'.",
            "Do not include markdown code blocks. Output ONLY raw JSON.",
            "CRITICAL JSON RULES: Output must be valid parseable JSON. No trailing commas. No stray quotes. No newlines within string values.",
            "CACHE INTEGRITY: Only generate questions based on the content actually found in the cached files.",
            "ADAPTABILITY: You MUST change your question style based on the 'study_type' key.",
            "TRUE_FALSE RULES: For true_false questions, correct_answer MUST be a boolean (true or false), not a string.",
            "SOURCE_REF FORMAT: source_ref must ONLY contain the filename and page/slide number.",
            "RANDOMIZATION: Generate DIFFERENT questions each time. Pick random sections from the material.",
            "FIGURE QUESTION RULES: The figure_description describes a FIGURE GIVEN TO THE STUDENT. NEVER ask students to 'draw' or 'sketch'. Instead, ask them to 'identify', 'label', 'describe', or 'analyze' the given figure.",
        ],
        UNIQUE_SESSION: {
            session_id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            instruction:
                "This is a unique session. Generate completely fresh questions different from any previous generation.",
        },
    };

    return JSON.stringify(prompt, null, 2);
}

// Main function to generate exam
export async function generateExam(
    files: { filename: string; content: string; mimeType: string }[],
    options: ExamOptions
): Promise<ExamResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY not configured");
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        const fileParts = files.map((file) => ({
            inlineData: {
                data: file.content,
                mimeType: file.mimeType,
            },
        }));

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const prompt = buildPrompt(options);
        const fullPrompt = `${prompt}\n\nGenerate the exam based on the above configuration and the provided lecture materials.`;

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: "These are lecture materials for generating exam questions.",
                        },
                        ...fileParts,
                        { text: fullPrompt },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.5,
                topP: 0.7,
                maxOutputTokens: 65536,
                responseMimeType: "application/json",
            },
        });

        const response = result.response;
        const text = response.text();

        // Parse the JSON response
        let examData: ExamResult;
        try {
            let cleanedText = text
                .replace(/```json\n?/g, "")
                .replace(/```\n?/g, "")
                .trim();

            // Fix common JSON issues from LLM output
            cleanedText = cleanedText.replace(/"\s*\n\s*"/g, '"');
            cleanedText = cleanedText.replace(/"\s*"\s*\n/g, '"\n');
            cleanedText = cleanedText.replace(/,\s*([}\]])/g, "$1");

            examData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("Failed to parse exam JSON:", text);
            console.error("Parse error:", parseError);

            // Try a more aggressive cleanup
            try {
                let aggressiveClean = text
                    .replace(/```json\n?/g, "")
                    .replace(/```\n?/g, "")
                    .trim();

                const jsonMatch = aggressiveClean.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    let extracted = jsonMatch[0];
                    extracted = extracted.replace(/"\s*\n\s*"/g, '" "');
                    extracted = extracted.replace(/,\s*([}\]])/g, "$1");
                    examData = JSON.parse(extracted);
                } else {
                    throw new Error("No valid JSON found in response");
                }
            } catch (secondError) {
                console.error("Second parse attempt failed:", secondError);
                throw new Error(
                    "Failed to parse exam response. The AI generated malformed JSON. Please try again."
                );
            }
        }

        return examData;
    } catch (error: any) {
        console.error("Error in generateExam:", error);
        throw new Error(error.message || "Failed to generate exam");
    }
}

// Build evaluation prompt for essay/complete questions
function buildEvaluationPrompt(question: Question, userAnswer: string): string {
    const prompt = {
        meta: {
            task: "evaluate_user_answer",
            version: "1.0_grading_engine",
            input_source: "user_submission_vs_rubric",
        },
        SYSTEM_ROLE:
            "You are a Lead Quantitative Grader. Your goal is to evaluate a user's answer against a provided rubric or correct answer key. You must be objective, identifying exactly where the user succeeded or failed. Output ONLY raw JSON.",
        FORMATTING_MANDATE: {
            math_style: "LATEX",
            latex_rules: [
                "Use standard LaTeX for all mathematical expressions and units.",
                "CRITICAL: Escape backslashes for JSON compatibility. Use '\\\\' instead of '\\'.",
                "Enclose LaTeX in $...$ for inline or $$...$$ for blocks.",
            ],
            structural_rules: [
                "All text strings must be on a SINGLE LINE. No physical line breaks.",
                "Ensure all JSON keys and string values are properly escaped.",
                "CRITICAL JSON RULES: Output must be valid parseable JSON. No trailing commas. No stray quotes.",
            ],
        },
        EVALUATION_INPUT: {
            question_context: {
                type: question.type,
                question_text: question.question_text,
                correct_reference:
                    question.sample_answer ||
                    question.answers?.join(" OR ") ||
                    question.correct_answer,
                rubric_criteria: question.rubric?.criteria || [
                    {
                        name: "Answer Accuracy",
                        points: 1,
                        description: "Correct answer provided",
                    },
                ],
            },
            user_submission: {
                answer_text: userAnswer,
            },
        },
        EXECUTION_STEPS: {
            step_1_comparison:
                "Compare the user's answer to the 'correct_reference'. For 'complete' types, check for numerical equivalence and unit accuracy. For 'essay' types, check against each rubric criterion.",
            step_2_scoring:
                "Calculate the total score based on the rubric. Award partial credit where appropriate.",
            step_3_feedback:
                "Identify the 'Gap': What is missing between the user's answer and the perfect answer?",
            step_4_formatting:
                "Format all mathematical corrections in escaped LaTeX.",
        },
        OUTPUT_SCHEMA: {
            evaluation_summary: {
                question_id: question.id,
                status: "correct | partial | incorrect",
                total_score_awarded: "Number",
                max_possible_points: "Number",
                percentage: "Number",
            },
            rubric_breakdown: [
                {
                    criterion_name: "String",
                    points_earned: "Number",
                    max_points: "Number",
                    met: "Boolean",
                    commentary: "String (Specific reason why this was or wasn't met)",
                },
            ],
            grading_details: {
                mathematical_accuracy:
                    "String (Analysis of the user's LaTeX/calculations)",
                conceptual_feedback:
                    "String (Direct feedback to the user on their understanding)",
                suggested_correction:
                    "String (The specific steps the user should have taken, in \\\\ LaTeX)",
            },
        },
        CONSTRAINTS: [
            "Strictly follow LaTeX escaping with '\\\\'.",
            "Do not include markdown code blocks. Output ONLY raw JSON.",
            "Be pedantic with units: If the user provides the correct number but the wrong unit, mark as partial.",
            "For 'complete' type questions, if the user's answer matches any of the accepted answers, mark as correct.",
        ],
    };

    return JSON.stringify(prompt, null, 2);
}

// Evaluate user's answer for essay/complete questions using Gemini
export async function evaluateAnswer(
    question: Question,
    userAnswer: string
): Promise<EvaluationResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY not configured");
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Use gemini-2.5-flash for consistency and speed
        const modelName = "gemini-2.5-flash";

        const model = genAI.getGenerativeModel({
            model: modelName,
        });

        const prompt = buildEvaluationPrompt(question, userAnswer);
        const fullPrompt = `${prompt}\n\nEvaluate the user's answer based on the above configuration.`;

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: fullPrompt }],
                },
            ],
            generationConfig: {
                temperature: 0.1,
                topP: 0.2,
                maxOutputTokens: 4096,
                responseMimeType: "application/json",
            },
        });

        const response = result.response;
        const text = response.text();

        // Parse the JSON response
        let evaluationData: EvaluationResult;
        try {
            let cleanedText = text
                .replace(/```json\n?/g, "")
                .replace(/```\n?/g, "")
                .trim();

            cleanedText = cleanedText.replace(/"\s*\n\s*"/g, '"');
            cleanedText = cleanedText.replace(/"\s*"\s*\n/g, '"\n');
            cleanedText = cleanedText.replace(/,\s*([}\]])/g, "$1");

            evaluationData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("Failed to parse evaluation JSON:", text);

            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    let extracted = jsonMatch[0];
                    extracted = extracted.replace(/,\s*([}\]])/g, "$1");
                    evaluationData = JSON.parse(extracted);
                } else {
                    throw new Error("No valid JSON found");
                }
            } catch (secondError) {
                throw new Error("Failed to parse evaluation response");
            }
        }

        return evaluationData;
    } catch (error: any) {
        console.error("Error in evaluateAnswer:", error);
        throw new Error(error.message || "Failed to evaluate answer");
    }
}

// Save exam to database
export async function saveExam(
    courseId: string,
    title: string,
    examData: ExamResult,
    scoreData?: any
): Promise<void> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase.from("generated_exams").insert({
        student_course_id: courseId,
        title: title || examData.quiz_metadata.title || "Untitled Exam",
        exam_data: examData,
        score_data: scoreData,
    });

    if (error) {
        console.error("Error saving exam:", error);
        throw new Error("Failed to save exam");
    }
}

// Get saved exams for a course
export async function getExams(courseId: string): Promise<any[]> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("generated_exams")
        .select("*")
        .eq("student_course_id", courseId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching exams:", error);
        throw new Error("Failed to fetch exams");
    }

    return data;
}

// Delete an exam
export async function deleteExam(examId: string): Promise<void> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("generated_exams")
        .delete()
        .eq("id", examId);

    if (error) {
        console.error("Error deleting exam:", error);
        throw new Error("Failed to delete exam");
    }
}
