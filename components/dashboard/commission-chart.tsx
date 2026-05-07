'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { MonthlyCommission } from '@/app/(app)/dashboard/actions'

function formatYAxis(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`
  return `₹${value}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E7E3DC] rounded-lg px-3 py-2 shadow-sm text-sm">
      <p className="text-[#78716C] mb-0.5">{label}</p>
      <p className="font-semibold text-[#92400E]">
        {new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(payload[0].value)}
      </p>
    </div>
  )
}

interface CommissionChartProps {
  data: MonthlyCommission[]
}

export function CommissionChart({ data }: CommissionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DC" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#78716C' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11, fill: '#78716C' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FAF7F2' }} />
        <Bar dataKey="commission" fill="#92400E" radius={[3, 3, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
