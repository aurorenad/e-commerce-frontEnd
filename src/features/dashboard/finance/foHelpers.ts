export interface FoRequest {
  id: string
  ref: string; customer: string; device: string; price: string
  term: string; apr: string; status: string; appliedAt: string
}

export interface FoLoan {
  ref: string; customer: string; device: string; monthly: string
  remaining: string; nextDue: string; status: string
}

export interface FoDelinquent {
  ref: string; customer: string; device: string; overdueDays: number
  amountDue: string; totalOwed: string; riskLevel: string; phone: string
}

export interface FoCustomer {
  id: string; name: string; email: string; phone: string
  loans: number; totalBorrowed: string; riskLevel: string; status: string
}

export interface FoRegionalReport {
  region: string; disbursed: string; collected: string
  outstanding: string; defaultRate: string; loanCount: number
}

export interface FoSettings {
  interestRates: { standard: number; premium: number; business: number }
  loanTerms: number[]
  lateFeePercent: number; gracePeriodDays: number
  autoReminder: boolean; reminderDaysBefore: number
  escalationThresholdDays: number; language: string; currency: string
}

export interface FoActivityItem {
  id: string; at: string; action: string; type: string
}

export interface FoKpiStat {
  label: string; value: string; change: string; trend: string; icon: string
}

export interface FoMonthlyLoan { month: string; count: number }
export interface FoApprovalTrend { month: string; rate: number }
export interface FoLoanPie { label: string; value: number; color: string }

export const FINANCING_SUB = [
  { id: 'requests', label: 'Financing Requests' },
  { id: 'loans',    label: 'Active Loans' },
  { id: 'risk',     label: 'Risk & Delinquency' },
] as const

export const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  overview:  { title: 'Overview',           subtitle: 'Monitor loan portfolio health, approvals, and revenue performance.' },
  requests:  { title: 'Financing Requests', subtitle: 'Review and action incoming financing applications from customers.' },
  loans:     { title: 'Active Loans',       subtitle: 'Track all active loan accounts, due dates, and payment statuses.' },
  risk:      { title: 'Risk & Delinquency', subtitle: 'Identify delinquent accounts and take action to recover outstanding amounts.' },
  customers: { title: 'Customers',          subtitle: 'Browse customer profiles, loan history, and risk assessments.' },
  reports:   { title: 'Analytics',          subtitle: 'Analyze regional revenue, collection performance, and export data.' },
  settings:  { title: 'Settings',           subtitle: 'Configure interest rates, loan terms, fees, and notification rules.' },
  profile:   { title: 'My Profile',         subtitle: 'Manage your account details, photo, and review your activity log.' },
}

export const FO_STATIC_ALERTS = [
  { type: 'error' as const, msg: '5 loans overdue by more than 7 days — escalation recommended.' },
  { type: 'warn'  as const, msg: '63 new financing requests awaiting review.' },
  { type: 'info'  as const, msg: 'Approval rate hit 87% this month — all-time high.' },
]
