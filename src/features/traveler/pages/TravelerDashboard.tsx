import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  Heart,
  Star,
  MapPin,
  Calendar,
  TrendingUp,
  Clock
} from "lucide-react";

export default function TravelerDashboard() {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();

  // Fetch traveler's bookings from Supabase
  const { data: bookings = [] } = useQuery({
    queryKey: ['traveler-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('package_bookings')
        .select(`
          *,
          packages (
            title,
            destination,
            duration_days
          )
        `)
        .eq('traveler_id', user.id)
        .order('booking_date', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get stats
  const upcomingBookingsCount = bookings.filter(b =>
    b.status === 'confirmed' || b.status === 'pending'
  ).length;

  const getStatusTranslation = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed": return t('travelerDashboard.confirmed');
      case "pending": return t('travelerDashboard.pending');
      case "completed": return t('travelerDashboard.completed');
      case "cancelled": return t('travelerDashboard.cancelled');
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed": return "default" as const;
      case "pending": return "secondary" as const;
      case "completed": return "outline" as const;
      case "cancelled": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  const userName = profile?.first_name || t('common.traveler');

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{t('travelerDashboard.welcomeBack')}, {userName}!</h1>
        <p className="text-blue-100 mb-4">{t('travelerDashboard.readyForAdventure')}</p>
        <Link to="/">
          <Button className="bg-white text-blue-600 hover:bg-gray-100">
            {t('travelerDashboard.exploreNewTours')}
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('travelerDashboard.activeBookings')}</p>
                <p className="text-2xl font-bold">{upcomingBookingsCount}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('travelerDashboard.wishlistItems')}</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Heart className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('travelerDashboard.reviewsGiven')}</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('travelerDashboard.countriesVisited')}</p>
                <p className="text-2xl font-bold">{new Set(bookings.map(b => b.packages?.destination)).size}</p>
              </div>
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t('travelerDashboard.upcomingTrips')}
            </CardTitle>
            <Link to="/traveler/dashboard/bookings">
              <Button variant="outline" size="sm">{t('common.viewAll')}</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {bookings.length > 0 ? (
              bookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{booking.packages?.title || t('common.package')}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(booking.booking_date).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(booking.status || 'pending')}>
                    {getStatusTranslation(booking.status || 'pending')}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('travelerDashboard.noBookingsYet')}</p>
                <Link to="/">
                  <Button variant="link" className="mt-2">{t('travelerDashboard.browseTours')}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Viewed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('travelerDashboard.recentlyViewed')}
            </CardTitle>
            <Link to="/traveler/dashboard/wishlist">
              <Button variant="outline" size="sm">{t('travelerDashboard.viewWishlist')}</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('travelerDashboard.noRecentlyViewed')}</p>
              <Link to="/">
                <Button variant="link" className="mt-2">{t('travelerDashboard.browseTours')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
