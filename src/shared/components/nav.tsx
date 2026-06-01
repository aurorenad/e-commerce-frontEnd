import { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  LogIn,
  UserPlus,
  Search,
  ShoppingCart,
  ArrowRight,
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Camera,
  Gamepad2,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';
import { useCart } from '../../context/useCart';
import CartSidebar from './CartSidebar';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useListings } from '../../hooks/useListings';

const ROLE_LABELS: Record<string, string> = {
  admin:      'Admin',
  finance:    'Finance Officer',
  technician: 'Technician',
  customer:   'Customer',
  agent:      'Support Agent',
};

const DASHBOARD_ROLES = new Set(['admin', 'finance', 'technician', 'agent']);

// ─── Category quick-links shown in the search dropdown ───────────────────────
const CATEGORY_LINKS = [
  {
    label: 'Smartphones',
    icon: Smartphone,
    path: '/marketplace?category=Smartphone',
  },
  { label: 'Laptops', icon: Laptop, path: '/marketplace?category=Laptop' },
  { label: 'Tablets', icon: Tablet, path: '/marketplace?category=Tablet' },
  {
    label: 'Smartwatches',
    icon: Watch,
    path: '/marketplace?category=Smartwatch',
  },
  { label: 'Cameras', icon: Camera, path: '/marketplace?category=Camera' },
  { label: 'Gaming', icon: Gamepad2, path: '/marketplace?category=Gaming' },
];

