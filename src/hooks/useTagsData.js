import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useTagsData() {
    const [tagsData, setTagsData] = useState([]);
    const [tagsLoading, setTagsLoading] = useState(true);
    const [tagsError, setTagsError] = useState(null);

    useEffect(() => {
        const loadTags = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('tags')
                    .select('*')
                    .order('id', { ascending: true });

                if (fetchError) throw fetchError;
                
                setTagsData(data);
                setTagsLoading(false);
            } catch (err) {
                setTagsError(err.message);
                setTagsLoading(false);
            }
        };

        loadTags();
    }, []);

    return { tagsData, tagsLoading, tagsError };
}
