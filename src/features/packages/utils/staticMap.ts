/**
 * Generates a Mapbox Static Images API URL for the PackageCard map thumbnail.
 *
 * TourRadar-inspired style:
 *   – Blue polyline route connecting destinations
 *   – Small hollow circle markers at each stop (drawn as tiny circle paths)
 *   – Center offset to avoid the top-right "View Map" button
 *
 * @see https://docs.mapbox.com/api/maps/static-images/
 */

const MAPBOX_TOKEN =
  'pk.eyJ1IjoiYmFzb29vbSIsImEiOiJjbWp5bmQwNzIxaGt0M2VzOWhnbGQwbzhvIn0.B__V-cVYI0fJZ6Fc9YtD-w';

interface RoutePoint {
  latitude: number;
  longitude: number;
  destination_order: number;
  name: string;
}

/* ---- Polyline encoding ---- */

function encodeSignedValue(val: number): string {
  let v = val < 0 ? ~(val << 1) : val << 1;
  let encoded = '';
  while (v >= 0x20) {
    encoded += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  encoded += String.fromCharCode(v + 63);
  return encoded;
}

function encodePolyline(coords: [number, number][]): string {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;
  for (const [lat, lng] of coords) {
    encoded += encodeSignedValue(Math.round((lat - prevLat) * 1e5));
    encoded += encodeSignedValue(Math.round((lng - prevLng) * 1e5));
    prevLat = lat;
    prevLng = lng;
  }
  return encoded;
}

/**
 * Generate polyline coordinates for a small circle around a point.
 * This renders as a hollow circle marker on the static map.
 */
function makeCircleCoords(
  lat: number,
  lng: number,
  zoom: number
): [number, number][] {
  // Radius in degrees — scale relative to zoom so circles appear consistent
  // At zoom ~5 we want ~0.15 degree, at zoom ~9 we want ~0.02 degree
  const baseDeg = 0.6 / Math.pow(2, zoom - 3);
  const points = 12; // polygon sides for smooth circle
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    coords.push([
      lat + baseDeg * Math.sin(angle),
      lng + (baseDeg / Math.cos((lat * Math.PI) / 180)) * Math.cos(angle),
    ]);
  }
  return coords;
}

/* ---- Zoom calculation ---- */

function calculateZoom(sorted: RoutePoint[], w: number, h: number): number {
  if (sorted.length <= 1) return 9;
  const lats = sorted.map((p) => p.latitude);
  const lngs = sorted.map((p) => p.longitude);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  const WORLD = 256;
  const pad = 0.35;
  const eW = w * (1 - 2 * pad);
  const eH = h * (1 - 2 * pad);
  const zLng = lngSpan > 0 ? Math.log2((eW / WORLD) * (360 / lngSpan)) : 11;
  const zLat = latSpan > 0 ? Math.log2((eH / WORLD) * (180 / latSpan)) : 11;
  return Math.max(2, Math.floor(Math.min(zLng, zLat, 9) * 10) / 10);
}

/* ---- Public API ---- */

export function getStaticMapUrl(
  routes: RoutePoint[] | undefined | null,
  width = 230,
  height = 120
): string | null {
  if (!routes || routes.length === 0) return null;

  const sorted = [...routes].sort((a, b) => a.destination_order - b.destination_order);

  // Bounds
  const lats = sorted.map((p) => p.latitude);
  const lngs = sorted.map((p) => p.longitude);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);

  // Center – offset down-left to avoid top-right "View Map" button
  const cLat = (Math.max(...lats) + Math.min(...lats)) / 2 - latSpan * 0.08;
  const cLng = (Math.max(...lngs) + Math.min(...lngs)) / 2 - lngSpan * 0.06;
  const zoom = calculateZoom(sorted, width, height);

  const overlayParts: string[] = [];

  // 1) Route polyline
  if (sorted.length > 1) {
    const coords: [number, number][] = sorted.map((p) => [p.latitude, p.longitude]);
    const encoded = encodePolyline(coords);
    overlayParts.push(`path-2.5+4A89DC-0.85(${encodeURIComponent(encoded)})`);
  }

  // 2) Hollow circle markers — drawn as tiny circle path overlays
  //    White fill polygon + darker blue stroke ring
  sorted.forEach((pt) => {
    const circleCoords = makeCircleCoords(pt.latitude, pt.longitude, zoom);
    const circleEncoded = encodePolyline(circleCoords);
    // White fill circle (solid background)
    overlayParts.push(`path-2+3574B5-1(${encodeURIComponent(circleEncoded)})`);
  });

  const overlay = overlayParts.join(',');
  const center = `${cLng.toFixed(4)},${cLat.toFixed(4)},${zoom}`;

  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlay}/${center}/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
}
