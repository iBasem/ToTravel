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
import { Search, MoreHorizontal, Eye, Edit, Star, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { useAdminPackages } from "@/features/admin/hooks";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatCurrency, formatNumber } from "@/lib/formatters";

import { PageHeader } from "@/ui/page-header";
import { StatsGrid } from "@/ui/stats-card";

export default function AdminPackageManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { packages, stats, loading, refetch, updatePackageStatus, toggleFeatured } = useAdminPackages();
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t('common.live')}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{t('common.pending')}</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">{t('common.rejected')}</Badge>;
      case "draft":
        return <Badge className="bg-muted text-muted-foreground">{t('common.draft')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleToggleFeatured = async (packageId: string, currentFeatured: boolean) => {
    const result = await toggleFeatured(packageId, !currentFeatured);
    if (result.success) {
      toast.success(currentFeatured
        ? t('adminPackages.removedFeatured')
        : t('adminPackages.markedFeatured')
      );
    } else {
      toast.error(t('common.updateError'));
    }
  };

  // Approve a submitted package (pending -> published) or send it back (-> draft).
  const handleReview = async (packageId: string, approve: boolean) => {
    const result = await updatePackageStatus(packageId, approve ? 'published' : 'draft');
    if (result.success) {
      toast.success(approve
        ? t('adminPackages.approved', 'Package approved and published')
        : t('adminPackages.rejected', 'Package sent back to draft')
      );
    } else {
      toast.error(t('common.updateError'));
    }
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.agency_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-start">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2 text-start">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="text-start">
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('adminPackages.title')}
        description={t('adminPackages.subtitle')}
        actions={
          <>
            <Button variant="outline" onClick={refetch} className="flex items-center">
              <RefreshCw className="w-4 h-4 me-2" />
              {t('common.refresh')}
            </Button>
            <Button>{t('adminPackages.addPackage')}</Button>
          </>
        }
      />

      <StatsGrid
        stats={[
          { title: t('adminPackages.totalPackages'), value: formatNumber(stats.total) },
          { title: t('adminPackages.livePackages'), value: formatNumber(stats.live) },
          { title: t('adminPackages.pendingReview'), value: formatNumber(stats.pending) },
          { title: t('common.featured'), value: formatNumber(stats.featured) },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('adminPackages.allPackages')}</CardTitle>
            <div className="relative">
              <Search className="absolute top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 start-3" />
              <Input
                placeholder={t('adminPackages.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 ps-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPackages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('adminPackages.noPackagesFound')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t('common.package')}</TableHead>
                  <TableHead className="text-start">{t('common.agency')}</TableHead>
                  <TableHead className="text-start">{t('common.destination')}</TableHead>
                  <TableHead className="text-start">{t('common.price')}</TableHead>
                  <TableHead className="text-start">{t('common.duration')}</TableHead>
                  <TableHead className="text-start">{t('common.status')}</TableHead>
                  <TableHead className="text-start">{t('common.featured')}</TableHead>
                  <TableHead className="text-end">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="text-start">
                      <div className="font-medium text-foreground">{pkg.title}</div>
                      <div className="text-sm text-muted-foreground tabular-nums">{pkg.id.slice(0, 8)}</div>
                    </TableCell>
                    <TableCell className="text-start">{pkg.agency_name}</TableCell>
                    <TableCell className="text-start">{pkg.destination}</TableCell>
                    <TableCell className="font-medium tabular-nums text-start">{formatCurrency(pkg.base_price)}</TableCell>
                    <TableCell className="tabular-nums text-start">{pkg.duration_days} {t('common.days')}</TableCell>
                    <TableCell className="text-start">{getStatusBadge(pkg.status)}</TableCell>
                    <TableCell className="text-start">
                      <button
                        type="button"
                        aria-label={pkg.featured ? t('adminPackages.removeFeatured') : t('adminPackages.makeFeatured')}
                        onClick={() => handleToggleFeatured(pkg.id, pkg.featured)}
                      >
                        {pkg.featured ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        ) : (
                          <Star className="w-4 h-4 text-muted-foreground/40" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={t('common.actions')}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"}>
                          {pkg.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleReview(pkg.id, true)}>
                                <CheckCircle2 className="w-4 h-4 me-2 text-green-600" />
                                {t('adminPackages.approve', 'Approve & publish')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReview(pkg.id, false)}>
                                <XCircle className="w-4 h-4 me-2 text-red-600" />
                                {t('adminPackages.reject', 'Reject (send to draft)')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {pkg.status === 'published' && (
                            <DropdownMenuItem onClick={() => handleReview(pkg.id, false)}>
                              <XCircle className="w-4 h-4 me-2" />
                              {t('adminPackages.unpublish', 'Unpublish')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 me-2" />
                            {t('adminPackages.viewPackage')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 me-2" />
                            {t('adminPackages.editPackage')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleFeatured(pkg.id, pkg.featured)}>
                            <Star className="w-4 h-4 me-2" />
                            {pkg.featured ? t('adminPackages.removeFeatured') : t('adminPackages.makeFeatured')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
