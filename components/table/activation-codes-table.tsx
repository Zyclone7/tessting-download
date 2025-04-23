"use client"

import type React from "react"

import { useEffect, useState, useMemo } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronDown,
  Eye,
  EyeOff,
  MoreHorizontal,
  Filter,
  Download,
  Copy,
  Search,
  RefreshCw,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { BarChart2 } from "lucide-react"
import { getInvitationCodesByUserId } from "@/actions/invitation-codes"
import { getUserInfoByIds } from "@/actions/user"

interface Subscription {
  id: number
  code: string | null
  package: string | null
  amount: number | null
  user_id: number | null
  redeemed_by: number | null
  redeemer_nicename?: string | null
  date_purchased: string | null
  created_at: string | null
  date_activated: string | null
  metadata?: string | null
}

interface UserInfo {
  id: number
  nicename: string
}

interface ActivationCodesTablesProps {
  userId: number
}

// Chart component for activation statistics
const ActivationChart = ({ data }: { data: Subscription[] }) => {
  const chartData = useMemo(() => {
    const activatedByMonth: Record<string, number> = {}
    const purchasedByMonth: Record<string, number> = {}

    data.forEach((item) => {
      if (item.date_purchased) {
        const purchaseDate = new Date(item.date_purchased)
        const purchaseKey = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, "0")}`
        purchasedByMonth[purchaseKey] = (purchasedByMonth[purchaseKey] || 0) + 1
      }

      if (item.date_activated) {
        const activationDate = new Date(item.date_activated)
        const activationKey = `${activationDate.getFullYear()}-${String(activationDate.getMonth() + 1).padStart(2, "0")}`
        activatedByMonth[activationKey] = (activatedByMonth[activationKey] || 0) + 1
      }
    })

    return { activatedByMonth, purchasedByMonth }
  }, [data])

  return (
    <div className="h-[300px] w-full flex items-end justify-between gap-2 pt-10 relative">
      <div className="absolute top-0 left-0 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span className="text-sm">Purchased</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm">Activated</span>
        </div>
      </div>

      {/* Y-axis labels */}
      <div className="absolute left-0 top-10 bottom-8 flex flex-col justify-between text-xs text-muted-foreground">
        <div>10</div>
        <div>8</div>
        <div>6</div>
        <div>4</div>
        <div>2</div>
        <div>0</div>
      </div>

      {/* Chart bars */}
      <div className="flex-1 flex items-end justify-around h-[250px] ml-6">
        {Object.keys(chartData.purchasedByMonth).map((month, index) => {
          const purchaseCount = chartData.purchasedByMonth[month] || 0
          const activationCount = chartData.activatedByMonth[month] || 0
          const purchaseHeight = Math.min((purchaseCount / 10) * 100, 100)
          const activationHeight = Math.min((activationCount / 10) * 100, 100)

          return (
            <div key={month} className="flex gap-1 items-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="w-5 bg-primary rounded-t-sm cursor-pointer transition-all hover:opacity-80"
                      style={{ height: `${purchaseHeight}%` }}
                    ></div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {purchaseCount} purchased in {month}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="w-5 bg-green-500 rounded-t-sm cursor-pointer transition-all hover:opacity-80"
                      style={{ height: `${activationHeight}%` }}
                    ></div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {activationCount} activated in {month}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-6 right-0 flex justify-around text-xs text-muted-foreground">
        {Object.keys(chartData.purchasedByMonth).map((month) => (
          <div key={month}>{month}</div>
        ))}
      </div>
    </div>
  )
}

// Status overview cards
const ActivationOverview = ({
  availableCount,
  redeemedCount,
  historicalData,
}: {
  availableCount: number
  redeemedCount: number
  historicalData: Subscription[]
}) => {
  const totalValue = historicalData.reduce((sum, item) => sum + (item.amount || 0), 0)
  const redeemedValue = historicalData
    .filter((item) => item.redeemed_by !== null)
    .reduce((sum, item) => sum + (item.amount || 0), 0)

  const packageDistribution = historicalData.reduce(
    (acc, item) => {
      const pkg = item.package || "Unknown"
      acc[pkg] = (acc[pkg] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Codes</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{availableCount}</div>
          <p className="text-xs text-muted-foreground">
            {((availableCount / (availableCount + redeemedCount)) * 100).toFixed(1)}% of total
          </p>
          <div className="mt-4 h-1 w-full bg-muted overflow-hidden rounded-full">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${(availableCount / (availableCount + redeemedCount)) * 100}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Redeemed Codes</CardTitle>
          <XCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{redeemedCount}</div>
          <p className="text-xs text-muted-foreground">
            {((redeemedCount / (availableCount + redeemedCount)) * 100).toFixed(1)}% of total
          </p>
          <div className="mt-4 h-1 w-full bg-muted overflow-hidden rounded-full">
            <div
              className="h-full bg-orange-500 rounded-full"
              style={{ width: `${(redeemedCount / (availableCount + redeemedCount)) * 100}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <FileText className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₱ {totalValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">{historicalData.length} total codes</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-medium">Available:</span>
            <span className="text-xs text-muted-foreground">₱ {(totalValue - redeemedValue).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Package Distribution</CardTitle>
          <BarChart2 className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(packageDistribution).map(([pkg, count]) => (
            <div key={pkg} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span className="text-xs font-medium truncate max-w-[120px]">
                  {pkg
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              </div>
              <span className="text-xs">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// Advanced filters component
const AdvancedFilters = ({
  filters,
  setFilters,
  applyFilters,
  resetFilters,
  packageOptions,
}: {
  filters: any
  setFilters: (filters: any) => void
  applyFilters: () => void
  resetFilters: () => void
  packageOptions: string[]
}) => {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="package">Package</Label>
        <Select value={filters.package} onValueChange={(value) => setFilters({ ...filters, package: value })}>
          <SelectTrigger id="package">
            <SelectValue placeholder="Select package" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Packages</SelectItem>
            {packageOptions.map((pkg) => (
              <SelectItem key={pkg} value={pkg}>
                {pkg
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="activated">Activated</SelectItem>
            <SelectItem value="not_activated">Not Activated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Date Range</Label>
        <div className="flex flex-col space-y-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal w-full">
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    <>
                      {filters.dateRange.from.toLocaleDateString()} - {filters.dateRange.to.toLocaleDateString()}
                    </>
                  ) : (
                    filters.dateRange.from.toLocaleDateString()
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange?.from}
                selected={filters.dateRange}
                onSelect={(range) => setFilters({ ...filters, dateRange: range })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {filters.dateRange?.from && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ ...filters, dateRange: undefined })}
              className="self-end"
            >
              Clear dates
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Amount Range</Label>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              className="w-[48%]"
            />
            <span>-</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              className="w-[48%]"
            />
          </div>

          {(filters.minAmount || filters.maxAmount) && (
            <div className="text-xs text-muted-foreground text-center">
              Filtering for amounts between ₱{filters.minAmount || "0"} and ₱{filters.maxAmount || "any"}
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button variant="outline" onClick={resetFilters}>
          Reset Filters
        </Button>
        <Button onClick={applyFilters}>Apply Filters</Button>
      </DialogFooter>
    </div>
  )
}

// Main component
const ActivationCodesTables: React.FC<ActivationCodesTablesProps> = ({ userId }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [originalData, setOriginalData] = useState<Subscription[]>([])
  const [userInfo, setUserInfo] = useState<Record<number, string>>({})
  const [sorting, setSorting] = useState<SortingState>([{ id: "date_purchased", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [userNotFound, setUserNotFound] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCode, setSelectedCode] = useState<Subscription | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    package: "",
    status: "",
    dateRange: undefined as { from: Date; to?: Date } | undefined,
    minAmount: "",
    maxAmount: "",
  })
  const { toast } = useToast()

  // Extract unique package options
  const packageOptions = useMemo(() => {
    const packages = new Set<string>()
    originalData.forEach((sub) => {
      if (sub.package) packages.add(sub.package)
    })
    return Array.from(packages)
  }, [originalData])

  // Function to fetch user information
  const fetchUserNicenames = async (userIds: number[]) => {
    // Filter out null values and duplicates
    const uniqueIds = [...new Set(userIds.filter(Boolean))]

    if (uniqueIds.length === 0) return

    try {
      // Implement or use an existing API endpoint to get user information
      const response = await getUserInfoByIds(uniqueIds)

      if (response.success && response.data) {
        const userMap: Record<number, string> = {}
        response.data.forEach((user: UserInfo) => {
          userMap[user.id] = user.nicename || `User #${user.id}`
        })
        setUserInfo(userMap)
      }
    } catch (error) {
      console.error("Error fetching user information:", error)
    }
  }

  // Mock function for getUserInfoByIds - replace with your actual implementation
  // const getUserInfoByIds = async (userIds: number[]) => {
  //   // This is a mock implementation - replace with your actual API call
  //   return {
  //     success: true,
  //     data: userIds.map((id) => ({ id, nicename: `User ${id}` })),
  //   }
  // }

  // Mock function for getInvitationCodesByUserId - replace with your actual implementation
  // const getInvitationCodesByUserId = async (userId: string) => {
  //   // This is a mock implementation - replace with your actual API call
  //   return {
  //     success: true,
  //     data: [], // Your actual data will come from the API
  //   }
  // }

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setIsLoading(true)
      setUserNotFound(false)

      try {
        const result = await getInvitationCodesByUserId(userId.toString())

        if (result.success && result.data) {
          const formattedData: Subscription[] = result.data.map((item: any) => ({
            ...item,
            created_at: item.created_at ? item.created_at.toISOString() : null,
          }))
          setSubscriptions(formattedData)
          setOriginalData(formattedData)

          // Extract user IDs to fetch their nicenames
          const userIds = formattedData.map((sub) => sub.redeemed_by).filter((id) => id !== null) as number[]

          if (userIds.length > 0) {
            fetchUserNicenames(userIds)
          }
        } else {
          console.warn("Response data is empty or invalid:", result)
          setSubscriptions([])
          setOriginalData([])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        // Check if error is about user not found
        if (error instanceof Error && error.message.includes("User not found")) {
          setUserNotFound(true)
        }
        setSubscriptions([])
        setOriginalData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptions()
  }, [userId])

  // Function to refresh data
  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      const result = await getInvitationCodesByUserId(userId.toString())

      if (result.success && result.data) {
        const formattedData: Subscription[] = result.data.map((item: any) => ({
          ...item,
          created_at: item.created_at ? item.created_at.toISOString() : null,
        }))
        setSubscriptions(formattedData)
        setOriginalData(formattedData)

        // Extract user IDs to fetch their nicenames
        const userIds = formattedData.map((sub) => sub.redeemed_by).filter((id) => id !== null) as number[]

        if (userIds.length > 0) {
          fetchUserNicenames(userIds)
        }

        toast({
          title: "Data refreshed",
          description: `${formattedData.length} codes loaded successfully`,
        })
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Refresh failed",
        description: "Could not refresh data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Function to handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    if (value === "all") {
      setSubscriptions(originalData)
    } else if (value === "available") {
      setSubscriptions(originalData.filter((sub) => sub.redeemed_by === null))
    } else if (value === "redeemed") {
      setSubscriptions(originalData.filter((sub) => sub.redeemed_by !== null))
    }
  }

  // Function to handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      // If search is empty, reset to current tab filter
      handleTabChange(activeTab)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = originalData.filter(
      (sub) =>
        (sub.code && sub.code.toLowerCase().includes(query)) ||
        (sub.package && sub.package.toLowerCase().includes(query)) ||
        (sub.amount && sub.amount.toString().includes(query)) ||
        (userInfo[sub.redeemed_by as number] && userInfo[sub.redeemed_by as number].toLowerCase().includes(query)),
    )

    setSubscriptions(filtered)
  }

  // Function to apply advanced filters
  const applyAdvancedFilters = () => {
    let filtered = [...originalData]

    // Apply package filter
    if (advancedFilters.package) {
      filtered = filtered.filter((sub) => sub.package?.toLowerCase().includes(advancedFilters.package.toLowerCase()))
    }

    // Apply status filter
    if (advancedFilters.status) {
      filtered = filtered.filter(
        (sub) =>
          (advancedFilters.status === "activated" && sub.redeemed_by !== null) ||
          (advancedFilters.status === "not_activated" && sub.redeemed_by === null),
      )
    }

    // Apply date range filter
    if (advancedFilters.dateRange?.from) {
      filtered = filtered.filter((sub) => {
        if (!sub.date_purchased) return false

        const purchaseDate = new Date(sub.date_purchased)
        const fromDate = advancedFilters.dateRange?.from as Date
        const toDate = (advancedFilters.dateRange?.to as Date) || new Date()

        return purchaseDate >= fromDate && purchaseDate <= toDate
      })
    }

    // Apply amount range filter
    if (advancedFilters.minAmount || advancedFilters.maxAmount) {
      filtered = filtered.filter((sub) => {
        const amount = sub.amount || 0
        const min = advancedFilters.minAmount ? Number.parseFloat(advancedFilters.minAmount) : 0
        const max = advancedFilters.maxAmount ? Number.parseFloat(advancedFilters.maxAmount) : Number.POSITIVE_INFINITY

        return amount >= min && amount <= max
      })
    }

    setSubscriptions(filtered)
  }

  // Function to reset filters
  const resetFilters = () => {
    setAdvancedFilters({
      package: "",
      status: "",
      dateRange: undefined,
      minAmount: "",
      maxAmount: "",
    })

    // Reset to current tab filter
    handleTabChange(activeTab)
  }

  // Function to export data
  const exportData = () => {
    const exportFormat = (data: Subscription[]) => {
      return data.map((item) => ({
        ID: item.id,
        Code: item.code,
        Package: item.package,
        Amount: item.amount,
        Status: item.redeemed_by ? "Activated" : "Not Activated",
        "Redeemed By": item.redeemed_by ? userInfo[item.redeemed_by] || `User #${item.redeemed_by}` : "N/A",
        "Date Purchased": item.date_purchased ? new Date(item.date_purchased).toLocaleString() : "N/A",
        "Date Activated": item.date_activated ? new Date(item.date_activated).toLocaleString() : "N/A",
      }))
    }

    const exportedData = exportFormat(subscriptions)
    const jsonString = JSON.stringify(exportedData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `activation-codes-${userId}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: `${exportedData.length} records exported to JSON`,
    })
  }

  // Function to copy code to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      })
    })
  }

  // Function to view code details
  const viewCodeDetails = (code: Subscription) => {
    setSelectedCode(code)
    setIsDetailsOpen(true)
  }

  const columns: ColumnDef<Subscription>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="whitespace-nowrap"
          >
            Activation Code
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const codeValue = row.getValue("code") as string | null

        return (
          <div className="flex items-center space-x-2">
            <div className="font-medium whitespace-nowrap w-32 truncate">
              {codeValue ? (isVisible ? codeValue : "••••••••") : "N/A"}
            </div>
            {codeValue && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsVisible(!isVisible)} className="h-8 w-8 p-0">
                  {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(codeValue)} className="h-8 w-8 p-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "package",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="whitespace-nowrap"
          >
            Package
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const packageValue = row.getValue("package") as string | null
        const formattedPackage = packageValue
          ? packageValue
              .replace(/_/g, " ")
              .toLowerCase()
              .replace(/\b\w/g, (char) => char.toUpperCase())
          : "N/A"

        return <div className="font-medium whitespace-nowrap w-40 truncate">{formattedPackage}</div>
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="whitespace-nowrap"
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number | null
        return (
          <div className="text-right font-medium whitespace-nowrap w-24">
            {amount ? `₱ ${amount.toFixed(2)}` : "N/A"}
          </div>
        )
      },
    },
    {
      accessorKey: "activation_status",
      header: "Status",
      cell: ({ row }) => {
        const redeemedBy = row.original.redeemed_by
        return (
          <div className="whitespace-nowrap w-28">
            {redeemedBy === null ? (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Not Activated
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Activated
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "date_purchased",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="whitespace-nowrap"
          >
            Date Purchased
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const datePurchased = row.getValue("date_purchased") as string | null
        return (
          <div className="whitespace-nowrap w-40">
            {datePurchased ? new Date(datePurchased).toLocaleString() : "N/A"}
          </div>
        )
      },
    },
    
    {
      accessorKey: "date_activated",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="whitespace-nowrap"
          >
            Date Activated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const dateActivated = row.getValue("date_activated") as string | null
        return (
          <div className="whitespace-nowrap w-40">
            {dateActivated ? new Date(dateActivated).toLocaleString() : "N/A"}
          </div>
        )
      },
    },
    {
      accessorKey: "redeemed_by",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="whitespace-nowrap"
          >
            Redeemed By
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const redeemedBy = row.getValue("redeemed_by") as number | null

        if (redeemedBy === null) {
          return <div className="whitespace-nowrap w-28">Not Redeemed</div>
        }

        // Check if we have the user info
        const nicename = userInfo[redeemedBy] || row.original.redeemer_nicename

        if (!nicename) {
          return <div className="whitespace-nowrap w-28 text-yellow-600">User Not Found (#{redeemedBy})</div>
        }

        return <div className="whitespace-nowrap w-28 truncate">{nicename}</div>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const subscription = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => copyToClipboard(subscription.id.toString())}>Copy ID</DropdownMenuItem>
              {subscription.code && (
                <DropdownMenuItem onClick={() => copyToClipboard(subscription.code as string)}>
                  Copy Code
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => viewCodeDetails(subscription)}>View Details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: subscriptions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="flex items-center space-x-4"
        >
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse m-2"></div>
          <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse m-2"></div>
          <div className="h-4 w-1/6 bg-gray-200 rounded animate-pulse m-2"></div>
          <div className="h-4 w-1/6 bg-gray-200 rounded animate-pulse m-2"></div>
          <div className="h-4 w-1/5 bg-gray-200 rounded animate-pulse m-2"></div>
          <div className="h-4 w-1/6 bg-gray-200 rounded animate-pulse m-2"></div>
        </motion.div>
      ))}
    </div>
  )

  const availableCount = subscriptions.filter((sub) => sub.redeemed_by === null).length
  const redeemedCount = subscriptions.filter((sub) => sub.redeemed_by !== null).length

  if (userNotFound) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full space-y-4"
      >
        <Alert variant="destructive">
          <AlertTitle>User Not Found</AlertTitle>
          <AlertDescription>
            The user with ID #{userId} could not be found or is not available. Please verify the user ID and try again.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => window.history.back()} className="mt-4">
          Go Back
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-4"
    >
      <ActivationOverview
        availableCount={availableCount}
        redeemedCount={redeemedCount}
        historicalData={subscriptions}
      />

      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All Codes</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="redeemed">Redeemed</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={refreshData} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold">All Activation Codes</h3>
                  <p className="text-sm text-muted-foreground">
                    Showing {subscriptions.length} of {originalData.length} codes
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Advanced Filters</DialogTitle>
                        <DialogDescription>Filter activation codes by various criteria</DialogDescription>
                      </DialogHeader>
                      <AdvancedFilters
                        filters={advancedFilters}
                        setFilters={setAdvancedFilters}
                        applyFilters={applyAdvancedFilters}
                        resetFilters={resetFilters}
                        packageOptions={packageOptions}
                      />
                    </DialogContent>
                  </Dialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {table
                        .getAllColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => {
                          return (
                            <DropdownMenuCheckboxItem
                              key={column.id}
                              className="capitalize"
                              checked={column.getIsVisible()}
                              onCheckedChange={(value) => column.toggleVisibility(!!value)}
                            >
                              {column.id}
                            </DropdownMenuCheckboxItem>
                          )
                        })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" onClick={exportData}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {Object.values(advancedFilters).some(Boolean) && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-muted p-2 mx-4 rounded-md mb-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Active Filters:</h3>
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2">
                        Clear All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {advancedFilters.package && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Package: {advancedFilters.package}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAdvancedFilters({ ...advancedFilters, package: "" })}
                            className="h-4 w-4 p-0 ml-1"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      {advancedFilters.status && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Status: {advancedFilters.status === "activated" ? "Activated" : "Not Activated"}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAdvancedFilters({ ...advancedFilters, status: "" })}
                            className="h-4 w-4 p-0 ml-1"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      {advancedFilters.dateRange && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Date Range: {advancedFilters.dateRange.from?.toLocaleDateString()} -{" "}
                          {advancedFilters.dateRange.to?.toLocaleDateString() || "Present"}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAdvancedFilters({ ...advancedFilters, dateRange: undefined })}
                            className="h-4 w-4 p-0 ml-1"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      {(advancedFilters.minAmount || advancedFilters.maxAmount) && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Amount: {advancedFilters.minAmount || "0"} - {advancedFilters.maxAmount || "∞"}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAdvancedFilters({ ...advancedFilters, minAmount: "", maxAmount: "" })}
                            className="h-4 w-4 p-0 ml-1"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="rounded-md border overflow-hidden">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                              return (
                                <TableHead key={header.id} className="whitespace-nowrap">
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                              <motion.tr
                                key={row.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className={row.getIsSelected() ? "bg-muted" : ""}
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell key={cell.id} className="whitespace-nowrap">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                ))}
                              </motion.tr>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={columns.length} className="h-24 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                                  <p>No results found</p>
                                  {searchQuery && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSearchQuery("")
                                        handleTabChange(activeTab)
                                      }}
                                    >
                                      Clear Search
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
                  selected.
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                      value={`${table.getState().pagination.pageSize}`}
                      onValueChange={(value) => {
                        table.setPageSize(Number(value))
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-center text-sm font-medium">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <span className="sr-only">Go to first page</span>
                      <ChevronDown className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <span className="sr-only">Go to previous page</span>
                      <ChevronDown className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      <span className="sr-only">Go to next page</span>
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      disabled={!table.getCanNextPage()}
                    >
                      <span className="sr-only">Go to last page</span>
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="available" className="mt-0">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Available Codes</h3>
                <Badge variant="outline" className="bg-green-50">
                  {availableCount} Available
                </Badge>
              </div>

              {availableCount > 0 ? (
                <ActivationChart data={originalData.filter((sub) => sub.redeemed_by === null)} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Available Codes</h3>
                  <p className="text-sm text-muted-foreground max-w-md mt-2">
                    All your activation codes have been redeemed. You can purchase more codes to continue.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redeemed" className="mt-0">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Redeemed Codes</h3>
                <Badge variant="outline" className="bg-orange-50">
                  {redeemedCount} Redeemed
                </Badge>
              </div>

              {redeemedCount > 0 ? (
                <ActivationChart data={originalData.filter((sub) => sub.redeemed_by !== null)} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Redeemed Codes</h3>
                  <p className="text-sm text-muted-foreground max-w-md mt-2">
                    None of your activation codes have been redeemed yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Code Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Activation Code Details</DialogTitle>
          </DialogHeader>

          {selectedCode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Code</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{selectedCode.code}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => selectedCode.code && copyToClipboard(selectedCode.code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Package</p>
                  <p className="font-medium">
                    {selectedCode.package
                      ? selectedCode.package
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (c) => c.toUpperCase())
                      : "N/A"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="font-medium">{selectedCode.amount ? `₱ ${selectedCode.amount.toFixed(2)}` : "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div>
                    {selectedCode.redeemed_by === null ? (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Not Activated
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Activated
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Date Purchased</p>
                  <p className="font-medium">
                    {selectedCode.date_purchased ? new Date(selectedCode.date_purchased).toLocaleString() : "N/A"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Date Activated</p>
                  <p className="font-medium">
                    {selectedCode.date_activated ? new Date(selectedCode.date_activated).toLocaleString() : "N/A"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Redeemed By</p>
                {selectedCode.redeemed_by ? (
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {userInfo[selectedCode.redeemed_by] ||
                          selectedCode.redeemer_nicename ||
                          `User #${selectedCode.redeemed_by}`}
                      </p>
                      <p className="text-xs text-muted-foreground">ID: {selectedCode.redeemed_by}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-muted-foreground" />
                    <p className="text-muted-foreground">Not redeemed yet</p>
                  </div>
                )}
              </div>

              {selectedCode.metadata && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Additional Information</p>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">{selectedCode.metadata}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </motion.div>
  )
}

// User icon component for the details dialog
const User = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

export default ActivationCodesTables

