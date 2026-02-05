import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Mock infographic URLs for development
const MOCK_INFOGRAPHIC_URLS = [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&h=800&fit=crop',
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt, aspectRatio } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'No prompt provided' },
                { status: 400 }
            );
        }

        // Validate aspect ratio (simple check, or default to 1:1)
        // Valid Gemini ratios: 1:1, 16:9, 9:16, 4:3, 3:4
        const validRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
        const finalAspectRatio = (aspectRatio && validRatios.includes(aspectRatio)) ? aspectRatio : '1:1';

        // Use GEMINI_API_KEY as we are now using Gemini for image generation
        // Fallback to NANO_BANANA_API_KEY for backward compatibility if set
        // const apiKey = process.env.GEMINI_API_KEY || process.env.NANO_BANANA_API_KEY;
        const apiKey = process.env.NANO_BANANA_API_KEY;

        if (!apiKey) {
            // Return mock response for development
            console.log('No API key found, returning mock image');

            // Simulate generation delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            const randomIndex = Math.floor(Math.random() * MOCK_INFOGRAPHIC_URLS.length);

            return NextResponse.json({
                success: true,
                imageUrl: MOCK_INFOGRAPHIC_URLS[randomIndex],
                isMock: true,
            });
        }

        const ai = new GoogleGenAI({ apiKey });

        const generateImage = async (modelName: string) => {
            console.log(`Attempting image generation with model: ${modelName} (Ratio: ${finalAspectRatio})`);
            const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                    imageConfig: {
                        aspectRatio: finalAspectRatio,
                    },
                },
            });

            const part = response.candidates?.[0]?.content?.parts?.[0];

            if (part && part.inlineData) {
                const imageData = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/jpeg';
                // Create data URL
                return `data:${mimeType};base64,${imageData}`;
            }
            throw new Error(`No image data received from ${modelName}`);
        };

        let imageUrl: string;

        try {
            // Try primary model
            imageUrl = await generateImage("gemini-3-pro-image-preview");
        } catch (error: any) {
            console.warn(`Primary model failed: ${error.message}`);
            // Check if it's worth retrying (e.g. 429, 5xx, or generic error)
            // We'll unconditionally retry with the fallback for robustness
            console.log('Falling back to gemini-2.5-flash-image...');

            try {
                imageUrl = await generateImage("gemini-2.5-flash-image");
            } catch (fallbackError: any) {
                console.error('Fallback model also failed:', fallbackError);
                // Throw the *original* error often makes more sense, or a combined one. 
                // But if the fallback fails, let's report the fallback error or a generic one.

                // If the primary was a 429, and secondary is also 429, we truly are out of quota.
                if (error.status === 429 || fallbackError.status === 429) {
                    return NextResponse.json(
                        { error: 'Image generation quota exceeded on both primary and fallback models. Please wait a moment.' },
                        { status: 429 }
                    );
                }
                throw fallbackError; // Re-throw to be caught by the outer block
            }
        }

        return NextResponse.json({
            success: true,
            imageUrl: imageUrl,
            isMock: false
        });

    } catch (error: any) {
        console.error('Error in Generate API route:', error);

        // Handle Quota/Rate Limit errors (final catch)
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
            return NextResponse.json(
                { error: 'Free tier image generation quota exceeded. Please wait 1-2 minutes and try again.' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
