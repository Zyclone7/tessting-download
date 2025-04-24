"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Wifi,
  Tv,
  Satellite,
  Phone,
  CreditCard,
  PoundSterlingIcon as PhilippinePeso,
  Loader,
  Wallet,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info,
  Package,
  Clock,
  Send,
  Mail,
} from "lucide-react"
import { PaymentDialog } from "./payment-details-load"
import { assignVouchers } from "@/actions/gsat-voucher"
import { assignWiFiVouchers } from "@/actions/wifi-voucher"
import { assignTvVouchers } from "@/actions/tv-voucher"
import { getGsatVoucherStock, getWifiVoucherStock, getTvVoucherStock } from "@/actions/voucher-stock"
import { useUserContext } from "@/hooks/use-user"
import SoldGsatVoucherTable from "@/components/table/sold-voucher-table"
import SoldWiFiVoucherTable from "@/components/table/sold-voucher-wifi"
import SoldTvVoucherTable from "@/components/table/sold-voucher-tv"
import { DialogTrigger } from "@radix-ui/react-dialog"
import { getUserProfile } from "@/actions/user"
import TelcoInterface from "./example-load-UI"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { getGSATProductPricing } from "@/actions/get-product-pricing"
import { formatNumber, formatUserRole } from "@/lib/utils"
// Import the TV pricing server action at the top of the file
import { getTVProductPricing, getAllTVProducts } from "@/actions/tv-pricing"
import { getAllGSATProducts } from "@/actions/gsat"
import TelcoTransactionsTable from "@/components/table/telco-transaction-table"

// Type definitions
interface User {
  id: string | number
}

interface UserContext {
  user: User | null
}

interface BookingDetails {
  typeOfVoucher: "GSAT" | "WIFI" | "TV"
  product_code?: string
  duration?: string
  email: string
  phoneNumber: string
  quantity: number
  serviceFee: number
  pricing?: {
    basePrice: number
    productPrice: number
    subtotal: number
    total: number
    discountPercentage: number
    userRole: string
  }
}

interface ProductPrices {
  [key: string]: number
}

interface DurationPrices {
  [key: string]: number
}

interface StockInfo {
  count: number
  isLowStock: boolean
  loading?: boolean
}

interface ProductInfo {
  basePrice: number
  discountedPrice: number
  userRole: string
  loading: boolean
  discountPercentage: number
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
  exit: { y: -20, opacity: 0, transition: { duration: 0.3 } },
}

