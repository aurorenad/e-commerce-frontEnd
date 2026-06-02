import { useEffect, useMemo, useState } from 'react'
import { fetchFinancingApplications } from '../../../services/payments.service'
import { mapFinancingToFoRequest, type ApiFinancingWithRepayments } from '../../../lib/mappers'
import DonutChart from '../shared/components/DonutChart'
import { FoKpiCard, StatusBadge } from './FoBadges'
import FoBarChart from './FoBarChart'
import FoLineChart from './FoLineChart'

export default function FoOverviewPage() {
  const [apps, setApps] = useState<ApiFinancingWithRepayments[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetchFinancingApplications()
      .then((rows) => { setApps(rows); setLoadError(null) })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load finance overview'))
  }, [])

  const { kpis, pieData, monthlyLoans, approvalTrend, recent } = useMemo(() => {
    const total = apps.length
    const approved = apps.filter((a) => a.status === 'APPROVED')
    const rejected = apps.filter((a) => a.status === 'REJECTED')
    const pending = apps.filter((a) => a.status === 'PENDING')
    const approvalRate = total > 0 ? Math.round((approved.length / total) * 100) : 0
    const portfolio = approved.reduce((sum, a) => sum + a.totalAmount, 0)

    const byMonth: Record<string, { total: number; approved: number }> = {}
    apps.forEach((a) => {
      const label = new Date(a.createdAt ?? Date.now()).toLocaleDateString('en-US', { month: 'short' })
      if (!byMonth[label]) byMonth[label] = { total: 0, approved: 0 }
      byMonth[label].total += 1
      if (a.status === 'APPROVED') byMonth[label].approved += 1
    })
    const monthlyKeys = Object.keys(byMonth)
    const monthly = monthlyKeys.map((k) => ({ month: k, count: byMonth[k].total }))
    const trend = monthlyKeys.map((k) => ({
      month: k,
      rate: byMonth[k].total > 0 ? Math.round((byMonth[k].approved / byMonth[k].total) * 100) : 0,
    }))

    return {
      kpis: [
        { label: 'Total Applications', value: `${total}`, change: `${pending.length} pending`, trend: pending.length > 0 ? 'up' : 'down', icon: 'stack' },
        { label: 'Approval Rate', value: `${approvalRate}%`, change: `${approved.length} approved`, trend: approvalRate >= 50 ? 'up' : 'down', icon: 'pulse' },
        { label: 'Rejected', value: `${rejected.length}`, change: `${total > 0 ? Math.round((rejected.length / total) * 100) : 0}%`, trend: rejected.length > 0 ? 'down' : 'up', icon: 'alert' },
        { label: 'Portfolio Value', value: `$${Math.round(portfolio).toLocaleString()}`, change: `${approved.length} active`, trend: 'up', icon: 'dollar' },
      ],
      pieData: [
        { label: 'Approved', value: approved.length, color: '#16a34a' },
        { label: 'Pending', value: pending.length, color: '#f59e0b' },
        { label: 'Rejected', value: rejected.length, color: '#ef4444' },
      ],
      monthlyLoans: monthly.length > 0 ? monthly : [{ month: 'N/A', count: 0 }],
      approvalTrend: trend.length > 1 ? trend : [{ month: 'N/A', rate: 0 }, { month: 'N/A2', rate: 0 }],
      recent: apps.map(mapFinancingToFoRequest).slice(0, 5),
    }
  }, [apps])

  return (
    <div className="fo-page-wrap">
      {loadError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{loadError}</p>}
      <div className="fo-kpi-grid">
        {kpis.map((s) => <FoKpiCard key={s.label} stat={s} />)}
      </div>

      <div className="fo-charts-row">
        <div className="fo-chart-card">
          <h3 className="fo-chart-title">Loan Status Distribution</h3>
          <div className="fo-donut-wrap">
            <DonutChart data={pieData} size={170} centerLabel={`${apps.length}`} centerSub="Total Loans" />
            <ul className="fo-donut-legend">
              {pieData.map((d) => (
                <li key={d.label} className="fo-legend-item">
                  <span className="fo-legend-dot" style={{ background: d.color }} />
                  <span className="fo-legend-label">{d.label}</span>
                  <span className="fo-legend-val">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="fo-chart-card">
          <h3 className="fo-chart-title">Monthly Loans Issued</h3>
          <FoBarChart data={monthlyLoans} />
        </div>
        <div className="fo-chart-card">
          <h3 className="fo-chart-title">Approval Rate Trend</h3>
          <FoLineChart data={approvalTrend} />
          <p className="fo-chart-hint">Current month: <strong>{approvalTrend[approvalTrend.length - 1]?.rate ?? 0}%</strong></p>
        </div>
      </div>

      <div className="fo-panel-card fo-recent-requests">
        <h3 className="fo-panel-title">Recent Requests</h3>
        <div className="fo-table-scroll">
          <table className="fo-table">
            <thead>
              <tr><th>Ref</th><th>Customer</th><th>Device</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.ref}>
                  <td className="fo-ref-cell">{r.ref}</td>
                  <td>{r.customer}</td>
                  <td>{r.device}</td>
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
