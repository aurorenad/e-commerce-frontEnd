import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, CreditCard, Heart, Shield,
  Edit3, Check, X, LogOut, ArrowRight, Trash2,
  ShoppingCart, ChevronRight, Bell, Lock, Smartphone,
  Star, Package, TrendingUp, Camera, MessageSquare, Send,
  Plus,
} from 'lucide-react'
import Navbar from '../shared/components/nav'
import Footer from '../shared/components/Footer'
import { useAuth } from '../context/AuthContext'
import { mapListingToCartDevice, mapApiListingToListing, mapApiOrderToCustomerOrder, mapFinancingToCustomerInstallment } from '../lib/mappers'
import type { CustomerOrder, CustomerInstallment } from '../lib/mappers'
import type { Listing } from '../features/marketplace/types'
import { useCart } from '../context/useCart'
import { fetchOrders, fetchWishlist, removeWishlistItem } from '../services/marketplace.service'
import { fetchFinancingApplications } from '../services/payments.service'
import { fetchProfile, updateProfile } from '../services/users.service'
import { getErrorMessage } from '../lib/api'
import { useSupport } from '../context/SupportContext'
import type { SupportTicket, TicketStatus } from '../context/SupportContext'

const MOCK_ACTIVITY = [
  { id: 1, icon: ShoppingBag, text: 'Order ORD-2841 delivered', time: '2 days ago', color: 'text-emerald-600' },
  { id: 2, icon: CreditCard, text: 'Installment payment — INS-7741', time: '5 days ago', color: 'text-blue-600' },
  { id: 3, icon: Heart, text: 'Saved Google Pixel 8 Pro', time: '1 week ago', color: 'text-rose-500' },
  { id: 4, icon: Package, text: 'Order ORD-2756 shipped', time: '1 week ago', color: 'text-amber-600' },
]

const CONDITION_STYLES = {
  Excellent: 'bg-emerald-100 text-emerald-700',
  Good:      'bg-blue-100 text-blue-700',
  Fair:      'bg-amber-100 text-amber-700',
}

const STATUS_STYLES: Record<string, string> = {
  Delivered:  'bg-emerald-100 text-emerald-700',
  Shipped:    'bg-blue-100 text-blue-700',
  Processing: 'bg-amber-100 text-amber-700',
  Active:     'bg-[#127058]/10 text-[#127058]',
  Completed:  'bg-gray-100 text-gray-500',
}

// ── Tabs definition ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',      label: 'Overview',        icon: TrendingUp    },
  { id: 'orders',        label: 'Orders',           icon: ShoppingBag   },
  { id: 'installments',  label: 'Installments',     icon: CreditCard    },
  { id: 'saved',         label: 'Saved Devices',    icon: Heart         },
  { id: 'support',       label: 'Support',          icon: MessageSquare },
  { id: 'security',      label: 'Security',         icon: Shield        },
]

const TICKET_STATUS_STYLES: Record<TicketStatus, { label: string; cls: string }> = {
  open:        { label: 'Open',        cls: 'bg-blue-100 text-blue-700'   },
  in_progress: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
  resolved:    { label: 'Resolved',    cls: 'bg-emerald-100 text-emerald-700' },
  closed:      { label: 'Closed',      cls: 'bg-gray-100 text-gray-500'   },
}

