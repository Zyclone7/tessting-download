"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, CreditCard, Building, UserCheck } from "lucide-react"

interface UserStatisticsProps {
  data: any[]
}

export function UserStatistics({ data }: UserStatisticsProps) {
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalCredits: 0,
        roleBreakdown: {},
        merchantsCount: 0,
      }
    }

    return data.reduce(
      (acc, user) => {
        // Count active users
        if (user.user_status === 1) {
          acc.activeUsers++
        }

        // Sum credits
        acc.totalCredits += user.user_credits || 0

        // Count by role
        const role = user.user_role || "Unknown"
        acc.roleBreakdown[role] = (acc.roleBreakdown[role] || 0) + 1

        // Count merchants
        if (user.merchant_id) {
          acc.merchantsCount++
        }

        return acc
      },
      {
        totalUsers: data.length,
        activeUsers: 0,
        totalCredits: 0,
        roleBreakdown: {},
        merchantsCount: 0,
      },
    )
  }, [data])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeUsers} active, {stats.totalUsers - stats.activeUsers} inactive
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCredits.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Avg: {stats.totalUsers ? (stats.totalCredits / stats.totalUsers).toFixed(2) : "0.00"} per user
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Merchants</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.merchantsCount.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.merchantsCount / stats.totalUsers) * 100).toFixed(1)}% of total users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">User Roles</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Object.keys(stats.roleBreakdown).length} types</div>
          <p className="text-xs text-muted-foreground">
            {stats.roleBreakdown["Basic_Merchant_Package"] || 0} basic,{" "}
            {stats.roleBreakdown["Premium_Merchant_Package"] || 0} premium
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

