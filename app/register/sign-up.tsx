"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import ReCAPTCHA from "react-google-recaptcha"
import Link from "next/link"
import Image from "next/image"
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  FileText,
  ChevronRight,
  Store,
  Wallet,
  Landmark,
  ShoppingBag,
} from "lucide-react"
import { CreditCardIcon, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { getInvitationCodeByCodeforRegister } from "@/actions/invitation-codes"
import { TermsAndConditionsDialog } from "./terms-and-conditions-dialog"
import { DataPrivacyDialog } from "./data-privacy-dialog"
import { NavigationMenuDemo } from "@/components/user-navigation"
import { fetchProducts } from "@/actions/package-products"
import { applyReferralIncentives } from "@/actions/referral-incentive"
import { isEmailExist } from "@/actions/user"
import { LoadingOverlay } from "@/components/loading-overlay"
import Visa from "@/public/paymongo/visa.png"
import OTC from "@/public/paymongo/otc.png"
import UnionBank from "@/public/paymongo/union_bank.png"
import GCASH from "@/public/paymongo/gcash.png"
import Maya from "@/public/paymongo/maya.svg"
import Atome from "@/public/paymongo/atome.png"
import GrabPay from "@/public/paymongo/grabpay.png"
import BPI from "@/public/paymongo/bpi.png"

// Types
interface FormErrors {
  user_login?: string
  first_name?: string
  last_name?: string
  user_email?: string
  user_role?: string
  user_referral_code?: string
  user_contact_number?: string
  business_name?: string
  business_address?: string
  terms_accepted?: string
}

interface UserData {
  user_login: string
  first_name: string
  last_name: string
  user_nicename: string
  user_email: string
  user_contact_number: string
  user_role: string
  user_referral_code: string
  user_upline_id?: number | null
  user_referred_by_id?: number
  user_level?: any | null
  business_name: string
  business_address: string
  terms_accepted: boolean
  dataprivacy_accepted?: boolean
}

interface Product {
  id: number
  name: string
  label: string
  short_description: string
  payment_type: string
  price: number
  status: number
  the_order: number
  created_at: number
  category: string
  image: string
  package_type: string
  features: string[]
  earn_description: string
  refer_earn: boolean
}

// Payment method data with placeholder base64 images
const PAYMENT_METHODS = [
  {
    id: "credit-card",
    name: "Credit/Debit Card",
    image: Visa
  },
  {
    id: "otc",
    name: "OTC",
    image: OTC
  },
  {
    id: "unionbank",
    name: "UnionBank Online",
    image: UnionBank
  },
  {
    id: "gcash",
    name: "GCash",
    image: GCASH
  },
  {
    id: "maya",
    name: "Maya",
    image: Maya
  },
  {
    id: "atome",
    name: "Atome",
    image: Atome
  },
  {
    id: "grabpay",
    name: "GrabPay",
    image: GrabPay
  },
  {
    id: "bpi",
    name: "BPI Online",
    image: BPI
  }
];

// Validation function with Gmail-only validation
const validateForm = (data: UserData): FormErrors => {
  const errors: FormErrors = {}

  if (data.first_name.length < 2) {
    errors.first_name = "First name must be at least 2 characters long"
  }
  if (data.last_name.length < 2) {
    errors.last_name = "Last name must be at least 2 characters long"
  }

  // Gmail-only validation
  const gmailRegex = /^[^\s@]+@gmail\.com$/i
  if (!gmailRegex.test(data.user_email)) {
    errors.user_email = "Please enter a valid Gmail address (example@gmail.com)"
  }

  if (!data.user_role && !data.user_referral_code) {
    errors.user_role = "Please select a package or enter an activation code"
  }

  if (!/^\d{11}$/.test(data.user_contact_number)) {
    errors.user_contact_number = "Please enter a valid 11-digit contact number"
  }

  if (data.business_name.trim().length < 2) {
    errors.business_name = "Business name must be at least 2 characters long"
  }

  if (data.business_address.trim().length < 5) {
    errors.business_address = "Please enter a valid business address"
  }

  if (!data.terms_accepted) {
    errors.terms_accepted = "You must accept the terms and conditions"
  }

  return errors
}

// Improved referral incentives processing function
const processReferralIncentives = async (userId: number, uplineId: number, userRole: string, referralCode?: string) => {
  try {
    console.log("Starting referral incentive processing with params:", {
      userId,
      uplineId,
      userRole,
      referralCode,
    })

    let currentGen = 1

    while (true) {
      const endGen = currentGen + 2 // Process 3 generations at a time
      console.log(`Processing generations ${currentGen} to ${endGen}`)

      const result = await applyReferralIncentives(uplineId, userRole, userId, referralCode, currentGen, endGen)

      console.log(`Result for generations ${currentGen} to ${endGen}:`, result)

      if (!result.success) {
        console.error("Failed to apply referral incentives:", result)
        throw new Error(result.message || "Failed to apply referral incentives")
      }

      // Stop if there are no more uplines to process
      if (!result.nextGeneration) {
        console.log("No more generations to process")
        break
      }

      currentGen = result.nextGeneration
    }

    console.log("Completed processing all available generations")
    return { success: true }
  } catch (error) {
    console.error("Error processing referral incentives:", error)
    throw error
  }
}

export default function SignUp() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedPackage = searchParams.get("package")
  const [emailError, setEmailError] = useState<string>("")
  const [activePaymentMethod, setActivePaymentMethod] = useState<string | null>(null)

  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false)
  const [showReferralCode, setShowReferralCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isActivationCodeLoading, setIsActivationCodeLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [dataprivacyAccepted, setDataPrivacyAccepted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formProgress, setFormProgress] = useState(0)

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState("")
  const [paymentLinkId, setPaymentLinkId] = useState("")

  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const userId = Date.now().toString()

  const [data, setData] = useState<UserData>({
    user_login: "",
    first_name: "",
    last_name: "",
    user_nicename: "",
    user_email: "",
    user_contact_number: "",
    user_role: selectedPackage || "",
    user_referral_code: "",
    user_upline_id: null,
    user_level: null,
    business_name: "",
    business_address: "",
    terms_accepted: false,
  })

  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);

  // Track scroll position for header effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Calculate form progress
  useEffect(() => {
    let progress = 0
    const totalFields = 7 // Total number of required fields
    let filledFields = 0

    if (data.first_name.length >= 2) filledFields++
    if (data.last_name.length >= 2) filledFields++
    if (/^[^\s@]+@gmail\.com$/i.test(data.user_email)) filledFields++
    if (/^\d{11}$/.test(data.user_contact_number)) filledFields++
    if (data.business_name.trim().length >= 2) filledFields++
    if (data.business_address.trim().length >= 5) filledFields++
    if (data.user_role || data.user_referral_code) filledFields++

    progress = Math.round((filledFields / totalFields) * 100)
    setFormProgress(progress)
  }, [data])

  // Email validation effect
  useEffect(() => {
    if (data.user_email) {
      const gmailRegex = /^[^\s@]+@gmail\.com$/i
      if (!gmailRegex.test(data.user_email) && data.user_email.includes("@")) {
        setErrors((prev) => ({
          ...prev,
          user_email: "Only Gmail addresses are accepted (example@gmail.com)",
        }))
      } else {
        setErrors((prev) => ({ ...prev, user_email: undefined }))
      }
    }
  }, [data.user_email])

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        setLoading(true)
        const data = await fetchProducts()
        const mappedData = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          label: item.label,
          short_description: item.short_description,
          payment_type: item.payment_type,
          price: item.price,
          status: item.status,
          the_order: item.the_order,
          created_at: item.created_at,
          category: item.category,
          image: item.image,
          package_type: item.package_type,
          features: item.pt_package_features.map((feature: any) => feature.feature),
          earn_description: item.earn_description,
          refer_earn: item.refer_earn,
        }))
        setProducts(mappedData)
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch products. Please try again later.",
          variant: "destructive",
        })
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProductsData()
  }, [])

  useEffect(() => {
    if (selectedPackage) {
      setData((prevData) => ({ ...prevData, user_role: selectedPackage }))
    }
  }, [selectedPackage])

  const onChangeRecaptcha = () => {
    setIsRecaptchaVerified(true)
  }

  // Enhanced input change handler with proper reset functionality
  const handleInputChange = (field: keyof UserData, value: string | boolean) => {
    setIsEditingPersonalInfo(true); // Mark as editing
    setData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "first_name" || field === "last_name") {
        if (typeof value === "string") {
          newData[field] = value.replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));
        }
        newData.user_nicename = `${newData.first_name} ${newData.last_name}`.trim();
      }
      return newData;
    });

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Reset editing state after a short delay
    setTimeout(() => setIsEditingPersonalInfo(false), 1000);
  };

  useEffect(() => {
    if (data.user_referral_code.length === 10) {
      fetchPackageInfo()
    }
  }, [data.user_referral_code])

  const fetchPackageInfo = async () => {
    if (data.user_referral_code.length === 10) {
      setIsActivationCodeLoading(true)
      try {
        const result: any = await getInvitationCodeByCodeforRegister(data.user_referral_code)
        if (result.success) {
          // Check if the code is already redeemed
          if (result.data.redeemed_by) {
            toast({
              title: "Invalid Activation Code",
              description: "This activation code has already been used.",
              variant: "destructive",
            })
            setData((prevData) => ({
              ...prevData,
              user_role: "",
              user_referral_code: "",
            }))
            return
          }

          setData((prevData) => ({
            ...prevData,
            user_role: result.data.user_role,
            user_upline_id: result.data.user_id,
            user_level: result.data.user_level + 1,
          }))

          toast({
            title: "Activation Code Valid",
            description: "The activation code has been successfully applied.",
            variant: "default",
          })
        } else {
          toast({
            title: "Invalid Activation Code",
            description: result.error || "Please check your activation code and try again.",
            variant: "destructive",
          })
          setData((prevData) => ({
            ...prevData,
            user_role: "",
          }))
        }
      } catch (error) {
        console.error("Error fetching activation code info:", error)
        toast({
          title: "Error",
          description: "An error occurred while fetching activation code information.",
          variant: "destructive",
        })
      } finally {
        setIsActivationCodeLoading(false)
      }
    }
  }

  //Paymongo
  const createPaymentLink = async (userData: UserData) => {
    try {
      const selectedProduct = products.find((p) => p.name === userData.user_role)
      if (!selectedProduct) {
        throw new Error("Selected product not found")
      }

      const response = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          amount: Math.round(selectedProduct.price * 100),
          description: selectedProduct.label,
          name: `${userData.first_name} ${userData.last_name}`,
          email: userData.user_email,
          userData: userData, // Include all user data
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment link")
      }

      setPaymentUrl(data.checkoutUrl)
      setPaymentLinkId(data.id.data.id)
      setShowPaymentModal(true)

      return { paymentUrl: data.checkoutUrl, paymentLinkId: data.id.data.id }
    } catch (error) {
      console.error("Error creating payment link:", error)
      toast({
        title: "Error",
        description: "Failed to create payment link. Please try again later.",
        variant: "destructive",
      })
      throw error
    }
  }

  const checkPaymentStatus = async (paymentID: string) => {
    try {
      const pollPaymentStatus = async () => {
        try {
          const retrivePayment = await retrieveLink(paymentID)
          console.log("Retrieve Payment Status:", retrivePayment.data.attributes.status)

          if (retrivePayment.data.attributes.status === "paid") {
            setShowPaymentModal(false)
            setIsRegistering(true)

            const userDataToSubmit = {
              ...data,
              user_upline_id: data.user_upline_id || 1,
              user_level: data.user_level || 2,
              user_credits: 0,
              travel_agency: null,
              social_media_page: null,
            }

            const response = await fetch("/api/auth/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(userDataToSubmit),
            })

            // Now update the user's status to active
            await fetch("/api/auth/update_status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_email: data.user_email }),
            })

            const result = await response.json()
            if (!response.ok) {
              throw new Error(result.error || "Error registering user after payment.")
            }

            // Apply referral incentives after successful registration
            if (userDataToSubmit.user_upline_id && result.userId) {
              try {
                await processReferralIncentives(
                  result.userId,
                  userDataToSubmit.user_upline_id,
                  userDataToSubmit.user_role,
                  userDataToSubmit.user_referral_code,
                )
              } catch (incentiveError) {
                console.error("Error applying referral incentives:", incentiveError)
                toast({
                  title: "Warning",
                  description: "User registered successfully but there was an issue applying referral incentives.",
                  variant: "destructive",
                })
              }
            }

            toast({
              title: "Success",
              description: "Payment successful and account created. Redirecting to Login Page.",
            })
            setTimeout(() => {
              router.push("/login")
            }, 3000)
          } else if (retrivePayment.data.attributes.status === "failed") {
            setShowPaymentModal(false)
            console.log(retrivePayment.data.attributes.status)
            toast({
              title: "Error",
              description: "An error occurred during payment.",
              variant: "destructive",
            })
          } else {
            setTimeout(() => pollPaymentStatus(), 5000)
          }
        } catch (error) {
          setShowPaymentModal(false)
          console.error("Error retrieving payment status or registering user:", error)
          toast({
            title: "Error",
            description: "An error occurred during registration. Please contact support.",
            variant: "destructive",
          })
        }
      }
      pollPaymentStatus()
    } catch (error) {
      console.error("Error checking payment status:", error)
      setShowPaymentModal(false)
    }
  }

  async function retrieveLink(id: string) {
    try {
      if (!id) throw new Error("Payment link ID is required")

      const response = await fetch(`/api/retrieve-payment-link?id=${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      // Attempt to parse response JSON safely
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("Invalid JSON response:", jsonError)
        throw new Error("Received an invalid response from the server.")
      }

      console.log("Retrieve Link Response:", data)

      if (!response.ok) {
        throw new Error(data?.error || "Failed to retrieve payment link")
      }

      return data
    } catch (error) {
      console.error("Error fetching payment link:", error)
      throw error
    }
  }

  // Enhanced register user function with proper referral handling
  const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate form
    const validationErrors = validateForm(data)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast({
        title: "Validation Error",
        description: "Please check the form for errors",
        variant: "destructive",
      })
      console.log(errors)
      return
    }

    // Check email existence again on submission
    try {
      const emailExists = await isEmailExist(data.user_email)
      if (emailExists) {
        setErrors((prev) => ({
          ...prev,
          user_email: "Email already exists. Please use a different email.",
        }))
        toast({
          title: "Email Exists",
          description: "This email is already registered",
          variant: "destructive",
        })
        return
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify email. Please try again.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setIsLoading(true)

    try {
      const userDataToSubmit = {
        ...data,
        user_upline_id: data.user_upline_id || 1,
        user_level: data.user_level || 2,
        user_credits: 0,
      }

      if (data.user_referral_code) {
        // Proceed with account creation using activation code
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userDataToSubmit),
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || "Error registering user. Please check your activation code")
        }

        // Apply referral incentives after successful registration with activation code
        if (userDataToSubmit.user_upline_id && result.userId) {
          try {
            console.log("Processing referral incentives with activation code")
            await processReferralIncentives(
              result.userId,
              userDataToSubmit.user_upline_id,
              userDataToSubmit.user_role,
              userDataToSubmit.user_referral_code,
            )
          } catch (incentiveError) {
            console.error("Error applying referral incentives:", incentiveError)
            toast({
              title: "Warning",
              description: "User registered successfully but there was an issue applying referral incentives.",
              variant: "destructive",
            })
          }
        }

        toast({
          title: "Success",
          description: "Redirecting to Log-In Page. Please check email for Log-In details",
        })
        router.push("/login")
      } else {
        // Create payment link and show modal
        const { paymentLinkId } = await createPaymentLink(userDataToSubmit)
        if (!paymentLinkId) {
          throw new Error("Payment ID is missing in the response")
        }
        await checkPaymentStatus(paymentLinkId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
      setIsLoading(false)
    }
  }

  const handleTermsAccept = () => {
    setTermsAccepted(true)
    handleInputChange("terms_accepted", true)
    toast({
      title: "Terms Accepted",
      description: "You have successfully accepted the terms and conditions.",
      variant: "default",
    })
  }

  const selectedProductDetails = products.find((p) => p.name === data.user_role)

  const handleDataPrivacyAccept = () => {
    setDataPrivacyAccepted(true)
    handleInputChange("dataprivacy_accepted", true)
    toast({
      title: "Data Privacy Policy Accepted",
      description: "You have successfully accepted the data privacy policy accepted.",
      variant: "default",
    })
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmitting) {
        e.preventDefault()
        e.returnValue =
          "Registration in progress. Are you sure you want to leave? Your registration may not complete properly."
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isSubmitting])

  // Format names to uppercase for display
  const displayName = `${data.first_name.toUpperCase()} ${data.last_name.toUpperCase()}`.trim()
  const displayBusinessName = data.business_name.toUpperCase()
  const displayBusinessAddress = data.business_address.toUpperCase()

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-white to-blue-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-3xl h-[80vh] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
                  Complete Your Payment
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowPaymentModal(false)}>
                  ✕
                </Button>
              </CardHeader>
              <CardContent className="flex-1 relative p-0">
                {paymentUrl ? (
                  <iframe
                    src={paymentUrl}
                    className="w-full h-full rounded-lg"
                    title="Payment Gateway"
                    onLoad={() => checkPaymentStatus(paymentLinkId)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Loading Overlay */}
      {isSubmitting && (
        <LoadingOverlay
          message="Processing your registration..."
          submessage="Please DO NOT close or refresh this page. This process may take a few moments to complete."
        />
      )}

      <div className="mx-auto px-4 py-8">
        <motion.header
          className={`w-full px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300 backdrop-blur-md z-40 ${isScrolled ? "sticky top-0 shadow-lg bg-white/80" : "sticky top-0 bg-white/60"
            }`}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* PHILTECH LOGO */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href={"https://www.philtechbusiness.ph"}>
                <div className="relative h-16 w-48">
                  <Image
                    src="/images/complete_logo.png"
                    alt="PhilTech Business Logo"
                    fill
                    className="object-contain hover:scale-105 transition-transform duration-200 ease-in-out"
                  />
                </div>
              </Link>
            </div>

            <button
              className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex space-x-4">
                {["Home", "Business Package", "Business Plans", "Contact"].map((item, index) => (
                  <a
                    key={index}
                    href={
                      item === "Home"
                        ? "https://www.philtechbusiness.ph"
                        : item === "Business Package"
                          ? "https://philtechbusiness.ph/#businesspackage"
                          : item === "Business Plans"
                            ? "https://philtechbusiness.ph/#businessplans"
                            : "https://philtechbusiness.ph/contact/"
                    }
                    className="px-4 py-2 text-sm font-semibold text-black hover:text-blue-700 hover:bg-blue-50 rounded transition-colors duration-200"
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                className="md:hidden mt-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <NavigationMenuDemo />
                <div className="mt-4"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto mt-5">
          {/* Payment Methods Section */}
          <motion.div
            className="space-y-6"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <h2 className="text-3xl font-bold text-blue-600">PAYMENT METHODS</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {PAYMENT_METHODS.map((method, index) => (
                <motion.div
                  key={method.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={cn(
                      "cursor-pointer transition-all duration-200 overflow-hidden border-2",
                      activePaymentMethod === method.id
                        ? "border-blue-500 shadow-md"
                        : "border-transparent hover:border-blue-200",
                    )}
                    onClick={() => setActivePaymentMethod(method.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-3 rounded-full">
                        <img
                          src={typeof method.image === "string" ? method.image : method.image.src}
                          alt={method.name}
                          className="h-12 w-12"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{method.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* User Information Preview */}
            {(data.first_name || data.last_name || data.business_name) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-lg text-blue-700">Registration Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {displayName && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <p className="text-sm font-medium">{displayName}</p>
                      </div>
                    )}
                    {data.user_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <p className="text-sm">{data.user_email}</p>
                      </div>
                    )}
                    {data.user_contact_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-500" />
                        <p className="text-sm">{data.user_contact_number}</p>
                      </div>
                    )}
                    {displayBusinessName && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        <p className="text-sm font-medium">{displayBusinessName}</p>
                      </div>
                    )}
                    {displayBusinessAddress && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <p className="text-sm">{displayBusinessAddress}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* Registration Form */}
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Card className="overflow-hidden shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2]">
                <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
                  <User className="mr-2 h-6 w-6" />
                  Sign Up
                </CardTitle>
                <CardDescription className="text-blue-100 text-center">
                  Create your PHILTECH Business account
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={registerUser} className="space-y-5">
                  <motion.div
                    className="grid grid-cols-2 gap-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        First Name
                      </Label>
                      <Input
                        id="first_name"
                        value={data.first_name}
                        onChange={(e) => handleInputChange("first_name", e.target.value)}
                        className={cn(
                          "transition-all duration-200 focus:ring-2 focus:ring-blue-500/20",
                          errors.first_name ? "border-red-500" : "",
                        )}
                        required
                        disabled={isSubmitting}
                        placeholder="Enter your first name"
                      />
                      {errors.first_name && (
                        <motion.p
                          className="text-sm text-red-500 flex items-center gap-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {errors.first_name}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        Last Name
                      </Label>
                      <Input
                        id="last_name"
                        value={data.last_name}
                        onChange={(e) => handleInputChange("last_name", e.target.value)}
                        className={cn(
                          "transition-all duration-200 focus:ring-2 focus:ring-blue-500/20",
                          errors.last_name ? "border-red-500" : "",
                        )}
                        required
                        disabled={isSubmitting}
                        placeholder="Enter your last name"
                      />
                      {errors.last_name && (
                        <motion.p
                          className="text-sm text-red-500 flex items-center gap-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {errors.last_name}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Label htmlFor="user_email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      Email
                    </Label>
                    <Input
                      id="user_email"
                      type="email"
                      value={data.user_email}
                      onChange={(e) => handleInputChange("user_email", e.target.value)}
                      className={cn(
                        "transition-all duration-200 focus:ring-2 focus:ring-blue-500/20",
                        errors.user_email ? "border-red-500" : "",
                      )}
                      required
                      disabled={isSubmitting}
                      placeholder="example@gmail.com"
                    />
                    {errors.user_email && (
                      <motion.p
                        className="text-sm text-red-500 flex items-center gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {errors.user_email}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Label htmlFor="user_contact_number" className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-500" />
                      Contact Number
                    </Label>
                    <Input
                      id="user_contact_number"
                      type="tel"
                      value={data.user_contact_number}
                      onChange={(e) => handleInputChange("user_contact_number", e.target.value)}
                      className={cn(
                        "transition-all duration-200 focus:ring-2 focus:ring-blue-500/20",
                        errors.user_contact_number ? "border-red-500" : "",
                      )}
                      required
                      disabled={isSubmitting}
                      maxLength={11}
                      placeholder="11-digit phone number"
                    />
                    {errors.user_contact_number && (
                      <motion.p
                        className="text-sm text-red-500 flex items-center gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {errors.user_contact_number}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="business_name" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      Business Name
                    </Label>
                    <Input
                      id="business_name"
                      type="text"
                      value={data.business_name}
                      onChange={(e) => handleInputChange("business_name", e.target.value)}
                      className={cn(
                        "transition-all duration-200 focus:ring-2 focus:ring-blue-500/20",
                        errors.business_name ? "border-red-500" : "",
                      )}
                      required
                      disabled={isSubmitting}
                      placeholder="Enter your business name"
                    />
                    {errors.business_name && (
                      <motion.p
                        className="text-sm text-red-500 flex items-center gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {errors.business_name}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Label htmlFor="business_address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      Business Address
                    </Label>
                    <Input
                      id="business_address"
                      type="text"
                      value={data.business_address}
                      onChange={(e) => handleInputChange("business_address", e.target.value)}
                      className={cn(
                        "transition-all duration-200 focus:ring-2 focus:ring-blue-500/20",
                        errors.business_address ? "border-red-500" : "",
                      )}
                      required
                      disabled={isSubmitting}
                      placeholder="Enter your business address"
                    />
                    {errors.business_address && (
                      <motion.p
                        className="text-sm text-red-500 flex items-center gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {errors.business_address}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div
                    className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <Checkbox
                      id="referralCodeCheckbox"
                      checked={showReferralCode}
                      onCheckedChange={(checked) => {
                        setShowReferralCode(checked as boolean)
                        // Reset activation code and related fields when unchecking
                        if (!checked) {
                          setData((prev) => ({
                            ...prev,
                            user_referral_code: "",
                            user_role: selectedPackage || "",
                          }))
                        }
                      }}
                      disabled={isSubmitting}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label htmlFor="referralCodeCheckbox" className="text-blue-800">
                      I have an activation code
                    </Label>
                  </motion.div>

                  {!showReferralCode && !data.user_referral_code ? (
                    <motion.div
                      className="space-y-2"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <Label htmlFor="user_role" className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        Negosyo Package
                      </Label>
                      <Select
                        value={data.user_role}
                        onValueChange={(value: string | boolean) => handleInputChange("user_role", value)}
                        disabled={searchParams.has("package") ? true : false || isSubmitting}
                      >
                        <SelectTrigger
                          id="user_role"
                          className={cn(
                            "transition-all duration-200 focus:ring-2 focus:ring-blue-500/20",
                            errors.user_role ? "border-red-500" : "",
                          )}
                        >
                          <SelectValue placeholder="Select package" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.name}>
                              {product.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.user_role && (
                        <motion.p
                          className="text-sm text-red-500 flex items-center gap-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {errors.user_role}
                        </motion.p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      className="space-y-2"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <Label htmlFor="user_referral_code" className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        Activation Code
                      </Label>
                      <div className="relative">
                        <Input
                          id="user_referral_code"
                          value={data.user_referral_code}
                          onChange={(e) => handleInputChange("user_referral_code", e.target.value)}
                          className={cn(
                            "transition-all duration-200 focus:ring-2 focus:ring-blue-500/20",
                            errors.user_referral_code ? "border-red-500" : "",
                          )}
                          maxLength={10}
                          disabled={isSubmitting}
                          placeholder="Enter your 10-digit activation code"
                        />
                        {isActivationCodeLoading && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          </div>
                        )}
                      </div>
                      {errors.user_referral_code && (
                        <motion.p
                          className="text-sm text-red-500 flex items-center gap-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {errors.user_referral_code}
                        </motion.p>
                      )}
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {selectedProductDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-white">
                          <CardHeader className="pb-2 bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white">
                            <CardTitle className="text-lg">{selectedProductDetails.package_type}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="text-3xl font-bold text-blue-700 mb-4 flex items-center">
                              <span>₱</span>
                              <span className="ml-1">
                                {selectedProductDetails.price.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                            <ul className="space-y-3">
                              {selectedProductDetails.features.map((feature: string, index: number) => (
                                <motion.li
                                  key={index}
                                  className="flex items-start text-gray-700 leading-tight"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                                  <span>{feature}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div
                    className="space-y-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Legal Agreements</span>
                    </div>
                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                      <TermsAndConditionsDialog onAccept={handleTermsAccept} accepted={termsAccepted} />
                      <DataPrivacyDialog onAccept={handleDataPrivacyAccept} accepted={dataprivacyAccepted} />
                      {errors.terms_accepted && (
                        <motion.p
                          className="text-sm text-red-500 flex items-center gap-1 mt-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {errors.terms_accepted}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex justify-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                  >
                    <ReCAPTCHA sitekey="6LePVYoqAAAAAFrhmmonKUKPyJZglnUqMqm7NPTO" onChange={onChangeRecaptcha} />
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={
                        isLoading ||
                        isSubmitting ||
                        (!termsAccepted && !TermsAndConditionsDialog) ||
                        !isRecaptchaVerified
                      }
                    >
                      {isLoading || isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Complete Registration
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <motion.div
                  className="mt-6 text-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                >
                  <span className="text-muted-foreground">Already have an account?</span>
                  <Link href="/login">
                    <Button variant="link" className="ml-1 text-blue-600 hover:text-blue-700">
                      Sign In
                    </Button>
                  </Link>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
