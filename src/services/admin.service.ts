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
