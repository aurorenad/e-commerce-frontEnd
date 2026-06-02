import { api } from '../lib/api'
import type { ApiDevice } from '../lib/mappers'

export async function intakeDevice(payload: {
  brand: string
  model: string
  originalSerialNumber?: string
  condition: string
  batteryHealth?: number
  basePrice: number
  price: number
} | FormData) {
  const isFormData = payload instanceof FormData
  const { data } = await api.post<{ device: ApiDevice }>('/devices/intake', payload, isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined)
  return data.device
}

export async function fetchDevices(params?: Record<string, string>) {
  const { data } = await api.get<{ devices: ApiDevice[] }>('/devices', { params })
  return data.devices
}

export interface ApiTradeInUser {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
}

export interface ApiTradeIn {
  id: string
  brand: string
  model: string
  category?: string | null
  condition: string
  batteryHealth?: number | null
  askingPrice?: number | null
  estimatedValue: number
  imageUrls: string
  defects?: string | null
  storage?: string | null
  ram?: string | null
  color?: string | null
  location?: string | null
  aiReasoning?: string | null
  technicianComment?: string | null
  technicianRepairEstimate?: number | null
  technicianReviewedAt?: string | null
  technician?: ApiTradeInUser
  officerNotes?: string | null
  finalOfferAmount?: number | null
  decisionAt?: string | null
  customerOfferDecision?: string | null
  customerDecisionAt?: string | null
  status: string
  createdAt: string
  user?: ApiTradeInUser
}

export interface SellDeviceAiEvaluation {
  estimatedResaleValue: number
  tradeInRecommendation: number
  conditionPricingLogic: string
  reasoning: string
}

export async function fetchTradeIns() {
  const { data } = await api.get<{ tradeIns: ApiTradeIn[] }>('/devices/trade-in')
  return data.tradeIns
}

export async function reviewTradeIn(payload: {
  tradeInId: string
  status: 'APPROVED' | 'REJECTED'
  finalOfferAmount?: number
  officerNotes?: string
}) {
  const { data } = await api.put<{ message: string; tradeIn: ApiTradeIn }>('/devices/trade-in', payload)
  return data
}

export async function technicianReviewTradeIn(payload: {
  tradeInId: string
  technicianComment: string
  repairEstimate: number
}) {
  const { data } = await api.put<{ message: string; tradeIn: ApiTradeIn }>(
    `/devices/trade-in/${payload.tradeInId}/technician-review`,
    { technicianComment: payload.technicianComment, repairEstimate: payload.repairEstimate },
  )
  return data
}

export async function customerDecisionTradeIn(payload: {
  tradeInId: string
  decision: 'APPROVE' | 'REJECT'
}) {
  const { data } = await api.put<{ message: string; tradeIn: ApiTradeIn }>(
    `/devices/trade-in/${payload.tradeInId}/customer-decision`,
    { decision: payload.decision },
  )
  return data
}

export async function submitSellDevice(formData: FormData) {
  const { data } = await api.post<{
    message: string
    tradeIn: ApiTradeIn
    aiEvaluation: SellDeviceAiEvaluation
    aiEnabled: boolean
  }>('/devices/trade-in', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
