"use server";

import { geminiModel, geminiVisionModel } from "@/lib/gemini";

// Helper to convert File to GoogleGenerativeAI Part
async function fileToPart(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return {
        inlineData: {
            data: buffer.toString("base64"),
            mimeType: file.type,
        },
    };
}

export async function parseCourseTree(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) throw new Error("No file provided");

        console.log("Analyzing file:", file.name, file.type, file.size);

        // Prepare Prompt
        const prompt = `
        You are an Expert Academic Architect. Your goal is to analyze this course material (syllabus or slide deck) and construct a hierarchical "Knowledge Tree" for the course.
        
        Output a JSON object with this exact structure (no markdown, just raw JSON):
        {
            "lectures": [
                {
                    "title": "Title of the lecture or topic",
                    "description": "Brief summary of what is covered",
                    "importance": "high" | "medium" | "low",
                    "topics": ["sub-topic 1", "sub-topic 2"]
                }
            ],
            "estimated_difficulty": "1-10 scale rating",
            "key_concepts": ["concept 1", "concept 2"]
        }

        Rules:
        1. If the file is a Syllabus, break it down by week or module.
        2. If the file is a Slide Deck, break it down by section headers.
        3. Be granular. A 50-page slide deck should yield 3-5 distinct lecture nodes.
        `;

        // Generate Content
        // Using "gemini-1.5-flash" which supports multimodal input
        const filePart = await fileToPart(file);
        const result = await geminiVisionModel.generateContent([prompt, filePart]);
        const response = await result.response;
        const text = response.text();

        // Parse JSON (Clean markdown code blocks if present)
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonString);

        return { success: true, data };

    } catch (error: any) {
        console.error("AI Parse Error:", error);
        return { success: false, error: error.message };
    }
}

export async function parseCurriculumTree(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) throw new Error("No file provided");

        console.log("Analyzing Curriculum file:", file.name, file.type, file.size);

        // Prepare Prompt for Curriculum / Transcript
        const prompt = `
        You are an Expert Academic Architect. Analyze this document (Curriculum Flowchart, Transcript, or Degree Plan) to extract the course graph.

        CRITICAL: 
        1. Extract PREREQUISITES (arrows, columns, or implied logic).
        2. Extract SEMESTER/YEAR structure if visible. (e.g. "Year 1 Term 1" -> semester: 1).

        Output a JSON object with this exact structure (no markdown):
        {
            "courses": [
                {
                    "code": "CS101",
                    "name": "Intro to CS",
                    "credits": 3,
                    "status": "not_started",
                    "prerequisites": ["MATH101"],
                    "suggested_semester": 1 (integer 1-8, if identifiable via layout/headers)
                }
            ]
        }
        `;

        // Generate Content
        const filePart = await fileToPart(file);
        const result = await geminiVisionModel.generateContent([prompt, filePart]);
        const response = await result.response;
        const text = response.text();

        // Parse JSON
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonString);

        return { success: true, data };

    } catch (error: any) {
        console.error("AI Curriculum Parse Error:", error);
        return { success: false, error: error.message };
    }
}

// LEVEL 4: BRAIN UPLOAD ACTION
import { createClient } from "@/lib/supabase/server";

