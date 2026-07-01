import { useTranslation } from "react-i18next";
import { ToursSection } from "./ToursSection";
import { EmptyState } from "@/ui/empty-state";
import type { PackageWithMedia } from "@/features/packages/hooks/usePublishedPackages";

interface TourListingSectionProps {
  titleKey?: string;
  descriptionKey?: string;
  title?: string;
  description?: string;
  packages: PackageWithMedia[];
  showViewAll?: boolean;
  backgroundClass?: string;
}

export function TourListingSection({
  titleKey,
  descriptionKey,
  title,
  description,
  packages,
  showViewAll = true,
  backgroundClass = ""
}: TourListingSectionProps) {
  const { t } = useTranslation();

  const displayTitle = titleKey ? t(titleKey) : title;
  const displayDescription = descriptionKey ? t(descriptionKey) : description;

  return (
    <section className={`max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 ${backgroundClass}`}>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">{displayTitle}</h2>
          <p className="text-sm sm:text-base text-gray-600">{displayDescription}</p>
        </div>
      </div>

      {packages.length > 0 ? (
        <ToursSection packages={packages} showViewAll={showViewAll} />
      ) : (
        <EmptyState
          icon="package"
          title={t('tours.noPackages')}
          description={t('tours.checkBack')}
        />
      )}
    </section>
  );
}
