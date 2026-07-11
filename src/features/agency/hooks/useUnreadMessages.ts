import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const userId = user?.id;

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null);
    if (!error) {
      setUnreadCount(count || 0);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount();

    const channel = supabase
      .channel(`unread-messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUnreadCount]);

  return { unreadCount, refetch: fetchUnreadCount };
}
