import type { Listing, Condition } from '../features/marketplace/types'
import type { Device as CartDevice } from '../context/type'
import type { User } from '../features/dashboard/shared/types/dashboard.types'
import type { Device as InventoryDevice } from '../features/dashboard/shared/types/dashboard.types'
import type { Loan, LoanStatus } from '../features/dashboard/shared/types/dashboard.types'

const DEVICE_IMAGES: Record<string, string> = {
  iphone: 'https://images.unsplash.com/photo-1730036900477-09391e7a5414?q=80&w=580&auto=format&fit=crop',
  macbook: 'https://images.unsplash.com/photo-1650750018363-ff7ffe460f4b?q=80&w=709&auto=format&fit=crop',
  ipad: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop',
  pixel7: 'https://images.unsplash.com/photo-1665566893353-ee90a3ee0a8a?w=800&auto=format&fit=crop&q=80',
  pixel: 'https://images.unsplash.com/photo-1665566893353-ee90a3ee0a8a?w=800&auto=format&fit=crop&q=80',
  samsung: 'https://images.unsplash.com/photo-1738830246146-599b67d009db?q=80&w=600&auto=format&fit=crop',
  laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=600&auto=format&fit=crop',
  watch: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&auto=format&fit=crop',
  gaming: 'https://images.unsplash.com/photo-1606144042614-b2417e99c197?q=80&w=600&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop',
}

function pickImage(brand: string, model: string): string {
  const key = `${brand} ${model}`.toLowerCase()
  if (key.includes('pixel 7') || key === 'google pixel 7') return DEVICE_IMAGES.pixel7
  if (key.includes('macbook') || key.includes('laptop') || key.includes('thinkpad') || key.includes('xps')) return DEVICE_IMAGES.macbook
  if (key.includes('ipad') || key.includes('tablet') || key.includes('tab ')) return DEVICE_IMAGES.ipad
  if (key.includes('iphone')) return DEVICE_IMAGES.iphone
  if (key.includes('pixel') || key.includes('google')) return DEVICE_IMAGES.pixel
  if (key.includes('samsung') || key.includes('galaxy')) return DEVICE_IMAGES.samsung
  if (key.includes('watch')) return DEVICE_IMAGES.watch
  if (key.includes('switch') || key.includes('playstation') || key.includes('xbox')) return DEVICE_IMAGES.gaming
  if (key.includes('dell') || key.includes('lenovo') || key.includes('hp ')) return DEVICE_IMAGES.laptop
  return DEVICE_IMAGES.default
}

function inferCategory(brand: string, model: string): Listing['category'] {
  const m = `${brand} ${model}`.toLowerCase()
  if (m.includes('switch') || m.includes('playstation') || m.includes('xbox')) return 'Gaming'
  if (m.includes('macbook') || m.includes('laptop') || m.includes('thinkpad') || m.includes('xps') || m.includes('pavilion')) return 'Laptop'
  if (m.includes('ipad') || m.includes('tablet') || m.includes('tab ')) return 'Tablet'
  if (m.includes('watch')) return 'Smartwatch'
  return 'Smartphone'
}

function mapCondition(condition?: string): Condition {
  switch (condition?.toUpperCase()) {
    case 'EXCELLENT':
    case 'NEW':
      return 'Excellent'
    case 'GOOD':
      return 'Good'
    case 'FAIR':
    case 'POOR':
      return 'Fair'
    default:
      return 'Good'
  }
}

export interface ApiListingDevice {
  id: string
  brand: string
  model: string
  condition: string
  batteryHealth?: number | null
  trustScore?: number | null
  basePrice?: number
  price?: number
}

export interface ApiListing {
  id: string
  deviceId: string
  title: string
  description: string
  price: number
  device: ApiListingDevice
}

export function mapApiListingToListing(row: ApiListing): Listing {
  const { device } = row
  const original = device.basePrice && device.basePrice > row.price ? device.basePrice : row.price * 1.15
  const trust = device.trustScore ?? 85

  return {
    id: row.id,
    deviceId: row.deviceId,
    title: row.title,
    current_price: row.price,
    original_price: Math.round(original),
    img: pickImage(device.brand, device.model),
    category: inferCategory(device.brand, device.model),
    condition: mapCondition(device.condition),
    description: row.description,
    specs: [
      { label: 'Brand', value: device.brand },
      { label: 'Model', value: device.model },
      { label: 'Battery Health', value: device.batteryHealth != null ? `${device.batteryHealth}%` : 'N/A' },
      { label: 'Trust Score', value: `${Math.round(trust)}%` },
      { label: 'Condition', value: mapCondition(device.condition) },
    ],
    rating: Math.min(5, Math.max(3, Math.round(trust / 20))),
    reviewCount: Math.max(8, Math.round(trust / 2)),
  }
}

export function mapListingToCartDevice(listing: Listing): CartDevice {
  return {
    id: listing.id,
    deviceId: listing.deviceId,
    title: listing.title,
    current_price: listing.current_price,
    original_price: listing.original_price,
    description: listing.description,
    img: listing.img,
    category: listing.category,
    specs: listing.specs,
  }
}

export interface ApiUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  role: string
  status?: string
  isVerified?: boolean
  createdAt?: string
}

export function dashboardRoleToBackend(role: string): string {
  const map: Record<string, string> = {
    Customer: 'CUSTOMER',
    Admin: 'ADMIN',
    Technician: 'TECHNICIAN',
    'Finance Officer': 'FINANCE_OFFICER',
    'Support Agent': 'SUPPORT_AGENT',
  }
  return map[role] || role
}

export function dashboardStatusToBackend(status: string): string {
  return status === 'Deactivated' ? 'SUSPENDED' : 'ACTIVE'
}

