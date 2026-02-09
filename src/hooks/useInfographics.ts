'use client';

import { useState, useEffect, useCallback } from 'react';
import { Infographic } from '@/lib/types';
import { infographicService } from '@/services/infographicService';
import { getInfographics } from '@/lib/storage';

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

    const syncLocalData = useCallback(async () => {
        const localItems = getInfographics();
        if (localItems.length === 0) return 0;

        let count = 0;
        setIsLoading(true);
        try {
            for (const item of localItems) {
                // Check if already exists to avoid duplicates
                // (Simple check by ID, or could check by title)
                // For now, we'll just try to save. If ID conflicts, it might error or update.
                // Since local IDs are UUIDs, collision is unlikely unless already synced.

                // We assign the current courseId if the item doesn't have one
                if (!item.courseId && courseId) {
                    item.courseId = courseId;
                }

                if (item.courseId) {
                    await infographicService.save(item);
                    count++;
                }
            }
            // Clear local storage after successful sync? 
            // Maybe safer to keep it or let user clear it?
            // For now, we won't delete automatically to be safe.
            await refresh();
        } catch (err) {
            console.error("Sync failed:", err);
            setError('Failed to sync some items');
        } finally {
            setIsLoading(false);
        }
        return count;
    }, [courseId, refresh]);

    // Check for local items on mount (only once)
    const [hasLocalItems, setHasLocalItems] = useState(false);
    useEffect(() => {
        const local = getInfographics();
        if (local.length > 0) {
            setHasLocalItems(true);
        }
    }, []);

    return {
        infographics,
        isLoading,
        error,
        addInfographic,
        removeInfographic,
        refresh,
        syncLocalData,
        hasLocalItems
    };
}
