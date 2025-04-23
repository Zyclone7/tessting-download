"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownToLine, Wallet, CreditCard, BarChart3 } from 'lucide-react'
import { TransactionData } from "@/types/types"

interface TransactionCardProps {
  data: TransactionData[]
  isLoading?: boolean
}

// Helper function to format currency - with safety checks
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₱0.00'
  }
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2
  }).format(amount)
}

// Helper function to calculate totals with safety checks
const calculateTotals = (data: TransactionData[]) => {
  return data.reduce((acc, curr) => ({
    withdraw_count: acc.withdraw_count + (Number(curr.withdraw_count) || 0),
    withdraw_amount: acc.withdraw_amount + (Number(curr.withdraw_amount) || 0),
    balance_inquiry_count: acc.balance_inquiry_count + (Number(curr.balance_inquiry_count) || 0),
    cash_in_count: acc.cash_in_count + (Number(curr.cash_in_count) || 0),
    cash_in_amount: acc.cash_in_amount + (Number(curr.cash_in_amount) || 0),
    total_transaction_count: acc.total_transaction_count + (Number(curr.total_transaction_count) || 0),
    total_amount: acc.total_amount + (Number(curr.total_amount) || 0),
  }), {
    withdraw_count: 0,
    withdraw_amount: 0,
    balance_inquiry_count: 0,
    cash_in_count: 0,
    cash_in_amount: 0,
    total_transaction_count: 0,
    total_amount: 0,
  })
}

export function TransactionCards({ data, isLoading }: TransactionCardProps) {
  const totals = calculateTotals(data)
  
  const cards = [
    {
      title: "Total Withdrawals",
      value: formatCurrency(totals.withdraw_amount),
      description: `${totals.withdraw_count.toLocaleString()} transactions today`,
      icon: ArrowDownToLine,
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-950"
    },
    {
      title: "Cash In",
      value: formatCurrency(totals.cash_in_amount),
      description: `${totals.cash_in_count.toLocaleString()} transactions today`,
      icon: Wallet,
      color: "text-green-500",
      bgColor: "bg-green-100 dark:bg-green-950"
    },
    {
      title: "Balance Inquiries",
      value: totals.balance_inquiry_count.toLocaleString(),
      description: "Total inquiries today",
      icon: CreditCard,
      color: "text-purple-500",
      bgColor: "bg-purple-100 dark:bg-purple-950"
    },
    {
      title: "Total Transactions",
      value: formatCurrency(totals.total_amount),
      description: `${totals.total_transaction_count.toLocaleString()} total transactions`,
      icon: BarChart3,
      color: "text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-950"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <div className={`${card.bgColor} ${card.color} rounded-full p-2`}>
              <card.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

