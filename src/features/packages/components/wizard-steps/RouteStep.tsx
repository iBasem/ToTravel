import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Label } from '@/ui/label';
import { Alert, AlertDescription } from '@/ui/alert';
import { MapPin, Route, Info } from 'lucide-react';
import { MapboxMap } from './route/MapboxMap';
import { DestinationSearch } from './route/DestinationSearch';
import { DestinationsList } from './route/DestinationsList';
import { RouteData, RouteDestination, defaultRouteData } from './route/types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface RouteStepProps {
  data: RouteData;
  onUpdate: (data: RouteData) => void;
}

export function RouteStep({ data, onUpdate }: RouteStepProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Initialize with default data if not provided
  const routeData = data || defaultRouteData;
  const destinations = routeData.destinations || [];

  const addDestination = useCallback((result: { name: string; latitude: number; longitude: number; id?: string }) => {
    const newDestination: RouteDestination = {
      id: crypto.randomUUID(),
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      order: destinations.length,
      type: destinations.length === 0 ? 'origin' : 'stop',
      daysSpent: 1,
      placeId: result.id
    };

    onUpdate({
      ...routeData,
      destinations: [...destinations, newDestination]
    });
  }, [destinations, routeData, onUpdate]);

  const handleMapClick = useCallback((lngLat: { lng: number; lat: number }) => {
    // Reverse geocode to get place name
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,region&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          addDestination({
            name: feature.text || feature.place_name,
            latitude: lngLat.lat,
            longitude: lngLat.lng,
            id: feature.id
          });
        } else {
          // If no place found, use coordinates as name
          addDestination({
            name: `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`,
            latitude: lngLat.lat,
            longitude: lngLat.lng
          });
        }
      })
      .catch(() => {
        addDestination({
          name: `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`,
          latitude: lngLat.lat,
          longitude: lngLat.lng
        });
      });
  }, [addDestination]);

  const handleReorder = useCallback((reorderedDestinations: RouteDestination[]) => {
    onUpdate({
      ...routeData,
      destinations: reorderedDestinations
    });
  }, [routeData, onUpdate]);

  const handleUpdateDestination = useCallback((id: string, updates: Partial<RouteDestination>) => {
    onUpdate({
      ...routeData,
      destinations: destinations.map(d =>
        d.id === id ? { ...d, ...updates } : d
      )
    });
  }, [destinations, routeData, onUpdate]);

  const handleRemoveDestination = useCallback((id: string) => {
    const updated = destinations
      .filter(d => d.id !== id)
      .map((d, i) => ({ ...d, order: i }));

    onUpdate({
      ...routeData,
      destinations: updated
    });
  }, [destinations, routeData, onUpdate]);

  const totalDays = destinations.reduce((sum, d) => sum + d.daysSpent, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-start">
            <Route className="h-5 w-5 text-primary" />
            {t('packageWizard.tourRoute')}
          </CardTitle>
          <CardDescription className="text-start">
            {t('packageWizard.tourRouteDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div>
            <Label className="mb-2 block text-start">
              {t('packageWizard.addDestination')}
            </Label>
            <DestinationSearch
              onSelect={addDestination}
              isRTL={isRTL}
            />
          </div>

          {/* Map */}
          <div>
            <Label className="mb-2 block text-start">
              {t('packageWizard.routeMap')}
            </Label>
            <MapboxMap
              destinations={destinations}
              onMapClick={handleMapClick}
              isRTL={isRTL}
            />
            <p className="text-sm text-muted-foreground mt-2 text-start">
              {t('packageWizard.clickMapToAdd')}
            </p>
          </div>

          {/* Stats */}
          {destinations.length > 0 && (
            <div className="flex gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">{destinations.length}</span>
                <span className="text-muted-foreground">
                  {t('packageWizard.destinations')}
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="font-medium">{totalDays}</span>
                <span className="text-muted-foreground">
                  {t('packageWizard.totalDays')}
                </span>
              </div>
            </div>
          )}

          {/* Destinations List */}
          <div>
            <Label className="mb-3 block text-start">
              {t('packageWizard.destinationsList')}
            </Label>
            <DestinationsList
              destinations={destinations}
              onReorder={handleReorder}
              onUpdate={handleUpdateDestination}
              onRemove={handleRemoveDestination}
              isRTL={isRTL}
            />
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-start">
              {t('packageWizard.routeInfo')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
