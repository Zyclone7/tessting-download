// for manual registration
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
//import ReCAPTCHA from "react-google-recaptcha";
import { getAvailableCodes } from "@/actions/invitation-codes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Loader2, Smartphone, AlertTriangle } from "lucide-react"
import { getInvitationCodeByCode, getInvitationCodeByCodeforRegister } from "@/actions/invitation-codes"
import { TermsAndConditionsDialog } from "./terms-and-conditions-dialog"
import { DataPrivacyDialog } from "./data-privacy-dialog"
import { NavigationMenuDemo } from "@/components/user-navigation"
import ThemeSwitch from "@/components/theme-switcher"
import ProductImage1 from "@/public/images/mp.jpg"
import ProductImage2 from "@/public/images/dp.jpg"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useUserContext } from "@/hooks/use-user"
import { applyReferralIncentives } from "@/actions/referral-incentive"
import { LoadingOverlay } from "@/components/loading-overlay"
import { PackageSkeleton } from "./package-skeleton"
import { fetchProducts } from "@/actions/package-products"

// Define the expected user data type for form validation
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
  user_nicename?: string
}

// Define the expected user data type for form submission
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

// Define the expected product data type
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

// Define the expected available codes data type
interface AvailableCodes {
  user_id: number
  id: number
  code: string
  package: string
  redeemed_by: number | null
}

