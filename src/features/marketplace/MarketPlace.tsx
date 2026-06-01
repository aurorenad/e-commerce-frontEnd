import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useListings } from '../../hooks/useListings';
import type { Listing } from './types';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Star,
  ArrowUpDown,
  LayoutGrid,
  List,
  Filter,
  ChevronRight,
} from 'lucide-react';
import LoadingSpinner from '../../shared/components/loading-spinner';
import { Link } from 'react-router-dom';
import Navbar from '../../shared/components/nav';
import Footer from '../../shared/components/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';
type ViewMode   = 'grid' | 'list';

// ─── Price Range Presets ──────────────────────────────────────────────────────
const PRICE_PRESETS = [
  { label: 'All Prices',    min: 0,    max: Infinity },
  { label: 'Under $200',    min: 0,    max: 200      },
  { label: '$200 – $500',   min: 200,  max: 500      },
  { label: '$500 – $1,000', min: 500,  max: 1000     },
  { label: 'Over $1,000',   min: 1000, max: Infinity },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default',    label: 'Featured'           },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc',   label: 'Name: A–Z'          },
];

// ─── Condition Badge ──────────────────────────────────────────────────────────
function conditionBadge(condition?: string) {
  switch (condition?.toLowerCase()) {
    case 'excellent': return 'bg-emerald-100 text-emerald-700';
    case 'good':      return 'bg-blue-100    text-blue-700';
    case 'fair':      return 'bg-amber-100   text-amber-700';
    default:          return 'bg-gray-100    text-gray-600';
  }
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
interface SidebarProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (c: string) => void;
  pricePresetIndex: number;
  onPricePresetChange: (i: number) => void;
  onReset: () => void;
  activeFilterCount: number;
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({
  categories, selectedCategory, onCategoryChange,
  pricePresetIndex, onPricePresetChange,
  onReset, activeFilterCount, isOpen, onClose,
}: SidebarProps) {
  return (
    <>
      {/* Backdrop — all screen sizes */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/30 z-30 backdrop-blur-[2px]'
          onClick={onClose}
        />
      )}

      {/* Panel — slides in from left on ALL screen sizes */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white z-40 shadow-2xl overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100'>
          <div className='flex items-center gap-2'>
            <SlidersHorizontal className='w-4 h-4 text-[#127058]' />
            <span className='font-black text-gray-900 text-sm tracking-tight'>Filters</span>
            {activeFilterCount > 0 && (
              <span className='bg-[#127058] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center'>
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className='p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700'
          >
            <X className='w-4 h-4' />
          </button>
        </div>

        <div className='p-5 space-y-7'>
          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className='w-full text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-xl transition-colors'
            >
              Clear all filters
            </button>
          )}

          {/* Category */}
          <div>
            <p className='text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3'>
              Category
            </p>
            <ul className='space-y-1'>
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => { onCategoryChange(cat); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      selectedCategory === cat
                        ? 'bg-[#127058] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {cat === 'All' ? 'All Devices' : cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Price Range */}
          <div>
            <p className='text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3'>
              Price Range
            </p>
            <ul className='space-y-1'>
              {PRICE_PRESETS.map((preset, i) => (
                <li key={preset.label}>
                  <button
                    onClick={() => onPricePresetChange(i)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      pricePresetIndex === i
                        ? 'bg-[#127058] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {preset.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Financing tip */}
          <div className='bg-gradient-to-br from-[#6E9F94]/10 to-[#127058]/10 border border-[#127058]/20 rounded-2xl p-4'>
            <p className='text-[10px] font-black uppercase tracking-wider text-[#127058] mb-1.5'>
              Monthly Financing
            </p>
            <p className='text-xs text-gray-600 leading-relaxed'>
              Every device can be paid over 12 months. No upfront payment needed.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Device Card (Grid) ───────────────────────────────────────────────────────
function DeviceCard({ device }: { device: Listing }) {
  const monthlyPrice = Math.ceil(device.current_price / 12);
  const discountPct  = Math.round(
    ((device.original_price - device.current_price) / device.original_price) * 100,
  );

  return (
    <div className='group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#127058]/30 transition-all duration-300 bg-white flex flex-col'>
      <Link to={`/marketplace/${device.id}`} className='relative h-48 w-full bg-gray-50 overflow-hidden block'>
        <img
          src={device.img} alt={device.title}
          className='object-cover w-full h-full group-hover:scale-105 transition-transform duration-500'
        />
        {discountPct > 0 && (
          <span className='absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm'>
            -{discountPct}%
          </span>
        )}
        <span className='absolute top-3 left-3 bg-[#ef9f27] text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm capitalize'>
          {device.category}
        </span>
        {device.condition && (
          <span className={`absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${conditionBadge(device.condition)}`}>
            {device.condition}
          </span>
        )}
      </Link>

      <div className='p-4 flex flex-col flex-grow'>
        <Link to={`/marketplace/${device.id}`} className='font-bold text-gray-800 text-base line-clamp-1 mb-1 hover:text-[#127058] transition-colors block'>
          {device.title}
        </Link>

        <div className='flex items-center gap-1 mb-3'>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-3.5 h-3.5 ${s <= (device.rating ?? 4) ? 'text-[#EF9F27] fill-[#EF9F27]' : 'text-gray-200 fill-gray-200'}`} />
          ))}
          <span className='text-xs text-gray-400 ml-1'>({device.reviewCount ?? 24})</span>
        </div>

        <div className='mt-auto'>
          <div className='flex items-baseline gap-2 mb-1'>
            <span className='text-xl font-extrabold text-gray-900'>${device.current_price.toLocaleString()}</span>
            <span className='text-sm text-gray-400 line-through'>${device.original_price.toLocaleString()}</span>
          </div>
          <p className='text-xs text-emerald-700 font-semibold bg-emerald-50 inline-block px-2 py-0.5 rounded-full mb-4'>
            or from ${monthlyPrice}/mo over 12 months
          </p>
        </div>

        <Link
          to={`/marketplace/${device.id}`}
          className='w-full bg-[#127058] hover:bg-[#0e5845] active:scale-[0.98] text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm shadow-sm text-center block'
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

// ─── Device Row (List View) ───────────────────────────────────────────────────
function DeviceRow({ device }: { device: Listing }) {
  const monthlyPrice = Math.ceil(device.current_price / 12);
  const discountPct  = Math.round(
    ((device.original_price - device.current_price) / device.original_price) * 100,
  );

  return (
    <div className='group flex gap-4 border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-[#127058]/30 transition-all duration-300 bg-white p-4'>
      <Link to={`/marketplace/${device.id}`} className='relative w-28 h-28 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden block'>
        <img src={device.img} alt={device.title} className='object-cover w-full h-full group-hover:scale-105 transition-transform duration-500' />
        {discountPct > 0 && (
          <span className='absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full'>-{discountPct}%</span>
        )}
      </Link>

      <div className='flex flex-col flex-grow min-w-0'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <span className='text-xs font-bold text-[#ef9f27] capitalize'>{device.category}</span>
            <Link to={`/marketplace/${device.id}`} className='font-bold text-gray-800 text-base line-clamp-1 hover:text-[#127058] transition-colors block'>
              {device.title}
            </Link>
          </div>
          {device.condition && (
            <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${conditionBadge(device.condition)}`}>
              {device.condition}
            </span>
          )}
        </div>

        <div className='flex items-center gap-1 mt-1 mb-2'>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-3 h-3 ${s <= (device.rating ?? 4) ? 'text-[#EF9F27] fill-[#EF9F27]' : 'text-gray-200 fill-gray-200'}`} />
          ))}
          <span className='text-xs text-gray-400 ml-1'>({device.reviewCount ?? 24})</span>
        </div>

        <div className='flex items-center justify-between mt-auto flex-wrap gap-2'>
          <div>
            <div className='flex items-baseline gap-2'>
              <span className='text-lg font-extrabold text-gray-900'>${device.current_price.toLocaleString()}</span>
              <span className='text-sm text-gray-400 line-through'>${device.original_price.toLocaleString()}</span>
            </div>
            <p className='text-xs text-emerald-700 font-semibold'>from ${monthlyPrice}/mo</p>
          </div>
          <Link
            to={`/marketplace/${device.id}`}
            className='bg-[#127058] hover:bg-[#0e5845] text-white font-semibold py-2 px-5 rounded-xl transition-all text-sm shadow-sm'
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Toggle Button (floating, edge-anchored) ───────────────────────────
function FilterToggleButton({
  onClick,
  activeFilterCount,
}: {
  onClick: () => void;
  activeFilterCount: number;
}) {
  return (
    <button
      onClick={onClick}
      title='Toggle filters'
      className='
        group fixed left-0 top-1/2 -translate-y-1/2 z-20
        flex flex-col items-center justify-center gap-1.5
        bg-white border border-gray-200 border-l-0
        rounded-r-2xl shadow-md hover:shadow-lg
        px-2 py-4
        transition-all duration-200 hover:bg-[#127058] hover:border-[#127058]
      '
    >
      {/* Icon swaps on hover */}
      <Filter className='w-4 h-4 text-gray-500 group-hover:text-white transition-colors' />

      {/* "Filters" label rotated */}
      <span
        className='text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors'
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        Filters
      </span>

      {/* Badge */}
      {activeFilterCount > 0 && (
        <span className='absolute -top-2 -right-2 bg-[#EF9F27] text-gray-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white'>
          {activeFilterCount}
        </span>
      )}

      {/* Arrow hint */}
      <ChevronRight className='w-3 h-3 text-gray-400 group-hover:text-white/70 transition-colors mt-1' />
    </button>
  );
}

// ─── Marketplace ──────────────────────────────────────────────────────────────
export default function Marketplace() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const { listings, loading: isLoading, error: loadError, reload } = useListings(initialSearch || undefined);
  const [searchQuery, setSearchQuery]       = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pricePresetIndex, setPricePresetIndex] = useState(0);
  const [sortBy, setSortBy]                 = useState<SortOption>('default');
  const [viewMode, setViewMode]             = useState<ViewMode>('grid');
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set(listings.map((d) => d.category))],
    [listings],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (selectedCategory !== 'All') n++;
    if (pricePresetIndex !== 0) n++;
    return n;
  }, [selectedCategory, pricePresetIndex]);

  const filteredListings = useMemo(() => {
    const { min, max } = PRICE_PRESETS[pricePresetIndex];
    let results = listings.filter((d) => {
      const matchSearch   = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'All' || d.category === selectedCategory;
      const matchPrice    = d.current_price >= min && d.current_price <= max;
      return matchSearch && matchCategory && matchPrice;
    });
    if (sortBy === 'price-asc')  results = [...results].sort((a, b) => a.current_price - b.current_price);
    if (sortBy === 'price-desc') results = [...results].sort((a, b) => b.current_price - a.current_price);
    if (sortBy === 'name-asc')   results = [...results].sort((a, b) => a.title.localeCompare(b.title));
    return results;
  }, [searchQuery, selectedCategory, pricePresetIndex, sortBy, listings]);

  function handleReset() {
    setSearchQuery('');
    setSelectedCategory('All');
    setPricePresetIndex(0);
    setSortBy('default');
  }

  if (isLoading) return <LoadingSpinner message='Loading devices from database...' />;

  if (!loadError && listings.length === 0) {
    return (
      <>
        <Navbar />
        <div className='max-w-7xl mx-auto px-4 py-24 text-center'>
          <p className='text-gray-600 font-medium'>No devices listed yet. Run <code className='text-[#127058]'>npm run seed</code> in the backend.</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {loadError && (
        <div className='max-w-7xl mx-auto px-4 pt-4'>
          <div className='text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3'>
            <span>Could not load devices from the API: {loadError}</span>
            <button type='button' onClick={() => void reload()} className='font-semibold text-[#127058] hover:underline'>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ── Filter Toggle Button — always visible on left edge ────────────── */}
      <FilterToggleButton
        onClick={() => setSidebarOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* ── Sidebar ──────────────────────────────────────────────────────────  */}
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={(c) => { setSelectedCategory(c); setSidebarOpen(false); }}
        pricePresetIndex={pricePresetIndex}
        onPricePresetChange={(i) => { setPricePresetIndex(i); }}
        onReset={handleReset}
        activeFilterCount={activeFilterCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Page Body ─────────────────────────────────────────────────────────  */}
      <div className='max-w-7xl mx-auto px-6 py-8'>

        {/* Header */}
        <div className='mb-7'>
          <h1 className='text-3xl font-black text-gray-900 tracking-tight'>Browse Devices</h1>
          <p className='text-gray-500 mt-1 text-sm max-w-xl'>
            Professionally refurbished phones, laptops, and tablets — all with transparent grading,
            a 12-month warranty, and flexible monthly payment plans.
          </p>
        </div>

        {/* Toolbar */}
        <div className='flex flex-col sm:flex-row gap-3 mb-5 items-stretch sm:items-center justify-between'>

          {/* Search */}
          <div className='relative w-full sm:w-80 md:w-96 group'>
            <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#127058] transition-colors' />
            <input
              type='text'
              placeholder='Search by name, brand, or category...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-9 py-2.5 bg-gray-100 border border-transparent rounded-xl text-sm font-medium text-gray-950 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-[#127058]/20'
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700'>
                <X className='w-3.5 h-3.5' />
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className='flex items-center gap-2'>

            {/* Active-filter inline pills (quick removal) */}
            {activeFilterCount > 0 && (
              <div className='hidden sm:flex items-center gap-1.5'>
                {selectedCategory !== 'All' && (
                  <span className='flex items-center gap-1 bg-[#127058]/10 text-[#127058] text-xs font-bold px-2.5 py-1.5 rounded-full'>
                    {selectedCategory}
                    <button onClick={() => setSelectedCategory('All')} className='ml-0.5 hover:text-[#0e5845]'>
                      <X className='w-3 h-3' />
                    </button>
                  </span>
                )}
                {pricePresetIndex !== 0 && (
                  <span className='flex items-center gap-1 bg-[#127058]/10 text-[#127058] text-xs font-bold px-2.5 py-1.5 rounded-full'>
                    {PRICE_PRESETS[pricePresetIndex].label}
                    <button onClick={() => setPricePresetIndex(0)} className='ml-0.5 hover:text-[#0e5845]'>
                      <X className='w-3 h-3' />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Sort dropdown */}
            <div className='relative' ref={sortRef}>
              <button
                onClick={() => setSortDropdownOpen((v) => !v)}
                className='flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors'
              >
                <ArrowUpDown className='w-4 h-4' />
                <span className='hidden sm:inline'>{SORT_OPTIONS.find((o) => o.value === sortBy)?.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${sortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {sortDropdownOpen && (
                <div className='absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[190px] py-1 overflow-hidden'>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setSortDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sortBy === opt.value
                          ? 'bg-[#127058]/10 text-[#127058] font-bold'
                          : 'text-gray-700 hover:bg-gray-50 font-medium'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View mode */}
            <div className='flex items-center border border-gray-200 rounded-xl overflow-hidden'>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-[#127058] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <LayoutGrid className='w-4 h-4' />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-[#127058] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <List className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className='text-sm text-gray-500 font-medium mb-5'>
          Showing <span className='text-gray-900 font-bold'>{filteredListings.length}</span>{' '}
          device{filteredListings.length !== 1 ? 's' : ''}
          {selectedCategory !== 'All' && (
            <> in <span className='text-[#127058] font-bold'>{selectedCategory}</span></>
          )}
        </p>

        {/* Empty state */}
        {filteredListings.length === 0 && (
          <div className='text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200'>
            <SlidersHorizontal className='w-10 h-10 text-gray-300 mx-auto mb-3' />
            <p className='text-gray-600 font-semibold text-base'>No devices match your filters.</p>
            <p className='text-gray-400 text-sm mt-1 mb-4'>Try adjusting your search or clearing filters.</p>
            <button
              onClick={handleReset}
              className='text-sm text-white bg-[#127058] hover:bg-[#0e5845] font-bold px-5 py-2 rounded-xl transition-colors'
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Grid */}
        {viewMode === 'grid' && filteredListings.length > 0 && (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5'>
            {filteredListings.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        )}

        {/* List */}
        {viewMode === 'list' && filteredListings.length > 0 && (
          <div className='flex flex-col gap-4'>
            {filteredListings.map((device) => (
              <DeviceRow key={device.id} device={device} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}