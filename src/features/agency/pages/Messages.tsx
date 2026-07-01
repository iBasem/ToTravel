import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { MessageSquare, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAgencyMessages } from "@/features/agency/hooks/useAgencyMessages";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { useState, useRef, useEffect } from "react";

export default function Messages() {
  const { t } = useTranslation();
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return t('common.justNow', { defaultValue: 'Just now' });
    if (diffHours < 24) return `${diffHours}h ${t('common.ago', { defaultValue: 'ago' })}`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${t('common.ago', { defaultValue: 'ago' })}`;
  };

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
        <p className="text-red-600">{t('common.error')}: {error}</p>
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
          description={t('agencyDashboard.messagesWillAppear', { defaultValue: 'Messages from travelers will appear here when they contact you.' })}
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
                  <div
                    key={conversation.id}
                    onClick={() => fetchMessages(conversation.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedConversation === conversation.id
                      ? 'bg-blue-50 border-blue-500 border-s-4'
                      : conversation.unread
                        ? 'bg-yellow-50 border-s-4 border-yellow-500'
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium">{conversation.travelerName}</p>
                      <span className="text-xs text-gray-500">{formatTime(conversation.lastMessageTime)}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
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
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-600 text-white'
                          }`}
                      >
                        <p>{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString()}
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
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
