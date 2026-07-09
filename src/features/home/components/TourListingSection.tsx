import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { TourCarousel } from "./TourCarousel";
import { TourCard } from "./TourCard";
import type { PackageWithMedia } from "@/features/packages/hooks/usePublishedPackages";
import type { ActiveDeal } from "@/features/packages/hooks/useActiveDeals";

interface TourListingSectionProps {
  titleKey?: string;
  descriptionKey?: string;
  title?: string;
  description?: string;
  packages: PackageWithMedia[];
  showViewAll?: boolean;
  backgroundClass?: string;
  /** Best active deal per package id, so cards can show discounted prices */
  dealsByPackage?: Map<string, ActiveDeal>;
}

export function TourListingSection({
  titleKey,
  descriptionKey,
  title,
  description,
  packages,
  showViewAll = true,
  backgroundClass = "",
  dealsByPackage
}: TourListingSectionProps) {
  const { t } = useTranslation();

  const displayTitle = titleKey ? t(titleKey) : title;
  const displayDescription = descriptionKey ? t(descriptionKey) : description;

  return (
    <section className={backgroundClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {packages.length > 0 ? (
          <TourCarousel
            title={displayTitle ?? ""}
            description={displayDescription}
            headerAction={
              showViewAll ? (
                <Button asChild variant="outline" className="rounded-full hidden sm:inline-flex">
                  <Link to="/packages">{t('tours.viewAllTours')}</Link>
                </Button>
              ) : undefined
            }
          >
            {packages.map((pkg) => {
              const deal = dealsByPackage?.get(pkg.id);
              return (
                <div key={pkg.id} className="w-60 sm:w-64 lg:w-[268px]">
                  <TourCard
                    package={pkg}
                    deal={
                      deal && deal.sale_price != null && deal.discount_percentage != null
                        ? { discount_percentage: deal.discount_percentage, sale_price: deal.sale_price }
                        : null
                    }
                  />
                </div>
              );
            })}
          </TourCarousel>
        ) : (
          <>
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{displayTitle}</h2>
              {displayDescription && (
                <p className="text-sm sm:text-base text-muted-foreground">{displayDescription}</p>
              )}
            </div>
            <EmptyState
              icon="package"
              title={t('tours.noPackages')}
              description={t('tours.checkBack')}
            />
          </>
        )}
      </div>
    </section>
  );
}
