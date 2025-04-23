"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CaretSortIcon, ChevronDownIcon, DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  IconColumns,
  IconUsersPlus,
  IconDownload,
  IconUsersGroup,
  IconHours24,
  IconTag as Tag,
  IconRefresh,
  IconChartBar,
  IconCurrencyDollar,
  IconBox,
  IconDeviceTv,
} from "@tabler/icons-react"
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
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Filter, CalendarIcon, Trash2, Sparkles, TagIcon, Percent } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { getAllTvVouchers, updateTvVoucher, deleteTvVoucher } from "@/actions/tv"
import { getTVProductPricing } from "@/actions/tv-pricing" // Import the pricing function
import { useToast } from "@/hooks/use-toast"
import TvCreation from "./tv-creation"
import { TvVoucherDialog } from "./tv-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Import the TVProductManagement component
import TVProductManagement from "./product-management"

export type Voucher = {
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
  // Add new fields for role-based pricing
  base_price?: number | null
  role_price?: number | null
  role_discount?: number | null
  role_discount_percentage?: number | null
  user_role?: string | null
  product?: {
    product_code: string
    base_price: number | null
    product_type: string
  }
}

interface Props {
  setViewVoucher: any
}

// Enhance the UI with better visual hierarchy and improved card designs
// Update the StatCardSkeleton component for better animation
function StatCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-2 border-muted/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-[100px]" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-[100px]" />
          <Skeleton className="h-4 w-[70px] mt-1" />
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TableRowSkeleton() {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
    >
      {Array.from({ length: 10 }).map((_, index) => (
        <TableCell key={index}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </motion.tr>
  )
}

// Define available roles and their display names
const AVAILABLE_ROLES = [
  { value: "Elite_Plus_Distributor_Package", label: "Elite Plus Distributor" },
  { value: "Elite_Distributor_Package", label: "Elite Distributor" },
  { value: "Basic_Merchant_Package", label: "Basic Merchant" },
  { value: "Premium_Merchant_Package", label: "Premium Merchant" },
]

// Helper function to get display name for a role
const getRoleDisplayName = (role: string): string => {
  const foundRole = AVAILABLE_ROLES.find((r) => r.value === role)
  return foundRole ? foundRole.label : role.replace(/_/g, " ")
}

export default function TVTable({ setViewVoucher }: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [voucherData, setVoucherData] = useState<Voucher[]>([])
  const [currentVoucher, setCurrentVoucher] = useState<Voucher | null>(null)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [globalFilter, setGlobalFilter] = useState("")
  const [productCodeFilter, setProductCodeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editedVoucher, setEditedVoucher] = useState<Partial<Voucher>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [isLoadingPricing, setIsLoadingPricing] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { toast } = useToast()
  const [unusedProductsData, setUnusedProductsData] = useState<
    {
      productName: string
      totalCount: number
      unusedCount: number
      percentage: number
      basePrice: number
    }[]
  >([])

  // Update the fetchData function in the useEffect to handle potential errors better
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const response = await getAllTvVouchers()
        console.log("Fetched data:", response)

        if (!response || !response.vouchers) {
          toast({
            title: "Error",
            description: "Failed to fetch voucher data. Please try again.",
            variant: "destructive",
          })
          setVoucherData([])
          setIsLoading(false)
          return
        }

        // Process vouchers to add pricing information
        const vouchersWithPricing: any = await Promise.all(
          response.vouchers.map(async (voucher) => {
            // For each voucher, fetch the pricing information based on product_name and owned_by
            if (voucher.owned_by && voucher.product_name) {
              try {
                const pricingInfo = await getTVProductPricing(String(voucher.owned_by), voucher.product_name)

                if (pricingInfo.success) {
                  return {
                    ...voucher,
                    base_price: pricingInfo.basePrice,
                    role_price: pricingInfo.discountedPrice,
                    role_discount: pricingInfo.basePrice! - pricingInfo.discountedPrice!,
                    role_discount_percentage: pricingInfo.discountPercentage,
                    user_role: pricingInfo.userRole,
                  }
                }
              } catch (error) {
                console.error("Error fetching pricing for voucher:", error)
              }
            }
            // Return the original voucher if pricing info couldn't be fetched
            return {
              ...voucher,
              base_price: null,
              role_price: null,
              role_discount: null,
              role_discount_percentage: null,
              user_role: null,
            }
          }),
        )

        setVoucherData(vouchersWithPricing)

        // Calculate unused products data
        setTimeout(() => calculateUnusedProducts(vouchersWithPricing), 0)
      } catch (error) {
        console.error("Error fetching TV vouchers:", error)
        toast({
          title: "Error",
          description: "Failed to fetch TV vouchers. Please try again.",
          variant: "destructive",
        })
        setVoucherData([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [refreshTrigger])

  const calculateUnusedProducts = (vouchers: Voucher[]) => {
    // Get all unique product names
    const uniqueProductNames = [...new Set(vouchers.map((v) => v.product_name))]

    // Calculate unused counts for each product
    const unusedData = uniqueProductNames.map((productName) => {
      const productVouchers = vouchers.filter((v) => v.product_name === productName)
      const totalCount = productVouchers.length
      // A voucher is considered unused if status is "active" or null
      const unusedCount = productVouchers.filter((v) => v.status === "active" || v.status === null).length
      const percentage = totalCount > 0 ? (unusedCount / totalCount) * 100 : 0

      // Get the base price from the first voucher of this product (assuming all vouchers of the same product have the same base price)
      const basePrice = productVouchers[0]?.base_price || productVouchers[0]?.amount || 0

      return {
        productName,
        totalCount,
        unusedCount,
        percentage,
        basePrice,
      }
    })

    // Sort by unused count (highest first)
    unusedData.sort((a, b) => b.unusedCount - a.unusedCount)

    setUnusedProductsData(unusedData)
  }

  const fuzzyFilter = (row: any, columnId: any, value: any) => {
    const itemValue = row.getValue(columnId)
    return typeof itemValue === "string" && itemValue.toLowerCase().includes(value.toLowerCase())
  }

  const handleRowClick = (voucher: Voucher) => {
    setCurrentVoucher(voucher)
    setIsEditing(false)
    setIsModalOpen(true)
  }

  const handleInputChange = useCallback((field: keyof Voucher, value: any) => {
    setEditedVoucher((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      if (currentVoucher) {
        const result = await updateTvVoucher(currentVoucher.tv_voucher_id, {
          ...editedVoucher,
          owned_by: editedVoucher.owned_by ? editedVoucher.owned_by.toString() : null,
        })

        // Check if the server action succeeded
        if (!result.success) {
          throw new Error(result.message)
        }

        // Only update state if successful
        setVoucherData((prev) =>
          prev.map((v) => (v.tv_voucher_id === currentVoucher.tv_voucher_id ? { ...v, ...editedVoucher } : v)),
        )
        setIsEditing(false)
        setIsModalOpen(false)

        // Refresh data to get updated pricing
        setRefreshTrigger((prev) => prev + 1)

        toast({
          title: "Success",
          description: "Voucher updated successfully",
        })
      }
    } catch (error) {
      console.error("Error updating voucher:", error)
      // Display error message to the user (e.g., using a toast or alert)
      toast({
        title: "Error",
        description: `Failed to update voucher: ${(error as Error).message}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = useCallback(
    async (id: number) => {
      setIsLoading(true)
      try {
        await deleteTvVoucher(id)
        // Remove the deleted voucher from the local state
        setVoucherData((prev) => prev.filter((voucher) => voucher.tv_voucher_id !== id))
        toast({
          title: "Success",
          description: "Voucher deleted successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete voucher",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
    toast({
      title: "Refreshing",
      description: "Updating voucher data and pricing information...",
    })
  }

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const columns: ColumnDef<Voucher>[] = [
    {
      accessorKey: "card_number",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Card Number
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("card_number")}</div>,
      filterFn: fuzzyFilter,
    },
    {
      accessorKey: "product_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Product Name
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("product_name")}</div>,
      filterFn: fuzzyFilter,
    },
    {
      accessorKey: "voucher_code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Product Code
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("voucher_code")}</div>,
      filterFn: fuzzyFilter,
    },
    {
      accessorFn: (row) => row.product?.base_price ?? null,
      id: "base_price", // important so sorting still works
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Base Price
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const voucher = row.original
        const purchasePrice = voucher.amount || null
        const basePrice = row.getValue("base_price") as number | null
        return (
          <div className="font-medium">
            {/* {basePrice !== null ? `₱${basePrice.toFixed(2)}` : "N/A"} */}
            {purchasePrice !== null ? `₱${purchasePrice.toFixed(2)}` : `₱${basePrice?.toFixed(2)}`}
          </div>
        )
      },
    },
    {
      accessorKey: "role_price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Role Price
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const rolePrice = row.getValue("role_price") as number | null
        const userRole = row.original.user_role

        return (
          <div className="font-medium">
            {rolePrice !== null && rolePrice !== undefined ? (
              <div className="flex flex-col">
                <span>₱{rolePrice.toFixed(2)}</span>
                {userRole && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-1 text-xs",
                      userRole === "Elite_Plus_Distributor_Package" && "bg-blue-100 text-blue-800",
                      userRole === "Elite_Distributor_Package" && "bg-indigo-100 text-indigo-800",
                      userRole === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                      userRole === "Premium_Merchant_Package" && "bg-purple-100 text-purple-800",
                    )}
                  >
                    {getRoleDisplayName(userRole)}
                  </Badge>
                )}
              </div>
            ) : (
              "N/A"
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "role_discount_percentage",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Discount
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const discountPercentage = row.getValue("role_discount_percentage") as number | null
        const roleDiscount = row.original.role_discount

        return (
          <div className="font-medium">
            {discountPercentage !== null &&
              discountPercentage !== undefined &&
              roleDiscount !== null &&
              roleDiscount !== undefined ? (
              <div className="flex flex-col">
                <span>₱{roleDiscount.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">({discountPercentage.toFixed(2)}%)</span>
              </div>
            ) : (
              "N/A"
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Status
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Badge
          className={cn(
            "mt-2",
            row.getValue("status") === "used" && "bg-green-500",
            row.getValue("status") === "expired" && "bg-red-500",
            (row.getValue("status") === "null" || row.getValue("status") === "active") && "bg-yellow-500",
          )}
        >
          {(row.getValue("status") as string) === "null"
            ? "Unused"
            : (row.getValue("status") as string).charAt(0).toUpperCase() + (row.getValue("status") as string).slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: () => <div className="text-right font-medium">Created at</div>,
      cell: ({ row }) => {
        const date: Date | null = row.getValue("created_at")
        return <div className="text-right font-medium">{date ? format(new Date(date), "MMM d, yyyy") : "N/A"}</div>
      },
    },
    {
      accessorKey: "owned_by",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Owned By
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("owned_by") || "N/A"}</div>,
      filterFn: fuzzyFilter,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const voucher = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(voucher.tv_voucher_id.toString())}>
                Copy Voucher ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleRowClick(voucher)}>View voucher details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: voucherData,
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
      globalFilter,
    },
  })

  const downloadCSV = () => {
    const csvContent = voucherData.map((voucher) => ({
      ...voucher,
      created_at: voucher.created_at ? new Date(voucher.created_at).toLocaleDateString() : "N/A",
      updated_at: voucher.updated_at ? new Date(voucher.updated_at).toLocaleDateString() : "N/A",
      base_price: voucher.base_price || "N/A",
      role_price: voucher.role_price || "N/A",
      role_discount: voucher.role_discount || "N/A",
      role_discount_percentage: voucher.role_discount_percentage
        ? `${voucher.role_discount_percentage.toFixed(2)}%`
        : "N/A",
      user_role: voucher.user_role ? getRoleDisplayName(voucher.user_role) : "N/A",
    }))

    const blob = new Blob([JSON.stringify(csvContent)], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "vouchers.csv")
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
  }

  // Animation variants for list items
  const listVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
      },
    }),
    exit: { opacity: 0, y: -20 },
  }

  // Calculate statistics for role-based pricing
  const totalVouchers = voucherData.length
  const vouchersWithRolePricing = voucherData.filter((v) => v.role_price !== null && v.role_price !== undefined).length
  const totalBasePrice = voucherData.reduce((sum, v) => sum + (v.base_price || 0), 0)
  const totalRolePrice = voucherData.reduce((sum, v) => sum + (v.amount || 0), 0)
  const totalDiscount = voucherData.reduce((sum, v) => sum + (v.role_discount || 0), 0)
  const averageDiscountPercentage =
    vouchersWithRolePricing > 0
      ? voucherData.reduce((sum, v) => sum + (v.role_discount_percentage || 0), 0) / vouchersWithRolePricing
      : 0

  // Calculate total unused vouchers (status is "active" or null)
  const unusedVouchers = voucherData.filter((v) => v.status === "active" || v.status === null).length

  return (
    <Tabs defaultValue="vouchers" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="vouchers">TV Vouchers</TabsTrigger>
        <TabsTrigger value="products">Product Management</TabsTrigger>
        <TabsTrigger value="unused">Unused Products</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="vouchers">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          animate="visible"
        >
          {isLoading ? (
            <>
              {Array.from({ length: 5 }).map((_, index) => (
                <StatCardSkeleton key={index} />
              ))}
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-2 border-primary/10 hover:border-primary/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    <IconCurrencyDollar className="stroke-primary h-5 w-5" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      ₱
                      {totalRolePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From {voucherData.reduce((total: number, voucher) => {
                        // Only increment total if voucher status is "active"
                        if (voucher.status === "active") {
                          return total + 1;
                        }
                        return total;
                      }, 0)} vouchers
                    </p>

                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total TV Vouchers</CardTitle>
                    <IconUsersGroup className="stroke-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div />
                  </CardContent>
                  <CardContent>
                    <div className="text-3xl font-bold">{voucherData.length}</div>
                    <p className="text-xs text-muted-foreground">All vouchers</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Used</CardTitle>
                    <IconHours24 className="stroke-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {voucherData.filter((voucher) => voucher.status === "used").length}
                    </div>
                    <p className="text-xs text-muted-foreground">Used vouchers</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Unused</CardTitle>
                    <IconHours24 className="stroke-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{unusedVouchers}</div>
                    <p className="text-xs text-muted-foreground">Unused vouchers</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Role Pricing</CardTitle>
                    <TagIcon className="stroke-muted-foreground h-5 w-5" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{vouchersWithRolePricing}</div>
                    <p className="text-xs text-muted-foreground">Vouchers with role pricing</p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Advanced Search Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 mt-4"
        >
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Advanced Search</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search-card" className="text-xs">
                    Card Number
                  </Label>
                  <Input
                    id="search-card"
                    placeholder="Search by card number..."
                    className="mt-1"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="search-product" className="text-xs">
                    Product Name
                  </Label>
                  <Input id="search-product" placeholder="Search by product name..." className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="role-filter" className="text-xs">
                    User Role
                  </Label>
                  <Select
                    value={roleFilter}
                    onValueChange={(value) => {
                      setRoleFilter(value)
                      setColumnFilters((prev) => [
                        ...prev.filter((filter) => filter.id !== "user_role"),
                        ...(value !== "all" ? [{ id: "user_role", value }] : []),
                      ])
                    }}
                  >
                    <SelectTrigger id="role-filter" className="mt-1">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {AVAILABLE_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="mr-2"
                  onClick={() => {
                    setGlobalFilter("")
                    setRoleFilter("all")
                    setColumnFilters([])
                  }}
                >
                  Clear
                </Button>
                <Button size="sm">
                  <Filter className="mr-2 h-3 w-3" />
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center py-4"
        >
          <Input
            placeholder="Quick filter vouchers..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <div className="flex-grow"></div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="ml-2" onClick={refreshData}>
                  <IconRefresh className="mr-2 h-4 w-4" />
                  Refresh Data
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh voucher data and pricing</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="ml-2 border-primary/20 hover:border-primary/50">
                <Filter className="mr-2 h-4 w-4 text-primary" />
                Advanced Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Product Code</h4>
                  <Select
                    value={productCodeFilter}
                    onValueChange={(value) => {
                      setProductCodeFilter(value)
                      setColumnFilters((prev) => [
                        ...prev.filter((filter) => filter.id !== "product_code"),
                        ...(value !== "all" ? [{ id: "product_code", value }] : []),
                      ])
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="tv99">TV99</SelectItem>
                      <SelectItem value="tv200">TV200</SelectItem>
                      <SelectItem value="tv300">TV300</SelectItem>
                      <SelectItem value="tv500">TV500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Status</h4>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value)
                      setColumnFilters((prev) => [
                        ...prev.filter((filter) => filter.id !== "status"),
                        ...(value !== "all" ? [{ id: "status", value }] : []),
                      ])
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                      <SelectItem value="null">Unused</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Date Range</h4>
                  <div className="flex space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="ml-2">
                <IconUsersPlus className="mr-2 h-4 w-4" />
                Add Voucher
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-none max-h-[calc(80vh)] overflow-scroll">
              <DialogTitle>Create TV Voucher</DialogTitle>
              <TvCreation />
            </DialogContent>
          </Dialog>
          <Button className="ml-2" variant="outline" onClick={downloadCSV}>
            <IconDownload className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="ml-2" variant="outline">
                <IconColumns className="mr-2 h-4 w-4" />
                Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
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
        </motion.div>

        {/* Batch Operations Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Batch Operations</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <IconUsersGroup className="mr-2 h-4 w-4" />
                  Select All
                </Button>
                <Button variant="outline" size="sm">
                  <Tag className="mr-2 h-4 w-4" />
                  Update Status
                </Button>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Set Expiry Date
                </Button>
                <Button variant="outline" size="sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Apply Role Pricing
                </Button>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-md border h-[calc(100vh-28rem)] overflow-auto no-scrollbar"
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-center">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, index) => <TableRowSkeleton key={index} />)
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      variants={listVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={index}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-primary/5",
                        "data-[state=selected]:bg-muted relative overflow-hidden",
                        "group border-b border-muted/20",
                      )}
                      onClick={() => handleRowClick(row.original)}
                      whileHover={{ scale: 1.005 }}
                      transition={{ duration: 0.2 }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="text-center group-hover:text-primary transition-colors py-4"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-end space-x-2 py-4"
        >
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
            selected.
          </div>
          <div className="space-x-2 flex flex-row items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={!table.getCanPreviousPage() ? "opacity-50" : "hover:bg-primary/10"}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={!table.getCanNextPage() ? "opacity-50" : "hover:bg-primary/10"}
            >
              Next
            </Button>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px] border-primary/20">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <TvVoucherDialog
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          voucher={currentVoucher}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editedVoucher={editedVoucher}
          onSave={handleSave}
          onInputChange={handleInputChange}
          isSaving={isSaving}
          onDelete={(tv_voucher_id: number) => handleDelete(tv_voucher_id)}
        />
      </TabsContent>

      <TabsContent value="products">
        <TVProductManagement />
      </TabsContent>

      <TabsContent value="unused">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Unused Products</CardTitle>
                <IconDeviceTv className="stroke-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {unusedProductsData.reduce((sum, item) => sum + item.unusedCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Across all product types</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unused Inventory Value</CardTitle>
                <IconCurrencyDollar className="stroke-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ₱
                  {unusedProductsData
                    .reduce((sum, item) => sum + item.unusedCount * item.basePrice, 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Total value of unused products</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Product Types</CardTitle>
                <IconBox className="stroke-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{unusedProductsData.length}</div>
                <p className="text-xs text-muted-foreground">Different product types</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
                <Percent className="stroke-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {totalVouchers > 0 ? (((totalVouchers - unusedVouchers) / totalVouchers) * 100).toFixed(1) : "0"}%
                </div>
                <p className="text-xs text-muted-foreground">Overall product utilization</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Skeleton className="h-16 w-full rounded-md mb-3" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : unusedProductsData.length > 0 ? (
              unusedProductsData.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Card
                    className={cn(
                      "overflow-hidden transition-all duration-200 hover:shadow-md",
                      item.unusedCount === 0 && "opacity-60",
                      item.unusedCount > 10 && "border-yellow-300",
                      item.unusedCount > 20 && "border-orange-400",
                      item.unusedCount > 30 && "border-red-500 border-2",
                    )}
                  >
                    <CardHeader className="p-4 pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-bold">{item.productName}</CardTitle>
                          <CardDescription>Base Price: ₱{item.basePrice.toFixed(2)}</CardDescription>
                        </div>
                        <Badge
                          variant={item.unusedCount > 0 ? "default" : "outline"}
                          className={cn(
                            "ml-2",
                            item.unusedCount === 0 && "bg-green-100 text-green-800",
                            item.unusedCount > 0 && item.unusedCount <= 10 && "bg-blue-100 text-blue-800",
                            item.unusedCount > 10 && item.unusedCount <= 20 && "bg-yellow-100 text-yellow-800",
                            item.unusedCount > 20 && "bg-red-100 text-red-800",
                          )}
                        >
                          {item.unusedCount} Unused
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="mt-2 space-y-3">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                          <div
                            className={cn(
                              "h-2.5 rounded-full",
                              item.percentage < 30
                                ? "bg-green-500"
                                : item.percentage < 70
                                  ? "bg-yellow-500"
                                  : "bg-red-500",
                            )}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>
                            {item.unusedCount} of {item.totalCount} unused
                          </span>
                          <span>{item.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="pt-2 flex justify-between items-center">
                          <div className="text-sm">
                            <span className="font-medium">Value: </span>
                            <span className="font-bold text-primary">
                              ₱{(item.unusedCount * item.basePrice).toFixed(2)}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Filter vouchers to show only unused ones for this product
                              const filteredData = voucherData.filter(
                                (v) =>
                                  v.product_name === item.productName && (v.status === "active" || v.status === null),
                              )
                              setColumnFilters([
                                { id: "product_name", value: item.productName },
                                { id: "status", value: "active" },
                              ])
                              toast({
                                title: "Filtered Vouchers",
                                description: `Showing ${filteredData.length} unused ${item.productName} vouchers`,
                              })
                              // Switch to vouchers tab
                              document.querySelector('[value="vouchers"]' as any)?.click()
                            }}
                          >
                            View Vouchers
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full flex justify-center items-center h-40">
                <div className="text-center">
                  <p className="text-muted-foreground">No unused products found</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={refreshData}>
                    <IconRefresh className="mr-2 h-4 w-4" />
                    Refresh Data
                  </Button>
                </div>
              </div>
            )}
          </div>

          {unusedProductsData.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Unused Products Summary</CardTitle>
                <CardDescription>Overview of your unused product inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Status Distribution</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs">
                          <span>Fully Used</span>
                          <span>{unusedProductsData.filter((item) => item.unusedCount === 0).length} products</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${(unusedProductsData.filter((item) => item.unusedCount === 0).length / unusedProductsData.length) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs">
                          <span>Partially Used</span>
                          <span>
                            {
                              unusedProductsData.filter(
                                (item) => item.unusedCount > 0 && item.unusedCount < item.totalCount,
                              ).length
                            }{" "}
                            products
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{
                              width: `${(unusedProductsData.filter((item) => item.unusedCount > 0 && item.unusedCount < item.totalCount).length / unusedProductsData.length) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs">
                          <span>Fully Unused</span>
                          <span>
                            {
                              unusedProductsData.filter(
                                (item) => item.unusedCount === item.totalCount && item.totalCount > 0,
                              ).length
                            }{" "}
                            products
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{
                              width: `${(unusedProductsData.filter((item) => item.unusedCount === item.totalCount && item.totalCount > 0).length / unusedProductsData.length) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Top Unused Products</h4>
                    <div className="space-y-2">
                      {unusedProductsData
                        .sort((a, b) => b.unusedCount - a.unusedCount)
                        .slice(0, 3)
                        .map((item, index) => (
                          <div key={index}>
                            <div className="flex justify-between text-xs">
                              <span>{item.productName}</span>
                              <span>{item.unusedCount} unused</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${(item.unusedCount / unusedProductsData.reduce((max, i) => Math.max(max, i.unusedCount), 0)) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Highest Value Unused</h4>
                    <div className="space-y-2">
                      {unusedProductsData
                        .sort((a, b) => b.unusedCount * b.basePrice - a.unusedCount * a.basePrice)
                        .slice(0, 3)
                        .map((item, index) => (
                          <div key={index}>
                            <div className="flex justify-between text-xs">
                              <span>{item.productName}</span>
                              <span>₱{(item.unusedCount * item.basePrice).toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{
                                  width: `${((item.unusedCount * item.basePrice) / unusedProductsData.reduce((max, i) => Math.max(max, i.unusedCount * i.basePrice), 0)) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Actions</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          // Filter vouchers to show only unused ones
                          setColumnFilters([{ id: "status", value: "active" }])
                          toast({
                            title: "Filtered Vouchers",
                            description: `Showing all unused vouchers`,
                          })
                          // Switch to vouchers tab
                          document.querySelector('[value="vouchers"]' as any)?.click()
                        }}
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        View All Unused
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          // Filter vouchers to show only those with high value
                          const highValueProducts = unusedProductsData
                            .filter((item) => item.unusedCount * item.basePrice > 1000)
                            .map((item) => item.productName)

                          if (highValueProducts.length > 0) {
                            setColumnFilters([
                              { id: "product_name", value: highValueProducts[0] },
                              { id: "status", value: "active" },
                            ])
                            toast({
                              title: "Filtered Vouchers",
                              description: `Showing high-value unused vouchers`,
                            })
                            // Switch to vouchers tab
                            document.querySelector('[value="vouchers"]' as any)?.click()
                          } else {
                            toast({
                              title: "No high-value products",
                              description: "No products with value over ₱1,000 found",
                              variant: "destructive",
                            })
                          }
                        }}
                      >
                        <IconCurrencyDollar className="mr-2 h-4 w-4" />
                        High Value Only
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start" onClick={refreshData}>
                        <IconRefresh className="mr-2 h-4 w-4" />
                        Refresh Data
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </TabsContent>

      <TabsContent value="analytics">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>TV Voucher Analytics</CardTitle>
              <CardDescription>Insights and trends for your TV voucher management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Status Distribution</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Used</span>
                        <span>{voucherData.filter((v) => v.status === "used").length} vouchers</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full"
                          style={{
                            width: `${(voucherData.filter((v) => v.status === "used").length / voucherData.length) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Unused</span>
                        <span>
                          {voucherData.filter((v) => v.status === "null" || v.status === "active").length} vouchers
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-yellow-500 h-2.5 rounded-full"
                          style={{
                            width: `${(voucherData.filter((v) => v.status === "null" || v.status === "active").length / voucherData.length) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Expired</span>
                        <span>{voucherData.filter((v) => v.status === "expired").length} vouchers</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-red-500 h-2.5 rounded-full"
                          style={{
                            width: `${(voucherData.filter((v) => v.status === "expired").length / voucherData.length) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Role-Based Pricing Impact</h3>
                  <div className="space-y-4">
                    {AVAILABLE_ROLES.map((role) => {
                      const roleVouchers = voucherData.filter((v) => v.user_role === role.value)
                      const rolePercentage =
                        voucherData.length > 0 ? (roleVouchers.length / voucherData.length) * 100 : 0

                      return (
                        <div key={role.value}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{role.label}</span>
                            <span>{roleVouchers.length} vouchers</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div
                              className={cn(
                                "h-2.5 rounded-full",
                                role.value === "Elite_Plus_Distributor_Package" && "bg-blue-500",
                                role.value === "Elite_Distributor_Package" && "bg-indigo-500",
                                role.value === "Basic_Merchant_Package" && "bg-green-500",
                                role.value === "Premium_Merchant_Package" && "bg-purple-500",
                              )}
                              style={{ width: `${rolePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Pricing Comparison by Role</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Role</th>
                        <th className="text-right py-2 px-4">Avg. Base Price</th>
                        <th className="text-right py-2 px-4">Avg. Role Price</th>
                        <th className="text-right py-2 px-4">Avg. Discount</th>
                        <th className="text-right py-2 px-4">Discount %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {AVAILABLE_ROLES.map((role) => {
                        const roleVouchers = voucherData.filter((v) => v.user_role === role.value)
                        const avgBasePrice =
                          roleVouchers.length > 0
                            ? roleVouchers.reduce((sum, v) => sum + (v.base_price || 0), 0) / roleVouchers.length
                            : 0
                        const avgRolePrice =
                          roleVouchers.length > 0
                            ? roleVouchers.reduce((sum, v) => sum + (v.role_price || 0), 0) / roleVouchers.length
                            : 0
                        const avgDiscount =
                          roleVouchers.length > 0
                            ? roleVouchers.reduce((sum, v) => sum + (v.role_discount || 0), 0) / roleVouchers.length
                            : 0
                        const avgDiscountPercentage =
                          roleVouchers.length > 0
                            ? roleVouchers.reduce((sum, v) => sum + (v.role_discount_percentage || 0), 0) /
                            roleVouchers.length
                            : 0

                        return (
                          <tr key={role.value} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-4">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-medium",
                                  role.value === "Elite_Plus_Distributor_Package" && "bg-blue-100 text-blue-800",
                                  role.value === "Elite_Distributor_Package" && "bg-indigo-100 text-indigo-800",
                                  role.value === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                                  role.value === "Premium_Merchant_Package" && "bg-purple-100 text-purple-800",
                                )}
                              >
                                {role.label}
                              </Badge>
                            </td>
                            <td className="text-right py-2 px-4">₱{avgBasePrice.toFixed(2)}</td>
                            <td className="text-right py-2 px-4">₱{avgRolePrice.toFixed(2)}</td>
                            <td className="text-right py-2 px-4">₱{avgDiscount.toFixed(2)}</td>
                            <td className="text-right py-2 px-4">{avgDiscountPercentage.toFixed(2)}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Compare performance across different TV products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["TV99", "TV200", "TV300"].map((productName, i) => {
                  const productVouchers = voucherData.filter((v) => v.product_name === productName)
                  const usedVouchers = productVouchers.filter((v) => v.status === "used")
                  const totalRevenue = usedVouchers.reduce((sum, v) => sum + (v.role_price || v.amount || 0), 0)
                  const totalDiscount = productVouchers.reduce((sum, v) => sum + (v.role_discount || 0), 0)

                  return (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{productName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Vouchers:</span>
                          <span className="font-medium">{productVouchers.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Used Vouchers:</span>
                          <span className="font-medium">{usedVouchers.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Revenue:</span>
                          <span className="font-medium">₱{totalRevenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Discount:</span>
                          <span className="font-medium">₱{totalDiscount.toFixed(2)}</span>
                        </div>
                        <div className="pt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${productVouchers.length > 0 ? (usedVouchers.length / productVouchers.length) * 100 : 0}%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span>Usage Rate</span>
                            <span>
                              {productVouchers.length > 0
                                ? ((usedVouchers.length / productVouchers.length) * 100).toFixed(1)
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" className="w-full">
                          <IconChartBar className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>
    </Tabs>
  )
}
