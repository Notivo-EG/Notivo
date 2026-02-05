'use client';

import { useState, useEffect, useCallback } from 'react';
import { Infographic } from '@/lib/types';
import {
    getInfographics,
    saveInfographic,
    deleteInfographic as deleteFromStorage,
    searchInfographics,
    sortInfographics,
} from '@/lib/storage';

type SortBy = 'date' | 'name';

export function useInfographics() {
    const [infographics, setInfographics] = useState<Infographic[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [isLoading, setIsLoading] = useState(true);

    // Load infographics on mount
    useEffect(() => {
        const stored = getInfographics();
        setInfographics(stored);
        setIsLoading(false);
    }, []);

    // Filtered and sorted list
    const filteredInfographics = sortInfographics(
        searchQuery ? searchInfographics(searchQuery) : infographics,
        sortBy
    );

    const addInfographic = useCallback((infographic: Infographic) => {
        saveInfographic(infographic);
        setInfographics(prev => [infographic, ...prev]);
    }, []);

    const removeInfographic = useCallback((id: string) => {
        deleteFromStorage(id);
        setInfographics(prev => prev.filter(item => item.id !== id));
    }, []);

    const refreshInfographics = useCallback(() => {
        setInfographics(getInfographics());
    }, []);

    return {
        infographics: filteredInfographics,
        allInfographics: infographics,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        addInfographic,
        removeInfographic,
        refreshInfographics,
        isLoading,
    };
}
