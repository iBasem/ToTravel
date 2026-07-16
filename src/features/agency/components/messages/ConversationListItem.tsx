import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { cn, initials } from "@/lib/utils";
import { conversationTime } from "./messageTime";
import type { Conversation } from "@/features/agency/hooks/useAgencyMessages";

interface ConversationListItemProps {
    conversation: Conversation;
    selected: boolean;
    onSelect: (id: string) => void;
}

export function ConversationListItem({ conversation: c, selected, onSelect }: ConversationListItemProps) {
    const { t } = useTranslation();

    return (
        <button
            type="button"
            onClick={() => onSelect(c.id)}
            aria-current={selected}
            className={cn(
                "w-full text-start rounded-xl p-2.5 flex gap-3 items-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/30"
                    : "border-transparent hover:bg-card hover:border-border hover:shadow-sm",
            )}
        >
            <Avatar className="h-11 w-11 shrink-0">
                <AvatarImage src={c.avatarUrl ?? undefined} alt={c.travelerName} />
                <AvatarFallback className="text-sm">{initials(c.travelerName)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <p className={cn("truncate", c.unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                        {c.travelerName}
                    </p>
                    <span className={cn("shrink-0 text-xs whitespace-nowrap", c.unread ? "text-primary font-medium" : "text-muted-foreground")}>
                        {conversationTime(c.lastMessageTime, t)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p dir="auto" className={cn("text-sm truncate text-start", c.unread ? "text-foreground" : "text-muted-foreground")}>
                        {c.lastMessage}
                    </p>
                    {c.unreadCount > 0 && (
                        <span className="shrink-0 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold tabular-nums">
                            {c.unreadCount > 9 ? "9+" : c.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}
