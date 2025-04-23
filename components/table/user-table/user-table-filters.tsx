import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePickerWithRange } from '@/components/date-picker-with-range'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserRole } from '@/actions/user'
import { Filter } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'

import { DateRange } from 'react-day-picker';

export function UserTableFilters({ onFilterChange }: { onFilterChange: (filters: any) => void }) {
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [role, setRole] = useState<UserRole | undefined>()
  const [creditRange, setCreditRange] = useState<[number, number]>([0, 10000])

  const handleFilterChange = () => {
    onFilterChange({
      search,
      dateRange: dateRange ? {
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString()
      } : undefined,
      role,
      creditRange,
    })
  }

  const handleResetFilters = () => {
    setSearch('')
    setDateRange(undefined)
    setRole(undefined)
    setCreditRange([0, 10000])
    onFilterChange({})
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        <div className="flex flex-col">
          <label htmlFor="search" className="text-sm font-medium">Search</label>
          <Input
            id="search"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="mt-5">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Role</h4>
                <Select onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic_Merchant_Package">Basic Merchant</SelectItem>
                    <SelectItem value="Premium_Merchant_Package">Premium Merchant</SelectItem>
                    <SelectItem value="Elite_Distributor_Package">Elite Distributor</SelectItem>
                    <SelectItem value="Elite_Plus_Distributor_Package">Elite Plus Distributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Registration Date Range</h4>
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Credit Range</h4>
                <Slider
                  min={0}
                  max={10000}
                  step={100}
                  value={creditRange}
                  onValueChange={(value: [number, number]) => setCreditRange(value)}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{creditRange[0]} credits</span>
                  <span>{creditRange[1]} credits</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button className="w-full" onClick={handleFilterChange}>
                Apply Filters
              </Button>
              <Button variant="outline" className="w-full" onClick={handleResetFilters}>
                Reset
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}