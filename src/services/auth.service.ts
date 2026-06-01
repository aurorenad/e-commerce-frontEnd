import { api } from '../lib/api'

export interface LoginResponse {
  message: string
  token: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    role: string
  }
}

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}

export async function register(payload: {
  firstName: string
  lastName: string
  email: string
  phone?: string
  password: string
}) {
  const { data } = await api.post<{ message: string; userId: string; email: string; otpCode?: string }>(
    '/auth/register',
    payload,
  )
  return data
}

export async function verifyOtp(email: string, otpCode: string) {
  const { data } = await api.post<{ message: string }>('/auth/verify-otp', { email, otpCode })
  return data
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<{ message: string; otpCode?: string }>('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(email: string, otpCode: string, newPassword: string) {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', {
    email,
    otpCode,
    newPassword,
  })
  return data
}
