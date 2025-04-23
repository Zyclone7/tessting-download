"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import { TransactionData } from "@/types/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp } from 'lucide-react'

interface TransactionOverviewProps {
  data: TransactionData[]
}

interface DailyStats {
  date: string
  totalAmount: number
  totalCount: number
  withdrawAmount: number
  withdrawCount: number
  cashInAmount: number
  cashInCount: number
  balanceInquiryAmount: number
  balanceInquiryCount: number
  billPaymentAmount: number
  billPaymentCount: number
  fundTransferAmount: number
  fundTransferCount: number
  rcbcFees: number
  merchantFees: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(value)
}

export function TransactionOverview({ data }: TransactionOverviewProps) {
  const [viewMode, setViewMode] = useState<'amount' | 'count'>('amount')
  
  // Process and group data by date
  const dailyStats = data.reduce((acc: { [key: string]: DailyStats }, curr) => {
    const date = new Date(curr.transaction_date).toISOString().split('T')[0] // Extract just the date part
    
    if (!acc[date]) {
      acc[date] = {
        date,
        totalAmount: 0,
        totalCount: 0,
        withdrawAmount: 0,
        withdrawCount: 0,
        cashInAmount: 0,
        cashInCount: 0,
        balanceInquiryAmount: 0,
        balanceInquiryCount: 0,
        billPaymentAmount: 0,
        billPaymentCount: 0,
        fundTransferAmount: 0,
        fundTransferCount: 0,
        rcbcFees: 0,
        merchantFees: 0
      }
    }
    
    acc[date].totalAmount += Number(curr.total_amount) || 0
    acc[date].totalCount += Number(curr.total_transaction_count) || 0
    acc[date].withdrawAmount += Number(curr.withdraw_amount) || 0
    acc[date].withdrawCount += Number(curr.withdraw_count) || 0
    acc[date].cashInAmount += Number(curr.cash_in_amount) || 0
    acc[date].cashInCount += Number(curr.cash_in_count) || 0
    acc[date].balanceInquiryAmount += Number(curr.balance_inquiry_amount) || 0
    acc[date].balanceInquiryCount += Number(curr.balance_inquiry_count) || 0
    acc[date].billPaymentAmount += Number(curr.bill_payment_amount) || 0
    acc[date].billPaymentCount += Number(curr.bill_payment_count) || 0
    acc[date].fundTransferAmount += Number(curr.fund_transfer_amount) || 0
    acc[date].fundTransferCount += Number(curr.fund_transfer_count) || 0
    acc[date].rcbcFees += Number(curr.transaction_fee_rcbc) || 0
    acc[date].merchantFees += Number(curr.transaction_fee_merchant) || 0
    
    return acc
  }, {})

  // Convert to array and sort by date
  const chartData = Object.values(dailyStats).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate total stats for the summary cards
  const totalStats = chartData.reduce((acc, curr) => ({
    totalAmount: acc.totalAmount + curr.totalAmount,
    totalCount: acc.totalCount + curr.totalCount,
    rcbcFees: acc.rcbcFees + curr.rcbcFees,
    merchantFees: acc.merchantFees + curr.merchantFees
  }), {
    totalAmount: 0,
    totalCount: 0,
    rcbcFees: 0,
    merchantFees: 0
  })

  // Calculate percentage change
  const getPercentageChange = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return 100
    return ((currentValue - previousValue) / previousValue) * 100
  }

  // Get latest day's stats vs previous day
  const latestDay = chartData[chartData.length - 1]
  const previousDay = chartData[chartData.length - 2]
  const amountChange = previousDay 
    ? getPercentageChange(latestDay?.totalAmount || 0, previousDay?.totalAmount || 0)
    : 0
  const countChange = previousDay
    ? getPercentageChange(latestDay?.totalCount || 0, previousDay?.totalCount || 0)
    : 0

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-sm">
          <div className="font-medium mb-2">
            {new Date(label).toLocaleDateString('en-PH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.name}: {
                    viewMode === 'amount' 
                      ? formatCurrency(entry.value)
                      : entry.value.toLocaleString()
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Total Volume</p>
              {amountChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="mt-1">
              <p className="text-2xl font-bold">{formatCurrency(totalStats.totalAmount)}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {Math.abs(amountChange).toFixed(1)}%
                {amountChange >= 0 ? (
                  <ArrowUp className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-500" />
                )}
                vs previous day
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Total Transactions</p>
              {countChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="mt-1">
              <p className="text-2xl font-bold">{totalStats.totalCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {Math.abs(countChange).toFixed(1)}%
                {countChange >= 0 ? (
                  <ArrowUp className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-500" />
                )}
                vs previous day
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">RCBC Fees</p>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-1">
              <p className="text-2xl font-bold">{formatCurrency(totalStats.rcbcFees)}</p>
              <p className="text-xs text-muted-foreground">
                Total fees collected
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Merchant Fees</p>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
            <div className="mt-1">
              <p className="text-2xl font-bold">{formatCurrency(totalStats.merchantFees)}</p>
              <p className="text-xs text-muted-foreground">
                Total merchant earnings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Select
          value={viewMode}
          onValueChange={(value: 'amount' | 'count') => setViewMode(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="amount">Transaction Amount</SelectItem>
            <SelectItem value="count">Transaction Count</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-background pt-4">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={(value) => viewMode === 'amount' ? formatCurrency(value) : value.toLocaleString()}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={viewMode === 'amount' ? 'totalAmount' : 'totalCount'}
              name={viewMode === 'amount' ? 'Total Amount' : 'Total Transactions'}
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={viewMode === 'amount' ? 'withdrawAmount' : 'withdrawCount'}
              name={viewMode === 'amount' ? 'Withdraw Amount' : 'Withdraw Count'}
              stroke="#82ca9d"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={viewMode === 'amount' ? 'cashInAmount' : 'cashInCount'}
              name={viewMode === 'amount' ? 'Cash In Amount' : 'Cash In Count'}
              stroke="#ffc658"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={viewMode === 'amount' ? 'balanceInquiryAmount' : 'balanceInquiryCount'}
              name={viewMode === 'amount' ? 'Balance Inquiry Amount' : 'Balance Inquiry Count'}
              stroke="#ff7300"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={viewMode === 'amount' ? 'billPaymentAmount' : 'billPaymentCount'}
              name={viewMode === 'amount' ? 'Bill Payment Amount' : 'Bill Payment Count'}
              stroke="#0088FE"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={viewMode === 'amount' ? 'fundTransferAmount' : 'fundTransferCount'}
              name={viewMode === 'amount' ? 'Fund Transfer Amount' : 'Fund Transfer Count'}
              stroke="#00C49F"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

