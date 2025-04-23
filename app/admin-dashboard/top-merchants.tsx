"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { TransactionData } from "@/types/types"

interface TopMerchantsProps {
  data: TransactionData[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(value)
}

export function TopMerchants({ data }: TopMerchantsProps) {
  // Process data for different categories
  const processedData = data.map(item => ({
    merchant_name: item.merchant_name || 'Unknown Merchant',
    withdrawals: Number(item.withdraw_amount) || 0,
    withdrawCount: Number(item.withdraw_count) || 0,
    cashIn: Number(item.cash_in_amount) || 0,
    cashInCount: Number(item.cash_in_count) || 0,
    billPayment: Number(item.bill_payment_amount) || 0,
    billPaymentCount: Number(item.bill_payment_count) || 0,
    total: Number(item.total_amount) || 0,
    totalCount: Number(item.total_transaction_count) || 0,
    status: item.status
  }))

  // Sort data for different categories
  const topByWithdrawals = [...processedData].sort((a, b) => b.withdrawals - a.withdrawals).slice(0, 10)
  const topByCashIn = [...processedData].sort((a, b) => b.cashIn - a.cashIn).slice(0, 10)
  const topByBillPayment = [...processedData].sort((a, b) => b.billPayment - a.billPayment).slice(0, 10)
  const topByTotal = [...processedData].sort((a, b) => b.total - a.total).slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Merchants</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="total" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="total">Total Volume</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="cashIn">Cash In</TabsTrigger>
            <TabsTrigger value="billPayment">Bill Payment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="total" className="space-y-4">
            <ScrollArea className="h-[400px]">
              {topByTotal.map((merchant, index) => (
                <div key={index} className="mb-4 flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <p className="font-medium">{merchant.merchant_name}</p>
                      <Badge variant={merchant.status === 'Verified' ? 'default' : 'secondary'}>
                        {merchant.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {merchant.totalCount} total transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(merchant.total)}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            <ScrollArea className="h-[400px]">
              {topByWithdrawals.map((merchant, index) => (
                <div key={index} className="mb-4 flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <p className="font-medium">{merchant.merchant_name}</p>
                      <Badge variant={merchant.status === 'Verified' ? 'default' : 'secondary'}>
                        {merchant.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {merchant.withdrawCount} withdrawal transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(merchant.withdrawals)}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="cashIn" className="space-y-4">
            <ScrollArea className="h-[400px]">
              {topByCashIn.map((merchant, index) => (
                <div key={index} className="mb-4 flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <p className="font-medium">{merchant.merchant_name}</p>
                      <Badge variant={merchant.status === 'Verified' ? 'default' : 'secondary'}>
                        {merchant.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {merchant.cashInCount} cash in transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(merchant.cashIn)}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="billPayment" className="space-y-4">
            <ScrollArea className="h-[400px]">
              {topByBillPayment.map((merchant, index) => (
                <div key={index} className="mb-4 flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <p className="font-medium">{merchant.merchant_name}</p>
                      <Badge variant={merchant.status === 'Verified' ? 'default' : 'secondary'}>
                        {merchant.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {merchant.billPaymentCount} bill payment transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(merchant.billPayment)}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

