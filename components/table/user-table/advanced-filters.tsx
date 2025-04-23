"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { X, CalendarIcon, User, Mail, Building, CreditCard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

interface AdvancedFiltersProps {
  onFilterChange: (filters: any) => void
  initialFilters?: any
}

export function AdvancedFilters({ onFilterChange, initialFilters = {} }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState({
    name: initialFilters.name || "",
    email: initialFilters.email || "",
    role: initialFilters.role || "all",
    status: initialFilters.status === 0 ? 0 : initialFilters.status === 1 ? 1 : "all",
    merchantId: initialFilters.merchantId || "",
    businessName: initialFilters.businessName || "",
    dateRange: initialFilters.dateRange || { from: null, to: null },
    hasCredits: initialFilters.hasCredits || false,
  })

  useEffect(() => {
    // Initialize filters from props
    setFilters({
      name: initialFilters.name || "",
      email: initialFilters.email || "",
      role: initialFilters.role || "all",
      status: initialFilters.status === 0 ? 0 : initialFilters.status === 1 ? 1 : "all",
      merchantId: initialFilters.merchantId || "",
      businessName: initialFilters.businessName || "",
      dateRange: initialFilters.dateRange || { from: null, to: null },
      hasCredits: initialFilters.hasCredits || false,
    })
  }, [initialFilters])

  const handleFilterChange = (name: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleApplyFilters = () => {
    onFilterChange(filters)
  }

  const handleResetFilters = () => {
    const resetFilters = {
      name: "",
      email: "",
      role: "all",
      status: "all",
      merchantId: "",
      businessName: "",
      dateRange: { from: null, to: null },
      hasCredits: false,
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  return (
    <div className="space-y-6 py-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Filters</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Filters</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Search by name"
                value={filters.name}
                onChange={(e) => handleFilterChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="Search by email"
                value={filters.email}
                onChange={(e) => handleFilterChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={filters.role} onValueChange={(value) => handleFilterChange("role", value)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="Basic_Merchant_Package">Basic Merchant</SelectItem>
                  <SelectItem value="Premium_Merchant_Package">Premium Merchant</SelectItem>
                  <SelectItem value="Elite_Distributor_Package">Elite Distributor</SelectItem>
                  <SelectItem value="Elite_Plus_Distributor_Package">Elite Plus Distributor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status.toString()}
                onValueChange={(value) => handleFilterChange("status", value === "all" ? "all" : Number(value))}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merchantId">Merchant ID</Label>
              <Input
                id="merchantId"
                placeholder="Search by merchant ID"
                value={filters.merchantId}
                onChange={(e) => handleFilterChange("merchantId", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="Search by business name"
                value={filters.businessName}
                onChange={(e) => handleFilterChange("businessName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Registration Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dateFrom" className="text-xs">
                    From
                  </Label>
                  <DatePicker
                    {...{ id: "dateFrom" }}
                    date={filters.dateRange.from}
                    setDate={(date:any) =>
                      handleFilterChange("dateRange", {
                        ...filters.dateRange,
                        from: date,
                      })
                    }
                    placeholder="From date"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-xs">
                    To
                  </Label>
                  <DatePicker
                    {...{ id: "dateTo" }}
                    date={filters.dateRange.to}
                    setDate={(date:any) =>
                      handleFilterChange("dateRange", {
                        ...filters.dateRange,
                        to: date,
                      })
                    }
                    placeholder="To date"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasCredits"
                  checked={filters.hasCredits}
                  onCheckedChange={(checked) => handleFilterChange("hasCredits", checked)}
                />
                <Label htmlFor="hasCredits">Has Credits</Label>
              </div>
              <p className="text-xs text-muted-foreground">Only show users with credits greater than zero</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2">
              {filters.name && (
                <div className="flex items-center gap-1 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Name: {filters.name}</span>
                </div>
              )}
              {filters.email && (
                <div className="flex items-center gap-1 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Email: {filters.email}</span>
                </div>
              )}
              {filters.role !== "all" && (
                <div className="flex items-center gap-1 text-sm">
                  <span>Role: {filters.role}</span>
                </div>
              )}
              {filters.status !== "all" && (
                <div className="flex items-center gap-1 text-sm">
                  <span>Status: {filters.status === 1 ? "Active" : "Inactive"}</span>
                </div>
              )}
              {filters.merchantId && (
                <div className="flex items-center gap-1 text-sm">
                  <Building className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Merchant ID: {filters.merchantId}</span>
                </div>
              )}
              {(filters.dateRange.from || filters.dateRange.to) && (
                <div className="flex items-center gap-1 text-sm">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    Date: {filters.dateRange.from ? new Date(filters.dateRange.from).toLocaleDateString() : "Any"}
                    {" - "}
                    {filters.dateRange.to ? new Date(filters.dateRange.to).toLocaleDateString() : "Any"}
                  </span>
                </div>
              )}
              {filters.hasCredits && (
                <div className="flex items-center gap-1 text-sm">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Has Credits</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" size="sm" onClick={handleResetFilters}>
          <X className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button size="sm" onClick={handleApplyFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  )
}

