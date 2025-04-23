import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from './date-range-picker'
import { DateRange } from "react-day-picker"

interface AdvancedFiltersProps {
  filters: {
    package: string
    status: string
    dateRange: DateRange | undefined
    minAmount: string
    maxAmount: string
  }
  setFilters: React.Dispatch<React.SetStateAction<any>>
  applyFilters: () => void
  resetFilters: () => void
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  setFilters,
  applyFilters,
  resetFilters,
}) => {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="package" className="text-right">
          Package
        </Label>
        <Input
          id="package"
          value={filters.package}
          onChange={(e) => setFilters({ ...filters, package: e.target.value })}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">
          Status
        </Label>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activated">Activated</SelectItem>
            <SelectItem value="not_activated">Not Activated</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="dateRange" className="text-right">
          Date Range
        </Label>
        <div className="col-span-3">
          <DateRangePicker
            value={filters.dateRange}
            onChange={(range) => setFilters({ ...filters, dateRange: range })}
          />
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="amountRange" className="text-right">
          Amount Range
        </Label>
        <div className="col-span-3 flex items-center space-x-2">
          <Input
            id="minAmount"
            type="number"
            placeholder="Min"
            value={filters.minAmount}
            onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
            className="w-1/2"
          />
          <Input
            id="maxAmount"
            type="number"
            placeholder="Max"
            value={filters.maxAmount}
            onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
            className="w-1/2"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={resetFilters}>
          Reset
        </Button>
        <Button onClick={applyFilters}>Apply Filters</Button>
      </div>
    </div>
  )
}

