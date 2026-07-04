import mapboxgl from "mapbox-gl";

/**
 * Without this plugin Mapbox GL draws Arabic map labels with disconnected,
 * left-to-right letterforms. Loading is lazy: the script is only fetched
 * when a map actually renders RTL text. Safe to call multiple times.
 */
let requested = false;

export function ensureMapboxRTLTextPlugin(): void {
  if (requested) return;
  requested = true;
  try {
    mapboxgl.setRTLTextPlugin(
      "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.3.0/mapbox-gl-rtl-text.js",
      null,
      true
    );
  } catch {
    // Plugin was already registered (e.g. by HMR) — nothing to do.
  }
}
