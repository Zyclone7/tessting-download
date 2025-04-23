import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: number
  format?: "currency" | "number"
}

export function StatCard({ title, value, format = "number" }: StatCardProps) {
  const formattedValue =
    format === "currency"
      ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value)
      : value.toLocaleString()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
      </CardContent>
    </Card>
  )
}
