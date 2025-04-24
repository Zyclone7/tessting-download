"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
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
import { ChevronDown, Eye, EyeOff, Search, FileDown, Filter, X, Check, Copy, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useUserContext } from "@/hooks/use-user"
import { getTelcoTransactionsByUserId } from "@/actions/telco"

// Define the transaction interface based on the API structure
interface TelcoTransaction {
  id: number
  request_id: string
  product_code: string
  recipient: string
  amount: number
  provider_name: string
  promo_name: string | null
  promo_description: string | null
  validity: string | null
  payment_method: string
  service_fee: number
  provider_discount: number
  subtotal: number
  total: number
  status: string
  response_rrn?: string
  response_token?: string | null
  response_balance?: number | null
  error_code?: string
  error_message?: string
  user_id: number
  created_at: string
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalRecords: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 10

const TelcoTransactionsTable = () => {
  const [transactions, setTransactions] = useState<TelcoTransaction[]>([])
  
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true }, // Default sorting by created_at (newest first)
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [exportLoading, setExportLoading] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [paginationData, setPaginationData] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    pageSize: DEFAULT_PAGE_SIZE
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { user } = useUserContext()

  // Function to determine column widths
  const getColumnWidth = (columnId: string) => {
    switch (columnId) {
      case "select":
        return "w-[40px]"
      case "request_id":
        return "w-[150px]"
      case "recipient":
        return "w-[130px]"
      case "product_code":
        return "w-[130px]"
      case "amount":
        return "w-[100px]"
      case "payment_method":
        return "w-[130px]"
      case "status":
        return "w-[100px]"
      case "created_at":
        return "w-[160px]"
      default:
        return "w-auto"
    }
  }

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setIsRefreshing(true);
  
