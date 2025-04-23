import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonTopMerchants() {
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
            {[...Array(5)].map((_, index) => (
              <div key={index} className="mb-4 flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