export async function uploadBrainMaterial(formData: FormData, courseId: string) {
    const supabase = await createClient();

    try {
        const file = formData.get("file") as File;
        const type = formData.get("type") as string; // 'slide' | 'sheet'

        if (!file) throw new Error("No file provided");
        if (!courseId) throw new Error("No course ID provided");

        console.log(`Uploading ${type}: ${file.name} for course ${courseId}`);

        // 1. Upload to Supabase Storage
        const filePath = `${courseId}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('materials')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('materials')
            .getPublicUrl(filePath);

        // 2. Analyze with Gemini
        // We use the same 'fileToPart' helper to send the buffer to Gemini
        const filePart = await fileToPart(file);

        let prompt = "";
        if (type === 'slide') {
            prompt = `
            Analyze this Lecture Slide Deck.
            1. Extract the main "Topics" covered.
            2. Extract a brief 2-sentence "Summary".
            3. Estimate the "Week Number" if mentioned (default to null).
            
            Output JSON: { "topics": [], "summary": "...", "week_number": number | null }
            `;
        } else if (type === 'sheet' || type === 'problem_sheet') {
            prompt = `
            Analyze this Problem Sheet / Tutorial.
            1. Extract the list of "Concepts" tested.
            2. Count the number of problems.
            3. Identify the difficulty level (Easy/Medium/Hard).
            
            Output JSON: { "concepts": [], "problem_count": number, "difficulty": "..." }
            `;
        } else {
            prompt = `Analyze this academic document. Output JSON summary.`;
        }

        const result = await geminiVisionModel.generateContent([prompt, filePart]);
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const aiAnalysis = JSON.parse(jsonString);

        // 3. Save to Database
        const { error: dbError } = await supabase
            .from('course_materials')
            .insert({
                student_course_id: courseId,
                type: type,
                title: file.name,
                content_url: publicUrl,
                ai_summary: aiAnalysis,
                week_number: aiAnalysis.week_number || null
            });

        if (dbError) throw dbError;

        return { success: true, analysis: aiAnalysis };

    } catch (error: any) {
        console.error("Upload Error:", error);
        return { success: false, error: error.message };
    }
}

// LEVEL 4: FLASHCARD GENERATOR ACTION
export async function generateFlashcards(courseId: string) {
    const supabase = await createClient();

    try {
        // 1. Fetch uploaded materials for this course
        const { data: materials, error: materialsError } = await supabase
            .from('course_materials')
            .select('*')
            .eq('student_course_id', courseId);

        if (materialsError) throw materialsError;
        if (!materials || materials.length === 0) {
            return { success: false, error: "No materials uploaded yet. Upload slides first!" };
        }

        // 2. Compile content from ai_summary fields
        const summaries = materials.map((m: any) => {
            const summary = m.ai_summary;
            return `## ${m.title}\nType: ${m.type}\nTopics: ${summary.topics?.join(', ') || summary.concepts?.join(', ') || 'N/A'}\nSummary: ${summary.summary || 'PDF analyzed'}`;
        }).join('\n\n');

        // 3. Generate Flashcards with Gemini
        const prompt = `
You are a Study Coach creating flashcards for a student.

Based on the following course material summaries, generate 10-15 high-quality flashcards.

MATERIAL OVERVIEW:
${summaries}

OUTPUT FORMAT (JSON Array, no markdown):
[
  { "front": "Question or term", "back": "Answer or definition", "tags": ["topic1", "topic2"] }
]

RULES:
1. Mix question types: definitions, concepts, application, comparison.
2. Front should be a clear question or term.
3. Back should be concise but complete.
4. Tags should reflect the topic area.
`;

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const flashcardsData = JSON.parse(jsonString);

        // 4. Insert flashcards into database
        const flashcardsToInsert = flashcardsData.map((fc: any) => ({
            student_course_id: courseId,
            front: fc.front,
            back: fc.back,
            tags: fc.tags || []
        }));

        const { error: insertError } = await supabase
            .from('flashcards')
            .insert(flashcardsToInsert);

        if (insertError) throw insertError;

        return { success: true, count: flashcardsToInsert.length };

    } catch (error: any) {
        console.error("Flashcard Generation Error:", error);
        return { success: false, error: error.message };
    }
}

// LEVEL 4: QUIZ ACTIONS

export async function generateQuizAction(courseId: string, config: {
    mcqConcepts: number;
    mcqProblems: number;
    trueFalse: number;
    writtenConcepts: number;
    writtenProblems: number;
}) {
    const supabase = await createClient();

    try {
        // 1. Fetch Materials Context & Course Details
        const { data: courseData } = await supabase
            .from('student_courses')
            .select(`
                name, 
                major_id,
                majors ( name )
            `)
            .eq('id', courseId)
            .single();

        const { data: materials } = await supabase
            .from('course_materials')
            .select('ai_summary')
            .eq('student_course_id', courseId);

        // Helper to safely get major name
        const majorName = Array.isArray(courseData?.majors)
            ? (courseData?.majors[0] as any)?.name
            : (courseData?.majors as any)?.name;

        let context = "";

        if (materials && materials.length > 0) {
            context = `COURSE: ${courseData?.name || 'Unknown'} (${majorName || 'Unknown'})
             
             MATERIALS:
             ${materials.map((m: any) => JSON.stringify(m.ai_summary)).join('\n')}`;
        } else {
            context = `COURSE: ${courseData?.name || 'Unknown'}
             MAJOR: ${majorName || 'General Studies'}
             
             WARNING: No specific materials were uploaded for this course. 
             YOU MUST GENERATE A QUIZ BASED ON THE STANDARD CURRICULUM FOR A UNIVERSITY COURSE TITLED "${courseData?.name}" IN THE FIELD OF "${majorName}".
             Ensure questions are appropriate for this level.`;
        }

        // 2. Prompt Gemini
        const totalQs = config.mcqConcepts + config.mcqProblems + config.trueFalse + config.writtenConcepts + config.writtenProblems;

        const prompt = `
        You are a Professor creating a quiz for a university course.
        
        CONTEXT (Course Materials Summaries):
        ${context.slice(0, 10000)} // Limit context to avoid token limits

        REQUEST: Generate a JSON Quiz with exactly ${totalQs} questions distributed as follows:
        - ${config.mcqConcepts} MCQ (Conceptual)
        - ${config.mcqProblems} MCQ (Problem Solving)
        - ${config.trueFalse} True/False
        - ${config.writtenConcepts} Written (Conceptual / Short Answer)
        - ${config.writtenProblems} Written (Problem Solving / Long Answer)

        OUTPUT FORMAT (JSON Array):
        [
          {
            "id": "unique_id",
            "type": "mcq" | "true_false" | "written",
            "category": "concept" | "problem",
            "question": "The question text",
            "options": ["A", "B", "C", "D"] (Only for MCQ),
            "correctAnswer": "The correct option or a model answer for written",
            "explanation": "Why this is correct"
          }
        ]
        
        IMPORTANT:
        - For 'written' questions, the 'correctAnswer' should be a concise rubric or key points required.
        - Ensure questions are challenging and relevant to the context.
        `;

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const questions = JSON.parse(jsonString);

        return { success: true, questions };

    } catch (error: any) {
        console.error("Quiz Gen Error:", error);
        return { success: false, error: error.message };
    }
}

