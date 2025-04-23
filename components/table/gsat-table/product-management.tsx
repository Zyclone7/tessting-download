"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Edit, Trash2, Plus, Save, X, RefreshCw, Tag, Percent, DollarSign, Package } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  createGSATProduct,
  updateGSATProduct,
  deleteGSATProduct,
  getAllGSATProducts,
  createGSATProductRolePrice,
  updateGSATProductRolePrice,
  deleteGSATProductRolePrice,
} from "@/actions/gsat"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Define types based on your Prisma schema
type Product = {
  product_code: string
  base_price: number | null
  pt_product_role_prices: ProductRolePrice[]
}

type ProductRolePrice = {
  product_code: string
  role: string
  discounted_price: number | null
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

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isAddRolePriceOpen, setIsAddRolePriceOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingRolePrice, setEditingRolePrice] = useState<ProductRolePrice | null>(null)
  const [activeTab, setActiveTab] = useState("products")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Form states
  const [newProduct, setNewProduct] = useState({
    product_code: "",
    base_price: 0,
  })

  const [newRolePrice, setNewRolePrice] = useState({
    product_code: "",
    role: "",
    discounted_price: 0,
  })

  // Add loading states for CRUD operations
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false)
  const [isDeletingProduct, setIsDeletingProduct] = useState<string | null>(null)
  const [isCreatingRolePrice, setIsCreatingRolePrice] = useState(false)
  const [isUpdatingRolePrice, setIsUpdatingRolePrice] = useState(false)
  const [isDeletingRolePrice, setIsDeletingRolePrice] = useState<{
    productCode: string
    role: string
  } | null>(null)

  // Add state for batch pricing
  const [batchPricing, setBatchPricing] = useState({
    role: "",
    discountType: "percentage",
    discountValue: 10,
  })
  const [isApplyingBatch, setIsApplyingBatch] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [refreshTrigger])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const response: any = await getAllGSATProducts()
      setProducts(response.products)
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

  // Update handleAddProduct to include loading state
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
      const result = await createGSATProduct({
        product_code: newProduct.product_code,
        base_price: newProduct.base_price,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Product added successfully",
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

  // Update handleUpdateProduct to include loading state
  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    try {
      setIsUpdatingProduct(true)
      const result = await updateGSATProduct(editingProduct.product_code, { base_price: editingProduct.base_price })

      if (result.success) {
        toast({
          title: "Success",
          description: "Product updated successfully",
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

  // Update handleDeleteProduct to include loading state
  const handleDeleteProduct = async (productCode: string) => {
    if (!confirm("Are you sure you want to delete this product? This will also delete all associated role prices.")) {
      return
    }

    try {
      setIsDeletingProduct(productCode)
      const result = await deleteGSATProduct(productCode)

      if (result.success) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
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
    }
  }

  // Update handleAddRolePrice to include loading state
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
      const result = await createGSATProductRolePrice({
        product_code: newRolePrice.product_code,
        role: newRolePrice.role,
        discounted_price: newRolePrice.discounted_price,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Role price added successfully",
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
            })
          }

          setProducts(updatedProducts)
        }

        // Also trigger a refresh to ensure data consistency
        setRefreshTrigger((prev) => prev + 1)
        setIsAddRolePriceOpen(false)
        setNewRolePrice({ product_code: "", role: "", discounted_price: 0 })
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

  // Update handleUpdateRolePrice to include loading state
  const handleUpdateRolePrice = async () => {
    if (!editingRolePrice) return

    try {
      setIsUpdatingRolePrice(true)
      const result = await updateGSATProductRolePrice(editingRolePrice.product_code, editingRolePrice.role, {
        discounted_price: editingRolePrice.discounted_price,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Role price updated successfully",
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

  // Update handleDeleteRolePrice to include loading state
  const handleDeleteRolePrice = async (productCode: string, role: string) => {
    if (!confirm("Are you sure you want to delete this role price?")) {
      return
    }

    try {
      setIsDeletingRolePrice({ productCode, role })
      const result = await deleteGSATProductRolePrice(productCode, role)

      if (result.success) {
        toast({
          title: "Success",
          description: "Role price deleted successfully",
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
    }
  }

  // Add the applyBatchPricing function
  const applyBatchPricing = async () => {
    if (!batchPricing.role || products.length === 0) return

    setIsApplyingBatch(true)
    try {
      // Create a copy of the products array
      const updatedProducts = [...products]

      // Update each product with the new role price
      for (const product of updatedProducts) {
        const basePrice = product.base_price || 0
        let discountedPrice = basePrice

        // Calculate the discounted price based on the discount type
        if (batchPricing.discountType === "percentage") {
          // Apply percentage discount
          const discountPercentage = batchPricing.discountValue / 100
          discountedPrice = basePrice * (1 - discountPercentage)
        } else {
          // Apply fixed amount discount
          discountedPrice = Math.max(0, basePrice - batchPricing.discountValue)
        }

        // Round to 2 decimal places
        discountedPrice = Math.round(discountedPrice * 100) / 100

        // Find existing role price or create a new one
        const existingRolePriceIndex = product.pt_product_role_prices.findIndex(
          (rp) => rp.role === batchPricing.role,
        )

        if (existingRolePriceIndex >= 0) {
          // Update existing role price
          product.pt_product_role_prices[existingRolePriceIndex].discounted_price = discountedPrice

          // In a real implementation, you would call updateGSATProductRolePrice here
          await updateGSATProductRolePrice(product.product_code, batchPricing.role, {
            discounted_price: discountedPrice,
          })
        } else {
          // Create new role price
          const newRolePrice = {
            product_code: product.product_code,
            role: batchPricing.role,
            discounted_price: discountedPrice,
          }

          product.pt_product_role_prices.push(newRolePrice)

          // In a real implementation, you would call createGSATProductRolePrice here
          await createGSATProductRolePrice(newRolePrice)
        }
      }

      // Update the state with the new products
      setProducts(updatedProducts)

      toast({
        title: "Success",
        description: `Applied ${batchPricing.discountType === "percentage" ? batchPricing.discountValue + "%" : "₱" + batchPricing.discountValue} discount to all products for ${getRoleDisplayName(batchPricing.role)}`,
      })

      // Refresh data to ensure UI is in sync with database
      setRefreshTrigger((prev) => prev + 1)
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

  // Calculate statistics
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

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  // Add this after the other useEffect hooks
  useEffect(() => {
    if (activeTab === "role-prices") {
      // Refresh data when switching to the role-prices tab
      fetchProducts()
    }
  }, [activeTab])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto py-8"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Product & Pricing Management</h1>
          <p className="text-muted-foreground">Manage your GSAT products and role-based pricing</p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={refreshData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh data</p>
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product with a base price. You can add role-specific pricing later.
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
                    placeholder="e.g., G99, G200"
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
              {/* Update the DialogFooter in Add Product dialog to show loading state */}
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Role Price</DialogTitle>
                <DialogDescription>Set a discounted price for a specific role and product.</DialogDescription>
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
                      setNewRolePrice({
                        ...newRolePrice,
                        product_code: value,
                        // Set a default discounted price based on the product's base price
                        discounted_price: product?.base_price || 0,
                      })
                    }}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.product_code} value={product.product_code}>
                          {product.product_code} (₱{product.base_price?.toFixed(2) || "0.00"})
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
                  <Label htmlFor="discounted_price" className="text-right">
                    Discounted Price (₱)
                  </Label>
                  <Input
                    id="discounted_price"
                    type="number"
                    value={newRolePrice.discounted_price}
                    onChange={(e) =>
                      setNewRolePrice({ ...newRolePrice, discounted_price: Number.parseFloat(e.target.value) })
                    }
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
                              <span className="font-medium">₱{basePrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Discount:</span>
                              <span className="font-medium">
                                ₱{discount.toFixed(2)} ({discountPercentage.toFixed(2)}%)
                              </span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
              {/* Update the DialogFooter in Add Role Price dialog to show loading state */}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddRolePriceOpen(false)} disabled={isCreatingRolePrice}>
                  Cancel
                </Button>
                <Button onClick={handleAddRolePrice} disabled={isCreatingRolePrice}>
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
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading..." : `${totalProducts} products available`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Prices</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRolePrices}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading..." : `${totalRolePrices} role-specific prices`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Base Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{averageBasePrice.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{isLoading ? "Loading..." : "Average product base price"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Discount</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{averageDiscount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading..." : "Average discount per role price"}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add a batch pricing feature - Add this after the statistics cards */}
      <motion.div variants={itemVariants} className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Batch Role Pricing</CardTitle>
            <CardDescription>Quickly set discounted prices for all products based on role</CardDescription>
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
                  onValueChange={(value) => setBatchPricing({ ...batchPricing, discountType: value })}
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
                      Apply to All Products
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

            {batchPricing.role && products.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                <div className="font-medium mb-1">Preview:</div>
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
                          ₱{basePrice.toFixed(2)} → ₱{discountedPrice.toFixed(2)}
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
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="role-prices">Role Prices</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>Manage your GSAT product codes and base prices</CardDescription>
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
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Code</TableHead>
                          <TableHead>Base Price</TableHead>
                          <TableHead>Role Prices</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {products.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-6">
                                <div className="flex flex-col items-center justify-center space-y-2">
                                  <Package className="h-8 w-8 text-muted-foreground" />
                                  <p className="text-muted-foreground">No products found</p>
                                  <Button variant="outline" size="sm" onClick={() => setIsAddProductOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Your First Product
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            products.map((product) => (
                              <motion.tr
                                key={product.product_code}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="hover:bg-muted/50"
                                whileHover={{
                                  scale: 1.01,
                                  backgroundColor: "rgba(var(--muted), 0.7)",
                                  transition: { duration: 0.2 },
                                }}
                                transition={{ duration: 0.2 }}
                              >
                                <TableCell className="font-medium whitespace-nowrap">{product.product_code}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {/* Update the Product Edit buttons to show loading state */}
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
                                    <span>₱{product.base_price?.toFixed(2) || "0.00"}</span>
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <Badge variant="outline">{product.pt_product_role_prices.length} roles</Badge>
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                  <div className="flex justify-end space-x-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setEditingProduct(product)}
                                          >
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
                                          {/* Update the Product Delete button to show loading state */}
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-destructive"
                                            onClick={() => handleDeleteProduct(product.product_code)}
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
                              </motion.tr>
                            ))
                          )}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="role-prices">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Role-Based Pricing</CardTitle>
                <CardDescription>Manage discounted prices for different user roles</CardDescription>
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
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Code</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Base Price</TableHead>
                          <TableHead>Discounted Price</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {products.flatMap((product) =>
                            product.pt_product_role_prices.length === 0
                              ? []
                              : product.pt_product_role_prices.map((rolePrice) => (
                                <motion.tr
                                  key={`${rolePrice.product_code}-${rolePrice.role}`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="hover:bg-muted/50"
                                  whileHover={{
                                    scale: 1.01,
                                    backgroundColor: "rgba(var(--muted), 0.7)",
                                    transition: { duration: 0.2 },
                                  }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <TableCell className="font-medium whitespace-nowrap">
                                    {rolePrice.product_code}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "font-medium",
                                        rolePrice.role === "Elite_Plus_Distributor_Package" &&
                                        "bg-blue-100 text-blue-800",
                                        rolePrice.role === "Elite_Distributor_Package" &&
                                        "bg-indigo-100 text-indigo-800",
                                        rolePrice.role === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                                        rolePrice.role === "Premium_Merchant_Package" &&
                                        "bg-purple-100 text-purple-800",
                                      )}
                                    >
                                      {getRoleDisplayName(rolePrice.role)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {(() => {
                                      const basePrice =
                                        products.find((p) => p.product_code === rolePrice.product_code)?.base_price ||
                                        0
                                      return <span>₱{basePrice.toFixed(2)}</span>
                                    })()}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {/* Update the Role Price Edit buttons to show loading state */}
                                    {editingRolePrice?.product_code === rolePrice.product_code &&
                                      editingRolePrice?.role === rolePrice.role ? (
                                      <div className="flex items-center space-x-2">
                                        <Input
                                          type="number"
                                          value={editingRolePrice.discounted_price || 0}
                                          onChange={(e) =>
                                            setEditingRolePrice({
                                              ...editingRolePrice,
                                              discounted_price: Number.parseFloat(e.target.value),
                                            })
                                          }
                                          className="w-24"
                                          disabled={isUpdatingRolePrice}
                                        />
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={handleUpdateRolePrice}
                                          disabled={isUpdatingRolePrice}
                                        >
                                          {isUpdatingRolePrice ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Save className="h-4 w-4" />
                                          )}
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => setEditingRolePrice(null)}
                                          disabled={isUpdatingRolePrice}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <span>₱{rolePrice.discounted_price?.toFixed(2) || "0.00"}</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {(() => {
                                      const basePrice =
                                        products.find((p) => p.product_code === rolePrice.product_code)?.base_price ||
                                        0
                                      const discountedPrice = rolePrice.discounted_price || 0
                                      const discount = basePrice > 0 ? basePrice - discountedPrice : 0
                                      const discountPercentage = basePrice > 0 ? (discount / basePrice) * 100 : 0

                                      return (
                                        <div className="flex flex-col">
                                          <span>₱{discount.toFixed(2)}</span>
                                          <span className="text-xs text-muted-foreground">
                                            ({discountPercentage.toFixed(2)}%)
                                          </span>
                                        </div>
                                      )
                                    })()}
                                  </TableCell>
                                  <TableCell className="text-right whitespace-nowrap">
                                    <div className="flex justify-end space-x-2">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => setEditingRolePrice(rolePrice)}
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Edit role price</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            {/* Update the Role Price Delete button to show loading state */}
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="text-destructive"
                                              onClick={() =>
                                                handleDeleteRolePrice(rolePrice.product_code, rolePrice.role)
                                              }
                                              disabled={
                                                isDeletingRolePrice?.productCode === rolePrice.product_code &&
                                                isDeletingRolePrice?.role === rolePrice.role
                                              }
                                            >
                                              {isDeletingRolePrice?.productCode === rolePrice.product_code &&
                                                isDeletingRolePrice?.role === rolePrice.role ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                              ) : (
                                                <Trash2 className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Delete role price</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </TableCell>
                                </motion.tr>
                              )),
                          ).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-6">
                                <div className="flex flex-col items-center justify-center space-y-2">
                                  <Tag className="h-8 w-8 text-muted-foreground" />
                                  <p className="text-muted-foreground">No role prices found</p>
                                  <Button variant="outline" size="sm" onClick={() => setIsAddRolePriceOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Your First Role Price
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {activeTab === "role-prices" && (
        <motion.div
          key={`role-price-comparison-${refreshTrigger}`}
          variants={itemVariants}
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Role Price Comparison</CardTitle>
              <CardDescription>Compare pricing across different roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
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
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, index) => (
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
                    ) : products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2 + AVAILABLE_ROLES.length} className="text-center py-6">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <motion.tr
                          key={product.product_code}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium whitespace-nowrap">{product.product_code}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            ₱{product.base_price?.toFixed(2) || "0.00"}
                          </TableCell>
                          {AVAILABLE_ROLES.map((role) => {
                            const rolePrice = product.pt_product_role_prices.find((rp) => rp.role === role.value)
                            const discountedPrice = rolePrice?.discounted_price || product.base_price || 0
                            const basePrice = product.base_price || 0
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
                                        role.value === "Elite_Plus_Distributor_Package" && "bg-blue-100 text-blue-800",
                                        role.value === "Elite_Distributor_Package" && "bg-indigo-100 text-indigo-800",
                                        role.value === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                                        role.value === "Premium_Merchant_Package" && "bg-purple-100 text-purple-800",
                                      )}
                                    >
                                      {discountPercentage > 0 ? `-${discountPercentage.toFixed(1)}%` : "No discount"}
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
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

