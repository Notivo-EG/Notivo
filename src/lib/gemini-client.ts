// Gemini 2.5 Flash API client

import { GeminiResponse } from './types';
import { buildPromptWithContent } from './prompts';

interface ProcessDocumentsOptions {
    files: File[];
    customPrompt?: string;
    onProgress?: (progress: number) => void;
}

export async function processDocuments({
    files,
    customPrompt,
    onProgress,
}: ProcessDocumentsOptions): Promise<GeminiResponse> {
    try {
        onProgress?.(10);

        // Prepare FormData for file upload
        const formData = new FormData();

        // Append all files
        files.forEach(file => {
            formData.append('files', file);
        });

        // Append custom prompt if exists
        const promptTemplate = customPrompt || buildPromptWithContent('', customPrompt);
        // We actually just pass the raw template string, the server will inject content
        // But buildPromptWithContent logic in prompts.ts handles retrieval from storage if customPrompt is undefined

        // Let's rely on the server to retrieve the default prompt if not provided, 
        // but here we can pass the specific user prompt state
        if (customPrompt) {
            formData.append('customPrompt', customPrompt);
        }

        onProgress?.(30);

        // Call the API route
        const response = await fetch('/api/gemini', {
            method: 'POST',
            body: formData,
        });

        onProgress?.(80);

        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // If response isn't JSON, just use statusText
            }
            throw new Error(`API request failed: ${errorMessage}`);
        }

        const data = await response.json();
        onProgress?.(100);

        return data;
    } catch (error) {
        console.error('Error processing documents:', error);
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to process documents',
        };
    }
}

async function extractTextFromFile(file: File): Promise<string> {
    // For now, we'll just read text files directly
    // In a production app, you'd use a PDF parsing library
    if (file.type === 'text/plain') {
        return await file.text();
    }

    // For PDF and other file types, we'll simulate extraction
    // In production, use pdf-parse or similar library
    return `[Content extracted from: ${file.name}]\n\nThis is simulated content extraction. In production, implement proper PDF/document parsing using libraries like pdf-parse for PDFs or mammoth for DOCX files.`;
}
