import { useTranslation } from "react-i18next";
import { HeaderSection } from "@/features/home/components/HeaderSection";
import { HeroSection } from "@/features/home/components/HeroSection";
import { DestinationsSection } from "@/features/home/components/DestinationsSection";
import { TourListingSection } from "@/features/home/components/TourListingSection";
import { FooterSection } from "@/features/home/components/FooterSection";
import { useFeaturedPackages } from "@/features/packages/hooks/useFeaturedPackages";
import { usePublishedPackages } from "@/features/packages/hooks/usePublishedPackages";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { Seo } from "@/lib/seo";

export default function Home() {
  const { t } = useTranslation();
  const { packages: featuredPackages, loading: featuredLoading } = useFeaturedPackages(4);
  const { packages: allPackages, loading: allLoading } = usePublishedPackages();

  // Get latest packages (non-featured)
  const latestPackages = allPackages
    .filter(pkg => !pkg.featured)
    .slice(0, 4);

  // Get recently added packages
  const recentPackages = allPackages
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 4);

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

      <TourListingSection
        titleKey="tours.featuredAdventures"
        descriptionKey="tours.featuredDescription"
        packages={featuredPackages}
        showViewAll={true}
        backgroundClass="bg-muted/50"
      />

      <TourListingSection
        titleKey="tours.latestAdventures"
        descriptionKey="tours.latestDescription"
        packages={latestPackages}
        showViewAll={true}
      />

      <TourListingSection
        titleKey="tours.recentlyAdded"
        descriptionKey="tours.recentDescription"
        packages={recentPackages}
        showViewAll={false}
        backgroundClass="bg-muted/50"
      />
      </main>

      <FooterSection />
    </div>
  );
}
