import { useEffect, useMemo, useState } from "react";
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
import { PageHeader } from "@/ui/page-header";
import { EmptyState } from "@/ui/empty-state";
import { Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import {
    ACTIVITY_LOG_PAGE_SIZE,
    mergeActionTypes,
    useAdminActivityLog,
} from "@/features/admin/hooks/useAdminActivityLog";

const ALL_TYPES = 'all';

export default function ActivityLog() {
    const { t } = useTranslation();

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [actionType, setActionType] = useState<string>(ALL_TYPES);
    const [page, setPage] = useState(0);

    // Debounce the search input so we do not refetch on every keystroke.
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data, isLoading, isFetching, error, refetch } = useAdminActivityLog({
        page,
        actionType: actionType === ALL_TYPES ? null : actionType,
        search,
    });

    const entries = useMemo(() => data?.entries ?? [], [data?.entries]);
    const total = data?.total ?? 0;
    const pageCount = data?.pageCount ?? 1;

    const actionTypeOptions = useMemo(() => mergeActionTypes(entries), [entries]);

    const actionTypeLabel = (type: string) =>
        t(`adminActivityLog.actionType_${type}`, {
            defaultValue: type
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
        });

    const actionTypeBadge = (type: string) => {
        switch (type) {
            case 'delete':
            case 'rejection':
            case 'suspension':
                return <Badge variant="destructive" className="text-xs">{actionTypeLabel(type)}</Badge>;
            case 'approval':
            case 'create':
                return <Badge className="text-xs bg-primary/10 text-primary border-transparent hover:bg-primary/10">{actionTypeLabel(type)}</Badge>;
            case 'refund':
                return <Badge variant="secondary" className="text-xs">{actionTypeLabel(type)}</Badge>;
            default:
                return <Badge variant="outline" className="text-xs">{actionTypeLabel(type)}</Badge>;
        }
    };

    const handleTypeChange = (value: string) => {
        setActionType(value);
        setPage(0);
    };

    const rangeStart = total === 0 ? 0 : page * ACTIVITY_LOG_PAGE_SIZE + 1;
    const rangeEnd = Math.min(total, (page + 1) * ACTIVITY_LOG_PAGE_SIZE);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="text-start">
                    <Skeleton className="h-8 w-56 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1 max-w-md" />
                    <Skeleton className="h-10 w-44" />
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('adminActivityLog.title', 'Activity Log')}
                description={t('adminActivityLog.subtitle', 'Audit trail of every admin action on the platform')}
                actions={
                    <Button variant="outline" onClick={() => refetch()} className="flex items-center">
                        <RefreshCw className="w-4 h-4 me-2" />
                        {t('common.refresh')}
                    </Button>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder={t('adminActivityLog.searchPlaceholder', 'Search by admin or description...')}
                        className="ps-9"
                    />
                </div>
                <Select value={actionType} onValueChange={handleTypeChange}>
                    <SelectTrigger
                        className="w-full sm:w-48"
                        aria-label={t('adminActivityLog.filterType', 'Action type')}
                    >
                        <SelectValue placeholder={t('adminActivityLog.filterType', 'Action type')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_TYPES}>{t('common.all')}</SelectItem>
                        {actionTypeOptions.map(type => (
                            <SelectItem key={type} value={type}>{actionTypeLabel(type)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            {error ? (
                <EmptyState
                    icon="alert-triangle"
                    title={t('common.error')}
                    description={t('adminActivityLog.loadError', 'Failed to load activity log')}
                    action={{ label: t('common.retry', 'Retry'), onClick: () => refetch() }}
                />
            ) : entries.length === 0 ? (
                <EmptyState
                    icon="history"
                    title={t('adminActivityLog.noEntries', 'No activity found')}
                    description={t('adminActivityLog.noEntriesDesc', 'No admin actions match the current filters')}
                />
            ) : (
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('adminActivityLog.admin', 'Admin')}</TableHead>
                                    <TableHead>{t('adminActivityLog.type', 'Type')}</TableHead>
                                    <TableHead>{t('adminActivityLog.description', 'Description')}</TableHead>
                                    <TableHead>{t('adminActivityLog.entity', 'Entity')}</TableHead>
                                    <TableHead>{t('adminActivityLog.when', 'When')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries.map(entry => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="font-medium whitespace-nowrap">{entry.user_name}</TableCell>
                                        <TableCell>{actionTypeBadge(entry.action_type)}</TableCell>
                                        <TableCell className="max-w-md">
                                            <span className="line-clamp-2">{entry.action_description}</span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                            {entry.entity_type ?? '—'}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="text-sm">{formatRelativeTime(entry.created_at)}</div>
                                            <div className="text-xs text-muted-foreground">{formatDate(entry.created_at, 'PPp')}</div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Pagination */}
            {!error && total > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        {t('adminActivityLog.showingRange', 'Showing {{from}}–{{to}} of {{total}}', {
                            from: rangeStart,
                            to: rangeEnd,
                            total,
                        })}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 0 || isFetching}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                        >
                            <ChevronLeft className="w-4 h-4 me-1 rtl:rotate-180" aria-hidden="true" />
                            {t('adminActivityLog.previous', 'Previous')}
                        </Button>
                        <span className="text-sm text-muted-foreground tabular-nums">
                            {t('adminActivityLog.pageOf', 'Page {{page}} of {{pages}}', {
                                page: page + 1,
                                pages: pageCount,
                            })}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page + 1 >= pageCount || isFetching}
                            onClick={() => setPage(p => p + 1)}
                        >
                            {t('adminActivityLog.next', 'Next')}
                            <ChevronRight className="w-4 h-4 ms-1 rtl:rotate-180" aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
