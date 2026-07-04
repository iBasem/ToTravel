import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp, SlidersHorizontal } from 'lucide-react';
import { RangeSlider } from './RangeSlider';
import { CheckboxFilter } from './CheckboxFilter';
import { formatCurrency } from '@/lib/formatters';

export interface FilterState {
    sortBy: string;
    lengthRange: [number, number];
    priceRange: [number, number];
    categories: string[];
    difficulties: string[];
}

interface FiltersSidebarProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    maxPrice: number;
    maxDuration: number;
    categoryOptions: { label: string; value: string; count?: number }[];
    difficultyOptions: { label: string; value: string; count?: number }[];
}

function FilterSection({
    title,
    children,
    defaultOpen = true,
}: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="pkg-filter-section">
            <button
                className="pkg-filter-header"
                onClick={() => setOpen(!open)}
                type="button"
                aria-expanded={open}
            >
                <h3 className="pkg-filter-title">{title}</h3>
                <ChevronUp
                    size={16}
                    className={`pkg-filter-chevron${open ? '' : ' collapsed'}`}
                />
            </button>
            {open && <div className="pkg-filter-content">{children}</div>}
        </div>
    );
}

export function FiltersSidebar({
    filters,
    onFiltersChange,
    maxPrice,
    maxDuration,
    categoryOptions,
    difficultyOptions,
}: FiltersSidebarProps) {
    const { t } = useTranslation();
    const update = (partial: Partial<FilterState>) => {
        onFiltersChange({ ...filters, ...partial });
    };

    return (
        <aside className="pkg-sidebar">
            {/* Applied Filters Header */}
            <div className="pkg-applied-filters">
                <SlidersHorizontal size={16} />
                <span>{t('tours.filters.appliedFilters')}</span>
            </div>

            {/* Sort */}
            <div className="pkg-filter-section pkg-filter-sort">
                <select
                    value={filters.sortBy}
                    onChange={(e) => update({ sortBy: e.target.value })}
                    aria-label={t('tours.filters.sortBy')}
                >
                    <option value="popular">{t('tours.filters.sortPopular')}</option>
                    <option value="price_asc">{t('tours.filters.sortPriceAsc')}</option>
                    <option value="price_desc">{t('tours.filters.sortPriceDesc')}</option>
                    <option value="duration_asc">{t('tours.filters.sortDurationAsc')}</option>
                    <option value="duration_desc">{t('tours.filters.sortDurationDesc')}</option>
                    <option value="reviews">{t('tours.filters.sortReviews')}</option>
                </select>
            </div>

            {/* Length */}
            <FilterSection title={t('tours.filters.length')}>
                <RangeSlider
                    min={1}
                    max={maxDuration}
                    value={filters.lengthRange}
                    onChange={(v) => update({ lengthRange: v })}
                    minLabel={t('tours.filters.minDays', { count: filters.lengthRange[0] })}
                    maxLabel={t('tours.filters.maxDays', {
                        count: filters.lengthRange[1],
                        plus: filters.lengthRange[1] >= maxDuration ? '+' : '',
                    })}
                />
            </FilterSection>

            {/* Price */}
            <FilterSection title={t('tours.filters.price')}>
                <RangeSlider
                    min={0}
                    max={maxPrice}
                    value={filters.priceRange}
                    onChange={(v) => update({ priceRange: v })}
                    step={50}
                    formatLabel={(v) => formatCurrency(v)}
                />
            </FilterSection>

            {/* Category / Travel Style */}
            {categoryOptions.length > 0 && (
                <FilterSection title={t('tours.filters.travelStyle')}>
                    <CheckboxFilter
                        items={categoryOptions}
                        selected={filters.categories}
                        onChange={(v) => update({ categories: v })}
                    />
                </FilterSection>
            )}

            {/* Difficulty */}
            {difficultyOptions.length > 0 && (
                <FilterSection title={t('tours.filters.difficulty')}>
                    <CheckboxFilter
                        items={difficultyOptions}
                        selected={filters.difficulties}
                        onChange={(v) => update({ difficulties: v })}
                    />
                </FilterSection>
            )}
        </aside>
    );
}
