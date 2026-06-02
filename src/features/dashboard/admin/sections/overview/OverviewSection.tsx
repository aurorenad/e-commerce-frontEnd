import { useEffect, useState } from 'react'
import { fetchDashboardStats, fetchSystemLogs, type ApiSystemLog } from '../../../../../services/admin.service'
import DonutChart from '../../../shared/components/DonutChart'
import RevenueBarChart from './RevenueBarChart'
import OrdersLineChart from './OrdersLineChart'
import StatIcon from './StatIcon'
import type { StatIconType } from './StatIcon'
import './OverviewSection.css'

export default function OverviewSection() {
  const [stats, setStats] = useState<Array<{ label: string; value: string; change: string; trend: 'up' | 'down'; icon: string }>>([])
  const [pieData, setPieData] = useState<Array<{ label: string; value: number; color: string }>>([])
  const [revenueTrend, setRevenueTrend] = useState<Array<{ month: string; revenue: number }>>([])
  const [ordersTrend, setOrdersTrend] = useState<Array<{ month: string; orders: number }>>([])
  const [systemLogs, setSystemLogs] = useState<ApiSystemLog[]>([])

  useEffect(() => {
    fetchDashboardStats()
      .then((data) => {
        setStats([
          { label: 'Total Revenue', value: `$${data.sales.totalRevenue.toLocaleString()}`, change: `${data.sales.totalOrdersPaid} orders`, trend: 'up' as const, icon: 'revenue' },
          { label: 'Ready for Sale', value: String(data.inventory.readyForSaleCount), change: `${data.inventory.soldCount} sold`, trend: 'up' as const, icon: 'devices' },
          { label: 'In Repair', value: String(data.inventory.repairingCount), change: `${data.inventory.intakeCount} intake`, trend: 'down' as const, icon: 'repair' },
          { label: 'Financing Pending', value: String(data.financing.pendingApplications), change: `${data.financing.overduePayments} overdue`, trend: 'down' as const, icon: 'finance' },
        ])
        setPieData([
          { label: 'Ready', value: data.inventory.readyForSaleCount, color: '#127058' },
          { label: 'Repairing', value: data.inventory.repairingCount, color: '#ef9f27' },
          { label: 'Intake', value: data.inventory.intakeCount, color: '#3b82f6' },
          { label: 'Sold', value: data.inventory.soldCount, color: '#94a3b8' },
        ])
        setRevenueTrend([{ month: 'Now', revenue: data.sales.totalRevenue }])
        setOrdersTrend([{ month: 'Now', orders: data.sales.totalOrdersPaid }])
      })
      .catch(() => {})
    fetchSystemLogs(30)
      .then(setSystemLogs)
      .catch(() => {})
  }, [])

  const total = pieData.reduce((s, d) => s + d.value, 0)
  const currentOrders = ordersTrend.length ? ordersTrend[ordersTrend.length - 1].orders : 0

  return (
    <div className="overview-stack">
      <section className="ov-kpi-grid" aria-label="Key metrics">
        {stats.map((stat) => (
          <article className="ov-kpi-card" key={stat.label}>
            <div className="ov-kpi-top">
              <StatIcon type={stat.icon as StatIconType} />
              <span className={`ov-kpi-trend ${stat.trend}`}>
                {stat.trend === 'up' ? '↗' : '↘'} {stat.change}
              </span>
            </div>
            <p className="ov-kpi-label">{stat.label}</p>
            <p className="ov-kpi-value">{stat.value}</p>
          </article>
        ))}
      </section>

      <div className="ov-charts-row">
        <div className="ov-chart-card">
          <h3 className="ov-chart-title">Distribution Overview</h3>
          <div className="ov-donut-wrap">
            <DonutChart
              data={pieData}
              size={160}
              centerLabel={total.toLocaleString()}
              centerSub="Total"
            />
            <ul className="ov-donut-legend">
              {pieData.map((d) => (
                <li key={d.label} className="ov-legend-item">
                  <span className="ov-legend-dot" style={{ background: d.color }} />
                  <span className="ov-legend-label">{d.label}</span>
                  <span className="ov-legend-val">{d.value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ov-chart-card">
          <h3 className="ov-chart-title">Monthly Revenue</h3>
          <RevenueBarChart data={revenueTrend} />
          <p className="ov-chart-hint">
            Current total: <strong>${revenueTrend.length ? revenueTrend[revenueTrend.length - 1].revenue.toLocaleString() : '0'}</strong>
          </p>
        </div>

        <div className="ov-chart-card">
          <h3 className="ov-chart-title">Orders Trend</h3>
          <OrdersLineChart data={ordersTrend} />
          <p className="ov-chart-hint">
            Current month: <strong>{currentOrders} orders</strong>
          </p>
        </div>
      </div>

      <div className="ov-chart-card">
        <h3 className="ov-chart-title">System Logs</h3>
        {systemLogs.length === 0 ? (
          <p className="ov-chart-hint">No logs available.</p>
        ) : (
          <div className="ov-logs-list">
            {systemLogs.map((log) => (
              <div key={log.id} className="ov-log-item">
                <div className="ov-log-row">
                  <strong>{log.action}</strong>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <p>{log.details}</p>
                {log.user?.email && (
                  <small>
                    {`${log.user.firstName} ${log.user.lastName}`.trim()} ({log.user.email})
                  </small>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
