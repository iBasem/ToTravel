
import { useParams } from "react-router-dom";
import { PackageHeader } from "@/components/packages/details/PackageHeader";
import { ImageGallery } from "@/components/packages/details/ImageGallery";
import { DetailedItinerary } from "@/components/packages/details/DetailedItinerary";
import { BookingSidebar } from "@/components/packages/details/BookingSidebar";
import { RouteMap } from "@/components/packages/details/RouteMap";
import { HeaderSection } from "@/components/home/HeaderSection";
import { FooterSection } from "@/components/home/FooterSection";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { usePackageDetails } from "@/hooks/usePackageDetails";

export default function PackageDetails() {
  const { id } = useParams<{ id: string }>();
  const { packageDetails, loading, error } = usePackageDetails(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderSection />
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
        <FooterSection />
      </div>
    );
  }

  if (error || !packageDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderSection />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <EmptyState
            icon="package"
            title="Package not found"
            description="The package you're looking for doesn't exist or has been removed."
          />
        </div>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderSection />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <PackageHeader packageData={packageDetails} />
            
            {packageDetails.package_media && packageDetails.package_media.length > 0 && (
              <ImageGallery images={packageDetails.package_media} />
            )}

            {packageDetails.package_routes && packageDetails.package_routes.length > 0 && (
              <RouteMap routes={packageDetails.package_routes} />
            )}
            
            {packageDetails.itineraries && packageDetails.itineraries.length > 0 && (
              <DetailedItinerary itinerary={packageDetails.itineraries} />
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <BookingSidebar packageData={packageDetails} />
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
