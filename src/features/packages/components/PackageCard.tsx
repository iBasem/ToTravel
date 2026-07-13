import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Star, Map } from 'lucide-react';
import type { PackageWithMedia } from '../hooks/usePublishedPackages';
import { RouteMapThumbnail } from './RouteMapThumbnail';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { localizedText } from '@/lib/localized';
import '../styles/packages-listing.css';

interface PackageCardProps {
    packageData: PackageWithMedia & {
        destinations?: string[];
        agency_name?: string;
    };
    isInWishlist?: boolean;
    onToggleWishlist?: (id: string) => void;
}

export function PackageCard({
    packageData,
    isInWishlist = false,
    onToggleWishlist,
}: PackageCardProps) {
    const { t } = useTranslation();
    const {
        id,
        base_price,
        duration_days,
        duration_nights,
        category,
        featured,
        package_media,
        package_routes,
        destinations,
        average_rating,
        total_reviews,
    } = packageData;

    // Localized display fields (fall back to base columns outside Arabic UI)
    const title = localizedText(packageData, 'title');
    const destination = localizedText(packageData, 'destination');

    // Primary image
    const primaryMedia = package_media?.find((m) => m.is_primary) ?? package_media?.[0];
    const imageUrl = primaryMedia?.file_path ?? '/placeholder-tour.jpg';

    // Destinations list
    const destinationList = destinations?.length
        ? destinations
        : destination
          ? destination.split(',').map((d) => d.trim())
          : [];
    const visibleDestinations = destinationList.slice(0, 5);
    const moreCount = Math.max(0, destinationList.length - 5);

    // Badge label — categories are enum values with i18n entries
    const badgeLabel = category
        ? t(`categories.${category}`, {
              defaultValue: category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
          })
        : t('packageCard.explorer');

    // Real review data (0 / null until the package has been reviewed)
    const reviewCount = total_reviews ?? 0;
    const hasReviews = reviewCount > 0;
    const rating = average_rating ?? 0;

    return (
        <article className="pkg-card">
            {/* ========== IMAGE COLUMN ========== */}
            <div className="pkg-card-image-col">
                <Link to={`/packages/${id}`} className="pkg-card-image-link">
                    <img src={imageUrl} alt={title} className="pkg-card-image" loading="lazy" />
                </Link>

                {/* Map thumbnail — static route preview */}
                <Link to={`/packages/${id}#map`} className="pkg-card-map">
                    {package_routes && package_routes.length > 0 ? (
                        <RouteMapThumbnail routes={package_routes} />
                    ) : (
                        <div className="pkg-card-map-fallback">
                            <Map size={20} />
                        </div>
                    )}
                    <div className="pkg-card-map-overlay">
                        <Map size={12} />
                        <span>{t('packageCard.viewMap')}</span>
                    </div>
                </Link>

                {/* Wishlist heart */}
                {onToggleWishlist && (
                    <button
                        className={`pkg-card-wishlist${isInWishlist ? ' is-active' : ''}`}
                        onClick={() => onToggleWishlist(id)}
                        aria-label={isInWishlist ? t('packageCard.removeFromWishlist') : t('packageCard.addToWishlist')}
                        aria-pressed={isInWishlist}
                    >
                        <Heart size={18} fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" />
                    </button>
                )}
            </div>

            {/* ========== DETAILS COLUMN ========== */}
            <div className="pkg-card-details">
                {/* Badges */}
                <div className="pkg-card-badges">
                    {featured && (
                        <span className="pkg-badge-bestseller">
                            <Star size={12} />
                            {t('packageCard.bestSeller')}
                        </span>
                    )}
                    <span className="pkg-badge-category">{badgeLabel}</span>
                </div>

                {/* Title */}
                <h3 className="pkg-card-title">
                    <Link to={`/packages/${id}`}>
                        {title} {t('packageCard.days', { count: duration_days })}
                    </Link>
                </h3>

                {/* Rating — shown only when the package has real reviews */}
                {hasReviews && (
                    <div className="pkg-card-rating">
                        <span className="pkg-card-rating-score">{formatNumber(rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                        <Star size={14} className="pkg-card-rating-star" fill="currentColor" />
                        <span className="pkg-card-rating-count">
                            {t('packageCard.travelerReviews', { count: reviewCount })}
                        </span>
                    </div>
                )}

                {/* Details Grid — real, structured facts only */}
                <dl className="pkg-card-meta-grid">
                    <dt className="pkg-card-meta-label">{t('packageCard.duration')}</dt>
                    <dd className="pkg-card-meta-value">
                        {t('packageCard.days', { count: duration_days })}
                        {duration_nights ? ` / ${t('packageCard.nights', { count: duration_nights })}` : ''}
                    </dd>

                    {visibleDestinations.length > 0 && (
                        <>
                            <dt className="pkg-card-meta-label">{t('packageCard.destinations')}</dt>
                            <dd className="pkg-card-meta-value">
                                {visibleDestinations.join(t('common.listSeparator'))}
                                {moreCount > 0 && (
                                    <span className="pkg-meta-more">
                                        {t('packageCard.moreCount', { count: moreCount })}
                                    </span>
                                )}
                            </dd>
                        </>
                    )}
                </dl>
            </div>

            {/* ========== PRICE COLUMN ========== */}
            <div className="pkg-card-price-col">
                {/* Pricing */}
                <div className="pkg-card-price-block">
                    <div className="pkg-card-price-amount">
                        {formatCurrency(base_price)}
                        <span className="pkg-card-price-per"> {t('packageCard.perPerson')}</span>
                    </div>
                </div>

                {/* CTA */}
                <div className="pkg-card-actions">
                    <Link to={`/packages/${id}`} className="pkg-btn-view">
                        {t('packageCard.viewTour')}
                    </Link>
                </div>
            </div>
        </article>
    );
}
