import { useState } from "react";
import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Download,
  MessageSquare,
  Star
} from "lucide-react";
import { useBookings } from "@/features/bookings/hooks/useBookings";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/formatters";

import { useNavigate } from "react-router-dom";

export default function TravelerBookings() {
  const [activeTab, setActiveTab] = useState("all");
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { bookings, loading, error } = useBookings();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-red-500">
        {t('errors.somethingWentWrong', 'Failed to load bookings. Please try again later.')}
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('travelerDashboard.myBookings')}</h1>
        <EmptyState
          icon="calendar"
          title={t('travelerDashboard.noBookingsFound', 'No bookings found')}
          description={t('travelerDashboard.noBookingsDesc', "You haven't made any bookings yet. Browse our packages to find your next adventure!")}
          action={{
            label: t('travelerDashboard.explorePackages', 'Explore Packages'),
            onClick: () => navigate("/packages")
          }}
        />
      </div>
    );
  }

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") return booking.status === "confirmed" || booking.status === "pending";
    if (activeTab === "completed") return booking.status === "completed";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusTranslation = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return t('travelerDashboard.confirmed');
      case "pending": return t('travelerDashboard.pending');
      case "completed": return t('travelerDashboard.completed');
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('travelerDashboard.myBookings')}</h1>
        <p className="text-gray-600">{t('travelerDashboard.manageBookings')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">{t('travelerDashboard.allBookings')}</TabsTrigger>
          <TabsTrigger value="upcoming">{t('travelerDashboard.upcoming')}</TabsTrigger>
          <TabsTrigger value="completed">{t('travelerDashboard.completed')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t('common.noItemsFound', { item: activeTab })}
            </div>
          ) : (
            filteredBookings.map((booking: any) => {
              const packageData = booking.packages;
              const imageUrl = packageData?.package_media?.[0]?.file_path || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop";

              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-64">
                        <img
                          src={imageUrl}
                          alt={packageData?.title || t('common.tourImage')}
                          className="w-full h-48 md:h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{packageData?.title || t('common.unknownPackage')}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 flex-wrap">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {packageData?.destination}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(booking.booking_date, 'MMM dd, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {packageData?.duration_days} {t('common.days')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {booking.participants} {booking.participants === 1 ? t('booking.travelerSingular') : t('booking.travelerPlural')}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{t('travelerDashboard.bookingRef')}: {booking.id.slice(0, 8).toUpperCase()}</p>
                          </div>
                          <div className="text-end">
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusTranslation(booking.status)}
                            </Badge>
                            <p className="text-xl font-bold text-gray-900 mt-2 tabular-nums">{formatCurrency(booking.total_price)}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            {t('travelerDashboard.downloadVoucher')}
                          </Button>
                          <Button size="sm" variant="outline" className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            {t('travelerDashboard.contactSupport')}
                          </Button>
                          {booking.status === "completed" && (
                            <Button size="sm" variant="outline" className="flex items-center gap-2">
                              <Star className="w-4 h-4" />
                              {t('travelerDashboard.writeReview')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
