import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { HeaderSection } from '@/features/home/components/HeaderSection';
import { FooterSection } from '@/features/home/components/FooterSection';
import { usePublishedPackages } from '../hooks/usePublishedPackages';
import { PackageCard } from '../components/PackageCard';
import { FiltersSidebar, type FilterState } from '../components/filters/FiltersSidebar';
import { Pagination } from '../components/Pagination';
import '../styles/packages-listing.css';

const ITEMS_PER_PAGE = 15;

export default function PackagesList() {
  const { packages, loading, error } = usePublishedPackages();

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
      label: value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' '),
      value,
      count,
    }));
  }, [packages]);

  const difficultyOptions = useMemo(() => {
    const counts = new Map<string, number>();
    packages.forEach((p) => {
      const diff = p.difficulty_level;
      if (diff) counts.set(diff, (counts.get(diff) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([value, count]) => ({
      label: value.charAt(0).toUpperCase() + value.slice(1),
      value,
      count,
    }));
  }, [packages]);

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

  // Filtered + sorted packages
  const processedPackages = useMemo(() => {
    let result = packages.filter((pkg) => {
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
  }, [packages, filters]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: '3px solid var(--pkg-slider-track)',
                  borderTopColor: 'var(--pkg-primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            </div>
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
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--pkg-text-secondary)' }}>
              <p style={{ fontSize: 18, marginBottom: 8 }}>Unable to load packages</p>
              <p style={{ fontSize: 14 }}>{error}</p>
            </div>
          </div>
        </div>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeaderSection />

      <div className="pkg-page">
        <div className="pkg-page-inner">
          {/* Breadcrumbs */}
          <nav className="pkg-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/packages">Packages</Link>
            <span>/</span>
            <span>Search results</span>
          </nav>

          {/* Page Heading */}
          <h1 className="pkg-page-heading">Tours & Trips</h1>

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
                <span>{processedPackages.length} Results</span>
              </div>

              {/* Card List */}
              {paginatedPackages.length > 0 ? (
                <div className="pkg-card-list">
                  {paginatedPackages.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      packageData={{
                        ...pkg,
                        destinations: pkg.destination
                          ?.split(',')
                          .map((d: string) => d.trim()),
                      }}
                      isInWishlist={wishlistIds.has(pkg.id)}
                      onToggleWishlist={toggleWishlist}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--pkg-text-muted)' }}>
                  <p style={{ fontSize: 18, marginBottom: 8 }}>No tours match your filters</p>
                  <p style={{ fontSize: 14 }}>Try adjusting your filter criteria</p>
                </div>
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