// ─── Nav Links ────────────────────────────────────────────────────────────────
const NAV_LINKS = [{ label: 'Sell Your Device', path: '/Sell-Your-Device' }];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const { listings: catalogListings } = useListings();
  const navigate = useNavigate();
  const searchRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : '';
  const displayRole = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : '';

  function handleLogout() {
    setShowUserMenu(false);
    setIsMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

  // Live search results filtered from listings
  const searchResults =
    searchQuery.trim().length > 1
      ? catalogListings
          .filter(
            (d) =>
              d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              d.category.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .slice(0, 5)
      : [];

  // Close search dropdown and user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  }

  function handleResultClick(id: string) {
    setIsSearchFocused(false);
    setSearchQuery('');
    navigate(`/marketplace/${id}`);
  }

  const showDropdown = isSearchFocused;

  return (
    <>
      <nav className='bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center h-16 gap-4'>
            {/* ── Brand ──────────────────────────────────────────────────── */}
            <Link
              to='/'
              className='text-2xl font-black tracking-tight text-gray-950 hover:opacity-75 transition-opacity flex-shrink-0'
            >
              ReviveTech
            </Link>

            {/* ── Search Bar ─────────────────────────────────────────────── */}
            <div
              ref={searchRef}
              className='relative flex-1 max-w-md mx-auto hidden sm:block'
            >
              <form onSubmit={handleSearchSubmit}>
                <div className='relative group'>
                  <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#127058] transition-colors pointer-events-none' />
                  <input
                    ref={inputRef}
                    type='text'
                    placeholder='Search devices, brands...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    className='w-full pl-10 pr-10 py-2.5 bg-gray-100 border border-transparent rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white focus:border-[#127058]/40 focus:ring-2 focus:ring-[#127058]/10'
                  />
                  {searchQuery && (
                    <button
                      type='button'
                      onClick={() => {
                        setSearchQuery('');
                        inputRef.current?.focus();
                      }}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors'
                    >
                      <X className='w-3.5 h-3.5' />
                    </button>
                  )}
                </div>
              </form>

              {/* ── Search Dropdown ───────────────────────────────────────── */}
              {showDropdown && (
                <div className='absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden'>
                  {/* Live results */}
                  {searchResults.length > 0 ? (
                    <div>
                      <p className='text-[10px] font-black uppercase tracking-widest text-gray-400 px-4 pt-3 pb-1.5'>
                        Results
                      </p>
                      {searchResults.map((device) => {
                        const discount = Math.round(
                          ((device.original_price - device.current_price) /
                            device.original_price) *
                            100,
                        );
                        return (
                          <button
                            key={device.id}
                            onClick={() => handleResultClick(device.id)}
                            className='w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left'
                          >
                            <div className='w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0'>
                              <img
                                src={device.img}
                                alt={device.title}
                                className='w-full h-full object-cover'
                              />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-semibold text-gray-800 truncate'>
                                {device.title}
                              </p>
                              <p className='text-xs text-gray-400'>
                                {device.category}
                              </p>
                            </div>
                            <div className='text-right flex-shrink-0'>
                              <p className='text-sm font-bold text-gray-900'>
                                ${device.current_price}
                              </p>
                              {discount > 0 && (
                                <p className='text-xs text-emerald-600 font-semibold'>
                                  -{discount}% off
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                      <div className='border-t border-gray-100 px-4 py-2.5'>
                        <button
                          onClick={(e) => {
                            handleSearchSubmit(e as unknown as React.FormEvent);
                          }}
                          className='text-sm font-bold text-[#127058] hover:underline flex items-center gap-1'
                        >
                          See all results for "{searchQuery}"
                          <ArrowRight className='w-3.5 h-3.5' />
                        </button>
                      </div>
                    </div>
                  ) : searchQuery.trim().length > 1 ? (
                    /* No results state */
                    <div className='px-4 py-5 text-center'>
                      <p className='text-sm font-semibold text-gray-600'>
                        No devices found for "{searchQuery}"
                      </p>
                      <p className='text-xs text-gray-400 mt-0.5'>
                        Try a different name or browse by category below.
                      </p>
                    </div>
                  ) : null}

                  {/* Category quick-links (always shown when dropdown is open) */}
                  <div
                    className={`${searchResults.length > 0 || searchQuery.trim().length > 1 ? 'border-t border-gray-100' : ''} px-4 pt-3 pb-3`}
                  >
                    <p className='text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2'>
                      Browse by Category
                    </p>
                    <div className='grid grid-cols-3 gap-1.5'>
                      {CATEGORY_LINKS.map(({ label, icon: Icon, path }) => (
                        <Link
                          key={label}
                          to={path}
                          onClick={() => setIsSearchFocused(false)}
                          className='flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors text-center'
                        >
                          <div className='w-7 h-7 rounded-lg bg-[#127058]/10 flex items-center justify-center'>
                            <Icon className='w-3.5 h-3.5 text-[#127058]' />
                          </div>
                          <span className='text-[11px] font-semibold text-gray-600 leading-tight'>
                            {label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Desktop Nav Links ───────────────────────────────────────── */}
            <div className='hidden md:flex items-center gap-1 ml-2'>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  className='text-sm font-semibold text-gray-900  hover:bg-gray-200 px-3 py-2 rounded-xl transition-all'
                >
                  {link.label}
                </Link>
              ))}
              {user && DASHBOARD_ROLES.has(user.role) && (
                <Link
                  to={user.redirectTo}
                  className='inline-flex items-center gap-1.5 text-sm font-semibold text-[#127058] bg-[#127058]/8 hover:bg-[#127058]/15 px-3 py-2 rounded-xl transition-all'
                >
                  <LayoutDashboard size={15} />
                  Dashboard
                </Link>
              )}
            </div>

            {/* ── Right Actions ───────────────────────────────────────────── */}
            <div className='flex items-center gap-1 ml-auto'>
              {/* Mobile search icon */}
              <button
                className='sm:hidden p-2.5 text-gray-600 hover:text-gray-950 hover:bg-gray-100 rounded-xl transition-colors'
                aria-label='Search'
                onClick={() => navigate('/marketplace')}
              >
                <Search className='w-5 h-5' />
              </button>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className='p-2.5 text-gray-600 hover:text-gray-950 hover:bg-gray-100 rounded-xl relative transition-colors'
                aria-label='Shopping Cart'
              >
                <ShoppingCart className='w-5 h-5' />
                {cartCount > 0 && (
                  <span className='absolute top-1 right-1 bg-[#127058] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black ring-2 ring-white'>
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className='h-5 w-px bg-gray-200 mx-1 hidden md:block' />

              {/* Desktop auth — shows chip when logged in, Sign In when not */}
              <div className='hidden md:flex items-center gap-2'>
                {user ? (
                  /* ── Logged-in user chip ── */
                  <div className='relative' ref={userMenuRef}>
                    <button
                      type='button'
                      onClick={() => setShowUserMenu((v) => !v)}
                      aria-expanded={showUserMenu}
                      aria-label='User menu'
                      className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border transition-all ${
                        showUserMenu
                          ? 'bg-gray-100 border-gray-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {/* Avatar */}
                      <span className='flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold flex-shrink-0'>
                        {initials}
                      </span>
                      {/* Name + role */}
                      <span className='flex flex-col text-left leading-tight'>
                        <span className='text-xs font-semibold text-gray-900'>{user.name}</span>
                        <span className='text-[11px] text-gray-500'>{displayRole}</span>
                      </span>
                      {/* Online dot */}
                      <span className='w-2 h-2 rounded-full bg-green-500 flex-shrink-0 ring-2 ring-white' aria-hidden />
                      {/* Chevron */}
                      <ChevronDown
                        size={13}
                        className={`text-gray-400 transition-transform flex-shrink-0 ${showUserMenu ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown */}
                    {showUserMenu && (
                      <div className='absolute top-full right-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden'>
                        {/* Header */}
                        <div className='px-4 py-3 border-b border-gray-100'>
                          <p className='text-sm font-semibold text-gray-900'>{user.name}</p>
                          <p className='text-xs text-gray-500 mt-0.5'>{displayRole}</p>
                        </div>
                        {/* Profile */}
                        <button
                          type='button'
                          onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                          className='w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'
                        >
                          <User size={14} className='text-gray-500' />
                          Profile
                        </button>
                        {/* Log out */}
                        <button
                          type='button'
                          onClick={handleLogout}
                          className='w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors'
                        >
                          <LogOut size={14} />
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── Guest: Sign In button ── */
                  <Link
                    to='/login'
                    className='inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#127058] hover:bg-gray-100 rounded-xl transition-all px-3 py-2'
                  >
                    <LogIn size={15} />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className='md:hidden p-2 rounded-xl text-gray-500 hover:text-[#127058] hover:bg-gray-50 transition-all'
                aria-expanded={isMenuOpen}
                aria-label='Toggle menu'
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ────────────────────────────────────────────────────── */}
        {isMenuOpen && (
          <div className='md:hidden bg-white border-t border-gray-100'>
            <div className='px-4 py-4 space-y-1'>
              {/* Nav links */}
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className='flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  <span>{link.label}</span>
                  <ArrowRight className='w-4 h-4 text-gray-400' />
                </Link>
              ))}
              {user && DASHBOARD_ROLES.has(user.role) && (
                <Link
                  to={user.redirectTo}
                  onClick={() => setIsMenuOpen(false)}
                  className='flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-[#127058] bg-[#127058]/8 hover:bg-[#127058]/15 transition-colors'
                >
                  <span className='flex items-center gap-2'><LayoutDashboard size={16} />Dashboard</span>
                  <ArrowRight className='w-4 h-4 text-[#127058]/60' />
                </Link>
              )}

              <div className='border-t border-gray-100 my-2 pt-2 space-y-2'>
                <p className='text-[10px] font-black text-gray-400 uppercase tracking-wider px-4'>
                  Account
                </p>

                {user ? (
                  /* ── Logged-in: user card + logout ── */
                  <>
                    <div className='flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl'>
                      <span className='flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex-shrink-0'>
                        {initials}
                      </span>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-semibold text-gray-900 truncate'>{user.name}</p>
                        <p className='text-xs text-gray-500'>{displayRole}</p>
                      </div>
                      <span className='w-2 h-2 rounded-full bg-green-500 flex-shrink-0' aria-hidden />
                    </div>
                    <button
                      type='button'
                      onClick={handleLogout}
                      className='flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors'
                    >
                      <LogOut size={17} />
                      Log out
                    </button>
                  </>
                ) : (
                  /* ── Guest: Sign In + Register ── */
                  <>
                    <Link
                      to='/login'
                      onClick={() => setIsMenuOpen(false)}
                      className='flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors'
                    >
                      <LogIn size={17} className='text-[#127058]' />
                      Sign In to Account
                    </Link>
                    <Link
                      to='/register'
                      onClick={() => setIsMenuOpen(false)}
                      className='flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white bg-[#127058] hover:bg-[#0e5845] transition-colors shadow-sm'
                    >
                      <UserPlus size={17} className='text-white/80' />
                      Create Free Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <CartSidebar />
    </>
  );
}
