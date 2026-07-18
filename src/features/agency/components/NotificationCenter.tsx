import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck, MessageSquare, Tag, Package } from "lucide-react";
import { Button } from "@/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatters";
import { useNotifications } from "@/features/agency/hooks/useNotifications";
import { useUnreadMessages } from "@/features/agency/hooks/useUnreadMessages";

/**
 * The header bell: decision notifications (deal/package outcomes, written by
 * DB triggers) plus an unread-messages summary row. Badge = both combined.
 */
export function NotificationCenter() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { notifications, unreadCount, markAllRead } = useNotifications();
    const { unreadCount: unreadMessages } = useUnreadMessages();

    const badge = unreadCount + unreadMessages;

    const targetFor = (entityType: string | null) =>
        entityType === 'deal' ? '/travel_agency/deals' : '/travel_agency/packages';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="relative p-1 sm:p-2"
                    aria-label={t('agencyDashboard.notifications', 'Notifications')}
                >
                    <Bell className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                    {badge > 0 && (
                        <span className="absolute min-w-[10px] h-2.5 sm:min-w-[12px] sm:h-3 lg:min-w-[16px] lg:h-4 px-0.5 bg-destructive text-destructive-foreground text-[8px] sm:text-[10px] lg:text-xs rounded-full flex items-center justify-center -top-0.5 end-0 sm:-top-1 sm:end-0 tabular-nums">
                            {badge > 9 ? '9+' : badge}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel className="p-0">{t('notifications.title', 'Notifications')}</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => void markAllRead()}>
                            <CheckCheck className="h-3.5 w-3.5" />
                            {t('notifications.markAllRead', 'Mark all read')}
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                {unreadMessages > 0 && (
                    <>
                        <DropdownMenuItem onClick={() => navigate('/travel_agency/messages')} className="gap-2">
                            <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-sm">
                                {t('notifications.unreadMessages', '{{count}} unread messages', { count: unreadMessages })}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                {notifications.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                        {t('notifications.empty', "You're all caught up")}
                    </p>
                ) : (
                    notifications.map((n) => (
                        <DropdownMenuItem
                            key={n.id}
                            onClick={() => navigate(targetFor(n.entity_type))}
                            className="items-start gap-2 py-2"
                        >
                            {n.entity_type === 'deal'
                                ? <Tag className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                : <Package className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />}
                            <span className="min-w-0 flex-1 text-start">
                                <span className={cn("block text-sm leading-snug", !n.read_at && "font-medium")}>
                                    {t(n.title_key, n.body_params)}
                                </span>
                                {n.type === 'deal_rejected' && n.body_params?.reason && (
                                    <span className="block text-xs text-muted-foreground mt-0.5">{n.body_params.reason}</span>
                                )}
                                <span className="block text-[11px] text-muted-foreground mt-0.5">
                                    {formatRelativeTime(n.created_at)}
                                </span>
                            </span>
                            {!n.read_at && <span className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
