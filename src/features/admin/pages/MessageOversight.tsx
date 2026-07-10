import { useMemo, useState } from "react";
import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/ui/alert-dialog";
import { StatsGrid } from "@/ui/stats-card";
import { EmptyState } from "@/ui/empty-state";
import { Search, ArrowRight, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatters";
import { useAdminAudit } from "@/features/admin/lib/audit";
import {
    useAdminMessages,
    useDeleteAdminMessage,
    computeMessageStats,
    type AdminMessage,
    type MessageParticipant,
} from "@/features/admin/hooks/useAdminMessages";

type ReadFilter = 'all' | 'unread' | 'read';

export default function MessageOversight() {
    const { t } = useTranslation();
    const { data: messages = [], isLoading, isError, refetch } = useAdminMessages();
    const deleteMessage = useDeleteAdminMessage();
    const audit = useAdminAudit();

    const [searchTerm, setSearchTerm] = useState("");
    const [readFilter, setReadFilter] = useState<ReadFilter>('all');
    const [deleteTarget, setDeleteTarget] = useState<AdminMessage | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const stats = useMemo(() => computeMessageStats(messages), [messages]);

    const participantName = (participant: MessageParticipant | null) =>
        participant?.name || t('adminMessages.unknownUser', 'Unknown user');

    const filteredMessages = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return messages.filter((message) => {
            const matchesSearch = !q ||
                message.content.toLowerCase().includes(q) ||
                (message.sender?.name ?? '').toLowerCase().includes(q) ||
                (message.recipient?.name ?? '').toLowerCase().includes(q);
            const matchesRead =
                readFilter === 'all' ||
                (readFilter === 'unread' ? !message.read_at : !!message.read_at);
            return matchesSearch && matchesRead;
        });
    }, [messages, searchTerm, readFilter]);

    const toggleExpanded = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const target = deleteTarget;
        setDeleteTarget(null);
        try {
            await deleteMessage.mutateAsync(target.id);
            toast.success(t('adminMessages.deleteSuccess', 'Message deleted'));
            audit({
                actionType: 'message_delete',
                description: `Deleted message from ${participantName(target.sender)} to ${participantName(target.recipient)}`,
                entityType: 'message',
                entityId: target.id,
                metadata: {
                    sender_id: target.sender_id,
                    recipient_id: target.recipient_id,
                },
            });
        } catch {
            toast.error(t('adminMessages.deleteError', 'Failed to delete message'));
        }
    };

    const roleBadge = (participant: MessageParticipant | null) => {
        if (!participant?.role) return null;
        return (
            <Badge variant="outline" className="text-xs">
                {t(`adminMessages.role_${participant.role}`, participant.role)}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    const statCards = [
        { title: t('adminMessages.totalMessages', 'Total Messages'), value: stats.total },
        { title: t('adminMessages.unreadMessages', 'Unread'), value: stats.unread },
        { title: t('adminMessages.conversations', 'Conversations'), value: stats.conversations },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-start">
                    <h1 className="text-2xl font-bold">{t('adminMessages.title', 'Message Oversight')}</h1>
                    <p className="text-muted-foreground">
                        {t('adminMessages.description', 'Monitor conversations between travelers and agencies')}
                    </p>
                </div>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                    {t('common.refresh', 'Refresh')}
                </Button>
            </div>

            {/* Stats */}
            <StatsGrid stats={statCards} className="md:grid-cols-3" />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('adminMessages.searchPlaceholder', 'Search messages or participants...')}
                        className="ps-9"
                    />
                </div>
                <div className="flex gap-2" role="group" aria-label={t('adminMessages.filterLabel', 'Filter by read status')}>
                    {(['all', 'unread', 'read'] as const).map((filter) => (
                        <Button
                            key={filter}
                            variant={readFilter === filter ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setReadFilter(filter)}
                        >
                            {filter === 'all' && t('adminMessages.filterAll', 'All')}
                            {filter === 'unread' && t('adminMessages.filterUnread', 'Unread')}
                            {filter === 'read' && t('adminMessages.filterRead', 'Read')}
                            {filter === 'unread' && stats.unread > 0 && (
                                <span className="ms-1.5 rounded-full bg-primary/10 text-primary text-xs px-1.5">
                                    {stats.unread}
                                </span>
                            )}
                        </Button>
                    ))}
                </div>
            </div>

            {/* List */}
            {isError ? (
                <EmptyState
                    icon="message-square"
                    title={t('adminMessages.errorTitle', 'Could not load messages')}
                    description={t('adminMessages.errorDescription', 'Something went wrong while loading messages. Please try again.')}
                    action={{
                        label: t('common.retry', 'Retry'),
                        onClick: () => refetch(),
                    }}
                />
            ) : filteredMessages.length === 0 ? (
                <EmptyState
                    icon="message-square"
                    title={t('adminMessages.noMessages', 'No messages found')}
                    description={
                        messages.length === 0
                            ? t('adminMessages.noMessagesDescription', 'No messages have been exchanged on the platform yet.')
                            : t('adminMessages.noMatchesDescription', 'No messages match your search or filter.')
                    }
                />
            ) : (
                <div className="space-y-3">
                    {filteredMessages.map((message) => {
                        const isExpanded = expandedIds.has(message.id);
                        const isLong = message.content.length > 180;
                        return (
                            <Card key={message.id}>
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center flex-wrap gap-2 text-start">
                                            <span className="font-medium">{participantName(message.sender)}</span>
                                            {roleBadge(message.sender)}
                                            <ArrowRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" aria-hidden="true" />
                                            <span className="font-medium">{participantName(message.recipient)}</span>
                                            {roleBadge(message.recipient)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {message.read_at ? (
                                                <Badge variant="secondary">{t('adminMessages.read', 'Read')}</Badge>
                                            ) : (
                                                <Badge className="bg-primary/10 text-primary border-transparent hover:bg-primary/10">
                                                    {t('adminMessages.unread', 'Unread')}
                                                </Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDate(message.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <p className={`text-sm text-muted-foreground whitespace-pre-wrap text-start ${isExpanded ? '' : 'line-clamp-2'}`}>
                                        {message.content}
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            {isLong && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs text-muted-foreground h-7 px-2"
                                                    onClick={() => toggleExpanded(message.id)}
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            <ChevronUp className="w-3.5 h-3.5 me-1" aria-hidden="true" />
                                                            {t('adminMessages.showLess', 'Show less')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-3.5 h-3.5 me-1" aria-hidden="true" />
                                                            {t('adminMessages.showMore', 'Show more')}
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setDeleteTarget(message)}
                                            disabled={deleteMessage.isPending}
                                        >
                                            <Trash2 className="w-4 h-4 me-1" aria-hidden="true" />
                                            {t('adminMessages.delete', 'Delete')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('adminMessages.confirmDeleteTitle', 'Delete this message?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('adminMessages.confirmDeleteDesc', 'The message will be permanently removed for both participants. This action cannot be undone.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('adminMessages.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
