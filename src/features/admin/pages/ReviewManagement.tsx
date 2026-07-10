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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
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
import { Search, MoreHorizontal, Trash2, Star, TrendingUp, MessageSquare, Calendar, RefreshCw } from "lucide-react";
import { PageHeader } from "@/ui/page-header";
import { StatsCard } from "@/ui/stats-card";
import { useAdminReviews, useDeleteReview, type AdminReview } from "@/features/admin/hooks/useAdminReviews";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatters";
import { EmptyState } from "@/ui/empty-state";

export default function ReviewManagement() {
    const { data, isLoading, isError, refetch } = useAdminReviews();
    const deleteReview = useDeleteReview();
    const [searchTerm, setSearchTerm] = useState("");
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
    const { t, i18n } = useTranslation();
    const isRTL = i18n.dir() === 'rtl';

    const reviews = data?.reviews ?? [];
    const stats = data?.stats ?? {
        total: 0, averageRating: 0, fiveStars: 0, fourStars: 0, threeStars: 0, twoStars: 0, oneStar: 0, thisMonth: 0,
    };

    const filteredReviews = reviews.filter(review => {
        const matchesSearch = !searchTerm ||
            review.traveler_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.package_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.agency_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (review.comment && review.comment.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRating = ratingFilter === null || review.rating === ratingFilter;
        return matchesSearch && matchesRating;
    });

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteReview.mutate(
            {
                reviewId: deleteTarget.id,
                packageTitle: deleteTarget.package_title,
                travelerName: deleteTarget.traveler_name,
                rating: deleteTarget.rating,
            },
            {
                onSuccess: () => toast.success(t('adminDashboard.reviewDeleted', 'Review deleted successfully')),
                onError: () => toast.error(t('adminDashboard.reviewDeleteError', 'Failed to delete review')),
            },
        );
        setDeleteTarget(null);
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/40'}`}
                    />
                ))}
            </div>
        );
    };

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

    if (isError) {
        return (
            <EmptyState
                icon="alert-triangle"
                title={t('adminDashboard.reviewsLoadError', 'Could not load reviews')}
                description={t('adminDashboard.reviewsLoadErrorDesc', 'Something went wrong while loading reviews. Please try again.')}
                action={{ label: t('common.retry', 'Retry'), onClick: () => refetch() }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('adminDashboard.reviewManagement', 'Review Management')}
                description={t('adminDashboard.reviewManagementDesc', 'Monitor and moderate customer reviews')}
                actions={
                    <Button onClick={() => refetch()} variant="outline" className="flex items-center">
                        <RefreshCw className="w-4 h-4 me-2" />
                        {t('common.refresh', 'Refresh')}
                    </Button>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title={t('adminDashboard.totalReviews', 'Total Reviews')}
                    value={stats.total}
                    icon={MessageSquare}
                />
                <StatsCard
                    title={t('adminDashboard.averageRating', 'Average Rating')}
                    value={stats.averageRating}
                    icon={Star}
                    footer={<div className="flex items-center gap-0.5 mt-1">{renderStars(Math.round(stats.averageRating))}</div>}
                />
                <StatsCard
                    title={t('adminDashboard.thisMonth', 'This Month')}
                    value={stats.thisMonth}
                    icon={Calendar}
                />

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('adminDashboard.ratingBreakdown', 'Rating Breakdown')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-8">5★</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${stats.total > 0 ? (stats.fiveStars / stats.total) * 100 : 0}%` }} />
                                </div>
                                <span className="w-6 text-end">{stats.fiveStars}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8">4★</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${stats.total > 0 ? (stats.fourStars / stats.total) * 100 : 0}%` }} />
                                </div>
                                <span className="w-6 text-end">{stats.fourStars}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8">3★</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${stats.total > 0 ? (stats.threeStars / stats.total) * 100 : 0}%` }} />
                                </div>
                                <span className="w-6 text-end">{stats.threeStars}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8">2★</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${stats.total > 0 ? (stats.twoStars / stats.total) * 100 : 0}%` }} />
                                </div>
                                <span className="w-6 text-end">{stats.twoStars}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8">1★</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${stats.total > 0 ? (stats.oneStar / stats.total) * 100 : 0}%` }} />
                                </div>
                                <span className="w-6 text-end">{stats.oneStar}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('adminDashboard.searchReviews', 'Search reviews...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ps-9"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={ratingFilter === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRatingFilter(null)}
                    >
                        {t('adminDashboard.all', 'All')}
                    </Button>
                    {[5, 4, 3, 2, 1].map(rating => (
                        <Button
                            key={rating}
                            variant={ratingFilter === rating ? "default" : "outline"}
                            size="sm"
                            onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                        >
                            {rating}★
                        </Button>
                    ))}
                </div>
            </div>

            {/* Reviews Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('adminDashboard.traveler', 'Traveler')}</TableHead>
                                <TableHead>{t('adminDashboard.package', 'Package')}</TableHead>
                                <TableHead>{t('adminDashboard.agency', 'Agency')}</TableHead>
                                <TableHead>{t('adminDashboard.rating', 'Rating')}</TableHead>
                                <TableHead className="hidden md:table-cell">{t('adminDashboard.comment', 'Comment')}</TableHead>
                                <TableHead>{t('adminDashboard.date', 'Date')}</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReviews.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        {t('adminDashboard.noReviewsFound', 'No reviews found')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReviews.map(review => (
                                    <TableRow key={review.id}>
                                        <TableCell>
                                            <div className="font-medium text-sm">{review.traveler_name}</div>
                                            <div className="text-xs text-muted-foreground">{review.traveler_email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm">{review.package_title}</div>
                                            <div className="text-xs text-muted-foreground">{review.package_destination}</div>
                                        </TableCell>
                                        <TableCell className="text-sm">{review.agency_name}</TableCell>
                                        <TableCell>{renderStars(review.rating)}</TableCell>
                                        <TableCell className="hidden md:table-cell max-w-xs">
                                            <p className="text-sm text-muted-foreground truncate">
                                                {review.comment || <span className="italic">{t('adminDashboard.noComment', 'No comment')}</span>}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(review.created_at, 'P')}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={t('adminDashboard.actions', 'Actions')}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align={isRTL ? "start" : "end"}>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => setDeleteTarget(review)}
                                                    >
                                                        <Trash2 className="me-2 h-4 w-4" />
                                                        {t('adminDashboard.delete', 'Delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('adminDashboard.deleteReview', 'Delete Review')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('adminDashboard.deleteReviewConfirm', 'This action cannot be undone. The review and its rating will be permanently removed.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('adminDashboard.cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t('adminDashboard.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
