import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Plus, Search, Filter, Package, Edit, Trash2, MoreVertical, Eye } from "lucide-react";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { Input } from "@/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Badge } from "@/ui/badge";
import { usePackages } from "@/features/packages/hooks/usePackages";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { PageHeader } from "@/ui/page-header";

export default function Packages() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { packages, loading, error, deletePackage, updatePackage } = usePackages();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const handleCreatePackage = () => {
    navigate("/travel_agency/packages/create");
  };

  const handleEditPackage = (packageId: string) => {
    navigate(`/travel_agency/packages/${packageId}/edit`);
  };

  const handleViewPackage = (packageId: string) => {
    navigate(`/travel_agency/packages/${packageId}`);
  };

  const handleDeletePackage = async (packageId: string, title: string) => {
    if (confirm(`${t('common.deletePackageConfirm', 'Are you sure you want to delete')} "${title}"?`)) {
      try {
        await deletePackage(packageId);
        toast.success(t('packageWizard.packageDeleted', 'Package deleted successfully'));
      } catch (error) {
        toast.error(t('errors.somethingWentWrong', 'Error deleting package'));
      }
    }
  };

  const togglePublishStatus = async (pkg: any) => {
    try {
      // Publishing requires admin approval: submitting sends the package to
      // 'pending'; unpublishing a live package returns it to 'draft'.
      const newStatus = pkg.status === 'published' ? 'draft' : 'pending';
      await updatePackage(pkg.id, { status: newStatus });
      toast.success(
        newStatus === 'pending'
          ? t('agencyDashboard.submittedForReview', 'Submitted for review')
          : t('agencyDashboard.unpublished', 'Unpublished')
      );
    } catch (error) {
      toast.error(t('agencyDashboard.errorLoadingPackages'));
    }
  };

  const getPrimaryImage = (pkg: any) => {
    if (!pkg.package_media || pkg.package_media.length === 0) {
      return null;
    }
    const primary = pkg.package_media.find((m: any) => m.is_primary);
    return primary?.file_path || pkg.package_media[0]?.file_path || null;
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-sm sm:text-base">{t('agencyDashboard.errorLoadingPackages')}: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 text-sm sm:text-base">
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header Section */}
      <PageHeader
        title={t('agencyDashboard.travelPackages')}
        description={t('agencyDashboard.managePackages')}
        actions={
          <Button
            onClick={handleCreatePackage}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs sm:text-sm lg:text-base px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 flex items-center gap-1 sm:gap-2"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            {t('agencyDashboard.createPackage')}
          </Button>
        }
      />

      {/* Search and Filter Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 start-2 sm:start-3" />
          <Input
            placeholder={t('agencyDashboard.searchPackages')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 sm:h-10 lg:h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm lg:text-base ps-8 sm:ps-10"
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto border-gray-200 hover:bg-gray-50 text-xs sm:text-sm lg:text-base px-3 sm:px-4 lg:px-6 flex items-center gap-1 sm:gap-2">
          <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
          {t('agencyDashboard.filter')}
        </Button>
      </div>

      {/* Packages Grid */}
      {filteredPackages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {filteredPackages.map((pkg) => {
            const thumbnail = getPrimaryImage(pkg);
            return (
              <Card key={pkg.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 border-gray-200 hover:-translate-y-1 bg-white overflow-hidden">
                {/* Thumbnail */}
                {thumbnail ? (
                  <div className="relative h-40 w-full overflow-hidden" onClick={() => handleViewPackage(pkg.id)}>
                    <img
                      src={thumbnail}
                      alt={pkg.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 end-2">
                      <Badge
                        variant={pkg.status === 'published' ? 'default' : 'secondary'}
                        className={`text-xs ${pkg.status === 'published' ? 'bg-green-100 text-green-800 border-green-200' : ''}`}
                      >
                        {pkg.status === 'published' ? t('agencyDashboard.published') : t('agencyDashboard.draft')}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div
                    className="relative h-40 w-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center"
                    onClick={() => handleViewPackage(pkg.id)}
                  >
                    <Package className="w-12 h-12 text-blue-300" />
                    <div className="absolute top-2 end-2">
                      <Badge
                        variant={pkg.status === 'published' ? 'default' : 'secondary'}
                        className={`text-xs ${pkg.status === 'published' ? 'bg-green-100 text-green-800 border-green-200' : ''}`}
                      >
                        {pkg.status === 'published' ? t('agencyDashboard.published') : t('agencyDashboard.draft')}
                      </Badge>
                    </div>
                  </div>
                )}

                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 text-start">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 line-clamp-2 flex-1 leading-tight">
                      {pkg.title}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                          <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-40 sm:w-48">
                        <DropdownMenuItem onClick={() => handleViewPackage(pkg.id)} className="text-xs sm:text-sm">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 me-1 sm:me-2" />
                          {t('common.viewDetails')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditPackage(pkg.id)} className="text-xs sm:text-sm">
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 me-1 sm:me-2" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublishStatus(pkg)} className="text-xs sm:text-sm">
                          {pkg.status === 'published' ? t('agencyDashboard.unpublish') : t('agencyDashboard.publish')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeletePackage(pkg.id, pkg.title)}
                          className="text-red-600 text-xs sm:text-sm"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 me-1 sm:me-2" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 text-start">
                  <p className="text-xs sm:text-sm text-gray-600">{pkg.destination}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{pkg.duration_days} {t('common.days')}, {pkg.duration_nights} {t('agencyDashboard.nights')}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-base sm:text-lg lg:text-xl font-bold text-blue-600">
                      {formatCurrency(pkg.base_price)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 sm:pt-2 border-t border-gray-100">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {t('agencyDashboard.daysPlanned', { count: pkg.itineraries?.length || 0 })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs sm:text-sm h-6 sm:h-8 px-2 sm:px-3"
                      onClick={() => handleViewPackage(pkg.id)}
                    >
                      {t('common.viewDetails')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="package"
          title={searchTerm ? t('agencyDashboard.noPackagesFound') : t('agencyDashboard.noPackagesYet')}
          description={searchTerm
            ? t('agencyDashboard.tryAdjustingSearch')
            : t('agencyDashboard.createFirstPackageDesc')
          }
          action={!searchTerm ? {
            label: t('agencyDashboard.createPackage'),
            onClick: handleCreatePackage
          } : undefined}
        />
      )}
    </div>
  );
}