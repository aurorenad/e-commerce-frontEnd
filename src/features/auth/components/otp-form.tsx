import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import * as authService from '../../../services/auth.service';
import { getErrorMessage } from '../../../lib/api';

export default function VerifyOtpForm() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem('pending_verify_email') || '';
  const devOtp = sessionStorage.getItem('dev_otp');

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [timer, setTimer] = useState<number>(59);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer === 0) return;
    const intervalId = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timer]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value.substring(element.value.length - 1);
    setOtp(newOtp);

    if (element.value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split('');
    setOtp(digits);
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6 || !email) {
      setError(email ? 'Enter the 6-digit code.' : 'Missing email — register again.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await authService.verifyOtp(email, fullCode);
      sessionStorage.removeItem('dev_otp');
      setIsVerified(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setTimer(59);
    setOtp(new Array(6).fill(''));
    inputRefs.current[0]?.focus();
  };

  if (isVerified) {
    return (
      <div className='min-h-screen bg-[#FAFAFB] flex items-center justify-center p-4'>
        <div className='w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8 text-center space-y-4'>
          <CheckCircle2 className='mx-auto text-emerald-600' size={48} />
          <h1 className='text-2xl font-bold text-gray-900'>Email verified</h1>
          <p className='text-sm text-gray-500'>You can now sign in with your account.</p>
          <button
            type='button'
            onClick={() => navigate('/login')}
            className='w-full bg-[#127058] text-white font-semibold py-3 rounded-xl'
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#FAFAFB] flex items-center justify-center p-4'>
      <div className='w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8 space-y-6'>
        <button
          type='button'
          onClick={() => navigate(-1)}
          className='inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#127058]'
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className='text-center space-y-2'>
          <ShieldAlert className='mx-auto text-[#127058]' size={32} />
          <h1 className='text-2xl font-bold text-gray-900'>Verify your email</h1>
          <p className='text-sm text-gray-500'>
            Code sent to <span className='font-semibold'>{email || 'your email'}</span>
          </p>
          {devOtp && (
            <p className='text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2'>
              Email not configured — use this code: <strong>{devOtp}</strong>
            </p>
          )}
        </div>

        {error && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600'>{error}</div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='flex justify-between gap-2'>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type='text'
                inputMode='numeric'
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                className='w-12 h-14 text-center text-xl font-bold border border-gray-200 rounded-xl focus:border-[#127058] focus:ring-2 focus:ring-[#127058]/20 outline-none'
              />
            ))}
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='w-full bg-[#127058] hover:bg-[#0e5845] text-white font-semibold py-3 rounded-xl disabled:opacity-70'
          >
            {isLoading ? 'Verifying...' : 'Verify code'}
          </button>
        </form>

        <p className='text-center text-sm text-gray-500'>
          {timer > 0 ? `Resend in ${timer}s` : (
            <button type='button' onClick={handleResend} className='text-[#127058] font-semibold'>
              Resend code
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
