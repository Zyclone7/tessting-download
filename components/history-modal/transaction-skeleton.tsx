import { Skeleton } from "@/components/ui/skeleton"

export default function TransactionSkeleton() {
    return (
        <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-start">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-[150px]" />
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[120px]" />
                    </div>
                    <Skeleton className="h-6 w-[100px]" />
                </div>
            ))}
        </div>
    )
}
