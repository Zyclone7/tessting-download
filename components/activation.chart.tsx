import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface ActivationChartProps {
  availableCount: number
  redeemedCount: number
}

export function ActivationChart({ availableCount, redeemedCount }: ActivationChartProps) {
  const data = [
    { name: 'Available', value: availableCount },
    { name: 'Used', value: redeemedCount },
  ]

  const COLORS = ['#0088FE', '#00C49F']

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

