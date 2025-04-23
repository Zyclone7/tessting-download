"use client"

import { useState, useEffect, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
} from "@tanstack/react-table"
import { getAllKYCVerification, getUserInfo, updateKYCStatus } from "@/actions/user"
import { columns } from "./columns"
import { KYCTableFilters } from "./kyc-table-filters"
import { KYCDialog } from "./kyc-dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

export function KYCVerificationTable() {
  const [allData, setAllData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const { toast } = useToast()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [selectedKYC, setSelectedKYC] = useState<any | null>(null)
  const [userDetails, setUserDetails] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [exportLoading, setExportLoading] = useState(false)

  const table = useReactTable({
    data: allData,
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

  // Filter data based on active tab
  const filteredData = useMemo(() => {
    if (activeTab === "all") return allData
    return allData.filter((item) => item.status?.toLowerCase() === activeTab.toLowerCase())
  }, [allData, activeTab])

  // Update table data when filtered data changes
  useEffect(() => {
    table.options.data = filteredData
  }, [filteredData, table])

  // Fetch data with improved error handling
  const fetchData = async (filters: any = {}, sorting: SortingState = []) => {
    if (!initialLoading) setLoading(true)
    try {
      console.log("Fetching KYC verification data...")
      const result = await getAllKYCVerification()

      if (result.success) {
        // Enhance KYC data with user information
        const enhancedData = await Promise.all(
          (result.data ?? []).map(async (kyc: any) => {
            try {
              const userInfo = await getUserInfo(kyc.user_id)
              return {
                ...kyc,
                user_info: userInfo,
              }
            } catch (error) {
              console.error(`Failed to fetch user info for ID ${kyc.user_id}:`, error)
              return {
                ...kyc,
                user_info: { display_name: "Unknown", user_email: "Unknown" },
              }
            }
          }),
        )

        // Apply filters if any
        let filteredData = enhancedData
        if (filters.status && filters.status !== "all") {
          filteredData = filteredData.filter((item: any) => item.status?.toLowerCase() === filters.status.toLowerCase())
        }

        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          filteredData = filteredData.filter(
            (item: any) =>
              item.user_info?.display_name?.toLowerCase().includes(searchLower) ||
              item.user_info?.user_email?.toLowerCase().includes(searchLower) ||
              item.user_info?.business_name?.toLowerCase().includes(searchLower) ||
              item.user_id?.toString().includes(searchLower),
          )
        }

        if (filters.dateRange) {
          if (filters.dateRange.from) {
            filteredData = filteredData.filter(
              (item: any) => new Date(item.date_submitted) >= new Date(filters.dateRange.from),
            )
          }
          if (filters.dateRange.to) {
            filteredData = filteredData.filter(
              (item: any) => new Date(item.date_submitted) <= new Date(filters.dateRange.to),
            )
          }
        }

        // Apply sorting if any
        if (sorting.length > 0) {
          const { id, desc } = sorting[0]
          filteredData.sort((a: any, b: any) => {
            let valueA, valueB

            // Handle nested properties like user_info.display_name
            if (id.includes(".")) {
              const [parent, child] = id.split(".")
              valueA = a[parent]?.[child]
              valueB = b[parent]?.[child]
            } else {
              valueA = a[id]
              valueB = b[id]
            }

            // Handle dates
            if (valueA instanceof Date && valueB instanceof Date) {
              return desc ? valueB.getTime() - valueA.getTime() : valueA.getTime() - valueB.getTime()
            }

            // Handle strings and other values
            if (valueA < valueB) return desc ? 1 : -1
            if (valueA > valueB) return desc ? -1 : 1
            return 0
          })
        }

        setAllData(filteredData)
        table.setPageIndex(0) // Reset to the first page when new data is loaded
      } else {
        console.error("Failed to fetch KYC verifications:", result.message)
        throw new Error(result.message || "Failed to fetch KYC verifications")
      }
    } catch (error) {
      console.error("Error in fetchData:", error)
      toast({
        title: "Error",
        description: "Failed to fetch KYC verifications. Please try again.",
        variant: "destructive",
      })
      // Set empty data array to avoid undefined errors
      setAllData([])
    }
    setLoading(false)
    setInitialLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    fetchData()
  }

  const handleRowClick = async (kyc: any) => {
    setSelectedKYC(kyc)

    // If we don't already have detailed user info, fetch it
    if (!kyc.user_info || Object.keys(kyc.user_info).length === 0) {
      try {
        const userInfo = await getUserInfo(kyc.user_id)
        setUserDetails(userInfo)
      } catch (error) {
        console.error("Error fetching user details:", error)
        toast({
          title: "Error",
          description: "Failed to fetch user details. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      setUserDetails(kyc.user_info)
    }
  }

  const handleKYCUpdate = async (updatedKYC: any) => {
    try {
      // Call the server action to update KYC status
      const result = await updateKYCStatus({
        user_id: updatedKYC.user_id,
        status: updatedKYC.status,
        rejection_reason: updatedKYC.reason_of_reject,
        sendNotification: true,
      })

      if (result.success) {
        // Update the local state
        setAllData((prevData) =>
          prevData.map((kyc) =>
            kyc.user_id === updatedKYC.user_id
              ? {
                ...kyc,
                status: updatedKYC.status,
                reason_of_reject: updatedKYC.reason_of_reject,
                date_approve_denied: new Date(),
              }
              : kyc,
          ),
        )

        setSelectedKYC({ ...updatedKYC, date_approve_denied: new Date() })

        toast({
          title: "Success",
          description: `KYC verification ${updatedKYC.status.toLowerCase()} successfully.`,
        })
      } else {
        throw new Error(result.message || "Failed to update KYC status")
      }
    } catch (error) {
      console.error("Error updating KYC verification:", error)
      toast({
        title: "Error",
        description: "Failed to update KYC verification. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExportData = () => {
    setExportLoading(true)
    try {
      // Create CSV content
      const headers = ["User ID", "Name", "Email", "Business Name", "Status", "Submission Date", "Decision Date"]

      const csvRows = [
        headers.join(","),
        ...filteredData.map((item) =>
          [
            item.user_id,
            item.user_info?.display_name || "Unknown",
            item.user_info?.user_email || "Unknown",
            item.user_info?.business_name || "N/A",
            item.status,
            item.date_submitted ? format(new Date(item.date_submitted), "yyyy-MM-dd") : "N/A",
            item.date_approve_denied ? format(new Date(item.date_approve_denied), "yyyy-MM-dd") : "N/A",
          ].join(","),
        ),
      ]

      const csvContent = csvRows.join("\n")

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `kyc-verification-${format(new Date(), "yyyy-MM-dd")}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: "KYC verification data has been exported to CSV.",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export KYC verification data.",
        variant: "destructive",
      })
    }
    setExportLoading(false)
  }

  // Calculate statistics for the dashboard
  const stats = useMemo(() => {
    const total = allData.length
    const pending = allData.filter((item) => item.status?.toLowerCase() === "pending").length
    const approved = allData.filter((item) => item.status?.toLowerCase() === "approved").length
    const rejected = allData.filter((item) => item.status?.toLowerCase() === "rejected").length

    return { total, pending, approved, rejected }
  }, [allData])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">KYC Verification Dashboard</h1>
          <p className="text-muted-foreground">Manage and process Know Your Customer verification requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportData}
            variant="outline"
            size="sm"
            disabled={exportLoading || allData.length === 0}
          >
            {exportLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="icon" title="Refresh data">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>View Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column: any, index) => {
                return (
                  <DropdownMenuItem
                    key={column.id + " " + index}
                    className="capitalize"
                    onClick={() => {
                      setColumnVisibility((prev) => ({
                        ...prev,
                        [column.id]: !prev[column.id],
                      }))
                    }}
                  >
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={column.id ? table.getColumn(column.id)?.getIsVisible() ?? true : false}
                      onChange={() => { }}
                    />
                    {(column.id ?? "").replace(/([A-Z])/g, " $1").trim()}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All KYC verification requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Successfully verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Failed verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <div className="space-y-4">
        <KYCTableFilters onFilterChange={(filters) => fetchData(filters, sorting)} />

        {/* <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-amber-500">
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-green-500">
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-red-500">
              Rejected
            </TabsTrigger>
          </TabsList>
        </Tabs> */}
      </div>

      {/* Data Table */}
      <motion.div
        key={table.getState().pagination.pageIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="rounded-md border shadow-sm overflow-hidden bg-white"
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {initialLoading ? (
              // Skeleton loading state
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: columns.length }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Loading verification data...</p>
                  </motion.div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="wait">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      layout
                      className={`${row.getIsSelected() ? "bg-muted" : ""} cursor-pointer hover:bg-muted/50 group`}
                      onClick={() => handleRowClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center py-4">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground font-medium">No verification requests found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Try adjusting your filters or refreshing the data
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value))
              }}
            >
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KYC Detail Dialog */}
      {selectedKYC && (
        <KYCDialog
          kyc={selectedKYC}
          userDetails={userDetails}
          open={!!selectedKYC}
          onOpenChange={(open) => !open && setSelectedKYC(null)}
          onKYCUpdate={handleKYCUpdate}
        />
      )}
    </motion.div>
  )
}
