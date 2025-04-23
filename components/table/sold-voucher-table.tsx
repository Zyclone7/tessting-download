"use client"

import { useEffect, useState, useRef } from "react"
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
import { ChevronDown, Eye, EyeOff, Search, FileDown, Filter, X, Check, Copy } from "lucide-react"

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
import { getGsatVoucherByUserId } from "@/actions/gsat-voucher"
import { useUserContext } from "@/hooks/use-user"
import { cn } from "@/lib/utils"

interface GsatVoucher {
  gsat_voucher_id: number
  serial_number: string | null
  reference_number: string | null
  amount: number
  discount: number
  product_code: string
  status: string | null
  expiry_date: string | null
  used_date: string | null
  created_at?: string | null
  updated_at?: string | null
  owned_by?: number | null
}

const SoldGsatVoucherTable = () => {
  const [vouchers, setVouchers] = useState<GsatVoucher[]>([])
  const [sorting, setSorting] = useState<SortingState>([
    { id: "serial_number", desc: false }, // Default sorting by serial_number
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [exportLoading, setExportLoading] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { user } = useUserContext()

  // Function to determine column widths
  const getColumnWidth = (columnId: string) => {
    switch (columnId) {
      case "select":
        return "w-[40px]"
      case "serial_number":
        return "w-[180px]"
      case "reference_number":
        return "w-[150px]"
      case "amount":
        return "w-[100px]"
      case "discount":
        return "w-[100px]"
      case "product_code":
        return "w-[120px]"
      case "status":
        return "w-[100px]"
      case "used_date":
        return "w-[120px]"
      default:
        return "w-auto"
    }
  }

  useEffect(() => {
    const fetchVouchers = async () => {
      if (!user?.id) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response: any = await getGsatVoucherByUserId(user.id.toString())
        console.log("Fetched vouchers:", response.data)

        if (response.success && response.data) {
          setVouchers(response.data)
        } else {
          setError(response.message || "Failed to fetch GSAT vouchers.")
          console.error("Error from server action:", response.message)
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchVouchers()
  }, [user?.id])

  // Apply global search across multiple columns
  useEffect(() => {
    if (searchTerm) {
      table.getColumn("serial_number")?.setFilterValue(searchTerm)
    } else {
      table.getColumn("serial_number")?.setFilterValue("")
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

  const columns: ColumnDef<GsatVoucher>[] = [
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
      accessorKey: "serial_number",
      header: "Serial Number",
      cell: ({ row }) => {
        const serialValue = row.getValue("serial_number") as string
        const [isVisible, setIsVisible] = useState(false)
        const [isCopied, setIsCopied] = useState(false)

        const copyToClipboard = () => {
          navigator.clipboard.writeText(serialValue)
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        }

        return (
          <div className="flex items-center justify-center gap-2 group">
            <div className="font-mono text-sm whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300">
              {isVisible ? serialValue : "••••••••••••••••"}
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
                    <p>{isVisible ? "Hide serial number" : "Show serial number"}</p>
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
                    <p>{isCopied ? "Copied!" : "Copy serial number"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "reference_number",
      header: "Reference Number",
      cell: ({ row }) => {
        const refValue = row.getValue("reference_number") as string
        const [isCopied, setIsCopied] = useState(false)

        const copyToClipboard = () => {
          if (!refValue) return
          navigator.clipboard.writeText(refValue)
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        }

        return (
          <div className="flex items-center justify-center gap-2 group">
            <div className="font-mono text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">
              {refValue || "N/A"}
            </div>
            {refValue && (
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
                    <p>{isCopied ? "Copied!" : "Copy reference number"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )
      },
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
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }) => (
        <div className="text-center whitespace-nowrap">₱ {Number(row.getValue("discount")).toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "product_code",
      header: "Product Code",
      cell: ({ row }) => <div className="whitespace-nowrap font-mono text-sm">{row.getValue("product_code")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ }) => {
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200 whitespace-nowrap">
            Sold
          </Badge>
        )
      },
    },
    {
      accessorKey: "used_date",
      header: "Purchase Date",
      cell: ({ row }) => {
        const date: any = row.getValue("used_date")
        return <div className="whitespace-nowrap">{date ? new Date(date).toLocaleString() : "N/A"}</div>
      },
    },
  ]

  const SkeletonRow = () => (
    <TableRow className="hover:bg-transparent">
      {Array.from({ length: 8 }).map((_, index) => (
        <TableCell key={index} className={index === 0 ? "w-[40px]" : ""}>
          <Skeleton className={cn("h-6", index === 0 ? "w-6" : "w-full")} />
        </TableCell>
      ))}
    </TableRow>
  )

  // Add this new function for row animations
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
    data: vouchers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
    initialState: {
      pagination: {
        pageSize: 5, // Changed from 10 to 5
      },
    },
  })

  const exportToCSV = async () => {
    setExportLoading(true)

    try {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      const headers = columns
        .filter((column) => column.id !== "select")
        .map((column) => {
          if ("accessorKey" in column) {
            return column.accessorKey
          }
          return column.id
        })
        .join(",")

      const csvData = vouchers
        .map((voucher) => {
          return columns
            .filter((column) => column.id !== "select")
            .map((column) => {
              let value: any
              if ("accessorKey" in column && column.accessorKey) {
                value = voucher[column.accessorKey as keyof GsatVoucher]
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
        link.setAttribute("download", `gsat_vouchers_${new Date().toISOString().split("T")[0]}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } finally {
      setExportLoading(false)
    }
  }

  // Function to clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setColumnFilters([])
    setActiveFilters([])
    table.resetColumnFilters()
  }

  // Function to toggle a specific filter
  const toggleFilter = (filterName: string) => {
    if (activeFilters.includes(filterName)) {
      setActiveFilters(activeFilters.filter((f) => f !== filterName))
    } else {
      setActiveFilters([...activeFilters, filterName])
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search vouchers... (Ctrl+F)"
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
            disabled={exportLoading}
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
                // Show 5 skeleton rows while loading
                Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)
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
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
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
                          className="h-10 w-10 text-slate-300"
                        >
                          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                          <line x1="7" y1="2" x2="7" y2="22"></line>
                          <line x1="17" y1="2" x2="17" y2="22"></line>
                          <line x1="2" y1="12" x2="22" y2="12"></line>
                          <line x1="2" y1="7" x2="7" y2="7"></line>
                          <line x1="2" y1="17" x2="7" y2="17"></line>
                          <line x1="17" y1="17" x2="22" y2="17"></line>
                          <line x1="17" y1="7" x2="22" y2="7"></line>
                        </svg>
                        <p className="font-medium">No vouchers found</p>
                        <p className="text-sm text-slate-400">Try adjusting your filters or search terms</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-4">
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          {table.getFilteredSelectedRowModel().rows.length > 0 ? (
            <span className="font-medium">
              {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
              selected.
            </span>
          ) : (
            <span>
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length,
              )}{" "}
              of {table.getFilteredRowModel().rows.length} vouchers
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="transition-all duration-200 hover:bg-primary/10 disabled:opacity-50 h-9"
          >
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
              className="h-4 w-4 mr-1"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Previous
          </Button>
          <span className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="transition-all duration-200 hover:bg-primary/10 disabled:opacity-50 h-9"
          >
            Next
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
              className="h-4 w-4 ml-1"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SoldGsatVoucherTable
