import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface Guide {
    id: string;
    name: string;
    specialty: string[];
    languages: string[];
    rating: number;
    image_url: string | null;
    created_at: string;
}

export function useAgencyGuides() {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchGuides = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('guides')
                .select('*')
                .eq('agency_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setGuides(data || []);
        } catch (err: any) {
            console.error('Error fetching guides:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addGuide = async (guide: Omit<Guide, 'id' | 'created_at'>) => {
        if (!user) return;

        try {
            const { data, error: insertError } = await supabase
                .from('guides')
                .insert({ ...guide, agency_id: user.id })
                .select()
                .single();

            if (insertError) throw insertError;
            setGuides(prev => [data, ...prev]);
            return data;
        } catch (err: any) {
            console.error('Error adding guide:', err);
            throw err;
        }
    };

    const deleteGuide = async (guideId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('guides')
                .delete()
                .eq('id', guideId);

            if (deleteError) throw deleteError;
            setGuides(prev => prev.filter(g => g.id !== guideId));
        } catch (err: any) {
            console.error('Error deleting guide:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchGuides();
    }, [user]);

    return { guides, loading, error, addGuide, deleteGuide, refetch: fetchGuides };
}
