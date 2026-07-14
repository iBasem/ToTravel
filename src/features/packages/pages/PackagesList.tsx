import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, X } from 'lucide-react';
import { HeaderSection } from '@/features/home/components/HeaderSection';
import { FooterSection } from '@/features/home/components/FooterSection';
import { usePublishedPackages } from '../hooks/usePublishedPackages';
import { useDestinationOptions } from '../hooks/useDestinations';
import { localizedText } from '@/lib/localized';
import { PackageCard } from '../components/PackageCard';
import { FiltersSidebar, type FilterState } from '../components/filters/FiltersSidebar';
import { Pagination } from '../components/Pagination';
import { Seo } from '@/lib/seo';
import { pickLocalized } from '@/lib/localized';
import { LoadingSpinner } from '@/ui/loading-spinner';
import { EmptyState } from '@/ui/empty-state';
import { Button } from '@/ui/button';
import '../styles/packages-listing.css';

const ITEMS_PER_PAGE = 15;

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5 ps-3 pe-1.5 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('common.clearFilters')}
        className="rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </span>
  );
}

export default function PackagesList() {
  const { t, i18n } = useTranslation();
  const { packages, loading, error, refetch } = usePublishedPackages();

  // Wishlist state
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const toggleWishlist = (id: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Compute max values for slider ranges
  const maxPrice = useMemo(
    () => Math.max(1000, ...packages.map((p) => p.base_price)),
    [packages]
  );
  const maxDuration = useMemo(
    () => Math.max(30, ...packages.map((p) => p.duration_days)),
    [packages]
  );

  // Build category and difficulty options from data
  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    packages.forEach((p) => {
      const cat = p.category || 'other';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([value, count]) => ({
      label: t(`categories.${value}`, {
        defaultValue: value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' '),
      }),
      value,
      count,
    }));
  }, [packages, t]);

  const difficultyOptions = useMemo(() => {
    const counts = new Map<string, number>();
    packages.forEach((p) => {
      const diff = p.difficulty_level;
      if (diff) counts.set(diff, (counts.get(diff) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([value, count]) => ({
      label: t(`difficulty.${value}`, {
        defaultValue: value.charAt(0).toUpperCase() + value.slice(1),
      }),
      value,
      count,
    }));
  }, [packages, t]);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'popular',
    lengthRange: [1, Math.max(30, maxDuration)],
    priceRange: [0, Math.max(1000, maxPrice)],
    categories: [],
    difficulties: [],
  });

  // Update ranges when data loads
  React.useEffect(() => {
    if (packages.length > 0) {
      setFilters((prev) => ({
        ...prev,
        lengthRange: [1, maxDuration],
        priceRange: [0, maxPrice],
      }));
    }
  }, [maxPrice, maxDuration, packages.length]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Hero search params (/packages?search=&destination=&month=&adults=&children=)
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = (searchParams.get('search') ?? '').trim().toLowerCase();
  const destinationSlug = searchParams.get('destination');
  const rawMonth = searchParams.get('month');
  const monthFilter = rawMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth) ? rawMonth : null;
  const adults = Math.max(0, parseInt(searchParams.get('adults') ?? '', 10) || 0);
  const childrenCount = Math.max(0, parseInt(searchParams.get('children') ?? '', 10) || 0);
  const partySize = adults + childrenCount;

  const { data: destinationRows = [] } = useDestinationOptions();
  const selectedDestination = destinationSlug
    ? destinationRows.find((d) => d.slug === destinationSlug) ?? null
    : null;

  // Country names (en + ar) to match against packages.destination text.
  // A continent selection expands to every country tagged with its region
  // keys; multi-country packages match because destination is a
  // comma-separated list checked by containment (same rule as the
  // destination_stats view).
  const destinationNames = useMemo(() => {
    if (!selectedDestination) return [];
    const rows =
      selectedDestination.kind === 'region'
        ? destinationRows.filter(
            (d) =>
              d.kind === 'country' &&
              d.region_keys.some((key) => selectedDestination.region_keys.includes(key))
          )
        : [selectedDestination];
    return rows
      .flatMap((d) => [d.name, d.name_ar])
      .filter((name): name is string => !!name)
      .map((name) => name.toLowerCase());
  }, [selectedDestination, destinationRows]);

  const removeSearchParams = (...keys: string[]) => {
    const next = new URLSearchParams(searchParams);
    keys.forEach((key) => next.delete(key));
    setSearchParams(next, { replace: true });
  };

  // Filtered + sorted packages
  const processedPackages = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const result = packages.filter((pkg) => {
      const matchesSearch =
        searchQuery === '' ||
        [pkg.title, pkg.title_ar, pkg.destination, pkg.destination_ar]
          .some(field => (field ?? '').toLowerCase().includes(searchQuery));
      if (!matchesSearch) return false;

      if (destinationSlug) {
        const haystack = `${pkg.destination ?? ''}|${pkg.destination_ar ?? ''}`.toLowerCase();
        const matchesDestination = destinationNames.length > 0
          ? destinationNames.some((name) => haystack.includes(name))
          : haystack.includes(destinationSlug.toLowerCase());
        if (!matchesDestination) return false;
      }

      if (monthFilter) {
        const upcoming = (pkg.package_departures ?? []).filter(
          (d) => d.status === 'scheduled' && d.departure_date >= todayIso
        );
        let matchesMonth: boolean;
        if (upcoming.length > 0) {
          matchesMonth = upcoming.some((d) => d.departure_date.startsWith(monthFilter));
        } else if (pkg.available_from || pkg.available_to) {
          // No fixed departures: fall back to the availability window
          const monthStart = `${monthFilter}-01`;
          const monthEnd = `${monthFilter}-31`;
          matchesMonth =
            (!pkg.available_from || pkg.available_from.slice(0, 10) <= monthEnd) &&
            (!pkg.available_to || pkg.available_to.slice(0, 10) >= monthStart);
        } else {
          // Undated packages are treated as available any month
          matchesMonth = true;
        }
        if (!matchesMonth) return false;
      }

      const matchesParty =
        partySize === 0 || pkg.max_participants == null || pkg.max_participants >= partySize;
      if (!matchesParty) return false;

      const matchesLength =
        pkg.duration_days >= filters.lengthRange[0] &&
        pkg.duration_days <= filters.lengthRange[1];
      const matchesPrice =
        pkg.base_price >= filters.priceRange[0] &&
        pkg.base_price <= filters.priceRange[1];
      const matchesCategory =
        filters.categories.length === 0 ||
        filters.categories.includes(pkg.category || 'other');
      const matchesDifficulty =
        filters.difficulties.length === 0 ||
        (pkg.difficulty_level && filters.difficulties.includes(pkg.difficulty_level));

      return matchesLength && matchesPrice && matchesCategory && matchesDifficulty;
    });

    // Sort
    switch (filters.sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.base_price - b.base_price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.base_price - a.base_price);
        break;
      case 'duration_asc':
        result.sort((a, b) => a.duration_days - b.duration_days);
        break;
      case 'duration_desc':
        result.sort((a, b) => b.duration_days - a.duration_days);
        break;
      case 'reviews':
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      default: // 'popular'
        result.sort((a, b) => {
          if (a.featured !== b.featured) return b.featured ? 1 : -1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }

    return result;
  }, [packages, filters, searchQuery, destinationSlug, destinationNames, monthFilter, partySize]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, destinationSlug, monthFilter, partySize]);

  const totalPages = Math.ceil(processedPackages.length / ITEMS_PER_PAGE);
  const paginatedPackages = processedPackages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderSection />
        <div className="pkg-page">
          <div className="pkg-page-inner">
            <LoadingSpinner size="lg" className="py-20" />
          </div>
        </div>
        <FooterSection />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderSection />
        <div className="pkg-page">
          <div className="pkg-page-inner">
            <div className="text-center py-20 px-5">
              <p className="text-lg font-medium text-foreground mb-2">{t('tours.loadError')}</p>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <Button variant="outline" onClick={() => refetch()}>
                {t('common.retry')}
              </Button>
            </div>
          </div>
        </div>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo title={t('tours.pageHeading')} description={t('tours.findPerfect')} />
      <HeaderSection />

      <div className="pkg-page" id="main-content">
        <div className="pkg-page-inner">
          {/* Breadcrumbs */}
          <nav className="pkg-breadcrumbs" aria-label={t('ui.breadcrumb')}>
            <Link to="/">{t('nav.home')}</Link>
            <span>/</span>
            <Link to="/packages">{t('nav.packages')}</Link>
            <span>/</span>
            <span>{t('tours.searchResults')}</span>
          </nav>

          {/* Page Heading */}
          <h1 className="pkg-page-heading">{t('tours.pageHeading')}</h1>

          {/* Two-column layout */}
          <div className="pkg-layout">
            {/* Sidebar */}
            <FiltersSidebar
              filters={filters}
              onFiltersChange={setFilters}
              maxPrice={maxPrice}
              maxDuration={maxDuration}
              categoryOptions={categoryOptions}
              difficultyOptions={difficultyOptions}
            />

            {/* Content */}
            <main className="pkg-content">
              {/* Results count */}
              <div className="pkg-results-count">
                <Star size={18} className="pkg-results-star" fill="currentColor" />
                <span>{t('tours.resultsCount', { count: processedPackages.length })}</span>
              </div>

              {/* Active hero-search filters */}
              {(searchQuery || destinationSlug || monthFilter || partySize > 0) && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {destinationSlug && (
                    <FilterChip
                      label={
                        selectedDestination
                          ? localizedText(selectedDestination, 'name')
                          : destinationSlug
                      }
                      onRemove={() => removeSearchParams('destination')}
                    />
                  )}
                  {searchQuery && (
                    <FilterChip
                      label={`"${searchParams.get('search')}"`}
                      onRemove={() => removeSearchParams('search')}
                    />
                  )}
                  {monthFilter && (
                    <FilterChip
                      label={new Intl.DateTimeFormat(i18n.language, {
                        month: 'long',
                        year: 'numeric',
                      }).format(new Date(
                        Number(monthFilter.slice(0, 4)),
                        Number(monthFilter.slice(5, 7)) - 1,
                        1
                      ))}
                      onRemove={() => removeSearchParams('month')}
                    />
                  )}
                  {partySize > 0 && (
                    <FilterChip
                      label={t('tours.travelersCount', { count: partySize })}
                      onRemove={() => removeSearchParams('adults', 'children')}
                    />
                  )}
                </div>
              )}

              {/* Card List */}
              {paginatedPackages.length > 0 ? (
                <div className="pkg-card-list">
                  {paginatedPackages.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      packageData={{
                        ...pkg,
                        destinations: pickLocalized<string>(pkg, 'destination')
                          ?.split(',')
                          .map((d: string) => d.trim()),
                      }}
                      isInWishlist={wishlistIds.has(pkg.id)}
                      onToggleWishlist={toggleWishlist}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="search"
                  title={t('tours.noMatchTitle')}
                  description={t('tours.noMatchHint')}
                />
              )}

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </main>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
