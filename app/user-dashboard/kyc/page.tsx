"use client"
import type React from "react"
import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Upload, FileCheck, Info, CheckCircle2, XCircle, RefreshCw, Shield, Clock, Trash2 } from "lucide-react"
import { uploadKYC, kycVerificationRequestByUserId } from "@/actions/user"
import { useUserContext } from "@/hooks/use-user"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function KYCPage() {
  // State management
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validIdFile, setValidIdFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [validIdPreview, setValidIdPreview] = useState<string | null>(null)
  const [validIdDragging, setValidIdDragging] = useState(false)
  const [selfieDragging, setSelfieDragging] = useState(false)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [kycStatus, setKycStatus] = useState<string | null>(null)
  const [disapprovalReason, setDisapprovalReason] = useState<string | null>(null)
  const [rejectionDate, setRejectionDate] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [showGuide, setShowGuide] = useState(false)
  const { user } = useUserContext()
  const router = useRouter()

  // Refs for file inputs
  const validIdInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  // Constants
  const MAX_FILE_SIZE_MB = 10
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
  const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/jpg"]

  // Check KYC status on component mount
  useEffect(() => {
    const checkKYCStatus = async () => {
      try {
        if (!user?.id) {
          setIsCheckingStatus(false)
          return
        }

        // Simulate network delay for demonstration
        const kycResponse = await kycVerificationRequestByUserId(user.id)

        if (kycResponse.success && kycResponse.data) {
          if (kycResponse.data.status === "pending") {
            router.push("./kyc/submitted")
          } else if (kycResponse.data.status === "REJECTED") {
            setKycStatus("REJECTED")
            setDisapprovalReason(kycResponse.data.reason_of_reject || "No reason provided")

            // Convert Date to string before setting it
            const rejectionDate = kycResponse.data.date_approve_denied
              ? new Date(kycResponse.data.date_approve_denied).toISOString()
              : null
            setRejectionDate(rejectionDate)
          }
        }
      } catch (error) {
        console.error("KYC status check failed:", error)
        toast({
          title: "Connection Error",
          description: "Failed to check KYC status. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        // Simulate loading for demonstration
        setTimeout(() => {
          setIsCheckingStatus(false)
        }, 1000)
      }
    }

    checkKYCStatus()
  }, [user, router])

  // File validation function
  const validateFile = (file: File): { valid: boolean; message?: string } => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        message: "Invalid file type. Please upload a JPEG or PNG image.",
      }
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
      }
    }

    return { valid: true }
  }

  // Handle file change (from input or drop)
  const handleFileChange = (type: "id" | "selfie") => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    processFile(type, file)
  }

  // Process the file (validation and preview)
  const processFile = (type: "id" | "selfie", file: File) => {
    const validation = validateFile(file)

    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.message,
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (type === "id") {
        setValidIdPreview(e.target?.result as string)
        setValidIdFile(file)
      } else {
        setSelfiePreview(e.target?.result as string)
        setSelfieFile(file)
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle drag events
  const handleDragOver = (type: "id" | "selfie") => (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (type === "id") {
      setValidIdDragging(true)
    } else {
      setSelfieDragging(true)
    }
  }

  const handleDragLeave = (type: "id" | "selfie") => (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (type === "id") {
      setValidIdDragging(false)
    } else {
      setSelfieDragging(false)
    }
  }

  const handleDrop = (type: "id" | "selfie") => (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (type === "id") {
      setValidIdDragging(false)
    } else {
      setSelfieDragging(false)
    }

    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(type, file)
    }
  }

  // Handle click on dropzone
  const handleDropzoneClick = (type: "id" | "selfie") => () => {
    if (type === "id" && validIdInputRef.current) {
      validIdInputRef.current.click()
    } else if (type === "selfie" && selfieInputRef.current) {
      selfieInputRef.current.click()
    }
  }

  // Handle keyboard accessibility for dropzone
  const handleDropzoneKeyDown = (type: "id" | "selfie") => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleDropzoneClick(type)()
    }
  }

  // Remove uploaded file
  const handleRemoveFile = (type: "id" | "selfie") => {
    if (type === "id") {
      setValidIdFile(null)
      setValidIdPreview(null)
    } else {
      setSelfieFile(null)
      setSelfiePreview(null)
    }
  }

  // Upload file with progress tracking
  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response.url)
          } catch (error) {
            reject(new Error("Invalid response format"))
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener("error", () => {
        reject(new Error("Network error occurred during upload"))
      })

      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    })
  }

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // Validate user and files
      if (!user?.id) throw new Error("User not authenticated")
      if (!validIdFile || !selfieFile) {
        throw new Error("Please upload both documents")
      }

      // Upload files with progress tracking
      const validIdUrl = await uploadFile(validIdFile)
      setUploadProgress(50) // Set to 50% after first file
      const selfieUrl = await uploadFile(selfieFile)
      setUploadProgress(100) // Set to 100% after second file

      // Submit KYC
      const result = await uploadKYC({
        userId: user.id,
        validIdUrl,
        selfieUrl,
      })

      if (!result.success) throw new Error(result.message)

      // Reset form on success
      setValidIdFile(null)
      setSelfieFile(null)
      setValidIdPreview(null)
      setSelfiePreview(null)

      // Show success message
      toast({
        title: "Success!",
        description: "KYC documents submitted for verification",
      })

      // Redirect to confirmation page
      setTimeout(() => {
        router.push("./kyc/submitted")
      }, 1000)
    } catch (error) {
      setUploadProgress(0)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading skeleton UI
  if (isCheckingStatus) {
    return (
      <div className="w-full min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-4 w-full max-w-md mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
          <Skeleton className="h-12 w-40 mt-6 ml-auto" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl px-4 py-8 mx-auto md:px-6 lg:px-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6"
      >
        <div className="flex items-center">
          <Shield className="w-8 h-8 text-[#1A5EA2] mr-3" />
          <h1 className="text-3xl font-bold text-[#1A5EA2] tracking-widest">KYC Verification</h1>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="mt-2 md:mt-0 flex items-center text-sm text-[#1A5EA2] bg-blue-50 p-2 rounded-md border border-blue-100"
        >
          <Info className="w-4 h-4 mr-2" />
          <span>Verification helps secure your account</span>
        </motion.div>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="w-full bg-white rounded-lg shadow-sm p-4 mb-6"
      >
        <div className="w-full h-2 rounded-full bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] border-0" />
      </motion.div>

      {/* Rejection notice */}
      <AnimatePresence>
        {kycStatus === "REJECTED" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full overflow-hidden"
          >
            <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
              <XCircle className="h-5 w-5" />
              <AlertTitle className="text-red-700">KYC Verification Disapproved</AlertTitle>
              <AlertDescription>
                <p className="text-sm text-red-600 mt-1">Reason: {disapprovalReason}</p>
                {rejectionDate && (
                  <p className="text-sm text-gray-700 mt-1">Rejected on: {new Date(rejectionDate).toLocaleString()}</p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  Please review the reason for disapproval and submit your documents again with the necessary
                  corrections.
                </p>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upload" className="text-sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </TabsTrigger>
          <TabsTrigger value="guide" className="text-sm" onClick={() => setShowGuide(true)}>
            <Info className="w-4 h-4 mr-2" />
            Verification Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-0">
          <Card className="border border-gray-200 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b items-center">
              <CardTitle className="text-[#1A5EA2] flex items-center">
                <FileCheck className="w-5 h-5 mr-2" />
                Upload Verification Documents
              </CardTitle>
              <CardDescription className="text-gray-600">
                Please upload both documents below
                <span className="block text-xs text-gray-500 mt-2">
                  Maximum file size: {MAX_FILE_SIZE_MB}MB • Accepted formats: JPEG, PNG
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valid ID Section */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="border-2 border-[#337DC7] rounded-xl overflow-hidden bg-white"
                >
                  <div className="bg-[#1A5EA2] text-white p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileCheck className="w-5 h-5 mr-2" />
                        <h3 className="font-medium">Valid Government ID</h3>
                      </div>
                      <Badge variant="outline" className="bg-white/20 text-white text-xs">
                        Required
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    {validIdPreview ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 relative">
                        <img
                          src={validIdPreview || "/placeholder.svg"}
                          alt="ID Preview"
                          className="w-full h-48 object-contain bg-gray-100 rounded-md"
                        />
                        <p className="text-sm text-gray-500 mt-2 truncate">{validIdFile?.name}</p>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          onClick={() => handleRemoveFile("id")}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </motion.div>
                    ) : (
                      <div
                        className={`border-2 border-dashed rounded-md p-6 mb-4 transition-colors duration-200 cursor-pointer ${validIdDragging
                            ? "border-[#1A5EA2] bg-blue-100"
                            : "border-blue-200 bg-blue-50 hover:bg-blue-100"
                          }`}
                        onDragOver={handleDragOver("id")}
                        onDragLeave={handleDragLeave("id")}
                        onDrop={handleDrop("id")}
                        onClick={handleDropzoneClick("id")}
                        onKeyDown={handleDropzoneKeyDown("id")}
                        tabIndex={0}
                        role="button"
                        aria-label="Upload valid government ID"
                      >
                        <Upload className="w-10 h-10 text-[#1A5EA2] mb-2 mx-auto" />
                        <p className="text-sm text-center text-gray-600">
                          Drag and drop or click to upload government ID
                        </p>
                      </div>
                    )}
                    <Input
                      id="valid_id"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange("id")}
                      disabled={isSubmitting}
                      className="hidden"
                      ref={validIdInputRef}
                    />
                  </div>
                </motion.div>

                {/* Selfie with ID Section */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="border-2 border-[#337DC7] rounded-xl overflow-hidden bg-white"
                >
                  <div className="bg-[#1A5EA2] text-white p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileCheck className="w-5 h-5 mr-2" />
                        <h3 className="font-medium">Selfie with ID</h3>
                      </div>
                      <Badge variant="outline" className="bg-white/20 text-white text-xs">
                        Required
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    {selfiePreview ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 relative">
                        <img
                          src={selfiePreview || "/placeholder.svg"}
                          alt="Selfie Preview"
                          className="w-full h-48 object-contain bg-gray-100 rounded-md"
                        />
                        <p className="text-sm text-gray-500 mt-2 truncate">{selfieFile?.name}</p>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          onClick={() => handleRemoveFile("selfie")}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </motion.div>
                    ) : (
                      <div
                        className={`border-2 border-dashed rounded-md p-6 mb-4 transition-colors duration-200 cursor-pointer ${selfieDragging
                            ? "border-[#1A5EA2] bg-blue-100"
                            : "border-blue-200 bg-blue-50 hover:bg-blue-100"
                          }`}
                        onDragOver={handleDragOver("selfie")}
                        onDragLeave={handleDragLeave("selfie")}
                        onDrop={handleDrop("selfie")}
                        onClick={handleDropzoneClick("selfie")}
                        onKeyDown={handleDropzoneKeyDown("selfie")}
                        tabIndex={0}
                        role="button"
                        aria-label="Upload selfie with ID"
                      >
                        <Upload className="w-10 h-10 text-[#1A5EA2] mb-2 mx-auto" />
                        <p className="text-sm text-center text-gray-600">
                          Drag and drop or click to upload selfie with ID
                        </p>
                      </div>
                    )}
                    <Input
                      id="selfie_with_id"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange("selfie")}
                      disabled={isSubmitting}
                      className="hidden"
                      ref={selfieInputRef}
                    />
                  </div>
                </motion.div>
              </div>
            </CardContent>

            <CardFooter className="bg-blue-50 border-t p-4 flex flex-col gap-4">
              {/* Upload progress */}
              <AnimatePresence>
                {isSubmitting && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#1A5EA2]">Uploading documents...</span>
                      <span className="text-sm text-gray-600">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row justify-between items-center w-full">
                <div className="flex items-start mb-3 sm:mb-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Shield className="w-5 h-5 text-[#1A5EA2] mr-2 mt-0.5" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Your data is encrypted and secure</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-sm text-gray-600">
                    Your documents are encrypted and securely stored. We respect your privacy.
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSubmit}
                    disabled={!validIdFile || !selfieFile || isSubmitting || !user?.id}
                    className="bg-[#1A5EA2] hover:bg-[#154c87] text-white px-6 min-w-[180px]"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Submit Verification
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="mt-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Card className="border border-gray-200 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
                <CardTitle className="text-[#1A5EA2] flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  KYC Verification Guide
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Learn how to complete your verification successfully
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid gap-6">
                  <div className="border rounded-lg p-4 bg-blue-50/50">
                    <h3 className="font-medium text-[#1A5EA2] mb-2 flex items-center">
                      <FileCheck className="w-5 h-5 mr-2" />
                      Acceptable ID Documents
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                      <li>Passport</li>
                      <li>Driver's License</li>
                      <li>National ID Card</li>
                      <li>Residence Permit</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-blue-50/50">
                    <h3 className="font-medium text-[#1A5EA2] mb-2 flex items-center">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Requirements for ID Photo
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                      <li>All four corners must be visible</li>
                      <li>Document must not be expired</li>
                      <li>Information must be clearly readable</li>
                      <li>No glare or shadows covering important information</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-blue-50/50">
                    <h3 className="font-medium text-[#1A5EA2] mb-2 flex items-center">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Requirements for Selfie with ID
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                      <li>Hold your ID next to your face</li>
                      <li>Your face and the ID must be clearly visible</li>
                      <li>Take the photo in good lighting</li>
                      <li>Ensure your face is not covered (no sunglasses, masks, etc.)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* What happens next section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100"
      >
        <h3 className="font-medium text-[#1A5EA2] mb-2 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          What happens next?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          <div className="flex items-start">
            <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center text-[#1A5EA2] font-bold mr-2 shadow-sm">
              1
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">Document Review</p>
              <p className="text-xs text-gray-600">Our team will review your submitted documents</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center text-[#1A5EA2] font-bold mr-2 shadow-sm">
              2
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">Verification Process</p>
              <p className="text-xs text-gray-600">This typically takes 24-48 hours to complete</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center text-[#1A5EA2] font-bold mr-2 shadow-sm">
              3
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">Notification</p>
              <p className="text-xs text-gray-600">You'll receive an email once verification is complete</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}