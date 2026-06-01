import { api } from '../lib/api'
import type { ApiUser } from '../lib/mappers'

export async function createAdminUser(payload: {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  role?: string
  sendVerificationEmail?: boolean
}) {
  const { data } = await api.post<{ user: ApiUser }>('/users/admin/users', payload)
  return data.user
}

export async function fetchAdminUsers() {
  const { data } = await api.get<{ users: ApiUser[] }>('/users/admin/users')
  return data.users
}

export async function updateAdminUser(
  id: string,
  payload: {
    firstName?: string
    lastName?: string
    phone?: string
    role?: string
    status?: string
  },
) {
  const { data } = await api.put<{ message: string; user: ApiUser }>(`/users/admin/users/${id}`, payload)
  return data.user
}

export async function fetchProfile() {
  const { data } = await api.get<{ user: ApiUser }>('/users/profile')
  return data.user
}

export async function updateProfile(payload: {
  firstName?: string
  lastName?: string
  phone?: string
}) {
  const { data } = await api.put<{ user: ApiUser }>('/users/profile', payload)
  return data.user
}
