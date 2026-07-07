import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";
import { localizedText } from "@/lib/localized";
import { useDestinations } from "@/features/packages/hooks/useDestinations";

export function DestinationsSection() {
  const { t } = useTranslation();
  const { data: regions = [], isLoading } = useDestinations("region");

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">{t('destinations.title')}</h2>
        <p className="text-muted-foreground">{t('destinations.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="w-full h-32" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-2/3 mx-auto" />
                    <Skeleton className="h-3 w-1/2 mx-auto" />
                  </div>
                </CardContent>
              </Card>
            ))
          : regions.map((destination) => (
              <Link key={destination.id} to="/destinations">
                <Card className={`overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${destination.color_class ?? ''}`}>
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={destination.image_url ?? ''}
                        alt={localizedText(destination, 'name')}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-semibold">{localizedText(destination, 'name')}</h3>
                      <p className="text-sm text-muted-foreground">{localizedText(destination, 'region_label')}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>
    </section>
  );
}
