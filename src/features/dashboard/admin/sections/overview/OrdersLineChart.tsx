import type { TrendPoint } from '../../../shared/types/dashboard.types'

interface OrdersLineChartProps {
  data: TrendPoint[]
}

export default function OrdersLineChart({ data }: OrdersLineChartProps) {
  const W = 360
  const H = 130
  const padL = 14, padR = 14, padT = 18, padB = 28
  const chartW = W - padL - padR
  const chartH = H - padT - padB

  if (!data || data.length === 0) {
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="system-ui, sans-serif">
          No order trend data
        </text>
      </svg>
    )
  }

  if (data.length === 1) {
    const x = W / 2
    const y = padT + chartH / 2
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <circle cx={x} cy={y} r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
        <text x={x} y={H - 6} textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="system-ui, sans-serif">
          {data[0]?.month ?? 'Now'}
        </text>
      </svg>
    )
  }

  const orders = data.map((d) => d.orders ?? 0)
  const max = Math.max(...orders)
  const min = Math.min(...orders) - 8

  const pts = data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * chartW
    const y = padT + chartH - (((d.orders ?? 0) - min) / (max - min)) * chartH
    return [x, y] as [number, number]
  })

  const pathD = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const lastPt = pts[pts.length - 1]
  if (!lastPt) {
    return null
  }
  const areaD = `${pathD} L${lastPt[0].toFixed(1)},${padT + chartH} L${padL},${padT + chartH} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="ov-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#ov-area-grad)" />
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
          <text x={x} y={H - 6} textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="system-ui, sans-serif">
            {data[i].month}
          </text>
        </g>
      ))}
    </svg>
  )
}
