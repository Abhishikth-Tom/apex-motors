import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { FilterState, Vehicle } from '../types';

interface ShowroomFiltersProps {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onReset: () => void;
  vehicles: Vehicle[];
  totalResults: number;
}

export const ShowroomFilters: React.FC<ShowroomFiltersProps> = ({
  filters,
  onChange,
  onReset,
  vehicles,
  totalResults
}) => {
  // Extract distinct values dynamically from inventory
  const uniqueBrands = Array.from(new Set(vehicles.map((v) => v.make).filter(Boolean))).sort();
  const uniqueCategories = Array.from(new Set(vehicles.map((v) => v.category).filter(Boolean))).sort();
  const uniqueFuelTypes = Array.from(
    new Set(vehicles.map((v) => v.fuelType).filter(Boolean) as string[])
  ).sort();
  const uniqueYears = Array.from(
    new Set(vehicles.map((v) => v.year).filter(Boolean) as number[])
  ).sort((a, b) => b - a);

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.brand) ||
    Boolean(filters.category) ||
    Boolean(filters.fuel) ||
    Boolean(filters.maxPrice) ||
    Boolean(filters.modelYear) ||
    Boolean(filters.maxKm) ||
    filters.sortBy !== 'price_asc';

  return (
    <section className="max-w-[1240px] mx-auto px-5 mb-8">
      {/* Primary Search Bar */}
      <div className="bg-white p-3 border border-[#ddd9cf] rounded-sm shadow-sm flex flex-col md:flex-row items-stretch gap-3">
        <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-[#f9f8f5] border border-[#e8e4dc] rounded-sm focus-within:border-[#183c32] focus-within:bg-white transition-colors">
          <Search size={18} className="text-[#67706a]" />
          <input
            id="showroom-search-input"
            type="text"
            className="w-full bg-transparent border-none outline-none text-sm text-[#17221f] placeholder:text-[#8c948e]"
            placeholder="Search by brand, model, city, or keywords (e.g. Nexon, Mumbai, Electric)..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            id="filter-sort-by"
            className="h-11 px-3 text-xs font-mono uppercase bg-[#f9f8f5] border border-[#e8e4dc] rounded-sm text-[#183c32] outline-none cursor-pointer hover:border-[#183c32]"
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value })}
            aria-label="Sort vehicles"
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="year_desc">Newest Model Year</option>
            <option value="kms_asc">Lowest Kilometres</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="h-11 px-3 text-xs font-mono uppercase tracking-wider text-[#9a4c36] hover:bg-[#faeae6] border border-[#f0c2b8] rounded-sm flex items-center gap-1.5 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Showroom Facet Filters */}
      <div className="mt-3 p-4 bg-white border border-[#e8e4dc] rounded-sm shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Brand / Make Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-brand" className="text-[10px] font-mono uppercase tracking-wider text-[#68736d]">
            Brand
          </label>
          <select
            id="filter-brand"
            className="h-9 px-2 text-xs bg-white border border-[#ddd9cf] rounded-sm text-[#17221f] outline-none"
            value={filters.brand}
            onChange={(e) => onChange({ brand: e.target.value })}
          >
            <option value="">All Brands</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-category" className="text-[10px] font-mono uppercase tracking-wider text-[#68736d]">
            Category
          </label>
          <select
            id="filter-category"
            className="h-9 px-2 text-xs bg-white border border-[#ddd9cf] rounded-sm text-[#17221f] outline-none"
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            <option value="">All Categories</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Fuel Type Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-fuel" className="text-[10px] font-mono uppercase tracking-wider text-[#68736d]">
            Fuel Type
          </label>
          <select
            id="filter-fuel"
            className="h-9 px-2 text-xs bg-white border border-[#ddd9cf] rounded-sm text-[#17221f] outline-none"
            value={filters.fuel}
            onChange={(e) => onChange({ fuel: e.target.value })}
          >
            <option value="">All Fuels</option>
            {uniqueFuelTypes.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Budget Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-budget" className="text-[10px] font-mono uppercase tracking-wider text-[#68736d]">
            Max Budget
          </label>
          <select
            id="filter-budget"
            className="h-9 px-2 text-xs bg-white border border-[#ddd9cf] rounded-sm text-[#17221f] outline-none"
            value={filters.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
          >
            <option value="">Any Budget</option>
            <option value="1500000">Under ₹15 Lakh</option>
            <option value="2000000">Under ₹20 Lakh</option>
            <option value="2500000">Under ₹25 Lakh</option>
            <option value="3500000">Under ₹35 Lakh</option>
            <option value="5000000">Under ₹50 Lakh</option>
          </select>
        </div>

        {/* Model Year Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-year" className="text-[10px] font-mono uppercase tracking-wider text-[#68736d]">
            Model Year
          </label>
          <select
            id="filter-year"
            className="h-9 px-2 text-xs bg-white border border-[#ddd9cf] rounded-sm text-[#17221f] outline-none"
            value={filters.modelYear}
            onChange={(e) => onChange({ modelYear: e.target.value })}
          >
            <option value="">Any Year</option>
            {uniqueYears.map((y) => (
              <option key={y} value={String(y)}>
                {y} or newer
              </option>
            ))}
          </select>
        </div>

        {/* KM Driven Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-km" className="text-[10px] font-mono uppercase tracking-wider text-[#68736d]">
            KM Driven
          </label>
          <select
            id="filter-km"
            className="h-9 px-2 text-xs bg-white border border-[#ddd9cf] rounded-sm text-[#17221f] outline-none"
            value={filters.maxKm}
            onChange={(e) => onChange({ maxKm: e.target.value })}
          >
            <option value="">Any Mileage</option>
            <option value="20000">Under 20,000 km</option>
            <option value="30000">Under 30,000 km</option>
            <option value="45000">Under 45,000 km</option>
            <option value="60000">Under 60,000 km</option>
          </select>
        </div>
      </div>

      {/* Results Count & Badges */}
      <div className="flex items-center justify-between text-xs text-[#67706a] mt-3 px-1">
        <span>
          Showing <strong className="text-[#183c32]">{totalResults}</strong> certified vehicle{totalResults === 1 ? '' : 's'}
        </span>
        {hasActiveFilters && (
          <span className="text-[11px] font-mono text-[#c96535]">Filtered results active</span>
        )}
      </div>
    </section>
  );
};
