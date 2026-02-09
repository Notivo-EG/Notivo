export const VIDEO_API_URL = process.env.NEXT_PUBLIC_VIDEO_API_URL || 'http://localhost:5000';

export interface VideoJob {
    job_id: string;
    status: 'pending' | 'analyzing' | 'generating_script' | 'generating_audio' | 'generating_manim' | 'rendering' | 'composing' | 'completed' | 'failed' | 'cancelled';
    progress_percent: number;
    current_stage: string;
    error_message?: string;
    output_path?: string;
    video_url?: string;  // Supabase public URL (used when deployed)
    created_at: string;
}

export interface VideoConfig {
    voice: string;
    voice_style: string;
    speaking_rate: number;
    animation_style: string;
    detail_level: 'brief' | 'medium' | 'comprehensive';
    max_duration: number;
    native_analysis: boolean;
}

export async function startVideoGeneration(files: File[], config: VideoConfig) {
    const formData = new FormData();

    // We need to read files as base64 to send to the Python API if we want to avoid multipart form data complexity
    // or we can send as JSON with base64 content. The Python API expects JSON.

    const filePromises = files.map(file => new Promise<{ filename: string, content: string, mimeType: string, base64: boolean }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve({
                filename: file.name,
                content: base64String,
                mimeType: file.type,
                base64: true
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    }));

    const filesData = await Promise.all(filePromises);

    const response = await fetch(`${VIDEO_API_URL}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            files: filesData,
            config: config
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start video generation');
    }

    return await response.json();
}

export async function getVideoStatus(jobId: string): Promise<VideoJob> {
    const response = await fetch(`${VIDEO_API_URL}/api/jobs/${jobId}`);
    if (!response.ok) {
        throw new Error('Failed to get job status');
    }
    return await response.json();
}

export async function getVideoDownloadUrl(jobId: string): Promise<string> {
    // First try to get the video URL from job status (Supabase URL when deployed)
    try {
        const job = await getVideoStatus(jobId);
        if (job.video_url) {
            return job.video_url;
        }
    } catch {
        // fall through to local URL
    }
    return `${VIDEO_API_URL}/api/video/${jobId}`;
}
