import { useTranslation } from "react-i18next";
import { HeaderSection } from "@/features/home/components/HeaderSection";
import { HeroSection } from "@/features/home/components/HeroSection";
import { DestinationsSection } from "@/features/home/components/DestinationsSection";
import { TourListingSection } from "@/features/home/components/TourListingSection";
import { AgencyCtaSection } from "@/features/home/components/AgencyCtaSection";
import { FooterSection } from "@/features/home/components/FooterSection";
import { useFeaturedPackages } from "@/features/packages/hooks/useFeaturedPackages";
import { usePublishedPackages } from "@/features/packages/hooks/usePublishedPackages";
import { useActiveDeals, dealsByPackageId } from "@/features/packages/hooks/useActiveDeals";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { Seo } from "@/lib/seo";

const SECTION_LIMIT = 8;

export default function Home() {
  const { t } = useTranslation();
  const { packages: featuredPackages, loading: featuredLoading } = useFeaturedPackages(SECTION_LIMIT);
  const { packages: allPackages, loading: allLoading } = usePublishedPackages();
  const { data: activeDeals = [] } = useActiveDeals();

  const dealsByPackage = dealsByPackageId(activeDeals);

  // Packages with an approved, currently-running deal (highest discount first)
  const dealPackages = activeDeals
    .map(deal => allPackages.find(pkg => pkg.id === deal.package_id))
    .filter((pkg): pkg is NonNullable<typeof pkg> => Boolean(pkg))
    .filter((pkg, index, arr) => arr.findIndex(p => p.id === pkg.id) === index)
    .slice(0, SECTION_LIMIT);

  // Newest published packages
  const recentPackages = [...allPackages]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, SECTION_LIMIT);

  if (featuredLoading || allLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderSection />
        <div className="flex items-center justify-center min-h-[50vh] px-4">
          <LoadingSpinner size="lg" />
        </div>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={t('hero.title')}
        description={t('hero.subtitle')}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'ToTravel',
          url: window.location.origin,
          description: t('hero.subtitle'),
        }}
      />
      <HeaderSection />

      <main id="main-content">
        <HeroSection />

        <DestinationsSection />

        {dealPackages.length > 0 && (
          <TourListingSection
            titleKey="tours.dealAdventures"
            descriptionKey="tours.dealDescription"
            packages={dealPackages}
            showViewAll={true}
            backgroundClass="bg-muted/50"
            dealsByPackage={dealsByPackage}
          />
        )}

        <TourListingSection
          titleKey="tours.featuredAdventures"
          descriptionKey="tours.featuredDescription"
          packages={featuredPackages}
          showViewAll={true}
          dealsByPackage={dealsByPackage}
        />

        <TourListingSection
          titleKey="tours.recentlyAdded"
          descriptionKey="tours.recentDescription"
          packages={recentPackages}
          showViewAll={false}
          backgroundClass="bg-muted/50"
          dealsByPackage={dealsByPackage}
        />

        <AgencyCtaSection />
      </main>

      <FooterSection />
    </div>
  );
}
