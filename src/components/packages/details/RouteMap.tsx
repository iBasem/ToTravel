import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmFzb29vbSIsImEiOiJjbWp5bmQwNzIxaGt0M2VzOWhnbGQwbzhvIn0.B__V-cVYI0fJZ6Fc9YtD-w';

interface RouteDestination {
  id: string;
  name: string;
  name_ar: string | null;
  latitude: number;
  longitude: number;
  destination_order: number;
  destination_type: string;
  days_spent: number | null;
}

interface RouteMapProps {
  routes: RouteDestination[];
}

export function RouteMap({ routes }: RouteMapProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const sortedRoutes = [...routes].sort((a, b) => a.destination_order - b.destination_order);

  useEffect(() => {
    if (!mapContainer.current || map.current || sortedRoutes.length === 0) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [sortedRoutes[0].longitude, sortedRoutes[0].latitude],
      zoom: 5,
      attributionControl: false
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      isRTL ? 'top-left' : 'top-right'
    );

    map.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-left'
    );

    map.current.on('load', () => {
      setMapLoaded(true);

      // Add markers
      sortedRoutes.forEach((dest, index) => {
        const el = document.createElement('div');
        el.className = 'route-marker';
        el.innerHTML = `
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
            dest.destination_type === 'origin' 
              ? 'bg-green-500' 
              : dest.destination_type === 'destination' 
                ? 'bg-red-500' 
                : 'bg-blue-500'
          }">
            ${index + 1}
          </div>
        `;

        const displayName = isRTL && dest.name_ar ? dest.name_ar : dest.name;

        new mapboxgl.Marker({ element: el })
          .setLngLat([dest.longitude, dest.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="p-2">
                <strong>${displayName}</strong>
                ${dest.days_spent ? `<br/><span class="text-sm text-gray-600">${dest.days_spent} ${t('packageDetails.days')}</span>` : ''}
              </div>`
            )
          )
          .addTo(map.current!);
      });

      // Draw route line
      if (sortedRoutes.length > 1) {
        const coordinates = sortedRoutes.map(d => [d.longitude, d.latitude]);

        map.current!.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates
            }
          }
        });

        map.current!.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 3,
            'line-dasharray': [2, 1]
          }
        });
      }

      // Fit bounds to show all markers
      const bounds = new mapboxgl.LngLatBounds();
      sortedRoutes.forEach(dest => {
        bounds.extend([dest.longitude, dest.latitude]);
      });
      map.current!.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [sortedRoutes, isRTL, t]);

  if (sortedRoutes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Navigation className="w-5 h-5 text-primary" />
          {t('packageDetails.tourRoute')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full h-[300px] rounded-lg overflow-hidden border border-border">
          <div ref={mapContainer} className="absolute inset-0" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}
        </div>

        {/* Destinations list */}
        <div className="space-y-2">
          {sortedRoutes.map((dest, index) => {
            const displayName = isRTL && dest.name_ar ? dest.name_ar : dest.name;
            return (
              <div 
                key={dest.id} 
                className={`flex items-center gap-3 p-2 rounded-lg bg-muted/50 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  dest.destination_type === 'origin' 
                    ? 'bg-green-500' 
                    : dest.destination_type === 'destination' 
                      ? 'bg-red-500' 
                      : 'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <span className="font-medium">{displayName}</span>
                  {dest.days_spent && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({dest.days_spent} {t('packageDetails.days')})
                    </span>
                  )}
                </div>
                <MapPin className={`w-4 h-4 text-muted-foreground ${
                  dest.destination_type === 'origin' 
                    ? 'text-green-500' 
                    : dest.destination_type === 'destination' 
                      ? 'text-red-500' 
                      : 'text-blue-500'
                }`} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
