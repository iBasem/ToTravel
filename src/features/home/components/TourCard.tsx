import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Heart, Star } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { localizedText } from "@/lib/localized";
import type { PackageWithMedia } from "@/features/packages/hooks/usePublishedPackages";

export interface TourCardDeal {
  discount_percentage: number;
  sale_price: number;
}

interface TourCardProps {
  package: PackageWithMedia;
  /** Active, admin-approved deal for this package (if any) */
  deal?: TourCardDeal | null;
}

/**
 * Marketplace tour card: rounded image with badge + wishlist button on top,
 * transparent text block underneath (title, days / rating, price). When a deal
 * is attached the price shows the struck original and the discounted price.
 */
export function TourCard({ package: pkg, deal }: TourCardProps) {
  const { t } = useTranslation();
  const title = localizedText(pkg, 'title');
  const destination = localizedText(pkg, 'destination');
  const primaryImage = pkg.package_media?.find(m => m.is_primary) || pkg.package_media?.[0];
  const imageUrl = primaryImage?.file_path || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop";
  const hasReviews = (pkg.total_reviews ?? 0) > 0;

  return (
    <Link to={`/packages/${pkg.id}`} className="group block h-full">
      <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-muted shadow-sm transition-shadow group-hover:shadow-md">
        <img
          src={imageUrl}
          alt={`${title} – ${destination}`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        {deal ? (
          <Badge className="absolute top-2.5 start-2.5 bg-deal text-deal-foreground hover:bg-deal border-transparent text-xs font-bold rounded-full px-2.5">
            {t('packageCard.percentOff', { percent: Math.round(deal.discount_percentage) })}
          </Badge>
        ) : pkg.featured ? (
          <Badge className="absolute top-2.5 start-2.5 bg-primary text-primary-foreground text-xs rounded-full px-2.5">
            {t('common.featured')}
          </Badge>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 end-2 bg-background/90 hover:bg-background rounded-full w-8 h-8 sm:w-9 sm:h-9 shadow-sm"
          onClick={(e) => e.preventDefault()}
          aria-label={t('packageCard.addToWishlist')}
        >
          <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </div>

      <div className="pt-3 px-0.5">
        <h3 className="font-semibold leading-snug line-clamp-2 text-sm sm:text-base text-foreground min-h-[2.6em]">
          {title}
        </h3>

        <div className="flex items-center gap-1.5 mt-1.5 text-xs sm:text-sm text-muted-foreground">
          <span>{pkg.duration_days} {t('common.days')}</span>
          {hasReviews && (
            <>
              <span aria-hidden="true">•</span>
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-current shrink-0" aria-hidden="true" />
              <span className="font-semibold text-foreground">
                {Number(pkg.average_rating ?? 0).toFixed(1)}
              </span>
              <span>
                ({t('common.reviewsCount', { count: pkg.total_reviews ?? 0, defaultValue: String(pkg.total_reviews ?? 0) })})
              </span>
            </>
          )}
        </div>

        <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
          {deal ? (
            <>
              <div>
                <span className="me-1">{t('common.from')}</span>
                <s className="text-deal">{formatCurrency(pkg.base_price)}</s>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-bold text-foreground">
                  {formatCurrency(deal.sale_price)}
                </span>
                <span>{t('common.perPerson')}</span>
              </div>
            </>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="me-1">{t('common.from')}</span>
              <span className="text-base sm:text-lg font-bold text-foreground">
                {formatCurrency(pkg.base_price)}
              </span>
              <span>{t('common.perPerson')}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