export function mapApiUserToDashboardUser(u: ApiUser): User {
  const roleLabels: Record<string, string> = {
    CUSTOMER: 'Customer',
    ADMIN: 'Admin',
    TECHNICIAN: 'Technician',
    FINANCE_OFFICER: 'Finance Officer',
    SUPPORT_AGENT: 'Support Agent',
  }
  const joined = u.createdAt ? new Date(u.createdAt) : new Date()
  const joinDate = joined.toISOString().slice(0, 10)

  return {
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    phone: u.phone || '—',
    role: roleLabels[u.role] || u.role,
    status: u.status === 'SUSPENDED' || u.status === 'DELETED' ? 'Deactivated' : 'Active',
    lastActive: 'Recently',
    lastActiveDate: joinDate,
    joinDate,
  }
}

export interface ApiDevice {
  id: string
  brand: string
  model: string
  condition: string
  status: string
  price: number
  basePrice: number
  originalSerialNumber?: string | null
}

export function mapApiDeviceToInventory(d: ApiDevice): InventoryDevice {
  const statusStock =
    d.status === 'READY' || d.status === 'AVAILABLE' ? 12 :
    d.status === 'SOLD' ? 0 : 3

  return {
    sku: d.originalSerialNumber || d.id.slice(0, 8).toUpperCase(),
    model: `${d.brand} ${d.model}`,
    category: inferCategory(d.brand, d.model),
    condition: mapCondition(d.condition),
    warehouse: d.status === 'READY' ? 'Main' : 'Processing',
    listPrice: d.price,
    stock: statusStock,
  }
}

export interface ApiFinancingApp {
  id: string
  status: string
  totalAmount: number
  interestRate: number
  installmentMonths: number
  monthlyRepayment: number
  deviceId?: string
  createdAt?: string
  customer?: { firstName: string; lastName: string }
  device?: { brand: string; model: string }
}

export function mapFinancingToFoRequest(app: ApiFinancingApp) {
  const statusMap: Record<string, string> = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  }

  return {
    id: app.id,
    ref: app.id.slice(0, 8).toUpperCase(),
    customer: app.customer ? `${app.customer.firstName} ${app.customer.lastName}` : 'Customer',
    device: app.device ? `${app.device.brand} ${app.device.model}` : 'Device',
    price: `$${app.totalAmount.toLocaleString()}`,
    term: `${app.installmentMonths} mo`,
    apr: `${Math.round(app.interestRate * 100)}%`,
    status: statusMap[app.status] || app.status,
    appliedAt: app.createdAt
      ? new Date(app.createdAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  }
}

export interface ApiOrderItem {
  price: number
  quantity: number
  device: { brand: string; model: string; condition: string }
}

export interface ApiOrder {
  id: string
  totalAmount: number
  status: string
  createdAt: string
  orderItems: ApiOrderItem[]
}

export interface CustomerOrder {
  id: string
  device: string
  condition: Condition
  price: number
  date: string
  status: string
  img: string
}

export interface ApiRepayment {
  status: string
  amountDue: number
  dueDate: string
  paidAt?: string | null
}

export interface ApiFinancingWithRepayments extends ApiFinancingApp {
  repayments?: ApiRepayment[]
}

export interface CustomerInstallment {
  ref: string
  device: string
  monthly: number
  paid: number
  total: number
  nextDue: string
  status: string
  img: string
}

function mapOrderStatus(status: string): string {
  switch (status) {
    case 'COMPLETED':
    case 'PAID':
      return 'Delivered'
    case 'SHIPPED':
      return 'Shipped'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return 'Processing'
  }
}

export function mapApiOrderToCustomerOrder(order: ApiOrder): CustomerOrder {
  const item = order.orderItems[0]
  const device = item?.device
  const title = device ? `${device.brand} ${device.model}` : 'Device order'

  return {
    id: order.id.slice(0, 8).toUpperCase(),
    device: title,
    condition: device ? mapCondition(device.condition) : 'Good',
    price: order.totalAmount,
    date: new Date(order.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    status: mapOrderStatus(order.status),
    img: device ? pickImage(device.brand, device.model) : DEVICE_IMAGES.default,
  }
}

export function mapFinancingToCustomerInstallment(app: ApiFinancingWithRepayments): CustomerInstallment {
  const repayments = app.repayments ?? []
  const paidCount = repayments.filter((r) => r.status === 'PAID').length
  const nextUnpaid = repayments.find((r) => r.status !== 'PAID')
  const device = app.device

  return {
    ref: app.id.slice(0, 8).toUpperCase(),
    device: device ? `${device.brand} ${device.model}` : 'Financed device',
    monthly: app.monthlyRepayment,
    paid: paidCount,
    total: app.installmentMonths,
    nextDue: nextUnpaid
      ? new Date(nextUnpaid.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—',
    status: app.status === 'APPROVED' ? 'Active' : app.status === 'PENDING' ? 'Pending' : 'Closed',
    img: device ? pickImage(device.brand, device.model) : DEVICE_IMAGES.default,
  }
}

export function mapFinancingToLoan(app: ApiFinancingApp): Loan {
  const statusMap: Record<string, LoanStatus> = {
    PENDING: 'Under Review',
    APPROVED: 'Active',
    REJECTED: 'Settled',
  }

  return {
    ref: app.id.slice(0, 8).toUpperCase(),
    customer: app.customer ? `${app.customer.firstName} ${app.customer.lastName}` : 'Customer',
    device: app.device ? `${app.device.brand} ${app.device.model}` : 'Device',
    principal: app.totalAmount,
    apr: Math.round(app.interestRate * 100),
    term: app.installmentMonths,
    status: statusMap[app.status] || 'Under Review',
    nextDue: app.status === 'APPROVED' ? new Date().toISOString().slice(0, 10) : null,
  }
}
