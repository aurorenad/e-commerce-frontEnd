import type { ApiFinancingWithRepayments } from '../../../lib/mappers'

export function formatUsd(value: number): string {
  return `$${value.toLocaleString()}`
}

export function getLoanHealthStatus(app: ApiFinancingWithRepayments): 'Current' | 'Due Soon' | 'Overdue' {
  const nextUnpaid = (app.repayments ?? []).find((r) => r.status !== 'PAID')
  if (!nextUnpaid) return 'Current'
  const due = new Date(nextUnpaid.dueDate).getTime()
  const now = Date.now()
  if (due < now) return 'Overdue'
  const inDays = (due - now) / (1000 * 60 * 60 * 24)
  return inDays <= 7 ? 'Due Soon' : 'Current'
}

export function getRiskLevel(app: ApiFinancingWithRepayments): 'Low' | 'Medium' | 'High' | 'Critical' {
  const score = app.paymentAbilityScore ?? null
  if (typeof score === 'number') {
    if (score < 40) return 'Critical'
    if (score < 55) return 'High'
    if (score < 70) return 'Medium'
    return 'Low'
  }

  const status = getLoanHealthStatus(app)
  if (status === 'Overdue') return 'High'
  if (status === 'Due Soon') return 'Medium'
  return 'Low'
}

