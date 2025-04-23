"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Search, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface KYCTableFiltersProps {
  onFilterChange: (filters: any) => void
}

export function KYCTableFilters({ onFilterChange }: KYCTableFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [status, setStatus] = useState("all")
  const [dateRange, setDateRange] = useState<{
    from?: Date
    to?: Date
  }>({})
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  const handleReset = () => {
    setSearchTerm("")
    setStatus("all")
    setDateRange({})
    onFilterChange({})
  }

  const applyFilters = () => {
    onFilterChange({
      searchTerm,
      status,
      dateRange,
    })
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, email, or ID..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => {
                setSearchTerm("")
                applyFilters()
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear</span>
            </Button>
          )}
        </form>

        <div className="flex flex-row gap-2">
          <div className="w-[180px]">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value)
                onFilterChange({
                  searchTerm,
                  status: value,
                  dateRange,
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal w-[240px]",
                  !dateRange.from && !dateRange.to && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange.from ? (dateRange as { from: Date; to?: Date }) : undefined}
                onSelect={(range) => {
                  setDateRange(range || {})
                  if (range?.to) {
                    setIsCalendarOpen(false)
                    onFilterChange({
                      searchTerm,
                      status,
                      dateRange: range,
                    })
                  }
                }}
                numberOfMonths={2}
              />
              <div className="flex items-center justify-between p-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateRange({})
                    onFilterChange({
                      searchTerm,
                      status,
                      dateRange: {},
                    })
                    setIsCalendarOpen(false)
                  }}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onFilterChange({
                      searchTerm,
                      status,
                      dateRange,
                    })
                    setIsCalendarOpen(false)
                  }}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {dateRange.from && (
            <span className="mr-2">
              Date: {format(dateRange.from, "MMM d, yyyy")}
              {dateRange.to && ` - ${format(dateRange.to, "MMM d, yyyy")}`}
            </span>
          )}
          {status !== "all" && <span className="mr-2">Status: {status}</span>}
          {searchTerm && <span>Search: "{searchTerm}"</span>}
        </div>

        {(searchTerm || status !== "all" || dateRange.from) && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
        )}
      </div>
    </div>
  )
}
