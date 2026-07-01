import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Map, Info } from 'lucide-react';
import type { PackageWithMedia } from '../hooks/usePublishedPackages';
import { RouteMapThumbnail } from './RouteMapThumbnail';

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
    const {
        id,
        title,
        destination,
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
        : destination?.split(',').map((d) => d.trim()) ?? [];
    const visibleDestinations = destinationList.slice(0, 5);
    const moreCount = Math.max(0, destinationList.length - 5);

    // Badge label
    const badgeLabel = category
        ? category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')
        : 'Explorer';

    // Simulated review data (in a real app, from joined query)
    const reviewCount = Math.floor(Math.random() * 120 + 10);
    const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
    const reviewerNames = ['Rosalina', 'Marco', 'Elena', 'Omar', 'Layla', 'Ahmed'];
    const months = ['January', 'February', 'March', 'October', 'November', 'December'];
    const reviewerName = reviewerNames[Math.floor(Math.random() * reviewerNames.length)];
    const travelMonth = months[Math.floor(Math.random() * months.length)];
    const quotes = [
        '"The itinerary was very good."',
        '"An unforgettable journey with stunning views."',
        '"Perfectly organized from start to finish."',
        '"Our guide was exceptional and knowledgeable."',
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    // Regions from destination
    const regions = destination?.split(',').slice(0, 2).map(d => d.trim()).join(', ') || destination;

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
                        <span>View Map</span>
                    </div>
                </Link>

                {/* Wishlist heart */}
                {onToggleWishlist && (
                    <button
                        className="pkg-card-wishlist"
                        onClick={() => onToggleWishlist(id)}
                        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
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
                            Best Seller
                        </span>
                    )}
                    <span className="pkg-badge-category">{badgeLabel}</span>
                </div>

                {/* Title */}
                <h3 className="pkg-card-title">
                    <Link to={`/packages/${id}`}>
                        {title} {duration_days} days
                    </Link>
                </h3>

                {/* Rating */}
                <div className="pkg-card-rating">
                    <span className="pkg-card-rating-score">{rating}</span>
                    <Star size={14} className="pkg-card-rating-star" fill="currentColor" />
                    <a href="#reviews" className="pkg-card-rating-count">
                        ({reviewCount} traveler reviews)
                    </a>
                </div>

                {/* Quote with accent border */}
                <div className="pkg-card-quote">
                    <p className="pkg-card-quote-text">{quote}</p>
                    <span className="pkg-card-quote-author">{reviewerName}, traveled in {travelMonth}</span>
                </div>

                {/* Details Grid */}
                <dl className="pkg-card-meta-grid">
                    <dt className="pkg-card-meta-label">Duration</dt>
                    <dd className="pkg-card-meta-value">
                        {duration_days} days{duration_nights ? ` / ${duration_nights} nights` : ''}
                    </dd>

                    <dt className="pkg-card-meta-label">Destinations</dt>
                    <dd className="pkg-card-meta-value">
                        {visibleDestinations.join(', ')}
                        {moreCount > 0 && (
                            <a href="#destinations" className="pkg-meta-more">, +{moreCount} more</a>
                        )}
                    </dd>

                    <dt className="pkg-card-meta-label">Age Range</dt>
                    <dd className="pkg-card-meta-value">All Ages Welcome</dd>

                    <dt className="pkg-card-meta-label">Regions</dt>
                    <dd className="pkg-card-meta-value">{regions}</dd>

                    <dt className="pkg-card-meta-label">Operated in</dt>
                    <dd className="pkg-card-meta-value">
                        English, Arabic
                    </dd>

                    {agency_name && (
                        <>
                            <dt className="pkg-card-meta-label">Operator</dt>
                            <dd className="pkg-card-meta-value">
                                {agency_name}
                                <span className="pkg-operator-badge">
                                    <span className="pkg-operator-dot" />
                                    Gold
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
                        <span className="pkg-card-discount">{discountPercent}% Off</span>
                    )}
                </div>

                {/* Pricing */}
                <div className="pkg-card-price-block">
                    {hasDiscount && (
                        <div className="pkg-card-price-from">
                            From <s>${originalPrice.toLocaleString()}</s>
                        </div>
                    )}
                    <div className="pkg-card-price-amount">
                        US${base_price.toLocaleString()}
                        <span className="pkg-card-price-per"> per person</span>
                    </div>
                    <div className="pkg-card-price-note">
                        <Info size={12} className="pkg-card-price-note-icon" />
                        Price based on Private Double Room
                    </div>
                </div>

                {/* CTA buttons */}
                <div className="pkg-card-actions">
                    <Link to={`/packages/${id}`} className="pkg-btn-view">
                        View tour
                    </Link>
                    <button className="pkg-btn-brochure" type="button">
                        Download Brochure
                    </button>
                </div>
            </div>
        </article>
    );
}
