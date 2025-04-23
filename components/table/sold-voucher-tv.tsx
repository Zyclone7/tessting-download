"use client"

import { useEffect, useState } from "react"
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
import { ChevronDown, Eye, EyeOff, MoreHorizontal, Download, Copy, Check } from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"
import { getTvVoucherByUserId } from "@/actions/tv-voucher"
import { useUserContext } from "@/hooks/use-user"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TvVoucher {
  tv_voucher_id: number
  voucher_code: string
  card_number: string
  product_name: string
  account: string | null
  amount: number
  discount: number | null
  status: string | null
  created_at: Date | null
  updated_at: Date | null
  owned_by: string | null
}

const SoldTvVoucherTable = () => {
  const [vouchers, setVouchers] = useState<TvVoucher[]>([])
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updated_at", desc: true }, // Default sorting by updated_at in descending order (newest first)
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Hide less important columns by default for better fit
    discount: false,
    created_at: false,
    // updated_at is now visible by default
  })
  const [rowSelection, setRowSelection] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useUserContext()

  // Function to determine column widths
  const getColumnWidth = (columnId: string) => {
    switch (columnId) {
      case "select":
        return "40px"
      case "voucher_code":
        return "120px"
      case "card_number":
        return "120px"
      case "product_name":
        return "140px"
      case "account":
        return "100px"
      case "amount":
        return "80px"
      case "discount":
        return "80px"
      case "status":
        return "80px"
      case "created_at":
        return "100px"
      case "updated_at":
        return "100px"
      case "actions":
        return "60px"
      default:
        return "auto"
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
        const response: any = await getTvVoucherByUserId(user.id.toString())

        if (response.success && response.data) {
          setVouchers(response.data)
        } else {
          setError(response.message || "Failed to fetch TV vouchers.")
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

  const columns: ColumnDef<TvVoucher>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
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
      accessorKey: "voucher_code",
      header: "Voucher Code",
      cell: ({ row }) => {
        const [isVisible, setIsVisible] = useState(false)
        const [isCopied, setIsCopied] = useState(false)
        const voucherCode = row.getValue("voucher_code") as string

        const handleCopy = () => {
          navigator.clipboard.writeText(voucherCode)
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        }

        return (
          <div className="flex items-center gap-1">
            <div className="font-mono">{isVisible ? voucherCode : "••••••••"}</div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsVisible(!isVisible)}
                className="text-gray-500 hover:text-gray-800 flex-shrink-0 rounded-full p-1 hover:bg-gray-100"
                title={isVisible ? "Hide code" : "Show code"}
              >
                {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleCopy}
                className={`text-gray-500 hover:text-gray-800 flex-shrink-0 rounded-full p-1 hover:bg-gray-100`}
                title="Copy to clipboard"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "card_number",
      header: "Card Number",
      cell: ({ row }) => {
        const [isVisible, setIsVisible] = useState(false)
        const [isCopied, setIsCopied] = useState(false)
        const cardNumber = row.getValue("card_number") as string


        const handleCopy = () => {
          navigator.clipboard.writeText(cardNumber)
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        }

        return (
          <div className="flex items-center gap-1">
            <div className="font-mono">{isVisible ? cardNumber : "••••••••"}</div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsVisible(!isVisible)}
                className="text-gray-500 hover:text-gray-800 flex-shrink-0 rounded-full p-1 hover:bg-gray-100"
                title={isVisible ? "Hide number" : "Show number"}
              >
                {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleCopy}
                className={`text-gray-500 hover:text-gray-800 flex-shrink-0 rounded-full p-1 hover:bg-gray-100`}
                title="Copy to clipboard"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )
      },
    },
    { accessorKey: "product_name", header: "Product Name" },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">₱ {(row.getValue("amount") as number).toFixed(2) || "0.00"}</div>
      ),
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }) => {
        const discount = row.getValue("discount")
        return <div className="text-right">{discount !== null ? `₱ ${discount}` : "N/A"}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return <Badge>{status || "Sold"}</Badge>
      },
    },
    {
      accessorKey: "created_at",
      header: "Created Date",
      cell: ({ row }) => {
        const date: any = row.getValue("created_at")
        return <div>{date ? new Date(date).toLocaleDateString() : "N/A"}</div>
      },
    },
    {
      accessorKey: "updated_at",
      header: "Purchase Date",
      cell: ({ row }) => {
        const date: any = row.getValue("updated_at")
        return <div>{date ? new Date(date).toLocaleString() : "N/A"}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const voucher = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(voucher.tv_voucher_id.toString())}>
                Copy Voucher ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View Details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

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
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      sorting: [{ id: "updated_at", desc: true }],
      pagination: {
        pageSize: 5,
      },
    },
  })

  const exportToCSV = () => {
    const headers = columns
      .filter((column) => column.id !== "select" && column.id !== "actions")
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
          .filter((column) => column.id !== "select" && column.id !== "actions")
          .map((column) => {
            let value: any
            if ("accessorKey" in column && column.accessorKey) {
              value = voucher[column.accessorKey as keyof TvVoucher]
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
      link.setAttribute("download", "tv_vouchers.csv")
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const SkeletonRow = () => (
    <TableRow>
      {columns.map((_, index) => (
        <TableCell key={index}>
          <Skeleton className="h-6 w-full" />
        </TableCell>
      ))}
    </TableRow>
  )

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <Input
          placeholder="Filter voucher codes..."
          value={(table.getColumn("voucher_code")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("voucher_code")?.setFilterValue(event.target.value)}
          className="max-w-sm w-full"
          autoComplete="off"
        />
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed border-collapse">
            <TableHeader className="bg-gray-50">
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap px-2"
                      style={{ width: getColumnWidth(header.id) }}
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
                  <TableRow className="hover:bg-gray-50" key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-2" style={{ width: getColumnWidth(cell.column.id) }}>
                        <div className="truncate">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-gray-50">
                  <TableCell colSpan={columns.length} className="text-center h-24">
                    {error ? <div className="text-red-500">{error}</div> : "No results."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
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
                {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
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
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronDown className="h-4 w-4 rotate-90" />
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
    </div>
  )
}

export default SoldTvVoucherTable

