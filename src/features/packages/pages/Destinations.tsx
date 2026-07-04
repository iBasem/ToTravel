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
import {
  Search,
  MapPin,
  Star,
  Calendar,
  Users,
  Plane
} from "lucide-react";

// Language-independent data. Names/regions/descriptions/highlights live in
// the locale files under destinations.items.<id>; slug feeds the packages
// search query and must stay English.
const DESTINATION_DATA = [
  {
    id: "vietnam",
    slug: "vietnam",
    regionKeys: ["asia"],
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&h=400&fit=crop",
    tourCount: 45,
    averagePrice: 899,
    rating: 4.8,
  },
  {
    id: "turkey",
    slug: "turkey",
    regionKeys: ["europe", "asia"],
    image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&h=400&fit=crop",
    tourCount: 38,
    averagePrice: 1299,
    rating: 4.9,
  },
  {
    id: "morocco",
    slug: "morocco",
    regionKeys: ["africa"],
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&h=400&fit=crop",
    tourCount: 52,
    averagePrice: 756,
    rating: 4.7,
  },
  {
    id: "japan",
    slug: "japan",
    regionKeys: ["asia"],
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
    tourCount: 29,
    averagePrice: 2199,
    rating: 4.9,
  },
  {
    id: "peru",
    slug: "peru",
    regionKeys: ["americas"],
    image: "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=600&h=400&fit=crop",
    tourCount: 34,
    averagePrice: 1499,
    rating: 4.8,
  },
  {
    id: "italy",
    slug: "italy",
    regionKeys: ["europe"],
    image: "https://images.unsplash.com/photo-1469041797191-50ace28483c3?w=600&h=400&fit=crop",
    tourCount: 67,
    averagePrice: 1189,
    rating: 4.6,
  },
];

const REGION_KEYS = ["all", "europe", "asia", "africa", "americas", "oceania"] as const;

export default function Destinations() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  // Stable key, not a translated label — labels change with the language.
  const [selectedRegion, setSelectedRegion] = useState<(typeof REGION_KEYS)[number]>("all");

  const destinations = DESTINATION_DATA.map((d) => ({
    ...d,
    name: t(`destinations.items.${d.id}.name`),
    region: t(`destinations.items.${d.id}.region`),
    description: t(`destinations.items.${d.id}.description`),
    highlights: [0, 1, 2, 3].map((i) => t(`destinations.items.${d.id}.highlights.${i}`)),
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo title={t('destinations.exploreWorld')} description={t('destinations.exploreDescription')} />
      <HeaderSection />

      {/* Hero Section */}
      <div id="main-content" className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
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
                <Search className="absolute start-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder={t('destinations.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-12 h-14 text-lg bg-white text-gray-900"
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
              <div className="text-3xl font-bold text-blue-600">{filteredDestinations.length}</div>
              <div className="text-gray-600">{t('common.destinations')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {filteredDestinations.reduce((sum, dest) => sum + dest.tourCount, 0)}
              </div>
              <div className="text-gray-600">{t('destinations.toursAvailable')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">4.8</div>
              <div className="text-gray-600">{t('destinations.averageRating')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">50+</div>
              <div className="text-gray-600">{t('destinations.countries')}</div>
            </div>
          </div>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDestinations.map((destination) => (
            <Card key={destination.id} className="overflow-hidden hover:shadow-xl transition-shadow bg-white">
              <div className="relative">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 start-4">
                  <Badge className="bg-blue-600 text-white">
                    {t('destinations.tourCount', { count: destination.tourCount })}
                  </Badge>
                </div>
                <div className="absolute top-4 end-4">
                  <div className="bg-white/90 rounded-full px-2 py-1 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{destination.rating}</span>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{destination.name}</h3>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{destination.region}</span>
                    </div>
                  </div>

                  <p className="text-gray-700">{destination.description}</p>

                  {/* Highlights */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('destinations.popularPlaces')}</h4>
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
                      <div className="text-sm text-gray-600">{t('destinations.toursFrom')}</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(destination.averagePrice)}
                      </div>
                    </div>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
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
        {filteredDestinations.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('destinations.noDestinations')}</h3>
            <p className="text-gray-600 mb-6">{t('destinations.tryAdjusting')}</p>
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
