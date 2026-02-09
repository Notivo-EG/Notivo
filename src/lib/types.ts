// Type definitions for the PDF to Infographic application

export interface SourceFile {
    id: string;
    name: string;
    size: number;
    type: string;
    file: File;
    thumbnail?: string;
    selected: boolean;
    uploadProgress: number;
}

export interface Infographic {
    id: string;
    title: string;
    imageUrl: string;
    sources: { id: string; name: string }[];
    sourceIndexes?: number[]; // Indexes of selected PDFs (e.g., [1, 3])
    createdAt: string;
    courseId?: string;
}

export interface GeminiResponse {
    status: 'success' | 'error';
    data?: {
        insights: string[];
        summary: string;
        entities: string[];
        infographicPrompt: string;
        aspectRatio?: string;
    };
    error?: string;
    isMock?: boolean;
}

export interface GenerationState {
    status: 'idle' | 'processing' | 'generating' | 'complete' | 'error';
    progress: number;
    message: string;
    currentStage: 'idle' | 'analyzing' | 'generating' | 'finalizing';
}

export interface ToastNotification {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    duration?: number;
}
