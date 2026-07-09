import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/ui/skeleton";
import { TourCarousel } from "./TourCarousel";
import { localizedText } from "@/lib/localized";
import { useDestinations } from "@/features/packages/hooks/useDestinations";

export function DestinationsSection() {
  const { t } = useTranslation();
  const { data: regions = [], isLoading } = useDestinations("region");

  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {isLoading ? (
          <>
            <div className="mb-6 sm:mb-8">
              <Skeleton className="h-8 w-64 mb-3" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-4 sm:gap-5 overflow-hidden">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="w-52 sm:w-56 shrink-0">
                  <Skeleton className="aspect-[3/2] w-full rounded-2xl" />
                  <Skeleton className="h-4 w-2/3 mt-3" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <TourCarousel title={t('destinations.title')} description={t('destinations.subtitle')}>
            {regions.map((destination) => {
              const name = localizedText(destination, 'name');
              const label = localizedText(destination, 'region_label');
              return (
                <Link key={destination.id} to="/destinations" className="group block w-52 sm:w-56">
                  <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-muted shadow-sm transition-shadow group-hover:shadow-md">
                    {destination.image_url && (
                      <img
                        src={destination.image_url}
                        alt={name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
                    <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                      <h3 className="font-semibold text-base sm:text-lg leading-tight">{name}</h3>
                      {label && <p className="text-xs sm:text-sm text-white/85 mt-0.5">{label}</p>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </TourCarousel>
        )}
      </div>
    </section>
  );
}
