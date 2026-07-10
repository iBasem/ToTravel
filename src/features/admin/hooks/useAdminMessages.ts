import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type MessageRow = Database['public']['Tables']['messages']['Row'];
type ProfileRow = Database['public']['Views']['profiles']['Row'];

export interface MessageParticipant {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
}

export interface AdminMessage extends MessageRow {
  sender: MessageParticipant | null;
  recipient: MessageParticipant | null;
}

export interface AdminMessagesStats {
  total: number;
  unread: number;
  conversations: number;
}

export const ADMIN_MESSAGES_QUERY_KEY = ['admin', 'messages'] as const;

function toParticipant(profile: ProfileRow): MessageParticipant | null {
  if (!profile.id) return null;
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.company_name ||
    profile.email ||
    '';
  return {
    id: profile.id,
    name,
    role: profile.role,
    email: profile.email,
  };
}

/**
 * Admin oversight feed of all direct messages. Relies on the
 * "Admins can view all messages" RLS policy on public.messages.
 * Participant names are resolved via the public.profiles view in a
 * second query (messages has no FK relationships exposed to PostgREST).
 */
export function useAdminMessages() {
  return useQuery({
    queryKey: ADMIN_MESSAGES_QUERY_KEY,
    queryFn: async (): Promise<AdminMessage[]> => {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = messages ?? [];
      if (rows.length === 0) return [];

      const participantIds = Array.from(
        new Set(rows.flatMap((m) => [m.sender_id, m.recipient_id])),
      );

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, company_name, role')
        .in('id', participantIds);

      if (profilesError) throw profilesError;

      const profileById = new Map<string, MessageParticipant>();
      for (const profile of profiles ?? []) {
        const participant = toParticipant(profile as ProfileRow);
        if (participant) profileById.set(participant.id, participant);
      }

      return rows.map((message) => ({
        ...message,
        sender: profileById.get(message.sender_id) ?? null,
        recipient: profileById.get(message.recipient_id) ?? null,
      }));
    },
  });
}

/** Derives header stats from the loaded message list. */
export function computeMessageStats(messages: AdminMessage[]): AdminMessagesStats {
  const conversationKeys = new Set<string>();
  let unread = 0;
  for (const message of messages) {
    if (!message.read_at) unread += 1;
    conversationKeys.add([message.sender_id, message.recipient_id].sort().join(':'));
  }
  return { total: messages.length, unread, conversations: conversationKeys.size };
}

/**
 * Moderation delete. Relies on the "Admins can delete messages" RLS policy.
 * `.select('id')` makes a silent RLS no-op surface as an error instead of a
 * fake success. Invalidates the oversight feed on success; toast + audit log
 * are the caller's responsibility (the caller knows the participant names).
 */
export function useDeleteAdminMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { data, error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Message not found or not permitted');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MESSAGES_QUERY_KEY });
    },
  });
}