export default function CustomerProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { getTicketsForCustomer, sendCustomerMessage, createTicket, markReadByCustomer } = useSupport()

  const [activeTab, setActiveTab]         = useState('overview')
  const [editing, setEditing]             = useState(false)
  const [name, setName]                   = useState(user?.name ?? '')
  const [phone, setPhone]                 = useState('+250 788 123 456')
  const [draftName, setDraftName]         = useState(name)
  const [draftPhone, setDraftPhone]       = useState(phone)
  const [orderFilter, setOrderFilter]     = useState('All')
  const [orders, setOrders]               = useState<CustomerOrder[]>([])
  const [installments, setInstallments]   = useState<CustomerInstallment[]>([])
  const [wishlistListings, setWishlistListings] = useState<Listing[]>([])
  const [dataLoading, setDataLoading]     = useState(true)
  const [dataError, setDataError]         = useState<string | null>(null)
  const [addedId, setAddedId]             = useState<string | null>(null)
  const [notifications, setNotifications] = useState({ orders: true, installments: true, promotions: false })
  const [pwForm, setPwForm]               = useState({ current: '', next: '', confirm: '' })
  const [pwSaved, setPwSaved]             = useState(false)

  // Profile picture
  const [profilePic, setProfilePic]       = useState<string | null>(null)
  const fileInputRef                      = useRef<HTMLInputElement>(null)

  // Support tab state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [replyText, setReplyText]           = useState('')
  const [showNewTicket, setShowNewTicket]   = useState(false)
  const [newSubject, setNewSubject]         = useState('')
  const [newCategory, setNewCategory]       = useState('Order & Delivery')
  const [newMessage, setNewMessage]         = useState('')
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const messagesEndRef                      = useRef<HTMLDivElement>(null)

  const initials = name
    ? name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const filteredOrders = orderFilter === 'All'
    ? orders
    : orders.filter((o) => o.status === orderFilter)

  const totalMonthly = installments.reduce((s, i) => s + i.monthly, 0)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      setDataLoading(true)
      setDataError(null)
      try {
        const [profile, orderRows, financingRows, wishlistRows] = await Promise.all([
          fetchProfile(),
          fetchOrders(),
          fetchFinancingApplications(),
          fetchWishlist(),
        ])

        if (cancelled) return

        setName(`${profile.firstName} ${profile.lastName}`.trim())
        setDraftName(`${profile.firstName} ${profile.lastName}`.trim())
        if (profile.phone) {
          setPhone(profile.phone)
          setDraftPhone(profile.phone)
        }

        setOrders(orderRows.map(mapApiOrderToCustomerOrder))
        setInstallments(
          financingRows
            .filter((f) => f.status === 'APPROVED' || f.status === 'PENDING')
            .map(mapFinancingToCustomerInstallment),
        )
        setWishlistListings(
          wishlistRows.map((w) =>
            mapApiListingToListing({
              id: w.deviceId,
              deviceId: w.deviceId,
              title: `${w.device.brand} ${w.device.model}`,
              description: 'Saved device',
              price: w.device.price,
              device: w.device,
            }),
          ),
        )
      } catch (err) {
        if (!cancelled) setDataError(getErrorMessage(err))
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [user])

  async function saveProfile() {
    const parts = draftName.trim().split(/\s+/)
    const firstName = parts[0] || 'User'
    const lastName = parts.slice(1).join(' ') || ''
    try {
      const updated = await updateProfile({ firstName, lastName, phone: draftPhone })
      const fullName = `${updated.firstName} ${updated.lastName}`.trim()
      setName(fullName)
      setPhone(updated.phone || draftPhone)
      setDraftName(fullName)
      setDraftPhone(updated.phone || draftPhone)
    } catch {
      setName(draftName)
      setPhone(draftPhone)
    }
    setEditing(false)
  }

  function cancelEdit() {
    setDraftName(name)
    setDraftPhone(phone)
    setEditing(false)
  }

  function handleAddToCart(listing: Listing) {
    void addToCart(mapListingToCartDevice(listing))
    setAddedId(listing.id)
    setTimeout(() => setAddedId(null), 2000)
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function handlePwSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm || !pwForm.current) return
    setPwSaved(true)
    setPwForm({ current: '', next: '', confirm: '' })
    setTimeout(() => setPwSaved(false), 3000)
  }

  function handleProfilePicChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setProfilePic(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleSendReply(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!selectedTicket || !replyText.trim() || !user) return
    sendCustomerMessage(selectedTicket.id, user.name, replyText.trim())
    setReplyText('')
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function openTicket(ticket: SupportTicket) {
    setSelectedTicket(ticket)
    setShowNewTicket(false)
    markReadByCustomer(ticket.id)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function handleCreateTicket(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!user || !newSubject.trim() || !newMessage.trim()) return
    setTicketSubmitting(true)
    await new Promise((r) => setTimeout(r, 500))
    const t = createTicket({
      customerId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      subject: newSubject.trim(),
      category: newCategory,
      firstMessage: newMessage.trim(),
    })
    setNewSubject('')
    setNewMessage('')
    setShowNewTicket(false)
    setSelectedTicket(t)
    setTicketSubmitting(false)
  }

  const myTickets = user ? getTicketsForCustomer(user.id) : []

  return (
    <>
      <Navbar />
      <div className='bg-[#EEF2F7] min-h-screen'>
        <main className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5'>

          {dataError && (
            <div className='p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700'>
              Could not load profile data: {dataError}. Make sure the backend is running and you are signed in.
            </div>
          )}

          {dataLoading && (
            <div className='p-4 bg-white border border-gray-100 rounded-2xl text-sm text-gray-500 text-center'>
              Loading your account from the server…
            </div>
          )}

          {/* ── Profile header card ───────────────────────────────────── */}
          <div className='bg-white border border-gray-100 rounded-3xl shadow-md overflow-hidden'>
            {/* Banner */}
            <div className='relative h-36 bg-gradient-to-r from-[#025c50] via-[#127058] to-[#6E9F94] overflow-hidden'>
              {/* Decorative circles */}
              <div className='absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10' />
              <div className='absolute -bottom-6 right-24 w-24 h-24 rounded-full bg-white/5' />
              <div className='absolute top-4 right-52 w-12 h-12 rounded-full bg-[#f0ab3c]/20' />
              {/* Member ID badge */}
              <span className='absolute bottom-3 right-5 text-[11px] font-semibold text-white/60 font-mono tracking-wide'>
                {user?.id ?? 'USR-0001'}
              </span>
            </div>

            <div className='px-6 pb-6'>
              <div className='flex flex-wrap items-end justify-between gap-4 -mt-12'>
                {/* Avatar with upload */}
                <div className='flex items-end gap-4'>
                  <div className='relative flex-shrink-0'>
                    <div className='w-24 h-24 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-gradient-to-br from-[#127058] to-[#025c50] flex items-center justify-center'>
                      {profilePic
                        ? <img src={profilePic} alt='Profile' className='w-full h-full object-cover' />
                        : <span className='text-white text-3xl font-black select-none'>{initials}</span>
                      }
                    </div>
                    <button
                      type='button'
                      onClick={() => fileInputRef.current?.click()}
                      aria-label='Upload profile picture'
                      className='absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#f0ab3c] hover:bg-[#d98f20] text-gray-900 flex items-center justify-center shadow-md transition-colors border-2 border-white'
                    >
                      <Camera size={12} />
                    </button>
                    <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleProfilePicChange} />
                  </div>
                  <div className='mb-1 pt-10'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <h1 className='text-xl font-bold text-gray-900 leading-tight'>{name}</h1>
                      <span className='inline-flex items-center gap-1 text-[10px] font-bold bg-[#127058]/10 text-[#127058] px-2.5 py-1 rounded-full uppercase tracking-wide'>
                        <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block' />
                        Verified Customer
                      </span>
                    </div>
                    <p className='text-sm text-gray-500 mt-0.5'>{user?.email}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className='flex items-center gap-2 pb-1'>
                  {!editing ? (
                    <button
                      type='button'
                      onClick={() => setEditing(true)}
                      className='inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#127058] hover:bg-[#127058]/5 border border-gray-200 hover:border-[#127058]/30 px-4 py-2 rounded-xl transition-all'
                    >
                      <Edit3 size={14} /> Edit Profile
                    </button>
                  ) : (
                    <>
                      <button type='button' onClick={saveProfile} className='inline-flex items-center gap-1.5 text-sm font-semibold bg-[#127058] hover:bg-[#0e5845] text-white px-4 py-2 rounded-xl transition-all shadow-sm shadow-[#127058]/20'>
                        <Check size={14} /> Save Changes
                      </button>
                      <button type='button' onClick={cancelEdit} className='inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 border border-gray-200 px-4 py-2 rounded-xl transition-all'>
                        <X size={14} /> Discard
                      </button>
                    </>
                  )}
                  <button
                    type='button'
                    onClick={handleLogout}
                    className='inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 border border-red-100 hover:border-red-200 px-4 py-2 rounded-xl transition-all'
                  >
                    <LogOut size={14} /> Log out
                  </button>
                </div>
              </div>

              {/* Editable fields */}
              {editing ? (
                <div className='mt-5 grid sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100'>
                  {[
                    { label: 'Full Name', type: 'text', value: draftName, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDraftName(e.target.value), readOnly: false },
                    { label: 'Phone',     type: 'tel',  value: draftPhone, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDraftPhone(e.target.value), readOnly: false },
                  ].map(({ label, type, value, onChange, readOnly }) => (
                    <div key={label}>
                      <label className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block'>{label}</label>
                      <input
                        type={type}
                        value={value}
                        onChange={onChange}
                        readOnly={readOnly}
                        className='w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#127058] focus:bg-white focus:ring-2 focus:ring-[#127058]/10 transition-all'
                      />
                    </div>
                  ))}
                  <div>
                    <label className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block'>Email</label>
                    <input type='email' value={user?.email} readOnly className='w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed' />
                    <p className='text-[11px] text-gray-400 mt-1'>Contact support to change your email.</p>
                  </div>
                </div>
              ) : (
                <div className='mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-0'>
                  {[
                    { label: 'Phone', value: phone },
                    { label: 'Email', value: user?.email ?? '' },
                    { label: 'Member since', value: 'Jan 2025' },
                    { label: 'Account ID', value: user?.id ?? 'USR-0001' },
                  ].map(({ label, value }, i, arr) => (
                    <div key={label} className={`py-1 pr-8 ${i < arr.length - 1 ? 'border-r border-gray-200 mr-8' : ''}`}>
                      <span className='text-[10px] font-bold text-gray-400 uppercase tracking-widest block'>{label}</span>
                      <p className='text-sm font-semibold text-gray-800 mt-0.5'>{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Tab navigation ────────────────────────────────────────── */}
          <div className='bg-white border border-gray-100 rounded-2xl shadow-sm px-2 py-1.5'>
            <div className='flex gap-1 overflow-x-auto scrollbar-hide'>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type='button'
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                    activeTab === id
                      ? 'bg-[#127058] text-white shadow-sm'
                      : 'text-gray-500 hover:text-[#127058] hover:bg-[#127058]/6'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab content ───────────────────────────────────────────── */}

          {/* OVERVIEW ──────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className='space-y-5'>
              {/* KPI cards */}
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                {[
                  { label: 'Total Orders',    value: orders.length,             icon: ShoppingBag, accent: '#3b82f6', bg: '#eff6ff' },
                  { label: 'Active Plans',    value: installments.length,       icon: CreditCard,  accent: '#127058', bg: '#f0fdf4' },
                  { label: 'Monthly Payment', value: `$${totalMonthly.toFixed(0)}`,  icon: TrendingUp,  accent: '#f59e0b', bg: '#fffbeb' },
                  { label: 'Saved Devices',   value: wishlistListings.length,      icon: Heart,       accent: '#ef4444', bg: '#fef2f2' },
                ].map(({ label, value, icon: Icon, accent, bg }) => (
                  <div key={label} className='bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-default'>
                    <div className='flex items-start justify-between mb-4'>
                      <div className='w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110' style={{ background: bg, color: accent }}>
                        <Icon size={18} />
                      </div>
                    </div>
                    <p className='text-2xl font-black text-gray-900 leading-none'>{value}</p>
                    <p className='text-xs font-medium text-gray-400 mt-1.5'>{label}</p>
                  </div>
                ))}
              </div>

              <div className='grid md:grid-cols-2 gap-5'>
                {/* Recent orders */}
                <div className='bg-white border border-gray-100 rounded-2xl shadow-sm p-5'>
                  <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-sm font-bold text-gray-800'>Recent Orders</h2>
                    <button type='button' onClick={() => setActiveTab('orders')} className='text-xs font-semibold text-[#127058] hover:underline flex items-center gap-1'>
                      View all <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className='space-y-3'>
                    {orders.slice(0, 2).map((o) => (
                      <div key={o.id} className='flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors'>
                        <img src={o.img} alt={o.device} className='w-11 h-11 rounded-xl object-cover bg-gray-100 flex-shrink-0' />
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-semibold text-gray-900 truncate'>{o.device}</p>
                          <p className='text-xs text-gray-400 mt-0.5'>{o.id} · {o.date}</p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active installments */}
                <div className='bg-white border border-gray-100 rounded-2xl shadow-sm p-5'>
                  <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-sm font-bold text-gray-800'>Active Installments</h2>
                    <button type='button' onClick={() => setActiveTab('installments')} className='text-xs font-semibold text-[#127058] hover:underline flex items-center gap-1'>
                      View all <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className='space-y-4'>
                    {installments.map((ins) => {
                      const pct = Math.round((ins.paid / ins.total) * 100)
                      return (
                        <div key={ins.ref}>
                          <div className='flex items-center justify-between mb-1.5'>
                            <p className='text-sm font-semibold text-gray-900 truncate'>{ins.device}</p>
                            <p className='text-sm font-bold text-[#127058] flex-shrink-0 ml-2'>${ins.monthly}<span className='text-xs font-medium text-gray-400'>/mo</span></p>
                          </div>
                          <div className='w-full h-2 bg-gray-100 rounded-full overflow-hidden'>
                            <div className='h-full bg-gradient-to-r from-[#127058] to-[#6E9F94] rounded-full transition-all' style={{ width: `${pct}%` }} />
                          </div>
                          <div className='flex items-center justify-between mt-1'>
                            <p className='text-[11px] text-gray-400'>{ins.paid}/{ins.total} payments</p>
                            <p className='text-[11px] font-semibold text-[#127058]'>{pct}%</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Recent activity — timeline */}
              <div className='bg-white border border-gray-100 rounded-2xl shadow-sm p-5'>
                <h2 className='text-sm font-bold text-gray-800 mb-5'>Recent Activity</h2>
                <ul className='space-y-0'>
                  {MOCK_ACTIVITY.map(({ id, icon: Icon, text, time, color }, i) => (
                    <li key={id} className='flex gap-4'>
                      {/* Timeline connector */}
                      <div className='flex flex-col items-center'>
                        <span className={`w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 ${color}`}>
                          <Icon size={14} />
                        </span>
                        {i < MOCK_ACTIVITY.length - 1 && <div className='w-px flex-1 bg-gray-100 my-1' />}
                      </div>
                      <div className={`flex-1 flex items-start justify-between gap-4 ${i < MOCK_ACTIVITY.length - 1 ? 'pb-4' : ''}`}>
                        <p className='text-sm text-gray-700 pt-1.5'>{text}</p>
                        <span className='text-xs text-gray-400 flex-shrink-0 pt-1.5'>{time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ORDERS ─────────────────────────────────────────────────────── */}
          {activeTab === 'orders' && (
            <div className='space-y-4'>
              {/* Filter pills */}
              <div className='flex gap-2 flex-wrap'>
                {['All', 'Delivered', 'Shipped', 'Processing'].map((f) => (
                  <button
                    key={f}
                    type='button'
                    onClick={() => setOrderFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      orderFilter === f
                        ? 'bg-[#127058] text-white border-[#127058] shadow-sm shadow-[#127058]/20'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#127058]/40 hover:text-[#127058]'
                    }`}
                  >
                    {f}
                    {f === 'All' && <span className='ml-1 opacity-60'>({orders.length})</span>}
                  </button>
                ))}
              </div>

              {filteredOrders.length === 0 ? (
                <div className='bg-white border border-gray-100 rounded-2xl shadow-sm p-14 text-center'>
                  <Package size={40} className='mx-auto text-gray-200 mb-3' />
                  <p className='text-sm font-semibold text-gray-500'>No {orderFilter.toLowerCase()} orders</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {filteredOrders.map((o) => {
                    const accentColor: Record<string, string> = { Delivered: '#16a34a', Shipped: '#2563eb', Processing: '#d97706' }
                    return (
                      <div key={o.id} className='bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex'>
                        {/* Status accent stripe */}
                        <div className='w-1 flex-shrink-0' style={{ background: accentColor[o.status] ?? '#6b7280' }} />
                        <div className='flex flex-wrap items-center gap-4 p-4 flex-1'>
                          <img src={o.img} alt={o.device} className='w-16 h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0' />
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-bold text-gray-900'>{o.device}</p>
                            <div className='flex items-center gap-2 mt-1 flex-wrap'>
                              <span className='text-xs font-mono text-gray-400'>{o.id}</span>
                              <span className='text-gray-300'>·</span>
                              <span className='text-xs text-gray-400'>{o.date}</span>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${CONDITION_STYLES[o.condition]}`}>
                                {o.condition}
                              </span>
                            </div>
                          </div>
                          <div className='flex items-center gap-3 flex-shrink-0'>
                            <p className='text-base font-black text-gray-900'>${o.price}</p>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[o.status]}`}>
                              {o.status}
                            </span>
                            <Link to='/marketplace' className='inline-flex items-center gap-1 text-xs font-semibold text-[#127058] hover:underline'>
                              Details <ArrowRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* INSTALLMENTS ───────────────────────────────────────────────── */}
          {activeTab === 'installments' && (
            <div className='space-y-4'>
              {/* Summary bar */}
              <div className='bg-gradient-to-r from-[#025c50] to-[#127058] rounded-2xl p-5 flex flex-wrap gap-8 shadow-md shadow-[#127058]/20'>
                <div>
                  <p className='text-[10px] font-bold text-white/60 uppercase tracking-widest'>Total monthly</p>
                  <p className='text-2xl font-black text-white mt-0.5'>${totalMonthly.toFixed(2)}</p>
                </div>
                <div className='w-px bg-white/10 self-stretch' />
                <div>
                  <p className='text-[10px] font-bold text-white/60 uppercase tracking-widest'>Active plans</p>
                  <p className='text-2xl font-black text-white mt-0.5'>{installments.length}</p>
                </div>
                <div className='w-px bg-white/10 self-stretch' />
                <div>
                  <p className='text-[10px] font-bold text-white/60 uppercase tracking-widest'>Next payment</p>
                  <p className='text-2xl font-black text-white mt-0.5'>Jun 1, 2025</p>
                </div>
              </div>

              {installments.map((ins) => {
                const pct = Math.round((ins.paid / ins.total) * 100)
                const remaining = ins.total - ins.paid
                return (
                  <div key={ins.ref} className='bg-white border border-gray-100 rounded-2xl shadow-sm p-5'>
                    <div className='flex items-start gap-4'>
                      <img src={ins.img} alt={ins.device} className='w-16 h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0' />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between gap-2 flex-wrap'>
                          <div>
                            <p className='text-sm font-bold text-gray-900'>{ins.device}</p>
                            <p className='text-xs text-gray-500 mt-0.5'>{ins.ref}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[ins.status]}`}>
                            {ins.status}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className='mt-4'>
                          <div className='flex items-center justify-between mb-1.5'>
                            <span className='text-xs text-gray-500'>{ins.paid} payments made</span>
                            <span className='text-xs font-semibold text-[#127058]'>{pct}% complete</span>
                          </div>
                          <div className='w-full h-2 bg-gray-100 rounded-full overflow-hidden'>
                            <div className='h-full bg-[#127058] rounded-full transition-all' style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className='mt-4 grid grid-cols-3 gap-3'>
                          {[
                            { label: 'Monthly', value: `$${ins.monthly.toFixed(2)}` },
                            { label: 'Remaining', value: `${remaining} payments` },
                            { label: 'Next Due', value: ins.nextDue },
                          ].map(({ label, value }) => (
                            <div key={label} className='bg-gray-50 rounded-xl p-3'>
                              <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>{label}</p>
                              <p className='text-sm font-bold text-gray-800 mt-0.5'>{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className='bg-white border border-gray-100 rounded-2xl shadow-sm p-5 text-center'>
                <CreditCard size={28} className='mx-auto text-gray-300 mb-2' />
                <p className='text-sm font-semibold text-gray-600 mb-1'>Want to finance a new device?</p>
                <p className='text-xs text-gray-400 mb-4'>Browse our marketplace and apply for a flexible payment plan.</p>
                <Link
                  to='/marketplace'
                  className='inline-flex items-center gap-2 bg-[#127058] hover:bg-[#0e5845] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all'
                >
                  Browse Devices <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* SAVED DEVICES ──────────────────────────────────────────────── */}
          {activeTab === 'saved' && (
            <div className='space-y-4'>
              {wishlistListings.length === 0 ? (
                <div className='bg-white border border-gray-100 rounded-2xl shadow-sm p-12 text-center'>
                  <Heart size={36} className='mx-auto text-gray-300 mb-3' />
                  <p className='text-sm font-semibold text-gray-500'>No saved devices yet</p>
                  <Link to='/marketplace' className='inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-[#127058] hover:underline'>
                    Browse Marketplace <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className='grid sm:grid-cols-2 gap-4'>
                  {wishlistListings.map((device) => {
                    const discount = Math.round(((device.original_price - device.current_price) / device.original_price) * 100)
                    const isAdded = addedId === device.id
                    return (
                      <div key={device.id} className='bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:border-[#127058]/30 hover:shadow-md transition-all group'>
                        <div className='relative'>
                          <img src={device.img} alt={device.title} className='w-full h-44 object-cover' />
                          <div className='absolute top-3 left-3 flex gap-1.5 flex-wrap'>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${CONDITION_STYLES[device.condition as keyof typeof CONDITION_STYLES]}`}>
                              {device.condition}
                            </span>
                            {discount > 0 && (
                              <span className='text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EF9F27] text-gray-900'>
                                -{discount}%
                              </span>
                            )}
                          </div>
                          <button
                            type='button'
                            onClick={() => void removeWishlistItem(device.deviceId).then(() =>
                              setWishlistListings((prev) => prev.filter((d) => d.deviceId !== device.deviceId)),
                            )}
                            className='absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm'
                            aria-label='Remove from saved'
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className='p-4'>
                          <p className='text-sm font-bold text-gray-900 truncate'>{device.title}</p>
                          <div className='flex items-center gap-1 mt-1 mb-3'>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={11} className={i < (device.rating ?? 0) ? 'text-[#EF9F27] fill-[#EF9F27]' : 'text-gray-200'} />
                            ))}
                            <span className='text-[11px] text-gray-400 ml-0.5'>({device.reviewCount})</span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='text-lg font-black text-gray-900'>${device.current_price}</p>
                              {discount > 0 && (
                                <p className='text-xs text-gray-400 line-through'>${device.original_price}</p>
                              )}
                            </div>
                            <div className='flex gap-2'>
                              <Link
                                to={`/marketplace/${device.deviceId}`}
                                className='p-2 rounded-xl border border-gray-200 text-gray-600 hover:border-[#127058]/40 hover:text-[#127058] transition-all'
                                aria-label='View details'
                              >
                                <Smartphone size={15} />
                              </Link>
                              <button
                                type='button'
                                onClick={() => handleAddToCart(device)}
                                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                                  isAdded
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-[#127058] hover:bg-[#0e5845] text-white'
                                }`}
                              >
                                {isAdded ? <Check size={13} /> : <ShoppingCart size={13} />}
                                {isAdded ? 'Added' : 'Add to Cart'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUPPORT ────────────────────────────────────────────────────── */}
          {activeTab === 'support' && (
            <div className='flex gap-5' style={{ minHeight: '520px' }}>

              {/* Left pane — ticket list */}
              <div className='w-72 flex-shrink-0 flex flex-col gap-3'>
                <button
                  type='button'
                  onClick={() => { setShowNewTicket(true); setSelectedTicket(null) }}
                  className='flex items-center justify-center gap-2 w-full bg-[#127058] hover:bg-[#0e5845] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm'
                >
                  <Plus size={15} /> New Support Request
                </button>

                {myTickets.length === 0 && !showNewTicket ? (
                  <div className='bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center flex flex-col items-center gap-3'>
                    <MessageSquare size={32} className='text-gray-300' />
                    <p className='text-sm font-semibold text-gray-500'>No support requests yet</p>
                    <p className='text-xs text-gray-400'>Click above to contact our team.</p>
                  </div>
                ) : (
                  myTickets.map((t) => (
                    <button
                      key={t.id}
                      type='button'
                      onClick={() => openTicket(t)}
                      className={`text-left w-full bg-white border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${
                        selectedTicket?.id === t.id
                          ? 'border-[#127058]/40 ring-2 ring-[#127058]/15'
                          : 'border-gray-100 hover:border-[#127058]/20'
                      }`}
                    >
                      <div className='flex items-start justify-between gap-2 mb-1.5'>
                        <span className='font-mono text-[11px] font-bold text-[#127058]'>{t.id}</span>
                        <div className='flex items-center gap-1.5'>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TICKET_STATUS_STYLES[t.status].cls}`}>
                            {TICKET_STATUS_STYLES[t.status].label}
                          </span>
                          {t.unreadByCustomer > 0 && (
                            <span className='w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold grid place-items-center flex-shrink-0'>
                              {t.unreadByCustomer}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className='text-sm font-semibold text-gray-900 truncate'>{t.subject}</p>
                      <p className='text-xs text-gray-400 mt-0.5'>{t.category} · {t.updatedAt}</p>
                    </button>
                  ))
                )}
              </div>

              {/* Right pane — chat or new ticket form */}
              <div className='flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col overflow-hidden min-w-0'>

                {/* New ticket form */}
                {showNewTicket && (
                  <div className='p-6 flex flex-col gap-4 overflow-y-auto'>
                    <div className='flex items-center gap-2'>
                      <MessageSquare size={18} className='text-[#127058]' />
                      <h2 className='text-base font-bold text-gray-900'>New Support Request</h2>
                    </div>
                    <form onSubmit={handleCreateTicket} className='flex flex-col gap-4'>
                      <div>
                        <label className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block'>Category</label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className='w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#127058] focus:ring-2 focus:ring-[#127058]/10'
                        >
                          {['Order & Delivery','Product Quality','Financing','Returns & Refunds','Technical Support','Account','Other'].map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block'>Subject</label>
                        <input
                          type='text'
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          placeholder='Brief description of your issue'
                          required
                          maxLength={120}
                          className='w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#127058] focus:ring-2 focus:ring-[#127058]/10'
                        />
                      </div>
                      <div>
                        <label className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block'>Message</label>
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder='Describe your issue in detail…'
                          required
                          rows={5}
                          maxLength={800}
                          className='w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 resize-none focus:outline-none focus:border-[#127058] focus:ring-2 focus:ring-[#127058]/10'
                        />
                        <span className='text-xs text-gray-400 float-right mt-1'>{newMessage.length}/800</span>
                      </div>
                      <div className='flex gap-3 pt-1'>
                        <button
                          type='submit'
                          disabled={ticketSubmitting || !newSubject.trim() || !newMessage.trim()}
                          className='flex items-center gap-2 bg-[#127058] hover:bg-[#0e5845] disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all'
                        >
                          {ticketSubmitting ? 'Sending…' : <><Send size={13} /> Submit Request</>}
                        </button>
                        <button
                          type='button'
                          onClick={() => setShowNewTicket(false)}
                          className='px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl text-sm transition-colors'
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Ticket chat view */}
                {selectedTicket && !showNewTicket && (() => {
                  const live = myTickets.find((t) => t.id === selectedTicket.id) ?? selectedTicket
                  return (
                    <>
                      {/* Chat header */}
                      <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0'>
                        <div>
                          <p className='text-sm font-bold text-gray-900'>{live.subject}</p>
                          <p className='text-xs text-gray-400 mt-0.5'>{live.id} · {live.category}</p>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${TICKET_STATUS_STYLES[live.status].cls}`}>
                          {TICKET_STATUS_STYLES[live.status].label}
                        </span>
                      </div>

                      {/* Messages */}
                      <div className='flex-1 overflow-y-auto p-5 flex flex-col gap-3 bg-gray-50'>
                        {live.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex max-w-[80%] ${msg.sender === 'customer' ? 'self-end' : 'self-start'}`}
                          >
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                msg.sender === 'customer'
                                  ? 'bg-[#127058] text-white'
                                  : 'bg-white border border-gray-200 text-gray-900'
                              }`}
                            >
                              <p className={`text-[10px] font-bold mb-1 ${msg.sender === 'customer' ? 'text-white/70' : 'text-[#127058]'}`}>
                                {msg.sender === 'agent' ? '🛡 Support Agent' : 'You'}
                              </p>
                              <p className='text-sm leading-relaxed'>{msg.text}</p>
                              <span className={`text-[10px] mt-1.5 block text-right ${msg.sender === 'customer' ? 'text-white/60' : 'text-gray-400'}`}>
                                {msg.timestamp}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Reply box */}
                      {live.status !== 'closed' ? (
                        <form onSubmit={handleSendReply} className='flex items-end gap-3 px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0'>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder='Type a message…'
                            rows={2}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(e) } }}
                            className='flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 resize-none focus:outline-none focus:border-[#127058] focus:ring-2 focus:ring-[#127058]/10'
                          />
                          <button
                            type='submit'
                            disabled={!replyText.trim()}
                            className='flex items-center gap-1.5 bg-[#127058] hover:bg-[#0e5845] disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex-shrink-0'
                          >
                            <Send size={13} /> Send
                          </button>
                        </form>
                      ) : (
                        <div className='px-5 py-3 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400 font-medium flex-shrink-0'>
                          This ticket is closed. Open a new request if you need further help.
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* Empty state when nothing is selected */}
                {!selectedTicket && !showNewTicket && (
                  <div className='flex-1 flex flex-col items-center justify-center gap-3 text-gray-400'>
                    <MessageSquare size={40} strokeWidth={1.5} />
                    <p className='text-sm font-semibold'>Select a conversation or start a new one</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECURITY ───────────────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <div className='space-y-5'>
              {/* Change password */}
              <div className='bg-white border border-gray-100 rounded-2xl shadow-sm p-6'>
                <div className='flex items-center gap-3 mb-5 pb-5 border-b border-gray-100'>
                  <span className='w-10 h-10 rounded-xl bg-[#127058]/10 flex items-center justify-center text-[#127058]'>
                    <Lock size={18} />
                  </span>
                  <div>
                    <h2 className='text-sm font-bold text-gray-900'>Change Password</h2>
                    <p className='text-xs text-gray-500 mt-0.5'>Use a strong password you don't use elsewhere.</p>
                  </div>
                </div>

                {pwSaved && (
                  <div className='mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2'>
                    <Check size={14} /> Password updated successfully.
                  </div>
                )}

                <form onSubmit={handlePwSubmit} className='space-y-4 max-w-md'>
                  {[
                    { label: 'Current Password', key: 'current' as const },
                    { label: 'New Password',     key: 'next'    as const },
                    { label: 'Confirm Password', key: 'confirm' as const },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block'>{label}</label>
                      <input
                        type='password'
                        value={pwForm[key]}
                        onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder='••••••••'
                        className='w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#127058] focus:bg-white focus:ring-2 focus:ring-[#127058]/10 transition-all'
                      />
                    </div>
                  ))}
                  {pwForm.next && pwForm.confirm && pwForm.next !== pwForm.confirm && (
                    <p className='text-xs text-red-500 font-medium'>Passwords do not match.</p>
                  )}
                  <button
                    type='submit'
                    disabled={!pwForm.current || !pwForm.next || pwForm.next !== pwForm.confirm}
                    className='inline-flex items-center gap-2 bg-[#127058] hover:bg-[#0e5845] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all'
                  >
                    <Lock size={14} /> Update Password
                  </button>
                </form>
              </div>

              {/* Notification preferences */}
              <div className='bg-white border border-gray-100 rounded-2xl shadow-sm p-6'>
                <div className='flex items-center gap-3 mb-5 pb-5 border-b border-gray-100'>
                  <span className='w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500'>
                    <Bell size={18} />
                  </span>
                  <div>
                    <h2 className='text-sm font-bold text-gray-900'>Notification Preferences</h2>
                    <p className='text-xs text-gray-500 mt-0.5'>Choose what updates you receive.</p>
                  </div>
                </div>
                <div className='space-y-4'>
                  {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      orders: 'Order & shipping updates',
                      installments: 'Installment payment reminders',
                      promotions: 'Promotions & new arrivals',
                    }
                    return (
                      <div key={key} className='flex items-center justify-between'>
                        <span className='text-sm font-medium text-gray-700'>{labels[key]}</span>
                        <button
                          type='button'
                          role='switch'
                          aria-checked={value}
                          onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-[#127058]' : 'bg-gray-200'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'left-5' : 'left-1'}`} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Danger zone */}
              <div className='bg-white border border-red-100 rounded-2xl shadow-sm p-6'>
                <div className='flex items-center gap-3 mb-5 pb-5 border-b border-red-50'>
                  <span className='w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500'>
                    <Trash2 size={18} />
                  </span>
                  <div>
                    <h2 className='text-sm font-bold text-red-600'>Danger Zone</h2>
                    <p className='text-xs text-gray-500 mt-0.5'>These actions are irreversible. Proceed with caution.</p>
                  </div>
                </div>
                <button
                  type='button'
                  className='inline-flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all'
                >
                  <X size={14} /> Delete my account
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
      <Footer />
    </>
  )
}
