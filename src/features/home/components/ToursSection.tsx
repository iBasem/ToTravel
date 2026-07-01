import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TourCard } from "./TourCard";
import { Button } from "@/ui/button";
import type { PackageWithMedia } from "@/features/packages/hooks/usePublishedPackages";

interface ToursSectionProps {
  packages: PackageWithMedia[];
  showViewAll?: boolean;
}

export function ToursSection({ packages, showViewAll = true }: ToursSectionProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {packages.map((pkg) => (
          <TourCard key={pkg.id} package={pkg} />
        ))}
      </div>

      {showViewAll && packages.length > 0 && (
        <div className="text-center">
          <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <Link to="/packages">{t('tours.viewAllTours')}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
