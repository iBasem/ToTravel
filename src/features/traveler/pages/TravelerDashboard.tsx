import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { localizedText } from "@/lib/localized";
import { formatCurrency } from "@/lib/formatters";
import { getRecentlyViewedIds } from "@/features/packages/lib/recentlyViewed";
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

  // Next trips: soonest upcoming confirmed/pending bookings
  const { data: upcomingTrips = [] } = useQuery({
    queryKey: ['traveler-upcoming-trips', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('package_bookings')
        .select(`
          *,
          packages (
            title,
            title_ar,
            destination,
            destination_ar,
            duration_days
          )
        `)
        .eq('traveler_id', user.id)
        .in('status', ['confirmed', 'pending'])
        .gte('booking_date', new Date().toISOString().slice(0, 10))
        .order('booking_date', { ascending: true })
        .limit(3);

      if (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Stats computed across ALL bookings (not just the ones shown above)
  const { data: bookingStats = { active: 0, countries: 0 } } = useQuery({
    queryKey: ['traveler-booking-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { active: 0, countries: 0 };
      const { data, error } = await supabase
        .from('package_bookings')
        .select('status, packages ( destination )')
        .eq('traveler_id', user.id);
      if (error) {
        console.error('Error fetching booking stats:', error);
        return { active: 0, countries: 0 };
      }
      const rows = data ?? [];
      const active = rows.filter(b => b.status === 'confirmed' || b.status === 'pending').length;
      const countries = new Set(
        rows
          .map(b => (b.packages as { destination?: string } | null)?.destination)
          .filter(Boolean)
      ).size;
      return { active, countries };
    },
    enabled: !!user?.id,
  });

  // Wishlist and review counts via SQL aggregates (head-only count queries)
  const { data: wishlistCount = 0 } = useQuery({
    queryKey: ['traveler-wishlist-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('wishlist')
        .select('*', { count: 'exact', head: true })
        .eq('traveler_id', user.id);
      if (error) {
        console.error('Error counting wishlist:', error);
        return 0;
      }
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  const { data: reviewsCount = 0 } = useQuery({
    queryKey: ['traveler-reviews-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('traveler_id', user.id);
      if (error) {
        console.error('Error counting reviews:', error);
        return 0;
      }
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  // Recently viewed packages (ids tracked in localStorage, data fetched live)
  const recentlyViewedIds = getRecentlyViewedIds();
  const { data: recentlyViewed = [] } = useQuery({
    queryKey: ['traveler-recently-viewed', recentlyViewedIds.join(',')],
    queryFn: async () => {
      if (recentlyViewedIds.length === 0) return [];
      const { data, error } = await supabase
        .from('packages')
        .select('id, title, title_ar, destination, destination_ar, duration_days, base_price')
        .in('id', recentlyViewedIds)
        .eq('status', 'published');
      if (error) {
        console.error('Error fetching recently viewed packages:', error);
        return [];
      }
      // Preserve most-recently-viewed-first order
      const byId = new Map((data ?? []).map(p => [p.id, p]));
      return recentlyViewedIds.map(id => byId.get(id)).filter(Boolean).slice(0, 3);
    },
  });

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
      <div className="bg-gradient-to-r from-primary to-primary/85 rounded-xl p-6 text-primary-foreground">
        <h1 className="text-2xl font-bold mb-2">{t('travelerDashboard.welcomeBack')}, {userName}!</h1>
        <p className="text-primary-foreground/80 mb-4">{t('travelerDashboard.readyForAdventure')}</p>
        <Link to="/">
          <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
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
                <p className="text-2xl font-bold">{bookingStats.active}</p>
              </div>
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('travelerDashboard.wishlistItems')}</p>
                <p className="text-2xl font-bold">{wishlistCount}</p>
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
                <p className="text-2xl font-bold">{reviewsCount}</p>
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
                <p className="text-2xl font-bold">{bookingStats.countries}</p>
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
            {upcomingTrips.length > 0 ? (
              upcomingTrips.map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{localizedText(booking.packages, 'title') || t('common.package')}</h4>
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
            {recentlyViewed.length > 0 ? (
              recentlyViewed.map((pkg) => pkg && (
                <Link
                  key={pkg.id}
                  to={`/packages/${pkg.id}`}
                  className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{localizedText(pkg, 'title')}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {localizedText(pkg, 'destination')} · {pkg.duration_days} {t('common.days')}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums whitespace-nowrap">{formatCurrency(pkg.base_price)}</span>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('travelerDashboard.noRecentlyViewed')}</p>
                <Link to="/">
                  <Button variant="link" className="mt-2">{t('travelerDashboard.browseTours')}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
