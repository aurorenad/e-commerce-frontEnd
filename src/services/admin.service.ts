import { api } from '../lib/api'

export async function fetchDashboardStats() {
  const { data } = await api.get<{
    sales: { totalOrdersPaid: number; totalRevenue: number }
    inventory: {
      intakeCount: number
      repairingCount: number
      readyForSaleCount: number
      soldCount: number
    }
    financing: {
      pendingApplications: number
      approvedApplications: number
      expectedCollections: number
      actualCollections: number
      overduePayments: number
    }
  }>('/admin/stats')
  return data
}

export interface ApiSystemLog {
  id: string
  action: string
  details: string
  createdAt: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  } | null
}

export async function fetchSystemLogs(limit = 100) {
  const { data } = await api.get<{ logs: ApiSystemLog[] }>('/admin/system-logs', {
    params: { limit },
  })
  return data.logs
}

export interface ApiSalesSummaryRow {
  id: string
  period: string
  region: string
  orders: number
  revenue: number
  profit: number
  margin: number
  growth: number
}

export async function fetchSalesSummary() {
  const { data } = await api.get<{
    kpis: { revenue: number; orders: number; profit: number }
    trends: {
      revenue: Array<{ month: string; revenue: number }>
      orders: Array<{ month: string; orders: number }>
      profit: Array<{ month: string; value: number }>
    }
    rows: ApiSalesSummaryRow[]
  }>('/admin/sales-summary')
  return data
}
