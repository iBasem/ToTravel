import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Input } from "@/ui/input";
import { HeaderSection } from "@/features/home/components/HeaderSection";
import { FooterSection } from "@/features/home/components/FooterSection";
import { useTranslation } from "react-i18next";
import {
  Search,
  MapPin,
  Star,
  Calendar,
  Users,
  Plane
} from "lucide-react";

const destinations = [
  {
    id: 1,
    name: "Vietnam",
    region: "Southeast Asia",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&h=400&fit=crop",
    description: "From bustling cities to serene countryside, Vietnam offers incredible diversity.",
    tourCount: 45,
    averagePrice: 899,
    rating: 4.8,
    highlights: ["Halong Bay", "Ho Chi Minh City", "Hoi An", "Hanoi"]
  },
  {
    id: 2,
    name: "Turkey",
    region: "Europe/Asia",
    image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&h=400&fit=crop",
    description: "Where East meets West - ancient history and modern culture collide.",
    tourCount: 38,
    averagePrice: 1299,
    rating: 4.9,
    highlights: ["Cappadocia", "Istanbul", "Pamukkale", "Ephesus"]
  },
  {
    id: 3,
    name: "Morocco",
    region: "North Africa",
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&h=400&fit=crop",
    description: "Desert adventures, imperial cities, and exotic markets await.",
    tourCount: 52,
    averagePrice: 756,
    rating: 4.7,
    highlights: ["Marrakech", "Sahara Desert", "Fez", "Casablanca"]
  },
  {
    id: 4,
    name: "Japan",
    region: "East Asia",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
    description: "Ancient traditions blend seamlessly with cutting-edge technology.",
    tourCount: 29,
    averagePrice: 2199,
    rating: 4.9,
    highlights: ["Tokyo", "Kyoto", "Mount Fuji", "Osaka"]
  },
  {
    id: 5,
    name: "Peru",
    region: "South America",
    image: "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=600&h=400&fit=crop",
    description: "Home to ancient civilizations and breathtaking landscapes.",
    tourCount: 34,
    averagePrice: 1499,
    rating: 4.8,
    highlights: ["Machu Picchu", "Cusco", "Sacred Valley", "Lima"]
  },
  {
    id: 6,
    name: "Italy",
    region: "Southern Europe",
    image: "https://images.unsplash.com/photo-1469041797191-50ace28483c3?w=600&h=400&fit=crop",
    description: "Art, history, cuisine, and romance in the heart of Europe.",
    tourCount: 67,
    averagePrice: 1189,
    rating: 4.6,
    highlights: ["Rome", "Florence", "Venice", "Tuscany"]
  }
];

export default function Destinations() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");

  const regions = [
    t('destinations.allRegions'),
    t('destinations.europe'),
    t('destinations.asia'),
    t('destinations.africa'),
    t('destinations.americas'),
    t('destinations.oceania')
  ];

  const filteredDestinations = destinations.filter(dest => {
    const matchesSearch = dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === t('destinations.allRegions') ||
      dest.region.toLowerCase().includes(selectedRegion.toLowerCase());
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="min-h-screen bg-muted/50">
      <HeaderSection />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
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
          {regions.map((region) => (
            <Button
              key={region}
              variant={selectedRegion === region ? "default" : "outline"}
              onClick={() => setSelectedRegion(region)}
              className="rounded-full"
            >
              {region}
            </Button>
          ))}
        </div>

        {/* Stats */}
        <div className="text-center mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold text-blue-600">{filteredDestinations.length}</div>
              <div className="text-muted-foreground">{t('common.destinations')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {filteredDestinations.reduce((sum, dest) => sum + dest.tourCount, 0)}
              </div>
              <div className="text-muted-foreground">{t('destinations.toursAvailable')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">4.8</div>
              <div className="text-muted-foreground">{t('destinations.averageRating')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">50+</div>
              <div className="text-muted-foreground">{t('destinations.countries')}</div>
            </div>
          </div>
        </div>

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
                  <Badge className="bg-blue-600 text-white">
                    {destination.tourCount} tours
                  </Badge>
                </div>
                <div className="absolute top-4 end-4">
                  <div className="bg-background/90 rounded-full px-2 py-1 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{destination.rating}</span>
                  </div>
                </div>
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

                  <p className="text-foreground">{destination.description}</p>

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
                      <div className="text-2xl font-bold text-blue-600">
                        ${destination.averagePrice}
                      </div>
                    </div>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link to={`/packages?destination=${destination.name.toLowerCase()}`}>
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
            <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{t('destinations.noDestinations')}</h3>
            <p className="text-muted-foreground mb-6">{t('destinations.tryAdjusting')}</p>
            <Button onClick={() => {
              setSearchTerm("");
              setSelectedRegion(t('destinations.allRegions'));
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
