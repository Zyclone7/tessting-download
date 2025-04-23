"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, Clock, Users } from "lucide-react"

interface KYCStatisticsProps {
  data: any[]
}

export function KYCStatistics({ data }: KYCStatisticsProps) {
  const stats = useMemo(() => {
    const total = data.length
    const pending = data.filter((item) => item.status?.toLowerCase() === "pending").length
    const approved = data.filter((item) => item.status?.toLowerCase() === "approved").length
    const rejected = data.filter((item) => item.status?.toLowerCase() === "rejected").length

    // Calculate percentages
    const pendingPercent = total > 0 ? Math.round((pending / total) * 100) : 0
    const approvedPercent = total > 0 ? Math.round((approved / total) * 100) : 0
    const rejectedPercent = total > 0 ? Math.round((rejected / total) * 100) : 0

    return {
      total,
      pending,
      approved,
      rejected,
      pendingPercent,
      approvedPercent,
      rejectedPercent,
    }
  }, [data])

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">All KYC verification requests</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
            <div className="text-xs font-medium text-amber-500">{stats.pendingPercent}%</div>
          </div>
          <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${stats.pendingPercent}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approved}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Successfully verified</p>
            <div className="text-xs font-medium text-green-500">{stats.approvedPercent}%</div>
          </div>
          <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.approvedPercent}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.rejected}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Failed verification</p>
            <div className="text-xs font-medium text-red-500">{stats.rejectedPercent}%</div>
          </div>
          <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${stats.rejectedPercent}%` }} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
