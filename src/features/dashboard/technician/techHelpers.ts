import { REPAIR_TICKETS_SEED } from '../../../data/mockData'

export const TW_NOW = new Date('2026-05-25T11:00:00')
export const STATUS_OPTIONS = ['Pending', 'In Progress', 'Awaiting Parts', 'Completed'] as const
export type TStatus = (typeof STATUS_OPTIONS)[number]

export const TW_NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'devices',  label: 'Assigned Devices' },
  { id: 'sell-requests', label: 'Sell Requests' },
  { id: 'profile',  label: 'Profile' },
] as const

export interface RepairPart  { id: string; label: string; done: boolean }
export interface FaultNote   { at: string; text: string }
export interface RepairTicket {
  id: string; device: string; fault: string
  priority: 'Urgent' | 'Standard' | 'Low'
  status: TStatus
  imei: string; modelCode: string; severity: 'Critical' | 'Medium' | 'Minor'
  assignedAt: string; dueAt: string | null; faultDetail: string
  parts: RepairPart[]; faultNotes: FaultNote[]; progress: number
}

export function cloneTickets(): RepairTicket[] {
  return (REPAIR_TICKETS_SEED as unknown as RepairTicket[]).map((t) => ({
    ...t,
    dueAt: t.dueAt ?? null,
    parts: t.parts.map((p) => ({ ...p })),
    faultNotes: [],
  }))
}

export function statusPillClass(s: string): string {
  return `tech-status tech-status--${s.toLowerCase().replace(/\s+/g, '-')}`
}

export function progressClass(pct: number): string {
  if (pct >= 70) return 'tov-prog--high'
  if (pct >= 30) return 'tov-prog--mid'
  return 'tov-prog--low'
}

export function priorityClass(p: string): string {
  if (p === 'Urgent') return 'tov-priority tov-priority--urgent'
  if (p === 'Low')    return 'tov-priority tov-priority--low'
  return 'tov-priority tov-priority--standard'
}

export function deviceIcon(device: string): string {
  const lc = device.toLowerCase()
  if (lc.includes('macbook') || lc.includes('laptop')) return '💻'
  if (lc.includes('ipad')   || lc.includes('tab'))    return '📟'
  return '📱'
}

export function twRelTime(isoStr: string | null): string {
  if (!isoStr) return '—'
  const then = new Date(isoStr)
  const mins = Math.floor((TW_NOW.getTime() - then.getTime()) / 60000)
  const hrs  = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs  < 24) return `${hrs}h ago`
  return `${days}d ago`
}

export function dueInfo(dueIso: string | null): { label: string; cls: string } | null {
  if (!dueIso) return null
  const due    = new Date(dueIso)
  const diffMs  = due.getTime() - TW_NOW.getTime()
  const diffMin = Math.floor(Math.abs(diffMs) / 60000)
  const diffHrs = Math.floor(diffMin / 60)
  if (diffMs < 0) {
    const label = diffHrs > 0 ? `Overdue ${diffHrs}h` : `Overdue ${diffMin}m`
    return { label, cls: 'due-overdue' }
  }
  if (diffMin < 60) return { label: `Due in ${diffMin}m`, cls: 'due-soon' }
  if (diffHrs < 24) return { label: `Due in ${diffHrs}h`, cls: 'due-today' }
  return { label: 'Due tomorrow', cls: 'due-ok' }
}
