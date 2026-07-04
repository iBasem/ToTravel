import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Star, Map, Info } from 'lucide-react';
import type { PackageWithMedia } from '../hooks/usePublishedPackages';
import { RouteMapThumbnail } from './RouteMapThumbnail';
import { formatCurrency, formatDate, formatNumber } from '@/lib/formatters';
import { localizedText } from '@/lib/localized';

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
        difficulty_level,
        featured,
        package_media,
        package_routes,
        destinations,
        agency_name,
    } = packageData;

    // Localized display fields (fall back to base columns outside Arabic UI)
    const title = localizedText(packageData, 'title');
    const destination = localizedText(packageData, 'destination');

    // Primary image
    const primaryMedia = package_media?.find((m) => m.is_primary) ?? package_media?.[0];
    const imageUrl = primaryMedia?.file_path ?? '/placeholder-tour.jpg';

    // Whether we have route data for the GL map

    // Discount logic
    const hasDiscount = featured;
    const discountPercent = hasDiscount ? 15 : 0;
    const originalPrice = hasDiscount
        ? Math.round(base_price / (1 - discountPercent / 100))
        : base_price;

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

    // Simulated review data (in a real app, from joined query)
    const reviewCount = Math.floor(Math.random() * 120 + 10);
    const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
    const reviewerNames = ['Rosalina', 'Marco', 'Elena', 'Omar', 'Layla', 'Ahmed'];
    const monthIndexes = [0, 1, 2, 9, 10, 11];
    const reviewerName = reviewerNames[Math.floor(Math.random() * reviewerNames.length)];
    const travelMonth = formatDate(
        new Date(2026, monthIndexes[Math.floor(Math.random() * monthIndexes.length)], 1),
        'MMMM'
    );
    const quote = t(`packageCard.quotes.${Math.floor(Math.random() * 4)}`);

    // Regions from destination
    const regions = destination.split(',').slice(0, 2).map(d => d.trim()).join(', ') || destination;

    return (
        <article className="pkg-card">
            {/* ========== IMAGE COLUMN ========== */}
            <div className="pkg-card-image-col">
                <Link to={`/packages/${id}`} className="pkg-card-image-link">
                    <img src={imageUrl} alt={title} className="pkg-card-image" loading="lazy" />
                </Link>

                {/* Map thumbnail — Mapbox GL JS with circle-layer waypoints */}
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
                        className="pkg-card-wishlist"
                        onClick={() => onToggleWishlist(id)}
                        aria-label={isInWishlist ? t('packageCard.removeFromWishlist') : t('packageCard.addToWishlist')}
                    >
                        <Heart
                            size={18}
                            fill={isInWishlist ? '#e74c3c' : 'none'}
                            stroke={isInWishlist ? '#e74c3c' : '#666'}
                        />
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

                {/* Rating */}
                <div className="pkg-card-rating">
                    <span className="pkg-card-rating-score">{rating}</span>
                    <Star size={14} className="pkg-card-rating-star" fill="currentColor" />
                    <a href="#reviews" className="pkg-card-rating-count">
                        ({t('packageCard.travelerReviews', { count: reviewCount })})
                    </a>
                </div>

                {/* Quote with accent border */}
                <div className="pkg-card-quote">
                    <p className="pkg-card-quote-text">{quote}</p>
                    <span className="pkg-card-quote-author">
                        {t('packageCard.traveledIn', { name: reviewerName, month: travelMonth })}
                    </span>
                </div>

                {/* Details Grid */}
                <dl className="pkg-card-meta-grid">
                    <dt className="pkg-card-meta-label">{t('packageCard.duration')}</dt>
                    <dd className="pkg-card-meta-value">
                        {t('packageCard.days', { count: duration_days })}
                        {duration_nights ? ` / ${t('packageCard.nights', { count: duration_nights })}` : ''}
                    </dd>

                    <dt className="pkg-card-meta-label">{t('packageCard.destinations')}</dt>
                    <dd className="pkg-card-meta-value">
                        {visibleDestinations.join(t('common.listSeparator'))}
                        {moreCount > 0 && (
                            <a href="#destinations" className="pkg-meta-more">
                                {t('packageCard.moreCount', { count: moreCount })}
                            </a>
                        )}
                    </dd>

                    <dt className="pkg-card-meta-label">{t('packageCard.ageRange')}</dt>
                    <dd className="pkg-card-meta-value">{t('packageCard.allAges')}</dd>

                    <dt className="pkg-card-meta-label">{t('packageCard.regions')}</dt>
                    <dd className="pkg-card-meta-value">{regions}</dd>

                    <dt className="pkg-card-meta-label">{t('packageCard.operatedIn')}</dt>
                    <dd className="pkg-card-meta-value">
                        {t('packageCard.languages')}
                    </dd>

                    {agency_name && (
                        <>
                            <dt className="pkg-card-meta-label">{t('packageCard.operator')}</dt>
                            <dd className="pkg-card-meta-value">
                                {agency_name}
                                <span className="pkg-operator-badge">
                                    <span className="pkg-operator-dot" />
                                    {t('packageCard.goldTier')}
                                </span>
                            </dd>
                        </>
                    )}
                </dl>
            </div>

            {/* ========== PRICE COLUMN ========== */}
            <div className="pkg-card-price-col">
                {/* Discount badge */}
                <div className="pkg-card-price-top">
                    {hasDiscount && discountPercent > 0 && (
                        <span className="pkg-card-discount">
                            {t('packageCard.percentOff', { percent: formatNumber(discountPercent) })}
                        </span>
                    )}
                </div>

                {/* Pricing */}
                <div className="pkg-card-price-block">
                    {hasDiscount && (
                        <div className="pkg-card-price-from">
                            {t('packageCard.from')} <s>{formatCurrency(originalPrice)}</s>
                        </div>
                    )}
                    <div className="pkg-card-price-amount">
                        {formatCurrency(base_price)}
                        <span className="pkg-card-price-per"> {t('packageCard.perPerson')}</span>
                    </div>
                    <div className="pkg-card-price-note">
                        <Info size={12} className="pkg-card-price-note-icon" />
                        {t('packageCard.priceNote')}
                    </div>
                </div>

                {/* CTA buttons */}
                <div className="pkg-card-actions">
                    <Link to={`/packages/${id}`} className="pkg-btn-view">
                        {t('packageCard.viewTour')}
                    </Link>
                    <button className="pkg-btn-brochure" type="button">
                        {t('packageCard.downloadBrochure')}
                    </button>
                </div>
            </div>
        </article>
    );
}
