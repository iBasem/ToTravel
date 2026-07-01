import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Heart, Star, MapPin } from "lucide-react";
import type { PackageWithMedia } from "@/features/packages/hooks/usePublishedPackages";

interface TourCardProps {
  package: PackageWithMedia;
}

export function TourCard({ package: pkg }: TourCardProps) {
  const { t, i18n } = useTranslation();
  const primaryImage = pkg.package_media?.find(m => m.is_primary) || pkg.package_media?.[0];
  const imageUrl = primaryImage?.file_path || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop";

  return (
    <Link to={`/packages/${pkg.id}`}>
      <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-card h-full">
        <CardContent className="p-0">
          <div className="relative">
            <img
              src={imageUrl}
              alt={pkg.title}
              className="w-full h-40 sm:h-48 object-cover"
            />
            {pkg.featured && (
              <Badge className="absolute top-2 start-2 bg-primary text-primary-foreground text-xs">
                {t('common.featured')}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 end-2 bg-background/80 hover:bg-background w-8 h-8 sm:w-10 sm:h-10"
              onClick={(e) => e.preventDefault()}
            >
              <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
          <div className="p-3 sm:p-4">
            <h3 className="font-semibold mb-2 line-clamp-2 text-sm sm:text-base">
              {pkg.title}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs sm:text-sm text-muted-foreground truncate">{pkg.destination}</span>
            </div>
            <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
              <span className="text-muted-foreground">{pkg.duration_days} {t('common.days')}</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                <span className="font-medium">4.8</span>
                <span className="text-muted-foreground hidden sm:inline">
                  ({t('common.reviewsCount', { count: 24, defaultValue: '24' })})
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-lg font-bold">
                  {new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'USD' }).format(pkg.base_price)}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {t('common.perPerson')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
