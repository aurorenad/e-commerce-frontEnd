import { api } from '../lib/api'
import type { ApiFinancingWithRepayments } from '../lib/mappers'

export async function fetchFinancingApplications(params?: { status?: string }) {
  const { data } = await api.get<{ applications: ApiFinancingWithRepayments[] }>('/payments/financing', { params })
  return data.applications
}

export async function submitFinancingApplication(payload: {
  deviceId: string
  monthlyIncome: number
  existingDebts: number
  installmentMonths: number
  employmentStatus: string
  creditScore?: number
}) {
  const { data } = await api.post<{
    message: string
    application: { id: string; status: string; monthlyRepayment: number; installmentMonths: number }
  }>('/payments/financing', payload)
  return data
}

export async function reviewFinancing(payload: {
  applicationId: string
  status: 'APPROVED' | 'REJECTED'
  officerNotes?: string
}) {
  const { data } = await api.post('/payments/financing/review', payload)
  return data
}

export async function processOrderPayment(payload: {
  orderId: string
  amount: number
  method: 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CASH'
}) {
  const { data } = await api.post('/payments/orders', payload)
  return data
}
