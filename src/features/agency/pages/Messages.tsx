import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useAgencyMessages } from "@/features/agency/hooks/useAgencyMessages";
import { ConversationListItem } from "@/features/agency/components/messages/ConversationListItem";
import { MessageThread } from "@/features/agency/components/messages/MessageThread";
import { NewMessageDialog } from "@/features/agency/components/messages/NewMessageDialog";

export default function Messages() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const isTraveler = profile?.role === "traveler";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    conversations, messages, selectedConversation, loading, error, threadError, fetchMessages, sendMessage,
  } = useAgencyMessages();

  const [search, setSearch] = useState("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  // Identity for a freshly-composed thread that has no history yet, so the
  // header shows the recipient before the first message creates a Conversation.
  const [pendingRecipient, setPendingRecipient] = useState<{ id: string; name: string } | null>(null);

  // Deep link: ?to=<userId> opens/starts that conversation.
  const deepLinkTo = searchParams.get("to");
  useEffect(() => {
    if (!loading && deepLinkTo && selectedConversation !== deepLinkTo) {
      fetchMessages(deepLinkTo);
      setMobileThreadOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, deepLinkTo]);

  const openConversation = (id: string) => {
    fetchMessages(id);
    setMobileThreadOpen(true);
  };

  // On desktop, open the most recent thread by default (matches an inbox landing).
  // Skipped on mobile so opening the page doesn't silently mark the newest thread read.
  useEffect(() => {
    if (loading || deepLinkTo || selectedConversation || conversations.length === 0) return;
    if (window.matchMedia("(min-width: 1024px)").matches) {
      fetchMessages(conversations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, conversations, selectedConversation, deepLinkTo]);

  const handleNewSelect = (traveler: { id: string; name: string }) => {
    setNewOpen(false);
    setPendingRecipient(traveler);
    openConversation(traveler.id);
  };

  // A thread opened without history (e.g. the ?to= deep link from a booking) has
  // no Conversation yet — resolve the recipient's name so the header isn't blank.
  useEffect(() => {
    if (!selectedConversation) return;
    if (conversations.some((c) => c.id === selectedConversation)) return;
    if (pendingRecipient?.id === selectedConversation) return;
    let cancelled = false;
    (async () => {
      const { data: tr } = await supabase
        .from("travelers")
        .select("id, first_name, last_name")
        .eq("id", selectedConversation)
        .maybeSingle();
      if (cancelled) return;
      if (tr) {
        const name = `${tr.first_name ?? ""} ${tr.last_name ?? ""}`.trim();
        setPendingRecipient({ id: tr.id, name: name || t("common.traveler", "Traveler") });
        return;
      }
      const { data: ag } = await supabase
        .from("travel_agencies")
        .select("id, company_name")
        .eq("id", selectedConversation)
        .maybeSingle();
      if (cancelled || !ag) return;
      setPendingRecipient({ id: ag.id, name: ag.company_name || t("common.traveler", "Traveler") });
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedConversation, conversations, pendingRecipient, t]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? conversations.filter(
          (c) => c.travelerName.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q),
        )
      : conversations;
  }, [conversations, search]);

  const activeConversation =
    conversations.find((c) => c.id === selectedConversation) ??
    (pendingRecipient && pendingRecipient.id === selectedConversation
      ? {
          id: pendingRecipient.id,
          travelerName: pendingRecipient.name,
          avatarUrl: null,
          lastMessage: "",
          lastMessageTime: "",
          unread: false,
          unreadCount: 0,
        }
      : undefined);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState icon="message-square" title={t("common.error")} description={error} />
    );
  }

  // No conversations and nothing open — first-run empty state.
  if (conversations.length === 0 && !selectedConversation) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon="message-square"
          title={t("agencyDashboard.noMessagesYet", "No Messages Yet")}
          description={
            isTraveler
              ? t("travelerDashboard.messagesWillAppear", "Ask an agency about a package or booking and the conversation will appear here.")
              : t("agencyDashboard.messagesWillAppear", "Messages from travelers will appear here when they contact you.")
          }
          action={
            isTraveler
              ? undefined
              : { label: t("agencyDashboard.newMessage", "New Message"), onClick: () => setNewOpen(true) }
          }
        />
        {!isTraveler && <NewMessageDialog open={newOpen} onOpenChange={setNewOpen} onSelect={handleNewSelect} />}
      </div>
    );
  }

  const counterpartyLabel = isTraveler
    ? t("agencyDashboard.travelAgency", "Travel Agency")
    : t("common.traveler", "Traveler");

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex h-[calc(100vh-9rem)]">
      {/* Conversation list */}
      <aside className={`w-full lg:w-80 lg:shrink-0 lg:flex flex-col min-h-0 bg-muted/20 lg:border-e border-border ${mobileThreadOpen ? "hidden lg:flex" : "flex"}`}>
        <div className="p-3 shrink-0">
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("agencyDashboard.searchNameChat", "Search name, chat, etc")}
              className="ps-9 h-10"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-3 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("agencyDashboard.noConversationsFound", "No conversations found")}
            </p>
          ) : (
            filtered.map((c) => (
              <ConversationListItem
                key={c.id}
                conversation={c}
                selected={c.id === selectedConversation}
                onSelect={openConversation}
              />
            ))
          )}
        </div>

        {!isTraveler && (
          <div className="p-3 mt-auto border-t border-border shrink-0">
            <Button onClick={() => setNewOpen(true)} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              {t("agencyDashboard.newMessage", "New Message")}
            </Button>
          </div>
        )}
      </aside>

      {/* Thread */}
      <section className={`flex-1 min-w-0 lg:flex flex-col min-h-0 ${mobileThreadOpen ? "flex" : "hidden lg:flex"}`}>
        {selectedConversation && threadError ? (
          <div className="h-full grid place-items-center text-center text-muted-foreground p-6">
            <div>
              <MessageSquare className="h-14 w-14 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm mb-3">{t("agencyDashboard.threadLoadFailed", "Couldn't load this conversation")}</p>
              <Button variant="outline" size="sm" onClick={() => fetchMessages(selectedConversation)}>
                {t("common.retry", "Retry")}
              </Button>
            </div>
          </div>
        ) : selectedConversation ? (
          <div key={selectedConversation} className="flex-1 min-h-0 flex flex-col animate-in fade-in-0 duration-200 motion-reduce:animate-none">
            <MessageThread
              conversation={activeConversation}
              messages={messages}
              currentUserId={user?.id ?? ""}
              counterpartyLabel={counterpartyLabel}
              onSend={(content) => sendMessage(selectedConversation, content)}
              onBack={() => setMobileThreadOpen(false)}
              onViewProfile={isTraveler ? undefined : () => navigate("/travel_agency/travelers")}
            />
          </div>
        ) : (
          <div className="h-full grid place-items-center text-center text-muted-foreground p-6">
            <div>
              <MessageSquare className="h-14 w-14 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm">{t("agencyDashboard.selectConversation")}</p>
            </div>
          </div>
        )}
      </section>

      {!isTraveler && <NewMessageDialog open={newOpen} onOpenChange={setNewOpen} onSelect={handleNewSelect} />}
    </div>
  );
}
