import { Link } from "react-router-dom";
import { Button } from "@/ui/button";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/ui/empty-state";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { useWishlist } from "@/features/traveler/hooks/useWishlist";
import { PackageCard } from "@/features/packages/components/PackageCard";

export default function TravelerWishlist() {
  const { t } = useTranslation();

  // Real data hook
  const { wishlist, loading, toggleWishlist } = useWishlist();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('travelerDashboard.myWishlist')}</h1>
          <p className="text-gray-600">{t('travelerDashboard.toursSavedForLater')}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/packages">{t('travelerDashboard.browseMoreTours')}</Link>
        </Button>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <PackageCard
              key={item.id}
              packageData={item.package}
              isInWishlist={true}
              onToggleWishlist={() => toggleWishlist(item.package.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="heart"
          title={t('travelerDashboard.emptyWishlistTitle')}
          description={t('travelerDashboard.emptyWishlistDesc')}
          action={{
            label: t('travelerDashboard.browseTours'),
            onClick: () => window.location.href = "/packages"
          }}
        />
      )}
    </div>
  );
}
