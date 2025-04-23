import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from 'lucide-react'

interface PackageInfo {
  name: string;
  available: number;
}

interface PackageAvailabilityProps {
  packages: PackageInfo[];
}

export function PackageAvailability({ packages }: PackageAvailabilityProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">Package Availability</CardTitle>
        <Package className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {packages.map((pkg) => (
            <li key={pkg.name} className="flex justify-between items-center">
              <span className="text-sm">{pkg.name}</span>
              <span className="font-semibold">{pkg.available}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

