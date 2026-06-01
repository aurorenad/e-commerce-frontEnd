import type { UserRole } from '../context/AuthContext'

export type BackendRole =
  | 'CUSTOMER'
  | 'ADMIN'
  | 'TECHNICIAN'
  | 'FINANCE_OFFICER'
  | 'SUPPORT_AGENT'

const ROLE_MAP: Record<BackendRole, UserRole> = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  FINANCE_OFFICER: 'finance',
  SUPPORT_AGENT: 'agent',
}

const REDIRECT_MAP: Record<UserRole, string> = {
  customer: '/profile',
  admin: '/admin',
  finance: '/finance',
  technician: '/technician',
  agent: '/agent',
}

export function toFrontendRole(role: string): UserRole {
  return ROLE_MAP[role as BackendRole] ?? 'customer'
}

export function getRedirectForRole(role: UserRole): string {
  return REDIRECT_MAP[role]
}

export const DEMO_USERS = [
  { email: 'admin@example.com', password: 'Password123!', role: 'admin' as const, label: 'Admin' },
  { email: 'aline@example.com', password: 'Password123!', role: 'customer' as const, label: 'Customer' },
  { email: 'finance@example.com', password: 'Password123!', role: 'finance' as const, label: 'Finance Officer' },
  { email: 'tech@example.com', password: 'Password123!', role: 'technician' as const, label: 'Technician' },
  { email: 'support@example.com', password: 'Password123!', role: 'agent' as const, label: 'Support Agent' },
]
