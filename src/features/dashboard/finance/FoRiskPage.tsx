import { useEffect, useState } from 'react'
import { fetchFinancingApplications } from '../../../services/payments.service'
import { RiskBadge } from './FoBadges'
import type { FoDelinquent } from './foHelpers'
import type { ApiFinancingWithRepayments } from '../../../lib/mappers'
import { getRiskLevel } from './foData'

export default function FoRiskPage() {
  const [apps, setApps] = useState<ApiFinancingWithRepayments[]>([])
  const [list, setList]   = useState<FoDelinquent[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetchFinancingApplications({ status: 'APPROVED' })
      .then((rows) => { setApps(rows); setLoadError(null) })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load delinquency data'))
  }, [])

  useEffect(() => {
    const next = apps
      .map((app): FoDelinquent | null => {
        const overdue = (app.repayments ?? []).filter((r) => r.status !== 'PAID' && new Date(r.dueDate).getTime() < Date.now())
        if (overdue.length === 0) return null
        const maxDays = Math.max(...overdue.map((r) => Math.max(1, Math.floor((Date.now() - new Date(r.dueDate).getTime()) / (1000 * 60 * 60 * 24)))))
        const amountDue = overdue.reduce((sum, r) => sum + r.amountDue, 0)
        const unpaid = (app.repayments ?? []).filter((r) => r.status !== 'PAID').reduce((sum, r) => sum + r.amountDue, 0)
        return {
          ref: app.id.slice(0, 8).toUpperCase(),
          customer: app.customer ? `${app.customer.firstName} ${app.customer.lastName}` : 'Customer',
          device: app.device ? `${app.device.brand} ${app.device.model}` : 'Device',
          overdueDays: maxDays,
          amountDue: `$${amountDue.toFixed(2)}`,
          totalOwed: `$${unpaid.toFixed(2)}`,
          riskLevel: getRiskLevel(app),
          phone: app.customer?.phone || '—',
        }
      })
      .filter((item): item is FoDelinquent => item !== null)
    setList(next)
  }, [apps])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }
  const markPaid     = (ref: string) => { setList((prev) => prev.filter((r) => r.ref !== ref)); showToast('Marked as paid and removed from delinquency list.') }
  const sendReminder = (ref: string) => showToast(`Payment reminder sent for ${ref}.`)
  const escalate     = (ref: string) => showToast(`${ref} escalated to collections team.`)

  return (
    <div className="fo-page-wrap">
      {loadError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{loadError}</p>}
      <div className="fo-risk-summary-row">
        {[
          { label: 'Critical',     cls: 'fo-risk-card-red',    val: list.filter((r) => r.riskLevel === 'Critical').length },
          { label: 'High Risk',    cls: 'fo-risk-card-orange', val: list.filter((r) => r.riskLevel === 'High').length },
          { label: 'Medium Risk',  cls: 'fo-risk-card-yellow', val: list.filter((r) => r.riskLevel === 'Medium').length },
          { label: '$ Overdue',    cls: 'fo-risk-card-blue',   val: '$' + list.reduce((s, r) => s + parseFloat(r.amountDue.replace('$', '')), 0).toFixed(2) },
        ].map((s) => (
          <div key={s.label} className={`fo-risk-stat-card ${s.cls}`}>
            <p className="fo-risk-stat-val">{s.val}</p>
            <p className="fo-risk-stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="fo-panel-card">
        <h3 className="fo-panel-title">Delinquent Accounts</h3>
        <div className="fo-table-scroll">
          <table className="fo-table">
            <thead><tr><th>Ref</th><th>Customer</th><th>Device</th><th>Overdue</th><th>Amount Due</th><th>Total Owed</th><th>Risk</th><th>Actions</th></tr></thead>
            <tbody>
              {list.length === 0
                ? <tr><td colSpan={8} className="fo-table-empty">No delinquent accounts.</td></tr>
                : list.map((r) => (
                  <tr key={r.ref}>
                    <td className="fo-ref-cell">{r.ref}</td>
                    <td><div>{r.customer}</div><div className="fo-muted">{r.phone}</div></td>
                    <td>{r.device}</td>
                    <td className="fo-due-overdue">{r.overdueDays}d</td>
                    <td>{r.amountDue}</td>
                    <td>{r.totalOwed}</td>
                    <td><RiskBadge level={r.riskLevel} /></td>
                    <td>
                      <div className="fo-action-btns">
                        <button className="fo-btn-view" onClick={() => sendReminder(r.ref)}>Remind</button>
                        <button className="fo-btn-approve" onClick={() => markPaid(r.ref)}>Paid</button>
                        <button className="fo-btn-reject" onClick={() => escalate(r.ref)}>Escalate</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <div className="fo-toast">{toast}</div>}
    </div>
  )
}
