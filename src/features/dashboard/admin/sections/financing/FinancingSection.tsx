import { useMemo, useState, useEffect } from 'react'
import { fetchFinancingApplications } from '../../../../../services/payments.service'
import { mapFinancingToLoan } from '../../../../../lib/mappers'
import type { Loan } from '../../../shared/types/dashboard.types'
import MiniKpiCard from '../../../shared/components/MiniKpiCard'
import LoanViewModal from './LoanViewModal'
import { calcMonthly, finRisk, finDue, finStatusPill, finRiskOrder } from './financingHelpers'
import '../../../shared/styles/dashboard-shared.css'
import './FinancingSection.css'

export default function FinancingSection() {
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [termFilter, setTermFilter]     = useState('all')
  const [loans, setLoans]               = useState<Loan[]>([])
  const [loadError, setLoadError]       = useState<string | null>(null)
  const [viewLoan, setViewLoan]         = useState<Loan | null>(null)

  useEffect(() => {
    fetchFinancingApplications()
      .then((apps) => { setLoans(apps.map(mapFinancingToLoan)); setLoadError(null) })
      .catch((err) => { setLoans([]); setLoadError(err instanceof Error ? err.message : 'Failed to load financing') })
  }, [])
  const [sortKey, setSortKey]           = useState<string | null>(null)
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const kpis = useMemo(() => {
    const active      = loans.filter((l) => l.status === 'Active' || l.status === 'Approved')
    const delinquent  = loans.filter((l) => l.status === 'Delinquent')
    const outstanding = active.reduce((s, l) => s + l.principal, 0)
    const overdue     = delinquent.reduce((s, l) => s + l.principal, 0)
    return { activeCount: active.length, outstanding, delinquentCount: delinquent.length, overdue }
  }, [loans])

  const filtered = useMemo(() => {
    let list = [...loans]
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((f) =>
      f.ref.toLowerCase().includes(q) ||
      f.customer.toLowerCase().includes(q) ||
      f.device.toLowerCase().includes(q),
    )
    if (statusFilter !== 'all') list = list.filter((f) => f.status.toLowerCase().replace(' ', '-') === statusFilter)
    if (termFilter   !== 'all') list = list.filter((f) => String(f.term) === termFilter)
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let va: number, vb: number
        if (sortKey === 'principal') { va = a.principal; vb = b.principal }
        else if (sortKey === 'risk') {
          va = finRiskOrder[finRisk(a.apr, a.status)] ?? 0
          vb = finRiskOrder[finRisk(b.apr, b.status)] ?? 0
        } else {
          va = a.nextDue ? new Date(a.nextDue).getTime() : Infinity
          vb = b.nextDue ? new Date(b.nextDue).getTime() : Infinity
        }
        return sortDir === 'asc' ? va - vb : vb - va
      })
    }
    return list
  }, [search, statusFilter, termFilter, sortKey, sortDir, loans])

  const exportLoans = () => {
    const headers = ['Ref', 'Customer', 'Device', 'Amount', 'Term', 'APR', 'Monthly', 'Risk', 'Status', 'Next Due']
    const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
    const rows = filtered.map((l) => {
      const m   = calcMonthly(l.principal, l.apr, l.term)
      const due = finDue(l.nextDue)
      return [l.ref, l.customer, l.device, `$${l.principal}`, `${l.term} mo`, `${l.apr}%`, `$${m.toFixed(2)}/mo`, finRisk(l.apr, l.status), l.status, due.label]
    })
    const csv  = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `loans-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const SortBtn = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <button type="button" className="fin-sort-btn" onClick={() => handleSort(k)}>
      {children}
      <span className={`fin-sort-icon ${sortKey === k ? 'fin-sort-icon--active' : ''}`}>
        {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  )

  return (
    <div className="section-stack">
      {loadError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{loadError}</p>}
      <section className="mini-kpi-grid">
        <MiniKpiCard label="Active Loans"      value={kpis.activeCount}                        hint={`$${kpis.outstanding.toLocaleString()} outstanding`} />
        <MiniKpiCard label="Delinquent"        value={kpis.delinquentCount}                    hint={`${kpis.delinquentCount} accounts at risk`} />
        <MiniKpiCard label="Total Outstanding" value={`$${kpis.outstanding.toLocaleString()}`} hint="Active + Approved" />
        <MiniKpiCard label="Overdue Amount"    value={`$${kpis.overdue.toLocaleString()}`}     hint="Requires immediate action" />
      </section>

      <article className="panel-card">
        <div className="fin-top-bar">
          <div className="fin-top-left">
            <div className="search-field search-field--compact">
              <svg className="icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/>
              </svg>
              <input type="search" placeholder="Search ref, customer, or device..." value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="um-filters">
              <label className="um-filter-group">
                <span className="um-filter-label">Status</span>
                <select className="um-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="approved">Approved</option>
                  <option value="under-review">Under Review</option>
                  <option value="delinquent">Delinquent</option>
                  <option value="settled">Settled</option>
                </select>
              </label>
              <label className="um-filter-group">
                <span className="um-filter-label">Term</span>
                <select className="um-select" value={termFilter} onChange={(e) => setTermFilter(e.target.value)}>
                  <option value="all">All terms</option>
                  <option value="12">12 months</option>
                  <option value="18">18 months</option>
                  <option value="24">24 months</option>
                </select>
              </label>
              {(statusFilter !== 'all' || termFilter !== 'all' || search) && (
                <button type="button" className="fin-reset-btn"
                  onClick={() => { setStatusFilter('all'); setTermFilter('all'); setSearch('') }}>
                  Reset
                </button>
              )}
            </div>
          </div>
          <div className="fin-top-actions">
            <button type="button" className="fin-top-btn fin-top-btn--secondary" onClick={exportLoans}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        <div className="fin-summary-bar">
          <span>Showing <strong>{filtered.length}</strong> of <strong>{loans.length}</strong> loans</span>
          <span>Total Value: <strong>${filtered.reduce((s, l) => s + l.principal, 0).toLocaleString()}</strong></span>
          <span>Delinquent: <strong className="fin-summary-red">{filtered.filter((l) => l.status === 'Delinquent').length}</strong></span>
        </div>

        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ref</th><th>Customer</th><th>Device</th>
                <th><SortBtn k="principal">Amount</SortBtn></th>
                <th>Term</th><th>APR</th><th>Monthly</th>
                <th><SortBtn k="risk">Risk</SortBtn></th>
                <th>Status</th>
                <th><SortBtn k="nextDue">Next Due</SortBtn></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11}>
                  <div className="fin-empty">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" aria-hidden>
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <p className="fin-empty-title">No loans found</p>
                    <p className="fin-empty-hint">Try adjusting your filters or search term.</p>
                  </div>
                </td></tr>
              ) : filtered.map((row) => {
                const monthly  = calcMonthly(row.principal, row.apr, row.term)
                const risk     = finRisk(row.apr, row.status)
                const due      = finDue(row.nextDue)
                const rowClass = ['fin-row',
                  row.status === 'Delinquent'                    ? 'fin-row--delinquent' : '',
                  risk === 'High' && row.status !== 'Delinquent' ? 'fin-row--high'       : '',
                ].filter(Boolean).join(' ')
                return (
                  <tr key={row.ref} className={rowClass} onClick={() => setViewLoan(row)}>
                    <td className="cell-mono">{row.ref}</td>
                    <td className="cell-bold">{row.customer}</td>
                    <td className="fin-cell-device">{row.device}</td>
                    <td className="fin-cell-amount">${row.principal.toLocaleString()}</td>
                    <td className="fin-cell-light">{row.term} mo</td>
                    <td className="fin-cell-light">{row.apr}%</td>
                    <td className="fin-monthly">${monthly.toFixed(0)}/mo</td>
                    <td><span className={`risk-pill risk-${risk.toLowerCase()}`}>{risk}</span></td>
                    <td><span className={`fin-pill ${finStatusPill(row.status)}`}>{row.status}</span></td>
                    <td><span className={due.cls}>{due.label}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="fin-actions">
                        <button type="button" className="fin-action-btn fin-action-view" onClick={() => setViewLoan(row)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </article>

      {viewLoan && <LoanViewModal loan={viewLoan} onClose={() => setViewLoan(null)} />}
    </div>
  )
}
