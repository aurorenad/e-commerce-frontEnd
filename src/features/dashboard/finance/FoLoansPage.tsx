import { useMemo, useState, useEffect } from 'react'
import { fetchFinancingApplications } from '../../../services/payments.service'
import { StatusBadge } from './FoBadges'
import type { ApiFinancingWithRepayments } from '../../../lib/mappers'
import { formatUsd, getLoanHealthStatus } from './foData'

export default function FoLoansPage() {
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate]   = useState(false)
  const [apps, setApps] = useState<ApiFinancingWithRepayments[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetchFinancingApplications({ status: 'APPROVED' })
      .then((rows) => { setApps(rows); setLoadError(null) })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load loans'))
  }, [])

  const filtered = useMemo(() => {
    let list = apps.map((app) => {
      const nextUnpaid = (app.repayments ?? []).find((r) => r.status !== 'PAID')
      const unpaidCount = (app.repayments ?? []).filter((r) => r.status !== 'PAID').length
      return {
        ref: app.id.slice(0, 8).toUpperCase(),
        customer: app.customer ? `${app.customer.firstName} ${app.customer.lastName}` : 'Customer',
        device: app.device ? `${app.device.brand} ${app.device.model}` : 'Device',
        monthly: formatUsd(app.monthlyRepayment),
        remaining: formatUsd(unpaidCount > 0 ? unpaidCount * app.monthlyRepayment : 0),
        nextDue: nextUnpaid
          ? new Date(nextUnpaid.dueDate).toISOString().slice(0, 10)
          : '—',
        status: getLoanHealthStatus(app),
      }
    })
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((r) => r.ref.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q))
    if (statusFilter !== 'all') list = list.filter((r) => r.status.toLowerCase().replace(' ', '-') === statusFilter)
    return list
  }, [apps, search, statusFilter])

  return (
    <div className="fo-page-wrap">
      {loadError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{loadError}</p>}
      <div className="fo-toolbar">
        <div className="fo-search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3-3" /></svg>
          <input type="search" placeholder="Search customer or ref…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="fo-toolbar-right">
          <label className="fo-filter-group">
            <span className="fo-filter-label">Status</span>
            <select className="fo-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="current">Current</option>
              <option value="due-soon">Due Soon</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <button className="fo-btn-create" onClick={() => setShowCreate(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Loan
          </button>
        </div>
      </div>

      <div className="fo-legend-inline">
        <span className="fo-dot fo-dot-overdue" /> Overdue
        <span className="fo-dot fo-dot-due-soon" /> Due Soon
        <span className="fo-dot fo-dot-current" /> Current
      </div>

      {showCreate && (
        <div className="fo-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="fo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fo-modal-header">
              <h3>Create New Loan</h3>
              <button type="button" className="fo-modal-close" onClick={() => setShowCreate(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="fo-modal-body">
              <p className="fo-muted" style={{ marginBottom: '20px' }}>Fill in the details below to create a new financing loan.</p>
              {[['Customer Name', 'text', 'e.g. Jean Baptiste N.'], ['Device', 'text', 'e.g. iPhone 15 Pro'], ['Principal Amount ($)', 'number', 'e.g. 1099'], ['APR (%)', 'number', 'e.g. 14.5'], ['Term (months)', 'number', 'e.g. 12']].map(([label, type, placeholder]) => (
                <label key={label as string} className="fo-settings-field" style={{ marginBottom: '14px' }}>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  <input type={type as string} className="fo-form-input" placeholder={placeholder as string} />
                </label>
              ))}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button className="fo-btn-approve" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Create Loan</button>
                <button className="fo-btn-view" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fo-panel-card">
        <div className="fo-table-scroll">
          <table className="fo-table">
            <thead><tr><th>Ref</th><th>Customer</th><th>Device</th><th>Monthly</th><th>Remaining</th><th>Next Due</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.ref} className={r.status === 'Overdue' ? 'fo-row-overdue' : r.status === 'Due Soon' ? 'fo-row-due-soon' : ''}>
                  <td className="fo-ref-cell">{r.ref}</td>
                  <td>{r.customer}</td>
                  <td>{r.device}</td>
                  <td>{r.monthly}</td>
                  <td>{r.remaining}</td>
                  <td className={r.status === 'Overdue' ? 'fo-due-overdue' : r.status === 'Due Soon' ? 'fo-due-soon' : ''}>{r.nextDue}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
