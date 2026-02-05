// Nano Banana Pro API client for infographic generation

interface GenerateInfographicOptions {
    prompt: string;
    aspectRatio?: string;
    onProgress?: (progress: number) => void;
}

export async function generateInfographic({
    prompt,
    aspectRatio,
    onProgress,
}: GenerateInfographicOptions): Promise<string> {
    try {
        onProgress?.(10);

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, aspectRatio }),
        });

        onProgress?.(70);

        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // If response isn't JSON, just use statusText
            }
            throw new Error(`Generation failed: ${errorMessage}`);
        }

        const data = await response.json();
        onProgress?.(100);

        return data.imageUrl;
    } catch (error) {
        console.error('Error generating infographic:', error);
        throw error;
    }
}
