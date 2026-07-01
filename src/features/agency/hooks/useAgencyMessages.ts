import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface Conversation {
    id: string;            // the other user's ID
    travelerName: string;
    lastMessage: string;
    lastMessageTime: string;
    unread: boolean;
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
    const { user } = useAuth();

    // Fetch all conversations (grouped by the other user)
    const fetchConversations = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Group messages by the other party
            const convMap = new Map<string, Conversation>();

            for (const msg of (data || [])) {
                const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;

                if (!convMap.has(otherId)) {
                    convMap.set(otherId, {
                        id: otherId,
                        travelerName: otherId.slice(0, 8), // Will be resolved later if profiles are available
                        lastMessage: msg.content,
                        lastMessageTime: msg.created_at,
                        unread: msg.sender_id !== user.id && !msg.read_at,
                    });
                }
            }

            setConversations(Array.from(convMap.values()));
        } catch (err: any) {
            console.error('Error fetching conversations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch messages for a specific conversation
    const fetchMessages = async (otherUserId: string) => {
        if (!user) return;

        try {
            setSelectedConversation(otherUserId);

            const { data, error: fetchError } = await supabase
                .from('messages')
                .select('*')
                .or(
                    `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
                )
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;
            setMessages(data || []);

            // Mark unread messages as read
            await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('sender_id', otherUserId)
                .eq('recipient_id', user.id)
                .is('read_at', null);

        } catch (err: any) {
            console.error('Error fetching messages:', err);
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
            return data;
        } catch (err: any) {
            console.error('Error sending message:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchConversations();
    }, [user]);

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
                    // Refresh conversation list
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, selectedConversation]);

    return {
        conversations,
        messages,
        selectedConversation,
        loading,
        error,
        fetchMessages,
        sendMessage,
        refetch: fetchConversations,
    };
}
