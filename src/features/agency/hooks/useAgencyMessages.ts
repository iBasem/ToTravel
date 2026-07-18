import { useState, useEffect, useRef } from 'react';
import { shortId } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface Conversation {
    id: string;            // the other user's ID
    travelerName: string;
    avatarUrl: string | null;
    lastMessage: string;
    lastMessageTime: string;
    unread: boolean;
    unreadCount: number;
}

export interface Message {
    id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    created_at: string;
    read_at: string | null;
}

export function useAgencyMessages() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [threadLoading, setThreadLoading] = useState(false);
    const [threadError, setThreadError] = useState<string | null>(null);
    // Monotonic token so a slow response for a previously-selected thread can
    // never overwrite the currently-selected one (rapid thread switching).
    const threadFetchSeq = useRef(0);
    const { user } = useAuth();

    // Fetch all conversations (grouped by the other user). Background refreshes
    // (realtime, post-send) pass silent=true so they don't flash the full-page
    // loading state.
    const fetchConversations = async (silent = false) => {
        if (!user) return;

        try {
            if (!silent) setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Group messages by the other party
            const convMap = new Map<string, Conversation>();

            // Messages arrive newest-first, so the first row seen per party is the
            // latest. Unread is tallied across every message from that party.
            for (const msg of (data || [])) {
                const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
                const isUnreadIncoming = msg.recipient_id === user.id && !msg.read_at;

                const existing = convMap.get(otherId);
                if (!existing) {
                    convMap.set(otherId, {
                        id: otherId,
                        travelerName: shortId(otherId), // fallback until the profile lookup below resolves
                        avatarUrl: null,
                        lastMessage: msg.content,
                        lastMessageTime: msg.created_at,
                        unread: isUnreadIncoming,
                        unreadCount: isUnreadIncoming ? 1 : 0,
                    });
                } else if (isUnreadIncoming) {
                    existing.unreadCount += 1;
                    existing.unread = true;
                }
            }

            // Resolve display names + avatars from traveler/agency profiles (RLS permitting).
            const otherIds = Array.from(convMap.keys());
            if (otherIds.length > 0) {
                const [{ data: travelerRows }, { data: agencyRows }] = await Promise.all([
                    supabase.from('travelers').select('id, first_name, last_name, avatar_url').in('id', otherIds),
                    supabase.from('travel_agencies').select('id, company_name').in('id', otherIds),
                ]);
                travelerRows?.forEach(tr => {
                    const conv = convMap.get(tr.id);
                    if (!conv) return;
                    const name = `${tr.first_name ?? ''} ${tr.last_name ?? ''}`.trim();
                    if (name) conv.travelerName = name;
                    if (tr.avatar_url) conv.avatarUrl = tr.avatar_url;
                });
                agencyRows?.forEach(ag => {
                    const conv = convMap.get(ag.id);
                    if (conv && ag.company_name) conv.travelerName = ag.company_name;
                });
            }

            setConversations(Array.from(convMap.values()));
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Fetch messages for a specific conversation
    const fetchMessages = async (otherUserId: string) => {
        if (!user) return;

        const seq = ++threadFetchSeq.current;
        // Clear immediately so the previous thread's history never renders
        // under the newly-selected conversation's header.
        setSelectedConversation(otherUserId);
        setMessages([]);
        setThreadLoading(true);
        setThreadError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('messages')
                .select('*')
                .or(
                    `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
                )
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;
            if (seq !== threadFetchSeq.current) return; // a newer selection won
            setMessages(data || []);

            // Mark unread messages as read
            await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('sender_id', otherUserId)
                .eq('recipient_id', user.id)
                .is('read_at', null);

        } catch (err) {
            console.error('Error fetching messages:', err);
            if (seq === threadFetchSeq.current) {
                setThreadError(err instanceof Error ? err.message : String(err));
            }
        } finally {
            if (seq === threadFetchSeq.current) setThreadLoading(false);
        }
    };

    // Send a message
    const sendMessage = async (recipientId: string, content: string) => {
        if (!user) return;

        try {
            const { data, error: sendError } = await supabase
                .from('messages')
                .insert({
                    sender_id: user.id,
                    recipient_id: recipientId,
                    content,
                })
                .select()
                .single();

            if (sendError) throw sendError;
            setMessages(prev => [...prev, data]);
            // Surface a newly-started thread in the list without a spinner flash.
            fetchConversations(true);
            return data;
        } catch (err) {
            console.error('Error sending message:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchConversations();
        // Key on the id, not the object (auth events re-create the user object).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // Subscribe to realtime messages
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('messages-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    // If viewing this conversation, add the message
                    if (selectedConversation === newMsg.sender_id) {
                        setMessages(prev => [...prev, newMsg]);
                    }
                    // Refresh conversation list (silent — no spinner flash)
                    fetchConversations(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, selectedConversation]);

    return {
        conversations,
        messages,
        selectedConversation,
        loading,
        error,
        threadLoading,
        threadError,
        fetchMessages,
        sendMessage,
        refetch: fetchConversations,
    };
}
