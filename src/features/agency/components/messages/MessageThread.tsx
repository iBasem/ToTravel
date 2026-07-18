import { useRef, useEffect, useState, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ChevronLeft, Send, Check, CheckCheck, MoreHorizontal, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { cn, initials } from "@/lib/utils";
import { formatDate } from "@/lib/formatters";
import { daySeparator, dayKey } from "./messageTime";
import type { Conversation, Message } from "@/features/agency/hooks/useAgencyMessages";

interface MessageThreadProps {
    conversation?: Conversation;
    messages: Message[];
    currentUserId: string;
    counterpartyLabel: string;
    onSend: (content: string) => void | Promise<void>;
    onBack: () => void;
    onViewProfile?: () => void;
}

export function MessageThread({
    conversation, messages, currentUserId, counterpartyLabel, onSend, onBack, onViewProfile,
}: MessageThreadProps) {
    const { t } = useTranslation();
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setSending(true);
        setInput("");
        try {
            await onSend(text);
        } catch {
            // Restore the draft so a failed send never loses the message.
            setInput(text);
            toast.error(t("agencyDashboard.messageSendFailed", "Message failed to send. Your text was restored — try again."));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
                <button
                    type="button"
                    onClick={onBack}
                    className="lg:hidden -ms-1 p-1 text-muted-foreground hover:text-foreground"
                    aria-label={t("agencyDashboard.backToList", "Back")}
                >
                    <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
                </button>
                <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={conversation?.avatarUrl ?? undefined} alt={conversation?.travelerName} />
                    <AvatarFallback>{initials(conversation?.travelerName ?? "")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-start">
                    <p className="font-semibold truncate">{conversation?.travelerName}</p>
                    <p className="text-xs text-muted-foreground">{counterpartyLabel}</p>
                </div>
                {onViewProfile && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t("common.moreActions", "More actions")}>
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onViewProfile}>
                                {t("agencyDashboard.viewInTravelers", "View in Travelers")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                    <div className="h-full grid place-items-center text-center text-muted-foreground">
                        <div>
                            <MessageSquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                            <p className="text-sm">{t("agencyDashboard.startConversation", "Send a message to start the conversation.")}</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const outgoing = msg.sender_id === currentUserId;
                        const showSeparator = i === 0 || dayKey(msg.created_at) !== dayKey(messages[i - 1].created_at);
                        // Avatar only on the first message of a consecutive incoming run
                        // (or after a day break); a spacer keeps the rest aligned.
                        const showAvatar = !outgoing && (showSeparator || messages[i - 1]?.sender_id !== msg.sender_id);
                        return (
                            <Fragment key={msg.id}>
                                {showSeparator && (
                                    <div className="flex justify-center py-2">
                                        <span className="rounded-full bg-muted px-3 py-0.5 text-xs text-muted-foreground">
                                            {daySeparator(msg.created_at, t)}
                                        </span>
                                    </div>
                                )}
                                <div className={cn("flex items-end gap-2", outgoing ? "justify-end" : "justify-start", showSeparator ? "mt-1" : "mt-0.5")}>
                                    {!outgoing && (
                                        showAvatar ? (
                                            <Avatar className="h-7 w-7 shrink-0 mb-4">
                                                <AvatarImage src={conversation?.avatarUrl ?? undefined} alt={conversation?.travelerName} />
                                                <AvatarFallback className="text-[10px]">{initials(conversation?.travelerName ?? "")}</AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <span className="w-7 shrink-0" aria-hidden="true" />
                                        )
                                    )}
                                    <div className={cn("max-w-[78%] sm:max-w-[70%]")}>
                                        <div
                                            className={cn(
                                                "px-3.5 py-2 rounded-2xl text-sm break-words",
                                                outgoing
                                                    ? "bg-primary text-primary-foreground rounded-ee-md"
                                                    : "bg-muted text-foreground rounded-es-md",
                                            )}
                                        >
                                            <p dir="auto" className="whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                        <div className={cn("mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground", outgoing ? "justify-end" : "justify-start")}>
                                            <span>{formatDate(msg.created_at, "p")}</span>
                                            {outgoing && (
                                                msg.read_at
                                                    ? <CheckCheck className="h-3.5 w-3.5 text-primary" aria-label={t("agencyDashboard.read", "Read")} />
                                                    : <Check className="h-3.5 w-3.5" aria-label={t("agencyDashboard.sent", "Sent")} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Fragment>
                        );
                    })
                )}
                <div ref={endRef} />
            </div>

            {/* Composer */}
            <div className="p-3 border-t border-border shrink-0">
                <div className="flex items-center gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                send();
                            }
                        }}
                        placeholder={t("agencyDashboard.typeMessage")}
                        className="flex-1 h-10 rounded-full bg-muted border-transparent focus-visible:bg-background focus-visible:border-input"
                        dir="auto"
                    />
                    <Button onClick={send} disabled={!input.trim() || sending} size="icon" className="rounded-full shrink-0" aria-label={t("agencyDashboard.sendMessage", "Send message")}>
                        <Send className="h-4 w-4 rtl-flip" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