// validateForm function to check for form errors with Gmail-only validation
const validateForm = (data: UserData, showReferralCode: boolean): FormErrors => {
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

  // Enhanced validation for package and activation code
  if (!showReferralCode && !data.user_role) {
    errors.user_role = "Please select a package"
  }

  if (showReferralCode) {
    if (!data.user_referral_code || data.user_referral_code.length !== 10) {
      errors.user_referral_code = "Please select a valid activation code"
    }

    if (!data.user_role) {
      errors.user_role = "Please select a package"
    }
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
        // Don't throw error here to allow the process to continue even if one generation fails
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
  const selectedPackage = searchParams ? searchParams.get("package") : null

  //  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const [showReferralCode, setShowReferralCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isActivationCodeLoading, setIsActivationCodeLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [dataprivacyAccepted, setDataPrivacyAccepted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user } = useUserContext()
  const [level, setLevel] = useState(user?.level)
  const [upline, setUpline] = useState(user?.id)
  const [codes, setCodes] = useState<AvailableCodes[]>([])
  const [packageWithActivation, setPackageWithActivation] = useState<string>()
  const [selectedCode, setSelectedCode] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPackage, setIsLoadingPackage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formSubmitAttempted, setFormSubmitAttempted] = useState(false)

  const [products, setProducts] = useState<Product[]>([]) // Initialize products state

  const [data, setData] = useState<UserData>({
    // Initialize user data state
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

  // Enhance the resetActivationCodeState function to be more comprehensive
  const resetActivationCodeState = () => {
    setSelectedCode(undefined)
    setData((prev) => ({ ...prev, user_referral_code: "" }))
    if (errors.user_referral_code) {
      setErrors((prev) => ({ ...prev, user_referral_code: undefined }))
    }
  }

  // Create a new function to completely reset package-related state
  const resetPackageState = () => {
    setPackageWithActivation(undefined)
    setData((prev) => ({ ...prev, user_role: "" }))
    if (errors.user_role) {
      setErrors((prev) => ({ ...prev, user_role: undefined }))
    }
  }

  useEffect(() => {
    // Fetch products data on component mount
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
    setCodes([]) // Reset codes state when package changes
  }, [packageWithActivation]) // Re-run effect when packageWithActivation changes

  useEffect(() => {
    async function fetchAvailableCodes() {
      // Fetch available codes when packageWithActivation and user.id are available
      try {
        if (packageWithActivation) {
          if (user?.id) {
            const response = await getAvailableCodes(user.id, packageWithActivation)
            if (Array.isArray(response) && response.length > 0) {
              setCodes(response as AvailableCodes[])
            }
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchAvailableCodes()
  }, [packageWithActivation, user?.id])

  useEffect(() => {
    if (selectedPackage) {
      // Set selected package to user_role state when selectedPackage changes
      setData((prevData) => ({ ...prevData, user_role: selectedPackage })) // Update user_role state
    }
  }, [selectedPackage])

  // const onChangeRecaptcha = () => {
  //   setIsRecaptchaVerified(true);
  // };

  const handleInputChange = (
    // Handle input change and update user data state
    field: keyof UserData,
    value: string | boolean,
  ) => {
    setData((prev) => {
      const newData = { ...prev, [field]: value }
      if (field === "first_name" || field === "last_name") {
        if (typeof value === "string") {
          newData[field] = value.replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()))
        }
        newData.user_nicename = `${newData.first_name} ${newData.last_name}`.trim()
      }
      return newData
    })
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const fetchUplineUserDetails = async (referralCode: string) => {
    try {
      const response: any = await getInvitationCodeByCode(referralCode)

      if (!response.success) {
        console.error("Error fetching referral code owner:", response.error)
        return null
      }
      setUpline(response.data.user_id)
      setLevel(response.data.user_level)
      return response.data
    } catch (error) {
      console.error("Unexpected error fetching referral code owner:", error)
      return null
    }
  }

  useEffect(() => {
    if (data.user_referral_code.length === 10) {
      // Fetch package info when user_referral_code changes
      fetchPackageInfo() // Fetch package info
    }
  }, [data.user_referral_code]) // Re-run effect when user_referral_code changes

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
            setSelectedCode(undefined)
            return
          }

          setData((prevData) => ({
            ...prevData,
            user_role: result.data.user_role,
            user_upline_id: result.data.user_id,
            user_level: result.data.user_level + 1,
          }))
          setUpline(result.data.user_id)
          setLevel(result.data.user_level)

          // Set the package with activation to match the code's package
          setPackageWithActivation(result.data.user_role)

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
            user_referral_code: "",
          }))
          setSelectedCode(undefined)
        }
      } catch (error) {
        console.error("Error fetching activation code info:", error)
        toast({
          title: "Error",
          description: "An error occurred while fetching activation code information.",
          variant: "destructive",
        })
        setData((prevData) => ({
          ...prevData,
          user_referral_code: "",
        }))
        setSelectedCode(undefined)
      } finally {
        setIsActivationCodeLoading(false)
      }
    }
  }

  // Enhanced register user function with proper referral handling
  const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormSubmitAttempted(true)

    // Validate form with enhanced validation
    const validationErrors = validateForm(data, showReferralCode)

    // Check if there are validation errors
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)

      // Show specific error messages based on validation failures
      if (showReferralCode && (!data.user_referral_code || data.user_referral_code.length !== 10)) {
        toast({
          title: "Activation Code Required",
          description: "Please select a valid activation code to continue.",
          variant: "destructive",
        })
        return
      }

      if (!data.user_role) {
        toast({
          title: "Package Required",
          description: "Please select a package to continue.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Validation Error",
        description: "Please check the form for errors",
        variant: "destructive",
      })
      return
    }

    // Double-check activation code requirement if checkbox is checked
    if (showReferralCode && (!data.user_referral_code || data.user_referral_code.length !== 10)) {
      toast({
        title: "Activation Code Required",
        description: "You've indicated you have an activation code. Please select a valid code to continue.",
        variant: "destructive",
      })
      setErrors((prev) => ({
        ...prev,
        user_referral_code: "Please select a valid activation code",
      }))
      return
    }

    // Continue with form submission...
    setIsSubmitting(true)
    setIsLoading(true)

    try {
      const updatedData = {
        ...data,
        user_upline_id: upline,
        user_level: (level ?? 0) + 1,
        user_credits: 0,
        travel_agency: null,
        social_media_page: null,
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Handle specific error types without throwing errors
        if (errorData.error && errorData.error.includes("name is already taken")) {
          setErrors((prev) => ({
            ...prev,
            user_nicename: "This name is already taken. Please use a different name.",
          }))

          toast({
            title: "Registration Failed",
            description: "This name is already taken. Please use a different name.",
            variant: "destructive",
          })
        } else if (errorData.error && errorData.error.includes("email address is already registered")) {
          setErrors((prev) => ({
            ...prev,
            user_email: "This email address is already registered.",
          }))

          toast({
            title: "Registration Failed",
            description: "This email address is already registered.",
            variant: "destructive",
          })
        } else if (errorData.error && errorData.error.includes("username is already taken")) {
          setErrors((prev) => ({
            ...prev,
            user_login: "This username is already taken.",
          }))

          toast({
            title: "Registration Failed",
            description: "This username is already taken.",
            variant: "destructive",
          })
        } else if (errorData.error) {
          toast({
            title: "Registration Failed",
            description: errorData.error,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Registration Failed",
            description: "An error occurred during registration. Please try again.",
            variant: "destructive",
          })
        }

        setIsSubmitting(false)
        setIsLoading(false)
        return // Return early instead of throwing an error
      }

      const result = await response.json()

      // Log result for debugging
      console.log("Registration result:", result)

      // Only process referral incentives if there's a valid referral code
      if (
        updatedData.user_referral_code &&
        updatedData.user_referral_code.trim().length === 10 &&
        updatedData.user_upline_id &&
        result.userId
      ) {
        try {
          console.log("Processing referral incentives for user with code:", updatedData.user_referral_code)
          await processReferralIncentives(
            result.userId,
            updatedData.user_upline_id,
            updatedData.user_role,
            updatedData.user_referral_code,
          )
          console.log("Referral incentives processed successfully")

          toast({
            title: "Referral Success",
            description: "Referral incentives have been processed successfully.",
            variant: "default",
          })
        } catch (incentiveError) {
          console.error("Error applying referral incentives:", incentiveError)
          toast({
            title: "Warning",
            description: "User registered successfully but there was an issue applying referral incentives.",
            variant: "destructive",
          })
        }
      } else {
        console.log("No valid referral code for incentive processing:", {
          referralCode: updatedData.user_referral_code,
          uplineId: updatedData.user_upline_id,
          userId: result.userId,
        })
      }

      toast({
        title: "Success",
        description: "Registration successful. Please check your email for login details.",
      })

      // Reset form after successful registration
      setData({
        user_login: "",
        first_name: "",
        last_name: "",
        user_nicename: "",
        user_email: "",
        user_contact_number: "",
        user_role: "",
        user_referral_code: "",
        user_upline_id: null,
        user_level: null,
        business_name: "",
        business_address: "",
        terms_accepted: false,
      })
      setTermsAccepted(false)
      setDataPrivacyAccepted(false)
      setShowReferralCode(false)
      setSelectedCode(undefined)
    } catch (error) {
      console.error("Registration error:", error)

      toast({
        title: "Failed",
        description: error instanceof Error ? error.message : "Error registering",
        variant: "destructive",
      })

      // No need to set errors here as we're handling specific errors above
    } finally {
      setIsSubmitting(false)
      setIsLoading(false)
    }
  }

  const handleTermsAccept = () => {
    // handle terms and conditions acceptance
    setTermsAccepted(true)
    handleInputChange("terms_accepted", true)
    toast({
      title: "Terms Accepted",
      description: "You have successfully accepted the terms and conditions.",
      variant: "default",
    })
  }

  const handleDataPrivacyAccept = () => {
    // handle data privacy policy acceptance
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
      // handle beforeunload event
      if (isSubmitting) {
        e.preventDefault()
        e.returnValue =
          "Registration in progress. Are you sure you want to leave? Your registration may not complete properly."
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload) // Add event listener for beforeunload event
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isSubmitting])

  const selectedProductDetails = products.find((p) => p.name === data.user_role) // Get selected product details

  const canSubmit = () => {
    if (isLoading || isSubmitting || !termsAccepted) return false

    // If activation code checkbox is checked, require a valid code
    if (showReferralCode && (!data.user_referral_code || data.user_referral_code.length !== 10)) {
      return false
    }

    // Always require a package selection when activation code is not checked
    if (!showReferralCode && !data.user_role) return false

    return true
  }

  return (
    <motion.div
      className="min-h-screen bg-background" // main container with animation
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {isSubmitting && ( // Show loading overlay when submitting form
        <LoadingOverlay
          message="Processing your registration..."
          submessage="Please DO NOT close or refresh this page. This critical process may take up to a minute to complete. Closing this page will interrupt the registration and may cause issues with the account creation."
        />
      )}
      <div className="container mx-auto px-4 py-8">
        <motion.header // header with animation
          className={`w-full px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300 backdrop-blur-md ${isScrolled ? "sticky top-0 shadow-lg" : "sticky top-0"
            }`}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {isMobileMenuOpen && ( // Show mobile navigation menu when mobile menu is open
            <motion.div
              className="md:hidden mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <NavigationMenuDemo />
              <div className="mt-4">
                <ThemeSwitch />
              </div>
            </motion.div>
          )}
        </motion.header>

        <div className="grid md:grid-cols-1 gap-8 max-w-7xl mx-auto">
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Add New Merchant/Distributor</CardTitle>
              </CardHeader>
              <CardContent>
                {/* ====Start of Manual registration form== */}
                <form onSubmit={registerUser} className="space-y-4">
                  <motion.div
                    className="grid grid-cols-2 gap-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={data.first_name.toUpperCase()}
                        onChange={(e) => handleInputChange("first_name", e.target.value.toUpperCase())}
                        className={errors.first_name ? "border-red-500" : ""}
                        required
                        disabled={isSubmitting}
                      />
                      {errors.first_name && <p className="text-sm text-red-500">{errors.first_name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={data.last_name.toUpperCase()}
                        onChange={(e) => handleInputChange("last_name", e.target.value.toUpperCase())}
                        className={errors.last_name ? "border-red-500" : ""}
                        required
                        disabled={isSubmitting}
                      />
                      {errors.last_name && <p className="text-sm text-red-500">{errors.last_name}</p>}
                    </div>
                  </motion.div>

                  {/* Display user_nicename error if it exists */}
                  {errors.user_nicename && (
                    <motion.div className="col-span-2 -mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-sm text-red-500">{errors.user_nicename}</p>
                    </motion.div>
                  )}

                  <motion.div
                    className="space-y-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <Label htmlFor="user_email">Email</Label>
                    <Input
                      id="user_email"
                      type="email"
                      value={data.user_email}
                      onChange={(e) => handleInputChange("user_email", e.target.value)}
                      className={errors.user_email ? "border-red-500" : ""}
                      required
                      disabled={isSubmitting}
                      placeholder="example@gmail.com"
                    />
                    {errors.user_email && <p className="text-sm text-red-500">{errors.user_email}</p>}
                    {!errors.user_email && data.user_email && !data.user_email.toLowerCase().endsWith("@gmail.com") && (
                      <p className="text-sm text-amber-600">
                        <AlertTriangle className="inline-block w-4 h-4 mr-1" />
                        Only Gmail addresses are accepted
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Label htmlFor="user_contact_number">Contact Number</Label>
                    <Input
                      id="user_contact_number"
                      type="tel"
                      value={data.user_contact_number}
                      onChange={(e) => handleInputChange("user_contact_number", e.target.value)}
                      className={errors.user_contact_number ? "border-red-500" : ""}
                      required
                      disabled={isSubmitting}
                      maxLength={11}
                    />
                    {errors.user_contact_number && <p className="text-sm text-red-500">{errors.user_contact_number}</p>}
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      type="text"
                      value={data.business_name.toUpperCase()}
                      onChange={(e) => handleInputChange("business_name", e.target.value.toUpperCase())}
                      className={errors.business_name ? "border-red-500" : ""}
                      required
                      disabled={isSubmitting}
                    />
                    {errors.business_name && <p className="text-sm text-red-500">{errors.business_name}</p>}
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Label htmlFor="business_address">Business Address</Label>
                    <Input
                      id="business_address"
                      type="text"
                      value={data.business_address.toUpperCase()}
                      onChange={(e) => handleInputChange("business_address", e.target.value.toUpperCase())}
                      className={errors.business_address ? "border-red-500" : ""}
                      required
                      disabled={isSubmitting}
                    />
                    {errors.business_address && <p className="text-sm text-red-500">{errors.business_address}</p>}
                  </motion.div>

                  <motion.div
                    className="flex items-center space-x-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <Checkbox
                      id="referralCodeCheckbox"
                      checked={showReferralCode}
                      onCheckedChange={(checked) => {
                        setShowReferralCode(checked as boolean)
                        // Reset activation code related state
                        resetActivationCodeState()
                        // When unchecking, also reset package selection to ensure clean state
                        if (!checked) {
                          resetPackageState()
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="referralCodeCheckbox">Do you have an activation code?</Label>
                  </motion.div>
                  {/* Select Package and Activation Code */}
                  {showReferralCode ? (
                    <motion.div
                      className="space-y-2"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      <div className="relative">
                        <div className="flex gap-2">
                          <div className="space-y-2 w-1/2">
                            <Label htmlFor="package_selection">Package</Label>
                            <Select
                              onValueChange={(value) => {
                                setPackageWithActivation(value)
                                handleInputChange("user_role", value)
                              }}
                              disabled={isSubmitting}
                              value={data.user_role}
                            >
                              <SelectTrigger id="package_selection">
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
                            {errors.user_role && <p className="text-sm text-red-500">{errors.user_role}</p>}
                          </div>
                          <div className="space-y-2 w-1/2">
                            <Label htmlFor="activation_code">Activation Code</Label>
                            <Select
                              onValueChange={(value) => {
                                setSelectedCode(value)
                                handleInputChange("user_referral_code", value)
                              }}
                              disabled={isSubmitting || !packageWithActivation || codes.length === 0}
                              value={selectedCode}
                            >
                              <SelectTrigger id="activation_code">
                                <SelectValue
                                  placeholder={
                                    !packageWithActivation
                                      ? "Select package first"
                                      : codes.length === 0
                                        ? "No codes available"
                                        : "Select code"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {codes.length > 0 ? (
                                  codes.map((code) => (
                                    <SelectItem key={`${code.user_id}-${code.id}`} value={code.code}>
                                      {code.code}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem disabled value="empty">
                                    No codes available
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {!packageWithActivation && showReferralCode && (
                              <p className="text-xs text-amber-600">Please select a package first</p>
                            )}
                            {packageWithActivation && codes.length === 0 && showReferralCode && (
                              <p className="text-xs text-amber-600">No activation codes available for this package</p>
                            )}
                          </div>
                        </div>
                        {isActivationCodeLoading && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="space-y-2"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      <Label htmlFor="user_role">Package</Label>
                      <Select
                        onValueChange={(value) => {
                          setPackageWithActivation(value)
                          handleInputChange("user_role", value)
                        }}
                        disabled={isSubmitting}
                        value={data.user_role}
                      >
                        <SelectTrigger
                          id="user_role"
                          className={errors.user_role && formSubmitAttempted ? "border-red-500" : ""}
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
                      {errors.user_role && <p className="text-sm text-red-500">{errors.user_role}</p>}
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {selectedProductDetails && ( // Show package details when package is selected
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
                          {isLoadingPackage ? (
                            <CardContent className="p-6">
                              <PackageSkeleton /> {/* loading package */}
                            </CardContent>
                          ) : (
                            <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
                              <CardContent className="p-6">
                                <h3 className="font-semibold text-xl text-gray-800 mb-3">
                                  {selectedProductDetails.package_type}
                                </h3>
                                <div className="text-4xl font-bold text-gray-900 mb-5">
                                  ₱
                                  {selectedProductDetails.price.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                                <ul className="space-y-3">
                                  {selectedProductDetails.features.map((feature: string, index: number) => (
                                    <li key={index} className="flex items-start text-gray-700 leading-tight">
                                      <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                              <Image // Show package image
                                src={
                                  selectedProductDetails.package_type === "PREMIUM PACKAGE" ||
                                    selectedProductDetails.package_type === "BASIC PACKAGE"
                                    ? ProductImage1
                                    : ProductImage2
                                }
                                alt={selectedProductDetails.label}
                                width={500}
                                height={500}
                                className="object-cover transition-all duration-300 hover:scale-105"
                              />
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-row w-full justify-center gap-2">
                    <motion.div
                      className="space-y-2 w-full"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                    >
                      <TermsAndConditionsDialog // Show terms and conditions dialog
                        onAccept={handleTermsAccept}
                        accepted={termsAccepted}
                      />
                      {errors.terms_accepted && <p className="text-sm text-red-500">{errors.terms_accepted}</p>}
                    </motion.div>

                    <motion.div
                      className="space-y-2 w-full"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                    >
                      <DataPrivacyDialog // Show data privacy policy dialog
                        onAccept={handleDataPrivacyAccept}
                        accepted={dataprivacyAccepted}
                      />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#AEDAF6] to-[#3D89D6] hover:opacity-90 text-white"
                      disabled={
                        //!isRecaptchaVerified ||
                        !canSubmit()
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Registration...
                        </>
                      ) : isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>
                          <Smartphone className="mr-2 h-4 w-4" />
                          Register
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
                {/* end of manual register form */}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

