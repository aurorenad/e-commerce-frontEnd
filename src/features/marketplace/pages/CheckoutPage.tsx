import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../../../context/useCart';
import { ShieldCheck, CreditCard, Truck, ArrowLeft, ShoppingBag, Calendar, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import * as marketplaceApi from '../../../services/marketplace.service';
import {
  fetchFinancingApplications,
  submitFinancingApplication,
  processOrderPayment,
} from '../../../services/payments.service';
import { getErrorMessage } from '../../../lib/api';
import Navbar from '../../../shared/components/nav';
import Footer from '../../../shared/components/Footer';

type PaymentPlan = 'full' | 'installment';
type PayMethod = 'card' | 'wallet';

const EMPLOYMENT_OPTIONS = ['Employed', 'Self-employed', 'Student', 'Unemployed'] as const;
const FINANCING_INTEREST = 0.12;

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);

  const [shippingInfo, setShippingInfo] = useState({ name: '', email: '', address: '', city: '', zip: '' });
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>('full');
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('card');
  const [cardInfo, setCardInfo] = useState({ number: '', expiry: '', cvc: '' });
  const [installmentMonths, setInstallmentMonths] = useState(12);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [existingDebts, setExistingDebts] = useState('0');
  const [employmentStatus, setEmploymentStatus] = useState<string>(EMPLOYMENT_OPTIONS[0]);
  const [approvedFinancingId, setApprovedFinancingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const singleItem = cart.length === 1 ? cart[0] : null;
  const canUseInstallment = cart.length === 1 && Boolean(singleItem);

  useEffect(() => {
    if (!user) return;
    setShippingInfo((prev) => ({
      ...prev,
      name: prev.name || user.name,
      email: prev.email || user.email,
    }));
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !singleItem) {
      setApprovedFinancingId(null);
      return;
    }
    fetchFinancingApplications()
      .then((apps) => {
        const match = apps.find(
          (a) => a.status === 'APPROVED' && a.deviceId === singleItem.deviceId,
        );
        setApprovedFinancingId(match?.id ?? null);
      })
      .catch(() => setApprovedFinancingId(null));
  }, [isAuthenticated, singleItem?.deviceId]);

  const shippingFee = cartTotal > 500 ? 0 : 15;
  const estimatedTax = Math.round(cartTotal * 0.08);
  const finalTotal = cartTotal + shippingFee + estimatedTax;

  const estimatedMonthly = useMemo(() => {
    if (!singleItem) return 0;
    const financed = singleItem.current_price * (1 + FINANCING_INTEREST);
    return Math.round((financed / installmentMonths) * 100) / 100;
  }, [singleItem, installmentMonths]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    setCheckoutError(null);
    setCheckoutSuccess(null);
    setIsProcessing(true);

    try {
      const deviceIds = cart.map((item) => item.deviceId);

      if (paymentPlan === 'installment') {
        if (!canUseInstallment || !singleItem) {
          setCheckoutError('Installment financing is available for one device at a time.');
          return;
        }

        if (approvedFinancingId) {
          const result = await marketplaceApi.checkout(deviceIds, approvedFinancingId);
          await clearCart();
          setCheckoutSuccess(
            result.message || 'Order placed with your approved installment plan.',
          );
          setTimeout(() => navigate('/profile'), 2000);
          return;
        }

        const income = parseFloat(monthlyIncome);
        const debts = parseFloat(existingDebts);
        if (!Number.isFinite(income) || income <= 0) {
          setCheckoutError('Enter a valid monthly income.');
          return;
        }

        const submitted = await submitFinancingApplication({
          deviceId: singleItem.deviceId,
          monthlyIncome: income,
          existingDebts: Number.isFinite(debts) ? debts : 0,
          installmentMonths,
          employmentStatus,
        });

        await clearCart();
        setCheckoutSuccess(
          `Financing request submitted (ref ${submitted.application.id.slice(0, 8).toUpperCase()}). ` +
            `Estimated payment: $${submitted.application.monthlyRepayment}/mo over ${submitted.application.installmentMonths} months. ` +
            'A finance officer will review and approve or reject your request.',
        );
        setTimeout(() => navigate('/profile'), 3500);
        return;
      }

      const result = await marketplaceApi.checkout(deviceIds);
      const payMethod = paymentMethod === 'wallet' ? 'MOBILE_MONEY' : 'CARD';
      await processOrderPayment({
        orderId: result.order.id,
        amount: finalTotal,
        method: payMethod,
      });
      await clearCart();
      setCheckoutSuccess('Payment successful! Your order has been placed.');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      setCheckoutError(getErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0 && !checkoutSuccess) {
    return (
      <>
        <Navbar />
        <div className='min-h-[60vh] bg-gray-50 flex flex-col items-center justify-center p-6 text-center'>
          <ShoppingBag size={64} className='text-gray-300 mb-4' />
          <h2 className='text-2xl font-black text-gray-950 mb-2'>Your cart is empty</h2>
          <p className='text-gray-500 mb-6 max-w-sm'>You can&apos;t proceed to checkout without adding items to your basket first.</p>
          <button type='button' onClick={() => navigate('/marketplace')} className='bg-[#127058] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#0e5845] transition-all text-sm'>
            Browse Marketplace Devices
          </button>
        </div>
        <Footer />
      </>
    );
  }

  if (checkoutSuccess && cart.length === 0) {
    return (
      <>
        <Navbar />
        <div className='min-h-[60vh] bg-gray-50 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto'>
          <ShieldCheck size={56} className='text-emerald-600 mb-4' />
          <h2 className='text-2xl font-black text-gray-950 mb-3'>Thank you!</h2>
          <p className='text-gray-600 text-sm leading-relaxed'>{checkoutSuccess}</p>
          <button type='button' onClick={() => navigate('/profile')} className='mt-6 bg-[#127058] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#0e5845] text-sm'>
            Go to my profile
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const submitLabel =
    paymentPlan === 'installment'
      ? approvedFinancingId
        ? 'Complete order with approved plan'
        : 'Submit financing request'
      : 'Authorize payment';

  return (
    <>
      <Navbar />
      <div className='min-h-screen bg-gray-50/50 pb-24 pt-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <button type='button' onClick={() => navigate(-1)} className='inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#127058] transition-colors mb-8 group'>
            <ArrowLeft size={16} className='transition-transform group-hover:-translate-x-1' />
            <span>Back to previous page</span>
          </button>

          <h1 className='text-3xl font-black text-gray-950 tracking-tight mb-8'>Secure Checkout</h1>

          {checkoutError && (
            <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium'>
              {checkoutError}
            </div>
          )}

          <form onSubmit={handlePlaceOrder} className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
            <div className='lg:col-span-7 space-y-6'>
              <div className='bg-white border border-gray-100 rounded-3xl p-6 shadow-xs'>
                <div className='flex items-center gap-2 text-[#127058] mb-5'>
                  <Truck size={20} />
                  <h2 className='font-black text-gray-950 text-lg'>Shipping Address</h2>
                </div>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>Full Name</label>
                    <input type='text' required autoComplete='name' placeholder='Your full name' value={shippingInfo.name} onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })} className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#127058] focus:bg-white transition-all' />
                  </div>
                  <div>
                    <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>Email Address</label>
                    <input type='email' required autoComplete='email' placeholder='you@example.com' value={shippingInfo.email} onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })} className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#127058] focus:bg-white transition-all' />
                  </div>
                  <div>
                    <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>Street Address</label>
                    <input type='text' required placeholder='123 Main St, Apt 4B' value={shippingInfo.address} onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })} className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#127058] focus:bg-white transition-all' />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>City</label>
                      <input type='text' required placeholder='Nairobi' value={shippingInfo.city} onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })} className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#127058] focus:bg-white transition-all' />
                    </div>
                    <div>
                      <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>ZIP / Postal Code</label>
                      <input type='text' required placeholder='00100' value={shippingInfo.zip} onChange={(e) => setShippingInfo({ ...shippingInfo, zip: e.target.value })} className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#127058] focus:bg-white transition-all' />
                    </div>
                  </div>
                </div>
              </div>

              <div className='bg-white border border-gray-100 rounded-3xl p-6 shadow-xs'>
                <div className='flex items-center gap-2 text-[#127058] mb-5'>
                  <CreditCard size={20} />
                  <h2 className='font-black text-gray-950 text-lg'>How would you like to pay?</h2>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6'>
                  <button
                    type='button'
                    onClick={() => setPaymentPlan('full')}
                    className={`p-4 border rounded-2xl flex flex-col items-start gap-2 transition-all text-left ${paymentPlan === 'full' ? 'border-[#127058] bg-[#127058]/5 ring-2 ring-[#127058]/20' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                  >
                    <Banknote size={22} className='text-[#127058]' />
                    <span className='font-bold text-sm text-gray-950'>Pay in full</span>
                    <span className='text-[11px] font-medium text-gray-400'>One-time payment of ${finalTotal.toLocaleString()}</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => canUseInstallment && setPaymentPlan('installment')}
                    disabled={!canUseInstallment}
                    className={`p-4 border rounded-2xl flex flex-col items-start gap-2 transition-all text-left ${paymentPlan === 'installment' ? 'border-[#127058] bg-[#127058]/5 ring-2 ring-[#127058]/20' : 'border-gray-100 bg-white hover:bg-gray-50'} ${!canUseInstallment ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Calendar size={22} className='text-[#127058]' />
                    <span className='font-bold text-sm text-gray-950'>Pay in installments</span>
                    <span className='text-[11px] font-medium text-gray-400'>
                      {canUseInstallment
                        ? 'Finance officer reviews your request'
                        : 'Available for a single device only'}
                    </span>
                  </button>
                </div>

                {paymentPlan === 'full' && (
                  <>
                    <div className='grid grid-cols-2 gap-4 mb-6'>
                      <button type='button' onClick={() => setPaymentMethod('card')} className={`p-4 border rounded-2xl flex flex-col items-start gap-1 transition-all text-left ${paymentMethod === 'card' ? 'border-[#127058] bg-[#127058]/5 ring-2 ring-[#127058]/20' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
                        <span className='font-bold text-sm text-gray-950'>Credit / Debit Card</span>
                        <span className='text-[11px] font-medium text-gray-400'>Visa, Mastercard, Amex</span>
                      </button>
                      <button type='button' onClick={() => setPaymentMethod('wallet')} className={`p-4 border rounded-2xl flex flex-col items-start gap-1 transition-all text-left ${paymentMethod === 'wallet' ? 'border-[#127058] bg-[#127058]/5 ring-2 ring-[#127058]/20' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
                        <span className='font-bold text-sm text-gray-950'>Digital Wallet</span>
                        <span className='text-[11px] font-medium text-gray-400'>Simulated quick pay</span>
                      </button>
                    </div>

                    {paymentMethod === 'card' ? (
                      <div className='space-y-4'>
                        <div>
                          <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>Card Number</label>
                          <input type='text' required={paymentPlan === 'full'} placeholder='4111 2222 3333 4444' value={cardInfo.number} onChange={(e) => setCardInfo({ ...cardInfo, number: e.target.value })} className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#127058] focus:bg-white transition-all' />
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>Expiration Date</label>
                            <input type='text' required={paymentPlan === 'full'} placeholder='MM/YY' value={cardInfo.expiry} onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value })} className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#127058] focus:bg-white transition-all' />
                          </div>
                          <div>
                            <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>Security Code (CVC)</label>
                            <input type='text' required={paymentPlan === 'full'} placeholder='123' value={cardInfo.cvc} onChange={(e) => setCardInfo({ ...cardInfo, cvc: e.target.value })} className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#127058] focus:bg-white transition-all' />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className='p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-center text-sm font-medium text-emerald-800'>
                        Your wallet balance will be charged for the full amount.
                      </div>
                    )}
                  </>
                )}

                {paymentPlan === 'installment' && canUseInstallment && (
                  <div className='space-y-4'>
                    {approvedFinancingId ? (
                      <div className='p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-900'>
                        <strong>Your financing is approved.</strong> Complete your order below — monthly payments will be scheduled automatically.
                      </div>
                    ) : (
                      <>
                        <p className='text-sm text-gray-600'>
                          Submit a financing request. A finance officer will approve or reject it. You can complete your purchase after approval.
                        </p>
                        <div>
                          <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>
                            Installment period: {installmentMonths} months
                          </label>
                          <input
                            type='range'
                            min={3}
                            max={24}
                            step={3}
                            value={installmentMonths}
                            onChange={(e) => setInstallmentMonths(Number(e.target.value))}
                            className='w-full accent-[#127058]'
                          />
                          <p className='text-sm text-gray-600 mt-2'>
                            Estimated <strong>${estimatedMonthly}/mo</strong> (12% APR, device price only)
                          </p>
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>Monthly income ($)</label>
                            <input type='number' required min={1} placeholder='2500' value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#127058] focus:bg-white transition-all' />
                          </div>
                          <div>
                            <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>Existing debts ($)</label>
                            <input type='number' min={0} placeholder='0' value={existingDebts} onChange={(e) => setExistingDebts(e.target.value)} className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#127058] focus:bg-white transition-all' />
                          </div>
                        </div>
                        <div>
                          <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>Employment status</label>
                          <select value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)} className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-[#127058] focus:bg-white transition-all'>
                            {EMPLOYMENT_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className='lg:col-span-5 space-y-6 lg:sticky lg:top-24'>
              <div className='bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col max-h-[85vh]'>
                <h2 className='font-black text-gray-950 text-lg mb-4'>Order Review</h2>

                <div className='flex-grow overflow-y-auto divide-y divide-gray-50 pr-1 max-h-[250px] lg:max-h-[350px] mb-4 space-y-3'>
                  {cart.map((item) => (
                    <div key={item.id} className='flex gap-4 pt-3 first:pt-0 items-center justify-between'>
                      <div className='flex gap-3 items-center'>
                        <div className='w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl p-1 flex-shrink-0 flex items-center justify-center overflow-hidden'>
                          <img src={item.img} alt={item.title} className='object-contain w-full h-full' />
                        </div>
                        <div>
                          <h4 className='font-bold text-gray-900 text-xs line-clamp-1 max-w-[180px]'>{item.title}</h4>
                          <span className='text-[10px] text-gray-400 font-bold'>Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <span className='text-xs font-black text-gray-950'>${item.current_price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className='border-t border-gray-100 pt-4 space-y-2.5'>
                  <div className='flex justify-between text-xs font-semibold text-gray-500'>
                    <span>Items Subtotal:</span>
                    <span className='text-gray-950 font-bold'>${cartTotal}</span>
                  </div>
                  <div className='flex justify-between text-xs font-semibold text-gray-500'>
                    <span>Shipping Delivery:</span>
                    <span className='text-gray-950 font-bold'>{shippingFee === 0 ? 'FREE' : `$${shippingFee}`}</span>
                  </div>
                  <div className='flex justify-between text-xs font-semibold text-gray-500'>
                    <span>Estimated Local Tax:</span>
                    <span className='text-gray-950 font-bold'>${estimatedTax}</span>
                  </div>
                  {paymentPlan === 'installment' && !approvedFinancingId && (
                    <p className='text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2'>
                      Installment plan applies to device price; due today after approval: monthly payments only.
                    </p>
                  )}
                  <div className='border-t border-gray-100 pt-3 flex justify-between items-baseline'>
                    <span className='text-sm font-bold text-gray-950'>
                      {paymentPlan === 'installment' && !approvedFinancingId ? 'Device price:' : 'Final Amount:'}
                    </span>
                    <span className='text-2xl font-black text-[#127058]'>
                      ${paymentPlan === 'installment' && !approvedFinancingId ? cartTotal : finalTotal}
                    </span>
                  </div>
                </div>

                <div className='mt-6 space-y-3'>
                  <button
                    type='submit'
                    disabled={isProcessing}
                    className='w-full bg-[#127058] hover:bg-[#0e5845] text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2.5 text-base disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isProcessing ? (
                      <span className='animate-pulse'>Processing…</span>
                    ) : (
                      <>
                        <ShieldCheck size={20} />
                        <span>{submitLabel}</span>
                      </>
                    )}
                  </button>

                  <div className='flex items-center justify-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-wider text-center'>
                    <ShieldCheck size={14} className='text-emerald-600' />
                    <span>256-Bit SSL Encrypted Endpoint Protection</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
