import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Truck,
  RefreshCw,
  CreditCard,
  ShoppingCart,
  Zap,
  Lock,
} from 'lucide-react';
import { useCart } from '../../../context/useCart';
import { useAuth } from '../../../context/AuthContext';
import { fetchListingById } from '../../../services/marketplace.service';
import { mapApiListingToListing, mapListingToCartDevice } from '../../../lib/mappers';
import { getErrorMessage } from '../../../lib/api';
import type { Listing } from '../types';
import LoadingSpinner from '../../../shared/components/loading-spinner';
import Navbar from '../../../shared/components/nav';
import Footer from '../../../shared/components/Footer';

export default function DeviceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [financingMonths, setFinancingMonths] = useState(12);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const row = await fetchListingById(id);
        if (!cancelled) {
          setListing(mapApiListingToListing(row));
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setListing(null);
          setLoadError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleAddToCart = async () => {
    if (!listing) return;
    await addToCart(mapListingToCartDevice(listing));
    setIsCartOpen(true);
  };

  const handleBuyNow = async () => {
    if (!listing) return;
    setBuying(true);
    try {
      await addToCart(mapListingToCartDevice(listing));
      if (!isAuthenticated) {
        navigate('/login', { state: { from: '/checkout' } });
        return;
      }
      navigate('/checkout');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <LoadingSpinner message="Loading device details..." />
        <Footer />
      </>
    );
  }

  if (!listing) {
    return (
      <>
        <Navbar />
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8 text-center max-w-md mx-auto">
          <p className="text-gray-600 font-medium">
            {loadError || 'Device not found.'}
          </p>
          <p className="text-sm text-gray-500">
            This device may no longer be available. Browse the marketplace for current listings.
          </p>
          <Link to="/marketplace" className="text-[#127058] font-semibold hover:underline">
            Back to marketplace
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const monthlyInstallment = (listing.current_price / financingMonths).toFixed(0);
  const totalSavings = listing.original_price - listing.current_price;

  const purchaseActions = (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        type="button"
        onClick={() => void handleAddToCart()}
        disabled={buying}
        className="flex-1 bg-white border-2 border-[#127058] text-[#127058] hover:bg-[#127058]/5 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
      >
        <ShoppingCart size={20} />
        Add to Cart
      </button>
      <button
        type="button"
        onClick={() => void handleBuyNow()}
        disabled={buying}
        className="flex-1 bg-[#127058] hover:bg-[#0e5845] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-60"
      >
        <Zap size={20} />
        {buying ? 'Processing…' : 'Buy Now'}
      </button>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50/50 pb-28 lg:pb-12">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#127058] transition-colors mb-6 group"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Back to Marketplace</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-center overflow-hidden min-h-[350px] sm:min-h-[450px] relative">
              <img
                src={listing.img}
                alt={listing.title}
                className="object-contain max-h-[400px] w-full hover:scale-102 transition-transform duration-300"
              />
              <span className="absolute top-6 left-6 bg-[#ef9f27] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm capitalize tracking-wide">
                {listing.category}
              </span>
              {listing.condition && (
                <span className="absolute top-6 right-6 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
                  {listing.condition}
                </span>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight mb-2">
                  {listing.title}
                </h1>
                <p className="text-gray-500 leading-relaxed">{listing.description}</p>
              </div>

              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl font-black text-gray-950">
                  ${listing.current_price.toLocaleString()}
                </span>
                <span className="text-lg text-gray-400 line-through">
                  ${listing.original_price.toLocaleString()}
                </span>
                {totalSavings > 0 && (
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    Save ${totalSavings.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Purchase panel */}
              <div className="bg-white border-2 border-[#127058]/20 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-black text-gray-950">Ready to buy?</h2>
                  <span className="text-xs font-semibold text-[#127058] bg-[#127058]/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Lock size={12} />
                    Secure checkout
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Add this device to your cart or go straight to checkout. Pay in full or spread over{' '}
                  <strong>{financingMonths} months</strong> (~${monthlyInstallment}/mo).
                </p>
                {purchaseActions}
                {!isAuthenticated && (
                  <p className="text-xs text-gray-500 text-center">
                    <Link to="/login" state={{ from: `/marketplace/${listing.id}` }} className="text-[#127058] font-semibold hover:underline">
                      Sign in
                    </Link>{' '}
                    to save your cart and complete your order faster.
                  </p>
                )}
              </div>

              <ul className="grid grid-cols-2 gap-3">
                {listing.specs.map((spec) => (
                  <li
                    key={spec.label}
                    className="bg-white border border-gray-100 rounded-xl p-3 text-sm"
                  >
                    <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wide">
                      {spec.label}
                    </span>
                    <span className="font-bold text-gray-800">{spec.value}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard size={18} className="text-[#127058]" />
                  Financing Options
                </h3>
                <input
                  type="range"
                  min={3}
                  max={24}
                  step={3}
                  value={financingMonths}
                  onChange={(e) => setFinancingMonths(Number(e.target.value))}
                  className="w-full accent-[#127058]"
                />
                <p className="text-sm text-gray-600">
                  Estimated <strong>${monthlyInstallment}/mo</strong> over {financingMonths} months
                </p>
              </div>

              <div className="hidden lg:block">{purchaseActions}</div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs text-gray-500">
                <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-gray-100">
                  <Shield size={16} className="text-[#127058]" />
                  <span>Certified Refurb</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-gray-100">
                  <Truck size={16} className="text-[#127058]" />
                  <span>Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-gray-100">
                  <RefreshCw size={16} className="text-[#127058]" />
                  <span>30-Day Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky buy bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] p-4 safe-area-pb">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500 font-medium">Total price</p>
            <p className="text-xl font-black text-gray-950">${listing.current_price.toLocaleString()}</p>
          </div>
          <p className="text-xs text-emerald-700 font-semibold">from ${monthlyInstallment}/mo</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleAddToCart()}
            disabled={buying}
            className="flex-1 border-2 border-[#127058] text-[#127058] font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 text-sm disabled:opacity-60"
          >
            <ShoppingCart size={18} />
            Cart
          </button>
          <button
            type="button"
            onClick={() => void handleBuyNow()}
            disabled={buying}
            className="flex-[1.4] bg-[#127058] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 text-sm disabled:opacity-60"
          >
            <Zap size={18} />
            {buying ? '…' : 'Buy Now'}
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}
