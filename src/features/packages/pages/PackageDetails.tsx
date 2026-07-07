import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Layout Components
import { HeaderSection } from "@/features/home/components/HeaderSection";
import { FooterSection } from "@/features/home/components/FooterSection";

// UI Components
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";

// Package Detail Components
import { HeroGallery } from "@/features/packages/components/details/HeroGallery";
import { TourHeader } from "@/features/packages/components/details/TourHeader";
import { BookingWidget } from "@/features/packages/components/details/BookingWidget";
import { RouteMap } from "@/features/packages/components/details/RouteMap";
import { DetailedItinerary } from "@/features/packages/components/details/DetailedItinerary";
import { WhatsIncluded } from "@/features/packages/components/details/WhatsIncluded";
import { OperatorInfo } from "@/features/packages/components/details/OperatorInfo";
import { AvailabilitySection } from "@/features/packages/components/details/AvailabilitySection";
import { ReviewsSection } from "@/features/reviews/components/ReviewsSection";
import { BookingModal } from "@/features/bookings/components/BookingModal";

// Hooks
import { usePackageDetails } from "@/features/packages/hooks/usePackageDetails";
import { useAvailability } from "@/features/packages/hooks/useAvailability";
import { useAuth } from "@/features/auth/context/AuthContext";

// Types
import type { Departure } from "@/features/packages/types";

import { Seo } from "@/lib/seo";
import { getPlatformCurrency } from "@/lib/formatters";
import { localizedText, pickLocalized } from "@/lib/localized";

export default function PackageDetails() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const { packageDetails, loading, error } = usePackageDetails(id);

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDeparture, setSelectedDeparture] = useState<Departure | null>(null);

  // Availability hook - only initialize when package data is available
  const {
    filteredDepartures,
    monthlyAvailability,
    selectedMonth,
    setSelectedMonth,
  } = useAvailability({
    packageId: id || '',
    availableFrom: packageDetails?.available_from || '',
    availableTo: packageDetails?.available_to || '',
    durationDays: packageDetails?.duration_days || 7,
    basePrice: packageDetails?.base_price || 0,
    maxParticipants: packageDetails?.max_participants || 20,
  });

  // Handle confirm dates from availability card
  const handleConfirmDates = (departure: Departure) => {
    if (!user) {
      navigate('/auth?type=traveler');
      return;
    }

    if (profile?.role !== 'traveler') {
      navigate('/auth?type=traveler');
      return;
    }

    setSelectedDeparture(departure);
    setShowBookingModal(true);
  };

  // Handle check availability click - scroll to section
  const handleCheckAvailability = () => {
    const section = document.getElementById('availability-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle month selection from sidebar
  const handleSelectMonth = (month: string) => {
    setSelectedMonth(month);
    // Scroll handled by BookingWidget
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderSection />
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
        <FooterSection />
      </div>
    );
  }

  // Error state
  if (error || !packageDetails) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderSection />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <EmptyState
            icon="package"
            title={t('errors.packageNotFound', 'Package not found')}
            description={t('errors.packageNotFoundDesc', "The package you're looking for doesn't exist or has been removed.")}
          />
        </div>
        <FooterSection />
      </div>
    );
  }

  // Localized traveler-facing fields (Arabic sibling columns with English fallback)
  const localizedTitle = localizedText(packageDetails, 'title');
  const localizedDescription = pickLocalized<string>(packageDetails, 'description');
  const localizedDestination = localizedText(packageDetails, 'destination');

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={localizedTitle}
        description={localizedDescription || undefined}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'TouristTrip',
            name: localizedTitle,
            description: localizedDescription || undefined,
            touristType: packageDetails.category || undefined,
            offers: {
              '@type': 'Offer',
              price: packageDetails.base_price,
              priceCurrency: getPlatformCurrency(),
              availability: 'https://schema.org/InStock',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: t('nav.home'), item: window.location.origin + '/' },
              { '@type': 'ListItem', position: 2, name: t('nav.packages'), item: window.location.origin + '/packages' },
              { '@type': 'ListItem', position: 3, name: localizedTitle },
            ],
          },
        ]}
      />
      <HeaderSection />

      {/* Main Content Container */}
      <div id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 2-Column Layout: 66% content, 33% sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero Gallery */}
            {packageDetails.package_media && packageDetails.package_media.length > 0 && (
              <HeroGallery
                images={packageDetails.package_media}
                title={localizedTitle}
                isBestSeller={packageDetails.featured}
              />
            )}

            {/* Tour Header - Title, Rating, Stats */}
            <TourHeader packageData={packageDetails} />

            {/* Interactive Route Map */}
            {packageDetails.package_routes && packageDetails.package_routes.length > 0 && (
              <RouteMap routes={packageDetails.package_routes} />
            )}

            {/* Detailed Itinerary (Accordion) */}
            {packageDetails.itineraries && packageDetails.itineraries.length > 0 && (
              <DetailedItinerary itinerary={packageDetails.itineraries} />
            )}

            {/* What's Included */}
            <WhatsIncluded
              inclusions={pickLocalized<string[]>(packageDetails, 'inclusions') || []}
              exclusions={pickLocalized<string[]>(packageDetails, 'exclusions') || []}
            />

            {/* Operator Info */}
            {packageDetails.travel_agencies && (
              <OperatorInfo
                agency={packageDetails.travel_agencies}
                rating={packageDetails.average_rating || 0}
                reviewCount={packageDetails.total_reviews || 0}
              />
            )}

            {/* Availability Section - Anchor Target */}
            <AvailabilitySection
              packageId={packageDetails.id}
              departures={filteredDepartures}
              monthlyAvailability={monthlyAvailability}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              onConfirmDates={handleConfirmDates}
              durationDays={packageDetails.duration_days}
            />

            {/* Reviews Section */}
            <div className="pt-6 border-t">
              <h2 className="text-2xl font-bold mb-6 text-start">
                {t('reviews.title', 'Reviews')}
              </h2>
              {id && <ReviewsSection packageId={id} />}
            </div>
          </div>

          {/* Right Column - Sticky Sidebar (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <BookingWidget
                packageData={{
                  id: packageDetails.id,
                  title: localizedTitle,
                  base_price: packageDetails.base_price,
                  available_from: packageDetails.available_from,
                  available_to: packageDetails.available_to,
                  duration_days: packageDetails.duration_days,
                  duration_nights: packageDetails.duration_nights,
                  max_participants: packageDetails.max_participants,
                  destination: localizedDestination,
                }}
                monthlyAvailability={monthlyAvailability}
                onSelectMonth={handleSelectMonth}
                onCheckAvailability={handleCheckAvailability}
              />
            </div>
          </div>
        </div>
      </div>

      <FooterSection />

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedDeparture(null);
        }}
        packageId={packageDetails.id}
        packageTitle={localizedTitle}
        basePrice={selectedDeparture?.discount_price || selectedDeparture?.price || packageDetails.base_price}
        maxParticipants={packageDetails.max_participants}
        departure={selectedDeparture}
      />
    </div>
  );
}
