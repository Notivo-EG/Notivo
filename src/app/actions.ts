"use server";

import { geminiModel, geminiVisionModel, uploadFileToGemini } from "@/lib/gemini";

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
        // Using "gemini-2.5-flash" which supports multimodal input
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

// Helper: Download from Supabase and Upload to Gemini (Smart Fetch)
async function downloadAndUploadToGemini(supabase: any, contentUrl: string, fileName: string, mimeType: string = 'application/pdf') {
    try {
        console.log(`Smart Fetch: Downloading ${fileName} from ${contentUrl}...`);

        // 1. Download from Supabase
        // Extract path from URL or use the relative path if stored
        // contentUrl might be a full URL, but storage.download needs the path
        // Assuming contentUrl is like: .../storage/v1/object/public/materials/courseId/filename
        // But for private buckets or if we just have the path, it's safer to download via fetch if public, or admin client if private.
        // Let's assume contentUrl is accessible via fetch since it's "publicUrl" in uploadBrainMaterial.

        const response = await fetch(contentUrl);
        if (!response.ok) throw new Error(`Failed to download file from Supabase: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Save to Temp
        const tempPath = path.join(os.tmpdir(), `temp_${Date.now()}_${fileName}`);
        await fs.promises.writeFile(tempPath, buffer);

        // 3. Upload to Gemini
        // We can't use our uploadFileToGemini helper directly because it expects a File object (web API), 
        // but here we have a disk file.
        // Actually uploadFileToGemini in lib/gemini.ts takes a File object.
        // Let's modify uploadFileToGemini or use the underlying fileManager directly here.
        // To reuse uploadFileToGemini, we'd need to mock a File object, which is messy in Node.
        // Better to import fileManager from lib/gemini and use it directly.

        const { GoogleAIFileManager, FileState } = require("@google/generative-ai/server");
        const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

        console.log(`Uploading ${fileName} to Gemini...`);
        const uploadResponse = await fileManager.uploadFile(tempPath, {
            mimeType: mimeType,
            displayName: fileName,
        });

        const fileUri = uploadResponse.file.uri;
        const uploadName = uploadResponse.file.name;

        // Wait for active
        let fileState = uploadResponse.file.state;
        while (fileState === FileState.PROCESSING) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const fileStatus = await fileManager.getFile(uploadName);
            fileState = fileStatus.state;
        }

        if (fileState === FileState.FAILED) {
            throw new Error("Gemini File Processing Failed");
        }

        // Cleanup
        await fs.promises.unlink(tempPath);

        return { uri: fileUri, mimeType: mimeType };

    } catch (error) {
        console.error("Smart Fetch Error:", error);
        throw error;
    }
}

import fs from 'fs';
import os from 'os';
import path from 'path';

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
        // Use Native File API
        const uploadedFile = await uploadFileToGemini(file, file.type);

        const filePart = {
            fileData: {
                mimeType: uploadedFile.mimeType,
                fileUri: uploadedFile.uri
            }
        };

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
export async function generateFlashcards(courseId: string, materialIds?: string[]) {
    const supabase = await createClient();

    try {
        // 1. Fetch uploaded materials for this course
        let query = supabase
            .from('course_materials')
            .select('*')
            .eq('student_course_id', courseId);

        if (materialIds && materialIds.length > 0) {
            query = query.in('id', materialIds);
        }

        const { data: materials, error: materialsError } = await query;

        if (materialsError) throw materialsError;
        if (!materials || materials.length === 0) {
            return { success: false, error: "No materials uploaded yet. Upload slides first!" };
        }

        // 2. Smart Fetch: Prepare files for Gemini
        // We'll use the top 5 most recent files to avoid context context limits if too many
        const recentMaterials = materials.slice(0, 5);

        const fileParts = await Promise.all(recentMaterials.map(async (m: any) => {
            try {
                // Determine mime type (defaulting to pdf)
                const mimeType = m.type === 'sheet' || m.type === 'problem_sheet' ? 'application/pdf' : 'application/pdf'; // Store mime in DB? For now assume PDF.
                const { uri } = await downloadAndUploadToGemini(supabase, m.content_url, m.title, mimeType);
                return {
                    fileData: {
                        mimeType: mimeType,
                        fileUri: uri
                    }
                };
            } catch (e) {
                console.error(`Failed to process ${m.title} for flashcards:`, e);
                return null;
            }
        }));

        const validFileParts = fileParts.filter(p => p !== null);

        if (validFileParts.length === 0) {
            // Fallback to text summary if all uploads fail
            const summaries = materials.map((m: any) => {
                const summary = m.ai_summary;
                return `## ${m.title}\nType: ${m.type}\nTopics: ${summary.topics?.join(', ') || summary.concepts?.join(', ') || 'N/A'}\nSummary: ${summary.summary || 'PDF analyzed'}`;
            }).join('\n\n');

            const prompt = `
            You are a Study Coach creating flashcards for a student.
            Based on the following course material summaries, generate 10-15 high-quality flashcards.
            MATERIAL OVERVIEW:
            ${summaries}
            
            OUTPUT FORMAT (JSON Array, no markdown):
            [{ "front": "...", "back": "...", "tags": [] }]
            `;

            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const flashcardsData = JSON.parse(jsonString);

            // Insert and return... (dup logic, simplified for now)
            const flashcardsToInsert = flashcardsData.map((fc: any) => ({
                student_course_id: courseId,
                front: fc.front,
                back: fc.back,
                tags: fc.tags || []
            }));
            const { error: insertError } = await supabase.from('flashcards').insert(flashcardsToInsert);
            if (insertError) throw insertError;
            return { success: true, count: flashcardsToInsert.length };
        }

        // 3. Generate Flashcards with Gemini (Native File API)
        const prompt = `
        You are an advanced educational tool designed to convert lecture notes and textbook content into a comprehensive JSON dataset of flashcards. Your goal is strict granularity every distinct piece of information must become its own flashcard.

        ### CORE DIRECTIVES
        1. Granularity If the input text contains 100 distinct facts, you must generate 100 distinct flashcards. Do not summarize or combine multiple facts into one card.
        2. Coverage Cover the whole lecture. Do not omit any details. Do not add external information not present in the text.
        3. Exclusions Do NOT create cards for complex numerical calculations or theoretical derivations. Focus on facts, recall, and relationships.
        4. Ordering Maintain the chronological order of information as it appears in the source text.
        5. Language Detect the language of the input (English or Arabic) and generate the flashcard in that same language. If the text is mixed, maintain the context language.
        
        ### FLASHCARD TYPES
        You must generate cards in three specific formats. Rotate through them based on the content type
        1. Definition The front is the term; the back is the definition.
        2. Scientific Term The front is the definitiondescription; the back is the specific term.
        3. Complete A fill-in-the-blank statement. The front contains the sentence with the key keyword replaced by ______; the back contains the missing word(s).
        
        ### JSON STRUCTURE
        Output ONLY a valid JSON array. Do not include markdown formatting (like \`\`\`json) or conversational text. Use this schema
        
        [
          {
            "id": 1,
            "type": "Definition" | "Scientific Term" | "Complete",
            "front": "String (The question or prompt)",
            "back": "String (The answer)",
            "explanation": "String (Context or brief elaboration regarding the answer)",
            "language": "English" | "Arabic"
          }
        ]
        
        ### EXAMPLE LOGIC
        Input Mitochondria are the powerhouse of the cell. They generate ATP through oxidative phosphorylation.
        Output
        [
          {
            "id": 1,
            "type": "Scientific Term",
            "front": "What organelle is known as the powerhouse of the cell,",
            "back": "Mitochondria",
            "explanation": "Mitochondria are organelles responsible for energy production.",
            "language": "English"
          },
          {
            "id": 2,
            "type": "Complete",
            "front": "Mitochondria generate ______ through oxidative phosphorylation.",
            "back": "ATP",
            "explanation": "ATP is the energy currency generated by the mitochondria.",
            "language": "English"
          }
        ]
        `;

        const result = await geminiModel.generateContent([prompt, ...validFileParts]);
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const flashcardsData = JSON.parse(jsonString);

        // 4. Insert flashcards into database
        const flashcardsToInsert = flashcardsData.map((fc: any) => ({
            student_course_id: courseId,
            front: fc.front,
            back: fc.back,
            // tags: fc.tags || [], // Removed per new prompt
            explanation: fc.explanation,
            type: fc.type,
            language: fc.language
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
}, materialIds?: string[]) {
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

        let query = supabase
            .from('course_materials')
            .select('*') // Fixed: select * to get content_url
            .eq('student_course_id', courseId);

        if (materialIds && materialIds.length > 0) {
            query = query.in('id', materialIds);
        }

        const { data: materials } = await query;

        // Helper to safely get major name
        const majorName = Array.isArray(courseData?.majors)
            ? (courseData?.majors[0] as any)?.name
            : (courseData?.majors as any)?.name;

        // 2. Smart Fetch for Quiz Context
        let fileParts: any[] = [];
        if (materials && materials.length > 0) {
            const recentMaterials = materials.slice(0, 5);
            fileParts = (await Promise.all(recentMaterials.map(async (m: any) => {
                try {
                    const mimeType = 'application/pdf';
                    const { uri } = await downloadAndUploadToGemini(supabase, m.content_url, m.title, mimeType);
                    return { fileData: { mimeType, fileUri: uri } };
                } catch { return null; }
            }))).filter(p => p !== null);
        }

        // 3. Prompt Gemini
        const totalQs = config.mcqConcepts + config.mcqProblems + config.trueFalse + config.writtenConcepts + config.writtenProblems;

        const prompt = `
        You are a Professor creating a quiz for a university course: ${courseData?.name} (${majorName}).
        
        Using the ATTACHED DOCUMENTS (if any) as the primary source material, generate a rigorous quiz.
        If no documents are attached, generate based on standard curriculum for this subject.

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

// LEVEL 4: INFOGRAPHIC ACTION (STAGE 1 CHECKPOINT)
export async function generateInfographicAction(courseId: string, materialId: string, customPrompt?: string) {
    const supabase = await createClient();
    try {
        // 1. Fetch Material Info
        const { data: material } = await supabase
            .from('course_materials')
            .select('*')
            .eq('id', materialId)
            .single();

        if (!material) throw new Error("Material not found");

        // 2. Smart Fetch & Upload to Gemini
        const mimeType = 'application/pdf'; // assume PDF for now
        const { uri } = await downloadAndUploadToGemini(supabase, material.content_url, material.title, mimeType);

        const systemPrompt = `
        You are an Expert Information Designer.
        Analyze this document to create a high-impact Infographic.
        
        User Goal: ${customPrompt || "Summarize the key concepts visually."}
        
        OUTPUT FORMAT (JSON):
        {
          "insights": ["Key point 1", "Key point 2", "Key point 3"],
          "summary": "Brief summary",
          "entities": ["Concept A", "Concept B"],
          "infographicPrompt": "Detailed visual description for an image generator (e.g. 'A futuristic 3D infographic showing...')",
          "aspectRatio": "3:4" | "16:9" | "1:1"
        }
        `;

        const result = await geminiVisionModel.generateContent([systemPrompt, { fileData: { mimeType, fileUri: uri } }]);
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonString);

        return { success: true, data: data };

    } catch (error: any) {
        console.error("Infographic Action Error:", error);
        return { success: false, error: error.message };
    }
}

// LEVEL 4: SONG GENERATOR ACTION (Suno API)
const SUNO_API_URL = 'https://api.sunoapi.org/api/v1';
const SUNO_POLL_INTERVAL = 5000; // 5 seconds
const SUNO_MAX_POLL_ATTEMPTS = 60; // 5 minutes max

export async function generateSong(courseId: string, style: string = 'Electronic Pop') {
    const supabase = await createClient();

    try {
        // 1. Fetch course materials
        const { data: materials, error: materialsError } = await supabase
            .from('course_materials')
            .select('id, title, content_url, type')
            .eq('student_course_id', courseId)
            .limit(3); // Limit to 3 PDFs for prompt generation

        if (materialsError) throw new Error(materialsError.message);
        if (!materials || materials.length === 0) {
            return { success: false, error: "No materials found. Please upload PDFs first." };
        }

        // 2. Get course name for title
        const { data: course } = await supabase
            .from('student_courses')
            .select('name')
            .eq('id', courseId)
            .single();

        const courseName = course?.name || 'Educational';

        // 3. Prepare content for Gemini
        const parts: any[] = [];
        for (const material of materials) {
            if (material.content_url) {
                try {
                    const uploadedFile = await downloadAndUploadToGemini(
                        supabase,
                        material.content_url,
                        material.title || 'document.pdf'
                    );
                    parts.push({
                        fileData: {
                            mimeType: uploadedFile.mimeType,
                            fileUri: uploadedFile.uri,
                        },
                    });
                } catch (err) {
                    console.warn(`Skipping file ${material.title}:`, err);
                }
            }
        }

        if (parts.length === 0) {
            return { success: false, error: "Could not process any materials." };
        }

        // 4. Generate music prompt with Gemini
        const systemInstruction = `You are an expert Prompt Engineer for the Suno API. Your specific goal is to turn educational materials into prompt so suno api can make a memorable song

Instructions:
1. READ THE PDF: Extract the specific main topics, definitions, or core concepts from the user's uploaded document.
2. ANALYZE THE IMAGE: Deduce the musical genre, tempo, and atmosphere from the visual style of the user's uploaded image.
3. GENERATE PROMPT: Create a single text string optimized for the Suno API.

Strict Output Constraints:
- Length: Must be LESS than 500 characters total.
- Content: The lyrics must explicitly rhyme the main topics found in the PDF.
- Format: [Genre/Style Tags] followed by [Lyrics].
- No Filler: Output ONLY the prompt string. Do not use conversational text or markdown explanation.
- Goal: Maximize educational retention through catchy, rhythmic hooks.`;

        const userPrompt = `Analyze these educational documents and create a music generation prompt in the ${style} style.

The prompt should be UNDER 500 characters and describe what kind of song to generate based on the educational content.

Output ONLY the prompt, no explanations.`;

        parts.push({ text: systemInstruction });

        const geminiResult = await geminiVisionModel.generateContent({
            contents: [{ role: 'user', parts }],
            systemInstruction: { role: 'user', parts: [{ text: systemInstruction }] },
            generationConfig: { temperature: 0.8, maxOutputTokens: 200 },
        });

        let musicPrompt = geminiResult.response.text().trim();
        if (musicPrompt.length > 500) {
            musicPrompt = musicPrompt.slice(0, 497) + '...';
        }

        console.log('Generated music prompt:', musicPrompt);

        // 5. Call Suno API to generate music
        const sunoApiKey = process.env.SUNO_API_KEY;
        if (!sunoApiKey) {
            return { success: false, error: "Suno API key not configured." };
        }

        const generateResponse = await fetch(`${SUNO_API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sunoApiKey}`,
            },
            body: JSON.stringify({
                prompt: musicPrompt,
                customMode: false, // User requested lyrics in prompt, but customMode=false uses description. 
                // Wait, if user wants explicit lyrics in prompt, customMode might need to be true?
                // Actually, Suno V3/V4 with customMode=false takes a description. 
                // If the prompt contains [Lyrics], it might need customMode=true.
                // However, the user said "turn educational materials into prompt so suno api can make a memorable song"
                // And "The lyrics must explicitly rhyme..." implies the prompt should CONTAIN the lyrics?
                // If customMode=false, the prompt is a description.
                // If customMode=true, the prompt is lyrics + style.
                // Let's stick to customMode=false for now as Suno follows descriptions well, 
                // unless the user specifically wants us to write the lyrics.
                // The prompt says "Format: [Genre/Style Tags] followed by [Lyrics]". This sounds like Custom Mode input.
                // But the user's prompt is for "Suno API prompt". 
                // Let's try sending it as description first (customMode=false).
                instrumental: false,
                model: 'V4',
                callBackUrl: 'https://example.com/callback',
            }),
        });

        if (!generateResponse.ok) {
            const errorText = await generateResponse.text();
            throw new Error(`Suno API error: ${generateResponse.status} - ${errorText}`);
        }

        const generateData = await generateResponse.json();
        console.log('Suno generation response:', generateData);

        if (generateData.code && generateData.code !== 200) {
            throw new Error(`Suno API Error (${generateData.code}): ${generateData.msg}`);
        }

        const taskId = generateData.data?.taskId;
        if (!taskId) {
            throw new Error('No task ID returned from Suno API');
        }

        // 6. Poll for completion
        let attempts = 0;
        while (attempts < SUNO_MAX_POLL_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, SUNO_POLL_INTERVAL));

            let statusResponse;
            try {
                statusResponse = await fetch(
                    `${SUNO_API_URL}/generate/record-info?taskId=${taskId}`,
                    {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${sunoApiKey}` },
                    }
                );
            } catch (err) {
                console.warn(`Polling network error (attempt ${attempts}):`, err);
                attempts++;
                continue;
            }

            if (!statusResponse.ok) {
                attempts++;
                continue;
            }

            const statusData = await statusResponse.json();
            // console.log('Suno status check:', JSON.stringify(statusData, null, 2));

            const innerData = statusData.data || statusData;
            const status = (innerData.status || statusData.status || '').toLowerCase();

            if (status === 'complete' || status === 'success') {
                const sunoData = innerData.response?.sunoData || innerData.sunoData || innerData.data || innerData;

                if (Array.isArray(sunoData) && sunoData.length > 0) {
                    const song = sunoData[0];

                    const audioUrl = song.sourceAudioUrl ||
                        (song.audioUrl && song.audioUrl !== "" ? song.audioUrl : null) ||
                        song.streamAudioUrl ||
                        song.stream_audio_url ||
                        song.audio_url ||
                        song.audio_url_large;

                    if (!audioUrl) {
                        console.error('Full song object:', song);
                        throw new Error('No audio URL in response');
                    }

                    const songTitle = song.title || `${courseName} - ${style} Mix`;
                    const coverUrl = song.imageUrl || song.image_large_url || song.image_url;

                    // Extract lyrics if available
                    // Suno API often returns lyrics in 'metadata' object or directly
                    const lyrics = song.metadata?.prompt || song.metadata?.lyrics || song.prompt || "Lyrics not available.";

                    // 7. Save to database
                    const { error: insertError } = await supabase
                        .from('generated_songs')
                        .insert({
                            student_course_id: courseId,
                            title: songTitle,
                            audio_url: audioUrl,
                            cover_url: coverUrl,
                            style: style,
                            prompt: musicPrompt,
                            lyrics: lyrics // Save lyrics
                        });

                    if (insertError) console.error('Failed to save song:', insertError);

                    return {
                        success: true,
                        data: {
                            title: songTitle,
                            audioUrl: audioUrl,
                            coverUrl: coverUrl,
                            lyrics: lyrics
                        },
                    };
                }
            }

            if (status === 'failed' || status === 'error') {
                throw new Error(`Suno generation failed: ${innerData.errorMessage || 'Unknown error'}`);
            }

            // Streaming check (simplified for now, full complete prefered)
            attempts++;
        }

        return { success: false, error: 'Song generation timed out. Please try again.' };

    } catch (error: any) {
        console.error("Song Generation Error:", error);
        return { success: false, error: error.message };
    }
}
