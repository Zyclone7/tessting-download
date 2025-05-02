  "use client"

  import type React from "react"
  import { useState, useEffect } from "react"
  import { Phone, Info, Globe, Zap, Wifi, RefreshCw, CheckCircle, XCircle, Loader, ArrowLeft } from "lucide-react"
  import { generateRequestId } from "@/lib/recharge360"
  import { motion, AnimatePresence } from "framer-motion"
  import { Button } from "@/components/ui/button"
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
  import { Input } from "@/components/ui/input"
  import { Badge } from "@/components/ui/badge"
  import { TelcoPaymentDialog } from "./telco-payment-dialog"
  import { useUserContext } from "@/hooks/use-user"
  import { getUserProfile } from "@/actions/user"
  import { deductUserCredits } from "@/actions/telco"

  // Define TypeScript interfaces
  interface FormData {
    requestId: string
    productCode: string
    recipient: string
  }

  interface TelcoProvider {
    id: string
    name: string
    logo: string
    productCode: string
    useIcon: boolean
    color: string
  }

  interface Promo {
    id: string
    name: string
    description: string
    price: number
    validity: string
    type: string
    icon: React.ReactNode
    productCode: string
  }

  interface DispenseResponse {
    rrn: string
    token: string
    balance: string
    requestId?: string
  }

  interface ErrorResponse {
    code: string
    message: string
    requestId?: string
  }

  type ApiResponse = DispenseResponse | ErrorResponse

  const TelcoRechargeInterface: React.FC = () => {
    const { user } = useUserContext()
    
    // Form state - this is what we'll use for the API
    const [formData, setFormData] = useState<FormData>({
      requestId: generateRequestId(),
      productCode: "PINTEST01",
      recipient: "",
    })

    // UI state for the modern interface
    const [selectedTelco, setSelectedTelco] = useState<string>("")
    const [phoneNumber, setPhoneNumber] = useState<string>("")
    const [amount, setAmount] = useState<string>("")
    const [openLoadDialog, setOpenLoadDialog] = useState<boolean>(false)
    const [showPromoDialog, setShowPromoDialog] = useState<boolean>(false)
    const [confirmationDialog, setConfirmationDialog] = useState<boolean>(false)
    const [showResultDialog, setShowResultDialog] = useState<boolean>(false)
    const [currentTelco, setCurrentTelco] = useState<TelcoProvider | null>(null)
    const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null)
    const [processingTransaction, setProcessingTransaction] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [result, setResult] = useState<ApiResponse | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<string>("promos")
    const [isTransactionSuccessful, setIsTransactionSuccessful] = useState<boolean>(false)
    const [currentStep, setCurrentStep] = useState<number>(1)
    const [showPaymentDialog, setShowPaymentDialog] = useState<boolean>(false)
    const [userRole, setUserRole] = useState<string>("")
    
    // User credit state
    const [userCredit, setUserCredit] = useState<number>(0)
    const [isLoadingCredit, setIsLoadingCredit] = useState<boolean>(true)

    // Fetch user credit from profile data
    useEffect(() => {
      const fetchUserCredit = async () => {
        if (user && user.id) {
          setIsLoadingCredit(true)
          try {
            const response = await getUserProfile(user.id.toString())
            if (response.success && response.data) {
              // Assuming getUserProfile returns credit_balance
              setUserCredit(response.data.user_credits || 0) // Replace 'credit_balance' with the correct property name
            }
          } catch (error) {
            console.error("Error fetching user credit:", error)
          } finally {
            setIsLoadingCredit(false)
          }
        }
      }

      fetchUserCredit()
    }, [user])

    // Telco providers data with added color property
    const telcoProviders: TelcoProvider[] = [
      {
        id: "globe",
        name: "Globe",
        logo: "/images/load/globe.png", // Update path to your actual logo
        productCode: "PINTEST01",
        useIcon: false, // Change to false to use the logo image
        color: "#0066CC",
      },
      {
        id: "smart",
        name: "Smart",
        logo: "/images/load/smart.png", // Update path to your actual logo
        productCode: "PINTEST01",
        useIcon: false, // Change to false to use the logo image
        color: "#00B140",
      },
    ]

    // Preset load amounts
    const loadAmounts: number[] = [10, 20, 50, 100, 200, 300, 500, 1000]

    const getPromos = (telcoId: string): Promo[] => {
      const productCode = telcoProviders.find((provider) => provider.id === telcoId)?.productCode || ""

      switch (telcoId) {
        case "globe":
          return [
            {
              id: "gosurf99",
              name: "GoSURF99",
              description: "8GB data, unli all-net texts, valid for 7 days",
              price: 99,
              validity: "7 days",
              type: "data",
              icon: <Wifi className="h-5 w-5 text-blue-500" />,
              productCode,
            },
            {
              id: "goplus129",
              name: "Go+ 129",
              description: "10GB data, unli all-net calls & texts, valid for 7 days",
              price: 129,
              validity: "7 days",
              type: "combo",
              icon: <Zap className="h-5 w-5 text-green-500" />,
              productCode,
            },
          ]
        case "smart":
          return [
            {
              id: "giga99",
              name: "GIGA 99",
              description: "8GB data, unli all-net texts, valid for 7 days",
              price: 99,
              validity: "7 days",
              type: "data",
              icon: <Wifi className="h-5 w-5 text-blue-500" />,
              productCode,
            },
            {
              id: "giga149",
              name: "GIGA+ 149",
              description: "12GB data, unli all-net calls & texts, valid for 7 days",
              price: 149,
              validity: "7 days",
              type: "combo",
              icon: <Zap className="h-5 w-5 text-green-500" />,
              productCode,
            },
          ]
        default:
          return []
      }
    }

    const generateNewRequestId = (): void => {
      setFormData((prev) => ({ ...prev, requestId: generateRequestId() }))
    }

    const formatPhoneNumber = (number: string): string => {
      const cleaned = number.replace(/\D/g, "")
      if (cleaned.length >= 10) {
        return cleaned.slice(0, 3) + " " + cleaned.slice(3, 6) + " " + cleaned.slice(6, 10)
      }
      return cleaned
    }

    const formatPhoneNumberForApi = (number: string): string => {
      const cleaned = number.replace(/\D/g, "")
      return cleaned.length === 10 ? `0${cleaned}` : cleaned
    }

    const handleTelcoSelect = (provider: TelcoProvider): void => {
      setSelectedTelco(provider.id)
      setCurrentTelco(provider)
      setOpenLoadDialog(true)
      setFormData((prev) => ({ ...prev, productCode: provider.productCode }))
      setCurrentStep(2)
    }

    const handleProceed = (): void => {
      if (phoneNumber) {
        setOpenLoadDialog(false)
        setShowPromoDialog(true)
        setCurrentStep(3)
      }
    }

    const handlePromoSelect = (promo: Promo): void => {
      setSelectedPromo(promo)
      setShowPromoDialog(false)
      setConfirmationDialog(true)
      setCurrentStep(4)

      setFormData((prev) => ({
        ...prev,
        productCode: promo.productCode,
        recipient: formatPhoneNumberForApi(phoneNumber),
      }))
    }

    const handleRegularLoadSelect = (amt: number): void => {
      setAmount(amt.toString())
      setShowPromoDialog(false)

      const productCode = currentTelco?.productCode || ""

      const regularPromo: Promo = {
        id: "regular",
        name: "Regular Load",
        description: `₱${amt} regular load credit`,
        price: amt,
        validity: "No expiry",
        type: "regular",
        icon: <Phone className="h-5 w-5 text-gray-500" />,
        productCode,
      }

      setSelectedPromo(regularPromo)
      setConfirmationDialog(true)
      setCurrentStep(4)

      setFormData((prev) => ({
        ...prev,
        productCode: productCode,
        recipient: formatPhoneNumberForApi(phoneNumber),
      }))
    }

    const handleCustomAmountSubmit = (): void => {
      if (amount && Number.parseFloat(amount) >= 10) {
        setShowPromoDialog(false)

        const productCode = currentTelco?.productCode || ""

        const customPromo: Promo = {
          id: "custom",
          name: "Custom Load",
          description: `₱${amount} regular load credit`,
          price: Number.parseFloat(amount),
          validity: "No expiry",
          type: "regular",
          icon: <Phone className="h-5 w-5 text-gray-500" />,
          productCode,
        }

        setSelectedPromo(customPromo)
        setConfirmationDialog(true)
        setCurrentStep(4)

        setFormData((prev) => ({
          ...prev,
          productCode: productCode,
          recipient: formatPhoneNumberForApi(phoneNumber),
        }))
      }
    }

    const handleSubmit = async (): Promise<void> => {
      setShowPaymentDialog(true)
    }

  // In the TelcoRechargeInterface.tsx file, update the handlePaymentSuccess function:

  const handlePaymentSuccess = async (paymentMethod: string): Promise<void> => {
    setShowPaymentDialog(false);
    setProcessingTransaction(true);
    setIsLoading(true);
    setConfirmationDialog(false);
  
    // Get provider discount percentage
    const providerDiscountPercentage = currentTelco?.id === "globe" ? 0.02 : currentTelco?.id === "smart" ? 0.01 : 0;
    
    // Calculate the base amount
    const baseAmount = selectedPromo ? selectedPromo.price : Number(amount);
    const serviceFee = 5; // Default service fee
  
    try {
      // If payment method is credits, deduct from user's account
      if (paymentMethod === "credits") {
        const creditDeductionResult = await deductUserCredits(
          user?.id ?? "",
          baseAmount,
          providerDiscountPercentage,
          serviceFee,
          paymentMethod
        );
        
        if (!creditDeductionResult.success) {
          setIsTransactionSuccessful(false);
          setError(creditDeductionResult.message);
          setShowResultDialog(true);
          setCurrentStep(5);
          setProcessingTransaction(false);
          setIsLoading(false);
          return;
        }
        
        // Update local state with new credit balance
        setUserCredit(creditDeductionResult.remainingCredits ?? 0);
      }
  
      // Continue with the rest of your transaction code...
      // Create transaction data object
      const transactionData = {
        ...formData,
        paymentMethod,
        amount: baseAmount,
        provider_name: currentTelco?.name || "",
        promo_name: selectedPromo?.name || "Regular Load",
        promo_description: selectedPromo?.description || `${baseAmount} regular load credit`,
        validity: selectedPromo?.validity || "No expiry",
        service_fee: serviceFee,
        provider_discount: baseAmount * providerDiscountPercentage,
        subtotal: baseAmount - (baseAmount * providerDiscountPercentage),
        total: (baseAmount - (baseAmount * providerDiscountPercentage)) + serviceFee,
        user_id: user?.id
      };

      // Call your API route
      const response = await fetch("/api/dispense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      const data = (await response.json()) as ApiResponse

      setResult(data)

      if (response.ok) {
        // Success
        if (!("code" in data)) {
          // Update user credit after successful transaction if paid with credits
          if (paymentMethod === "credits" && selectedPromo) {
            // Important: Apply the discount first, then deduct
            // The TelcoPaymentDialog already calculated the discounted price
            // which includes provider discount (1% for Smart, 2% for Globe)
            
            // Get provider discount percentage
            const providerDiscountPercentage = currentTelco?.id === "globe" ? 0.02 : currentTelco?.id === "smart" ? 0.01 : 0
            
            // Calculate the discounted product price
            const discountedPrice = selectedPromo.price * (1 - providerDiscountPercentage)
            
            // Add service fee (which doesn't get discounted)
            const serviceFee = 5 // Default service fee
            const totalDeducted = discountedPrice + serviceFee
            
            // Deduct from user credit
            setUserCredit(prevCredit => prevCredit - totalDeducted)
          }
          
          setIsTransactionSuccessful(true)
          setShowResultDialog(true)
          setCurrentStep(5)
        } else {
          // API returned error
          setIsTransactionSuccessful(false)
          setError(data.message || "Transaction failed")
          setShowResultDialog(true)
          setCurrentStep(5)
        }
      } else {
        // HTTP error
        setIsTransactionSuccessful(false)
        setError((data as ErrorResponse).message || "Server error")
        setShowResultDialog(true)
        setCurrentStep(5)
      }
    } catch (err) {
      setIsTransactionSuccessful(false)
      setError(err instanceof Error ? err.message : "Failed to process transaction")
      setShowResultDialog(true)
      setCurrentStep(5)
    } finally {
      setProcessingTransaction(false)
      setIsLoading(false)
    }
  }

    const handleReset = (): void => {
      setShowResultDialog(false)
      setSelectedPromo(null)
      setPhoneNumber("")
      setAmount("")
      setSelectedTelco("")
      setCurrentTelco(null)
      setResult(null)
      setError(null)
      setIsTransactionSuccessful(false)
      setCurrentStep(1)
      setFormData({
        requestId: generateRequestId(),
        productCode: "PINTEST01",
        recipient: "",
      })
    }

    const handleBack = (): void => {
      if (showPromoDialog) {
        setShowPromoDialog(false)
        setOpenLoadDialog(true)
        setCurrentStep(2)
      } else if (confirmationDialog) {
        setConfirmationDialog(false)
        setShowPromoDialog(true)
        setCurrentStep(3)
      }
    }

    return (
      <div className="max-w-4xl mx-auto p-4">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                    currentStep === step
                      ? "bg-blue-600 text-white"
                      : currentStep > step
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
                </div>
                <span className="text-xs text-gray-500 hidden md:block">
                  {step === 1 && "Provider"}
                  {step === 2 && "Number"}
                  {step === 3 && "Product"}
                  {step === 4 && "Confirm"}
                  {step === 5 && "Result"}
                </span>
              </div>
            ))}
          </div>
          <div className="relative mt-2">
            <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full rounded-full"></div>
            <div
              className="absolute top-0 left-0 h-1 bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep - 1) * 25}%` }}
            ></div>
          </div>
        </div>

        {/* Development Notice - Hidden by default */}
        <div className="hidden">
          <div className="flex items-center">
            <Info className="h-4 w-4 text-orange-500 mr-2" />
            <h3 className="text-lg font-medium text-orange-800">Development Notice</h3>
          </div>
          <p className="text-orange-700 mt-1">
            The Telco E-load feature is connected to Recharge360 API. Request ID: {formData.requestId}
            <button
              className="ml-2 px-3 py-1 border border-gray-300 bg-white rounded-md text-sm flex items-center hover:bg-gray-50"
              onClick={generateNewRequestId}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Generate New ID
            </button>
          </p>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Select Telco Provider</CardTitle>
                  <CardDescription>Choose your mobile provider to continue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {telcoProviders.map((provider) => (
                      <motion.div
                        key={provider.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center p-6 rounded-lg cursor-pointer transition-all border ${
                          selectedTelco === provider.id
                            ? "border-2 border-blue-500 shadow-md"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => handleTelcoSelect(provider)}
                      >
                        <div
                          className="h-12 w-12 flex items-center justify-center mr-6 rounded-full overflow-hidden"
                          style={{ backgroundColor: provider.useIcon ? `${provider.color}20` : "transparent" }}
                        >
                          {provider.useIcon ? (
                            provider.id === "globe" ? (
                              <Globe className="w-8 h-8" style={{ color: provider.color }} />
                            ) : (
                              <Phone className="w-8 h-8" style={{ color: provider.color }} />
                            )
                          ) : (
                            <img
                              src={provider.logo || "/placeholder.svg"}
                              alt={`${provider.name} logo`}
                              className="h-full w-full object-contain"
                            />
                          )}
                        </div>
                        <div>
                          <span className="text-lg font-medium">{provider.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {provider.productCode}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phone Number Entry Dialog */}
        {openLoadDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center">
                {currentTelco && (
                  <div
                    className="h-10 w-10 flex items-center justify-center mr-4 rounded-full overflow-hidden"
                    style={{ backgroundColor: currentTelco.useIcon ? `${currentTelco.color}20` : "transparent" }}
                  >
                    {currentTelco.useIcon ? (
                      currentTelco.id === "globe" ? (
                        <Globe className="w-6 h-6" style={{ color: currentTelco.color }} />
                      ) : (
                        <Phone className="w-6 h-6" style={{ color: currentTelco.color }} />
                      )
                    ) : (
                      <img
                        src={currentTelco.logo || "/placeholder.svg"}
                        alt={`${currentTelco.name} logo`}
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium">Enter Phone Number</h3>
                  <p className="text-gray-500 text-sm">Enter the phone number to load for {currentTelco?.name}</p>
                </div>
              </div>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="flex">
                    <div className="bg-gray-100 px-3 flex items-center rounded-l-md border border-r-0 border-gray-300">
                      +63
                    </div>
                    <Input
                      id="phone"
                      className="flex-1 rounded-r-md"
                      placeholder="9XX XXX XXXX"
                      value={phoneNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        // Only allow digits and handle auto-correction
                        let value = e.target.value.replace(/\D/g, "")

                        // Auto-correct if user inputs "09" prefix
                        if (value.startsWith("09")) {
                          value = value.substring(1) // Remove the leading 0
                        }

                        if (value.length <= 10) {
                          setPhoneNumber(value)
                        }
                      }}
                    />
                  </div>
                  {phoneNumber.length > 0 && phoneNumber.length < 10 && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-xs text-orange-500 mt-1"
                    >
                      Please enter a 10-digit number (9XX XXX XXXX)
                    </motion.p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenLoadDialog(false)
                    setCurrentStep(1)
                  }}
                >
                  Cancel
                </Button>
                <Button disabled={phoneNumber.length !== 10} onClick={handleProceed}>
                  Proceed
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Promo Selection Dialog */}
        {showPromoDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl"
            >
              <div className="mb-4">
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" className="mr-2 h-8 w-8" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h3 className="text-lg font-medium">Choose Load Type</h3>
                    <div className="flex items-center text-gray-500 text-sm">
                      <span className="mr-2">Loading for:</span>
                      <Badge variant="secondary">+63 {formatPhoneNumber(phoneNumber)}</Badge>
                      <Badge
                        variant="outline"
                        className="ml-2"
                        style={{ color: currentTelco?.color, borderColor: currentTelco?.color }}
                      >
                        {currentTelco?.name}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="promos" className="w-full" onValueChange={setActiveTab} value={activeTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="promos">Promos</TabsTrigger>
                  <TabsTrigger value="regular">Regular Load</TabsTrigger>
                </TabsList>

                <TabsContent value="promos" className="space-y-4">
                  <div className="grid gap-3">
                    {currentTelco &&
                      getPromos(currentTelco.id).map((promo) => (
                        <motion.div
                          key={promo.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="border rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                          onClick={() => handlePromoSelect(promo)}
                        >
                          <div className="flex items-center">
                            <div className="p-3 rounded-full mr-3" style={{ backgroundColor: `${currentTelco.color}15` }}>
                              {promo.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">{promo.name}</h3>
                                <Badge className="ml-2 bg-green-50 text-green-700 hover:bg-green-50">
                                  ₱{promo.price}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
                              <div className="text-xs text-gray-500 mt-1 flex items-center">
                                <Badge variant="outline" className="text-xs">
                                  Valid for {promo.validity}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="regular" className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Select Amount</label>
                  <div className="grid grid-cols-4 gap-3">
                    {loadAmounts.map((amt) => (
                      <motion.div
                        key={amt}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="py-3 border rounded-md text-center cursor-pointer transition-all hover:border-blue-300 hover:shadow-sm"
                        onClick={() => handleRegularLoadSelect(amt)}
                      >
                        ₱{amt}
                      </motion.div>
                    ))}
                  </div>

                  <div className="space-y-2 mt-6">
                    <label htmlFor="custom-amount" className="block text-sm font-medium text-gray-700">
                      Or enter custom amount
                    </label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500">₱</span>
                        </div>
                        <Input
                          id="custom-amount"
                          className="pl-7"
                          placeholder="Enter amount"
                          value={amount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                          type="number"
                        />
                      </div>
                      <Button disabled={!amount || Number.parseFloat(amount) < 10} onClick={handleCustomAmountSubmit}>
                        Proceed
                      </Button>
                    </div>
                    {amount && Number.parseFloat(amount) < 10 && (
                      <p className="text-xs text-orange-500">Minimum amount is ₱10</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmationDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl"
            >
              <div className="mb-4">
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" className="mr-2 h-8 w-8" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h3 className="text-lg font-medium">Confirm Purchase</h3>
                    <p className="text-gray-500 text-sm">Please review your selection before proceeding</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 py-4">
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-gray-600">Telco Provider:</div>
                      <div className="font-medium">{currentTelco?.name}</div>

                      <div className="text-gray-600">Phone Number:</div>
                      <div className="font-medium">+63 {formatPhoneNumber(phoneNumber)}</div>

                      <div className="text-gray-600">Load Type:</div>
                      <div className="font-medium">{selectedPromo?.name}</div>

                      <div className="text-gray-600">Description:</div>
                      <div className="font-medium">{selectedPromo?.description}</div>

                      <div className="text-gray-600">Validity:</div>
                      <div className="font-medium">{selectedPromo?.validity}</div>

                      <div className="text-gray-600">Amount:</div>
                      <div className="font-medium text-green-600">₱{selectedPromo?.price.toFixed(2)}</div>

                      <div className="text-gray-600">Product Code:</div>
                      <div className="font-medium">{selectedPromo?.productCode}</div>

                      <div className="text-gray-600">Request ID:</div>
                      <div className="font-medium text-xs">{formData.requestId}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-100">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
                      <div>
                        <h4 className="font-medium text-blue-800">Purchase Notice</h4>
                        <p className="text-blue-700 text-sm">
                          Clicking proceed will initiate the transaction to load the selected product to the provided
                          phone number.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading} className="relative">
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Buy Product"
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
  {/* Transaction Result Dialog */}
  {showResultDialog && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl"
      >
        <div className="mb-4 text-center">
          <h3 className="text-xl font-medium">
            {processingTransaction 
              ? "Processing Transaction" 
              : isTransactionSuccessful 
                ? "Transaction Successful" 
                : "Transaction Failed"}
          </h3>
        </div>

        <div className="py-6 text-center">
          {processingTransaction ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 100 }}
            >
              <Loader className="h-20 w-20 text-blue-500 mx-auto animate-spin" />
              <p className="mt-4 text-blue-600 font-medium">Processing your transaction...</p>
              <p className="mt-2 text-gray-600">Please wait while we process your request.</p>
            </motion.div>
          ) : isTransactionSuccessful ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 100 }}
            >
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
              <p className="mt-4 text-green-600 font-medium">Your load has been successfully processed!</p>
              {result && !("code" in result) && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg text-left">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">Reference Number:</div>
                    <div className="font-medium">{result.rrn}</div>

                    {result.token && (
                      <>
                        <div className="text-gray-600">Token:</div>
                        <div className="font-medium">{result.token}</div>
                      </>
                    )}

                    {result.balance && (
                      <>
                        <div className="text-gray-600">Balance:</div>
                        <div className="font-medium">{result.balance}</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 100 }}
            >
              <XCircle className="h-20 w-20 text-red-500 mx-auto" />
              <p className="mt-4 text-red-600 font-medium">Transaction failed</p>
              {error && <p className="mt-2 text-gray-600">{error}</p>}
            </motion.div>
          )}
        </div>

        <div className="flex justify-center space-x-4 mt-6">
          {!processingTransaction && (
            <>
              <Button onClick={handleReset} className="px-6">
                New Purchase
              </Button>
              <Button variant="outline" onClick={() => setShowResultDialog(false)}>
                Close
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )}
        {/* Payment Dialog */}
        {showPaymentDialog && selectedPromo && (
          <TelcoPaymentDialog
            open={showPaymentDialog}
            onClose={() => setShowPaymentDialog(false)}
            bookingDetails={{
              typeOfVoucher: "TELCO",
              product_code: selectedPromo.productCode,
              productName: selectedPromo.name,
              email: "user@example.com", // This would come from user context
              phoneNumber: phoneNumber,
              quantity: 1,
              serviceFee: 5, // Example service fee
              pricing: {
                basePrice: selectedPromo.price,
                productPrice: selectedPromo.price,
                subtotal: selectedPromo.price,
                total: selectedPromo.price + 5, // Adding service fee
                discountPercentage: 0,
                userRole: userRole,
              },
              telcoProvider: currentTelco?.name,
            }}
            onBookingSuccess={handlePaymentSuccess}
            userCredit={userCredit}
          />
        )}
      </div>
    )
  }

  export default TelcoRechargeInterface
