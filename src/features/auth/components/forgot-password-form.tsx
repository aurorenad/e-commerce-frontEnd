import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import * as authService from '../../../services/auth.service';
import { getErrorMessage } from '../../../lib/api';

export default function ForgetPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await authService.forgotPassword(email.trim());
      sessionStorage.setItem('pending_verify_email', email.trim());
      if (result.otpCode) {
        sessionStorage.setItem('dev_otp', result.otpCode);
      }
      setIsSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className='min-h-screen bg-[#FAFAFB] flex items-center justify-center p-4'>
        <div className='w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8 text-center space-y-6'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600'>
            <CheckCircle2 size={28} />
          </div>
          <div className='space-y-2'>
            <h1 className='text-2xl font-bold tracking-tight text-gray-900'>Check your email</h1>
            <p className='text-sm text-gray-500 leading-relaxed'>
              We sent a reset code to <span className='font-semibold text-gray-900'>{email}</span>.
            </p>
          </div>
          <button
            type='button'
            onClick={() => navigate('/ResetPassword')}
            className='w-full bg-[#127058] text-white font-semibold py-3 rounded-xl'
          >
            Enter reset code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#FAFAFB] flex items-center justify-center p-4'>
      <div className='w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8 space-y-6'>
        <div className='text-center space-y-1.5'>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900'>Forgot Your Password?</h1>
          <p className='text-sm text-gray-500 leading-relaxed'>
            Enter your registered email and we will send a reset code.
          </p>
        </div>

        {error && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600'>{error}</div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-1.5'>
            <label className='text-sm font-semibold text-gray-700 block'>Email address</label>
            <div className='relative flex items-center'>
              <span className='absolute left-3.5 text-gray-400'><Mail size={18} /></span>
              <input
                type='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className='w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#127058]'
                placeholder='name@company.com'
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='w-full bg-[#127058] hover:bg-[#0e5845] text-white font-semibold py-3 rounded-xl disabled:opacity-70'
          >
            {isLoading ? 'Sending...' : 'Send reset code'}
          </button>
        </form>

        <a href='/login' className='inline-flex items-center gap-2 text-sm font-semibold text-[#127058] mx-auto'>
          <ArrowLeft size={16} /> Back to login
        </a>
      </div>
    </div>
  );
}
