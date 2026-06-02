import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submitSellDevice, type SellDeviceAiEvaluation } from '../../services/devices.service';
import { fetchProfile } from '../../services/users.service';
import { getErrorMessage } from '../../lib/api';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Camera,
  Gamepad2,
  Upload,
  X,
  Cpu,
  BatteryCharging,
  HardDrive,
  Palette,
  Tag,
  MapPin,
  Phone,
  Mail,
  User,
  Info,
  Banknote,
  Shield,
} from 'lucide-react';
import Navbar from '../../shared/components/nav';
import Footer from '../../shared/components/Footer';

// ─── Step Config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Device Type',  short: 'Type'    },
  { id: 2, label: 'Device Info',  short: 'Details' },
  { id: 3, label: 'Condition',    short: 'Grade'   },
  { id: 4, label: 'Your Details', short: 'Contact' },
  { id: 5, label: 'Review',       short: 'Submit'  },
];

// ─── Device Categories ────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'Smartphone',  label: 'Smartphone',  icon: Smartphone  },
  { id: 'Laptop',      label: 'Laptop',      icon: Laptop      },
  { id: 'Tablet',      label: 'Tablet',      icon: Tablet      },
  { id: 'Smartwatch',  label: 'Smartwatch',  icon: Watch       },
  { id: 'Camera',      label: 'Camera',      icon: Camera      },
  { id: 'Gaming',      label: 'Gaming',      icon: Gamepad2    },
];

// ─── Condition Grades ─────────────────────────────────────────────────────────
const CONDITIONS = [
  {
    id: 'Excellent',
    label: 'Excellent',
    grade: 'Grade A',
    color: 'emerald',
    desc: 'Like new. No scratches, dents, or signs of use. All functions work perfectly.',
  },
  {
    id: 'Good',
    label: 'Good',
    grade: 'Grade B',
    color: 'blue',
    desc: 'Minor signs of use. Small scratches only. All features fully functional.',
  },
  {
    id: 'Fair',
    label: 'Fair',
    grade: 'Grade C',
    color: 'amber',
    desc: 'Visible wear, scratches or dents. Device works but may have cosmetic issues.',
  },
  {
    id: 'Poor',
    label: 'For Parts',
    grade: 'Grade D',
    color: 'red',
    desc: 'Heavy damage or not fully functional. Suitable for repair or parts only.',
  },
];

const CONDITION_COLORS: Record<string, string> = {
  emerald: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  blue:    'border-blue-400    bg-blue-50    text-blue-700',
  amber:   'border-amber-400   bg-amber-50   text-amber-700',
  red:     'border-red-400     bg-red-50     text-red-700',
};

const CONDITION_SELECTED: Record<string, string> = {
  emerald: 'ring-2 ring-emerald-400 border-emerald-400',
  blue:    'ring-2 ring-blue-400    border-blue-400',
  amber:   'ring-2 ring-amber-400   border-amber-400',
  red:     'ring-2 ring-red-400     border-red-400',
};

// ─── Form State Type ──────────────────────────────────────────────────────────
interface FormData {
  category: string;
  brand: string;
  model: string;
  storage: string;
  ram: string;
  color: string;
  batteryHealth: string;
  imei: string;
  purchaseYear: string;
  accessories: string[];
  condition: string;
  defects: string;
  askingPrice: string;
  images: File[];
  name: string;
  email: string;
  phone: string;
  location: string;
  preferredContact: string;
}

const INITIAL_FORM: FormData = {
  category: '', brand: '', model: '', storage: '', ram: '',
  color: '', batteryHealth: '', imei: '', purchaseYear: '',
  accessories: [], condition: '', defects: '', askingPrice: '',
  images: [], name: '', email: '', phone: '', location: '',
  preferredContact: 'email',
};

const ACCESSORY_OPTIONS = [
  'Original Box', 'Charger', 'Earphones', 'Case/Cover',
  'Screen Protector', 'Manual / Docs', 'Extra Cable',
];

