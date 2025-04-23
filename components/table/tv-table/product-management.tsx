"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { motion, AnimatePresence, useAnimation } from "framer-motion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    Edit,
    Trash2,
    Plus,
    Save,
    X,
    RefreshCw,
    Tag,
    Percent,
    DollarSign,
    Tv,
    Search,
    ArrowUpDown,
    Download,
    HelpCircle,
    BarChart3,
    Filter,
    Layers,
    Settings,
    FileText,
    Copy,
    AlertTriangle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
    createTVProduct,
    updateTVProduct,
    deleteTVProduct,
    getAllTVProducts,
    createTVProductRolePrice,
    updateTVProductRolePrice,
    deleteTVProductRolePrice,
    applyBatchTVPricing,
    getProductInclusions,
    createProductInclusion,
    updateProductInclusion,
    deleteProductInclusion,
} from "@/actions/tv-pricing"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

// Define types based on your Prisma schema
type Product = {
    product_code: string
    base_price: number | null
    product_type: string | null
    pt_product_role_prices: ProductRolePrice[]
    pt_product_inclusion?: ProductInclusion[] // Add this line
}

type ProductRolePrice = {
    product_code: string
    role: string
    discounted_price: number
    product_type: string | null
}

type ProductInclusion = {
    id: number
    product_code: string
    inclusion: string
    product_type: string | null
    created_at: Date
    updated_at: Date
}

// Define available roles and their display names
const AVAILABLE_ROLES = [
    { value: "Elite_Plus_Distributor_Package", label: "Elite Plus Distributor", color: "blue" },
    { value: "Elite_Distributor_Package", label: "Elite Distributor", color: "indigo" },
    { value: "Basic_Merchant_Package", label: "Basic Merchant", color: "green" },
    { value: "Premium_Merchant_Package", label: "Premium Merchant", color: "purple" },
]

// Helper function to get display name for a role
const getRoleDisplayName = (role: string): string => {
    const foundRole = AVAILABLE_ROLES.find((r) => r.value === role)
    return foundRole ? foundRole.label : role.replace(/_/g, " ")
}

// Helper function to get color for a role
const getRoleColor = (role: string): string => {
    const foundRole = AVAILABLE_ROLES.find((r) => r.value === role)
    return foundRole ? foundRole.color : "gray"
}

// Helper function to format currency
const formatCurrency = (amount: number | null): string => {
    if (amount === null) return "₱0.00"
    return `₱${amount.toFixed(2)}`
}

