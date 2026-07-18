import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { useRecentConversations } from "@/features/agency/hooks/useRecentConversations";
import { formatRelativeTime } from "@/lib/formatters";
import { initials } from "@/lib/utils";

export function MessagesCard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { conversations, loading } = useRecentConversations(4);

    const shown = conversations;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t("agencyDashboard.messages", "Messages")}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/travel_agency/messages")}>
                        {t("common.viewAll")}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">{t("common.loading", "Loading…")}</p>
                ) : shown.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                        {t("agencyDashboard.noMessagesYet", "No Messages Yet")}
                    </p>
                ) : (
                    <ul className="space-y-1">
                        {shown.map((c) => (
                            <li key={c.id}>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/travel_agency/messages?to=${c.id}`)}
                                    className="w-full flex items-center gap-3 rounded-lg p-2 -mx-2 text-start hover:bg-muted transition-colors"
                                >
                                    <Avatar className="w-9 h-9 shrink-0">
                                        <AvatarFallback className="text-xs">{initials(c.travelerName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm truncate ${c.unread ? "font-semibold" : "font-medium"}`}>
                                                {c.travelerName}
                                            </p>
                                            {c.unread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />}
                                        </div>
                                        <p className={`text-xs truncate ${c.unread ? "text-foreground" : "text-muted-foreground"}`}>
                                            {c.lastMessage}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                                        {formatRelativeTime(c.lastMessageTime)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
