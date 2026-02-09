'use client';

import { useState, useEffect, useCallback } from 'react';
import { Infographic } from '@/lib/types';
import { infographicService } from '@/services/infographicService';

export function useInfographics(courseId?: string) {
    const [infographics, setInfographics] = useState<Infographic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch
    useEffect(() => {
        if (courseId) {
            refresh();
        } else {
            setInfographics([]);
            setIsLoading(false);
        }
    }, [courseId]);

    const refresh = useCallback(async () => {
        if (!courseId) return;
        setIsLoading(true);
        try {
            const data = await infographicService.getAll(courseId);
            setInfographics(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load infographics');
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

    const addInfographic = useCallback(async (infographic: Infographic) => {
        // Optimistic update
        setInfographics(prev => [infographic, ...prev]);

        try {
            await infographicService.save(infographic);
        } catch (err) {
            console.error(err);
            setError('Failed to save infographic');
            // Rollback on error
            setInfographics(prev => prev.filter(i => i.id !== infographic.id));
        }
    }, []);

    const removeInfographic = useCallback(async (id: string) => {
        // Optimistic update
        const previousState = [...infographics];
        setInfographics(prev => prev.filter(item => item.id !== id));

        try {
            await infographicService.delete(id);
        } catch (err) {
            console.error(err);
            setError('Failed to delete infographic');
            // Rollback
            setInfographics(previousState);
        }
    }, [infographics]);

    return {
        infographics,
        isLoading,
        error,
        addInfographic,
        removeInfographic,
        refresh
    };
}
