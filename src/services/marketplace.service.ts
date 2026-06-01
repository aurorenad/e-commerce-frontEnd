import { api } from '../lib/api'
import type { ApiDevice, ApiListing, ApiOrder } from '../lib/mappers'

export async function fetchListings(params?: {
  brand?: string
  condition?: string
  minPrice?: number
  maxPrice?: number
  search?: string
}) {
  const { data } = await api.get<{ listings: ApiListing[] }>('/marketplace', { params })
  return data.listings
}

export async function fetchListingById(id: string) {
  const { data } = await api.get<{ listing: ApiListing }>(`/marketplace/${id}`)
  return data.listing
}

export async function fetchCart() {
  const { data } = await api.get<{ cart: { items: Array<{ deviceId: string; quantity: number; device: unknown }> }; totalAmount: number }>(
    '/marketplace/cart',
  )
  return data
}

export async function addToCart(deviceId: string) {
  const { data } = await api.post('/marketplace/cart', { deviceId })
  return data
}

export async function removeFromCart(deviceId: string) {
  const { data } = await api.delete(`/marketplace/cart/${deviceId}`)
  return data
}

export async function clearCart() {
  const { data } = await api.delete('/marketplace/cart')
  return data
}

export async function checkout(deviceIds: string[], financingApplicationId?: string) {
  const { data } = await api.post<{
    message: string
    order: { id: string; totalAmount: number; status: string; financingId?: string | null }
  }>('/marketplace/checkout', { deviceIds, financingApplicationId })
  return data
}

export async function fetchOrders() {
  const { data } = await api.get<{ orders: ApiOrder[] }>('/marketplace/orders')
  return data.orders
}

export async function fetchWishlist() {
  const { data } = await api.get<{ wishlist: Array<{ deviceId: string; device: ApiDevice }> }>('/marketplace/wishlist')
  return data.wishlist
}

export async function removeWishlistItem(deviceId: string) {
  await api.delete(`/marketplace/wishlist/${deviceId}`)
}
