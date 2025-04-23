"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CaretSortIcon, ChevronDownIcon, DotsHorizontalIcon } from "@radix-ui/react-icons"
import {
  IconColumns,
  IconUsersPlus,
  IconUserUp,
  IconFileTypeCsv,
  IconDownload,
  IconUsersGroup,
  IconHours24,
  IconDoorExit,
  IconCurrencyDollar,
  IconDiscount,
  IconTag as Tag,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import GsatCreation from "./gsat-creation"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Edit, Trash2, Save, X, Filter, CalendarIcon, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getAllGsatVouchers, updateGsatVoucher, deleteGsatVoucher, deleteBulkGsatVouchers } from "@/actions/gsat"
import { getAllGSATProducts } from "@/actions/gsat"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProductManagement from "./product-management"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

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

export type Voucher = {
  gsat_voucher_id: number
  serial_number: string | null
  reference_number: string | null
  amount: number | null
  discount: number | null
  product_code: string
  status: string | null
  expiry_date: Date | null
  used_date: Date | null
  created_at: Date | null
  updated_at: Date | null
  owned_by: string | null
  owner_role: string | null
}

type Product = {
  product_code: string
  base_price: number | null
  pt_product_role_prices: {
    product_code: string
    role: string
    discounted_price: number | null
  }[]
}

interface Props {
  setViewVoucher: any
}

function StatCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-[100px]" />
          </CardTitle>
          <Skeleton className="h-4 w-4 rounded-full" />
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

