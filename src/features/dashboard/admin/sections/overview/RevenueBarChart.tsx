import type { TrendPoint } from '../../../shared/types/dashboard.types'

interface RevenueBarChartProps {
  data: TrendPoint[]
}

export default function RevenueBarChart({ data }: RevenueBarChartProps) {
  const W = 400
  const H = 170
  const padL = 10, padR = 10, padT = 28, padB = 26
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  if (!data || data.length === 0) {
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="system-ui, sans-serif">
          No revenue data
        </text>
      </svg>
    )
  }
  const max = Math.max(...data.map((d) => d.revenue ?? 0))
  const step = chartW / data.length
  const barW = Math.floor(step * 0.55)
  const fmtK = (v: number) => '$' + Math.round(v / 1000) + 'K'

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="ov-bar-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const rev = d.revenue ?? 0
        const bh = max > 0 ? Math.max(6, (rev / max) * chartH) : 6
        const x = padL + i * step + (step - barW) / 2
        const y = padT + chartH - bh
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx="5" fill="url(#ov-bar-grad)" />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="#374151" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">
              {fmtK(rev)}
            </text>
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui, sans-serif">
              {d.month}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
