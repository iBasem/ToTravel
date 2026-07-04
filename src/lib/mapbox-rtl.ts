import mapboxgl from "mapbox-gl";
import i18n from "@/i18n";

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

/**
 * Switch map place labels to the active UI language. Mapbox styles carry
 * per-language name fields (name_ar, name_en, ...); classic styles like
 * streets-v12 default to local names + English, so Arabic mode must
 * rewrite the label layers. Call from the map's 'load' handler.
 *
 * Only layers whose text-field references a name property are touched —
 * road shields and house numbers keep their own fields.
 */
export function applyMapLanguage(map: mapboxgl.Map): void {
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
  const textField: mapboxgl.Expression = [
    "coalesce",
    ["get", `name_${lang}`],
    ["get", "name"],
  ];
  for (const layer of map.getStyle()?.layers ?? []) {
    if (layer.type !== "symbol") continue;
    try {
      const current = map.getLayoutProperty(layer.id, "text-field");
      if (current && JSON.stringify(current).includes("name")) {
        map.setLayoutProperty(layer.id, "text-field", textField);
      }
    } catch {
      // Layer without a text-field — skip.
    }
  }
}
