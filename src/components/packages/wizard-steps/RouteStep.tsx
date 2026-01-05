import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Route, Info } from 'lucide-react';
import { MapboxMap } from './route/MapboxMap';
import { DestinationSearch } from './route/DestinationSearch';
import { DestinationsList } from './route/DestinationsList';
import { RouteData, RouteDestination, defaultRouteData } from './route/types';

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
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=pk.eyJ1IjoiYmFzb29vbSIsImEiOiJjbWp5bmQwNzIxaGt0M2VzOWhnbGQwbzhvIn0.B__V-cVYI0fJZ6Fc9YtD-w&types=place,locality,region&limit=1`)
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
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
            <Route className="h-5 w-5 text-primary" />
            {t('packageWizard.tourRoute', 'Tour Route')}
          </CardTitle>
          <CardDescription className={isRTL ? 'text-right' : 'text-left'}>
            {t('packageWizard.tourRouteDesc', 'Define the destinations and route for your tour package')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div>
            <Label className={`mb-2 block ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('packageWizard.addDestination', 'Add Destination')}
            </Label>
            <DestinationSearch 
              onSelect={addDestination} 
              isRTL={isRTL} 
            />
          </div>

          {/* Map */}
          <div>
            <Label className={`mb-2 block ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('packageWizard.routeMap', 'Route Map')}
            </Label>
            <MapboxMap
              destinations={destinations}
              onMapClick={handleMapClick}
              isRTL={isRTL}
            />
            <p className={`text-sm text-muted-foreground mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('packageWizard.clickMapToAdd', 'Click on the map to add a destination')}
            </p>
          </div>

          {/* Stats */}
          {destinations.length > 0 && (
            <div className={`flex gap-4 p-4 bg-muted rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">{destinations.length}</span>
                <span className="text-muted-foreground">
                  {t('packageWizard.destinations', 'destinations')}
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="font-medium">{totalDays}</span>
                <span className="text-muted-foreground">
                  {t('packageWizard.totalDays', 'total days')}
                </span>
              </div>
            </div>
          )}

          {/* Destinations List */}
          <div>
            <Label className={`mb-3 block ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('packageWizard.destinationsList', 'Destinations')}
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
            <AlertDescription className={isRTL ? 'text-right' : 'text-left'}>
              {t('packageWizard.routeInfo', 'Drag destinations to reorder. Set days spent at each location to help travelers understand the tour flow.')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