    try {
      // Handle the case where the backend function might be updated (3 params) or still in original form (1 param)
      let response;
      try {
        // Try first with pagination parameters
        response = await getTelcoTransactionsByUserId(
          user.id.toString(), 
          paginationData.currentPage, 
          paginationData.pageSize
        );
      } catch (err) {
        // If that fails, fall back to the original function signature
        console.warn("Falling back to original function signature");
        response = await getTelcoTransactionsByUserId(user.id.toString());
      }
      
      if (response.success && response.data) {
        setTransactions(
          response.data.map((transaction) => ({
            ...transaction,
            amount: Number(transaction.amount), // Convert Decimal to number
          }))
        );
        
        // Check if metadata exists (will be present in updated function, absent in original)
        if (response.metadata) {
          setPaginationData({
            currentPage: response.metadata.page,
            totalPages: response.metadata.totalPages,
            totalRecords: response.metadata.total,
            pageSize: response.metadata.limit
          });
        } else {
          // If no metadata, we're using the old version of the function
          // Set some reasonable defaults
          setPaginationData({
            currentPage: 1,
            totalPages: 1,
            totalRecords: response.data.length,
            pageSize: response.data.length
          });
        }
      } else {
        setError(response.message || "Failed to fetch transactions.");
        console.error("Error from server action:", response.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, paginationData.currentPage, paginationData.pageSize]);

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Apply global search across multiple columns
  useEffect(() => {
    if (searchTerm) {
      table?.getColumn("recipient")?.setFilterValue(searchTerm)
    } else {
      table?.getColumn("recipient")?.setFilterValue("")
    }
  }, [searchTerm])

  // Focus search input when pressing Ctrl+F or Command+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Memoize columns definition to prevent unnecessary re-renders
  const columns = useMemo<ColumnDef<TelcoTransaction>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={table.getIsAllPageRowsSelected()}
                  onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                  aria-label="Select all"
                  className="rounded-sm data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transition-all duration-200"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Select all rows</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="rounded-sm data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transition-all duration-200"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "request_id",
      header: "Request ID",
      cell: ({ row }) => {
        const reqId = row.getValue("request_id") as string
        const [isCopied, setIsCopied] = useState(false)

        const copyToClipboard = () => {
          navigator.clipboard.writeText(reqId)
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        }

        return (
          <div className="flex items-center justify-start gap-2 group">
            <div className="font-mono text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">
              {reqId}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={copyToClipboard}
                    className={cn(
                      "flex-shrink-0 transition-all duration-200 rounded-full p-1 hover:bg-gray-100",
                      isCopied
                        ? "text-green-500"
                        : "text-gray-500 hover:text-gray-800 opacity-0 group-hover:opacity-100",
                    )}
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{isCopied ? "Copied!" : "Copy request ID"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      },
    },
    {
      accessorKey: "recipient",
      header: "Recipient",
      cell: ({ row }) => {
        const phoneNum = row.getValue("recipient") as string
        const [isVisible, setIsVisible] = useState(false)
        const [isCopied, setIsCopied] = useState(false)

        const copyToClipboard = () => {
          navigator.clipboard.writeText(phoneNum)
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        }

        return (
          <div className="flex items-center justify-start gap-2 group">
            <div className="font-mono text-sm whitespace-nowrap">
              {isVisible ? phoneNum : phoneNum.replace(/(\d{3})(\d{4})(\d{4})/, "$1•••••$3")}
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsVisible(!isVisible)}
                      className="text-gray-500 hover:text-gray-800 flex-shrink-0 transition-colors duration-200 rounded-full p-1 hover:bg-gray-100"
                    >
                      {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{isVisible ? "Hide number" : "Show full number"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={copyToClipboard}
                      className={cn(
                        "flex-shrink-0 transition-all duration-200 rounded-full p-1 hover:bg-gray-100",
                        isCopied
                          ? "text-green-500"
                          : "text-gray-500 hover:text-gray-800 opacity-0 group-hover:opacity-100",
                      )}
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{isCopied ? "Copied!" : "Copy number"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const cellValue = row.getValue(id) as string;
        return cellValue.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "product_code",
      header: "Product Code",
      cell: ({ row }) => <div className="whitespace-nowrap font-mono text-sm">{row.getValue("product_code")}</div>,
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-center">Amount</div>,
      cell: ({ row }) => (
        <div className="text-center font-medium whitespace-nowrap">
          ₱ {Number(row.getValue("amount")).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "provider_name",
      header: "Provider",
      cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("provider_name")}</div>,
    },
    {
      accessorKey: "payment_method",
      header: "Payment Method",
      cell: ({ row }) => {
        const method = row.getValue("payment_method") as string
        return (
          <Badge 
            className={cn(
              "whitespace-nowrap font-normal",
              method === "credits" 
                ? "bg-blue-100 text-blue-800 hover:bg-blue-200" 
                : "bg-purple-100 text-purple-800 hover:bg-purple-200"
            )}
          >
            {method.charAt(0).toUpperCase() + method.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge 
            className={cn(
              "whitespace-nowrap",
              status === "COMPLETED" 
                ? "bg-green-100 text-green-800 hover:bg-green-200" 
                : status === "PROCESSING"
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : "bg-red-100 text-red-800 hover:bg-red-200"
            )}
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Date & Time",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string
        return (
          <div className="whitespace-nowrap text-sm">
            {new Date(date).toLocaleString()}
          </div>
        )
      },
    },
  ], [])

  const SkeletonRow = () => (
    <TableRow className="hover:bg-transparent">
      {Array.from({ length: columns.length }).map((_, index) => (
        <TableCell key={index} className={index === 0 ? "w-[40px]" : ""}>
          <Skeleton className={cn("h-6", index === 0 ? "w-6" : "w-full")} />
        </TableCell>
      ))}
    </TableRow>
  )

  // Function for row animations
  const animateRowSelection = (rowId: string, selected: boolean) => {
    const row = document.getElementById(`row-${rowId}`)
    if (row) {
      if (selected) {
        row.classList.add("bg-primary/5")
        row.classList.add("animate-pulse")
        setTimeout(() => {
          row.classList.remove("animate-pulse")
        }, 500)
      } else {
        row.classList.remove("bg-primary/5")
      }
    }
  }

  const table = useReactTable({
    data: transactions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // We handle server-side pagination, so we don't need the client-side pagination model
    // getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const oldSelection: any = { ...rowSelection }
      const newSelection = typeof updater === "function" ? updater(oldSelection) : updater

      // Find which row was toggled
      Object.keys(newSelection).forEach((key) => {
        if (oldSelection[key] !== newSelection[key]) {
          animateRowSelection(key, newSelection[key])
        }
      })

      setRowSelection(newSelection)
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    // No need to set initialState pagination since it's handled on the server
    manualPagination: true, // Tell the table that we're handling pagination manually
    pageCount: paginationData.totalPages,
  })

  // Apply global search across multiple columns
  useEffect(() => {
    if (searchTerm) {
      table?.getColumn("recipient")?.setFilterValue(searchTerm)
    } else {
      table?.getColumn("recipient")?.setFilterValue("")
    }
  }, [searchTerm, table])

  const exportToCSV = async () => {
    setExportLoading(true)

    try {
      // Get all transactions if we're exporting (client-side only for now)
      const headers = columns
        .filter((column) => column.id !== "select")
        .map((column) => {
          if ("accessorKey" in column) {
            return column.accessorKey
          }
          return column.id
        })
        .join(",")

      const csvData = transactions
        .map((transaction) => {
          return columns
            .filter((column) => column.id !== "select")
            .map((column) => {
              let value: any
              if ("accessorKey" in column && column.accessorKey) {
                value = transaction[column.accessorKey as keyof TelcoTransaction]
              } else {
                value = ""
              }
              return typeof value === "string" && value.includes(",") ? `"${value}"` : value
            })
            .join(",")
        })
        .join("\n")

      const csvContent = `${headers}\n${csvData}`
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `telco_transactions_${new Date().toISOString().split("T")[0]}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } finally {
      setExportLoading(false)
    }
  }

  // Function to clear all filters and reset to default state
  const clearFilters = () => {
    setSearchTerm("")
    setColumnFilters([])
    setActiveFilters([])
    
    // Reset all column filters
    table.getAllColumns().forEach(column => {
      column.setFilterValue(undefined)
    })
    
    // Reset page to 1 after clearing filters
    setPaginationData({
      ...paginationData,
      currentPage: 1
    })
  }

  // Function to toggle a specific filter
  const toggleFilter = (filterName: string) => {
    if (activeFilters.includes(filterName)) {
      setActiveFilters(activeFilters.filter((f) => f !== filterName))
    } else {
      setActiveFilters([...activeFilters, filterName])
    }
  }
  
  // Function to handle refresh
  const handleRefresh = () => {
    fetchTransactions()
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search recipient phone number... (Ctrl+F)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9 transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-primary/50 w-full"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="transition-all duration-200 hover:bg-primary/10 h-9"
            aria-label="Refresh transaction data"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            <span className="ml-2 sr-only sm:not-sr-only">Refresh</span>
          </Button>
          
          {activeFilters.length > 0 && (
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 h-9"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "transition-all duration-200 hover:bg-primary/10 h-9",
                  activeFilters.length > 0 && "border-primary/30 bg-primary/5",
                )}
              >
                <Filter className="mr-2 h-3.5 w-3.5" />
                Filter
                {activeFilters.length > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground h-5 px-1.5">{activeFilters.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes("status")}
                onCheckedChange={() => toggleFilter("status")}
              >
                Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes("payment_method")}
                onCheckedChange={() => toggleFilter("payment_method")}
              >
                Payment Method
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes("provider")}
                onCheckedChange={() => toggleFilter("provider")}
              >
                Provider
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes("amount")}
                onCheckedChange={() => toggleFilter("amount")}
              >
                Amount
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes("date")}
                onCheckedChange={() => toggleFilter("date")}
              >
                Date
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            disabled={exportLoading || transactions.length === 0}
            className="transition-all duration-200 hover:bg-primary/10 h-9"
          >
            {exportLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-3.5 w-3.5" />
                Export CSV
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="transition-all duration-200 hover:bg-primary/10 h-9">
                <ChevronDown className="mr-2 h-3.5 w-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    className="capitalize"
                  >
                    {column.id.replace(/_/g, " ")}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="overflow-x-auto max-w-full">
          <Table className="w-full">
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="bg-slate-50 hover:bg-slate-50">
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "whitespace-nowrap px-3 py-3 font-semibold text-slate-700",
                        getColumnWidth(header.id),
                      )}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                // Show skeleton rows while loading
                Array.from({ length: DEFAULT_PAGE_SIZE }).map((_, index) => <SkeletonRow key={index} />)
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "transition-colors duration-200 hover:bg-slate-50 border-b last:border-b-0",
                      row.getIsSelected() && "bg-primary/5",
                    )}
                    data-state={row.getIsSelected() ? "selected" : ""}
                    id={`row-${row.id}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cn("px-3 py-3", getColumnWidth(cell.column.id))}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center h-32">
                    {error ? (
                      <div className="text-red-500 flex flex-col items-center justify-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-8 w-8"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <p className="font-medium">{error}</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      <div className="text-slate-500 flex flex-col items-center justify-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-8 w-8"
                        >
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                          <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                        <p className="font-medium">No transactions found</p>
                        <p className="text-sm text-slate-400">
                          When you make telco transactions, they will appear here.
                        </p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <span className="font-medium">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {paginationData.totalRecords} row(s) selected.
            </span>
          )}
          {table.getFilteredSelectedRowModel().rows.length === 0 && (
            <span>
              Showing {paginationData.currentPage === 1 
                ? 1 
                : ((paginationData.currentPage - 1) * paginationData.pageSize) + 1} to{" "}
              {Math.min(paginationData.currentPage * paginationData.pageSize, paginationData.totalRecords)} of{" "}
              {paginationData.totalRecords} entries
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPaginationData({
                ...paginationData,
                currentPage: 1
              })
            }}
            disabled={paginationData.currentPage === 1 || loading}
            className="h-8 w-8 p-0 flex items-center justify-center"
          >
            <span className="sr-only">Go to first page</span>
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPaginationData({
                ...paginationData,
                currentPage: paginationData.currentPage - 1
              })
            }}
            disabled={paginationData.currentPage === 1 || loading}
            className="h-8 w-8 p-0 flex items-center justify-center"
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Page</span>
            <Input
              type="number"
              min={1}
              max={paginationData.totalPages}
              value={paginationData.currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (
                  !isNaN(page) &&
                  page >= 1 &&
                  page <= paginationData.totalPages
                ) {
                  setPaginationData({
                    ...paginationData,
                    currentPage: page
                  })
                }
              }}
              className="h-8 w-12 text-center"
            />
            <span className="text-sm font-medium">of {paginationData.totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPaginationData({
                ...paginationData,
                currentPage: paginationData.currentPage + 1
              })
            }}
            disabled={paginationData.currentPage === paginationData.totalPages || loading}
            className="h-8 w-8 p-0 flex items-center justify-center"
          >
            <span className="sr-only">Go to next page</span>
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPaginationData({
                ...paginationData,
                currentPage: paginationData.totalPages
              })
            }}
            disabled={paginationData.currentPage === paginationData.totalPages || loading}
            className="h-8 w-8 p-0 flex items-center justify-center"
          >
            <span className="sr-only">Go to last page</span>
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {paginationData.pageSize} rows
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {[10, 25, 50, 100].map((pageSize) => (
                <DropdownMenuCheckboxItem
                  key={pageSize}
                  checked={paginationData.pageSize === pageSize}
                  onCheckedChange={() => {
                    setPaginationData({
                      ...paginationData,
                      pageSize: pageSize,
                      currentPage: 1 // Reset to first page when changing page size
                    })
                  }}
                >
                  {pageSize} rows
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Transaction Summary (optional) */}
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="mt-2 p-4 border rounded-md bg-slate-50 shadow-sm">
          <h3 className="text-sm font-medium mb-2">Selected Transaction Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-md border shadow-sm">
              <div className="text-xs text-muted-foreground">Total Amount</div>
              <div className="text-lg font-medium">
                ₱{table
                  .getFilteredSelectedRowModel()
                  .rows
                  .reduce((total, row) => total + (row.original.amount || 0), 0)
                  .toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-3 rounded-md border shadow-sm">
              <div className="text-xs text-muted-foreground">Completed</div>
              <div className="text-lg font-medium">
                {table
                  .getFilteredSelectedRowModel()
                  .rows
                  .filter(row => row.original.status === "COMPLETED")
                  .length}
              </div>
            </div>
            <div className="bg-white p-3 rounded-md border shadow-sm">
              <div className="text-xs text-muted-foreground">Processing</div>
              <div className="text-lg font-medium">
                {table
                  .getFilteredSelectedRowModel()
                  .rows
                  .filter(row => row.original.status === "PROCESSING")
                  .length}
              </div>
            </div>
            <div className="bg-white p-3 rounded-md border shadow-sm">
              <div className="text-xs text-muted-foreground">Failed</div>
              <div className="text-lg font-medium">
                {table
                  .getFilteredSelectedRowModel()
                  .rows
                  .filter(row => row.original.status === "FAILED")
                  .length}
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.toggleAllRowsSelected(false)}
              className="text-sm"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TelcoTransactionsTable