import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Lightweight per-page SEO without an external helmet dependency.
 *
 * Renders nothing; manages document.head imperatively:
 * - <title> and meta description (pass already-translated strings)
 * - Open Graph title/description/locale (+ alternate locale)
 * - canonical URL and hreflang alternates using the ?lng= query param
 * - optional JSON-LD structured data
 *
 * Note: as a client-rendered SPA these tags are only visible to
 * JS-executing crawlers (Googlebot included). Prerendering is the
 * long-term fix for the rest — tracked in LOCALIZATION-AUDIT.md.
 */

const LOCALES = { en: "en_US", ar: "ar_SA" } as const;

interface SeoProps {
  /** Page title, already translated. The app name suffix is added here. */
  title: string;
  description?: string;
  /** JSON-LD object(s) to embed for this page. */
  jsonLd?: object | object[];
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"][data-seo]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    else el.setAttribute("data-seo", "true");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function Seo({ title, description, jsonLd }: SeoProps) {
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const lang = i18n.language.startsWith("ar") ? "ar" : "en";
    const otherLang = lang === "ar" ? "en" : "ar";
    const fullTitle = `${title} | ToTravel`;

    document.title = fullTitle;
    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
    }
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:locale", LOCALES[lang]);
    upsertMeta("property", "og:locale:alternate", LOCALES[otherLang]);

    const url = new URL(
      location.pathname + location.search,
      window.location.origin
    );
    url.searchParams.delete("lng");
    const canonical = url.toString();
    const withLng = (lng: string) => {
      const u = new URL(canonical);
      u.searchParams.set("lng", lng);
      return u.toString();
    };

    upsertMeta("property", "og:url", canonical);
    upsertLink("canonical", canonical);
    upsertLink("alternate", withLng("en"), "en");
    upsertLink("alternate", withLng("ar"), "ar");
    upsertLink("alternate", canonical, "x-default");
  }, [title, description, i18n.language, location.pathname, location.search]);

  useEffect(() => {
    if (!jsonLd) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-jsonld", "true");
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [JSON.stringify(jsonLd)]);

  return null;
}
