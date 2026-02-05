
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

const apiKey = process.env.GEMINI_API_KEY!;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing from environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// Restoration of models used in actions.ts
// Using gemini-2.5-flash for speed and multimodal capabilities
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
export const geminiVisionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// NEW: Upload File using Google AI File API
export async function uploadFileToGemini(file: File, mimeType: string = "application/pdf") {
    try {
        // 1. Save File Temporarily
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempFilePath = path.join(os.tmpdir(), `${Date.now()}_${file.name}`);
        await writeFile(tempFilePath, buffer);

        try {
            // 2. Upload to Gemini
            console.log(`Uploading ${file.name} to Gemini...`);
            const uploadResponse = await fileManager.uploadFile(tempFilePath, {
                mimeType: mimeType,
                displayName: file.name,
            });

            const fileUri = uploadResponse.file.uri;
            const fileName = uploadResponse.file.name; // 'files/...'

            console.log(`Uploaded ${file.name} as ${fileName} (${fileUri})`);

            // 3. Wait for Active State
            let fileState = uploadResponse.file.state;
            while (fileState === FileState.PROCESSING) {
                console.log("Processing file...");
                await new Promise((resolve) => setTimeout(resolve, 2000));
                const fileStatus = await fileManager.getFile(fileName);
                fileState = fileStatus.state;
            }

            if (fileState === FileState.FAILED) {
                throw new Error("Gemini File Processing Failed");
            }

            console.log(`File ${fileName} is ACTIVE.`);

            // Return the URI and Name for use in prompts
            return {
                uri: fileUri,
                name: fileName,
                mimeType: mimeType
            };

        } finally {
            // 4. Cleanup Temp File
            await unlink(tempFilePath).catch(e => console.error("Temp file cleanup failed:", e));
        }

    } catch (error: any) {
        console.error("Error uploading to Gemini:", error);
        throw new Error(`Gemini Upload Failed: ${error.message}`);
    }
}
