"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Loader2, Building, User, FileCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

// Import the server action
import { createATMGOApplication } from "@/actions/atmgo"
import { useUserContext } from "@/hooks/use-user"



// Industry and operational years options
const industries = [
  "Retail",
  "Food and Beverage",
  "Electronics",
  "Grocery",
  "Apparel",
  "Pharmacy",
  "Hardware",
  "Services",
  "Other",
]

const operationalYears = ["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "More than 10 years"]

// Bank options
const bankOptions = [
  "BDO (Banco de Oro)",
  "BPI (Bank of the Philippine Islands)",
  "Metrobank (Metropolitan Bank and Trust Company)",
  "PNB (Philippine National Bank)",
  "Landbank of the Philippines",
  "Security Bank",
  "UnionBank of the Philippines",
  "RCBC (Rizal Commercial Banking Corporation)",
  "China Bank",
  "EastWest Bank",
  "Other",
]

export default function ATMGOApplication() {
  const router = useRouter()
  const { user } = useUserContext() // Get the user data from context
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const totalSteps = 3

  // Combined form data
  const [formData, setFormData] = useState({
    uid: user?.id || null, // Add the user ID from context
    // Personal Info
    completeName: "",
    businessName: "",
    completeAddress: "",
    email: "",
    cellphone: "",

    // Business Questions
    existingBusiness: "",
    businessIndustry: "",
    businessOperationalYears: "",
    branchCount: "",
    fareToNearestBank: "",
    hasExtraCapital: "NO" as "YES" | "NO",
    agreeWithTransactionTarget: "NO" as "YES" | "NO",

    // Business Permits
    hasBusinessPermit: "NO" as "YES" | "NO",
    businessPermitDetails: "",
    dtiDetails: "",
    secDetails: "",
    cdaDetails: "",
    bankName: "",
    bankAccountDetails: "",
  })

  // Form setup for each step
  const personalInfoForm = useForm({
    defaultValues: {
      completeName: formData.completeName,
      businessName: formData.businessName,
      completeAddress: formData.completeAddress,
      email: formData.email,
      cellphone: formData.cellphone,
    },
  })

  const businessQuestionsForm = useForm({
    defaultValues: {
      existingBusiness: formData.existingBusiness,
      businessIndustry: formData.businessIndustry,
      businessOperationalYears: formData.businessOperationalYears,
      branchCount: formData.branchCount,
      fareToNearestBank: formData.fareToNearestBank,
      hasExtraCapital: formData.hasExtraCapital,
      agreeWithTransactionTarget: formData.agreeWithTransactionTarget,
    },
  })

  const businessPermitForm = useForm({
    defaultValues: {
      hasBusinessPermit: formData.hasBusinessPermit,
      businessPermitDetails: formData.businessPermitDetails,
      dtiDetails: formData.dtiDetails,
      secDetails: formData.secDetails,
      cdaDetails: formData.cdaDetails,
      bankName: formData.bankName,
      bankAccountDetails: formData.bankAccountDetails,
    },
  })

  // Handle next step
  const handleNextStep = async () => {
    if (currentStep === 1) {
      const valid = await personalInfoForm.trigger()
      if (!valid) return

      setFormData((prev) => ({
        ...prev,
        ...personalInfoForm.getValues(),
      }))
      setCurrentStep(2)
      window.scrollTo(0, 0)
    } else if (currentStep === 2) {
      const valid = await businessQuestionsForm.trigger()
      if (!valid) return

      setFormData((prev) => ({
        ...prev,
        ...businessQuestionsForm.getValues(),
      }))
      setCurrentStep(3)
      window.scrollTo(0, 0)
    } else if (currentStep === 3) {
      const valid = await businessPermitForm.trigger()
      if (!valid) return

      setFormData((prev) => ({
        ...prev,
        ...businessPermitForm.getValues(),
      }))
      setShowReviewDialog(true)
    }
  }

  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      // Create FormData object for the server action
      const formDataObject = new FormData()
      
      // Add all form data to FormData object
      Object.entries(formData).forEach(([key, value]) => {
        // Check if value is null or undefined before calling toString()
        formDataObject.append(key, value === null || value === undefined ? '' : value.toString())
      })
      
      // Call the server action
      const response = await createATMGOApplication(formDataObject)
      
      if (response.success) {
        toast({
          title: "Application Submitted",
          description: "Your ATM GO application has been submitted successfully.",
          variant: "default",
        })
  
        setShowReviewDialog(false)
        
        // Reset form data to initial state
        setFormData({
          uid: user?.id || null,
          // Personal Info
          completeName: "",
          businessName: "",
          completeAddress: "",
          email: "",
          cellphone: "",
  
          // Business Questions
          existingBusiness: "",
          businessIndustry: "",
          businessOperationalYears: "",
          branchCount: "",
          fareToNearestBank: "",
          hasExtraCapital: "NO",
          agreeWithTransactionTarget: "NO",
  
          // Business Permits
          hasBusinessPermit: "NO",
          businessPermitDetails: "",
          dtiDetails: "",
          secDetails: "",
          cdaDetails: "",
          bankName: "",
          bankAccountDetails: "",
        })
        
        // Reset all form states
        personalInfoForm.reset()
        businessQuestionsForm.reset()
        businessPermitForm.reset()
        
        // Return to step 1
        setCurrentStep(1)
        window.scrollTo(0, 0)
        
        // Navigate back to dashboard after successful submission
        router.push('/user-dashboard')
      } else {
        // Handle error from server
        setSubmitError(response.error || "There was a problem submitting your application.")
        toast({
          title: "Submission Error",
          description: response.error || "There was a problem submitting your application.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      
      // Show error toast notification
      toast({
        title: "Error",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      })
      
      setSubmitError("An unexpected error occurred. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }
  

  // Get step icon
  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return <User className="h-5 w-5" />
      case 2:
        return <Building className="h-5 w-5" />
      case 3:
        return <FileCheck className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-blue-700">ATM GO APPLICATION</h1>
          <p className="text-muted-foreground mt-2">Complete the form below to apply for ATM GO services</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{
                    scale: currentStep >= stepNumber ? 1 : 0.8,
                    backgroundColor: currentStep >= stepNumber ? "rgb(29, 78, 216)" : "rgb(229, 231, 235)",
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300`}
                >
                  {currentStep > stepNumber ? (
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  ) : (
                    <div className="text-white">{getStepIcon(stepNumber)}</div>
                  )}
                </motion.div>
                <span
                  className={`text-sm mt-2 font-medium ${currentStep >= stepNumber ? "text-blue-700" : "text-gray-500"}`}
                >
                  {stepNumber === 1 ? "Personal Info" : stepNumber === 2 ? "Business Questions" : "Business Permit"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 w-full bg-gray-200 rounded-full">
            <motion.div
              className="h-full bg-blue-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <Card className="shadow-lg border-t-4 border-t-blue-600">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center gap-3">
                    <User className="h-6 w-6 text-blue-700" />
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Please provide your personal and business contact details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="completeName">
                        Complete Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="completeName"
                        {...personalInfoForm.register("completeName", { required: "Full name is required" })}
                        placeholder="Juan Dela Cruz"
                      />
                      {personalInfoForm.formState.errors.completeName && (
                        <p className="text-sm text-destructive mt-1">
                          {personalInfoForm.formState.errors.completeName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessName">
                        Business Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="businessName"
                        {...personalInfoForm.register("businessName", { required: "Business name is required" })}
                        placeholder="Juan's Store"
                      />
                      {personalInfoForm.formState.errors.businessName && (
                        <p className="text-sm text-destructive mt-1">
                          {personalInfoForm.formState.errors.businessName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="completeAddress">
                        Complete Address <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="completeAddress"
                        {...personalInfoForm.register("completeAddress", { required: "Address is required" })}
                        placeholder="123 Main Street, Barangay Example, City, Province, Zip Code"
                        rows={3}
                      />
                      {personalInfoForm.formState.errors.completeAddress && (
                        <p className="text-sm text-destructive mt-1">
                          {personalInfoForm.formState.errors.completeAddress.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...personalInfoForm.register("email", {
                            required: "Email is required",
                            pattern: {
                              value: /\S+@\S+\.\S+/,
                              message: "Please enter a valid email",
                            },
                          })}
                          placeholder="juandelacruz@example.com"
                        />
                        {personalInfoForm.formState.errors.email && (
                          <p className="text-sm text-destructive mt-1">
                            {personalInfoForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cellphone">
                          Cellphone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="cellphone"
                          {...personalInfoForm.register("cellphone", {
                            required: "Phone number is required",
                            pattern: {
                              value: /^\d{11}$/,
                              message: "Please enter a valid 11-digit phone number",
                            },
                          })}
                          placeholder="09123456789"
                          maxLength={11}
                        />
                        {personalInfoForm.formState.errors.cellphone && (
                          <p className="text-sm text-destructive mt-1">
                            {personalInfoForm.formState.errors.cellphone.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-end p-6">
                  <Button onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center gap-3">
                    <Building className="h-6 w-6 text-blue-700" />
                    <div>
                      <CardTitle>Business Questions</CardTitle>
                      <CardDescription>Please answer the following questions about your business</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="existingBusiness">
                        1. What is your existing business? <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="existingBusiness"
                        {...businessQuestionsForm.register("existingBusiness", { required: "This field is required" })}
                        placeholder="Describe your current business operations"
                        rows={2}
                      />
                      {businessQuestionsForm.formState.errors.existingBusiness && (
                        <p className="text-sm text-destructive mt-1">
                          {businessQuestionsForm.formState.errors.existingBusiness.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessIndustry">
                        2. What is your business industry? <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        defaultValue={formData.businessIndustry}
                        onValueChange={(value) =>
                          businessQuestionsForm.setValue("businessIndustry", value, { shouldValidate: true })
                        }
                      >
                        <SelectTrigger id="businessIndustry">
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {businessQuestionsForm.formState.errors.businessIndustry && (
                        <p className="text-sm text-destructive mt-1">
                          {businessQuestionsForm.formState.errors.businessIndustry.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessOperationalYears">
                        3. How long is your business operational? <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        defaultValue={formData.businessOperationalYears}
                        onValueChange={(value) =>
                          businessQuestionsForm.setValue("businessOperationalYears", value, { shouldValidate: true })
                        }
                      >
                        <SelectTrigger id="businessOperationalYears">
                          <SelectValue placeholder="Select operational years" />
                        </SelectTrigger>
                        <SelectContent>
                          {operationalYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {businessQuestionsForm.formState.errors.businessOperationalYears && (
                        <p className="text-sm text-destructive mt-1">
                          {businessQuestionsForm.formState.errors.businessOperationalYears.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branchCount">
                        4. How many branches do you have? <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="branchCount"
                        type="number"
                        min="0"
                        {...businessQuestionsForm.register("branchCount", { required: "This field is required" })}
                        placeholder="0"
                      />
                      {businessQuestionsForm.formState.errors.branchCount && (
                        <p className="text-sm text-destructive mt-1">
                          {businessQuestionsForm.formState.errors.branchCount.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fareToNearestBank">
                        5. How much is the FARE from your establishment to the nearest Banks?{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500">₱</span>
                        </div>
                        <Input
                          id="fareToNearestBank"
                          {...businessQuestionsForm.register("fareToNearestBank", {
                            required: "This field is required",
                          })}
                          placeholder="50"
                          className="pl-8"
                        />
                      </div>
                      {businessQuestionsForm.formState.errors.fareToNearestBank && (
                        <p className="text-sm text-destructive mt-1">
                          {businessQuestionsForm.formState.errors.fareToNearestBank.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>
                        6. Do you have extra capital at least P50,000.00 for ATM WITHDRAWAL Business?{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <RadioGroup
                        defaultValue={formData.hasExtraCapital}
                        onValueChange={(value) =>
                          businessQuestionsForm.setValue("hasExtraCapital", value as "YES" | "NO", {
                            shouldValidate: true,
                          })
                        }
                        className="flex space-x-6 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="YES" id="capital-yes" />
                          <Label htmlFor="capital-yes" className="font-normal">
                            YES
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="NO" id="capital-no" />
                          <Label htmlFor="capital-no" className="font-normal">
                            NO
                          </Label>
                        </div>
                      </RadioGroup>
                      {businessQuestionsForm.formState.errors.hasExtraCapital && (
                        <p className="text-sm text-destructive mt-1">
                          {businessQuestionsForm.formState.errors.hasExtraCapital.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>
                        7. Do you agree with the quarterly transaction target? <span className="text-red-500">*</span>
                      </Label>
                      <RadioGroup
                        defaultValue={formData.agreeWithTransactionTarget}
                        onValueChange={(value) =>
                          businessQuestionsForm.setValue("agreeWithTransactionTarget", value as "YES" | "NO", {
                            shouldValidate: true,
                          })
                        }
                        className="flex space-x-6 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="YES" id="target-yes" />
                          <Label htmlFor="target-yes" className="font-normal">
                            YES
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="NO" id="target-no" />
                          <Label htmlFor="target-no" className="font-normal">
                            NO
                          </Label>
                        </div>
                      </RadioGroup>
                      {businessQuestionsForm.formState.errors.agreeWithTransactionTarget && (
                        <p className="text-sm text-destructive mt-1">
                          {businessQuestionsForm.formState.errors.agreeWithTransactionTarget.message}
                        </p>
                      )}
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-between p-6">
                  <Button variant="outline" onClick={handlePrevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  <Button onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-6 w-6 text-blue-700" />
                    <div>
                      <CardTitle>Business Permits & Banking Information</CardTitle>
                      <CardDescription>
                        Please provide details about your business permits and banking information
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        8. Do you have complete business Permit? <span className="text-red-500">*</span>
                      </Label>
                      <RadioGroup
                        defaultValue={formData.hasBusinessPermit}
                        onValueChange={(value) =>
                          businessPermitForm.setValue("hasBusinessPermit", value as "YES" | "NO", {
                            shouldValidate: true,
                          })
                        }
                        className="flex space-x-6 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="YES" id="permit-yes" />
                          <Label htmlFor="permit-yes" className="font-normal">
                            YES
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="NO" id="permit-no" />
                          <Label htmlFor="permit-no" className="font-normal">
                            NO
                          </Label>
                        </div>
                      </RadioGroup>
                      {businessPermitForm.formState.errors.hasBusinessPermit && (
                        <p className="text-sm text-destructive mt-1">
                          {businessPermitForm.formState.errors.hasBusinessPermit.message}
                        </p>
                      )}
                    </div>

                    <AnimatePresence>
                      {businessPermitForm.watch("hasBusinessPermit") === "YES" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-6 border p-4 rounded-lg bg-blue-50"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="businessPermitDetails">
                              Business Permit Details <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="businessPermitDetails"
                              {...businessPermitForm.register("businessPermitDetails", {
                                required:
                                  businessPermitForm.watch("hasBusinessPermit") === "YES"
                                    ? "Permit details are required"
                                    : false,
                              })}
                              placeholder="Permit Number and Expiration Date"
                            />
                            {businessPermitForm.formState.errors.businessPermitDetails && (
                              <p className="text-sm text-destructive mt-1">
                                {businessPermitForm.formState.errors.businessPermitDetails.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="dtiDetails">DTI Details</Label>
                            <Input
                              id="dtiDetails"
                              {...businessPermitForm.register("dtiDetails")}
                              placeholder="DTI Registration Number"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="secDetails">SEC Details</Label>
                            <Input
                              id="secDetails"
                              {...businessPermitForm.register("secDetails")}
                              placeholder="SEC Registration Number"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cdaDetails">CDA Details</Label>
                            <Input
                              id="cdaDetails"
                              {...businessPermitForm.register("cdaDetails")}
                              placeholder="CDA Registration Number"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <Label htmlFor="bankName">
                        Bank Name <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        defaultValue={formData.bankName}
                        onValueChange={(value) =>
                          businessPermitForm.setValue("bankName", value, { shouldValidate: true })
                        }
                      >
                        <SelectTrigger id="bankName">
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankOptions.map((bank) => (
                            <SelectItem key={bank} value={bank}>
                              {bank}
                            </SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                      {businessPermitForm.formState.errors.bankName && (
                        <p className="text-sm text-destructive mt-1">
                          {businessPermitForm.formState.errors.bankName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccountDetails">
                        Bank Account Details <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="bankAccountDetails"
                        {...businessPermitForm.register("bankAccountDetails", {
                          required: "Bank account details are required",
                        })}
                        placeholder="Account Number and Account Name"
                      />
                      {businessPermitForm.formState.errors.bankAccountDetails && (
                        <p className="text-sm text-destructive mt-1">
                          {businessPermitForm.formState.errors.bankAccountDetails.message}
                        </p>
                      )}
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-between p-6">
                  <Button variant="outline" onClick={handlePrevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  <Button onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700">
                    Submit Application <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Application</DialogTitle>
              <DialogDescription>Please review your information before final submission</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Personal Information Section */}
              <div>
                <h3 className="text-lg font-medium text-blue-700 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Complete Name:</span>
                    <p className="font-medium">{formData.completeName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Business Name:</span>
                    <p className="font-medium">{formData.businessName}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-sm text-muted-foreground">Complete Address:</span>
                    <p className="font-medium">{formData.completeAddress}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Email Address:</span>
                    <p className="font-medium">{formData.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Cellphone Number:</span>
                    <p className="font-medium">{formData.cellphone}</p>
                  </div>
                </div>
              </div>

              {/* Business Questions Section */}
              <div>
                <h3 className="text-lg font-medium text-blue-700 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Business Information
                </h3>
                <div className="space-y-3 mt-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Existing Business:</span>
                    <p className="font-medium">{formData.existingBusiness}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Business Industry:</span>
                      <p className="font-medium">{formData.businessIndustry}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Operational Years:</span>
                      <p className="font-medium">{formData.businessOperationalYears}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Branch Count:</span>
                      <p className="font-medium">{formData.branchCount}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Fare to Nearest Bank:</span>
                      <p className="font-medium">₱{formData.fareToNearestBank}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Have ₱50,000 Extra Capital:</span>
                      <p className="font-medium">{formData.hasExtraCapital}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Agree with Transaction Target:</span>
                      <p className="font-medium">{formData.agreeWithTransactionTarget}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permits and Banking Section */}
              <div>
                <h3 className="text-lg font-medium text-blue-700 flex items-center">
                  <FileCheck className="h-5 w-5 mr-2" />
                  Permits and Banking
                </h3>
                <div className="space-y-3 mt-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Has Business Permit:</span>
                    <p className="font-medium">{formData.hasBusinessPermit}</p>
                  </div>

                  {formData.hasBusinessPermit === "YES" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50 p-3 rounded-md">
                      <div>
                        <span className="text-sm text-muted-foreground">Business Permit Details:</span>
                        <p className="font-medium">{formData.businessPermitDetails}</p>
                      </div>
                      {formData.dtiDetails && (
                        <div>
                          <span className="text-sm text-muted-foreground">DTI Details:</span>
                          <p className="font-medium">{formData.dtiDetails}</p>
                        </div>
                      )}
                      {formData.secDetails && (
                        <div>
                          <span className="text-sm text-muted-foreground">SEC Details:</span>
                          <p className="font-medium">{formData.secDetails}</p>
                        </div>
                      )}
                      {formData.cdaDetails && (
                        <div>
                          <span className="text-sm text-muted-foreground">CDA Details:</span>
                          <p className="font-medium">{formData.cdaDetails}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Bank Name:</span>
                      <p className="font-medium">{formData.bankName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Bank Account Details:</span>
                      <p className="font-medium">{formData.bankAccountDetails}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error message if submission fails */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-600">{submitError}</p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Go Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Confirm & Submit
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}