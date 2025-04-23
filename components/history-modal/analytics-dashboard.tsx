"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import {
    ArrowDownIcon,
    ArrowUpIcon,
    BarChart3Icon,
    PieChartIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Transaction {
    type?: string
    date?: string
    created_at?: string
    amount?: number
    isIncoming?: boolean
    transaction_type?: string
}

export default function AnalyticsDashboard({
    combinedTransactions = [] as Transaction[],
    referralTransactions = [] as Transaction[],
    passiveIncomeTransactions = [] as Transaction[],
    productPurchases = [] as Transaction[],
    xpressloadPurchases = [] as Transaction[],
    bookingTransactions = [] as Transaction[],
    hotelBookings = [] as Transaction[],
    creditTransactions = [] as Transaction[],
    transferTransactions = [] as Transaction[],
}) {
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')

    // Transaction type distribution
    const getTransactionTypeData = () => {
        const typeCount: Record<string, number> = {}
        combinedTransactions.forEach((tx) => {
            const type = tx.type || 'unknown'
            typeCount[type] = (typeCount[type] || 0) + 1
        })
        return Object.entries(typeCount).map(([name, value]) => ({
            name: formatTransactionType(name),
            value,
        }))
    }

    // Monthly income vs expense
    const getMonthlyData = () => {
        const monthly: Record<string, { month: string; income: number; expense: number }> = {}
        combinedTransactions.forEach((tx) => {
            const date = new Date(tx.date || tx.created_at || Date.now())
            const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`
            if (!monthly[monthKey]) monthly[monthKey] = { month: monthKey, income: 0, expense: 0 }
            const amt = Number(tx.amount || 0)
            if (amt > 0) monthly[monthKey].income += amt
            else monthly[monthKey].expense += Math.abs(amt)
        })
        return Object.values(monthly)
            .sort((a, b) => {
                const [am, ay] = a.month.split('/')
                const [bm, by] = b.month.split('/')
                return new Date(+ay, +am - 1).getTime() - new Date(+by, +bm - 1).getTime()
            })
            .slice(-6)
    }

    // Category counts
    const getCategoryData = () => [
        { name: 'Referrals', value: referralTransactions.length },
        { name: 'Passive Income', value: passiveIncomeTransactions.length },
        { name: 'Products', value: productPurchases.length },
        { name: 'Xpressload', value: xpressloadPurchases.length },
        { name: 'Flights', value: bookingTransactions.length },
        { name: 'Hotels', value: hotelBookings.length },
        { name: 'Credits', value: creditTransactions.length },
        { name: 'Transfers', value: transferTransactions.length },
    ]

    const formatTransactionType = (t: string) => {
        switch (t) {
            case 'passive': return 'Passive Income'
            case 'referral': return 'Referral'
            case 'purchase': return 'Product'
            case 'booking': return 'Flight'
            case 'hotel': return 'Hotel'
            case 'wifi': return 'WiFi'
            case 'gsat': return 'GSAT'
            case 'tv': return 'TV'
            case 'credit': return 'Credit'
            case 'transfer': return 'Transfer'
            default: return t.charAt(0).toUpperCase() + t.slice(1)
        }
    }

    const getTotals = () => combinedTransactions.reduce(
        (acc, tx) => {
            const amt = Number(tx.amount || 0)
            if (amt > 0) acc.income += amt
            else acc.expense += Math.abs(amt)
            return acc
        },
        { income: 0, expense: 0 }
    )

    const { income, expense } = getTotals()
    const transactionTypeData = getTransactionTypeData()
    const monthlyData = getMonthlyData()
    const categoryData = getCategoryData()

    const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"];

    return (
        <motion.div className="container mx-auto p-4 space-y-6" {...fade}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold">Transaction Analytics</h2>
                <div className="flex flex-wrap gap-2">
                    <Button variant={chartType === 'bar' ? 'default' : 'outline'} size="sm" onClick={() => setChartType('bar')}>
                        <BarChart3Icon className="h-4 w-4 mr-1" /> Bar
                    </Button>
                    <Button variant={chartType === 'pie' ? 'default' : 'outline'} size="sm" onClick={() => setChartType('pie')}>
                        <PieChartIcon className="h-4 w-4 mr-1" /> Pie
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Income vs Expenses</CardTitle>
                        <CardDescription>Summary of your financial activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Total Income</p>
                                <div className="flex items-center">
                                    <ArrowUpIcon className="h-4 w-4 mr-1 text-green-500" />
                                    <p className="text-2xl font-bold text-green-600">₱{income.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Total Expenses</p>
                                <div className="flex items-center">
                                    <ArrowDownIcon className="h-4 w-4 mr-1 text-red-500" />
                                    <p className="text-2xl font-bold text-red-600">₱{expense.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[300px] w-full h-64 md:h-80 lg:h-96">
                                <ChartContainer config={{ income: { label: 'Income', color: 'hsl(var(--chart-1))' }, expense: { label: 'Expense', color: 'hsl(var(--chart-2))' } }}>
                                    {chartType === 'bar' ? (
                                        <BarChart data={monthlyData}>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                            <YAxis tickFormatter={val => `₱${val.toLocaleString()}`} tickLine={false} axisLine={false} tickMargin={8} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                                            <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
                                        </BarChart>
                                    ) : (
                                        <PieChart>
                                            <Pie
                                                data={[{ name: 'Income', value: income }, { name: 'Expense', value: expense }]}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                <Cell fill="var(--color-income)" />
                                                <Cell fill="var(--color-expense)" />
                                            </Pie>
                                            <Tooltip formatter={val => `₱${val.toLocaleString()}`} />
                                            <Legend />
                                        </PieChart>
                                    )}
                                </ChartContainer>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Transaction Categories</CardTitle>
                        <CardDescription>Breakdown by transaction type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[300px] w-full h-64 md:h-80 lg:h-96">
                                <ChartContainer config={{ income: { label: 'Income', color: 'hsl(var(--chart-1))' }, expense: { label: 'Expense', color: 'hsl(var(--chart-2))' } }}>
                                    {chartType === 'bar' ? (
                                        <BarChart data={categoryData} layout="vertical" margin={{ left: 80 }}>
                                            <CartesianGrid horizontal vertical={false} />
                                            <XAxis type="number" tickLine={false} axisLine={false} />
                                            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="value" radius={4}>
                                                {categoryData.map((_, idx) => (
                                                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    ) : (
                                        <PieChart>
                                            <Pie
                                                data={categoryData.filter(d => d.value > 0)}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {categoryData.map((_, idx) => (
                                                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    )}
                                </ChartContainer>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="referral">
                <TabsList className="flex gap-2 mb-4 overflow-x-auto whitespace-nowrap p-2 bg-muted rounded-lg">
                    <TabsTrigger value="referral" className="flex-1 min-w-[120px]">Referrals</TabsTrigger>
                    <TabsTrigger value="passive" className="flex-1 min-w-[120px]">Passive Income</TabsTrigger>
                    <TabsTrigger value="product" className="flex-1 min-w-[120px]">Products</TabsTrigger>
                    <TabsTrigger value="xpressload" className="flex-1 min-w-[120px]">Xpressload</TabsTrigger>
                    <TabsTrigger value="flight" className="flex-1 min-w-[120px]">Flights</TabsTrigger>
                    <TabsTrigger value="hotel" className="flex-1 min-w-[120px]">Hotels</TabsTrigger>
                    <TabsTrigger value="credit" className="flex-1 min-w-[120px]">Credits</TabsTrigger>
                    <TabsTrigger value="transfer" className="flex-1 min-w-[120px]">Transfers</TabsTrigger>
                </TabsList>

                <TabsContent value="referral">
                    <CategoryAnalytics
                        title="Referral History"
                        transactions={referralTransactions}
                        chartType={chartType}
                        valueKey="income_amount"
                        dateKey="created_at"
                        nameKey="sender.user_nicename"
                        defaultName="Unknown"
                    />
                </TabsContent>
                {/* Repeat for other categories... */}

                <TabsContent value="passive">
                    <CategoryAnalytics
                        title="Passive Income"
                        transactions={passiveIncomeTransactions}
                        chartType={chartType}
                        valueKey="income_amount"
                        dateKey="created_at"
                        nameKey="sender.user_nicename"
                        defaultName="Unknown"
                    />
                </TabsContent>

                <TabsContent value="product">
                    <CategoryAnalytics
                        title="Product Purchases"
                        transactions={productPurchases}
                        chartType={chartType}
                        valueKey="amount"
                        dateKey="date_purchased"
                        nameKey="package"
                        defaultName="Product"
                        isExpense={true}
                    />
                </TabsContent>

                <TabsContent value="xpressload">
                    <CategoryAnalytics
                        title="Xpressload Purchases"
                        transactions={xpressloadPurchases}
                        chartType={chartType}
                        valueKey="amount"
                        dateKey="created_at"
                        nameKey="type"
                        defaultName="Xpressload"
                        isExpense={true}
                        groupByKey="type"
                    />
                </TabsContent>

                <TabsContent value="flight">
                    <CategoryAnalytics
                        title="Airline Bookings"
                        transactions={bookingTransactions}
                        chartType={chartType}
                        valueKey="amount_paid"
                        dateKey="date_booked_request"
                        nameKey="airline"
                        defaultName="Airline"
                        isExpense={true}
                    />
                </TabsContent>

                <TabsContent value="hotel">
                    <CategoryAnalytics
                        title="Hotel Bookings"
                        transactions={hotelBookings}
                        chartType={chartType}
                        valueKey="amount_paid"
                        dateKey="check_in_date"
                        nameKey="hotel_name"
                        defaultName="Hotel"
                        isExpense={true}
                    />
                </TabsContent>

                <TabsContent value="credit">
                    <CategoryAnalytics
                        title="Credit TOP-UP"
                        transactions={creditTransactions.filter((tx) => tx.transaction_type === "TOP_UP")}
                        chartType={chartType}
                        valueKey="amount"
                        dateKey="created_at"
                        nameKey="payment_method"
                        defaultName="Payment"
                    />
                </TabsContent>

                <TabsContent value="transfer">
                    <CategoryAnalytics
                        title="Credit Transfers"
                        transactions={transferTransactions}
                        chartType={chartType}
                        valueKey="amount"
                        dateKey="transaction_date"
                        nameKey={(tx) => (tx.isIncoming ? "sender.name" : "recipient.name")}
                        defaultName="User"
                        groupByKey="isIncoming"
                        groupLabels={{ true: "Received", false: "Sent" }}
                    />
                </TabsContent>
            </Tabs>
        </motion.div>
    )
}

function CategoryAnalytics({
    title,
    transactions = [] as Transaction[],
    chartType = 'bar',
    valueKey = 'amount',
    dateKey = 'created_at',
    nameKey,
    defaultName = 'Item',
    isExpense = false,
    groupByKey,
    groupLabels = {},
}: {
    title: string
    transactions: Transaction[]
    chartType?: string
    valueKey?: string
    dateKey?: string
    nameKey: string | ((tx: Transaction) => string)
    defaultName?: string
    isExpense?: boolean
    groupByKey?: string
    groupLabels?: Record<string, string>
}) {
    const getValue = (obj: Record<string, any>, key: string | ((obj: Record<string, any>) => any)): any =>
        typeof key === 'function'
            ? key(obj)
            : key.split('.').reduce((o: any, k: string) => (o || {})[k], obj) || 0
    const getName = (obj: any) => getValue(obj, nameKey) || defaultName

    const getMonthlyData = () => {
        const monthly: any = {}
        transactions.forEach(tx => {
            const date = new Date(getValue(tx, dateKey) || Date.now())
            const mKey = `${date.getMonth() + 1}/${date.getFullYear()}`
            if (!monthly[mKey]) {
                monthly[mKey] = { month: mKey, value: 0 }
                if (groupByKey) Object.keys(groupLabels).forEach(g => (monthly[mKey][groupLabels[g]] = 0))
            }
            const amt = Number(getValue(tx, valueKey) || 0)
            const val = isExpense ? -Math.abs(amt) : Math.abs(amt)
            monthly[mKey].value += val
            if (groupByKey) {
                const g = getValue(tx, groupByKey)
                const label = groupLabels[g] || g
                monthly[mKey][label] = (monthly[mKey][label] || 0) + val
            }
        })
        return Object.values(monthly as Record<string, { month: string; value: number }>[])
            .sort((a, b) => {
                const parseDate = (month: string) => {
                    const [m, y] = month.split('/').map(Number);
                    return new Date(y, m - 1).getTime();
                };
                return parseDate(b.month.month) - parseDate(a.month.month);
            })
            .reverse().slice(-6)
    }

    const categoryData = () => {
        const data: Record<string, { name: string; value: number }> = {}
        transactions.forEach(tx => {
            const nm = getName(tx)
            if (!data[nm]) data[nm] = { name: nm, value: 0 }
            const amt = Number(getValue(tx, valueKey) || 0)
            data[nm].value += isExpense ? -Math.abs(amt) : Math.abs(amt)
        })
        return Object.values(data).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 8)
    }

    const monthlyData = getMonthlyData()
    const catData = categoryData()
    const total = transactions.reduce((s, tx) => s + (isExpense ? -Math.abs(Number(getValue(tx, valueKey))) : Math.abs(Number(getValue(tx, valueKey)))), 0)
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

    const groups = groupByKey ? Object.keys(groupLabels).map(g => groupLabels[g]) : ["value"]

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>{title} by Month</CardTitle>
                        <CardDescription>Monthly transaction summary</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <p className="text-sm text-muted-foreground">Total {isExpense ? 'Spent' : 'Earned'}</p>
                            <p className={`text-2xl font-bold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>₱{Math.abs(total).toLocaleString()}</p>
                        </div>
                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[300px] w-full h-64 md:h-80 lg:h-96">
                                <ChartContainer config={{ income: { label: 'Income', color: 'hsl(var(--chart-1))' }, expense: { label: 'Expense', color: 'hsl(var(--chart-2))' } }}>
                                    {chartType === 'bar' ? (
                                        <BarChart data={monthlyData}>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                            <YAxis tickFormatter={v => `₱${Math.abs(v).toLocaleString()}`} tickLine={false} axisLine={false} tickMargin={8} />
                                            <ChartTooltip content={<ChartTooltipContent />} formatter={v => `₱${Math.abs(Number(v)).toLocaleString()}`} />
                                            {groups.map((key, idx) => (
                                                <Bar key={key} dataKey={key} radius={4}>
                                                    {monthlyData.map((_, barIdx) => (
                                                        <Cell key={barIdx} fill={COLORS[barIdx % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            ))}
                                        </BarChart>
                                    ) : (
                                        <PieChart>
                                            <Pie
                                                data={monthlyData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {monthlyData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={v => `₱${Math.abs(Number(v)).toLocaleString()}`} />
                                            <Legend />
                                        </PieChart>
                                    )}
                                </ChartContainer>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>{title} by Category</CardTitle>
                        <CardDescription>Breakdown by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[300px] w-full h-64 md:h-80 lg:h-96">
                                <ChartContainer config={{ income: { label: 'Income', color: 'hsl(var(--chart-1))' }, expense: { label: 'Expense', color: 'hsl(var(--chart-2))' } }}>
                                    {chartType === 'bar' ? (
                                        <BarChart data={catData} layout="vertical" margin={{ left: 80 }}>
                                            <CartesianGrid horizontal vertical={false} />
                                            <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={v => `₱${Math.abs(v).toLocaleString()}`} />
                                            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100} />
                                            <ChartTooltip content={<ChartTooltipContent />} formatter={v => `₱${Math.abs(Number(v)).toLocaleString()}`} />
                                            <Bar dataKey="value" radius={4}>
                                                {catData.map((_, idx) => (
                                                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    ) : (
                                        <PieChart>
                                            <Pie
                                                data={catData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {catData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={v => `₱${Math.abs(Number(v)).toLocaleString()}`} />
                                            <Legend />
                                        </PieChart>
                                    )}
                                </ChartContainer>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
