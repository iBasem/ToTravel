import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { MessageSquare, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAgencyMessages } from "@/features/agency/hooks/useAgencyMessages";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { formatRelativeTime, formatDate } from "@/lib/formatters";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function Messages() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  // The page is shared between the agency and traveler portals; only the
  // empty-state copy differs by who the counterparty is.
  const isTraveler = profile?.role === 'traveler';
  const [searchParams] = useSearchParams();
  const {
    conversations,
    messages,
    selectedConversation,
    loading,
    error,
    fetchMessages,
    sendMessage,
  } = useAgencyMessages();
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Deep link: /messages?to=<userId> opens (or starts) that conversation
  const deepLinkTo = searchParams.get('to');
  useEffect(() => {
    if (!loading && deepLinkTo && selectedConversation !== deepLinkTo) {
      fetchMessages(deepLinkTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, deepLinkTo]);

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    try {
      await sendMessage(selectedConversation, messageInput);
      setMessageInput("");
    } catch {
      // Error is logged in the hook
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => formatRelativeTime(dateStr);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{t('common.error')}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">
        {t('agencyDashboard.messagesCommunication')}
      </h1>

      {conversations.length === 0 && !selectedConversation ? (
        <EmptyState
          icon="message-square"
          title={t('agencyDashboard.noMessagesYet', { defaultValue: 'No Messages Yet' })}
          description={isTraveler
            ? t('travelerDashboard.messagesWillAppear', { defaultValue: 'Ask an agency about a package or booking and the conversation will appear here.' })
            : t('agencyDashboard.messagesWillAppear', { defaultValue: 'Messages from travelers will appear here when they contact you.' })}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{t('agencyDashboard.conversations')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => fetchMessages(conversation.id)}
                    className={`w-full p-3 rounded-lg text-start transition-colors ${selectedConversation === conversation.id
                      ? 'bg-primary/10'
                      : 'hover:bg-muted'
                      }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className={`truncate ${conversation.unread ? 'font-semibold' : 'font-medium'}`}>
                        {conversation.travelerName}
                      </p>
                      <span className="flex items-center gap-1.5 flex-shrink-0 text-xs text-muted-foreground">
                        {formatTime(conversation.lastMessageTime)}
                        {conversation.unread && (
                          <span className="w-2 h-2 rounded-full bg-primary" aria-label={t('agencyDashboard.unread', 'Unread')} />
                        )}
                      </span>
                    </div>
                    <p dir="auto" className={`text-sm truncate text-start ${conversation.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {conversation.lastMessage}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {t('agencyDashboard.chat')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedConversation ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                    <p>{t('agencyDashboard.selectConversation')}</p>
                  </div>
                </div>
              ) : (
                <div className="h-64 overflow-y-auto space-y-3 mb-4 p-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === selectedConversation ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${msg.sender_id === selectedConversation
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                          }`}
                      >
                        <p dir="auto">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatDate(msg.created_at, 'p')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <Input
                  placeholder={t('agencyDashboard.typeMessage')}
                  className="flex-1"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={!selectedConversation}
                />
                <Button
                  onClick={handleSend}
                  disabled={!selectedConversation || !messageInput.trim()}
                  aria-label={t('agencyDashboard.sendMessage', 'Send message')}
                >
                  <Send className="w-4 h-4 rtl-flip" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
