import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Info,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Phone,
  CircleCheckBig,
} from 'lucide-react';
import * as authService from '../../../services/auth.service';
import { getErrorMessage } from '../../../lib/api';

export default function RegisterForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Live validation checks
  const isMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = isMinLength && hasUppercase && hasNumberOrSymbol;

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Prevent submission if password validation rules fail
    if (!isPasswordValid) {
      setError('Please meet all security requirements for your password.');
      return;
    }

    setIsLoading(true);

    try {
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] || 'User';
      const lastName = parts.slice(1).join(' ') || 'Account';

      const result = await authService.register({
        firstName,
        lastName,
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });

      sessionStorage.setItem('pending_verify_email', result.email);
      if (result.otpCode) {
        sessionStorage.setItem('dev_otp', result.otpCode);
      }

      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Success Screen ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div className='min-h-screen bg-[#FAFAFB] flex items-center justify-center p-4 py-12'>
        <div className='w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8 text-center space-y-4'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600'>
            <CircleCheckBig size={28} />
          </div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Registration successful!
          </h1>
          <p className='text-sm text-gray-500'>
            We sent a verification code to{' '}
            <span className='font-semibold text-gray-700'>{email}</span>.
          </p>
          <button
            type='button'
            onClick={() => navigate('/VerifyOtpForm')}
            className='inline-flex w-full items-center justify-center bg-[#127058] hover:bg-[#0e5845] text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm'
          >
            Verify email
          </button>
        </div>
      </div>
    );
  }

  // ─── Registration Form ────────────────────────────────────────────────────
  return (
    <div className='min-h-screen bg-[#FAFAFB] flex items-center justify-center p-4 py-12'>
      <div className='w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8 space-y-6'>

        {/* Header section with brand context */}
        <div className='text-center space-y-1'>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900'>
            Create your account
          </h1>
          <p className='text-sm text-gray-500'>
            Join the transparent marketplace for certified tech.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>

          {/* ── Name Field ───────────────────────────────────────────────── */}
          <div className='space-y-1.5'>
            <label className='text-sm font-semibold text-gray-700 block'>
              Full Name
            </label>
            <div className='relative flex items-center'>
              <span className='absolute left-3.5 text-gray-400'>
                <User size={18} />
              </span>
              <input
                type='text'
                placeholder='John Doe'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
                className='w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#127058] focus:bg-white focus:ring-2 focus:ring-[#127058]/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed'
              />
            </div>
          </div>

          {/* ── Email Field ──────────────────────────────────────────────── */}
          <div className='space-y-1.5'>
            <label className='text-sm font-semibold text-gray-700 block'>
              Email address
            </label>
            <div className='relative flex items-center'>
              <span className='absolute left-3.5 text-gray-400'>
                <Mail size={18} />
              </span>
              <input
                type='email'
                placeholder='john@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className='w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#127058] focus:bg-white focus:ring-2 focus:ring-[#127058]/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed'
              />
            </div>
            <div className='flex items-start gap-2 pt-0.5 px-0.5'>
              <Info size={16} className='text-gray-400 mt-0.5 flex-shrink-0' />
              <p className='text-gray-500 text-xs leading-normal'>
                We'll send a verification code here.
              </p>
            </div>
          </div>

          {/* ── Phone Field ──────────────────────────────────────────────── */}
          <div className='space-y-1.5'>
            <label className='text-sm font-semibold text-gray-700 block'>
              Phone Number
            </label>
            <div className='relative flex items-center'>
              <span className='absolute left-3.5 text-gray-400'>
                <Phone size={18} />
              </span>
              <input
                type='tel'
                placeholder='0788 888-888'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
                className='w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#127058] focus:bg-white focus:ring-2 focus:ring-[#127058]/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed'
              />
            </div>
          </div>

          {/* ── Password Field ───────────────────────────────────────────── */}
          <div className='space-y-2'>
            <label className='text-sm font-semibold text-gray-700 block'>
              Password
            </label>

            <div className='relative flex items-center'>
              <span className='absolute left-3.5 text-gray-400'>
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className='w-full pl-11 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#127058] focus:bg-white focus:ring-2 focus:ring-[#127058]/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className='absolute right-3.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none disabled:opacity-40'
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Live Security Requirements Checklist */}
            <div className='bg-gray-50 border border-gray-100 rounded-xl p-3.5 space-y-2 mt-2'>
              <p className='text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                Security Requirements
              </p>
              <div className='space-y-1.5 text-xs'>

                {/* Rule 1: Length */}
                <p
                  className={`flex items-center gap-2 transition-colors ${
                    isMinLength ? 'text-emerald-600 font-medium' : 'text-gray-400'
                  }`}
                >
                  <CircleCheckBig
                    size={14}
                    className={`flex-shrink-0 transition-all ${
                      isMinLength ? 'text-emerald-500 scale-110' : 'text-gray-300'
                    }`}
                  />
                  <span>At least 8 characters</span>
                </p>

                {/* Rule 2: Uppercase */}
                <p
                  className={`flex items-center gap-2 transition-colors ${
                    hasUppercase ? 'text-emerald-600 font-medium' : 'text-gray-400'
                  }`}
                >
                  <CircleCheckBig
                    size={14}
                    className={`flex-shrink-0 transition-all ${
                      hasUppercase ? 'text-emerald-500 scale-110' : 'text-gray-300'
                    }`}
                  />
                  <span>At least one uppercase letter</span>
                </p>

                {/* Rule 3: Number or Symbol */}
                <p
                  className={`flex items-center gap-2 transition-colors ${
                    hasNumberOrSymbol ? 'text-emerald-600 font-medium' : 'text-gray-400'
                  }`}
                >
                  <CircleCheckBig
                    size={14}
                    className={`flex-shrink-0 transition-all ${
                      hasNumberOrSymbol ? 'text-emerald-500 scale-110' : 'text-gray-300'
                    }`}
                  />
                  <span>One number or symbol</span>
                </p>

              </div>
            </div>
          </div>

          {/* ── Submit Button ────────────────────────────────────────────── */}
          <button
            type='submit'
            disabled={isLoading}
            className='w-full flex items-center justify-center gap-2 bg-[#127058] hover:bg-[#0e5845] active:bg-[#0b4a3a] text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm mt-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#127058]/40'
          >
            {isLoading ? (
              <>
                {/* Spinner */}
                <svg
                  className='animate-spin h-4 w-4 text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                  />
                </svg>
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight size={16} />
              </>
            )}
          </button>

        </form>

        {/* ── Form Footer ───────────────────────────────────────────────────── */}
        <p className='text-center text-sm text-gray-500'>
          Already have an account?{' '}
          <a
            href='/login'
            className='font-semibold text-[#127058] hover:text-[#0e5845] hover:underline transition-colors'
          >
            Sign in
          </a>
        </p>

      </div>
    </div>
  );
}