const SellVoucher: React.FC = () => {
  // Low Stock Alert Component
  const LowStockAlert = ({
    open,
    onClose,
    voucherType,
    productDetails,
    stockCount,
  }: {
    open: boolean
    onClose: () => void
    voucherType: string
    productDetails: string
    stockCount: number
  }) => {
    if (!open) return null

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle></DialogTitle>
          <motion.div initial="hidden" animate="visible" exit="exit" variants={fadeIn}>
            <div className="flex flex-col items-center justify-center p-4">
              <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Low Stock Alert</h2>
              <div className="text-center mb-4">
                {voucherType} voucher <strong>{productDetails}</strong> is running low on stock. Only{" "}
                <Badge variant="outline" className="ml-1 bg-amber-100">
                  {stockCount}
                </Badge>{" "}
                vouchers remaining.
              </div>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Please contact your administrator to replenish the stock soon.
              </p>
              <Button onClick={onClose} className="w-full">
                Acknowledge
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  // Stock Count Display Component
  const StockCountDisplay = ({
    count,
    isLowStock,
    loading = false,
  }: {
    count: number
    isLowStock: boolean
    loading?: boolean
  }) => {
    if (loading) {
      return <Skeleton className="h-5 w-24 mt-1" />
    }

    return (
      <div className="flex items-center mt-1 text-sm">
        <span className="mr-2">Available Stock:</span>
        {isLowStock ? (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>{count} (Low)</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>{count} Available</span>
          </Badge>
        )}
      </div>
    )
  }

  // Form Skeleton Loader Component
  const FormSkeletonLoader = () => (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-16 w-full rounded-md" />
      <Skeleton className="h-10 w-full" />
    </div>
  )

  // GSAT state
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [stocks, setStocks] = useState<number>(1)
  const [currentTab, setCurrentTab] = useState<string>("gsat")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [gsatServiceFee, setGsatServiceFee] = useState<number>(10) // Default service fee
  const [gsatStockInfo, setGsatStockInfo] = useState<StockInfo>({
    count: 0,
    isLowStock: false,
    loading: true,
  })
  const [showGsatLowStockAlert, setShowGsatLowStockAlert] = useState<boolean>(false)
  const [isGsatFormValid, setIsGsatFormValid] = useState<boolean>(false)
  const [isGsatFormSubmitted, setIsGsatFormSubmitted] = useState<boolean>(false)

  // WiFi state
  const [wifiDuration, setWifiDuration] = useState<string>("")
  const [wifiPhoneNumber, setWifiPhoneNumber] = useState<string>("")
  const [wifiEmail, setWifiEmail] = useState<string>("")
  const [wifiStocks, setWifiStocks] = useState<number>(1)
  const [isWifiLoading, setIsWifiLoading] = useState<boolean>(false)
  const [wifiServiceFee, setWifiServiceFee] = useState<number>(5) // Default service fee
  const [wifiStockInfo, setWifiStockInfo] = useState<StockInfo>({
    count: 0,
    isLowStock: false,
    loading: true,
  })
  const [showWifiLowStockAlert, setShowWifiLowStockAlert] = useState<boolean>(false)
  const [isWifiFormValid, setIsWifiFormValid] = useState<boolean>(false)
  const [isWifiFormSubmitted, setIsWifiFormSubmitted] = useState<boolean>(false)

  // TV state
  const [selectedTvPackage, setSelectedTvPackage] = useState<string>("")
  const [tvPhoneNumber, setTvPhoneNumber] = useState<string>("")
  const [tvEmail, setTvEmail] = useState<string>("")
  const [tvStocks, setTvStocks] = useState<number>(1)
  const [isTvLoading, setIsTvLoading] = useState<boolean>(false)
  const [tvServiceFee, setTvServiceFee] = useState<number>(10) // Default service fee
  const [tvStockInfo, setTvStockInfo] = useState<StockInfo>({
    count: 0,
    isLowStock: false,
    loading: true,
  })
  const [showTvLowStockAlert, setShowTvLowStockAlert] = useState<boolean>(false)
  const [isTvFormValid, setIsTvFormValid] = useState<boolean>(false)
  const [isTvFormSubmitted, setIsTvFormSubmitted] = useState<boolean>(false)
  // User credit state
  const [userCredit, setUserCredit] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshingCredit, setRefreshingCredit] = useState<boolean>(false)

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState<boolean>(false)
  const [currentBookingDetails, setCurrentBookingDetails] = useState<BookingDetails | null>(null)
  const [transactionSuccess, setTransactionSuccess] = useState<boolean>(false)

  const { user } = useUserContext() as UserContext

  // Dynamic product data - will be populated from API
  const [gsatProducts, setGsatProducts] = useState<string[]>([])
  const [gsatProductPrices, setGsatProductPrices] = useState<number[]>([])
  const durations: string[] = ["2 Hour", "5 Hour", "24 Hour", "5 Days", "1 month"]
  // TV package data
  const [tvPackages, setTvPackages] = useState<string[]>([])
  const [tvPackageInclusions, setTvPackageInclusions] = useState<any[]>([])
  const [tvPackagePrices, setTvPackagePrices] = useState<number[]>([])

  const [productInfo, setProductInfo] = useState<{ [key: string]: ProductInfo }>({})
  // Replace the static tvPackagePrices with a state for TV product info
  const [tvProductInfo, setTvProductInfo] = useState<{ [key: string]: ProductInfo }>({})

  // Product price mapping (for display only)
  const productPrices: ProductPrices = {
    G99: 99,
    G200: 200,
    G300: 300,
    G500: 500,
  }

  // Duration price mapping (for display only)
  const durationPrices: DurationPrices = {
    "2 Hour": 5,
    "5 Hour": 10,
    "24 Hour": 25,
    "5 Days": 50,
    "1 month": 200,
  }

  // TV package price mapping
  // const tvPackagePrices: ProductPrices = {
  //   "MOBILE PLAN": 120,
  //   "BASIC PACKAGE": 169,
  //   "STANDARND PACKAGE": 299,
  // }

  // Fetch available products
  const fetchAvailableProductsData = useCallback(async () => {
    try {
      setGsatStockInfo((prev) => ({ ...prev, loading: true }))
      // In a real implementation, this would fetch from your database
      // For now, we'll use the static list
      const response: any = await getAllGSATProducts()
      if (response.success && response.products) {
        setGsatProducts(response.products)
      }
      setGsatStockInfo((prev) => ({ ...prev, loading: false }))
    } catch (error) {
      console.error("Error fetching available products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch available products.",
        variant: "destructive",
      })
      setGsatStockInfo((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  // Replace the fetchTvPackages function with this implementation
  const fetchTvPackages = useCallback(async () => {
    try {
      const response = await getAllTVProducts()
      // console.log("TV Packages Response:", response) // Debugging line
      if (response.success && response.products) {
        setTvPackages(response.products.map((p: any) => p.product_code))
        setTvPackagePrices(response.products.map((p: any) => p.base_price))
        setTvPackageInclusions(response.products.map((p: any) => p.pt_product_inclusion[0].inclusion
      ))
      // console.log("TV Packages:", tvPackageInclusions) // Debugging line
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch TV packages.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching TV packages:", error)
      toast({
        title: "Error",
        description: "Failed to fetch TV packages.",
        variant: "destructive",
      })
    }
  }, [])

  // Fetch user credit
  const fetchUserCredit = useCallback(async () => {
    if (!user?.id) return

    setRefreshingCredit(true)
    setError(null)

    try {
      const response = await getUserProfile(user.id.toString())

      if (response.success) {
        setUserCredit(response.data?.user_credits || 0)
      } else {
        setError(response.message || "Failed to fetch user credit.")
        toast({
          title: "Error",
          description: response.message || "Failed to fetch user credit.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError("An unexpected error occurred. Please try again later.")
      toast({
        title: "Error",
        description: "Failed to fetch user credit. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshingCredit(false)
    }
  }, [user])

  useEffect(() => {
    fetchUserCredit()
    fetchAvailableProductsData()
    fetchTvPackages()
  }, [fetchUserCredit, fetchAvailableProductsData, fetchTvPackages])

  // Validate GSAT form
  useEffect(() => {
    setIsGsatFormValid(
      !!selectedProduct &&
      !!email &&
      stocks > 0 &&
      stocks <= gsatStockInfo.count &&
      !gsatStockInfo.isLowStock &&
      gsatStockInfo.count > 0,
    )
  }, [selectedProduct, email, stocks, gsatStockInfo])

  // Validate WiFi form
  useEffect(() => {
    setIsWifiFormValid(
      !!wifiDuration &&
      !!wifiEmail &&
      !!wifiPhoneNumber &&
      wifiStocks > 0 &&
      wifiStocks <= wifiStockInfo.count &&
      !wifiStockInfo.isLowStock &&
      wifiStockInfo.count > 0,
    )
  }, [wifiDuration, wifiEmail, wifiPhoneNumber, wifiStocks, wifiStockInfo])

  // Validate TV form
  useEffect(() => {
    setIsTvFormValid(
      !!selectedTvPackage &&
      !!tvEmail &&
      tvStocks > 0 &&
      tvStocks <= tvStockInfo.count &&
      !tvStockInfo.isLowStock &&
      tvStockInfo.count > 0,
    )
  }, [selectedTvPackage, tvEmail, tvStocks, tvStockInfo])

  // Check GSAT stock when product changes
  useEffect(() => {
    if (selectedProduct) {
      const checkGsatStock = async () => {
        setGsatStockInfo((prev) => ({ ...prev, loading: true }))
        const stockInfo = await getGsatVoucherStock(selectedProduct)
        if (stockInfo.success) {
          setGsatStockInfo({
            count: stockInfo.count,
            isLowStock: stockInfo.isLowStock,
            loading: false,
          })

          // Reset stocks to 1 when the product changes
          setStocks(1)

          if (stockInfo.isLowStock) {
            setShowGsatLowStockAlert(true)
          }
        } else {
          setGsatStockInfo({
            count: 0,
            isLowStock: true,
            loading: false,
          })
        }
      }

      checkGsatStock()
    } else {
      setGsatStockInfo({ count: 0, isLowStock: false, loading: false })
    }
  }, [selectedProduct])

  // Check WiFi stock when duration changes
  useEffect(() => {
    if (wifiDuration) {
      const checkWifiStock = async () => {
        setWifiStockInfo((prev) => ({ ...prev, loading: true }))
        const stockInfo = await getWifiVoucherStock(wifiDuration)
        if (stockInfo.success) {
          setWifiStockInfo({
            count: stockInfo.count,
            isLowStock: stockInfo.isLowStock,
            loading: false,
          })

          // Reset WiFi stocks to 1 when the duration changes
          setWifiStocks(1)

          if (stockInfo.isLowStock) {
            setShowWifiLowStockAlert(true)
          }
        } else {
          setWifiStockInfo({
            count: 0,
            isLowStock: true,
            loading: false,
          })
        }
      }

      checkWifiStock()
    } else {
      setWifiStockInfo({ count: 0, isLowStock: false, loading: false })
    }
  }, [wifiDuration])

  // Check TV stock when package changes
  useEffect(() => {
    if (selectedTvPackage) {
      const checkTvStock = async () => {
        setTvStockInfo((prev) => ({ ...prev, loading: true }))
        const stockInfo = await getTvVoucherStock(selectedTvPackage)
        if (stockInfo.success) {
          setTvStockInfo({
            count: stockInfo.count,
            isLowStock: stockInfo.isLowStock,
            loading: false,
          })

          // Reset TV stocks to 1 when the package changes
          setTvStocks(1)

          if (stockInfo.isLowStock) {
            setShowTvLowStockAlert(true)
          }
        } else {
          setTvStockInfo({
            count: 0,
            isLowStock: true,
            loading: false,
          })
        }
      }

      checkTvStock()
    } else {
      setTvStockInfo({ count: 0, isLowStock: false, loading: false })
    }
  }, [selectedTvPackage])

  const fetchProductPricing = useCallback(
    async (productCode: string) => {
      if (!user?.id || !productCode) return

      // Skip if we already have non-loading data for this product
      if (productInfo[productCode] && !productInfo[productCode].loading) {
        return
      }

      try {
        // Set loading state for this product
        setProductInfo((prev) => ({
          ...prev,
          [productCode]: {
            ...(prev[productCode] || {}),
            loading: true,
          },
        }))

        // Call server action to get pricing
        const response = await getGSATProductPricing(user.id.toString(), productCode)

        if (response.success) {
          setProductInfo((prev) => ({
            ...prev,
            [productCode]: {
              basePrice: response.basePrice || 0,
              discountedPrice: response.discountedPrice || 0,
              discountPercentage: response.discountPercentage || 0,
              userRole: response.userRole || "Basic Merchant",
              loading: false,
            },
          }))
        } else {
          // If error, use default product prices
          setProductInfo((prev) => ({
            ...prev,
            [productCode]: {
              basePrice: productPrices[productCode] || 0,
              discountedPrice: productPrices[productCode] || 0,
              discountPercentage: 0,
              userRole: "Basic Merchant",
              loading: false,
            },
          }))
        }
      } catch (error) {
        console.error("Error fetching product pricing:", error)
        // Use default product prices on error
        setProductInfo((prev) => ({
          ...prev,
          [productCode]: {
            basePrice: productPrices[productCode] || 0,
            discountedPrice: productPrices[productCode] || 0,
            discountPercentage: 0,
            userRole: "Basic Merchant",
            loading: false,
          },
        }))
      }
    },
    [user, productPrices, productInfo],
  )

  // Add a function to fetch TV product pricing
  const fetchTvProductPricing = useCallback(
    async (productCode: string) => {
      if (!user?.id || !productCode) return

      // Skip if we already have non-loading data for this product
      if (tvProductInfo[productCode] && !tvProductInfo[productCode].loading) {
        return
      }

      try {
        // Set loading state for this product
        setTvProductInfo((prev) => ({
          ...prev,
          [productCode]: {
            ...(prev[productCode] || {}),
            loading: true,
          },
        }))

        // Call server action to get pricing
        const response = await getTVProductPricing(user.id.toString(), productCode)

        if (response.success) {
          setTvProductInfo((prev) => ({
            ...prev,
            [productCode]: {
              basePrice: response.basePrice || 0,
              discountedPrice: response.discountedPrice || 0,
              discountPercentage: response.discountPercentage || 0,
              userRole: response.userRole || "Basic Merchant",
              loading: false,
            },
          }))
        } else {
          // If error, use default product prices or set to 0
          setTvProductInfo((prev) => ({
            ...prev,
            [productCode]: {
              basePrice: 0,
              discountedPrice: 0,
              discountPercentage: 0,
              userRole: "Basic Merchant",
              loading: false,
            },
          }))
        }
      } catch (error) {
        console.error("Error fetching TV product pricing:", error)
        // Use default values on error
        setTvProductInfo((prev) => ({
          ...prev,
          [productCode]: {
            basePrice: 0,
            discountedPrice: 0,
            discountPercentage: 0,
            userRole: "Basic Merchant",
            loading: false,
          },
        }))
      }
    },
    [user, tvProductInfo],
  )

  // Add this useEffect to fetch product pricing when product changes
  useEffect(() => {
    if (selectedProduct && (!productInfo[selectedProduct] || productInfo[selectedProduct].loading === false)) {
      fetchProductPricing(selectedProduct)
    }
  }, [selectedProduct, fetchProductPricing, productInfo])

  // Add this useEffect to fetch TV product pricing when the selected package changes
  useEffect(() => {
    if (
      selectedTvPackage &&
      (!tvProductInfo[selectedTvPackage] || tvProductInfo[selectedTvPackage].loading === false)
    ) {
      fetchTvProductPricing(selectedTvPackage)
    }
  }, [selectedTvPackage, fetchTvProductPricing, tvProductInfo])

  const handleGsatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGsatFormSubmitted(true)

    if (!isGsatFormValid) {
      toast({
        title: "Validation Error",
        description: "Please fill out all fields correctly and ensure stocks are available.",
        variant: "destructive",
      })
      return
    }

    // Calculate pricing information
    const pricingInfo = calculateGsatTotal()

    // Set booking details for payment dialog
    setCurrentBookingDetails({
      typeOfVoucher: "GSAT",
      product_code: selectedProduct,
      email: email,
      phoneNumber: phoneNumber,
      quantity: stocks,
      serviceFee: Number.parseFloat(gsatServiceFee.toString()),
      pricing: {
        basePrice: pricingInfo.basePrice,
        productPrice: pricingInfo.productPrice,
        subtotal: pricingInfo.subtotal,
        total: pricingInfo.total,
        discountPercentage: pricingInfo.discountPercentage,
        userRole: pricingInfo.userRole,
      },
    })

    // Open payment dialog
    setPaymentDialogOpen(true)
  }

  // Direct submission function (used after payment is confirmed)
  const handleGsatDirectSubmit = async (paymentMethod: string, proofOfPaymentUrl?: string) => {
    if (!user?.id) return { success: false }

    setIsLoading(true)
    setTransactionSuccess(false)
    let result = { success: false, message: "" }

    try {
      const formData = new FormData()
      formData.append("user_id", user.id.toString())
      formData.append("product_code", selectedProduct)
      formData.append("email", email)
      formData.append("stocks", stocks.toString())
      formData.append("payment_method", paymentMethod)
      formData.append("service_fee", gsatServiceFee.toString())
      formData.append("price", calculateGsatTotal().productPrice.toFixed(2))
      formData.append("discount", calculateGsatTotal().discountPercentage.toFixed(1))
      formData.append("base_price", calculateGsatTotal().basePrice.toFixed(2))

      if (proofOfPaymentUrl) {
        formData.append("proof_of_payment", proofOfPaymentUrl)
      }

      result = await assignVouchers(formData)

      if (result.success) {
        setTransactionSuccess(true)
        toast({
          title: "Success",
          description: "Voucher successfully assigned!",
        })

        // Refresh user credit after successful operation
        await fetchUserCredit()

        // Update stock info
        const stockInfo = await getGsatVoucherStock(selectedProduct)
        if (stockInfo.success) {
          setGsatStockInfo({
            count: stockInfo.count,
            isLowStock: stockInfo.isLowStock,
            loading: false,
          })

          if (stockInfo.isLowStock) {
            setShowGsatLowStockAlert(true)
          }
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to assign voucher. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error buying voucher:", error)
      toast({
        title: "Error",
        description: "An error occurred while assigning the voucher.",
        variant: "destructive",
      })
      result = { success: false, message: "An error occurred" }
    } finally {
      setIsLoading(false)
    }

    return result
  }

  const handleWifiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsWifiFormSubmitted(true)

    if (!isWifiFormValid) {
      toast({
        title: "Validation Error",
        description: "Please fill out all fields correctly and ensure stocks are available.",
        variant: "destructive",
      })
      return
    }

    // Calculate pricing information
    const wifiPricing = calculateWifiTotal()

    // Set booking details for payment dialog
    setCurrentBookingDetails({
      typeOfVoucher: "WIFI",
      duration: wifiDuration,
      email: wifiEmail,
      phoneNumber: wifiPhoneNumber,
      quantity: wifiStocks,
      serviceFee: Number.parseFloat(wifiServiceFee.toString()),
      pricing: {
        basePrice: wifiPricing.durationPrice,
        productPrice: wifiPricing.durationPrice,
        subtotal: wifiPricing.subtotal,
        total: wifiPricing.total,
        discountPercentage: 0,
        userRole: "",
      },
    })

    // Open payment dialog
    setPaymentDialogOpen(true)
  }

  // TV form submission handler
  const handleTvSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsTvFormSubmitted(true)

    if (!isTvFormValid) {
      toast({
        title: "Validation Error",
        description: "Please fill out all fields correctly and ensure stocks are available.",
        variant: "destructive",
      })
      return
    }

    // Calculate pricing information
    const tvPricing = calculateTvTotal()

    // Set booking details for payment dialog
    setCurrentBookingDetails({
      typeOfVoucher: "TV",
      product_code: selectedTvPackage,
      email: tvEmail,
      phoneNumber: tvPhoneNumber,
      quantity: tvStocks,
      serviceFee: Number.parseFloat(tvServiceFee.toString()),
      pricing: {
        basePrice: tvPricing.basePrice,
        productPrice: tvPricing.packagePrice,
        subtotal: tvPricing.subtotal,
        total: tvPricing.total,
        discountPercentage: tvPricing.discountPercentage,
        userRole: tvPricing.userRole,
      },
    })

    // Open payment dialog
    setPaymentDialogOpen(true)
  }

  // Replace the TV form submission handler to include pricing information
  const handleTvDirectSubmit = async (paymentMethod: string, proofOfPaymentUrl?: string) => {
    if (!user?.id) return { success: false }

    setIsTvLoading(true)
    setTransactionSuccess(false)
    let result: any = { success: false, message: "" }
    let batchIndex = 0
    let processedVouchers: any[] = []
    let isComplete = false

    try {
      // Process vouchers in batches until complete
      while (!isComplete) {
        const formData = new FormData()
        formData.append("user_id", user.id.toString())
        formData.append("product_code", selectedTvPackage)
        formData.append("email", tvEmail)
        formData.append("phoneNumber", tvPhoneNumber)
        formData.append("stocks", tvStocks.toString())
        formData.append("payment_method", paymentMethod)
        formData.append("service_fee", tvServiceFee.toString())
        formData.append("price", calculateTvTotal().packagePrice.toFixed(2))
        formData.append("discount", calculateTvTotal().discountPercentage.toFixed(1))
        formData.append("base_price", calculateTvTotal().basePrice.toFixed(2))
        formData.append("total_amount", calculateGsatTotal().total.toFixed(2))

        // Add batch processing parameters
        formData.append("batchIndex", batchIndex.toString())
        formData.append("processedVouchers", JSON.stringify(processedVouchers))

        if (proofOfPaymentUrl) {
          formData.append("proof_of_payment", proofOfPaymentUrl)
        }

        // Call the server action
        result = await assignTvVouchers(formData)

        if (result.success) {
          // Update processed vouchers with the new batch results
          processedVouchers = result.data || []

          // Check if processing is complete
          isComplete = result.completed || false

          // Update batch index for next iteration
          batchIndex = result.nextBatchIndex || batchIndex + 1

          // Update progress in UI if needed
          if (result.progress) {
            // You could update a progress indicator here
            // console.log(`Processing: ${result.progress.percentage}% complete`)
          }
        } else {
          // If there's an error, break the loop
          toast({
            title: "Error",
            description: result.message || "Failed to assign TV subscription. Please try again.",
            variant: "destructive",
          })
          break
        }
      }

      // Only show success when completely done
      if (isComplete) {
        setTransactionSuccess(true)
        toast({
          title: "Success",
          description: "TV Subscription successfully assigned!",
        })

        // Refresh user credit after successful operation
        await fetchUserCredit()

        // Update stock info
        const stockInfo = await getTvVoucherStock(selectedTvPackage)
        if (stockInfo.success) {
          setTvStockInfo({
            count: stockInfo.count,
            isLowStock: stockInfo.isLowStock,
            loading: false,
          })

          if (stockInfo.isLowStock) {
            setShowTvLowStockAlert(true)
          }
        }
      }
    } catch (error) {
      console.error("Error buying TV subscription:", error)
      toast({
        title: "Error",
        description: "An error occurred while assigning the TV subscription.",
        variant: "destructive",
      })
      result = { success: false, message: "An error occurred" }
    } finally {
      setIsTvLoading(false)
    }

    return result
  }

  // Direct submission function (used after payment is confirmed)
  const handleWifiDirectSubmit = async (paymentMethod: string, proofOfPaymentUrl?: string) => {
    if (!user?.id) return { success: false }

    setIsWifiLoading(true)
    setTransactionSuccess(false)
    let result = { success: false, message: "" }

    try {
      const formData = new FormData()
      formData.append("user_id", user.id.toString())
      formData.append("duration", wifiDuration)
      formData.append("email", wifiEmail)
      formData.append("phoneNumber", wifiPhoneNumber)
      formData.append("stocks", wifiStocks.toString())
      formData.append("payment_method", paymentMethod)
      formData.append("service_fee", wifiServiceFee.toString())

      if (proofOfPaymentUrl) {
        formData.append("proof_of_payment", proofOfPaymentUrl)
      }

      result = await assignWiFiVouchers(formData)

      if (result.success) {
        setTransactionSuccess(true)
        toast({
          title: "Success",
          description: "WiFi Voucher successfully assigned!",
        })

        // Refresh user credit after successful operation
        await fetchUserCredit()

        // Update stock info
        const stockInfo = await getWifiVoucherStock(wifiDuration)
        if (stockInfo.success) {
          setWifiStockInfo({
            count: stockInfo.count,
            isLowStock: stockInfo.isLowStock,
            loading: false,
          })

          if (stockInfo.isLowStock) {
            setShowWifiLowStockAlert(true)
          }
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to assign WiFi voucher. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error buying WiFi voucher:", error)
      toast({
        title: "Error",
        description: "An error occurred while assigning the WiFi voucher.",
        variant: "destructive",
      })
    } finally {
      setIsWifiLoading(false)
    }

    return result
  }

  // Reset GSAT form fields
  const resetGsatForm = () => {
    setSelectedProduct("")
    setPhoneNumber("")
    setEmail("")
    setStocks(1)
    setGsatServiceFee(10) // Reset to default
  }

  // Reset WiFi form fields
  const resetWifiForm = () => {
    setWifiDuration("")
    setWifiPhoneNumber("")
    setWifiEmail("")
    setWifiStocks(1)
    setWifiServiceFee(5) // Reset to default
  }

  // Reset TV form fields
  const resetTvForm = () => {
    setSelectedTvPackage("")
    setTvPhoneNumber("")
    setTvEmail("")
    setTvStocks(1)
    setTvServiceFee(10) // Reset to default
  }

  // Handle payment success
  const handlePaymentSuccess = async (paymentMethod: string, proofOfPaymentUrl?: string) => {
    if (currentBookingDetails) {
      let success = false

      if (currentBookingDetails.typeOfVoucher === "GSAT") {
        const result = await handleGsatDirectSubmit(paymentMethod, proofOfPaymentUrl)
        success = result?.success || false
        if (success) {
          resetGsatForm()
        }
      } else if (currentBookingDetails.typeOfVoucher === "WIFI") {
        const result = await handleWifiDirectSubmit(paymentMethod, proofOfPaymentUrl)
        success = result?.success || false
        if (success) {
          resetWifiForm()
        }
      } else if (currentBookingDetails.typeOfVoucher === "TV") {
        const result = await handleTvDirectSubmit(paymentMethod, proofOfPaymentUrl)
        success = result?.success || false
        if (success) {
          resetTvForm()
        }
      }

      // Reset booking details
      setCurrentBookingDetails(null)
    }
  }

  const calculateGsatTotal = () => {
    const info = productInfo[selectedProduct] || {
      basePrice: 0,
      discountedPrice: 0,
      discountPercentage: 0,
      userRole: "Basic Merchant",
    }

    const productPrice = info?.discountedPrice || 0
    const subtotal = productPrice * stocks
    const total = subtotal + Number.parseFloat(gsatServiceFee.toString())
    return {
      productPrice,
      subtotal,
      total,
      basePrice: info?.basePrice || 0,
      discountPercentage: info?.discountPercentage || 0,
      userRole: info?.userRole || "Basic Merchant",
    }
  }

  // Calculate WiFi total amount
  const calculateWifiTotal = () => {
    const durationPrice = durationPrices[wifiDuration] || 0
    const subtotal = durationPrice * wifiStocks
    const total = subtotal + Number.parseFloat(wifiServiceFee.toString())
    return { durationPrice, subtotal, total }
  }

  // Replace the calculateTvTotal function with this implementation
  const calculateTvTotal = () => {
    const info = tvProductInfo[selectedTvPackage] || {
      basePrice: 0,
      discountedPrice: 0,
      discountPercentage: 0,
      userRole: "Basic Merchant",
    }

    const packagePrice = info?.discountedPrice || 0
    const subtotal = packagePrice * tvStocks
    const total = subtotal + Number.parseFloat(tvServiceFee.toString())
    return {
      packagePrice,
      subtotal,
      total,
      basePrice: info?.basePrice || 0,
      discountPercentage: info?.discountPercentage || 0,
      userRole: info?.userRole || "Basic Merchant",
    }
  }

  // Success message component
  const SuccessMessage = ({ type }: { type: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4"
    >
      <Alert className="bg-green-50 border-green-200 shadow-sm">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-800 text-lg font-medium">Success!</AlertTitle>
        <AlertDescription className="text-green-700">
          Your {type} voucher has been successfully purchased and assigned.
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-green-700 border-green-300 hover:bg-green-50"
              onClick={() => setTransactionSuccess(false)}
            >
              Dismiss
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-green-700 border-green-300 hover:bg-green-50"
              onClick={() => {
                if (type === "GSAT") resetGsatForm()
                else if (type === "WiFi") resetWifiForm()
                else if (type === "TV") resetTvForm()
                setTransactionSuccess(false)
              }}
            >
              New Transaction
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  )

  // Add this function to display a more user-friendly error when stock is unavailable
  const StockUnavailableMessage = ({ type }: { type: string }) => (
    <Alert className="mb-4 bg-amber-50 border-amber-200">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Stock Unavailable</AlertTitle>
      <AlertDescription className="text-amber-700">
        There are currently no {type} vouchers available in stock. Please contact your administrator to replenish the
        stock.
      </AlertDescription>
    </Alert>
  )

  // Create a PricingSkeleton component
  const PricingSkeleton = () => (
    <div className="p-4 bg-muted rounded-md space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-8" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-px w-full my-2" />
      <div className="flex justify-between">
        <Skeleton className="h-5 w-24 font-medium" />
        <Skeleton className="h-5 w-20 font-medium" />
      </div>
      <div className="mt-2">
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )

  return (
    <div className="max-h-screen w-full bg-background">
      {/* Payment Dialog */}
      {paymentDialogOpen && currentBookingDetails && (
        <PaymentDialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          bookingDetails={currentBookingDetails}
          onBookingSuccess={(paymentMethod: string, proofOfPaymentUrl?: string) => {
            handlePaymentSuccess(paymentMethod, proofOfPaymentUrl)
            setPaymentDialogOpen(false)
          }}
          userCredit={userCredit}
        />
      )}

      {/* Low Stock Alert Dialogs */}
      <LowStockAlert
        open={showGsatLowStockAlert}
        onClose={() => setShowGsatLowStockAlert(false)}
        voucherType="GSAT"
        productDetails={selectedProduct}
        stockCount={gsatStockInfo.count}
      />

      <LowStockAlert
        open={showWifiLowStockAlert}
        onClose={() => setShowWifiLowStockAlert(false)}
        voucherType="WiFi"
        productDetails={wifiDuration}
        stockCount={wifiStockInfo.count}
      />

      <LowStockAlert
        open={showTvLowStockAlert}
        onClose={() => setShowTvLowStockAlert(false)}
        voucherType="TV"
        productDetails={selectedTvPackage}
        stockCount={tvStockInfo.count}
      />

      <Separator />
      <div className="flex justify-between items-center mt-6 px-6">
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold"
        >
          Services
        </motion.p>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 bg-muted p-2 px-4 rounded-lg shadow-sm"
        >
          <Wallet className="w-5 min-w-screen h-5 text-primary" />
          <div className="flex items-center">
            <span className="font-medium mr-1">Credit Balance:</span>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : refreshingCredit ? (
              <div className="flex items-center">
                <Loader className="w-4 h-4 mr-1 animate-spin text-primary" />
                <span className="font-bold text-primary">Refreshing...</span>
              </div>
            ) : (
              <span className="font-bold text-primary">₱{formatNumber(userCredit)}</span>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1"
                    onClick={fetchUserCredit}
                    disabled={refreshingCredit}
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshingCredit ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh credit balance</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.div>
      </div>

      <main className="container mx-auto py-6">
        <Tabs
          defaultValue="gsat"
          className="w-full"
          value={currentTab}
          onValueChange={(value) => {
            setCurrentTab(value)
            setTransactionSuccess(false)
          }}
        >
          <TabsList className="grid w-full mx-auto grid-cols-6 mb-6">
            <TabsTrigger value="gsat" className="flex items-center justify-center gap-2 transition-all duration-200">
              <Satellite className="w-4 h-4" />
              GSAT
            </TabsTrigger>
            <TabsTrigger value="tv" className="flex items-center justify-center gap-2 transition-all duration-200">
              <Tv className="w-4 h-4" />
              TV
            </TabsTrigger>
            <TabsTrigger value="wifi" className="flex items-center justify-center gap-2 transition-all duration-200" disabled={true}>
              <Wifi className="w-4 h-4" />
              WiFi
            </TabsTrigger>

            <TabsTrigger value="telco" className="flex items-center justify-center gap-2 transition-all duration-200">
              <Phone className="w-4 h-4" />
              Telco
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex items-center justify-center gap-2 transition-all duration-200">
              <PhilippinePeso className="w-4 h-4" />
              Bills
            </TabsTrigger>
            <TabsTrigger value="cashIn" className="flex items-center justify-center gap-2 transition-all duration-200">
              <CreditCard className="w-4 h-4" />
              Cash In
            </TabsTrigger>
          </TabsList>

          {/* GSAT Tab Content */}
          <TabsContent value="gsat">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeIn}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Satellite className="w-5 h-5 text-primary" />
                      Purchase GSAT ePINS
                    </CardTitle>
                    <CardDescription>Fill out the form below to purchase a GSAT ePINS.</CardDescription>
                  </CardHeader>
                </div>
                <div className="pr-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Transaction History
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-full max-h-[100vw] overflow-y-auto">
                      <DialogTitle>GSAT Transaction History</DialogTitle>
                      <SoldGsatVoucherTable />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <CardContent>
                <AnimatePresence>{transactionSuccess && <SuccessMessage type="GSAT" />}</AnimatePresence>
                {selectedProduct && gsatStockInfo.count === 0 && !gsatStockInfo.loading && (
                  <StockUnavailableMessage type="GSAT" />
                )}

                {loading ? (
                  <FormSkeletonLoader />
                ) : (
                  <form onSubmit={handleGsatSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="product" className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        Select Product
                      </Label>
                      <Select
                        value={selectedProduct}
                        onValueChange={(value: string) => {
                          setSelectedProduct(value)
                          setTransactionSuccess(false)
                        }}
                        disabled={gsatStockInfo.loading}
                      >
                        <SelectTrigger id="product" className="transition-all duration-200">
                          {gsatStockInfo.loading ? (
                            <div className="flex items-center">
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              <span>Loading products...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Select a Product" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {gsatProducts.map((product: any, index: number) => (
                            <SelectItem key={`product-${index}`} value={product.product_code}>
                              {product.product_code} - ₱{product.base_price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedProduct && (
                        <StockCountDisplay
                          count={gsatStockInfo.count}
                          isLowStock={gsatStockInfo.isLowStock}
                          loading={gsatStockInfo.loading}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stocks" className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        Enter Number of Stocks
                      </Label>
                      <Input
                        type="number"
                        id="stocks"
                        value={stocks}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value)
                          if (value > 0 || e.target.value === "") {
                            setStocks(value || 0)
                          }
                        }}
                        min="1"
                        max={gsatStockInfo.count}
                        placeholder="Enter stock quantity"
                        className="transition-all duration-200"
                      />
                      {stocks > gsatStockInfo.count && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Warning: You've selected {stocks} vouchers, but only {gsatStockInfo.count} are available.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gsatServiceFee" className="flex items-center gap-1">
                        <PhilippinePeso className="w-4 h-4" />
                        Service Fee (₱)
                      </Label>
                      <Input
                        type="number"
                        id="gsatServiceFee"
                        value={gsatServiceFee}
                        onChange={(e) => setGsatServiceFee(Number.parseFloat(e.target.value) || 0)}
                        placeholder="Enter service fee amount"
                        className="transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Enter Your Phone Number
                      </Label>
                      <Input
                        type="tel"
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter phone number"
                        className="transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className={`flex items-center gap-1 ${!email && isGsatFormSubmitted ? "text-red-500" : ""}`}
                      >
                        <Mail className="w-4 h-4" />
                        Enter Your Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email"
                        className={`transition-all duration-200 ${!email && isGsatFormSubmitted ? "border-red-500 focus:ring-red-500" : ""}`}
                        required
                      />
                      {!email && isGsatFormSubmitted && <p className="text-red-500 text-sm mt-1">Email is required</p>}
                    </div>

                    {selectedProduct && productInfo[selectedProduct]?.loading ? (
                      <PricingSkeleton />
                    ) : (
                      selectedProduct && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-muted rounded-md"
                        >
                          <div className="flex justify-between text-sm">
                            <span>Base Price:</span>
                            <span>₱{calculateGsatTotal().basePrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <span>
                              Your Price{" "}
                              <Badge>
                                {formatUserRole(productInfo[selectedProduct]?.userRole) || "Basic Merchant"}
                              </Badge>
                              :
                            </span>
                            <div className="flex items-center">
                              <span>₱{calculateGsatTotal().productPrice.toFixed(2)}</span>
                              {calculateGsatTotal().discountPercentage > 0 && (
                                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                                  -{calculateGsatTotal().discountPercentage.toFixed(1)}%
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Quantity:</span>
                            <span>{stocks}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>₱{calculateGsatTotal().subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Service Fee:</span>
                            <span>₱{Number.parseFloat(gsatServiceFee.toString()).toFixed(2)}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-medium">
                            <span>Total Amount:</span>
                            <span>₱{calculateGsatTotal().total.toFixed(2)}</span>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              Only ₱{calculateGsatTotal().subtotal.toFixed(2)} will be deducted from your credits.
                            </span>
                          </div>
                        </motion.div>
                      )
                    )}

                    <Button
                      type="submit"
                      className="w-full transition-all duration-300"
                      disabled={isLoading || !isGsatFormValid}
                    >
                      {isLoading ? (
                        <>
                          <Loader className="animate-spin mr-2" size={18} />
                          <span>Processing...</span>
                        </>
                      ) : gsatStockInfo.isLowStock ? (
                        <>
                          <AlertTriangle className="mr-2" size={18} />
                          <span>Low Stock! Contact Support</span>
                        </>
                      ) : (
                        <>
                          <Send className="mr-2" size={18} />
                          <span>Purchase GSAT ePINS</span>
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </motion.div>
          </TabsContent>

          {/* WiFi Tab Content */}
          <TabsContent value="wifi">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeIn}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-primary" />
                      Purchase WiFi Voucher
                    </CardTitle>
                    <CardDescription>Fill out the form below to purchase a WiFi voucher.</CardDescription>
                  </CardHeader>
                </div>
                <div className="pr-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Transaction History
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-4xl">
                      <DialogTitle>WiFi Transaction History</DialogTitle>
                      <SoldWiFiVoucherTable />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <CardContent>
                <AnimatePresence>{transactionSuccess && <SuccessMessage type="WiFi" />}</AnimatePresence>
                {wifiDuration && wifiStockInfo.count === 0 && !wifiStockInfo.loading && (
                  <StockUnavailableMessage type="WiFi" />
                )}

                {loading ? (
                  <FormSkeletonLoader />
                ) : (
                  <form onSubmit={handleWifiSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="wifi-duration" className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Voucher Duration
                      </Label>
                      <Select value={wifiDuration} onValueChange={setWifiDuration} disabled={wifiStockInfo.loading}>
                        <SelectTrigger id="wifi-duration" className="transition-all duration-200">
                          {wifiStockInfo.loading ? (
                            <div className="flex items-center">
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              <span>Loading durations...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Select duration" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {durations.map((duration) => (
                            <SelectItem key={duration} value={duration}>
                              {duration} - ₱{durationPrices[duration].toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {wifiDuration && (
                        <StockCountDisplay
                          count={wifiStockInfo.count}
                          isLowStock={wifiStockInfo.isLowStock}
                          loading={wifiStockInfo.loading}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wifi-stocks" className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        Number of Vouchers
                      </Label>
                      <Input
                        type="number"
                        id="wifi-stocks"
                        value={wifiStocks}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value)
                          if (value > 0 || e.target.value === "") {
                            setWifiStocks(value || 0)
                          }
                        }}
                        min="1"
                        max={wifiStockInfo.count}
                        placeholder="Enter quantity"
                        className="transition-all duration-200"
                      />
                      {wifiStocks > wifiStockInfo.count && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Warning: You've selected {wifiStocks} vouchers, but only {wifiStockInfo.count} are available.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wifiServiceFee" className="flex items-center gap-1">
                        <PhilippinePeso className="w-4 h-4" />
                        Service Fee (₱)
                      </Label>
                      <Input
                        type="number"
                        id="wifiServiceFee"
                        value={wifiServiceFee}
                        onChange={(e) => setWifiServiceFee(Number.parseFloat(e.target.value) || 0)}
                        placeholder="Enter service fee amount"
                        className="transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wifi-phone" className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </Label>
                      <Input
                        type="tel"
                        id="wifi-phone"
                        value={wifiPhoneNumber}
                        onChange={(e) => setWifiPhoneNumber(e.target.value)}
                        placeholder="Enter phone number"
                        className="transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="wifi-email"
                        className={`flex items-center gap-1 ${!wifiEmail && isWifiFormSubmitted ? "text-red-500" : ""}`}
                      >
                        <Mail className="w-4 h-4" />
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        id="wifi-email"
                        value={wifiEmail}
                        onChange={(e) => setWifiEmail(e.target.value)}
                        placeholder="Enter email"
                        className={`transition-all duration-200 ${!wifiEmail && isWifiFormSubmitted ? "border-red-500 focus:ring-red-500" : ""}`}
                        required
                      />
                      {!wifiEmail && isWifiFormSubmitted && (
                        <p className="text-red-500 text-sm mt-1">Email is required</p>
                      )}
                    </div>

                    {wifiDuration && wifiStockInfo.loading ? (
                      <PricingSkeleton />
                    ) : (
                      wifiDuration && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-muted rounded-md"
                        >
                          <div className="flex justify-between text-sm">
                            <span>WiFi Package:</span>
                            <span>₱{calculateWifiTotal().durationPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Quantity:</span>
                            <span>{wifiStocks}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>₱{calculateWifiTotal().subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Service Fee:</span>
                            <span>₱{Number.parseFloat(wifiServiceFee.toString()).toFixed(2)}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-medium">
                            <span>Total Amount:</span>
                            <span>₱{calculateWifiTotal().total.toFixed(2)}</span>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              Only ₱{calculateWifiTotal().subtotal.toFixed(2)} will be deducted from your credits.
                            </span>
                          </div>
                        </motion.div>
                      )
                    )}

                    <Button
                      type="submit"
                      className="w-full transition-all duration-300"
                      disabled={isWifiLoading || !isWifiFormValid}
                    >
                      {isWifiLoading ? (
                        <>
                          <Loader className="animate-spin mr-2" size={18} />
                          <span>Processing...</span>
                        </>
                      ) : wifiStockInfo.isLowStock ? (
                        <>
                          <AlertTriangle className="mr-2" size={18} />
                          <span>Low Stock! Contact Support</span>
                        </>
                      ) : (
                        <>
                          <Send className="mr-2" size={18} />
                          <span>Purchase WiFi Voucher</span>
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </motion.div>
          </TabsContent>

          {/* TV Tab Content */}
          <TabsContent value="tv">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeIn}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tv className="w-5 h-5 text-primary" />
                      Purchase TV Subscription
                    </CardTitle>
                    <CardDescription>Fill out the form below to purchase a TV subscription package.</CardDescription>
                  </CardHeader>
                </div>
                <div className="pr-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Transaction History
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-full max-h-[100vw] overflow-y-auto">
                      <DialogTitle>TV Transaction History</DialogTitle>
                      <SoldTvVoucherTable />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <CardContent>
                <AnimatePresence>{transactionSuccess && <SuccessMessage type="TV" />}</AnimatePresence>
                {selectedTvPackage && tvStockInfo.count === 0 && !tvStockInfo.loading && (
                  <StockUnavailableMessage type="TV" />
                )}

                {loading ? (
                  <FormSkeletonLoader />
                ) : (
                  <form className="space-y-4" onSubmit={handleTvSubmit}>
                    {/* Replace the TV package selection section in the form with this implementation */}
                    <div className="space-y-2">
                      <Label htmlFor="tv-package" className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        Select Package
                      </Label>
                      <Select
                        value={selectedTvPackage}
                        onValueChange={setSelectedTvPackage}
                        disabled={tvStockInfo.loading}
                      >
                        <SelectTrigger id="tv-package" className="transition-all duration-200">
                          {tvStockInfo.loading ? (
                            <div className="flex items-center">
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              <span>Loading packages...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Select a Package" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {tvPackages.map((tvPackage, index) => (
                            <SelectItem key={`tv-package-${index}`} value={tvPackage}>
                              {tvPackage} - ₱{tvPackagePrices[index] || 0} - {tvPackageInclusions[index]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedTvPackage && (
                        <StockCountDisplay
                          count={tvStockInfo.count}
                          isLowStock={tvStockInfo.isLowStock}
                          loading={tvStockInfo.loading}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tv-stocks" className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        Enter Number of Subscriptions
                      </Label>
                      <Input
                        type="number"
                        id="tv-stocks"
                        value={tvStocks}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value)
                          if (value > 0 || e.target.value === "") {
                            setTvStocks(value || 0)
                          }
                        }}
                        min="1"
                        max={tvStockInfo.count}
                        placeholder="Enter subscription quantity"
                        className="transition-all duration-200"
                      />
                      {tvStocks > tvStockInfo.count && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Warning: You've selected {tvStocks} subscriptions, but only {tvStockInfo.count} are available.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tv-serviceFee" className="flex items-center gap-1">
                        <PhilippinePeso className="w-4 h-4" />
                        Service Fee (₱)
                      </Label>
                      <Input
                        type="number"
                        id="tv-serviceFee"
                        value={tvServiceFee}
                        onChange={(e) => setTvServiceFee(Number.parseFloat(e.target.value) || 0)}
                        placeholder="Enter service fee amount"
                        className="transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tv-phone" className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </Label>
                      <Input
                        type="tel"
                        id="tv-phone"
                        value={tvPhoneNumber}
                        onChange={(e) => setTvPhoneNumber(e.target.value)}
                        placeholder="Enter phone number"
                        className="transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="tv-email"
                        className={`flex items-center gap-1 ${!tvEmail && isTvFormSubmitted ? "text-red-500" : ""}`}
                      >
                        <Mail className="w-4 h-4" />
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        id="tv-email"
                        value={tvEmail}
                        onChange={(e) => setTvEmail(e.target.value)}
                        placeholder="Enter email"
                        className={`transition-all duration-200 ${!tvEmail && isTvFormSubmitted ? "border-red-500 focus:ring-red-500" : ""}`}
                        required
                      />
                      {!tvEmail && isTvFormSubmitted && <p className="text-red-500 text-sm mt-1">Email is required</p>}
                    </div>

                    {/* Replace the TV pricing display section with this implementation */}
                    {selectedTvPackage && tvProductInfo[selectedTvPackage]?.loading ? (
                      <PricingSkeleton />
                    ) : (
                      selectedTvPackage && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-muted rounded-md"
                        >
                          <div className="flex justify-between text-sm">
                            <span>Base Price:</span>
                            <span>₱{calculateTvTotal().basePrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <span>
                              Your Price{" "}
                              <Badge>
                                {formatUserRole(tvProductInfo[selectedTvPackage]?.userRole) || "Basic Merchant"}
                              </Badge>
                              :
                            </span>
                            <div className="flex items-center">
                              <span>₱{calculateTvTotal().packagePrice.toFixed(2)}</span>
                              {calculateTvTotal().discountPercentage > 0 && (
                                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                                  -{calculateTvTotal().discountPercentage.toFixed(1)}%
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Quantity:</span>
                            <span>{tvStocks}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>₱{calculateTvTotal().subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Service Fee:</span>
                            <span>₱{Number.parseFloat(tvServiceFee.toString()).toFixed(2)}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-medium">
                            <span>Total Amount:</span>
                            <span>₱{calculateTvTotal().total.toFixed(2)}</span>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              Only ₱{calculateTvTotal().subtotal.toFixed(2)} will be deducted from your credits.
                            </span>
                          </div>
                        </motion.div>
                      )
                    )}

                    <Button
                      type="submit"
                      className="w-full transition-all duration-300"
                      disabled={isTvLoading || !isTvFormValid}
                    >
                      {isTvLoading ? (
                        <>
                          <Loader className="animate-spin mr-2" size={18} />
                          <span>Processing...</span>
                        </>
                      ) : tvStockInfo.isLowStock ? (
                        <>
                          <AlertTriangle className="mr-2" size={18} />
                          <span>Low Stock! Contact Support</span>
                        </>
                      ) : (
                        <>
                          <Send className="mr-2" size={18} />
                          <span>Purchase TV Subscription</span>
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </motion.div>
          </TabsContent>

          {/* Telco Tab Content */}
          <TabsContent value="telco">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeIn}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-primary" />
                      Telco E-load Subscription Management
                    </CardTitle>
                    <CardDescription>Purchase mobile load for any Philippine telco provider.</CardDescription>
                  </CardHeader>
                </div>
                <div className="pr-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Transaction History
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-4xl">
                      <DialogTitle>Telco Transaction History</DialogTitle>
                      <div className="py-10 text-center">
                        <TelcoTransactionsTable/>
                        
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <CardContent>
                <TelcoInterface />
              </CardContent>
            </motion.div>
          </TabsContent>

          {/* Only Bills and CashIn Tab Content */}
          {["bills", "cashIn"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={fadeIn}
                className="bg-white rounded-lg shadow-sm border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {tab === "bills" ? (
                          <PhilippinePeso className="w-5 h-5 text-primary" />
                        ) : (
                          <CreditCard className="w-5 h-5 text-primary" />
                        )}
                        {tab === "bills" ? "Bills Payment Management" : "E-Wallet Management"}
                      </CardTitle>
                      <CardDescription>
                        Manage your {tab === "bills" ? "bill payments" : "e-wallet transactions"} and packages here.
                      </CardDescription>
                    </CardHeader>
                  </div>
                  <div className="pr-6">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Transaction History
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-full max-w-4xl">
                        <DialogTitle>{tab.charAt(0).toUpperCase() + tab.slice(1)} Transaction History</DialogTitle>
                        <div className="py-10 text-center">
                          <p>No transactions available.</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <CardContent className="space-y-4 flex flex-col justify-center items-center py-16">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {tab === "bills" ? (
                      <PhilippinePeso className="w-16 h-16 text-muted-foreground mb-4" />
                    ) : (
                      <CreditCard className="w-16 h-16 text-muted-foreground mb-4" />
                    )}
                  </motion.div>
                  <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-4xl font-bold text-muted-foreground"
                  >
                    Coming soon...
                  </motion.h1>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-muted-foreground text-center max-w-md"
                  >
                    We're working hard to bring you {tab === "bills" ? "bill payment" : "e-wallet"} functionality. Check
                    back soon for updates!
                  </motion.p>
                </CardContent>
                <CardFooter></CardFooter>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
}

export default SellVoucher

