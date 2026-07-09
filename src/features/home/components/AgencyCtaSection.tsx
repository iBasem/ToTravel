import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/ui/button";

const AGENCY_IMAGE =
  "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1600&q=80";

/**
 * Partner acquisition section: invites tour agencies to list their packages.
 * Rendered as a rounded card with a colored copy panel on top and a wide
 * image below (marketplace "for operators" pattern).
 */
export function AgencyCtaSection() {
  const { t, i18n } = useTranslation();

  const benefits = [
    t('agencyCta.benefit1'),
    t('agencyCta.benefit2'),
    t('agencyCta.benefit3'),
    t('agencyCta.benefit4'),
  ];

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
        <div className="overflow-hidden rounded-3xl shadow-lg">
          <div className="bg-primary text-primary-foreground p-6 sm:p-10 lg:p-14">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest opacity-90">
              {t('agencyCta.eyebrow')}
            </p>
            <h2 id="agency-cta-title" className="text-2xl sm:text-4xl font-bold leading-tight mt-3 max-w-2xl">
              {t('agencyCta.title')}
            </h2>
            <p className="mt-4 max-w-2xl text-sm sm:text-base opacity-90">
              {t('agencyCta.lead')}
            </p>

            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 max-w-2xl">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm sm:text-base font-medium">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              size="lg"
              className="mt-8 rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
            >
              <Link to="/auth?type=agency">
                {t('agencyCta.ctaPrimary')}
                <ArrowRight className="w-4 h-4 ms-2 rtl-flip" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="h-48 sm:h-64 lg:h-72">
            <img
              src={AGENCY_IMAGE}
              alt={t('agencyCta.eyebrow')}
              loading="lazy"
              className="w-full h-full object-cover"
            />
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
