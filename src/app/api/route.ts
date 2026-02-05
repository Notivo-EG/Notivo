
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { DEFAULT_GEMINI_PROMPT } from '@/lib/prompts';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        const customPrompt = formData.get('customPrompt') as string;

        if (!files || files.length === 0) {
            return NextResponse.json(
                { status: 'error', error: 'No files provided' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.log('No GEMINI_API_KEY found, returning mock response');
            return NextResponse.json({
                status: 'success',
                data: {
                    infographicPrompt: "Mock prompt because API key is missing. This confirms the new API route is working!",
                    insights: ["Mock insight from improved API"],
                    summary: "Mock summary from improved API",
                    entities: []
                },
                isMock: true
            });
        }

        // Initialize Gemini API
        // Note: @google/genai handles Files differently than the old SDK.
        // It's integrated into the client rather than a separate FileManager class in some versions,
        // but let's check if we can use the main client for files.
        const ai = new GoogleGenAI({ apiKey });

        const template = customPrompt || DEFAULT_GEMINI_PROMPT;
        // Clean up any remaining legacy placeholders
        const prompt = template.replace('{{DOCUMENT_CONTENT}}', '[See attached PDF documents]');

        // Array to hold file URIs to pass to generation
        const fileUris: string[] = [];
        const tempFiles: string[] = [];

        try {
            // 1. Upload Phase
            for (const file of files) {
                // Write to temp disk
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const tempFilePath = path.join(os.tmpdir(), file.name || `upload_${Date.now()}`);
                await writeFile(tempFilePath, buffer);
                tempFiles.push(tempFilePath);

                console.log(`Uploading ${file.name} to Gemini File API...`);

                // Upload using the SDK
                const uploadResult = await ai.files.upload({
                    file: tempFilePath,
                    config: {
                        mimeType: file.type || 'application/pdf',
                        displayName: file.name
                    }
                });

                if (!uploadResult.name || !uploadResult.uri) {
                    throw new Error(`Upload failed for ${file.name}`);
                }
                console.log(`Uploaded ${file.name} as ${uploadResult.name}`);
                const fileUri = uploadResult.uri;

                // 2. Poll Phase
                let fileState = uploadResult.state;
                let fileName = uploadResult.name;

                console.log(`Waiting for ${fileName} to process...`);

                // Simple polling loop
                while (fileState === 'PROCESSING') {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const fileStatus = await ai.files.get({ name: fileName });
                    fileState = fileStatus.state;
                    console.log(`File ${fileName} state: ${fileState}`);
                }

                if (fileState === 'FAILED') {
                    throw new Error(`Gemini failed to process file: ${file.name}`);
                }

                fileUris.push(fileUri);
            }

            // 3. Generate Phase
            console.log('Generating content with file references...');
            const model = 'gemini-2.5-flash-lite';

            // Construct content parts: file URIs then text prompt
            const parts: any[] = fileUris.map(uri => ({
                fileData: {
                    mimeType: 'application/pdf', // Assuming all are PDFs for now, strict type from file.type better
                    fileUri: uri
                }
            }));

            parts.push({ text: prompt });

            const result = await ai.models.generateContent({
                model,
                contents: [{
                    role: 'user',
                    parts: parts
                }],
                config: {
                    responseMimeType: 'text/plain',
                    // @ts-ignore - Types might lag behind the API capabilities
                    thinkingConfig: {
                        includeThoughts: false,
                        thinkingBudget: 2048
                    }
                }
            });

            const text = result.text ||
                result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error('Empty response from AI model');
            }

            // Extract Aspect Ratio if present
            // Patterns: "**Aspect Ratio:** 16:9", "Aspect Ratio: 9:16", etc.
            const ratioMatch = text.match(/(?:Aspect Ratio|aspect ratio|Dimensions|dimensions)\s*[:]\s*(?:\*\*)?([0-9]+[:][0-9]+)(?:\*\*)?/i);
            const aspectRatio = ratioMatch ? ratioMatch[1] : undefined;

            // Return natural language text
            const data = {
                infographicPrompt: text,
                aspectRatio: aspectRatio,
                insights: ["Analysis generated from File API processing"],
                summary: "File API native processing mode", // ...
                entities: []
            };

            return NextResponse.json({
                status: 'success',
                data: data
            });

        } finally {
            // Cleanup temp files on disk
            for (const tempPath of tempFiles) {
                try {
                    await unlink(tempPath);
                } catch (e) {
                    console.error(`Failed to delete temp file ${tempPath}:`, e);
                }
            }
        }

    } catch (error) {
        console.error('Error in Gemini API route:', error);
        return NextResponse.json(
            {
                status: 'error',
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}
