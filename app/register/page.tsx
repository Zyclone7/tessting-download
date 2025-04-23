import { Suspense } from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import SignUp from './sign-up'

export default function RegisterPage() {
  return (
    <Suspense fallback={<SignUpFormSkeleton />}>
      <SignUp />
    </Suspense>
  )
}

function SignUpFormSkeleton() {
  return (
    <div className="w-full bg-background flex flex-col items-center justify-center px-4 sm:px-8 lg:px-16">
      <div className="w-full py-4">
        <Skeleton className="h-28 w-48 mb-4" /> {/* Logo skeleton */}
      </div>
      <div className="w-full mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

