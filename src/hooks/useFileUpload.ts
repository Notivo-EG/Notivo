'use client';

import { useState, useCallback } from 'react';
import { SourceFile } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const ACCEPTED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface FileValidationError {
    file: File;
    error: string;
}

export function useFileUpload() {
    const [files, setFiles] = useState<SourceFile[]>([]);
    const [errors, setErrors] = useState<FileValidationError[]>([]);

    const validateFile = useCallback((file: File): string | null => {
        console.log('Validating file:', file.name, 'Type:', file.type, 'Size:', file.size);
        const name = file.name.toLowerCase().trim();
        const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf');
        const isWord = ACCEPTED_TYPES.includes(file.type) && !isPdf;
        const isText = file.type === 'text/plain' || name.endsWith('.txt');

        if (!isPdf && !ACCEPTED_TYPES.includes(file.type) && !isText) {
            return `Invalid file type: ${file.type || 'unknown'}`;
        }
        if (file.size > MAX_FILE_SIZE) {
            return `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 50MB)`;
        }
        return null;
    }, []);

    const addFiles = useCallback((newFiles: File[]) => {
        const validationErrors: FileValidationError[] = [];
        const validFiles: SourceFile[] = [];

        newFiles.forEach(file => {
            const error = validateFile(file);
            if (error) {
                validationErrors.push({ file, error });
            } else {
                // Check for duplicates
                const isDuplicate = files.some(f => f.name === file.name && f.size === file.size);
                if (!isDuplicate) {
                    validFiles.push({
                        id: uuidv4(),
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        file,
                        selected: true,
                        uploadProgress: 100, // Simulated immediate upload
                    });
                }
            }
        });

        setErrors(validationErrors);
        setFiles(prev => [...prev, ...validFiles]);
    }, [files, validateFile]);

    const removeFile = useCallback((id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    const toggleSelection = useCallback((id: string) => {
        setFiles(prev => prev.map(f =>
            f.id === id ? { ...f, selected: !f.selected } : f
        ));
    }, []);

    const selectAll = useCallback(() => {
        setFiles(prev => prev.map(f => ({ ...f, selected: true })));
    }, []);

    const deselectAll = useCallback(() => {
        setFiles(prev => prev.map(f => ({ ...f, selected: false })));
    }, []);

    const clearFiles = useCallback(() => {
        setFiles([]);
        setErrors([]);
    }, []);

    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    const selectedFiles = files.filter(f => f.selected);
    const hasSelectedFiles = selectedFiles.length > 0;

    return {
        files,
        selectedFiles,
        hasSelectedFiles,
        errors,
        addFiles,
        removeFile,
        toggleSelection,
        selectAll,
        deselectAll,
        clearFiles,
        clearErrors,
    };
}
