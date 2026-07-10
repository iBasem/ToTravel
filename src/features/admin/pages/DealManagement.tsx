import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/ui/alert-dialog";
import { Search, BadgePercent, Clock, CheckCircle2, Radio, Check, X } from "lucide-react";
import { useAdminDeals, useSetDealApproval, type AdminDeal } from "@/features/admin/hooks/useAdminDeals";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatters";
import { EmptyState } from "@/ui/empty-state";

type ApprovalFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function DealManagement() {
    const { data, isLoading, isError, refetch } = useAdminDeals();
    const setApproval = useSetDealApproval();
    const [searchTerm, setSearchTerm] = useState("");
    const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('all');
    const [rejectDeal, setRejectDeal] = useState<AdminDeal | null>(null);
    const { t, i18n } = useTranslation();

    const deals = data?.deals ?? [];
    const stats = data?.stats ?? { total: 0, pending: 0, approved: 0, rejected: 0, liveNow: 0 };

    const packageTitle = (deal: AdminDeal) =>
        (i18n.language === 'ar' && deal.packages?.title_ar) || deal.packages?.title || '—';

    const filteredDeals = deals.filter(deal => {
        const q = searchTerm.toLowerCase();
        const matchesSearch = !q ||
            deal.title.toLowerCase().includes(q) ||
            (deal.travel_agencies?.company_name ?? '').toLowerCase().includes(q) ||
            packageTitle(deal).toLowerCase().includes(q);
        const matchesApproval = approvalFilter === 'all' || deal.approval_status === approvalFilter;
        return matchesSearch && matchesApproval;
    });

    const handleApprove = (deal: AdminDeal) => {
        setApproval.mutate(
            { dealId: deal.id, dealTitle: deal.title, approval: 'approved' },
            {
                onSuccess: () => toast.success(t('adminDeals.approveSuccess', 'Deal approved')),
                onError: () => toast.error(t('adminDeals.updateError', 'Failed to update deal')),
            },
        );
    };

    const handleReject = () => {
        if (!rejectDeal) return;
        setApproval.mutate(
            { dealId: rejectDeal.id, dealTitle: rejectDeal.title, approval: 'rejected' },
            {
                onSuccess: () => toast.success(t('adminDeals.rejectSuccess', 'Deal rejected')),
                onError: () => toast.error(t('adminDeals.updateError', 'Failed to update deal')),
            },
        );
        setRejectDeal(null);
    };

    const approvalBadge = (approval: string) => {
        switch (approval) {
            case 'approved':
                return <Badge className="bg-primary/10 text-primary border-transparent hover:bg-primary/10">{t('common.approved')}</Badge>;
            case 'rejected':
                return <Badge variant="destructive">{t('common.rejected')}</Badge>;
            default:
                return <Badge variant="secondary">{t('common.pending')}</Badge>;
        }
    };

    const statusLabel = (status: string) =>
        t(`adminDeals.status_${status}`, status);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    const statCards = [
        { title: t('adminDeals.total', 'Total Deals'), value: stats.total, icon: BadgePercent },
        { title: t('adminDeals.pending', 'Pending Review'), value: stats.pending, icon: Clock },
        { title: t('adminDeals.approved', 'Approved'), value: stats.approved, icon: CheckCircle2 },
        { title: t('adminDeals.liveNow', 'Live Now'), value: stats.liveNow, icon: Radio },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t('adminDeals.title', 'Deal Management')}</h1>
                    <p className="text-muted-foreground">{t('adminDeals.description', 'Review and approve agency promotional deals')}</p>
                </div>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                    {t('common.refresh', 'Refresh')}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ title, value, icon: Icon }) => (
                    <Card key={title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{title}</CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('adminDeals.searchPlaceholder', 'Search deals, agencies, packages...')}
                        className="ps-9"
                    />
                </div>
                <div className="flex gap-2" role="group" aria-label={t('adminDeals.approval', 'Approval')}>
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(filter => (
                        <Button
                            key={filter}
                            variant={approvalFilter === filter ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setApprovalFilter(filter)}
                        >
                            {filter === 'all' ? t('common.all') : t(`common.${filter}`)}
                            {filter === 'pending' && stats.pending > 0 && (
                                <span className="ms-1.5 rounded-full bg-deal text-deal-foreground text-xs px-1.5">{stats.pending}</span>
                            )}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {isError ? (
                <EmptyState
                    icon="package"
                    title={t('common.error')}
                    description={t('adminDeals.loadError', 'Something went wrong while loading deals. Please try again.')}
                    action={{ label: t('common.retry', 'Retry'), onClick: () => refetch() }}
                />
            ) : filteredDeals.length === 0 ? (
                <EmptyState icon="package" title={t('adminDeals.noDeals', 'No deals found')} description={t('tours.checkBack')} />
            ) : (
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('adminDeals.deal', 'Deal')}</TableHead>
                                    <TableHead>{t('adminDeals.agency', 'Agency')}</TableHead>
                                    <TableHead>{t('adminDeals.package', 'Package')}</TableHead>
                                    <TableHead>{t('adminDeals.discount', 'Discount')}</TableHead>
                                    <TableHead>{t('adminDeals.period', 'Period')}</TableHead>
                                    <TableHead>{t('common.status', 'Status')}</TableHead>
                                    <TableHead>{t('adminDeals.approval', 'Approval')}</TableHead>
                                    <TableHead className="text-end">{t('common.actions', 'Actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDeals.map(deal => (
                                    <TableRow key={deal.id}>
                                        <TableCell className="font-medium max-w-56 truncate">{deal.title}</TableCell>
                                        <TableCell className="text-muted-foreground">{deal.travel_agencies?.company_name ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-48 truncate">{packageTitle(deal)}</TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-deal">
                                                {t('packageCard.percentOff', { percent: Math.round(deal.discount_percentage) })}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                                            {formatDate(deal.start_date)} – {formatDate(deal.end_date)}
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{statusLabel(deal.status)}</Badge></TableCell>
                                        <TableCell>{approvalBadge(deal.approval_status)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                {deal.approval_status !== 'approved' && (
                                                    <Button size="sm" variant="outline" onClick={() => handleApprove(deal)}>
                                                        <Check className="w-4 h-4 me-1" aria-hidden="true" />
                                                        {t('adminDeals.approve', 'Approve')}
                                                    </Button>
                                                )}
                                                {deal.approval_status !== 'rejected' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => setRejectDeal(deal)}
                                                    >
                                                        <X className="w-4 h-4 me-1" aria-hidden="true" />
                                                        {t('adminDeals.reject', 'Reject')}
                                                    </Button>
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

            {/* Reject confirmation */}
            <AlertDialog open={!!rejectDeal} onOpenChange={(open) => !open && setRejectDeal(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('adminDeals.confirmRejectTitle', 'Reject this deal?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('adminDeals.confirmRejectDesc', 'The deal will not be shown to travelers. The agency can edit and resubmit it.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReject}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('adminDeals.reject', 'Reject')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
