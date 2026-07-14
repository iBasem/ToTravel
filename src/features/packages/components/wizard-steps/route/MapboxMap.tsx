import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTranslation } from 'react-i18next';
import { RouteDestination } from './types';
import { applyMapLanguage, ensureMapboxRTLTextPlugin } from '@/lib/mapbox-rtl';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface MapboxMapProps {
  destinations: RouteDestination[];
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  isRTL?: boolean;
}

export function MapboxMap({ destinations, onMapClick, isRTL = false }: MapboxMapProps) {
  const { i18n } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    ensureMapboxRTLTextPlugin();

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [45, 25], // Default to Middle East region
      zoom: 4,
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
      if (map.current) applyMapLanguage(map.current);
      setMapLoaded(true);
    });

    map.current.on('click', (e) => {
      if (onMapClick) {
        onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [isRTL]);

  // Update markers when destinations change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    destinations.forEach((dest, index) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${dest.type === 'origin'
          ? 'bg-green-500'
          : dest.type === 'destination'
            ? 'bg-red-500'
            : 'bg-teal-600'
        }">
          ${index + 1}
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([dest.longitude, dest.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2">
              <strong>${dest.name}</strong>
              <br/>
              <span class="text-sm text-gray-600">${dest.daysSpent} ${i18n.language === 'ar' ? 'أيام' : 'day(s)'}</span>
            </div>`
          )
        )
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Draw route line if we have multiple destinations
    if (destinations.length > 1) {
      const coordinates = destinations.map(d => [d.longitude, d.latitude]);

      // Remove existing route layer/source if exists
      if (map.current.getLayer('route')) {
        map.current.removeLayer('route');
      }
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }

      map.current.addSource('route', {
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

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#0d9488',
          'line-width': 3,
          'line-dasharray': [2, 1]
        }
      });
    } else {
      // Remove route if less than 2 destinations
      if (map.current.getLayer('route')) {
        map.current.removeLayer('route');
      }
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }
    }

    // Fit bounds to show all markers
    if (destinations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      destinations.forEach(dest => {
        bounds.extend([dest.longitude, dest.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }
  }, [destinations, mapLoaded]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border border-border">
      {/* h-full, not absolute: mapbox-gl.css loads after Tailwind and its
          .mapboxgl-map { position: relative } overrides .absolute, collapsing
          the container to 0px height. */}
      <div ref={mapContainer} className="h-full w-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
