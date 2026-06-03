import { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Navbar from '../../shared/components/nav';
import DeviceCard from './DeviceCard';
import Footer from '../../shared/components/Footer';
import LoadingSpinner from '../../shared/components/loading-spinner';
import { Link } from 'react-router-dom';
import AboutPage from './AboutPage';
import SupportChatWidget from './components/SupportChatWidget';

export default function HeroSection() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <LoadingSpinner />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className='max-w-7xl mx-auto px-6 py-4'>
        <div className='relative overflow-hidden p-6 md:p-10 text-white rounded-3xl min-h-[300px] md:min-h-[340px] flex items-center shadow-xl'>
          <div className='absolute inset-0 z-0'>
            <img
              src='./macbook.jpg'
              alt='macbook on desk'
              className='w-full h-full object-cover object-center transform scale-105 group-hover:scale-100 transition-transform duration-700'
            />
          </div>

          <div className='absolute inset-0 z-10 bg-gradient-to-br from-[#6E9F94]/90 via-[#127058]/95 to-[#0b4738] mix-blend-multiply'></div>
          <div className='absolute inset-0 z-10 bg-gradient-to-r from-black/50 via-transparent to-transparent'></div>

          <div className='relative z-20 flex flex-col items-start space-y-3 max-w-2xl'>
            <span className='inline-block bg-[#EF9F27] text-gray-950 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md'>
              Quality Devices. Flexible Payments.
            </span>

            <h1 className='text-3xl md:text-5xl font-black text-white tracking-tight leading-tight'>
              Affordable tech,{' '}
              <span className='text-[#EF9F27]'>fairly priced.</span>
              <br />
              No compromise.
            </h1>

            <p className='text-[#D5E4E1] text-sm md:text-base leading-relaxed max-w-lg drop-shadow-sm line-clamp-3 md:line-clamp-none'>
              ReviveTech is a platform for buying and selling professionally
              refurbished electronics with transparent condition grading,
              AI-powered pricing, and flexible monthly payment plans — making
              quality devices accessible to everyone.
            </p>

            <div className='flex flex-wrap gap-3 mt-4'>
              <Link
                to='/marketplace'
                className='inline-flex items-center gap-2 bg-[#EF9F27] hover:bg-[#d98f20] text-gray-950 font-bold px-5 py-2.5 rounded-full transition-all shadow-lg shadow-[#EF9F27]/20 active:scale-[0.97] text-sm'
              >
                Shop Devices <ArrowRight className='w-4 h-4' />
              </Link>
              <Link
                to='/Sell-Your-Device'
                className='inline-flex items-center gap-2 border border-white/30 hover:border-white/60 text-white font-semibold px-5 py-2.5 rounded-full transition-all text-sm'
              >
                Sell Your Device <ChevronRight className='w-4 h-4' />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <DeviceCard />

      <AboutPage />

      <Footer />

      <SupportChatWidget />
    </>
  );
}