// ─── Helper: Label + Input wrapper ───────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-sm font-bold text-gray-700'>{label}</label>
      {children}
      {hint && <p className='text-xs text-gray-400'>{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:border-[#127058]/60 focus:ring-2 focus:ring-[#127058]/10';
const selectCls = `${inputCls} cursor-pointer appearance-none`;

// ─── Step Components ──────────────────────────────────────────────────────────

function Step1({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-black text-gray-900'>What type of device are you selling?</h2>
        <p className='text-gray-500 text-sm mt-1'>Choose the category that best describes your device.</p>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type='button'
            onClick={() => set('category', id)}
            className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${
              data.category === id
                ? 'border-[#127058] bg-[#127058]/5 shadow-sm shadow-[#127058]/20'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              data.category === id ? 'bg-[#127058] text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              <Icon className='w-5 h-5' />
            </div>
            <span className={`text-sm font-bold ${data.category === id ? 'text-[#127058]' : 'text-gray-600'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step2({ data, set }: { data: FormData; set: (k: keyof FormData, v: string | string[]) => void }) {
  function toggleAccessory(item: string) {
    const current = data.accessories;
    set('accessories', current.includes(item) ? current.filter((a) => a !== item) : [...current, item]);
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-black text-gray-900'>Tell us about your device</h2>
        <p className='text-gray-500 text-sm mt-1'>The more detail you provide, the better your valuation estimate.</p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <Field label='Brand *'>
          <div className='relative'>
            <Tag className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input className={`${inputCls} pl-10`} placeholder='e.g. Apple, Samsung, Lenovo' value={data.brand}
              onChange={(e) => set('brand', e.target.value)} />
          </div>
        </Field>

        <Field label='Model *'>
          <div className='relative'>
            <Cpu className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input className={`${inputCls} pl-10`} placeholder='e.g. iPhone 14 Pro, Galaxy S23' value={data.model}
              onChange={(e) => set('model', e.target.value)} />
          </div>
        </Field>

        <Field label='Storage'>
          <div className='relative'>
            <HardDrive className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <select className={`${selectCls} pl-10`} value={data.storage} onChange={(e) => set('storage', e.target.value)}>
              <option value=''>Select storage</option>
              {['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB', 'Other'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </Field>

        <Field label='RAM (if applicable)'>
          <div className='relative'>
            <Cpu className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <select className={`${selectCls} pl-10`} value={data.ram} onChange={(e) => set('ram', e.target.value)}>
              <option value=''>Select RAM</option>
              {['2GB', '4GB', '6GB', '8GB', '12GB', '16GB', '32GB', 'N/A'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </Field>

        <Field label='Color'>
          <div className='relative'>
            <Palette className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input className={`${inputCls} pl-10`} placeholder='e.g. Midnight Black, Silver' value={data.color}
              onChange={(e) => set('color', e.target.value)} />
          </div>
        </Field>

        <Field label='Battery Health (%)' hint='Check in device settings if available'>
          <div className='relative'>
            <BatteryCharging className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input className={`${inputCls} pl-10`} placeholder='e.g. 89' type='number' min='1' max='100'
              value={data.batteryHealth} onChange={(e) => set('batteryHealth', e.target.value)} />
          </div>
        </Field>

        <Field label='Year of Purchase'>
          <select className={selectCls} value={data.purchaseYear} onChange={(e) => set('purchaseYear', e.target.value)}>
            <option value=''>Select year</option>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </Field>

        <Field label='IMEI / Serial Number' hint='Optional, but helps verify authenticity'>
          <input className={inputCls} placeholder='Enter IMEI or serial number' value={data.imei}
            onChange={(e) => set('imei', e.target.value)} />
        </Field>
      </div>

      {/* Asking Price */}
      <Field label='Your Asking Price (USD) *'>
        <div className='relative'>
          <Banknote className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
          <input className={`${inputCls} pl-10`} placeholder='e.g. 350' type='number' min='1'
            value={data.askingPrice} onChange={(e) => set('askingPrice', e.target.value)} />
        </div>
        <p className='text-xs text-[#127058] font-medium mt-1 flex items-center gap-1'>
          <Info className='w-3.5 h-3.5' />
          Our AI will review your price and suggest a fair market value after submission.
        </p>
      </Field>

      {/* Accessories */}
      <Field label='Included Accessories'>
        <div className='flex flex-wrap gap-2 mt-1'>
          {ACCESSORY_OPTIONS.map((item) => (
            <button
              key={item}
              type='button'
              onClick={() => toggleAccessory(item)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                data.accessories.includes(item)
                  ? 'bg-[#127058] text-white border-[#127058]'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function Step3({ data, set, images, setImages }: {
  data: FormData;
  set: (k: keyof FormData, v: string) => void;
  images: File[];
  setImages: (f: File[]) => void;
}) {
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setImages([...images, ...files].slice(0, 6));
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-black text-gray-900'>Device condition & photos</h2>
        <p className='text-gray-500 text-sm mt-1'>Honest grading leads to faster approvals and better offers.</p>
      </div>

      {/* Condition selector */}
      <Field label='Select Condition *'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1'>
          {CONDITIONS.map((c) => (
            <button
              key={c.id}
              type='button'
              onClick={() => set('condition', c.id)}
              className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                data.condition === c.id
                  ? CONDITION_SELECTED[c.color]
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <span className={`mt-0.5 flex-shrink-0 text-xs font-black px-2 py-1 rounded-lg ${CONDITION_COLORS[c.color]}`}>
                {c.grade}
              </span>
              <div>
                <p className='font-bold text-gray-800 text-sm'>{c.label}</p>
                <p className='text-xs text-gray-500 leading-relaxed mt-0.5'>{c.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Field>

      {/* Defects */}
      <Field label='Known Defects or Issues' hint='Be specific — e.g. "cracked back glass", "battery drains fast"'>
        <textarea
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder='Describe any damage, faults, or issues with the device...'
          value={data.defects}
          onChange={(e) => set('defects', e.target.value)}
        />
      </Field>

      {/* Image upload */}
      <Field label={`Photos (${images.length}/6)`} hint='Upload clear photos: front, back, sides, screen, any damage'>
        <div className='grid grid-cols-3 sm:grid-cols-6 gap-3 mt-1'>
          {images.map((file, i) => (
            <div key={i} className='relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group'>
              <img src={URL.createObjectURL(file)} alt='' className='w-full h-full object-cover' />
              <button
                type='button'
                onClick={() => removeImage(i)}
                className='absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity'
              >
                <X className='w-3 h-3' />
              </button>
            </div>
          ))}
          {images.length < 6 && (
            <label className='aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#127058] bg-gray-50 hover:bg-[#127058]/5 flex flex-col items-center justify-center cursor-pointer transition-all'>
              <Upload className='w-5 h-5 text-gray-400' />
              <span className='text-[10px] text-gray-400 mt-1 font-medium'>Add photo</span>
              <input type='file' accept='image/*' multiple className='hidden' onChange={handleImageUpload} />
            </label>
          )}
        </div>
      </Field>
    </div>
  );
}

function Step4({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  const hasProfileContact = Boolean(data.name && data.email && data.phone);

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-black text-gray-900'>Your contact details</h2>
        <p className='text-gray-500 text-sm mt-1'>
          These details are synced from your account profile and cannot be edited here.
        </p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <Field label='Full Name *'>
          <div className='relative'>
            <User className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input className={`${inputCls} pl-10 opacity-80`} placeholder='Full name from profile' value={data.name} readOnly />
          </div>
        </Field>

        <Field label='Phone Number *'>
          <div className='relative'>
            <Phone className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input className={`${inputCls} pl-10 opacity-80`} placeholder='Phone from profile' type='tel' value={data.phone} readOnly />
          </div>
        </Field>

        <Field label='Email Address *'>
          <div className='relative'>
            <Mail className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input className={`${inputCls} pl-10 opacity-80`} placeholder='Email from profile' type='email' value={data.email} readOnly />
          </div>
        </Field>

        <Field label='Your Location'>
          <div className='relative'>
            <MapPin className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              className={`${inputCls} pl-10 opacity-80`}
              placeholder='Location from profile (optional)'
              value={data.location || 'Not set in profile'}
              readOnly
            />
          </div>
        </Field>
      </div>

      <Field label='Preferred Contact Method'>
        <div className='flex gap-3'>
          {['email', 'phone', 'whatsapp'].map((method) => (
            <button
              key={method}
              type='button'
              onClick={() => set('preferredContact', method)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 capitalize transition-all ${
                data.preferredContact === method
                  ? 'border-[#127058] bg-[#127058]/5 text-[#127058]'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </Field>

      {!hasProfileContact && (
        <div className='bg-amber-50 border border-amber-200 rounded-2xl p-4'>
          <p className='text-sm font-bold text-amber-700'>Missing profile contact details</p>
          <p className='text-xs text-amber-700 mt-1'>
            Please update your profile with name, email, and phone before submitting a sell request.
          </p>
        </div>
      )}

      <div className='bg-[#127058]/5 border border-[#127058]/20 rounded-2xl p-4 flex gap-3'>
        <Shield className='w-5 h-5 text-[#127058] flex-shrink-0 mt-0.5' />
        <div>
          <p className='text-sm font-bold text-[#127058]'>Need to change your contact details?</p>
          <p className='text-xs text-gray-600 mt-0.5 leading-relaxed'>
            Update them from your profile page, then come back to continue this submission.
          </p>
          <Link to='/profile' className='inline-block mt-2 text-xs font-semibold text-[#127058] hover:underline'>
            Go to Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

function Step5({ data, images }: { data: FormData; images: File[] }) {
  const condition = CONDITIONS.find((c) => c.id === data.condition);
  const category  = CATEGORIES.find((c) => c.id === data.category);
  const Icon      = category?.icon ?? Smartphone;

  const rows = [
    { label: 'Device Type',   value: data.category    },
    { label: 'Brand',         value: data.brand       },
    { label: 'Model',         value: data.model       },
    { label: 'Storage',       value: data.storage     },
    { label: 'RAM',           value: data.ram         },
    { label: 'Color',         value: data.color       },
    { label: 'Battery Health',value: data.batteryHealth ? `${data.batteryHealth}%` : '—' },
    { label: 'Year',          value: data.purchaseYear },
    { label: 'Condition',     value: data.condition   },
    { label: 'Asking Price',  value: data.askingPrice ? `$${data.askingPrice}` : '—' },
    { label: 'Accessories',   value: data.accessories.length ? data.accessories.join(', ') : 'None' },
    { label: 'Contact Name',  value: data.name        },
    { label: 'Phone',         value: data.phone       },
    { label: 'Email',         value: data.email       },
    { label: 'Location',      value: data.location    },
  ].filter((r) => r.value);

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-black text-gray-900'>Review your submission</h2>
        <p className='text-gray-500 text-sm mt-1'>Double-check everything before sending. You can go back to make changes.</p>
      </div>

      {/* Device summary card */}
      <div className='flex items-center gap-4 bg-gradient-to-r from-[#127058]/8 to-[#6E9F94]/8 border border-[#127058]/20 rounded-2xl p-4'>
        <div className='w-12 h-12 bg-[#127058] rounded-xl flex items-center justify-center flex-shrink-0'>
          <Icon className='w-6 h-6 text-white' />
        </div>
        <div>
          <p className='font-black text-gray-900 text-base'>{data.brand} {data.model}</p>
          <div className='flex items-center gap-2 mt-0.5 flex-wrap'>
            <span className='text-xs text-gray-500'>{data.category}</span>
            {condition && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CONDITION_COLORS[condition.color]}`}>
                {condition.grade}
              </span>
            )}
            {data.askingPrice && (
              <span className='text-xs font-bold text-[#127058]'>${data.askingPrice}</span>
            )}
          </div>
        </div>
      </div>

      {/* Detail table */}
      <div className='bg-white border border-gray-200 rounded-2xl overflow-hidden'>
        {rows.map((row, i) => (
          <div key={row.label} className={`flex justify-between items-center px-4 py-3 ${i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
            <span className='text-sm text-gray-500 font-medium'>{row.label}</span>
            <span className='text-sm text-gray-900 font-semibold text-right max-w-[55%] truncate'>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Images preview */}
      {images.length > 0 && (
        <div>
          <p className='text-sm font-bold text-gray-700 mb-2'>Uploaded Photos ({images.length})</p>
          <div className='flex gap-2 flex-wrap'>
            {images.map((file, i) => (
              <img key={i} src={URL.createObjectURL(file)} alt=''
                className='w-16 h-16 rounded-xl object-cover border border-gray-200' />
            ))}
          </div>
        </div>
      )}

      {/* Defects */}
      {data.defects && (
        <div className='bg-amber-50 border border-amber-200 rounded-xl p-3'>
          <p className='text-xs font-bold text-amber-700 mb-1'>Noted Defects</p>
          <p className='text-sm text-amber-800'>{data.defects}</p>
        </div>
      )}
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ evaluation }: { evaluation?: SellDeviceAiEvaluation | null }) {
  return (
    <div className='text-center py-16 px-6'>
      <div className='w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6'>
        <CheckCircle2 className='w-10 h-10 text-emerald-600' />
      </div>
      <h2 className='text-2xl font-black text-gray-900 mb-3'>Submission Received!</h2>
      {evaluation && (
        <div className='max-w-md mx-auto mb-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left'>
          <p className='text-sm font-bold text-emerald-800 mb-2'>AI valuation estimate</p>
          <p className='text-2xl font-black text-emerald-900'>
            ${evaluation.tradeInRecommendation.toLocaleString()}
          </p>
          <p className='text-xs text-emerald-700 mt-2 leading-relaxed'>{evaluation.reasoning}</p>
          <p className='text-xs text-gray-500 mt-3'>
            Final offer subject to finance officer review after device inspection.
          </p>
        </div>
      )}
      <p className='text-gray-500 max-w-sm mx-auto leading-relaxed mb-8'>
        Thank you for listing your device. Our finance team will review your submission and confirm
        your offer{evaluation ? '' : ' within'} <strong className='text-gray-700'>24 hours</strong>.
      </p>
      <div className='flex flex-col sm:flex-row gap-3 justify-center'>
        <Link
          to='/marketplace'
          className='inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#127058] hover:bg-[#0e5845] text-white font-bold rounded-xl transition-colors shadow-sm'
        >
          Browse Marketplace
        </Link>
        <Link
          to='/'
          className='inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors'
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SellDevice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep]       = useState(1);
  const [submitted, setSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aiEvaluation, setAiEvaluation] = useState<SellDeviceAiEvaluation | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [form, setForm]       = useState<FormData>(INITIAL_FORM);
  const [images, setImages]   = useState<File[]>([]);

  function set(key: keyof FormData, value: string | string[]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canAdvance() {
    if (step === 1) return !!form.category;
    if (step === 2) return !!(form.brand && form.model && form.askingPrice);
    if (step === 3) return !!form.condition;
    if (step === 4) return !profileLoading && !!(form.name && form.phone && form.email);
    return true;
  }

  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    fetchProfile()
      .then((profile) => {
        const fullName = `${profile.firstName} ${profile.lastName}`.trim();
        setForm((prev) => ({
          ...prev,
          name: fullName,
          email: profile.email ?? '',
          phone: profile.phone ?? '',
        }));
      })
      .catch((err) => {
        setSubmitError(getErrorMessage(err));
      })
      .finally(() => {
        setProfileLoading(false);
      });
  }, [user]);

  async function handleSubmit() {
    if (!user) {
      navigate('/login', { state: { from: '/Sell-Your-Device' } });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const defectNotes = [
      form.defects,
      form.accessories.length ? `Accessories: ${form.accessories.join(', ')}` : '',
      form.imei ? `IMEI: ${form.imei}` : '',
      form.purchaseYear ? `Purchase year: ${form.purchaseYear}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const payload = new FormData();
    payload.append('brand', form.brand);
    payload.append('model', form.model);
    payload.append('condition', form.condition);
    payload.append('category', form.category);
    if (form.batteryHealth) payload.append('batteryHealth', form.batteryHealth);
    if (form.askingPrice) payload.append('askingPrice', form.askingPrice);
    if (form.storage) payload.append('storage', form.storage);
    if (form.ram) payload.append('ram', form.ram);
    if (form.color) payload.append('color', form.color);
    if (form.location) payload.append('location', form.location);
    if (defectNotes) payload.append('defects', defectNotes);
    images.forEach((file) => payload.append('images', file));

    try {
      const result = await submitSellDevice(payload);
      setAiEvaluation(result.aiEvaluation);
      setSubmit(true);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />

      {/* Page hero band */}
      <div className='bg-gradient-to-br from-[#0b4738] via-[#127058] to-[#6E9F94] text-white'>
        <div className='max-w-7xl mx-auto px-6 py-10'>
          <p className='text-[#a8d5c5] text-sm font-semibold uppercase tracking-widest mb-2'>Sell with ReviveTech</p>
          <h1 className='text-3xl md:text-4xl font-black tracking-tight'>Turn your old device into cash</h1>
          <p className='mt-2 text-[#c5e3da] text-base max-w-xl'>
            List your device in minutes. Our AI reviews it, gives you a fair price, and handles everything else.
          </p>
        </div>
      </div>

      <div className='max-w-3xl mx-auto px-6 py-10'>
        {submitted ? (
          <SuccessScreen evaluation={aiEvaluation} />
        ) : (
          <>
            {/* Step Progress Bar */}
            <div className='mb-10'>
              <div className='flex items-center justify-between relative'>
                {/* Connecting line */}
                <div className='absolute left-0 right-0 top-4 h-0.5 bg-gray-200 -z-0' />
                <div
                  className='absolute left-0 top-4 h-0.5 bg-[#127058] transition-all duration-500 -z-0'
                  style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                />

                {STEPS.map((s) => (
                  <div key={s.id} className='flex flex-col items-center gap-2 z-10'>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 ${
                      step > s.id
                        ? 'bg-[#127058] border-[#127058] text-white'
                        : step === s.id
                        ? 'bg-white border-[#127058] text-[#127058] shadow-md shadow-[#127058]/20'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {step > s.id ? <CheckCircle2 className='w-4 h-4' /> : s.id}
                    </div>
                    <span className={`text-[10px] font-bold hidden sm:block ${step === s.id ? 'text-[#127058]' : 'text-gray-400'}`}>
                      {s.short}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {submitError && (
              <p className='mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3'>
                {submitError}
              </p>
            )}

            {/* Form Card */}
            <div className='bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden'>
              <div className='p-6 sm:p-8'>
                {step === 1 && <Step1 data={form} set={set} />}
                {step === 2 && <Step2 data={form} set={set} />}
                {step === 3 && <Step3 data={form} set={set} images={images} setImages={setImages} />}
                {step === 4 && <Step4 data={form} set={set} />}
                {step === 5 && <Step5 data={form} images={images} />}
              </div>

              {/* Navigation Footer */}
              <div className='border-t border-gray-100 px-6 sm:px-8 py-4 bg-gray-50/50 flex items-center justify-between'>
                <button
                  type='button'
                  onClick={() => setStep((s) => s - 1)}
                  disabled={step === 1}
                  className='flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
                >
                  <ChevronLeft className='w-4 h-4' />
                  Back
                </button>

                <span className='text-xs text-gray-400 font-medium'>
                  Step {step} of {STEPS.length}
                </span>

                {step < STEPS.length ? (
                  <button
                    type='button'
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canAdvance()}
                    className='flex items-center gap-2 px-5 py-2.5 bg-[#127058] hover:bg-[#0e5845] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-all shadow-sm text-sm disabled:cursor-not-allowed active:scale-[0.97]'
                  >
                    Continue
                    <ChevronRight className='w-4 h-4' />
                  </button>
                ) : (
                  <button
                    type='button'
                    onClick={() => void handleSubmit()}
                    disabled={submitting}
                    className='flex items-center gap-2 px-6 py-2.5 bg-[#127058] hover:bg-[#0e5845] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-sm text-sm active:scale-[0.97]'
                  >
                    {submitting ? 'Submitting…' : 'Submit Device'}
                    <CheckCircle2 className='w-4 h-4' />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}