export async function evaluateQuizAction(formData: FormData) {
    try {
        // Helper to parse FormData
        const quizDataString = formData.get('quizData') as string;
        const quizData = JSON.parse(quizDataString); // { questions: [], userAnswers: {} }
        const { questions, userAnswers } = quizData;

        // Process each question
        const results = await Promise.all(questions.map(async (q: any, index: number) => {
            const answer = userAnswers[q.id];

            // Skip if no answer
            if (!answer) return { questionId: q.id, score: 0, feedback: "No answer provided.", correct: false };

            // AUTO-GRADE MCQ/TF
            if (q.type === 'mcq' || q.type === 'true_false') {
                const isCorrect = answer.value === q.correctAnswer; // Assuming exact string match for simplicity
                // For MCQs, sometimes options are indices or text. Gemini usually outputs text.
                // Robustness: fuzzy match or index match? Let's assume exact text match for now as strictly prompted.
                // Better: Check if answer.value equals q.correctAnswer OR if q.correctAnswer is an index (0-3) and options[index] matches.
                // Keeping it simple: AI generates letter or text, UI handles it.
                return {
                    questionId: q.id,
                    score: isCorrect ? 100 : 0,
                    feedback: isCorrect ? "Correct!" : `Incorrect. The correct answer was: ${q.correctAnswer}. ${q.explanation}`,
                    correct: isCorrect
                };
            }

            // AI-GRADE WRITTEN
            if (q.type === 'written') {
                let prompt = "";
                let imagePart = null;

                if (answer.type === 'image') {
                    // Extract Base64 or File
                    // If it's a file in formData, we need to find it
                    const file = formData.get(`file_${q.id}`) as File;
                    if (file) {
                        imagePart = await fileToPart(file);
                        prompt = `
                        You are a Teaching Assistant grading a student's handwritten answer.
                        
                        QUESTION: ${q.question}
                        MODEL ANSWER / RUBRIC: ${q.correctAnswer}
                        
                        STUDENT ANSWER (See Image attached).
                        
                        TASK:
                        1. specific accuracy (0-100 score).
                        2. constructive feedback.
                        
                        OUTPUT JSON: { "score": number, "feedback": "..." }
                        `;
                    } else {
                        return { questionId: q.id, score: 0, feedback: "Error: Image file missing.", correct: false };
                    }
                } else {
                    // Text Answer
                    prompt = `
                    You are a Teaching Assistant grading a student's answer.
                    
                    QUESTION: ${q.question}
                    MODEL ANSWER: ${q.correctAnswer}
                    USER ANSWER: ${answer.value}
                    
                    TASK: Grade correctness (0-100) and provide feedback.
                    OUTPUT JSON: { "score": number, "feedback": "..." }
                    `;
                }

                // Call Gemini
                const parts: any[] = [prompt];
                if (imagePart) parts.push(imagePart);

                const result = await geminiVisionModel.generateContent(parts);
                const response = await result.response;
                const text = response.text();
                const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
                const grade = JSON.parse(jsonString);

                return {
                    questionId: q.id,
                    score: grade.score,
                    feedback: grade.feedback,
                    correct: grade.score >= 70
                };
            }

            return { questionId: q.id, score: 0, feedback: "Unknown Type", correct: false };
        }));

        // Calculate Totals
        const totalScore = results.reduce((acc, r) => acc + r.score, 0);
        const maxScore = questions.length * 100;
        const percentage = Math.round((totalScore / maxScore) * 100);

        return { success: true, results, percentage };

    } catch (error: any) {
        console.error("Grading Error:", error);
        return { success: false, error: error.message };
    }
}
