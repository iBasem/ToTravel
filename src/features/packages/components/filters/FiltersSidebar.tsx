import React, { useState } from 'react';
import { ChevronUp, SlidersHorizontal } from 'lucide-react';
import { RangeSlider } from './RangeSlider';
import { CheckboxFilter } from './CheckboxFilter';

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
    const update = (partial: Partial<FilterState>) => {
        onFiltersChange({ ...filters, ...partial });
    };

    return (
        <aside className="pkg-sidebar">
            {/* Applied Filters Header */}
            <div className="pkg-applied-filters">
                <SlidersHorizontal size={16} />
                <span>Applied filters</span>
            </div>

            {/* Sort */}
            <div className="pkg-filter-section pkg-filter-sort">
                <select
                    value={filters.sortBy}
                    onChange={(e) => update({ sortBy: e.target.value })}
                    aria-label="Sort by"
                >
                    <option value="popular">Popularity: Most popular first</option>
                    <option value="price_asc">Total price: Lowest first</option>
                    <option value="price_desc">Total price: Highest first</option>
                    <option value="duration_asc">Duration: Shortest first</option>
                    <option value="duration_desc">Duration: Longest first</option>
                    <option value="reviews">Reviews: Most reviewed</option>
                </select>
            </div>

            {/* Length */}
            <FilterSection title="Length">
                <RangeSlider
                    min={1}
                    max={maxDuration}
                    value={filters.lengthRange}
                    onChange={(v) => update({ lengthRange: v })}
                    minLabel={`min. ${filters.lengthRange[0]} day${filters.lengthRange[0] !== 1 ? 's' : ''}`}
                    maxLabel={`${filters.lengthRange[1]}${filters.lengthRange[1] >= maxDuration ? '+' : ''} days`}
                />
            </FilterSection>

            {/* Price */}
            <FilterSection title="Price">
                <RangeSlider
                    min={0}
                    max={maxPrice}
                    value={filters.priceRange}
                    onChange={(v) => update({ priceRange: v })}
                    step={50}
                    formatLabel={(v) => `US$${v.toLocaleString()}`}
                />
            </FilterSection>

            {/* Category / Travel Style */}
            {categoryOptions.length > 0 && (
                <FilterSection title="Travel Style">
                    <CheckboxFilter
                        items={categoryOptions}
                        selected={filters.categories}
                        onChange={(v) => update({ categories: v })}
                    />
                </FilterSection>
            )}

            {/* Difficulty */}
            {difficultyOptions.length > 0 && (
                <FilterSection title="Difficulty">
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