export default function TVProductManagement() {
    // Main state
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [activeView, setActiveView] = useState<"grid" | "table">("grid")
    const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState("")
    const [sortConfig, setSortConfig] = useState<{
        key: string
        direction: "ascending" | "descending"
    }>({ key: "product_code", direction: "ascending" })
    const [filterRole, setFilterRole] = useState<string>("all")
    const [filterHasRolePrices, setFilterHasRolePrices] = useState<boolean | null>(null)
    const [filterPriceRange, setFilterPriceRange] = useState<{ min: number; max: number | null }>({ min: 0, max: null })

    // Dialog states
    const [isAddProductOpen, setIsAddProductOpen] = useState(false)
    const [isAddRolePriceOpen, setIsAddRolePriceOpen] = useState(false)
    const [isDeleteProductDialogOpen, setIsDeleteProductDialogOpen] = useState(false)
    const [isDeleteRolePriceDialogOpen, setIsDeleteRolePriceDialogOpen] = useState(false)
    const [isBulkOperationDialogOpen, setIsBulkOperationDialogOpen] = useState(false)
    const [productToDelete, setProductToDelete] = useState<string | null>(null)
    const [rolePriceToDelete, setRolePriceToDelete] = useState<{ productCode: string; role: string } | null>(null)
    const [selectedProducts, setSelectedProducts] = useState<string[]>([])

    // Editing states
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [editingRolePrice, setEditingRolePrice] = useState<
        | (ProductRolePrice & {
            discountType?: "fixed" | "percentage"
            discountValue?: number
        })
        | null
    >(null)

    // Form states
    const [newProduct, setNewProduct] = useState({
        product_code: "",
        base_price: 0,
    })
    const [newRolePrice, setNewRolePrice] = useState({
        product_code: "",
        role: "",
        discounted_price: 0,
        discountType: "fixed" as "fixed" | "percentage",
        discountValue: 0,
    })

    // Batch pricing state
    const [batchPricing, setBatchPricing] = useState({
        role: "",
        discountType: "percentage",
        discountValue: 10,
    })

    // UI state
    const [showDiscountPreview, setShowDiscountPreview] = useState(true)
    const [compactView, setCompactView] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [showAnalytics, setShowAnalytics] = useState(true)

    // Loading states for CRUD operations
    const [isCreatingProduct, setIsCreatingProduct] = useState(false)
    const [isUpdatingProduct, setIsUpdatingProduct] = useState(false)
    const [isDeletingProduct, setIsDeletingProduct] = useState<string | null>(null)
    const [isCreatingRolePrice, setIsCreatingRolePrice] = useState(false)
    const [isUpdatingRolePrice, setIsUpdatingRolePrice] = useState(false)
    const [isDeletingRolePrice, setIsDeletingRolePrice] = useState<{
        productCode: string
        role: string
    } | null>(null)
    const [isApplyingBatch, setIsApplyingBatch] = useState(false)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)

    const [productInclusions, setProductInclusions] = useState<Record<string, ProductInclusion[]>>({});
    const [isAddInclusionOpen, setIsAddInclusionOpen] = useState(false);
    const [newInclusion, setNewInclusion] = useState({
        product_code: "",
        inclusion: "",
    });
    const [editingInclusion, setEditingInclusion] = useState<ProductInclusion | null>(null);
    const [isCreatingInclusion, setIsCreatingInclusion] = useState(false);
    const [isUpdatingInclusion, setIsUpdatingInclusion] = useState(false);
    const [isDeletingInclusion, setIsDeletingInclusion] = useState<number | null>(null);
    const [inclusionToDelete, setInclusionToDelete] = useState<number | null>(null);
    const [isDeleteInclusionDialogOpen, setIsDeleteInclusionDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"pricing" | "inclusions">("pricing");

    // Animation controls
    const controls = useAnimation()
    const tableRef = useRef<HTMLDivElement>(null)

    // Fetch products on mount and when refreshTrigger changes
    useEffect(() => {
        fetchProducts()
    }, [refreshTrigger])

    // Apply search and filters whenever products, searchTerm, or filterRole changes
    useEffect(() => {
        applySearchAndFilters()
    }, [products, searchTerm, filterRole, sortConfig, filterHasRolePrices, filterPriceRange])

    // Animation when view changes
    useEffect(() => {
        controls.start({
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" },
        })
    }, [activeView, controls])

    // Calculate statistics and analytics data
    const stats = useMemo(() => {
        const totalProducts = products.length
        const totalRolePrices = products.reduce((sum, product) => sum + product.pt_product_role_prices.length, 0)

        const averageBasePrice =
            products.length > 0 ? products.reduce((sum, product) => sum + (product.base_price || 0), 0) / products.length : 0

        const averageDiscount =
            totalRolePrices > 0
                ? products.reduce((sum, product) => {
                    const productBasePrice = product.base_price || 0
                    return (
                        sum +
                        product.pt_product_role_prices.reduce((roleSum, rolePrice) => {
                            const discountedPrice = rolePrice.discounted_price || 0
                            return roleSum + (productBasePrice - discountedPrice)
                        }, 0)
                    )
                }, 0) / totalRolePrices
                : 0

        // Calculate products with no role prices
        const productsWithNoRolePrices = products.filter((p) => p.pt_product_role_prices.length === 0).length

        // Calculate role distribution
        const roleDistribution = AVAILABLE_ROLES.map((role) => {
            const count = products.reduce((sum, product) => {
                return sum + product.pt_product_role_prices.filter((rp) => rp.role === role.value).length
            }, 0)
            return {
                role: role.label,
                count,
                color: role.color,
            }
        })

        // Calculate price ranges
        const priceRanges = {
            low: products.filter((p) => (p.base_price || 0) < 500).length,
            medium: products.filter((p) => (p.base_price || 0) >= 500 && (p.base_price || 0) < 1000).length,
            high: products.filter((p) => (p.base_price || 0) >= 1000).length,
        }

        // Calculate highest and lowest priced products
        const sortedByPrice = [...products].sort((a, b) => (b.base_price || 0) - (a.base_price || 0))
        const highestPricedProduct = sortedByPrice.length > 0 ? sortedByPrice[0] : null
        const lowestPricedProduct = sortedByPrice.length > 0 ? sortedByPrice[sortedByPrice.length - 1] : null

        // Calculate average discounts by role
        const discountsByRole = AVAILABLE_ROLES.map((role) => {
            let totalDiscount = 0
            let count = 0

            products.forEach((product) => {
                const basePrice = product.base_price || 0
                const rolePrice = product.pt_product_role_prices.find((rp) => rp.role === role.value)

                if (rolePrice && basePrice > 0) {
                    const discountedPrice = rolePrice.discounted_price || 0
                    const discountPercentage = ((basePrice - discountedPrice) / basePrice) * 100
                    totalDiscount += discountPercentage
                    count++
                }
            })

            return {
                role: role.label,
                averageDiscount: count > 0 ? totalDiscount / count : 0,
                color: role.color,
            }
        })

        return {
            totalProducts,
            totalRolePrices,
            averageBasePrice,
            averageDiscount,
            productsWithNoRolePrices,
            roleDistribution,
            priceRanges,
            highestPricedProduct,
            lowestPricedProduct,
            discountsByRole,
        }
    }, [products])

    // Fetch products from the server
    const fetchProducts = async () => {
        try {
            setIsLoading(true)
            const response: any = await getAllTVProducts()
            if (response.success && response.products) {
                setProducts(response.products)
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to fetch products",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error fetching products:", error)
            toast({
                title: "Error",
                description: "Failed to fetch products",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Apply search term and filters to products
    const applySearchAndFilters = () => {
        let result = [...products]

        // Apply search
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase()
            result = result.filter((product) => product.product_code.toLowerCase().includes(lowerSearchTerm))
        }

        // Apply role filter
        if (filterRole && filterRole !== "all") {
            result = result.filter((product) => product.pt_product_role_prices.some((rp) => rp.role === filterRole))
        }

        // Apply has role prices filter
        if (filterHasRolePrices !== null) {
            if (filterHasRolePrices) {
                result = result.filter((product) => product.pt_product_role_prices.length > 0)
            } else {
                result = result.filter((product) => product.pt_product_role_prices.length === 0)
            }
        }

        // Apply price range filter
        if (filterPriceRange.min > 0 || filterPriceRange.max !== null) {
            result = result.filter((product) => {
                const price = product.base_price || 0
                if (filterPriceRange.max !== null) {
                    return price >= filterPriceRange.min && price <= filterPriceRange.max
                } else {
                    return price >= filterPriceRange.min
                }
            })
        }

        // Apply sorting
        if (sortConfig) {
            result.sort((a, b) => {
                if (sortConfig.key === "product_code") {
                    return sortConfig.direction === "ascending"
                        ? a.product_code.localeCompare(b.product_code)
                        : b.product_code.localeCompare(a.product_code)
                } else if (sortConfig.key === "base_price") {
                    const priceA = a.base_price || 0
                    const priceB = b.base_price || 0
                    return sortConfig.direction === "ascending" ? priceA - priceB : priceB - priceA
                } else if (sortConfig.key === "role_count") {
                    return sortConfig.direction === "ascending"
                        ? a.pt_product_role_prices.length - b.pt_product_role_prices.length
                        : b.pt_product_role_prices.length - a.pt_product_role_prices.length
                }
                return 0
            })
        }

        setFilteredProducts(result)
    }

    // Sort products by the given key
    const requestSort = (key: string) => {
        let direction: "ascending" | "descending" = "ascending"

        if (sortConfig && sortConfig.key === key) {
            direction = sortConfig.direction === "ascending" ? "descending" : "ascending"
        }

        setSortConfig({ key, direction })
    }

    // Get sort direction for a column
    const getSortDirection = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return null
        }
        return sortConfig.direction
    }

    // Toggle product expansion in grid view
    const toggleProductExpansion = (productCode: string) => {
        if (expandedProduct === productCode) {
            setExpandedProduct(null);
        } else {
            setExpandedProduct(productCode);
            // Fetch inclusions when expanding a product
            if (!productInclusions[productCode]) {
                fetchProductInclusions(productCode);
            }
        }
    }

    // Handle adding a new product
    const handleAddProduct = async () => {
        try {
            if (!newProduct.product_code) {
                toast({
                    title: "Error",
                    description: "Product code is required",
                    variant: "destructive",
                })
                return
            }

            setIsCreatingProduct(true)
            const result = await createTVProduct({
                product_code: newProduct.product_code,
                base_price: newProduct.base_price,
            })

            if (result.success) {
                toast({
                    title: "Success",
                    description: "TV product added successfully",
                    variant: "default",
                })
                setRefreshTrigger((prev) => prev + 1)
                setIsAddProductOpen(false)
                setNewProduct({ product_code: "", base_price: 0 })
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to add product",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error adding product:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsCreatingProduct(false)
        }
    }

    // Handle updating a product
    const handleUpdateProduct = async () => {
        if (!editingProduct) return

        try {
            setIsUpdatingProduct(true)
            const result = await updateTVProduct(editingProduct.product_code, { base_price: editingProduct.base_price })

            if (result.success) {
                toast({
                    title: "Success",
                    description: "TV product updated successfully",
                    variant: "default",
                })
                setRefreshTrigger((prev) => prev + 1)
                setEditingProduct(null)
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to update product",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error updating product:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsUpdatingProduct(false)
        }
    }

    // Open delete product confirmation dialog
    const confirmDeleteProduct = (productCode: string) => {
        setProductToDelete(productCode)
        setIsDeleteProductDialogOpen(true)
    }

    // Handle deleting a product
    const handleDeleteProduct = async () => {
        if (!productToDelete) return

        try {
            setIsDeletingProduct(productToDelete)
            const result = await deleteTVProduct(productToDelete)

            if (result.success) {
                toast({
                    title: "Success",
                    description: "TV product deleted successfully",
                    variant: "default",
                })
                setRefreshTrigger((prev) => prev + 1)
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to delete product",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error deleting product:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsDeletingProduct(null)
            setIsDeleteProductDialogOpen(false)
            setProductToDelete(null)
        }
    }

    // Handle bulk delete of products
    const handleBulkDelete = async () => {
        if (selectedProducts.length === 0) return

        try {
            setIsBulkDeleting(true)
            let successCount = 0
            let failCount = 0

            for (const productCode of selectedProducts) {
                const result = await deleteTVProduct(productCode)
                if (result.success) {
                    successCount++
                } else {
                    failCount++
                }
            }

            if (successCount > 0) {
                toast({
                    title: "Success",
                    description: `Successfully deleted ${successCount} products${failCount > 0 ? `, failed to delete ${failCount}` : ""}`,
                    variant: "default",
                })
                setRefreshTrigger((prev) => prev + 1)
                setSelectedProducts([])
            } else {
                toast({
                    title: "Error",
                    description: "Failed to delete any products",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error bulk deleting products:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsBulkDeleting(false)
            setIsBulkOperationDialogOpen(false)
        }
    }

    // Handle adding a role price
    const handleAddRolePrice = async () => {
        try {
            if (!newRolePrice.product_code || !newRolePrice.role) {
                toast({
                    title: "Error",
                    description: "Product code and role are required",
                    variant: "destructive",
                })
                return
            }

            setIsCreatingRolePrice(true)
            const result = await createTVProductRolePrice({
                product_code: newRolePrice.product_code,
                role: newRolePrice.role,
                discounted_price: newRolePrice.discounted_price,
            })

            if (result.success) {
                toast({
                    title: "Success",
                    description: "TV role price added successfully",
                    variant: "default",
                })

                // Update the local products state immediately for instant UI update
                const updatedProducts = [...products]
                const productIndex = updatedProducts.findIndex((p) => p.product_code === newRolePrice.product_code)

                if (productIndex !== -1) {
                    // Check if role price already exists
                    const rolePriceIndex = updatedProducts[productIndex].pt_product_role_prices.findIndex(
                        (rp) => rp.role === newRolePrice.role,
                    )

                    if (rolePriceIndex !== -1) {
                        // Update existing role price
                        updatedProducts[productIndex].pt_product_role_prices[rolePriceIndex].discounted_price =
                            newRolePrice.discounted_price
                    } else {
                        // Add new role price
                        updatedProducts[productIndex].pt_product_role_prices.push({
                            product_code: newRolePrice.product_code,
                            role: newRolePrice.role,
                            discounted_price: newRolePrice.discounted_price,
                            product_type: "tv",
                        })
                    }

                    setProducts(updatedProducts)
                }

                // Also trigger a refresh to ensure data consistency
                setRefreshTrigger((prev) => prev + 1)
                setIsAddRolePriceOpen(false)
                setNewRolePrice({
                    product_code: "",
                    role: "",
                    discounted_price: 0,
                    discountType: "fixed",
                    discountValue: 0,
                })
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to add role price",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error adding role price:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsCreatingRolePrice(false)
        }
    }

    // Handle updating a role price
    const handleUpdateRolePrice = async () => {
        if (!editingRolePrice) return

        try {
            setIsUpdatingRolePrice(true)
            const result = await updateTVProductRolePrice(editingRolePrice.product_code, editingRolePrice.role, {
                discounted_price: editingRolePrice.discounted_price,
            })

            if (result.success) {
                toast({
                    title: "Success",
                    description: "TV role price updated successfully",
                    variant: "default",
                })
                setRefreshTrigger((prev) => prev + 1)
                setEditingRolePrice(null)
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to update role price",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error updating role price:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsUpdatingRolePrice(false)
        }
    }

    // Open delete role price confirmation dialog
    const confirmDeleteRolePrice = (productCode: string, role: string) => {
        setRolePriceToDelete({ productCode, role })
        setIsDeleteRolePriceDialogOpen(true)
    }

    // Handle deleting a role price
    const handleDeleteRolePrice = async () => {
        if (!rolePriceToDelete) return

        try {
            setIsDeletingRolePrice(rolePriceToDelete)
            const result = await deleteTVProductRolePrice(rolePriceToDelete.productCode, rolePriceToDelete.role)

            if (result.success) {
                toast({
                    title: "Success",
                    description: "TV role price deleted successfully",
                    variant: "default",
                })
                setRefreshTrigger((prev) => prev + 1)
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to delete role price",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error deleting role price:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsDeletingRolePrice(null)
            setIsDeleteRolePriceDialogOpen(false)
            setRolePriceToDelete(null)
        }
    }

    // Apply batch pricing to all products
    const applyBatchPricing = async () => {
        if (!batchPricing.role || products.length === 0) return

        setIsApplyingBatch(true)
        try {
            const result = await applyBatchTVPricing(
                batchPricing.role,
                batchPricing.discountType as "percentage" | "fixed",
                batchPricing.discountValue,
            )

            if (result.success) {
                toast({
                    title: "Success",
                    description: result.message || `Applied pricing to ${result.updatedCount} products`,
                    variant: "default",
                })

                // Refresh data to ensure UI is in sync with database
                setRefreshTrigger((prev) => prev + 1)
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to apply batch pricing",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error applying batch pricing:", error)
            toast({
                title: "Error",
                description: "Failed to apply batch pricing",
                variant: "destructive",
            })
        } finally {
            setIsApplyingBatch(false)
        }
    }

    // Refresh data
    const refreshData = () => {
        // Animate the refresh button
        const refreshButton = document.getElementById("refresh-button")
        if (refreshButton) {
            refreshButton.classList.add("animate-spin")
            setTimeout(() => {
                refreshButton.classList.remove("animate-spin")
            }, 1000)
        }

        setRefreshTrigger((prev) => prev + 1)
    }

    // Toggle product selection for bulk operations
    const toggleProductSelection = (productCode: string) => {
        if (selectedProducts.includes(productCode)) {
            setSelectedProducts(selectedProducts.filter((code) => code !== productCode))
        } else {
            setSelectedProducts([...selectedProducts, productCode])
        }
    }

    // Toggle all products selection
    const toggleAllProducts = () => {
        if (selectedProducts.length === filteredProducts.length) {
            setSelectedProducts([])
        } else {
            setSelectedProducts(filteredProducts.map((p) => p.product_code))
        }
    }

    // Reset all filters
    const resetFilters = () => {
        setSearchTerm("")
        setFilterRole("all")
        setFilterHasRolePrices(null)
        setFilterPriceRange({ min: 0, max: null })
        setSortConfig({ key: "product_code", direction: "ascending" })
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 },
        },
    }

    const tableRowVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.2 },
        },
        hover: {
            scale: 1.01,
            backgroundColor: "rgba(var(--muted), 0.7)",
            transition: { duration: 0.2 },
        },
        removed: {
            opacity: 0,
            x: 20,
            transition: { duration: 0.2 },
        },
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 },
        },
        hover: {
            y: -5,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            transition: { duration: 0.3 },
        },
    }

    // Export data to CSV
    const exportToCSV = () => {
        // Create CSV content
        let csvContent = "Product Code,Base Price,Role,Discounted Price,Discount,Discount Percentage\n"

        products.forEach((product) => {
            const basePrice = product.base_price || 0

            if (product.pt_product_role_prices.length === 0) {
                csvContent += `${product.product_code},${basePrice},,,,\n`
            } else {
                product.pt_product_role_prices.forEach((rolePrice) => {
                    const discountedPrice = rolePrice.discounted_price || 0
                    const discount = basePrice - discountedPrice
                    const discountPercentage = basePrice > 0 ? (discount / basePrice) * 100 : 0

                    csvContent += `${product.product_code},${basePrice},${rolePrice.role},${discountedPrice},${discount},${discountPercentage.toFixed(2)}%\n`
                })
            }
        })

        // Create a download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `tv-products-pricing-${new Date().toISOString().split("T")[0]}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
            title: "Export Successful",
            description: "Your data has been exported to CSV",
            variant: "default",
        })
    }

    // Add this function to the component (before the return statement)
    const getTabIndicatorStyles = (tab: string) => {
        return activeTab === tab ? "border-b-2 border-primary" : ""
    }

    const fetchProductInclusions = async (productCode: string) => {
        try {
            const response = await getProductInclusions(productCode);
            if (response.success && response.inclusions) {
                setProductInclusions(prev => ({
                    ...prev,
                    [productCode]: response.inclusions || []
                }));
            }
        } catch (error) {
            console.error(`Error fetching inclusions for ${productCode}:`, error);
        }
    };

    // Add this function to handle adding a new inclusion
    const handleAddInclusion = async () => {
        try {
            if (!newInclusion.product_code || !newInclusion.inclusion) {
                toast({
                    title: "Error",
                    description: "Product code and inclusion text are required",
                    variant: "destructive",
                });
                return;
            }

            setIsCreatingInclusion(true);
            const result = await createProductInclusion({
                product_code: newInclusion.product_code,
                inclusion: newInclusion.inclusion,
            });

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Product inclusion added successfully",
                    variant: "default",
                });

                // Update local state
                if (result.inclusion) {
                    setProductInclusions(prev => {
                        const updatedInclusions = [...(prev[newInclusion.product_code] || []), result.inclusion!];
                        return {
                            ...prev,
                            [newInclusion.product_code]: updatedInclusions
                        };
                    });
                }

                setIsAddInclusionOpen(false);
                setNewInclusion({ product_code: "", inclusion: "" });

                // Refresh inclusions for this product
                fetchProductInclusions(newInclusion.product_code);
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to add inclusion",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error adding inclusion:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsCreatingInclusion(false);
        }
    };

    // Add this function to handle updating an inclusion
    const handleUpdateInclusion = async () => {
        if (!editingInclusion) return;

        try {
            setIsUpdatingInclusion(true);
            const result = await updateProductInclusion(editingInclusion.id, {
                inclusion: editingInclusion.inclusion,
            });

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Product inclusion updated successfully",
                    variant: "default",
                });

                // Update local state
                setProductInclusions(prev => {
                    const productCode = editingInclusion.product_code;
                    const updatedInclusions = (prev[productCode] || []).map(inc =>
                        inc.id === editingInclusion.id ? editingInclusion : inc
                    );

                    return {
                        ...prev,
                        [productCode]: updatedInclusions
                    };
                });

                setEditingInclusion(null);

                // Refresh inclusions for this product
                fetchProductInclusions(editingInclusion.product_code);
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to update inclusion",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error updating inclusion:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsUpdatingInclusion(false);
        }
    };

    // Add this function to confirm deletion of an inclusion
    const confirmDeleteInclusion = (id: number) => {
        setInclusionToDelete(id);
        setIsDeleteInclusionDialogOpen(true);
    };

    // Add this function to handle deleting an inclusion
    const handleDeleteInclusion = async () => {
        if (!inclusionToDelete) return;

        try {
            setIsDeletingInclusion(inclusionToDelete);
            const result = await deleteProductInclusion(inclusionToDelete);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Product inclusion deleted successfully",
                    variant: "default",
                });

                // Update local state
                setProductInclusions(prev => {
                    const newState = { ...prev };

                    // Find which product this inclusion belongs to
                    for (const [productCode, inclusions] of Object.entries(newState)) {
                        const updatedInclusions = inclusions.filter(inc => inc.id !== inclusionToDelete);
                        newState[productCode] = updatedInclusions;
                    }

                    return newState;
                });
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to delete inclusion",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error deleting inclusion:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsDeletingInclusion(null);
            setIsDeleteInclusionDialogOpen(false);
            setInclusionToDelete(null);
        }
    };

    // Modify the toggleProductExpansion function to fetch inclusions when a product is expanded

    // Add this inside the Card component in the grid view, after the CardContent section and before the CardFooter
    // Find the line that says <CardFooter className="pt-2 border-t flex justify-between"> and add this before it:

    // Add this to the table view - find the TableRow component in the table view and add a new column
    // Add this to the TableHeader after the "Actions" column:

    // And add this to the TableRow after the Actions cell:

    // Add this dialog for managing inclusions at the end of the component, before the closing return statement

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container mx-auto py-8 px-4 md:px-6"
            variants={containerVariants}
        >
            {/* Header Section */}
            <motion.div
                variants={itemVariants}
                className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Tv className="h-6 w-6 text-primary" />
                        TV Product & Pricing Dashboard
                    </h1>
                    <p className="text-muted-foreground">Comprehensive management of TV products and role-based pricing</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={refreshData}>
                                    <RefreshCw id="refresh-button" className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Refresh data</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={exportToCSV}>
                                    <Download className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Export to CSV</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New TV Product</DialogTitle>
                                <DialogDescription>
                                    Create a new TV product with a base price. You can add role-specific pricing later.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="product_code" className="text-right">
                                        Product Code
                                    </Label>
                                    <Input
                                        id="product_code"
                                        value={newProduct.product_code}
                                        onChange={(e) => setNewProduct({ ...newProduct, product_code: e.target.value })}
                                        className="col-span-3"
                                        placeholder="e.g., TV99, TV200"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="base_price" className="text-right">
                                        Base Price (₱)
                                    </Label>
                                    <Input
                                        id="base_price"
                                        type="number"
                                        value={newProduct.base_price}
                                        onChange={(e) => setNewProduct({ ...newProduct, base_price: Number.parseFloat(e.target.value) })}
                                        className="col-span-3"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddProductOpen(false)} disabled={isCreatingProduct}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddProduct} disabled={isCreatingProduct}>
                                    {isCreatingProduct ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Save Product"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAddRolePriceOpen} onOpenChange={setIsAddRolePriceOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Role Price
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-7xl">
                            <DialogHeader>
                                <DialogTitle>Add New Role Price</DialogTitle>
                                <DialogDescription>Set a discounted price for a specific role and TV product.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="role_product_code" className="text-right">
                                        Product Code
                                    </Label>
                                    <Select
                                        value={newRolePrice.product_code}
                                        onValueChange={(value) => {
                                            const product = products.find((p) => p.product_code === value)
                                            const basePrice = product?.base_price || 0
                                            setNewRolePrice({
                                                ...newRolePrice,
                                                product_code: value,
                                                discounted_price: basePrice,
                                                discountValue: 0,
                                            })
                                        }}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select a product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem key={product.product_code} value={product.product_code}>
                                                    {product.product_code} ({formatCurrency(product.base_price)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="role" className="text-right">
                                        Role
                                    </Label>
                                    <Select
                                        value={newRolePrice.role}
                                        onValueChange={(value) => setNewRolePrice({ ...newRolePrice, role: value })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AVAILABLE_ROLES.map((role) => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="discount-type" className="text-right">
                                        Discount Type
                                    </Label>
                                    <Select
                                        value={newRolePrice.discountType}
                                        onValueChange={(value: "fixed" | "percentage") => {
                                            const product = products.find((p) => p.product_code === newRolePrice.product_code)
                                            const basePrice = product?.base_price || 0

                                            // Reset discount value when changing type
                                            setNewRolePrice({
                                                ...newRolePrice,
                                                discountType: value,
                                                discountValue: 0,
                                                discounted_price: basePrice,
                                            })
                                        }}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select discount type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="discount-value" className="text-right">
                                        {newRolePrice.discountType === "fixed" ? "Discount Amount" : "Discount Percentage"}
                                    </Label>
                                    <Input
                                        id="discount-value"
                                        type="number"
                                        value={newRolePrice.discountValue}
                                        onChange={(e) => {
                                            const value = Number.parseFloat(e.target.value) || 0
                                            const product = products.find((p) => p.product_code === newRolePrice.product_code)
                                            const basePrice = product?.base_price || 0
                                            let discountedPrice = basePrice

                                            if (newRolePrice.discountType === "fixed") {
                                                discountedPrice = Math.max(0, basePrice - value)
                                            } else {
                                                // Percentage discount
                                                discountedPrice = basePrice * (1 - value / 100)
                                            }

                                            // Round to 2 decimal places
                                            discountedPrice = Math.round(discountedPrice * 100) / 100

                                            setNewRolePrice({
                                                ...newRolePrice,
                                                discountValue: value,
                                                discounted_price: discountedPrice,
                                            })
                                        }}
                                        className="col-span-3"
                                        placeholder={newRolePrice.discountType === "fixed" ? "e.g., 100" : "e.g., 10"}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="discounted_price" className="text-right">
                                        Final Price (₱)
                                    </Label>
                                    <Input
                                        id="discounted_price"
                                        type="number"
                                        value={newRolePrice.discounted_price}
                                        onChange={(e) => {
                                            const discountedPrice = Number.parseFloat(e.target.value) || 0
                                            const product = products.find((p) => p.product_code === newRolePrice.product_code)
                                            const basePrice = product?.base_price || 0
                                            let discountValue = 0

                                            if (newRolePrice.discountType === "fixed") {
                                                discountValue = Math.max(0, basePrice - discountedPrice)
                                            } else {
                                                // Percentage discount
                                                discountValue = basePrice > 0 ? ((basePrice - discountedPrice) / basePrice) * 100 : 0
                                            }

                                            setNewRolePrice({
                                                ...newRolePrice,
                                                discounted_price: discountedPrice,
                                                discountValue: discountValue,
                                            })
                                        }}
                                        className="col-span-3"
                                        placeholder="0.00"
                                    />
                                </div>
                                {newRolePrice.product_code && (
                                    <div className="col-span-4 bg-muted p-3 rounded-md">
                                        <div className="text-sm">
                                            {(() => {
                                                const product = products.find((p) => p.product_code === newRolePrice.product_code)
                                                if (!product) return null

                                                const basePrice = product.base_price || 0
                                                const discountedPrice = newRolePrice.discounted_price
                                                const discount = basePrice - discountedPrice
                                                const discountPercentage = basePrice > 0 ? (discount / basePrice) * 100 : 0

                                                return (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between">
                                                            <span>Base Price:</span>
                                                            <span className="font-medium">{formatCurrency(basePrice)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Discount:</span>
                                                            <span className="font-medium">
                                                                {formatCurrency(discount)} ({discountPercentage.toFixed(2)}%)
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                )}
                                <div className="col-span-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Quick Presets:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {[5, 10, 15, 20, 25].map((percent) => (
                                            <Button
                                                key={percent}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const product = products.find((p) => p.product_code === newRolePrice.product_code)
                                                    if (!product) return

                                                    const basePrice = product.base_price || 0
                                                    const discountedPrice = basePrice * (1 - percent / 100)

                                                    setNewRolePrice({
                                                        ...newRolePrice,
                                                        discountType: "percentage",
                                                        discountValue: percent,
                                                        discounted_price: Math.round(discountedPrice * 100) / 100,
                                                    })
                                                }}
                                            >
                                                {percent}% off
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {newRolePrice.discounted_price >
                                (products.find((p) => p.product_code === newRolePrice.product_code)?.base_price || 0) && (
                                    <div className="col-span-4 bg-yellow-100 text-yellow-800 p-3 rounded-md">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm font-medium">Warning: Discounted price is higher than base price</span>
                                        </div>
                                    </div>
                                )}
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddRolePriceOpen(false)} disabled={isCreatingRolePrice}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddRolePrice}
                                    disabled={isCreatingRolePrice || !newRolePrice.product_code || !newRolePrice.role}
                                >
                                    {isCreatingRolePrice ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Save Role Price"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {selectedProducts.length > 0 && (
                        <Button variant="destructive" onClick={() => setIsBulkOperationDialogOpen(true)} className="ml-auto">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Selected ({selectedProducts.length})
                        </Button>
                    )}
                </div>
            </motion.div>

            {/* Analytics Overview */}
            <motion.div
                variants={itemVariants}
                className="mb-6"
                initial={{ opacity: 0, height: showAnalytics ? "auto" : 0 }}
                animate={{
                    opacity: showAnalytics ? 1 : 0,
                    height: showAnalytics ? "auto" : 0,
                }}
                transition={{ duration: 0.3 }}
            >
                {showAnalytics && (
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                    Analytics Overview
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => setShowAnalytics(false)} className="h-8 px-2">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>Key metrics and insights for your TV products</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <Card className="overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                                        <Tv className="h-4 w-4 text-primary" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.totalProducts}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {isLoading ? "Loading..." : `${stats.totalProducts} TV products available`}
                                        </p>
                                    </CardContent>
                                    <div className="bg-primary/10 h-1">
                                        <motion.div
                                            className="bg-primary h-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, stats.totalProducts * 5)}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                </Card>
                                <Card className="overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Role Prices</CardTitle>
                                        <Tag className="h-4 w-4 text-primary" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.totalRolePrices}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {isLoading ? "Loading..." : `${stats.totalRolePrices} role-specific prices`}
                                        </p>
                                    </CardContent>
                                    <div className="bg-primary/10 h-1">
                                        <motion.div
                                            className="bg-primary h-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, stats.totalRolePrices * 2)}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                </Card>
                                <Card className="overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Avg. Base Price</CardTitle>
                                        <DollarSign className="h-4 w-4 text-primary" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatCurrency(stats.averageBasePrice)}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {isLoading ? "Loading..." : "Average product base price"}
                                        </p>
                                    </CardContent>
                                    <div className="bg-primary/10 h-1">
                                        <motion.div
                                            className="bg-primary h-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (stats.averageBasePrice / 1000) * 100)}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                </Card>
                                <Card className="overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Avg. Discount</CardTitle>
                                        <Percent className="h-4 w-4 text-primary" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatCurrency(stats.averageDiscount)}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {isLoading ? "Loading..." : "Average discount per role price"}
                                        </p>
                                    </CardContent>
                                    <div className="bg-primary/10 h-1">
                                        <motion.div
                                            className="bg-primary h-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (stats.averageDiscount / 500) * 100)}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Role Price Distribution</CardTitle>
                                        <CardDescription>Number of prices set for each role</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {stats.roleDistribution.map((role) => (
                                                <div key={role.role} className="flex items-center">
                                                    <div className="w-36 flex-shrink-0 font-medium text-sm">{role.role}</div>
                                                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                                        <motion.div
                                                            className={`h-full bg-${role.color}-500`}
                                                            style={{ width: `${Math.min(100, (role.count / stats.totalRolePrices) * 100)}%` }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, (role.count / stats.totalRolePrices) * 100)}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                    <div className="w-12 text-right text-sm font-medium ml-2">{role.count}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Average Discount by Role</CardTitle>
                                        <CardDescription>Percentage discount for each role</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {stats.discountsByRole.map((role) => (
                                                <div key={role.role} className="flex items-center">
                                                    <div className="w-36 flex-shrink-0 font-medium text-sm">{role.role}</div>
                                                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                                        <motion.div
                                                            className={`h-full bg-${role.color}-500`}
                                                            style={{ width: `${Math.min(100, role.averageDiscount)}%` }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, role.averageDiscount)}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                    <div className="w-16 text-right text-sm font-medium ml-2">
                                                        {role.averageDiscount.toFixed(1)}%
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </motion.div>

            {/* Search and Filter Bar */}
            <motion.div variants={itemVariants} className="mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search products..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <Select value={filterRole} onValueChange={setFilterRole}>
                                    <SelectTrigger className="w-full md:w-[200px]">
                                        <SelectValue placeholder="Filter by role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        {AVAILABLE_ROLES.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "h-2 w-2 rounded-full p-0",
                                                            role.value === "Elite_Plus_Distributor_Package" && "bg-blue-500",
                                                            role.value === "Elite_Distributor_Package" && "bg-indigo-500",
                                                            role.value === "Basic_Merchant_Package" && "bg-green-500",
                                                            role.value === "Premium_Merchant_Package" && "bg-purple-500",
                                                        )}
                                                    />
                                                    {role.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={showAnalytics ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setShowAnalytics(!showAnalytics)}
                                        className="h-10"
                                    >
                                        <BarChart3 className="mr-2 h-4 w-4" />
                                        {showAnalytics ? "Hide Analytics" : "Show Analytics"}
                                    </Button>

                                    <Button
                                        variant={showFilters ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="h-10"
                                    >
                                        <Filter className="mr-2 h-4 w-4" />
                                        {showFilters ? "Hide Filters" : "Show Filters"}
                                    </Button>

                                    <Button
                                        variant={activeView === "grid" ? "default" : "outline"}
                                        size="icon"
                                        onClick={() => setActiveView("grid")}
                                        className="h-10 w-10"
                                    >
                                        <Layers className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        variant={activeView === "table" ? "default" : "outline"}
                                        size="icon"
                                        onClick={() => setActiveView("table")}
                                        className="h-10 w-10"
                                    >
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t"
                                >
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">Role Price Status</Label>
                                        <div className="flex gap-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="has-role-prices"
                                                    checked={filterHasRolePrices === true}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setFilterHasRolePrices(true)
                                                        } else if (filterHasRolePrices === true) {
                                                            setFilterHasRolePrices(null)
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor="has-role-prices" className="text-sm font-normal">
                                                    Has role prices
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="no-role-prices"
                                                    checked={filterHasRolePrices === false}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setFilterHasRolePrices(false)
                                                        } else if (filterHasRolePrices === false) {
                                                            setFilterHasRolePrices(null)
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor="no-role-prices" className="text-sm font-normal">
                                                    No role prices
                                                </Label>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">Price Range</Label>
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                type="number"
                                                placeholder="Min"
                                                value={filterPriceRange.min}
                                                onChange={(e) => setFilterPriceRange({ ...filterPriceRange, min: Number(e.target.value) || 0 })}
                                                className="w-24"
                                            />
                                            <span>to</span>
                                            <Input
                                                type="number"
                                                placeholder="Max (optional)"
                                                value={filterPriceRange.max === null ? "" : filterPriceRange.max}
                                                onChange={(e) => {
                                                    const value = e.target.value === "" ? null : Number(e.target.value)
                                                    setFilterPriceRange({ ...filterPriceRange, max: value })
                                                }}
                                                className="w-24"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-end">
                                        <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
                                            Reset Filters
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Batch Pricing Card */}
            <motion.div variants={itemVariants} className="mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5 text-primary" />
                            Batch Role Pricing
                        </CardTitle>
                        <CardDescription>Quickly set discounted prices for all TV products based on role</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="batch-role">Select Role</Label>
                                <Select
                                    value={batchPricing.role}
                                    onValueChange={(value) => setBatchPricing({ ...batchPricing, role: value })}
                                >
                                    <SelectTrigger id="batch-role" className="mt-1">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AVAILABLE_ROLES.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="discount-type">Discount Type</Label>
                                <Select
                                    value={batchPricing.discountType}
                                    onValueChange={(value) =>
                                        setBatchPricing({ ...batchPricing, discountType: value as "percentage" | "fixed" })
                                    }
                                >
                                    <SelectTrigger id="discount-type" className="mt-1">
                                        <SelectValue placeholder="Select discount type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="discount-value">
                                    {batchPricing.discountType === "percentage" ? "Discount Percentage" : "Discount Amount"}
                                </Label>
                                <Input
                                    id="discount-value"
                                    type="number"
                                    placeholder={batchPricing.discountType === "percentage" ? "e.g., 10" : "e.g., 100"}
                                    className="mt-1"
                                    value={batchPricing.discountValue}
                                    onChange={(e) =>
                                        setBatchPricing({
                                            ...batchPricing,
                                            discountValue: Number.parseFloat(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                            <div className="flex items-end">
                                <Button className="w-full" onClick={applyBatchPricing} disabled={!batchPricing.role || isApplyingBatch}>
                                    {isApplyingBatch ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Applying...
                                        </>
                                    ) : (
                                        <>
                                            Apply to{" "}
                                            {selectedProducts.length > 0 ? `Selected (${selectedProducts.length})` : "All TV Products"}
                                            {batchPricing.role && (
                                                <Badge className="ml-2 bg-primary/20">
                                                    {batchPricing.discountType === "percentage"
                                                        ? `-${batchPricing.discountValue}%`
                                                        : `-₱${batchPricing.discountValue}`}
                                                </Badge>
                                            )}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {showDiscountPreview && batchPricing.role && products.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 p-3 bg-muted rounded-md text-sm"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="font-medium">Preview:</div>
                                    <Button variant="ghost" size="sm" onClick={() => setShowDiscountPreview(false)} className="h-6 px-2">
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {products.slice(0, 4).map((product) => {
                                        const basePrice = product.base_price || 0
                                        let discountedPrice = basePrice

                                        if (batchPricing.discountType === "percentage") {
                                            const discountPercentage = batchPricing.discountValue / 100
                                            discountedPrice = basePrice * (1 - discountPercentage)
                                        } else {
                                            discountedPrice = Math.max(0, basePrice - batchPricing.discountValue)
                                        }

                                        return (
                                            <div key={product.product_code} className="flex justify-between">
                                                <span>{product.product_code}:</span>
                                                <span className="font-medium">
                                                    {formatCurrency(basePrice)} → {formatCurrency(discountedPrice)}
                                                </span>
                                            </div>
                                        )
                                    })}
                                    {products.length > 4 && (
                                        <div className="col-span-2 text-center text-muted-foreground">
                                            ...and {products.length - 4} more products
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Copy className="h-5 w-5 text-primary" />
                            Copy Role Pricing
                        </CardTitle>
                        <CardDescription>Copy pricing from one role to another across all products</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="source-role">Source Role</Label>
                                <Select
                                    defaultValue=""
                                    onValueChange={(value) => {
                                        // Implementation for source role selection
                                    }}
                                >
                                    <SelectTrigger id="source-role" className="mt-1">
                                        <SelectValue placeholder="Select source role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AVAILABLE_ROLES.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="target-role">Target Role</Label>
                                <Select
                                    defaultValue=""
                                    onValueChange={(value) => {
                                        // Implementation for target role selection
                                    }}
                                >
                                    <SelectTrigger id="target-role" className="mt-1">
                                        <SelectValue placeholder="Select target role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AVAILABLE_ROLES.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="adjustment-type">Adjustment (Optional)</Label>
                                <div className="grid grid-cols-2 gap-4 mt-1">
                                    <Select defaultValue="none">
                                        <SelectTrigger id="adjustment-type">
                                            <SelectValue placeholder="Select adjustment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Adjustment</SelectItem>
                                            <SelectItem value="percentage">Additional Percentage</SelectItem>
                                            <SelectItem value="fixed">Additional Fixed Amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input type="number" placeholder="Adjustment value" defaultValue={0} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button>Copy Pricing</Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Main Content */}
            <motion.div variants={itemVariants} initial={{ opacity: 0, y: 20 }} animate={controls} className="mb-6">
                {/* Grid View */}
                {activeView === "grid" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, index) => (
                                <Card key={index} className="overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <Skeleton className="h-6 w-32" />
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-3/4" />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Skeleton className="h-8 w-full" />
                                    </CardFooter>
                                </Card>
                            ))
                        ) : filteredProducts.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg">
                                <Tv className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No TV Products Found</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    {searchTerm ||
                                        filterRole !== "all" ||
                                        filterHasRolePrices !== null ||
                                        filterPriceRange.min > 0 ||
                                        filterPriceRange.max !== null
                                        ? "Try adjusting your filters or search term"
                                        : "Start by adding your first TV product"}
                                </p>
                                <Button onClick={() => setIsAddProductOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add TV Product
                                </Button>
                            </div>
                        ) : (
                            filteredProducts.map((product) => (
                                <motion.div
                                    key={product.product_code}
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover="hover"
                                    layout
                                >
                                    <Card className="overflow-hidden h-full flex flex-col">
                                        <CardHeader className="pb-2 flex flex-row items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={selectedProducts.includes(product.product_code)}
                                                        onCheckedChange={() => toggleProductSelection(product.product_code)}
                                                        className="mr-1"
                                                    />
                                                    <CardTitle className="text-lg">{product.product_code}</CardTitle>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CardDescription>Base Price: {formatCurrency(product.base_price)}</CardDescription>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => setEditingProduct(product)}
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "ml-auto",
                                                    product.pt_product_role_prices.length > 0 ? "bg-primary/10 hover:bg-primary/20" : "bg-muted",
                                                )}
                                            >
                                                {product.pt_product_role_prices.length} roles
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="pb-2 flex-grow">
                                            {product.pt_product_role_prices.length > 0 ? (
                                                <div className="space-y-2">
                                                    {product.pt_product_role_prices.map((rolePrice) => {
                                                        const basePrice = product.base_price || 0
                                                        const discountedPrice = rolePrice.discounted_price || 0
                                                        const discount = basePrice - discountedPrice
                                                        const discountPercentage = basePrice > 0 ? (discount / basePrice) * 100 : 0

                                                        return (
                                                            <div
                                                                key={rolePrice.role}
                                                                className="flex justify-between items-center p-2 bg-muted/50 rounded-md"
                                                            >
                                                                <div>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn(
                                                                            "font-medium mb-1",
                                                                            rolePrice.role === "Elite_Plus_Distributor_Package" &&
                                                                            "bg-blue-100 text-blue-800",
                                                                            rolePrice.role === "Elite_Distributor_Package" && "bg-indigo-100 text-indigo-800",
                                                                            rolePrice.role === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                                                                            rolePrice.role === "Premium_Merchant_Package" && "bg-purple-100 text-purple-800",
                                                                        )}
                                                                    >
                                                                        {getRoleDisplayName(rolePrice.role)}
                                                                    </Badge>
                                                                    <div className="text-sm">{formatCurrency(discountedPrice)}</div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="bg-primary/10">
                                                                        -{discountPercentage.toFixed(1)}%
                                                                    </Badge>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0"
                                                                        onClick={() => {
                                                                            const product = products.find((p) => p.product_code === rolePrice.product_code)
                                                                            const basePrice = product?.base_price || 0
                                                                            const discountedPrice = rolePrice.discounted_price || 0
                                                                            const discount = basePrice - discountedPrice
                                                                            const discountPercentage = basePrice > 0 ? (discount / basePrice) * 100 : 0

                                                                            setEditingRolePrice({
                                                                                ...rolePrice,
                                                                                discountType: "fixed",
                                                                                discountValue: discount,
                                                                            })
                                                                        }}
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}

                                                    {/* All role prices are now always shown */}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full py-4">
                                                    <Tag className="h-8 w-8 text-muted-foreground mb-2" />
                                                    <p className="text-sm text-muted-foreground text-center">No role prices set</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-2"
                                                        onClick={() => {
                                                            setNewRolePrice({
                                                                product_code: product.product_code,
                                                                role: "",
                                                                discounted_price: product.base_price || 0,
                                                                discountType: "fixed",
                                                                discountValue: 0,
                                                            })
                                                            setIsAddRolePriceOpen(true)
                                                        }}
                                                    >
                                                        <Plus className="mr-1 h-3 w-3" />
                                                        Add Role Price
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                        {expandedProduct === product.product_code && (
                                            <div className="px-6 pb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-sm font-medium">Product Inclusions</h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setNewInclusion({
                                                                product_code: product.product_code,
                                                                inclusion: "",
                                                            });
                                                            setIsAddInclusionOpen(true);
                                                        }}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Add Inclusion
                                                    </Button>
                                                </div>

                                                {!productInclusions[product.product_code] ? (
                                                    <div className="flex justify-center py-4">
                                                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                                                    </div>
                                                ) : productInclusions[product.product_code].length === 0 ? (
                                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                                        No inclusions added yet
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {productInclusions[product.product_code].map((inclusion) => (
                                                            <div key={inclusion.id} className="flex items-start justify-between p-2 bg-muted/30 rounded-md">
                                                                <div className="flex-1 text-sm">
                                                                    {editingInclusion?.id === inclusion.id ? (
                                                                        <div className="flex gap-2">
                                                                            <Input
                                                                                value={editingInclusion.inclusion}
                                                                                onChange={(e) => setEditingInclusion({
                                                                                    ...editingInclusion,
                                                                                    inclusion: e.target.value
                                                                                })}
                                                                                className="text-sm"
                                                                            />
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={handleUpdateInclusion}
                                                                                disabled={isUpdatingInclusion}
                                                                            >
                                                                                {isUpdatingInclusion ? (
                                                                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                                                                ) : (
                                                                                    <Save className="h-3 w-3" />
                                                                                )}
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => setEditingInclusion(null)}
                                                                                disabled={isUpdatingInclusion}
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        inclusion.inclusion
                                                                    )}
                                                                </div>
                                                                {editingInclusion?.id !== inclusion.id && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0"
                                                                            onClick={() => setEditingInclusion(inclusion)}
                                                                        >
                                                                            <Edit className="h-3 w-3" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0 text-destructive"
                                                                            onClick={() => confirmDeleteInclusion(inclusion.id)}
                                                                            disabled={isDeletingInclusion === inclusion.id}
                                                                        >
                                                                            {isDeletingInclusion === inclusion.id ? (
                                                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                                                            ) : (
                                                                                <Trash2 className="h-3 w-3" />
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <CardFooter className="pt-2 border-t flex justify-between">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)}>
                                                <Edit className="mr-1 h-4 w-4" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => confirmDeleteProduct(product.product_code)}
                                            >
                                                <Trash2 className="mr-1 h-4 w-4" />
                                                Delete
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {/* Table View */}
                {activeView === "table" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tv className="h-5 w-5 text-primary" />
                                TV Products
                            </CardTitle>
                            <CardDescription>Comprehensive list of TV products and their role-based pricing</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <div key={index} className="flex items-center space-x-4">
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-md border overflow-hidden" ref={tableRef}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[40px]">
                                                    <Checkbox
                                                        checked={selectedProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                                                        onCheckedChange={toggleAllProducts}
                                                    />
                                                </TableHead>
                                                <TableHead className="cursor-pointer" onClick={() => requestSort("product_code")}>
                                                    <div className="flex items-center gap-1">
                                                        Product Code
                                                        <ArrowUpDown
                                                            className={cn(
                                                                "h-3 w-3 transition-all",
                                                                getSortDirection("product_code") === "ascending" && "rotate-180",
                                                                !getSortDirection("product_code") && "opacity-30",
                                                            )}
                                                        />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="cursor-pointer" onClick={() => requestSort("base_price")}>
                                                    <div className="flex items-center gap-1">
                                                        Base Price
                                                        <ArrowUpDown
                                                            className={cn(
                                                                "h-3 w-3 transition-all",
                                                                getSortDirection("base_price") === "ascending" && "rotate-180",
                                                                !getSortDirection("base_price") && "opacity-30",
                                                            )}
                                                        />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="cursor-pointer" onClick={() => requestSort("role_count")}>
                                                    <div className="flex items-center gap-1">
                                                        Role Prices
                                                        <ArrowUpDown
                                                            className={cn(
                                                                "h-3 w-3 transition-all",
                                                                getSortDirection("role_count") === "ascending" && "rotate-180",
                                                                !getSortDirection("role_count") && "opacity-30",
                                                            )}
                                                        />
                                                    </div>
                                                </TableHead>
                                                <TableHead>Role Price Details</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                                <TableHead>Inclusions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <AnimatePresence>
                                                {filteredProducts.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center py-6">
                                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                                <Tv className="h-8 w-8 text-muted-foreground" />
                                                                <p className="text-muted-foreground">
                                                                    {searchTerm ||
                                                                        filterRole !== "all" ||
                                                                        filterHasRolePrices !== null ||
                                                                        filterPriceRange.min > 0 ||
                                                                        filterPriceRange.max !== null
                                                                        ? "No matching products found. Try adjusting your filters."
                                                                        : "No TV products found"}
                                                                </p>
                                                                <Button variant="outline" size="sm" onClick={() => setIsAddProductOpen(true)}>
                                                                    <Plus className="mr-2 h-4 w-4" />
                                                                    Add Your First TV Product
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredProducts.map((product) => (
                                                        <motion.tr
                                                            key={product.product_code}
                                                            initial="hidden"
                                                            animate="visible"
                                                            exit="removed"
                                                            whileHover="hover"
                                                            variants={tableRowVariants}
                                                            className="hover:bg-muted/50"
                                                            layout
                                                        >
                                                            <TableCell>
                                                                <Checkbox
                                                                    checked={selectedProducts.includes(product.product_code)}
                                                                    onCheckedChange={() => toggleProductSelection(product.product_code)}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="font-medium whitespace-nowrap">{product.product_code}</TableCell>
                                                            <TableCell className="whitespace-nowrap">
                                                                {editingProduct?.product_code === product.product_code ? (
                                                                    <div className="flex items-center space-x-2">
                                                                        <Input
                                                                            type="number"
                                                                            value={editingProduct.base_price || 0}
                                                                            onChange={(e) =>
                                                                                setEditingProduct({
                                                                                    ...editingProduct,
                                                                                    base_price: Number.parseFloat(e.target.value),
                                                                                })
                                                                            }
                                                                            className="w-24"
                                                                            disabled={isUpdatingProduct}
                                                                        />
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            onClick={handleUpdateProduct}
                                                                            disabled={isUpdatingProduct}
                                                                        >
                                                                            {isUpdatingProduct ? (
                                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                                            ) : (
                                                                                <Save className="h-4 w-4" />
                                                                            )}
                                                                        </Button>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            onClick={() => setEditingProduct(null)}
                                                                            disabled={isUpdatingProduct}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <span>{formatCurrency(product.base_price)}</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="whitespace-nowrap">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        product.pt_product_role_prices.length > 0
                                                                            ? "bg-primary/10 hover:bg-primary/20"
                                                                            : "",
                                                                    )}
                                                                >
                                                                    {product.pt_product_role_prices.length} roles
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {product.pt_product_role_prices.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {product.pt_product_role_prices.map((rolePrice) => {
                                                                            const basePrice = product.base_price || 0
                                                                            const discountedPrice = rolePrice.discounted_price || 0
                                                                            const discountPercentage =
                                                                                basePrice > 0 ? ((basePrice - discountedPrice) / basePrice) * 100 : 0

                                                                            return (
                                                                                <TooltipProvider key={rolePrice.role}>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Badge
                                                                                                variant="outline"
                                                                                                className={cn(
                                                                                                    "cursor-pointer",
                                                                                                    rolePrice.role === "Elite_Plus_Distributor_Package" &&
                                                                                                    "bg-blue-100 text-blue-800",
                                                                                                    rolePrice.role === "Elite_Distributor_Package" &&
                                                                                                    "bg-indigo-100 text-indigo-800",
                                                                                                    rolePrice.role === "Basic_Merchant_Package" &&
                                                                                                    "bg-green-100 text-green-800",
                                                                                                    rolePrice.role === "Premium_Merchant_Package" &&
                                                                                                    "bg-purple-100 text-purple-800",
                                                                                                )}
                                                                                                onClick={() => {
                                                                                                    const product = products.find(
                                                                                                        (p) => p.product_code === rolePrice.product_code,
                                                                                                    )
                                                                                                    const basePrice = product?.base_price || 0
                                                                                                    const discountedPrice = rolePrice.discounted_price || 0
                                                                                                    const discount = basePrice - discountedPrice
                                                                                                    const discountPercentage =
                                                                                                        basePrice > 0 ? ((basePrice - discountedPrice) / basePrice) * 100 : 0

                                                                                                    setEditingRolePrice({
                                                                                                        ...rolePrice,
                                                                                                        discountType: "fixed",
                                                                                                        discountValue: discount,
                                                                                                    })
                                                                                                }}
                                                                                            >
                                                                                                {getRoleDisplayName(rolePrice.role).split(" ")[0]}
                                                                                            </Badge>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent>
                                                                                            <div className="space-y-1">
                                                                                                <p className="font-medium">{getRoleDisplayName(rolePrice.role)}</p>
                                                                                                <div className="flex justify-between gap-4">
                                                                                                    <span>Price:</span>
                                                                                                    <span>{formatCurrency(discountedPrice)}</span>
                                                                                                </div>
                                                                                                <div className="flex justify-between gap-4">
                                                                                                    <span>Discount:</span>
                                                                                                    <span>{discountPercentage.toFixed(1)}%</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setNewRolePrice({
                                                                                product_code: product.product_code,
                                                                                role: "",
                                                                                discounted_price: product.base_price || 0,
                                                                                discountType: "fixed",
                                                                                discountValue: 0,
                                                                            })
                                                                            setIsAddRolePriceOpen(true)
                                                                        }}
                                                                    >
                                                                        <Plus className="mr-1 h-3 w-3" />
                                                                        Add Role Price
                                                                    </Button>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right whitespace-nowrap">
                                                                <div className="flex justify-end space-x-2">
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button size="icon" variant="ghost" onClick={() => setEditingProduct(product)}>
                                                                                    <Edit className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>Edit product</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>

                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    size="icon"
                                                                                    variant="ghost"
                                                                                    className="text-destructive"
                                                                                    onClick={() => confirmDeleteProduct(product.product_code)}
                                                                                    disabled={isDeletingProduct === product.product_code}
                                                                                >
                                                                                    {isDeletingProduct === product.product_code ? (
                                                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                                                    ) : (
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    )}
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>Delete product</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        // Fetch inclusions if not already loaded
                                                                        if (!productInclusions[product.product_code]) {
                                                                            fetchProductInclusions(product.product_code);
                                                                        }

                                                                        // Open dialog to manage inclusions
                                                                        setNewInclusion({
                                                                            product_code: product.product_code,
                                                                            inclusion: "",
                                                                        });
                                                                        setIsAddInclusionOpen(true);
                                                                    }}
                                                                >
                                                                    <FileText className="mr-1 h-3 w-3" />
                                                                    Manage Inclusions
                                                                    {productInclusions[product.product_code]?.length > 0 && (
                                                                        <Badge variant="secondary" className="ml-2">
                                                                            {productInclusions[product.product_code]?.length}
                                                                        </Badge>
                                                                    )}
                                                                </Button>
                                                            </TableCell>
                                                        </motion.tr>
                                                    ))
                                                )}
                                            </AnimatePresence>
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <div className="text-sm text-muted-foreground">
                                {filteredProducts.length} of {products.length} products
                            </div>
                            {(searchTerm ||
                                filterRole !== "all" ||
                                filterHasRolePrices !== null ||
                                filterPriceRange.min > 0 ||
                                filterPriceRange.max !== null) && (
                                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                                        Clear Filters
                                    </Button>
                                )}
                        </CardFooter>
                    </Card>
                )}
            </motion.div>

            {/* Confirmation Dialogs */}
            <AlertDialog open={isDeleteProductDialogOpen} onOpenChange={setIsDeleteProductDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete the product <span className="font-bold">{productToDelete}</span> and
                            all its associated role prices. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingProduct !== null}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProduct}
                            disabled={isDeletingProduct !== null}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeletingProduct ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Product"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteRolePriceDialogOpen} onOpenChange={setIsDeleteRolePriceDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete the role price for{" "}
                            <span className="font-bold">{rolePriceToDelete?.productCode}</span> and role{" "}
                            <span className="font-bold">{rolePriceToDelete?.role && getRoleDisplayName(rolePriceToDelete.role)}</span>
                            . This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingRolePrice !== null}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteRolePrice}
                            disabled={isDeletingRolePrice !== null}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeletingRolePrice ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Role Price"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkOperationDialogOpen} onOpenChange={setIsBulkOperationDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bulk Delete Products</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to delete {selectedProducts.length} products and all their associated role prices. This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isBulkDeleting ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Selected Products"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {editingRolePrice && (
                <Dialog open={!!editingRolePrice} onOpenChange={(open) => !open && setEditingRolePrice(null)}>
                    <DialogContent className="max-w-7xl">
                        <DialogHeader>
                            <DialogTitle>Edit Role Price</DialogTitle>
                            <DialogDescription>
                                Update the price for {editingRolePrice.product_code} - {getRoleDisplayName(editingRolePrice.role)}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-discount-type" className="text-right">
                                    Discount Type
                                </Label>
                                <Select
                                    value={editingRolePrice.discountType || "fixed"}
                                    onValueChange={(value: "fixed" | "percentage") => {
                                        const product = products.find((p) => p.product_code === editingRolePrice.product_code)
                                        const basePrice = product?.base_price || 0
                                        const currentDiscountedPrice = editingRolePrice.discounted_price || 0

                                        let discountValue = 0
                                        if (value === "fixed") {
                                            discountValue = basePrice - currentDiscountedPrice
                                        } else {
                                            discountValue = basePrice > 0 ? ((basePrice - currentDiscountedPrice) / basePrice) * 100 : 0
                                        }

                                        setEditingRolePrice({
                                            ...editingRolePrice,
                                            discountType: value,
                                            discountValue: discountValue,
                                        })
                                    }}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select discount type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-discount-value" className="text-right">
                                    {(editingRolePrice.discountType || "fixed") === "fixed" ? "Discount Amount" : "Discount Percentage"}
                                </Label>
                                <Input
                                    id="edit-discount-value"
                                    type="number"
                                    value={editingRolePrice.discountValue || 0}
                                    onChange={(e) => {
                                        const value = Number.parseFloat(e.target.value) || 0
                                        const product = products.find((p) => p.product_code === editingRolePrice.product_code)
                                        const basePrice = product?.base_price || 0
                                        let discountedPrice = basePrice

                                        if ((editingRolePrice.discountType || "fixed") === "fixed") {
                                            discountedPrice = Math.max(0, basePrice - value)
                                        } else {
                                            // Percentage discount
                                            discountedPrice = basePrice * (1 - value / 100)
                                        }

                                        // Round to 2 decimal places
                                        discountedPrice = Math.round(discountedPrice * 100) / 100

                                        setEditingRolePrice({
                                            ...editingRolePrice,
                                            discountValue: value,
                                            discounted_price: discountedPrice,
                                        })
                                    }}
                                    className="col-span-3"
                                    placeholder={(editingRolePrice.discountType || "fixed") === "fixed" ? "e.g., 100" : "e.g., 10"}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-discounted-price" className="text-right">
                                    Final Price (₱)
                                </Label>
                                <Input
                                    id="edit-discounted-price"
                                    type="number"
                                    value={editingRolePrice.discounted_price || 0}
                                    onChange={(e) => {
                                        const discountedPrice = Number.parseFloat(e.target.value) || 0
                                        const product = products.find((p) => p.product_code === editingRolePrice.product_code)
                                        const basePrice = product?.base_price || 0
                                        let discountValue = 0

                                        if ((editingRolePrice.discountType || "fixed") === "fixed") {
                                            discountValue = Math.max(0, basePrice - discountedPrice)
                                        } else {
                                            // Percentage discount
                                            discountValue = basePrice > 0 ? ((basePrice - discountedPrice) / basePrice) * 100 : 0
                                        }

                                        setEditingRolePrice({
                                            ...editingRolePrice,
                                            discounted_price: discountedPrice,
                                            discountValue: discountValue,
                                        })
                                    }}
                                    className="col-span-3"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="col-span-4 bg-muted p-3 rounded-md">
                                <div className="text-sm">
                                    {(() => {
                                        const product = products.find((p) => p.product_code === editingRolePrice.product_code)
                                        if (!product) return null

                                        const basePrice = product.base_price || 0
                                        const discountedPrice = editingRolePrice.discounted_price || 0
                                        const discount = basePrice - discountedPrice
                                        const discountPercentage = basePrice > 0 ? (discount / basePrice) * 100 : 0

                                        return (
                                            <div className="space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Base Price:</span>
                                                    <span className="font-medium">{formatCurrency(basePrice)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Discount:</span>
                                                    <span className="font-medium">
                                                        {formatCurrency(discount)} ({discountPercentage.toFixed(2)}%)
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>
                            <div className="col-span-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Quick Presets:</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {[5, 10, 15, 20, 25].map((percent) => (
                                        <Button
                                            key={percent}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const product = products.find((p) => p.product_code === editingRolePrice.product_code)
                                                if (!product) return

                                                const basePrice = product.base_price || 0
                                                const discountedPrice = basePrice * (1 - percent / 100)

                                                setEditingRolePrice({
                                                    ...editingRolePrice,
                                                    discountType: "percentage",
                                                    discountValue: percent,
                                                    discounted_price: Math.round(discountedPrice * 100) / 100,
                                                })
                                            }}
                                        >
                                            {percent}% off
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {editingRolePrice.discounted_price >
                            (products.find((p) => p.product_code === editingRolePrice.product_code)?.base_price || 0) && (
                                <div className="col-span-4 bg-yellow-100 text-yellow-800 p-3 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="text-sm font-medium">Warning: Discounted price is higher than base price</span>
                                    </div>
                                </div>
                            )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingRolePrice(null)} disabled={isUpdatingRolePrice}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateRolePrice} disabled={isUpdatingRolePrice}>
                                {isUpdatingRolePrice ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {editingProduct && (
                <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Product Base Price</DialogTitle>
                            <DialogDescription>Update the base price for {editingProduct.product_code}</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-base-price" className="text-right">
                                    Base Price (₱)
                                </Label>
                                <Input
                                    id="edit-base-price"
                                    type="number"
                                    value={editingProduct.base_price || 0}
                                    onChange={(e) =>
                                        setEditingProduct({
                                            ...editingProduct,
                                            base_price: Number.parseFloat(e.target.value),
                                        })
                                    }
                                    className="col-span-3"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingProduct(null)} disabled={isUpdatingProduct}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateProduct} disabled={isUpdatingProduct}>
                                {isUpdatingProduct ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Help Popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button size="icon" variant="outline" className="rounded-full fixed bottom-6 right-6 shadow-lg">
                        <HelpCircle className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">TV Product Management Help</h4>
                            <p className="text-sm text-muted-foreground">Quick guide to managing your TV products and pricing</p>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                <span className="text-sm">Add new products or role prices</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                <span className="text-sm">Edit existing products or prices</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                <span className="text-sm">Apply batch pricing to all products</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                <span className="text-sm">Export data to CSV</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                <span className="text-sm">Switch between grid and table views</span>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Add Inclusion Dialog */}
            <Dialog open={isAddInclusionOpen} onOpenChange={setIsAddInclusionOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manage Product Inclusions</DialogTitle>
                        <DialogDescription>
                            Add or edit inclusions for product{' '}
                            {newInclusion?.product_code ?? 'Unknown Product'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            {/* Add New Inclusion */}
                            <Label htmlFor="inclusion">New Inclusion</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="inclusion"
                                    value={newInclusion.inclusion}
                                    onChange={(e) =>
                                        setNewInclusion({ ...newInclusion, inclusion: e.target.value })
                                    }
                                    placeholder="Enter product inclusion"
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleAddInclusion}
                                    disabled={isCreatingInclusion || !newInclusion.inclusion.trim()}
                                >
                                    {isCreatingInclusion ? (
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="mr-2 h-4 w-4" />
                                    )}
                                    Add
                                </Button>
                            </div>

                            {/* Current Inclusions List */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Current Inclusions</h4>
                                {!productInclusions[newInclusion?.product_code] ? (
                                    <div className="flex justify-center py-4">
                                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : productInclusions[newInclusion?.product_code]?.length === 0 ? (
                                    <div className="text-center py-4 text-muted-foreground">
                                        No inclusions added yet
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                        {productInclusions[newInclusion?.product_code]?.map(
                                            (inclusion) => (
                                                <div
                                                    key={inclusion.id}
                                                    className="flex items-start justify-between p-2 bg-muted/30 rounded-md"
                                                >
                                                    <div className="flex-1">
                                                        {editingInclusion?.id === inclusion.id ? (
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    value={editingInclusion.inclusion}
                                                                    onChange={(e) =>
                                                                        setEditingInclusion({
                                                                            ...editingInclusion,
                                                                            inclusion: e.target.value,
                                                                        })
                                                                    }
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={handleUpdateInclusion}
                                                                    disabled={isUpdatingInclusion}
                                                                >
                                                                    {isUpdatingInclusion ? (
                                                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        <Save className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => setEditingInclusion(null)}
                                                                    disabled={isUpdatingInclusion}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            inclusion.inclusion
                                                        )}
                                                    </div>
                                                    {editingInclusion?.id !== inclusion.id && (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => setEditingInclusion(inclusion)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-destructive"
                                                                onClick={() => confirmDeleteInclusion(inclusion.id)}
                                                                disabled={isDeletingInclusion === inclusion.id}
                                                            >
                                                                {isDeletingInclusion === inclusion.id ? (
                                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAddInclusionOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Inclusion Confirmation Dialog */}
            <AlertDialog open={isDeleteInclusionDialogOpen} onOpenChange={setIsDeleteInclusionDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete this product inclusion.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingInclusion !== null}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteInclusion}
                            disabled={isDeletingInclusion !== null}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeletingInclusion ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Inclusion"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    )
}
