import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const STORAGE_KEY = 'bounty-rush-owned-characters';
const USER_ID_STORAGE_KEY = 'bounty-rush-user-id';

export function useCharacters(selectedTags = []) {
    const [characters, setCharacters] = useState([]);
    const [ownedIds, setOwnedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({ 
        attr: ['全て'], 
        style: ['全て'], 
        rarity: ['全て'], 
        keyword: '' 
    });
    
    // Auth status
    const [user, setUser] = useState(() => {
        const savedId = localStorage.getItem(USER_ID_STORAGE_KEY);
        return savedId ? { id: savedId, isFallback: true } : null;
    });
    const [syncStatus, setSyncStatus] = useState('未実行');

    const isInitialLoad = useRef(true);
    const syncTimeoutRef = useRef(null);

    // Load characters and handle auth session
    useEffect(() => {
        // Load characters
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

        // Auth state
        supabase.auth.getSession().then(({ data: { session } }) => {
            const newUser = session?.user ?? null;
            if (newUser) {
                localStorage.setItem(USER_ID_STORAGE_KEY, newUser.id);
                setUser(newUser);
                fetchFromCloud(newUser.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const newUser = session?.user ?? null;
            if (newUser) {
                localStorage.setItem(USER_ID_STORAGE_KEY, newUser.id);
                setUser(newUser);
                fetchFromCloud(newUser.id);
            } else if (event === 'SIGNED_OUT') {
                localStorage.removeItem(USER_ID_STORAGE_KEY);
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // クラウドからデータを取得してローカルとマージ
    const fetchFromCloud = async (userId) => {
        setSyncStatus('取得中...');
        try {
            const { data, error } = await supabase
                .from('user_characters')
                .select('character_ids')
                .eq('user_id', userId)
                .single();

            if (data && data.character_ids) {
                const cloudIds = new Set(data.character_ids);
                setOwnedIds(prev => {
                    const merged = new Set([...prev, ...cloudIds]);
                    saveOwned(merged);
                    return merged;
                });
                setSyncStatus('同期済み');
                console.log('✅ Cloud Fetch Success:', userId);
            }
        } catch (err) {
            if (err.code !== 'PGRST116') {
                console.error('❌ Cloud fetch error:', err);
                setSyncStatus('取得失敗');
            } else {
                setSyncStatus('データなし');
            }
        }
    };

    // クラウドへ保存 (Debounced)
    const syncToCloud = useCallback((userId, ids) => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        
        setSyncStatus('待機中...');
        syncTimeoutRef.current = setTimeout(async () => {
            setSyncStatus('保存中...');
            try {
                const { error } = await supabase
                    .from('user_characters')
                    .upsert({ 
                        user_id: userId, 
                        character_ids: Array.from(ids),
                        updated_at: new Date().toISOString()
                    });
                
                if (error) throw error;
                
                setSyncStatus('保存成功');
                console.log('✅ Cloud Sync Success:', userId);
            } catch (err) {
                console.error('❌ Cloud sync error:', err);
                setSyncStatus('保存失敗');
            }
        }, 2000); 
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
            if (user) syncToCloud(user.id, next);
            return next;
        });
    }, [saveOwned, user, syncToCloud]);

    // Bulk set all as owned
    const setAllOwned = useCallback(() => {
        const allIds = new Set(characters.map(c => c.id));
        setOwnedIds(allIds);
        saveOwned(allIds);
        if (user) syncToCloud(user.id, allIds);
    }, [characters, saveOwned, user, syncToCloud]);

    // Bulk set all as not owned
    const clearAllOwned = useCallback(() => {
        const empty = new Set();
        setOwnedIds(empty);
        saveOwned(empty);
        if (user) syncToCloud(user.id, empty);
    }, [saveOwned, user, syncToCloud]);


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

        // Attribute filter (Multi-select)
        if (!filter.attr.includes('全て')) {
            if (!filter.attr.includes(c.attr)) return false;
        }

        // Style filter (Multi-select)
        if (!filter.style.includes('全て')) {
            if (!filter.style.includes(c.style)) return false;
        }

        // Rarity filter (Multi-select)
        if (!filter.rarity.includes('全て')) {
            const hasMatch = filter.rarity.some(r => {
                const filterRarityNum = parseInt(r.replace('★', ''), 10);
                return c.rarity === filterRarityNum;
            });
            if (!hasMatch) return false;
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
        generateShareUrl,
        user,
        syncStatus,
        allTags,
        allAttrs,
        allStyles,
    };
}
