import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'bounty-rush-owned-characters';

export function useCharacters(selectedTags = []) {
    const [characters, setCharacters] = useState([]);
    const [ownedIds, setOwnedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({ attr: '全て', style: '全て', rarity: '全て', keyword: '' });

    // Load characters data
    useEffect(() => {
        fetch('./characters_data.json')
            .then(res => {
                if (!res.ok) throw new Error('データの読み込みに失敗しました');
                return res.json();
            })
            .then(data => {
                setCharacters(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // Load owned status from localStorage or URL
    useEffect(() => {
        if (characters.length === 0) return;

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const sharedOwned = urlParams.get('owned');

            if (sharedOwned) {
                try {
                    const idsStr = atob(sharedOwned);
                    const idsArray = JSON.parse(idsStr);
                    setOwnedIds(new Set(idsArray));
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (e) {
                    console.warn('URLパラメータの解析に失敗:', e);
                }
            } else {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const ids = JSON.parse(saved);
                    setOwnedIds(new Set(ids));
                } else {
                    // Default: All characters owned if no saved data
                    const allIds = new Set(characters.map(c => c.id));
                    setOwnedIds(allIds);
                    // Explicitly save the default state
                    localStorage.setItem(STORAGE_KEY, JSON.stringify([...allIds]));
                }
            }
        } catch (e) {
            console.warn('所持データの読み込みに失敗:', e);
        }
    }, [characters]);

    // Save owned status to localStorage
    const saveOwned = useCallback((newOwnedIds) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...newOwnedIds]));
        } catch (e) {
            console.warn('所持データの保存に失敗:', e);
        }
    }, []);

    // Toggle ownership
    const toggleOwned = useCallback((id) => {
        setOwnedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            saveOwned(next);
            return next;
        });
    }, [saveOwned]);

    // Bulk set all as owned
    const setAllOwned = useCallback(() => {
        const allIds = new Set(characters.map(c => c.id));
        setOwnedIds(allIds);
        saveOwned(allIds);
    }, [characters, saveOwned]);

    // Bulk set all as not owned
    const clearAllOwned = useCallback(() => {
        const empty = new Set();
        setOwnedIds(empty);
        saveOwned(empty);
    }, [saveOwned]);

    // Bulk set all permanent characters as owned
    const setAllPermanentOwned = useCallback(() => {
        const allPermanentIds = characters
            .filter(c => c.obtain_type === '恒常')
            .map(c => c.id);

        setOwnedIds(prev => {
            const next = new Set([...prev, ...allPermanentIds]);
            saveOwned(next);
            return next;
        });
    }, [characters, saveOwned]);

    // Generate Share URL
    const generateShareUrl = useCallback(() => {
        try {
            const idsStr = JSON.stringify([...ownedIds]);
            const encoded = btoa(idsStr);
            const url = new URL(window.location.href);
            url.searchParams.set('owned', encoded);
            return url.toString();
        } catch (e) {
            console.error('URL生成失敗', e);
            return '';
        }
    }, [ownedIds]);

    // Filter characters
    const filteredCharacters = characters.filter(c => {
        // Keyword filter
        if (filter.keyword && !c.name.includes(filter.keyword)) return false;

        // Attribute, Style, and Rarity filters
        if (filter.attr !== '全て' && c.attr !== filter.attr) return false;
        if (filter.style !== '全て' && c.style !== filter.style) return false;
        if (filter.rarity !== '全て') {
            const filterRarityNum = parseInt(filter.rarity.replace('★', ''), 10);
            if (c.rarity !== filterRarityNum) return false;
        }

        // Tag filter (OR search)
        if (selectedTags.length > 0) {
            const hasAnyTag = selectedTags.some(tag => c.tags.includes(tag));
            if (!hasAnyTag) return false;
        }

        return true;
    });

    // Get all unique tags
    const allTags = [...new Set(characters.flatMap(c => c.tags))].sort();

    // Get all unique attrs (exclude 不明)
    const allAttrs = [...new Set(characters.map(c => c.attr))].filter(a => a !== '不明');

    // Get all unique styles (exclude 不明)
    const allStyles = [...new Set(characters.map(c => c.style))].filter(s => s !== '不明');

    return {
        characters,
        filteredCharacters,
        ownedIds,
        loading,
        error,
        filter,
        setFilter,
        toggleOwned,
        setAllOwned,
        clearAllOwned,
        setAllPermanentOwned,
        generateShareUrl,
        allTags,
        allAttrs,
        allStyles,
    };
}
