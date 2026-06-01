import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useListings } from '../../hooks/useListings';
import LoadingSpinner from '../../shared/components/loading-spinner';

export default function DeviceCard() {
  const { listings, loading, error } = useListings();
  const trendingListings = listings.slice(0, 4);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-[#6E9F94] to-[#127058] bg-clip-text text-black">
            Trending Devices
          </h3>
          <p className="text-gray-600 mt-1 font-medium">
            Certified by our expert technicians
          </p>
        </div>

        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#127058] hover:text-[#0e5845] transition-colors group"
        >
          <span>View All Marketplace</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {loading && <LoadingSpinner message="Loading devices..." />}

      {error && !loading && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          Could not load devices. Make sure the backend is running, then visit the{' '}
          <Link to="/marketplace" className="font-semibold underline">
            marketplace
          </Link>
          .
        </p>
      )}

      {!loading && trendingListings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {trendingListings.map((device) => (
            <div
              key={device.id}
              className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col"
            >
              <Link
                to={`/marketplace/${device.id}`}
                className="relative h-48 w-full bg-gray-50 flex items-center justify-center overflow-hidden block"
              >
                <img
                  src={device.img}
                  alt={device.title}
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-[#ef9f27] text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm capitalize">
                  {device.category}
                </span>
              </Link>

              <div className="p-4 flex flex-col flex-grow">
                <Link
                  to={`/marketplace/${device.id}`}
                  className="font-bold text-gray-800 text-lg line-clamp-1 mb-2 hover:text-[#127058] transition-colors"
                >
                  {device.title}
                </Link>

                <div className="flex items-baseline gap-2 mb-4 mt-auto">
                  <span className="text-xl font-extrabold text-gray-900">
                    ${device.current_price.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    ${device.original_price.toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-600 font-medium ml-auto bg-emerald-50 px-2 py-0.5 rounded">
                    From ${(device.current_price / 12).toFixed(0)}/mo
                  </span>
                </div>

                <Link
                  to={`/marketplace/${device.id}`}
                  className="w-full bg-[#127058] hover:bg-[#0e5845] text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm shadow-sm text-center block"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
