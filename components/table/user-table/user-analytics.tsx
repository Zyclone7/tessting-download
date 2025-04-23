"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, BarChart, PieChart } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Format number with commas
const formatNumber = (num: number | string | null | undefined): string => {
    if (num === null || num === undefined || num === "") return "0.00"
    const numValue = typeof num === "string" ? Number.parseFloat(num) : num
    return numValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Format date
const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

interface UserAnalyticsProps {
    data: any[]
}

export function UserAnalytics({ data }: UserAnalyticsProps) {
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y" | "all">("30d")

    // Calculate statistics
    const totalUsers = data.length
    const activeUsers = data.filter((user) => user.user_status === 1).length
    const inactiveUsers = totalUsers - activeUsers

    // Calculate total credits
    const totalCredits = data.reduce((sum, user) => {
        const credits = user.user_credits ? Number.parseFloat(user.user_credits) : 0
        return sum + credits
    }, 0)

    // Calculate user roles distribution
    const roleDistribution = data.reduce((acc: Record<string, number>, user) => {
        const role = user.user_role || "Unknown"
        acc[role] = (acc[role] || 0) + 1
        return acc
    }, {})

    // Calculate new users by time period
    const getNewUsersByPeriod = () => {
        const now = new Date()
        let startDate: Date

        switch (timeRange) {
            case "7d":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                break
            case "30d":
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                break
            case "90d":
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                break
            case "1y":
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                break
            default:
                startDate = new Date(0) // All time
        }

        return data.filter((user) => {
            if (!user.user_registered) return false
            const registeredDate = new Date(user.user_registered)
            return registeredDate >= startDate
        }).length
    }

    const newUsersCount = getNewUsersByPeriod()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">User Analytics</h2>
                <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
                    <TabsList>
                        <TabsTrigger value="7d">7 days</TabsTrigger>
                        <TabsTrigger value="30d">30 days</TabsTrigger>
                        <TabsTrigger value="90d">90 days</TabsTrigger>
                        <TabsTrigger value="1y">1 year</TabsTrigger>
                        <TabsTrigger value="all">All time</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Users</CardDescription>
                        <CardTitle className="text-3xl">{totalUsers}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            <span className="font-medium text-primary">+{newUsersCount}</span> new in selected period
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Active Users</CardDescription>
                        <CardTitle className="text-3xl">{activeUsers}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            {totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}% of total users
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Inactive Users</CardDescription>
                        <CardTitle className="text-3xl">{inactiveUsers}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            {totalUsers > 0 ? ((inactiveUsers / totalUsers) * 100).toFixed(1) : 0}% of total users
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Credits</CardDescription>
                        <CardTitle className="text-3xl">{formatNumber(totalCredits)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Avg. {totalUsers > 0 ? formatNumber(totalCredits / totalUsers) : "0.00"} per user
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>User Distribution by Package</CardTitle>
                            <PieChart className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center">
                            <div className="space-y-4 w-full max-w-md">
                                {Object.entries(roleDistribution).map(([role, count]) => (
                                    <div key={role} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-normal">
                                                    {role.replace(/_/g, " ")}
                                                </Badge>
                                                <span className="text-sm font-medium">{count} users</span>
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {totalUsers > 0 ? (((count as number) / totalUsers) * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${totalUsers > 0 ? ((count as number) / totalUsers) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent User Activity</CardTitle>
                            <LineChart className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex flex-col items-center justify-center text-center p-6">
                            <BarChart className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Activity data visualization</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                This is a placeholder for a chart showing user activity over time. In a real implementation, this would
                                display user registrations, logins, or other activity metrics over the selected time period.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Growth Trends</CardTitle>
                    <CardDescription>New user registrations over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex flex-col items-center justify-center text-center p-6">
                        <LineChart className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Growth trend visualization</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            This is a placeholder for a line chart showing user growth over time. In a real implementation, this would
                            display cumulative user registrations over the selected time period.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
