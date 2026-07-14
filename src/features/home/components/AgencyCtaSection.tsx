import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/ui/button";

const AGENCY_IMAGE =
  "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1600&q=80";

/**
 * Partner acquisition section: invites tour agencies to list their packages.
 * One unified card: layered terracotta gradient (built from the --primary
 * token so it adapts to both themes), a dashed "flight path" drifting across
 * the surface, copy + benefits on the start side and the photo reframed as a
 * tilted travel postcard that straightens on hover.
 */
export function AgencyCtaSection() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const benefits = [
    t('agencyCta.benefit1'),
    t('agencyCta.benefit2'),
    t('agencyCta.benefit3'),
    t('agencyCta.benefit4'),
  ];

  // Same hue as the flat fill it replaces: white-lifted at the top-start
  // corner, token primary through the middle, deepened at the bottom-end.
  // Highlight + angle mirror for RTL so the light source follows the copy.
  const cardGradient = [
    `radial-gradient(90% 80% at ${isRtl ? "86%" : "14%"} 4%, hsl(0 0% 100% / 0.16), transparent 55%)`,
    `linear-gradient(${isRtl ? "225deg" : "135deg"},
      color-mix(in oklab, hsl(var(--primary)) 88%, white) 0%,
      hsl(var(--primary)) 45%,
      color-mix(in oklab, hsl(var(--primary)) 74%, black) 100%)`,
  ].join(", ");

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Tour operator marketplace listing',
    name: t('agencyCta.title'),
    description: t('agencyCta.lead'),
    provider: { '@type': 'Organization', name: 'ToTravel' },
    areaServed: 'Worldwide',
    audience: { '@type': 'BusinessAudience', name: 'Tour agencies and tour operators' },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: t('agencyCta.benefit4'),
    },
  };

  return (
    <section aria-labelledby="agency-cta-title" dir={i18n.dir()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div
          className="group relative overflow-hidden rounded-3xl shadow-xl text-primary-foreground"
          style={{ background: cardGradient }}
        >
          {/* Dashed flight path drifting across the card */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full text-primary-foreground/25 rtl:-scale-x-100"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M -4 96 C 18 62, 34 98, 52 62 S 78 18, 106 26"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="0.5 8"
              vectorEffect="non-scaling-stroke"
              className="animate-dash-drift"
            />
          </svg>

          <div className="relative grid items-center gap-10 p-6 sm:p-10 lg:p-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
            <div>
              <span className="inline-flex items-center rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-xs sm:text-sm font-semibold">
                {t('agencyCta.eyebrow')}
              </span>

              <h2
                id="agency-cta-title"
                className="mt-4 max-w-2xl text-2xl sm:text-4xl font-bold leading-tight [text-wrap:balance]"
              >
                {t('agencyCta.title')}
              </h2>

              <p className="mt-4 max-w-2xl text-sm sm:text-base text-primary-foreground/90">
                {t('agencyCta.lead')}
              </p>

              <ul className="mt-7 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm sm:text-base font-medium">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20"
                      aria-hidden="true"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className="mt-9 rounded-full bg-[hsl(20_14%_10%)] px-7 font-semibold text-white shadow-lg transition-colors hover:bg-[hsl(20_14%_18%)] focus-visible:ring-white"
              >
                <Link to="/auth?type=agency">
                  {t('agencyCta.ctaPrimary')}
                  <ArrowRight
                    className="rtl-flip ms-2 h-4 w-4 transition-transform duration-300 group-has-[a:hover]:translate-x-0.5 rtl:group-has-[a:hover]:-translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
            </div>

            {/* Travel-postcard photo: slightly tilted, straightens on hover */}
            <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="rotate-2 rtl:-rotate-2 transition-transform duration-500 ease-out group-hover:rotate-0 group-hover:scale-[1.015] motion-reduce:transform-none motion-reduce:transition-none">
                <img
                  src={AGENCY_IMAGE}
                  alt={t('agencyCta.imageAlt')}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-2xl object-cover shadow-2xl ring-4 ring-primary-foreground/25"
                />
              </div>
            </figure>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
