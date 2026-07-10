import { useMemo, useState } from "react";
import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/ui/select";
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
import { Search, Play, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatters";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useAdminAudit } from "@/features/admin/lib/audit";
import {
    computePendingActionsStats,
    useAdminPendingActions,
    useAdminUsers,
    useUpdatePendingAction,
    type PendingAction,
} from "@/features/admin/hooks/useAdminPendingActions";

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'resolved' | 'dismissed';
type PriorityFilter = 'all' | 'urgent' | 'high' | 'medium' | 'low';

const STATUS_FILTERS: StatusFilter[] = ['all', 'pending', 'in_progress', 'resolved', 'dismissed'];
const PRIORITY_FILTERS: PriorityFilter[] = ['all', 'urgent', 'high', 'medium', 'low'];

export default function PendingActionsQueue() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const audit = useAdminAudit();
    const { data: actions, isLoading, error, refetch } = useAdminPendingActions();
    const { data: adminUsers } = useAdminUsers();
    const updateAction = useUpdatePendingAction();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
    const [dismissTarget, setDismissTarget] = useState<PendingAction | null>(null);

    const stats = useMemo(() => computePendingActionsStats(actions ?? []), [actions]);

    const filteredActions = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return (actions ?? []).filter(action => {
            const matchesSearch = !q ||
                action.title.toLowerCase().includes(q) ||
                (action.description ?? '').toLowerCase().includes(q);
            const matchesStatus = statusFilter === 'all' || action.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || action.priority === priorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [actions, searchTerm, statusFilter, priorityFilter]);

    const adminNameById = useMemo(() => {
        const map = new Map<string, string>();
        for (const admin of adminUsers ?? []) map.set(admin.id, admin.name);
        return map;
    }, [adminUsers]);

    const formatActionType = (type: string) =>
        t(`admin.actionTypes.${type}`, {
            defaultValue: type
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
        });

    const priorityLabel = (priority: string) => {
        switch (priority) {
            case 'urgent': return t('admin.priorityUrgent');
            case 'high': return t('admin.priorityHigh');
            case 'medium': return t('admin.priorityMedium');
            case 'low': return t('admin.priorityLow');
            default: return priority;
        }
    };

    const priorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <Badge variant="destructive">{priorityLabel(priority)}</Badge>;
            case 'high':
                return <Badge className="bg-deal text-deal-foreground border-transparent hover:bg-deal">{priorityLabel(priority)}</Badge>;
            case 'medium':
                return <Badge variant="secondary">{priorityLabel(priority)}</Badge>;
            default:
                return <Badge variant="outline">{priorityLabel(priority)}</Badge>;
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case 'pending': return t('common.pending');
            case 'in_progress': return t('adminPendingActions.statusInProgress', 'In Progress');
            case 'resolved': return t('adminPendingActions.statusResolved', 'Resolved');
            case 'dismissed': return t('adminPendingActions.statusDismissed', 'Dismissed');
            default: return status;
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'resolved':
                return <Badge className="bg-primary/10 text-primary border-transparent hover:bg-primary/10">{statusLabel(status)}</Badge>;
            case 'in_progress':
                return <Badge variant="secondary">{statusLabel(status)}</Badge>;
            case 'dismissed':
                return <Badge variant="outline" className="text-muted-foreground">{statusLabel(status)}</Badge>;
            default:
                return <Badge variant="outline">{statusLabel(status)}</Badge>;
        }
    };

    const statusFilterLabel = (filter: StatusFilter) =>
        filter === 'all' ? t('common.all') : statusLabel(filter);

    const isOpen = (action: PendingAction) =>
        action.status === 'pending' || action.status === 'in_progress';

    const handleStart = async (action: PendingAction) => {
        try {
            await updateAction.mutateAsync({ id: action.id, patch: { status: 'in_progress' } });
            toast.success(t('adminPendingActions.startSuccess', 'Action marked as in progress'));
            void audit({
                actionType: 'pending_action_start',
                description: `Started working on pending action "${action.title}"`,
                entityType: 'admin_pending_action',
                entityId: action.id,
                metadata: { action_type: action.action_type, priority: action.priority },
            });
        } catch {
            toast.error(t('adminPendingActions.updateError', 'Failed to update pending action'));
        }
    };

    const handleAssign = async (action: PendingAction, adminId: string) => {
        try {
            await updateAction.mutateAsync({ id: action.id, patch: { assigned_to: adminId } });
            toast.success(t('adminPendingActions.assignSuccess', 'Action assigned'));
            void audit({
                actionType: 'pending_action_assign',
                description: `Assigned pending action "${action.title}" to ${adminNameById.get(adminId) ?? adminId}`,
                entityType: 'admin_pending_action',
                entityId: action.id,
                metadata: { assigned_to: adminId, action_type: action.action_type },
            });
        } catch {
            toast.error(t('adminPendingActions.updateError', 'Failed to update pending action'));
        }
    };

    const handleResolve = async (action: PendingAction) => {
        try {
            await updateAction.mutateAsync({
                id: action.id,
                patch: {
                    status: 'resolved',
                    resolved_by: user?.id ?? null,
                    resolved_at: new Date().toISOString(),
                },
            });
            toast.success(t('adminPendingActions.resolveSuccess', 'Action resolved'));
            void audit({
                actionType: 'pending_action_resolve',
                description: `Resolved pending action "${action.title}"`,
                entityType: 'admin_pending_action',
                entityId: action.id,
                metadata: { action_type: action.action_type, priority: action.priority },
            });
        } catch {
            toast.error(t('adminPendingActions.updateError', 'Failed to update pending action'));
        }
    };

    const handleDismiss = async () => {
        const action = dismissTarget;
        setDismissTarget(null);
        if (!action) return;
        try {
            await updateAction.mutateAsync({
                id: action.id,
                patch: {
                    status: 'dismissed',
                    resolved_by: user?.id ?? null,
                    resolved_at: new Date().toISOString(),
                },
            });
            toast.success(t('adminPendingActions.dismissSuccess', 'Action dismissed'));
            void audit({
                actionType: 'pending_action_dismiss',
                description: `Dismissed pending action "${action.title}"`,
                entityType: 'admin_pending_action',
                entityId: action.id,
                metadata: { action_type: action.action_type, priority: action.priority },
            });
        } catch {
            toast.error(t('adminPendingActions.updateError', 'Failed to update pending action'));
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t('admin.pendingActions')}</h1>
                    <p className="text-muted-foreground">
                        {t('adminPendingActions.subtitle', 'Track, assign and resolve platform issues that need admin attention')}
                    </p>
                </div>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                    {t('common.refresh', 'Refresh')}
                </Button>
            </div>

            {/* Stats */}
            <StatsGrid
                stats={[
                    { title: t('adminPendingActions.statOpen', 'Open'), value: stats.open },
                    { title: t('admin.priorityUrgent'), value: stats.urgent },
                    { title: t('adminPendingActions.statusInProgress', 'In Progress'), value: stats.inProgress },
                    { title: t('adminPendingActions.statResolvedToday', 'Resolved Today'), value: stats.resolvedToday },
                ]}
            />

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('adminPendingActions.searchPlaceholder', 'Search pending actions...')}
                        className="ps-9"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-2" role="group" aria-label={t('common.status', 'Status')}>
                        {STATUS_FILTERS.map(filter => (
                            <Button
                                key={filter}
                                variant={statusFilter === filter ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter(filter)}
                            >
                                {statusFilterLabel(filter)}
                            </Button>
                        ))}
                    </div>
                    <Select
                        value={priorityFilter}
                        onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}
                    >
                        <SelectTrigger
                            className="w-36"
                            aria-label={t('adminPendingActions.filterPriority', 'Priority')}
                        >
                            <SelectValue placeholder={t('adminPendingActions.filterPriority', 'Priority')} />
                        </SelectTrigger>
                        <SelectContent>
                            {PRIORITY_FILTERS.map(priority => (
                                <SelectItem key={priority} value={priority}>
                                    {priority === 'all' ? t('common.all') : priorityLabel(priority)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            {error ? (
                <EmptyState
                    icon="chart-bar"
                    title={t('common.error')}
                    description={t('adminPendingActions.loadError', 'Failed to load pending actions')}
                    action={{ label: t('common.retry', 'Retry'), onClick: () => refetch() }}
                />
            ) : filteredActions.length === 0 ? (
                <EmptyState
                    icon="chart-bar"
                    title={t('adminPendingActions.noActions', 'No pending actions')}
                    description={t('admin.allCaughtUp')}
                />
            ) : (
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('adminPendingActions.action', 'Action')}</TableHead>
                                    <TableHead>{t('adminPendingActions.type', 'Type')}</TableHead>
                                    <TableHead>{t('adminPendingActions.priority', 'Priority')}</TableHead>
                                    <TableHead>{t('common.status', 'Status')}</TableHead>
                                    <TableHead>{t('adminPendingActions.assignee', 'Assignee')}</TableHead>
                                    <TableHead>{t('adminPendingActions.created', 'Created')}</TableHead>
                                    <TableHead className="text-end">{t('common.actions', 'Actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredActions.map(action => (
                                    <TableRow key={action.id}>
                                        <TableCell className="max-w-64">
                                            <div className="font-medium truncate">{action.title}</div>
                                            {action.description && (
                                                <div className="text-xs text-muted-foreground truncate">{action.description}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">{formatActionType(action.action_type)}</Badge>
                                        </TableCell>
                                        <TableCell>{priorityBadge(action.priority)}</TableCell>
                                        <TableCell>{statusBadge(action.status)}</TableCell>
                                        <TableCell>
                                            {isOpen(action) ? (
                                                <Select
                                                    value={action.assigned_to ?? undefined}
                                                    onValueChange={(adminId) => handleAssign(action, adminId)}
                                                    disabled={updateAction.isPending || (adminUsers ?? []).length === 0}
                                                >
                                                    <SelectTrigger
                                                        className="w-40 h-8"
                                                        aria-label={t('adminPendingActions.assign', 'Assign to')}
                                                    >
                                                        <SelectValue placeholder={t('adminPendingActions.unassigned', 'Unassigned')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(adminUsers ?? []).map(admin => (
                                                            <SelectItem key={admin.id} value={admin.id}>
                                                                {admin.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    {action.assigned_to
                                                        ? adminNameById.get(action.assigned_to) ?? t('common.unknown', 'Unknown')
                                                        : t('adminPendingActions.unassigned', 'Unassigned')}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                                            {formatDate(action.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                {action.status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={updateAction.isPending}
                                                        onClick={() => handleStart(action)}
                                                    >
                                                        <Play className="w-4 h-4 me-1" aria-hidden="true" />
                                                        {t('adminPendingActions.start', 'Start')}
                                                    </Button>
                                                )}
                                                {isOpen(action) && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={updateAction.isPending}
                                                            onClick={() => handleResolve(action)}
                                                        >
                                                            <Check className="w-4 h-4 me-1" aria-hidden="true" />
                                                            {t('admin.resolve')}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive"
                                                            disabled={updateAction.isPending}
                                                            onClick={() => setDismissTarget(action)}
                                                        >
                                                            <X className="w-4 h-4 me-1" aria-hidden="true" />
                                                            {t('adminPendingActions.dismiss', 'Dismiss')}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Dismiss confirmation */}
            <AlertDialog open={!!dismissTarget} onOpenChange={(open) => !open && setDismissTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('adminPendingActions.confirmDismissTitle', 'Dismiss this action?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('adminPendingActions.confirmDismissDesc', 'The action will be closed without being resolved. This is recorded in the activity log.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDismiss}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('adminPendingActions.dismiss', 'Dismiss')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
