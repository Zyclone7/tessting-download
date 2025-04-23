import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <Skeleton className="h-4 w-[150px]" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[100px]" />
        <Skeleton className="mt-4 h-4 w-[200px]" />
      </CardContent>
    </Card>
  )
}
