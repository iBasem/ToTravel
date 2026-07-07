import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Input } from "@/ui/input";
import { HeaderSection } from "@/features/home/components/HeaderSection";
import { FooterSection } from "@/features/home/components/FooterSection";
import { useTranslation } from "react-i18next";
import { Seo } from "@/lib/seo";
import { formatCurrency } from "@/lib/formatters";
import { localizedText, pickLocalized } from "@/lib/localized";
import { useDestinations } from "@/features/packages/hooks/useDestinations";
import {
  Search,
  MapPin,
  Star,
  Loader2,
  Plane
} from "lucide-react";

const REGION_KEYS = ["all", "europe", "asia", "africa", "americas", "oceania"] as const;

export default function Destinations() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  // Stable key, not a translated label — labels change with the language.
  const [selectedRegion, setSelectedRegion] = useState<(typeof REGION_KEYS)[number]>("all");

  const { data: destinationRows = [], isLoading, isError } = useDestinations("country");

  const destinations = destinationRows.map((d) => ({
    id: d.slug,
    slug: d.slug,
    regionKeys: d.region_keys,
    image: d.image_url ?? "",
    tourCount: d.tour_count,
    averagePrice: d.average_price != null ? Number(d.average_price) : 0,
    rating: d.average_rating != null ? Number(d.average_rating) : null,
    name: localizedText(d, "name"),
    region: localizedText(d, "region_label"),
    description: localizedText(d, "description"),
    highlights: pickLocalized<string[]>(d, "highlights") ?? [],
  }));

  const filteredDestinations = destinations.filter(dest => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      dest.name.toLowerCase().includes(q) ||
      dest.region.toLowerCase().includes(q) ||
      dest.slug.includes(q);
    const matchesRegion =
      selectedRegion === "all" || dest.regionKeys.includes(selectedRegion);
    return matchesSearch && matchesRegion;
  });

  const ratedDestinations = filteredDestinations.filter(d => d.rating != null);
  const averageRating = ratedDestinations.length > 0
    ? (ratedDestinations.reduce((sum, d) => sum + (d.rating ?? 0), 0) / ratedDestinations.length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-background">
      <Seo title={t('destinations.exploreWorld')} description={t('destinations.exploreDescription')} />
      <HeaderSection />

      {/* Hero Section */}
      <div id="main-content" className="bg-gradient-to-r from-primary to-primary/85 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              {t('destinations.exploreWorld')}
            </h1>
            <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto">
              {t('destinations.exploreDescription')}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute start-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder={t('destinations.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-12 h-14 text-lg bg-background text-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Region Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {REGION_KEYS.map((regionKey) => (
            <Button
              key={regionKey}
              variant={selectedRegion === regionKey ? "default" : "outline"}
              onClick={() => setSelectedRegion(regionKey)}
              className="rounded-full"
            >
              {t(`destinations.${regionKey === 'all' ? 'allRegions' : regionKey}`)}
            </Button>
          ))}
        </div>

        {/* Stats */}
        <div className="text-center mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold text-foreground">{filteredDestinations.length}</div>
              <div className="text-muted-foreground">{t('common.destinations')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">
                {filteredDestinations.reduce((sum, dest) => sum + dest.tourCount, 0)}
              </div>
              <div className="text-muted-foreground">{t('destinations.toursAvailable')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">{averageRating}</div>
              <div className="text-muted-foreground">{t('destinations.averageRating')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">{destinations.length}</div>
              <div className="text-muted-foreground">{t('destinations.countries')}</div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ms-3 text-muted-foreground">{t('common.loading', 'Loading...')}</span>
          </div>
        )}

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDestinations.map((destination) => (
            <Card key={destination.id} className="overflow-hidden hover:shadow-xl transition-shadow bg-card">
              <div className="relative">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 start-4">
                  <Badge className="bg-primary text-primary-foreground">
                    {t('destinations.tourCount', { count: destination.tourCount })}
                  </Badge>
                </div>
                {destination.rating != null && (
                  <div className="absolute top-4 end-4">
                    <div className="bg-background/90 rounded-full px-2 py-1 flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{destination.rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">{destination.name}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{destination.region}</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground">{destination.description}</p>

                  {/* Highlights */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">{t('destinations.popularPlaces')}</h4>
                    <div className="flex flex-wrap gap-1">
                      {destination.highlights.slice(0, 3).map((highlight, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {highlight}
                        </Badge>
                      ))}
                      {destination.highlights.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{destination.highlights.length - 3} {t('common.viewAll')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <div className="text-sm text-muted-foreground">{t('destinations.toursFrom')}</div>
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(destination.averagePrice)}
                      </div>
                    </div>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link to={`/packages?destination=${destination.slug}`}>
                        <Plane className="w-4 h-4 me-2" />
                        {t('destinations.exploreTours')}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {!isLoading && !isError && filteredDestinations.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{t('destinations.noDestinations')}</h3>
            <p className="text-muted-foreground mb-6">{t('destinations.tryAdjusting')}</p>
            <Button onClick={() => {
              setSearchTerm("");
              setSelectedRegion("all");
            }}>
              {t('common.clearFilters')}
            </Button>
          </div>
        )}
      </div>

      <FooterSection />
    </div>
  );
}