export default function EnhancedGsatTable({ setViewVoucher }: Props) {
  ; <style jsx global>{`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-in-out;
  }

  .whitespace-nowrap {
    white-space: nowrap;
  }
`}</style>
  const [isLoading, setIsLoading] = useState(true)
  const [voucherData, setVoucherData] = useState<Voucher[]>([])
  const [originalVoucherData, setOriginalVoucherData] = useState<Voucher[]>([])
  const [products, setProducts] = useState<Product[]>([])
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
  const [activeTab, setActiveTab] = useState("vouchers")
  const [editedVoucher, setEditedVoucher] = useState<Partial<Voucher>>({})
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [unusedProductsData, setUnusedProductsData] = useState<
    {
      productCode: string
      totalCount: number
      unusedCount: number
      percentage: number
      basePrice: number | null
    }[]
  >([])

  // Add loading states for CRUD operations
  const [isUpdatingVoucher, setIsUpdatingVoucher] = useState(false)
  const [isDeletingVoucher, setIsDeletingVoucher] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const [currentlyDeletingVoucher, setCurrentlyDeletingVoucher] = useState<Voucher | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const [voucherResponse, productResponse]: any = await Promise.all([getAllGsatVouchers(), getAllGSATProducts()])
        setVoucherData(voucherResponse.vouchers)
        console.log("Fetched Vouchers:", voucherResponse.vouchers)
        setOriginalVoucherData(voucherResponse.vouchers)
        setProducts(productResponse.products)

        // Calculate unused products data
        setTimeout(() => calculateUnusedProducts(), 0)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [refreshTrigger])

  const fuzzyFilter = (row: any, columnId: any, value: any) => {
    const itemValue = row.getValue(columnId)
    return typeof itemValue === "string" && itemValue.toLowerCase().includes(value.toLowerCase())
  }

  const handleRowClick = (voucher: Voucher) => {
    // Get the product details to update the voucher with correct pricing
    const product = getProductDetails(voucher.product_code)
    if (product) {
      // Find role price based on the user role (if available)
      const userRole = getUserRole(voucher.owned_by)
      const rolePrice = product.pt_product_role_prices.find((rp) => rp.role === userRole)

      // Update voucher with pricing from product tables
      const basePrice = product.base_price || 0
      const discountedPrice = rolePrice?.discounted_price || basePrice
      const discount = basePrice - discountedPrice

      // Create updated voucher with pricing from product tables
      const updatedVoucher = {
        ...voucher,
        amount: discountedPrice,
        discount: discount,
      }

      setCurrentVoucher(updatedVoucher)
    } else {
      setCurrentVoucher(voucher)
    }

    setEditedVoucher({})
    setIsEditing(false)
    setIsModalOpen(true)
  }

  // Helper function to determine user role based on owned_by field
  // This is a placeholder - you would implement your actual logic here
  const getUserRole = (ownedBy: string | null): string | null => {
    // For demonstration purposes, we'll return a random role
    // In a real application, you would determine this based on user data
    if (!ownedBy) return null

    // Simple hash function to consistently return the same role for the same user
    const hash = ownedBy.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const roleIndex = hash % AVAILABLE_ROLES.length
    return AVAILABLE_ROLES[roleIndex].value
  }

  // Update handleSaveVoucher to include loading state
  const handleSaveVoucher = async () => {
    if (!currentVoucher) return

    try {
      setIsUpdatingVoucher(true)
      // If product code is being changed, update pricing based on product tables
      if (editedVoucher.product_code && editedVoucher.product_code !== currentVoucher.product_code) {
        const product = getProductDetails(editedVoucher.product_code)
        if (product) {
          const userRole = getUserRole(currentVoucher.owned_by)
          const rolePrice = product.pt_product_role_prices.find((rp) => rp.role === userRole)

          const basePrice = product.base_price || 0
          const discountedPrice = rolePrice?.discounted_price || basePrice
          const discount = basePrice - discountedPrice

          // Update edited voucher with pricing from product tables
          editedVoucher.amount = discountedPrice
          editedVoucher.discount = discount
        }
      }

      const transformedVoucher = {
        ...editedVoucher,
        owned_by: editedVoucher.owned_by
          ? { set: Number.parseInt(editedVoucher.owned_by as string, 10) }
          : editedVoucher.owned_by,
      }
      const transformedOwnedBy =
        typeof transformedVoucher.owned_by === "string"
          ? Number.parseInt(transformedVoucher.owned_by, 10)
          : transformedVoucher.owned_by

      const result = await updateGsatVoucher(currentVoucher.gsat_voucher_id, {
        ...transformedVoucher,
        owned_by: transformedOwnedBy,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Voucher updated successfully",
        })

        // Update the current voucher with edited values
        setCurrentVoucher({
          ...currentVoucher,
          ...editedVoucher,
        })

        // Update the voucher in the table data
        setVoucherData((prev) =>
          prev.map((v) => (v.gsat_voucher_id === currentVoucher.gsat_voucher_id ? { ...v, ...editedVoucher } : v)),
        )

        // Also update in original data
        setOriginalVoucherData((prev) =>
          prev.map((v) => (v.gsat_voucher_id === currentVoucher.gsat_voucher_id ? { ...v, ...editedVoucher } : v)),
        )

        setIsEditing(false)
        setEditedVoucher({})
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update voucher",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating voucher:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingVoucher(false)
    }
  }

  // Update handleDeleteVoucher to include loading state
  const handleDeleteVoucher = (voucher: Voucher) => {
    setCurrentVoucher(voucher)
    setIsSingleDeleteDialogOpen(true)
  }

  const confirmDeleteVoucher = async () => {
    if (!currentVoucher) return

    setIsDeletingVoucher(true)
    try {
      const result = await deleteBulkGsatVouchers([currentVoucher.gsat_voucher_id])
      if (result.success) {
        setVoucherData((prev) => prev.filter((v) => v.gsat_voucher_id !== currentVoucher.gsat_voucher_id))
        toast({ title: "Success", description: "Voucher deleted successfully" })
      } else {
        toast({ title: "Error", description: "Failed to delete voucher", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setIsDeletingVoucher(false)
      setIsSingleDeleteDialogOpen(false)
      setCurrentVoucher(null)
    }
  }

  const getProductDetails = (productCode: string) => {
    return products.find((p) => p.product_code === productCode)
  }

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const calculateUnusedProducts = () => {
    // Get all unique product codes
    const uniqueProductCodes = [...new Set(voucherData.map((v) => v.product_code))]

    // Calculate unused counts for each product
    const unusedData = uniqueProductCodes.map((productCode) => {
      const totalCount = voucherData.filter((v) => v.product_code === productCode).length
      const unusedCount = voucherData.filter((v) => v.product_code === productCode && v.status === "null").length
      const percentage = totalCount > 0 ? (unusedCount / totalCount) * 100 : 0

      return {
        productCode,
        totalCount,
        unusedCount,
        percentage,
        basePrice: getProductDetails(productCode)?.base_price || 0,
      }
    })

    // Sort by unused count (highest first)
    unusedData.sort((a, b) => b.unusedCount - a.unusedCount)

    setUnusedProductsData(unusedData)
  }

  // Add state for advanced search
  const [advancedSearch, setAdvancedSearch] = useState({
    serialNumber: "",
    referenceNumber: "",
    ownedBy: "",
  })

  // Add the applyAdvancedSearch function after the refreshData function
  const applyAdvancedSearch = () => {
    if (!advancedSearch.serialNumber && !advancedSearch.referenceNumber && !advancedSearch.ownedBy) {
      setVoucherData(originalVoucherData);
      toast({ title: "Search Cleared", description: "Showing all vouchers" });
      setSelectedVouchers([]);
      setRowSelection({});
      return;
    }

    const filteredData = originalVoucherData.filter((voucher) => {
      const matchesSerial = !advancedSearch.serialNumber ||
        voucher.serial_number?.toLowerCase().includes(advancedSearch.serialNumber.toLowerCase());
      const matchesReference = !advancedSearch.referenceNumber ||
        voucher.reference_number?.toLowerCase().includes(advancedSearch.referenceNumber.toLowerCase());
      const matchesOwner = !advancedSearch.ownedBy ||
        voucher.owned_by?.toLowerCase().includes(advancedSearch.ownedBy.toLowerCase());
      return matchesSerial && matchesReference && matchesOwner;
    });

    setVoucherData(filteredData);
    setSelectedVouchers([]);
    setRowSelection({});
    toast({ title: "Search Applied", description: `Found ${filteredData.length} matching vouchers` });
  };

  // Add state for batch operations
  const [selectedVouchers, setSelectedVouchers] = useState<number[]>([])
  const [isBatchUpdating, setIsBatchUpdating] = useState(false)
  const [batchStatusOpen, setBatchStatusOpen] = useState(false)
  const [batchExpiryOpen, setBatchExpiryOpen] = useState(false)
  const [batchStatus, setBatchStatus] = useState<string | null>(null)
  const [batchExpiryDate, setBatchExpiryDate] = useState<Date | undefined>(undefined)
  const [isSingleDeleteDialogOpen, setIsSingleDeleteDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  // Add batch operation functions
  const selectAllVouchers = () => {
    const filteredRows = table.getFilteredRowModel().rows;
    const allSelected = selectedVouchers.length === filteredRows.length;

    if (allSelected) {
      // Deselect all if already fully selected
      setSelectedVouchers([]);
      table.toggleAllRowsSelected(false);
    } else {
      // Select all visible rows
      const allIds = filteredRows.map((row) => row.original.gsat_voucher_id);
      setSelectedVouchers(allIds);
      table.toggleAllRowsSelected(true);
    }
  };

  const updateBatchStatus = async () => {
    if (!batchStatus || selectedVouchers.length === 0) return

    setIsBatchUpdating(true)
    try {
      // In a real implementation, you would call a server action here
      // For now, we'll just update the local state
      const updatedVouchers = voucherData.map((voucher) => {
        if (selectedVouchers.includes(voucher.gsat_voucher_id)) {
          return { ...voucher, status: batchStatus }
        }
        return voucher
      })

      setVoucherData(updatedVouchers)

      // Also update original data
      setOriginalVoucherData((prev) =>
        prev.map((voucher) => {
          if (selectedVouchers.includes(voucher.gsat_voucher_id)) {
            return { ...voucher, status: batchStatus }
          }
          return voucher
        }),
      )

      toast({
        title: "Success",
        description: `Updated status for ${selectedVouchers.length} vouchers`,
      })

      // Reset selection
      setSelectedVouchers([])
      setRowSelection({})
      setBatchStatusOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vouchers",
        variant: "destructive",
      })
    } finally {
      setIsBatchUpdating(false)
    }
  }

  const updateBatchExpiryDate = async () => {
    if (!batchExpiryDate || selectedVouchers.length === 0) return

    setIsBatchUpdating(true)
    try {
      // In a real implementation, you would call a server action here
      // For now, we'll just update the local state
      const updatedVouchers = voucherData.map((voucher) => {
        if (selectedVouchers.includes(voucher.gsat_voucher_id)) {
          return { ...voucher, expiry_date: batchExpiryDate }
        }
        return voucher
      })

      setVoucherData(updatedVouchers)

      // Also update original data
      setOriginalVoucherData((prev) =>
        prev.map((voucher) => {
          if (selectedVouchers.includes(voucher.gsat_voucher_id)) {
            return { ...voucher, expiry_date: batchExpiryDate }
          }
          return voucher
        }),
      )

      toast({
        title: "Success",
        description: `Updated expiry date for ${selectedVouchers.length} vouchers`,
      })

      // Reset selection
      setSelectedVouchers([])
      setRowSelection({})
      setBatchExpiryOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vouchers",
        variant: "destructive",
      })
    } finally {
      setIsBatchUpdating(false)
    }
  }

  // Update the deleteBatchVouchers function to deselect after deletion and add a confirmation toast
  const deleteBatchVouchers = () => {
    if (selectedVouchers.length > 0) {
      setIsBulkDeleteDialogOpen(true)
    }
  }

  const confirmBulkDeleteVouchers = async () => {
    setIsBatchUpdating(true); // Start the loader
    try {
      const result = await deleteBulkGsatVouchers(selectedVouchers);
      console.log("Delete result:", result); // Debug the result
      if (result.success) {
        // Update the voucher data by removing deleted vouchers
        setVoucherData((prev) =>
          prev.filter((v) => !selectedVouchers.includes(v.gsat_voucher_id))
        );
        // Reset the selected vouchers state
        setSelectedVouchers([]);
        // Deselect all rows in the table
        table.toggleAllRowsSelected(false);
        // Reset the row selection state (if using a rowSelection object)
        setRowSelection({});
        // Notify the user of success
        toast({
          title: "Success",
          description: `Deleted ${selectedVouchers.length} vouchers`,
        });
      } else {
        // Show an error if the deletion failed
        toast({
          title: "Error",
          description: result.message || "Failed to delete vouchers",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in batch delete:", error); // Debug any errors
      toast({
        title: "Error",
        description: "Failed to complete batch deletion",
        variant: "destructive",
      });
    } finally {
      setIsBatchUpdating(false); // Stop the loader
      setIsBulkDeleteDialogOpen(false); // Close the dialog
    }
  };


  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const columns: ColumnDef<Voucher>[] = [
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
          onCheckedChange={(value) => {
            row.toggleSelected(!!value)
            const voucherId = row.original.gsat_voucher_id
            if (value) {
              setSelectedVouchers((prev) => [...prev, voucherId])
            } else {
              setSelectedVouchers((prev) => prev.filter((id) => id !== voucherId))
            }
          }}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "serial_number",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Serial Number
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium whitespace-nowrap">{row.getValue("serial_number")}</div>,
      filterFn: fuzzyFilter,
    },
    {
      accessorKey: "reference_number",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Reference Number
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium whitespace-nowrap">{row.getValue("reference_number")}</div>,
      filterFn: fuzzyFilter,
    },
    {
      accessorKey: "product_code",
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
      cell: ({ row }) => {
        const productCode = row.getValue("product_code") as string
        const product = getProductDetails(productCode)

        return (
          <div className="font-medium flex flex-col whitespace-nowrap">
            <span>{productCode}</span>
            {product && (
              <span className="text-xs text-muted-foreground">Base: ₱{product.base_price?.toFixed(2) || "0.00"}</span>
            )}
          </div>
        )
      },
      filterFn: fuzzyFilter,
    },
    {
      accessorFn: (row) => `${row.owned_by} (${row.owner_role})`, // ✅ Correct way to combine fields
      id: "owned_by_user_role", // Unique identifier for this column
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Owned By
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const ownedBy = row.original.owned_by as string | null
        const ownerRole = row.original.owner_role as string | null
        const userRole = getUserRole(ownerRole)

        return (
          <div className="font-medium flex flex-col whitespace-nowrap text">
            <span>{ownedBy || "N/A"}</span>
            {userRole && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs mt-1 flex items-center justify-center",
                  userRole === "Elite_Plus_Distributor_Package" && "bg-blue-100 text-blue-800",
                  userRole === "Elite_Distributor_Package" && "bg-indigo-100 text-indigo-800",
                  userRole === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                  userRole === "Premium_Merchant_Package" && "bg-purple-100 text-purple-800",
                )}
              >
                {getRoleDisplayName(ownerRole || "")}
              </Badge>
            )}
          </div>
        )
      },
      filterFn: fuzzyFilter,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Price
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const voucher = row.original
        const price = row.getValue("amount") as number
        const product = getProductDetails(voucher.product_code)
        const userRole = getUserRole(voucher.owned_by)

        if (product) {
          const rolePrice = product.pt_product_role_prices.find((rp) => rp.role === userRole)
          const discountedPrice = rolePrice?.discounted_price || product.base_price || 0

          return (
            <div className="font-medium whitespace-nowrap">
              ₱{price ? price.toFixed(2) : discountedPrice.toFixed(2)}
            </div>
          )
        }

        // return <div className="font-medium whitespace-nowrap">₱{(row.getValue("amount") as number).toFixed(2)}</div>
      },
    },
    {
      accessorKey: "discount",
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
        const voucher = row.original
        const product = getProductDetails(voucher.product_code)
        const userRole = getUserRole(voucher.owned_by)
        const soldDiscount = row.getValue("discount") as number

        if (product) {
          const basePrice = product.base_price || 0
          const rolePrice = product.pt_product_role_prices.find((rp) => rp.role === userRole)
          const discountedPrice = rolePrice?.discounted_price || basePrice
          const discount = basePrice - discountedPrice
          const discountPercentage = basePrice > 0 ? (discount / basePrice) * 100 : 0

          return (
            <div className="font-medium flex flex-col whitespace-nowrap">
              {/* <span>₱{discount.toFixed(2)}</span> */}
              <span className="text-xs text-muted-foreground">
                ({soldDiscount ? soldDiscount.toFixed(2) : discountPercentage.toFixed(2)}%)
              </span>
            </div>
          )
        }

        const discount = row.getValue("discount") as number
        const productCode = row.getValue("product_code") as string
        const productInfo = getProductDetails(productCode)
        const basePrice = productInfo?.base_price || 0
        const discountPercentage = basePrice > 0 ? ((discount / basePrice) * 100).toFixed(2) : "0.00"

        return (
          <div className="font-medium flex flex-col whitespace-nowrap">
            {/* <span>₱{discount.toFixed(2)}</span> */}
            <span className="text-xs text-muted-foreground">({discountPercentage}%)</span>
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
            "mt-2 whitespace-nowrap",
            row.getValue("status") === "used" && "bg-green-500",
            row.getValue("status") === "expired" && "bg-red-500",
            row.getValue("status") === "null" && "bg-yellow-500",
          )}
        >
          {(row.getValue("status") as string) === "null"
            ? "Unused"
            : (row.getValue("status") as string).charAt(0).toUpperCase() + (row.getValue("status") as string).slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: "used_date",
      header: () => <div className="text-right font-medium">Used Date</div>,
      cell: ({ row }) => {
        const date: Date | null = row.getValue("used_date")
        return (
          <div className="text-right font-medium whitespace-nowrap">{date ? format(date, "MMM d, yyyy") : "N/A"}</div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: () => <div className="text-right font-medium">Created at</div>,
      cell: ({ row }) => {
        const date: Date | null = row.getValue("created_at")
        return (
          <div className="text-right font-medium whitespace-nowrap">
            {date ? format(date, "MMM d, yyyy h:mm a") : "N/A"}
          </div>
        )
      },
    },
    {
      accessorKey: "owner_role",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Role Discount
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const voucher = row.original
        const ownerRole = row.getValue("owner_role") as string
        const userRole = getUserRole(ownerRole)
        const product = getProductDetails(voucher.product_code)

        if (!product || !userRole) {
          return <div className="font-medium whitespace-nowrap">N/A</div>
        }

        const rolePrice = product.pt_product_role_prices.find((rp) => rp.role === ownerRole)
        if (!rolePrice) {
          return <div className="font-medium whitespace-nowrap">No discount</div>
        }

        const basePrice = product.base_price || 0
        const discountedPrice = rolePrice.discounted_price || 0
        const discount = basePrice - discountedPrice
        const discountPercentage = basePrice > 0 ? (discount / basePrice) * 100 : 0

        return (
          <div className="font-medium flex flex-col whitespace-nowrap">
            <Badge
              variant="outline"
              className={cn(
                "text-xs mb-1 flex flex-col items-center justify-center",
                userRole === "Elite_Plus_Distributor_Package" && "bg-blue-100 text-blue-800",
                userRole === "Elite_Distributor_Package" && "bg-indigo-100 text-indigo-800",
                userRole === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                userRole === "Premium_Merchant_Package" && "bg-purple-100 text-purple-800",
              )}
            >
              {userRole ? getRoleDisplayName(ownerRole) : "N/A"}
            </Badge>
            <span>₱{discount.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">({discountPercentage.toFixed(2)}%)</span>
          </div>
        )
      },
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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(voucher.gsat_voucher_id.toString())}>
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
    initialState: {
      pagination: {
        pageSize: 25, // Set default page size to 25
      },
    },
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

  // Update downloadCSV to include loading state
  const downloadCSV = () => {
    try {
      setIsExporting(true)
      const csvContent = voucherData.map((voucher) => {
        const product = getProductDetails(voucher.product_code)
        const userRole = getUserRole(voucher.owned_by)

        let finalPrice = voucher.amount
        let finalDiscount = voucher.discount

        // Use pricing from product tables if available
        if (product) {
          const basePrice = product.base_price || 0
          const rolePrice = product.pt_product_role_prices.find((rp) => rp.role === userRole)
          const discountedPrice = rolePrice?.discounted_price || basePrice
          finalPrice = discountedPrice
          finalDiscount = basePrice - discountedPrice
        }

        return {
          ...voucher,
          amount: finalPrice,
          discount: finalDiscount,
          expiry_date: voucher.expiry_date ? new Date(voucher.expiry_date).toLocaleDateString() : "N/A",
          used_date: voucher.used_date ? new Date(voucher.used_date).toLocaleDateString() : "N/A",
          created_at: voucher.created_at ? new Date(voucher.created_at).toLocaleDateString() : "N/A",
          updated_at: voucher.updated_at ? new Date(voucher.updated_at).toLocaleDateString() : "N/A",
          role: userRole ? getRoleDisplayName(userRole) : "N/A",
        }
      })

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

      toast({
        title: "Success",
        description: "Vouchers exported successfully",
      })
    } catch (error) {
      console.error("Error exporting vouchers:", error)
      toast({
        title: "Error",
        description: "Failed to export vouchers",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
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

  // Calculate statistics
  const totalVouchers = voucherData.length
  const usedVouchers = voucherData.filter((v) => v.status === "used").length
  const unusedVouchers = voucherData.filter((v) => v.status === "null").length

  // Calculate total income based on product tables
  const totalIncome = voucherData
    .filter((voucher: any) => voucher.status === "used")
    .reduce((sum, voucher: any) => {
      const product = getProductDetails(voucher.product_code)
      const userRole = getUserRole(voucher.owned_by)

      if (product) {
        const rolePrice = product.pt_product_role_prices.find((rp) => rp.role === userRole)
        const discountedPrice = rolePrice?.discounted_price || product.base_price || 0
        return sum + discountedPrice
      }

      return sum + voucher.amount
    }, 0)

  // Calculate total discounts based on product tables
  const totalDiscounts = voucherData.reduce((sum, voucher: any) => {
    const product = getProductDetails(voucher.product_code)
    const userRole = getUserRole(voucher.owned_by)

    if (product) {
      const basePrice = product.base_price || 0
      const rolePrice = product.pt_product_role_prices.find((rp) => rp.role === userRole)
      const discountedPrice = rolePrice?.discounted_price || basePrice
      const discount = basePrice - discountedPrice
      return sum + discount
    }

    return sum + voucher.discount
  }, 0)

  // Improved pagination with numbered buttons
  const renderPaginationButtons = () => {
    const totalPages = table.getPageCount()
    const currentPage = table.getState().pagination.pageIndex + 1

    // If we have 7 or fewer pages, show all page buttons
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          onClick={() => table.setPageIndex(page - 1)}
          className="w-8 h-8 p-0"
        >
          {page}
        </Button>
      ))
    }

    // Otherwise, show a subset with ellipses
    const pages = []

    // Always show first page
    pages.push(
      <Button
        key={1}
        variant={currentPage === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => table.setPageIndex(0)}
        className="w-8 h-8 p-0"
      >
        1
      </Button>,
    )

    // Add ellipsis if needed
    if (currentPage > 3) {
      pages.push(
        <div key="ellipsis-1" className="px-2">
          ...
        </div>,
      )
    }

    // Add pages around current page
    const startPage = Math.max(2, currentPage - 1)
    const endPage = Math.min(totalPages - 1, currentPage + 1)

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => table.setPageIndex(i - 1)}
          className="w-8 h-8 p-0"
        >
          {i}
        </Button>,
      )
    }

    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      pages.push(
        <div key="ellipsis-2" className="px-2">
          ...
        </div>,
      )
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => table.setPageIndex(totalPages - 1)}
          className="w-8 h-8 p-0"
        >
          {totalPages}
        </Button>,
      )
    }

    return pages
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full items-center justify-center">
      <Tabs defaultValue="vouchers" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
          <TabsTrigger value="products">Products & Pricing</TabsTrigger>
          <TabsTrigger value="unused" onClick={refreshData}>
            Unused Products
          </TabsTrigger>
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
                  <AlertDialog open={isSingleDeleteDialogOpen} onOpenChange={setIsSingleDeleteDialogOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this voucher?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the voucher.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteVoucher} disabled={isDeletingVoucher}>
                          {isDeletingVoucher ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Bulk Delete Confirmation Dialog */}
                  <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you sure you want to delete {selectedVouchers.length} vouchers?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the selected vouchers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmBulkDeleteVouchers} disabled={isBatchUpdating}>
                          {isBatchUpdating ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                      <IconCurrencyDollar className="stroke-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        ₱{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-muted-foreground">From {usedVouchers} used vouchers</p>
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
                      <CardTitle className="text-sm font-medium">Total GSAT Vouchers</CardTitle>
                      <IconUsersGroup className="stroke-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{totalVouchers}</div>
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
                      <div className="text-3xl font-bold">{usedVouchers}</div>
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
                      <IconDoorExit className="stroke-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{unusedVouchers}</div>
                      <p className="text-xs text-muted-foreground">Available vouchers</p>
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
                      <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                      <IconDiscount className="stroke-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">₱{totalDiscounts.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">Across all vouchers</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center py-4"
          >
            <Input
              placeholder="Filter vouchers..."
              value={globalFilter ?? ""}
              onChange={(event) => {
                setGlobalFilter(event.target.value);
                setSelectedVouchers([]);
                setRowSelection({});
              }}
              className="max-w-sm"
            />
            <div className="flex-grow"></div>
            <Button variant="outline" className="ml-2" onClick={refreshData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="ml-2">
                  <Filter className="mr-2 h-4 w-4" />
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
                        setProductCodeFilter(value);
                        setColumnFilters((prev) => [
                          ...prev.filter((filter) => filter.id !== "product_code"),
                          ...(value !== "all" ? [{ id: "product_code", value }] : []),
                        ]);
                        setSelectedVouchers([]);
                        setRowSelection({});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.product_code} value={product.product_code}>
                            {product.product_code}
                          </SelectItem>
                        ))}
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
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">User Role</h4>
                    <Select
                      value={roleFilter}
                      onValueChange={(value) => {
                        setRoleFilter(value)
                        // This is a custom filter that will be applied to the data
                        if (value !== "all") {
                          const filteredData = originalVoucherData.filter((voucher) => {
                            const userRole = getUserRole(voucher.owned_by)
                            return userRole === value
                          })
                          setVoucherData(filteredData)
                        } else {
                          // Reset to original data
                          setVoucherData(originalVoucherData)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role" />
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    <IconUserUp className="mr-2 h-4 w-4" />
                    Upload <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <IconUsersPlus />
                    <div className="ml-1">Single</div>
                  </DropdownMenuItem>
                  <DialogTrigger asChild>
                    <DropdownMenuItem className="cursor-pointer">
                      <IconFileTypeCsv />
                      <div className="ml-1">Import CSV</div>
                    </DropdownMenuItem>
                  </DialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <DialogContent className="w-full max-w-screen max-h-[100vh] overflow-y-auto">
                <DialogTitle></DialogTitle>

                <GsatCreation />

                {/* <TabsContent value="bulk">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Bulk Import Vouchers</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload a CSV file with voucher data or paste data directly.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Upload CSV</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                                <IconFileTypeCsv className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-center text-muted-foreground mb-2">
                                  Drag and drop your CSV file here, or click to browse
                                </p>
                                <Button variant="outline" size="sm">
                                  Browse Files
                                </Button>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Paste Data</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <textarea
                                className="w-full h-32 p-2 border rounded-md text-sm"
                                placeholder="Paste CSV or JSON data here..."
                              ></textarea>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Template Format</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            Your CSV should include the following columns:
                          </p>
                          <div className="bg-muted p-2 rounded-md text-xs font-mono overflow-x-auto">
                            serial_number,reference_number,product_code,owned_by,expiry_date
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">Cancel</Button>
                        <Button>Import Vouchers</Button>
                      </div>
                    </div>
                  </TabsContent> */}
              </DialogContent>
            </Dialog>
            <Button className="ml-2" variant="outline" onClick={downloadCSV} disabled={isExporting}>
              {isExporting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <IconDownload className="mr-2 h-4 w-4" />
                  Export Template
                </>
              )}
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4"
          >
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Advanced Search</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="search-serial" className="text-xs">
                      Serial Number
                    </Label>
                    <Input
                      id="search-serial"
                      placeholder="Search by serial number..."
                      className="mt-1"
                      value={advancedSearch.serialNumber}
                      onChange={(e) => setAdvancedSearch({ ...advancedSearch, serialNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="search-reference" className="text-xs">
                      Reference Number
                    </Label>
                    <Input
                      id="search-reference"
                      placeholder="Search by reference number..."
                      className="mt-1"
                      value={advancedSearch.referenceNumber}
                      onChange={(e) => setAdvancedSearch({ ...advancedSearch, referenceNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="search-owner" className="text-xs">
                      Owned By
                    </Label>
                    <Input
                      id="search-owner"
                      placeholder="Search by owner..."
                      className="mt-1"
                      value={advancedSearch.ownedBy}
                      onChange={(e) => setAdvancedSearch({ ...advancedSearch, ownedBy: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="mr-2"
                    onClick={() => {
                      setAdvancedSearch({
                        serialNumber: "",
                        referenceNumber: "",
                        ownedBy: "",
                      })
                      setVoucherData(originalVoucherData)
                    }}
                  >
                    Clear
                  </Button>
                  <Button size="sm" onClick={applyAdvancedSearch}>
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
            className="mb-4"
          >
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Batch Operations</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllVouchers}>
                    <IconUsersGroup className="mr-2 h-4 w-4" />
                    {selectedVouchers.length === voucherData.length && voucherData.length > 0
                      ? "Deselect All"
                      : "Select All"}
                    {selectedVouchers.length > 0 &&
                      selectedVouchers.length < voucherData.length &&
                      ` (${selectedVouchers.length} selected)`}
                  </Button>
                  <Popover open={batchStatusOpen} onOpenChange={setBatchStatusOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" disabled={selectedVouchers.length === 0}>
                        <Tag className="mr-2 h-4 w-4" />
                        Update Status
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Set Status for {selectedVouchers.length} vouchers</h4>
                        <Select value={batchStatus || ""} onValueChange={(value) => setBatchStatus(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null">Unused</SelectItem>
                            <SelectItem value="used">Used</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex justify-end mt-2">
                          <Button size="sm" onClick={updateBatchStatus} disabled={isBatchUpdating || !batchStatus}>
                            {isBatchUpdating ? (
                              <>
                                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              "Apply"
                            )}
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Popover open={batchExpiryOpen} onOpenChange={setBatchExpiryOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" disabled={selectedVouchers.length === 0}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Set Expiry Date
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-2">
                        <h4 className="font-medium text-sm mb-2">Set expiry for {selectedVouchers.length} vouchers</h4>
                        <Calendar mode="single" selected={batchExpiryDate} onSelect={setBatchExpiryDate} initialFocus />
                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            onClick={updateBatchExpiryDate}
                            disabled={isBatchUpdating || !batchExpiryDate}
                          >
                            {isBatchUpdating ? (
                              <>
                                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              "Apply"
                            )}
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    disabled={selectedVouchers.length === 0 || isBatchUpdating}
                    onClick={deleteBatchVouchers}
                  >
                    {isBatchUpdating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Deleting {selectedVouchers.length} vouchers...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-md border h-[calc(100vh-20rem)] overflow-auto"
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
                          "cursor-pointer transition-colors hover:bg-muted/50",
                          "data-[state=selected]:bg-muted relative overflow-hidden",
                          "group",
                        )}
                        onClick={() => handleRowClick(row.original)}
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="text-center group-hover:text-primary transition-colors whitespace-nowrap"
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
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Improved pagination with numbered buttons */}
              <div className="flex items-center space-x-1">{renderPaginationButtons()}</div>

              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[25, 50, 100, 250, 500].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="products">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <ProductManagement />
          </motion.div>
          {products.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Role-Based Pricing Comparison</CardTitle>
                  <CardDescription>Compare pricing across different roles for all products</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-medium">Product Code</TableHead>
                        <TableHead className="font-medium">Base Price</TableHead>
                        {AVAILABLE_ROLES.map((role) => (
                          <TableHead key={role.value} className="font-medium">
                            {role.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading
                        ? Array.from({ length: 3 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Skeleton className="h-4 w-24" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-16" />
                            </TableCell>
                            {AVAILABLE_ROLES.map((_, i) => (
                              <TableCell key={i}>
                                <Skeleton className="h-4 w-16" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                        : products.map((product) => (
                          <TableRow key={product.product_code} className="hover:bg-muted/50">
                            <TableCell className="font-medium whitespace-nowrap">{product.product_code}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              ₱{product.base_price?.toFixed(2) || "0.00"}
                            </TableCell>
                            {AVAILABLE_ROLES.map((role) => {
                              const rolePrice = product.pt_product_role_prices.find((rp) => rp.role === role.value)
                              const basePrice = product.base_price || 0
                              const discountedPrice = rolePrice?.discounted_price || basePrice
                              const discount = basePrice - discountedPrice
                              const discountPercentage = basePrice > 0 ? (discount / basePrice) * 100 : 0

                              return (
                                <TableCell key={role.value} className="whitespace-nowrap">
                                  {rolePrice ? (
                                    <div className="flex flex-col">
                                      <span className="font-medium">₱{discountedPrice.toFixed(2)}</span>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "mt-1 text-xs",
                                          role.value === "Elite_Plus_Distributor_Package" &&
                                          "bg-blue-100 text-blue-800",
                                          role.value === "Elite_Distributor_Package" &&
                                          "bg-indigo-100 text-indigo-800",
                                          role.value === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                                          role.value === "Premium_Merchant_Package" &&
                                          "bg-purple-100 text-purple-800",
                                        )}
                                      >
                                        {discountPercentage > 0
                                          ? `-${discountPercentage.toFixed(1)}%`
                                          : "No discount"}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-100">
                                      Not set
                                    </Badge>
                                  )}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          )}
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
                  <Tag className="stroke-muted-foreground" />
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
                      .reduce((sum, item: any) => sum + item.unusedCount * item.basePrice, 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">Total value of unused products</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Product Types</CardTitle>
                  <IconColumns className="stroke-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{unusedProductsData.length}</div>
                  <p className="text-xs text-muted-foreground">Different product codes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
                  <IconDiscount className="stroke-muted-foreground" />
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
                unusedProductsData.map((item: any, index) => (
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
                            <CardTitle className="text-lg font-bold">{item.productCode}</CardTitle>
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
                                const filteredData = originalVoucherData.filter(
                                  (v) => v.product_code === item.productCode && v.status === "null",
                                )
                                setVoucherData(filteredData)
                                setActiveTab("vouchers")
                                toast({
                                  title: "Filtered Vouchers",
                                  description: `Showing ${filteredData.length} unused ${item.productCode} vouchers`,
                                })
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
                      <RefreshCw className="mr-2 h-4 w-4" />
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
                                <span>{item.productCode}</span>
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
                          .sort((a: any, b: any) => b.unusedCount * b.basePrice - a.unusedCount * a.basePrice)
                          .slice(0, 3)
                          .map((item: any, index) => (
                            <div key={index}>
                              <div className="flex justify-between text-xs">
                                <span>{item.productCode}</span>
                                <span>₱{(item.unusedCount * item.basePrice).toFixed(2)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{
                                    width: `${((item.unusedCount * item.basePrice) / unusedProductsData.reduce((max, i: any) => Math.max(max, i.unusedCount * i.basePrice), 0)) * 100}%`,
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
                            const filteredData = originalVoucherData.filter((v) => v.status === "null")
                            setVoucherData(filteredData)
                            setActiveTab("vouchers")
                            toast({
                              title: "Filtered Vouchers",
                              description: `Showing all ${filteredData.length} unused vouchers`,
                            })
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
                              .filter((item: any) => item.unusedCount * item.basePrice > 1000)
                              .map((item) => item.productCode)

                            const filteredData = originalVoucherData.filter(
                              (v) => highValueProducts.includes(v.product_code) && v.status === "null",
                            )

                            setVoucherData(filteredData)
                            setActiveTab("vouchers")
                            toast({
                              title: "Filtered Vouchers",
                              description: `Showing ${filteredData.length} high-value unused vouchers`,
                            })
                          }}
                        >
                          <IconCurrencyDollar className="mr-2 h-4 w-4" />
                          High Value Only
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={refreshData}>
                          <RefreshCw className="mr-2 h-4 w-4" />
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
      </Tabs>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="col-span-1 md:col-span-2 lg:col-span-5 mt-4"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Role-Based Discount Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {AVAILABLE_ROLES.map((role) => {
                // Calculate total discount for this role
                const roleDiscounts = voucherData.reduce((sum, voucher) => {
                  const userRole = getUserRole(voucher.owned_by)
                  if (userRole !== role.value) return sum

                  const product = getProductDetails(voucher.product_code)
                  if (!product) return sum

                  const basePrice = product.base_price || 0
                  const rolePrice = product.pt_product_role_prices.find((rp) => rp.role === role.value)
                  const discountedPrice = rolePrice?.discounted_price || basePrice
                  const discount = basePrice - discountedPrice

                  return sum + discount
                }, 0)

                // Count vouchers for this role
                const roleVouchers = voucherData.filter((v) => getUserRole(v.owned_by) === role.value).length

                return (
                  <div key={role.value} className="flex flex-col">
                    <div className="flex items-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "mr-2",
                          role.value === "Elite_Plus_Distributor_Package" && "bg-blue-100 text-blue-800",
                          role.value === "Elite_Distributor_Package" && "bg-indigo-100 text-indigo-800",
                          role.value === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                          role.value === "Premium_Merchant_Package" && "bg-purple-100 text-purple-800",
                        )}
                      >
                        {role.label}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <span className="text-sm font-medium">₱{roleDiscounts.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground block">{roleVouchers} vouchers</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <span className="mr-2">Voucher Details</span>
              {currentVoucher && (
                <Badge
                  className={cn(
                    currentVoucher.status === "used" && "bg-green-500",
                    currentVoucher.status === "expired" && "bg-red-500",
                    currentVoucher.status === "null" && "bg-yellow-500",
                  )}
                >
                  {currentVoucher.status === "null"
                    ? "Unused"
                    : currentVoucher.status
                      ? currentVoucher.status.charAt(0).toUpperCase() + currentVoucher.status.slice(1)
                      : "N/A"}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {currentVoucher ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col md:flex-row gap-6"
            >
              <div className="w-full md:w-1/2">
                <div className="border-none shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg text-primary">Voucher Information</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-xs">Serial Number</Label>
                        {isEditing ? (
                          <Input
                            value={editedVoucher.serial_number ?? currentVoucher.serial_number ?? ""}
                            onChange={(e) => setEditedVoucher({ ...editedVoucher, serial_number: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <div className="font-medium mt-1">{currentVoucher.serial_number || "N/A"}</div>
                        )}
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Reference Number</Label>
                        {isEditing ? (
                          <Input
                            value={editedVoucher.reference_number ?? currentVoucher.reference_number ?? ""}
                            onChange={(e) => setEditedVoucher({ ...editedVoucher, reference_number: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <div className="font-medium mt-1">{currentVoucher.reference_number || "N/A"}</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-muted-foreground text-xs">Product Code</Label>
                      {isEditing ? (
                        <Select
                          value={editedVoucher.product_code ?? currentVoucher.product_code}
                          onValueChange={(value) => setEditedVoucher({ ...editedVoucher, product_code: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select product code" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.product_code} value={product.product_code}>
                                {product.product_code} (₱{product.base_price?.toFixed(2) || "0.00"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium mt-1">{currentVoucher.product_code}</div>
                      )}
                    </div>

                    <div>
                      <Label className="text-muted-foreground text-xs">Owner</Label>
                      <div className="font-medium mt-1 flex items-center">
                        {currentVoucher.owned_by || "N/A"}
                        {(() => {
                          const userRole = getUserRole(currentVoucher.owned_by)
                          if (!userRole) return null

                          return (
                            <Badge
                              variant="outline"
                              className={cn(
                                "ml-2 text-xs",
                                userRole === "Elite_Plus_Distributor_Package" && "bg-blue-100 text-blue-800",
                                userRole === "Elite_Distributor_Package" && "bg-indigo-100 text-indigo-800",
                                userRole === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                                userRole === "Premium_Merchant_Package" && "bg-purple-100 text-purple-800",
                              )}
                            >
                              {userRole ? getRoleDisplayName(userRole) : "N/A"}
                            </Badge>
                          )
                        })()}
                      </div>
                    </div>

                    <div>
                      <Label className="text-muted-foreground text-xs">Status</Label>
                      {isEditing ? (
                        <Select
                          value={editedVoucher.status ?? currentVoucher.status ?? "null"}
                          onValueChange={(value) => setEditedVoucher({ ...editedVoucher, status: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null">Unused</SelectItem>
                            <SelectItem value="used">Used</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium mt-1">
                          <Badge
                            className={cn(
                              currentVoucher.status === "used" && "bg-green-500",
                              currentVoucher.status === "expired" && "bg-red-500",
                              currentVoucher.status === "null" && "bg-yellow-500",
                            )}
                          >
                            {currentVoucher.status === "null"
                              ? "Unused"
                              : currentVoucher.status
                                ? currentVoucher.status.charAt(0).toUpperCase() + currentVoucher.status.slice(1)
                                : "N/A"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-xs">Expiry Date</Label>
                        {isEditing ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal mt-1",
                                  !editedVoucher.expiry_date && !currentVoucher.expiry_date && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {editedVoucher.expiry_date ? (
                                  format(new Date(editedVoucher.expiry_date), "PPP")
                                ) : currentVoucher.expiry_date ? (
                                  format(new Date(currentVoucher.expiry_date), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={
                                  editedVoucher.expiry_date
                                    ? new Date(editedVoucher.expiry_date)
                                    : currentVoucher.expiry_date
                                      ? new Date(currentVoucher.expiry_date)
                                      : undefined
                                }
                                onSelect={(date) => setEditedVoucher({ ...editedVoucher, expiry_date: date })}
                              />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <div className="font-medium mt-1">
                            {currentVoucher.expiry_date ? format(new Date(currentVoucher.expiry_date), "PPP") : "N/A"}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Used Date</Label>
                        <div className="font-medium mt-1">
                          {currentVoucher.used_date ? format(new Date(currentVoucher.used_date), "PPP") : "N/A"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </div>

              <div className="w-full md:w-1/2">
                <div className="border-none shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg text-primary">Pricing Details</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    {(() => {
                      const product = getProductDetails(currentVoucher.product_code)
                      if (!product) return <div className="text-muted-foreground">No product details found</div>

                      const userRole = getUserRole(currentVoucher.owned_by)
                      const rolePrice = userRole
                        ? product.pt_product_role_prices.find((rp) => rp.role === userRole)
                        : null
                      const basePrice = product.base_price || 0
                      const discountedPrice = rolePrice?.discounted_price || basePrice
                      const discount = basePrice - discountedPrice
                      const discountPercentage = basePrice > 0 ? (discount / basePrice) * 100 : 0

                      return (
                        <div className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Base Price:</span>
                              <span className="text-lg font-bold">₱{basePrice.toFixed(2)}</span>
                            </div>

                            {rolePrice && (
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium flex items-center">
                                  Role Price:
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "ml-2 text-xs",
                                      userRole === "Elite_Plus_Distributor_Package" && "bg-blue-100 text-blue-800",
                                      userRole === "Elite_Distributor_Package" && "bg-indigo-100 text-indigo-800",
                                      userRole === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                                      userRole === "Premium_Merchant_Package" && "bg-purple-100 text-purple-800",
                                    )}
                                  >
                                    {userRole ? getRoleDisplayName(userRole) : "N/A"}
                                  </Badge>
                                </span>
                                <span className="text-lg font-bold">₱{discountedPrice.toFixed(2)}</span>
                              </div>
                            )}

                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Discount:</span>
                              <div className="text-right">
                                <span className="text-lg font-bold">₱{discount.toFixed(2)}</span>
                                <span className="text-xs text-muted-foreground block">
                                  ({discountPercentage.toFixed(2)}%)
                                </span>
                              </div>
                            </div>

                            <Separator className="my-2" />

                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Final Price:</span>
                              <span className="text-lg font-bold text-primary">₱{discountedPrice.toFixed(2)}</span>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">All Role Prices for {product.product_code}</h4>
                            <div className="space-y-2">
                              {AVAILABLE_ROLES.map((role) => {
                                const roleSpecificPrice = product.pt_product_role_prices.find(
                                  (rp) => rp.role === role.value,
                                )
                                const rolePriceValue = roleSpecificPrice?.discounted_price || basePrice
                                const roleDiscount = basePrice - rolePriceValue
                                const roleDiscountPercentage = basePrice > 0 ? (roleDiscount / basePrice) * 100 : 0

                                return (
                                  <div
                                    key={role.value}
                                    className={cn(
                                      "flex justify-between items-center p-2 rounded-md",
                                      userRole === role.value && "bg-muted",
                                    )}
                                  >
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        role.value === "Elite_Plus_Distributor_Package" && "bg-blue-100 text-blue-800",
                                        role.value === "Elite_Distributor_Package" && "bg-indigo-100 text-indigo-800",
                                        role.value === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                                        role.value === "Premium_Merchant_Package" && "bg-purple-100 text-purple-800",
                                      )}
                                    >
                                      {role.label}
                                    </Badge>
                                    <div className="text-right">
                                      <span className="font-medium">₱{rolePriceValue.toFixed(2)}</span>
                                      {roleDiscount > 0 && (
                                        <span className="text-xs text-muted-foreground block">
                                          (-{roleDiscountPercentage.toFixed(1)}%)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </CardContent>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center p-6">
              <Skeleton className="h-[300px] w-full" />
            </div>
          )}

          {currentVoucher && (
            <DialogFooter className="flex justify-end space-x-2 pt-4">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isUpdatingVoucher}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveVoucher} disabled={isUpdatingVoucher}>
                    {isUpdatingVoucher ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDeleteVoucher}
                    disabled={isDeletingVoucher}
                  >
                    {isDeletingVoucher ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="col-span-1 md:col-span-2 lg:col-span-5 mt-4"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Voucher Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Status Distribution</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{
                        width: `${(usedVouchers / totalVouchers) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((usedVouchers / totalVouchers) * 100)}%
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-yellow-500 h-2.5 rounded-full"
                      style={{
                        width: `${(unusedVouchers / totalVouchers) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((unusedVouchers / totalVouchers) * 100)}%
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Product Distribution</h4>
                <div className="space-y-2">
                  {products.slice(0, 3).map((product) => {
                    const count = voucherData.filter((v) => v.product_code === product.product_code).length
                    const percentage = (count / totalVouchers) * 100

                    return (
                      <div key={product.product_code}>
                        <div className="flex justify-between text-xs">
                          <span>{product.product_code}</span>
                          <span>{count} vouchers</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Role Distribution</h4>
                <div className="space-y-2">
                  {AVAILABLE_ROLES.map((role) => {
                    const count = voucherData.filter((v) => getUserRole(v.owned_by) === role.value).length
                    const percentage = (count / totalVouchers) * 100

                    return (
                      <div key={role.value}>
                        <div className="flex justify-between text-xs">
                          <span>{role.label}</span>
                          <span>{count} vouchers</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full",
                              role.value === "Elite_Plus_Distributor_Package" && "bg-blue-500",
                              role.value === "Elite_Distributor_Package" && "bg-indigo-500",
                              role.value === "Basic_Merchant_Package" && "bg-green-500",
                              role.value === "Premium_Merchant_Package" && "bg-purple-500",
                            )}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bulk Delete Progress Dialog */}
      <Dialog open={isBatchUpdating && selectedVouchers.length > 0 && currentlyDeletingVoucher !== null}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <RefreshCw className="mr-2 h-5 w-5 animate-spin text-primary" />
              Deleting Vouchers (
              {selectedVouchers.length - selectedVouchers.indexOf(currentlyDeletingVoucher?.gsat_voucher_id || 0)}/
              {selectedVouchers.length})
            </DialogTitle>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 py-4"
          >
            {currentlyDeletingVoucher && (
              <Card className="overflow-hidden border-primary">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Serial Number</Label>
                      <div className="font-medium mt-1">{currentlyDeletingVoucher.serial_number || "N/A"}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Reference Number</Label>
                      <div className="font-medium mt-1">{currentlyDeletingVoucher.reference_number || "N/A"}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Product Code</Label>
                      <div className="font-medium mt-1">{currentlyDeletingVoucher.product_code}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Owner</Label>
                      <div className="font-medium mt-1 flex items-center">
                        {currentlyDeletingVoucher.owned_by || "N/A"}
                        {(() => {
                          const userRole = getUserRole(currentlyDeletingVoucher.owned_by)
                          if (!userRole) return null

                          return (
                            <Badge
                              variant="outline"
                              className={cn(
                                "ml-2 text-xs",
                                userRole === "Elite_Plus_Distributor_Package" && "bg-blue-100 text-blue-800",
                                userRole === "Elite_Distributor_Package" && "bg-indigo-100 text-indigo-800",
                                userRole === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                                userRole === "Premium_Merchant_Package" && "bg-purple-100 text-purple-800",
                              )}
                            >
                              {userRole ? getRoleDisplayName(userRole) : "N/A"}
                            </Badge>
                          )
                        })()}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Status</Label>
                      <div className="font-medium mt-1">
                        <Badge
                          className={cn(
                            currentlyDeletingVoucher.status === "used" && "bg-green-500",
                            currentlyDeletingVoucher.status === "expired" && "bg-red-500",
                            currentlyDeletingVoucher.status === "null" && "bg-yellow-500",
                          )}
                        >
                          {currentlyDeletingVoucher.status === "null"
                            ? "Unused"
                            : currentlyDeletingVoucher.status
                              ? currentlyDeletingVoucher.status.charAt(0).toUpperCase() +
                              currentlyDeletingVoucher.status.slice(1)
                              : "N/A"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Created At</Label>
                      <div className="font-medium mt-1">
                        {currentlyDeletingVoucher.created_at
                          ? format(new Date(currentlyDeletingVoucher.created_at), "PPP")
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <motion.div
                className="bg-primary h-2.5 rounded-full"
                initial={{ width: "0%" }}
                animate={{
                  width: `${(selectedVouchers.indexOf(currentlyDeletingVoucher?.gsat_voucher_id || 0) / selectedVouchers.length) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Please wait while the selected vouchers are being deleted...
            </p>
          </motion.div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
