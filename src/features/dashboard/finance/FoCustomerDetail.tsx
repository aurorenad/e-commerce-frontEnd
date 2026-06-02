import { StatusBadge, RiskBadge } from './FoBadges'
import type { FoCustomer } from './foHelpers'

interface Props {
  customer: FoCustomer
  onBack: () => void
}

export default function FoCustomerDetail({ customer, onBack }: Props) {
  const loanHistory = customer.loanHistory ?? []
  const initials = customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)

  return (
    <div className="fo-page-wrap">
      <button className="fo-back-btn" onClick={onBack}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        Back to Customers
      </button>

      <div className="fo-cust-header">
        <div className="fo-cust-avatar">{initials}</div>
        <div>
          <h2 className="fo-cust-name">{customer.name}</h2>
          <p className="fo-muted">{customer.id} · {customer.email} · {customer.phone}</p>
        </div>
        <div className="fo-cust-badges">
          <StatusBadge status={customer.status} />
          <RiskBadge level={customer.riskLevel} />
        </div>
      </div>

      <div className="fo-cust-stats-row">
        <div className="fo-cust-stat">
          <span className="fo-cust-stat-val">{customer.loans}</span>
          <span className="fo-cust-stat-label">Total Loans</span>
        </div>
        <div className="fo-cust-stat">
          <span className="fo-cust-stat-val">{customer.totalBorrowed}</span>
          <span className="fo-cust-stat-label">Total Borrowed</span>
        </div>
        <div className="fo-cust-stat">
          <span className="fo-cust-stat-val"><RiskBadge level={customer.riskLevel} /></span>
          <span className="fo-cust-stat-label">Risk Level</span>
        </div>
      </div>

      <div className="fo-panel-card">
        <h3 className="fo-panel-title">Loan History</h3>
        {loanHistory.length === 0
          ? <p className="fo-muted" style={{ padding: '16px' }}>No active loans on record.</p>
          : (
            <div className="fo-table-scroll">
              <table className="fo-table">
                <thead><tr><th>Ref</th><th>Device</th><th>Monthly</th><th>Remaining</th><th>Next Due</th><th>Status</th></tr></thead>
                <tbody>
                  {loanHistory.map((l) => (
                    <tr key={l.ref}>
                      <td className="fo-ref-cell">{l.ref}</td>
                      <td>{l.device}</td>
                      <td>{l.monthly}</td>
                      <td>{l.remaining}</td>
                      <td>{l.nextDue}</td>
                      <td><StatusBadge status={l.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  )
}
