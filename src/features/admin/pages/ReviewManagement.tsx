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
import { Search, MoreHorizontal, Trash2, Star, TrendingUp, MessageSquare, Calendar } from "lucide-react";
import { useAdminReviews } from "@/features/admin/hooks/useAdminReviews";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatters";

export default function ReviewManagement() {
    const { reviews, stats, loading, error, deleteReview, refetch } = useAdminReviews();
    const [searchTerm, setSearchTerm] = useState("");
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const { t, i18n } = useTranslation();
    const isRTL = i18n.dir() === 'rtl';

    const filteredReviews = reviews.filter(review => {
        const matchesSearch = !searchTerm ||
            review.traveler_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.package_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.agency_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (review.comment && review.comment.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRating = ratingFilter === null || review.rating === ratingFilter;
        return matchesSearch && matchesRating;
    });

    const handleDelete = async () => {
        if (!deleteId) return;
        const result = await deleteReview(deleteId);
        if (result.success) {
            toast.success(t('adminDashboard.reviewDeleted', 'Review deleted successfully'));
        } else {
            toast.error(t('adminDashboard.reviewDeleteError', 'Failed to delete review'));
        }
        setDeleteId(null);
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

    if (loading) {
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t('adminDashboard.reviewManagement', 'Review Management')}</h1>
                    <p className="text-muted-foreground">{t('adminDashboard.reviewManagementDesc', 'Monitor and moderate customer reviews')}</p>
                </div>
                <Button onClick={refetch} variant="outline" size="sm">
                    {t('adminDashboard.refresh', 'Refresh')}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('adminDashboard.totalReviews', 'Total Reviews')}</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('adminDashboard.averageRating', 'Average Rating')}</CardTitle>
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averageRating}</div>
                        <div className="flex items-center gap-0.5 mt-1">
                            {renderStars(Math.round(stats.averageRating))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('adminDashboard.thisMonth', 'This Month')}</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.thisMonth}</div>
                    </CardContent>
                </Card>

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
                                                        onClick={() => setDeleteId(review.id)}
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
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
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
