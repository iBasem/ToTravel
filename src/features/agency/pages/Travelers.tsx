import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Search, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAgencyTravelers } from "@/features/agency/hooks/useAgencyTravelers";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";

type SortKey = 'recent' | 'bookings' | 'name';

export default function Travelers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { travelers, loading, error } = useAgencyTravelers();

  // Filter travelers by search term, then sort
  const filteredTravelers = travelers
    .filter(traveler =>
      traveler.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (traveler.email && traveler.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'bookings':
          return b.totalBookings - a.totalBookings;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return (b.lastTripDate || '').localeCompare(a.lastTripDate || '');
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{t('common.error')}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {t('agencyDashboard.travelersManagement')}
        </h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
          <Input
            placeholder={t('agencyDashboard.searchTravelers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortKey)}>
          <SelectTrigger className="w-full sm:w-52" aria-label={t('agencyDashboard.sortBy', 'Sort by')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">{t('agencyDashboard.sortRecentTrip', 'Most recent trip')}</SelectItem>
            <SelectItem value="bookings">{t('agencyDashboard.sortMostBookings', 'Most bookings')}</SelectItem>
            <SelectItem value="name">{t('agencyDashboard.sortByName', 'Name (A–Z)')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTravelers.length === 0 ? (
        <EmptyState
          icon="users"
          title={t('agencyDashboard.noTravelersYet', { defaultValue: 'No Travelers Yet' })}
          description={t('agencyDashboard.travelersWillAppear', { defaultValue: 'Travelers who book your packages will appear here.' })}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('agencyDashboard.travelerDirectory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTravelers.map((traveler) => (
                <div key={traveler.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-medium">
                          {traveler.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{traveler.name}</p>
                        <p className="text-sm text-muted-foreground">{traveler.email}</p>
                        {traveler.phone && (
                          <p className="text-sm text-muted-foreground" dir="ltr">{traveler.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-end">
                      <p className="font-medium">{traveler.totalBookings} {t('agencyDashboard.bookings')}</p>
                      {traveler.lastTrip && (
                        <p className="text-sm text-muted-foreground">{traveler.lastTrip}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1.5"
                      onClick={() => navigate(`/travel_agency/messages?to=${traveler.id}`)}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {t('agencyDashboard.message')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
