// localStorage helpers for infographic persistence

import { Infographic } from './types';

const INFOGRAPHICS_STORAGE_KEY = 'stored-infographics';

export function saveInfographic(infographic: Infographic): void {
    if (typeof window === 'undefined') return;

    const existing = getInfographics();
    const updated = [infographic, ...existing];

    try {
        localStorage.setItem(INFOGRAPHICS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            // Storage full - try to remove old items one by one
            console.warn('Storage quota exceeded. Attempting to clear old files...');
            let trimmed = [...updated];
            // Remove last item (oldest) until it fits or we only have the new one left
            while (trimmed.length > 1) {
                trimmed.pop();
                try {
                    localStorage.setItem(INFOGRAPHICS_STORAGE_KEY, JSON.stringify(trimmed));
                    console.log(`Saved successfully after removing items. Count: ${trimmed.length}`);
                    return; // Success
                } catch (retryError) {
                    continue; // Still full, keep popping
                }
            }

            // If we are down to just the new item and it still fails
            try {
                localStorage.setItem(INFOGRAPHICS_STORAGE_KEY, JSON.stringify(trimmed));
            } catch (finalError) {
                console.error('File too large to save even when empty.', finalError);
                throw new Error('Storage full: This infographic is too large to save history.');
            }
        } else {
            throw e;
        }
    }
}

export function getInfographics(): Infographic[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(INFOGRAPHICS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function deleteInfographic(id: string): void {
    if (typeof window === 'undefined') return;

    const existing = getInfographics();
    const filtered = existing.filter(item => item.id !== id);
    localStorage.setItem(INFOGRAPHICS_STORAGE_KEY, JSON.stringify(filtered));
}

export function searchInfographics(query: string): Infographic[] {
    const all = getInfographics();
    if (!query.trim()) return all;

    const lowerQuery = query.toLowerCase();
    return all.filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.sources.some(source => source.name.toLowerCase().includes(lowerQuery))
    );
}

export function sortInfographics(
    infographics: Infographic[],
    sortBy: 'date' | 'name'
): Infographic[] {
    return [...infographics].sort((a, b) => {
        if (sortBy === 'date') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.title.localeCompare(b.title);
    });
}
