import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN =
  'pk.eyJ1IjoiYmFzb29vbSIsImEiOiJjbWp5bmQwNzIxaGt0M2VzOWhnbGQwbzhvIn0.B__V-cVYI0fJZ6Fc9YtD-w';

interface RoutePoint {
  latitude: number;
  longitude: number;
  destination_order: number;
  name: string;
}

interface RouteMapThumbnailProps {
  routes: RoutePoint[];
}

/**
 * Lightweight, non-interactive Mapbox GL JS map thumbnail for PackageCard.
 * Renders a route line + hollow circle waypoint markers via native map layers.
 */
export function RouteMapThumbnail({ routes }: RouteMapThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const sorted = [...routes].sort((a, b) => a.destination_order - b.destination_order);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || sorted.length === 0) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [sorted[0].longitude, sorted[0].latitude],
      zoom: 4,
      interactive: false,       // No pan/zoom/rotate
      attributionControl: false,
      fadeDuration: 0,
      preserveDrawingBuffer: true,
    });

    mapRef.current = map;

    map.on('load', () => {
      const coordinates = sorted.map((d) => [d.longitude, d.latitude]);

      // ---- GeoJSON source: route line ----
      map.addSource('route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      });

      // ---- GeoJSON source: intermediate waypoints only (exclude start/end) ----
      const intermediatePoints = sorted.length > 2 ? sorted.slice(1, -1) : [];
      map.addSource('waypoints-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: intermediatePoints.map((pt) => ({
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'Point' as const,
              coordinates: [pt.longitude, pt.latitude],
            },
          })),
        },
      });

      // ---- Route line layer ----
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#2196F3',
          'line-width': 2.5,
        },
      });

      // ---- Hollow circle waypoints (intermediate stops only) ----
      map.addLayer({
        id: 'route-waypoints',
        type: 'circle',
        source: 'waypoints-source',
        paint: {
          'circle-color': '#ffffff',
          'circle-radius': 5,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#2196F3',
        },
      });

      // ---- Small flag markers for start & end ----
      const flagSvg = (color: string) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16">` +
        `<line x1="2" y1="1" x2="2" y2="15" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>` +
        `<path d="M3 1.5 L12 4.5 L3 7.5Z" fill="${color}" opacity="0.9"/>` +
        `</svg>`;

      const createFlagMarker = (pt: RoutePoint, color: string) => {
        const el = document.createElement('div');
        el.innerHTML = flagSvg(color);
        el.style.cursor = 'default';
        new mapboxgl.Marker({ element: el, anchor: 'bottom-left' })
          .setLngLat([pt.longitude, pt.latitude])
          .addTo(map);
      };

      // Green flag at start
      createFlagMarker(sorted[0], '#22c55e');
      // Red flag at end
      if (sorted.length > 1) {
        createFlagMarker(sorted[sorted.length - 1], '#ef4444');
      }

      // ---- Fit bounds with generous padding ----
      const bounds = new mapboxgl.LngLatBounds();
      sorted.forEach((d) => bounds.extend([d.longitude, d.latitude]));
      map.fitBounds(bounds, {
        padding: { top: 22, right: 55, bottom: 16, left: 16 },
        maxZoom: 9,
        duration: 0,
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
