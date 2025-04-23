"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2, FileCheck, Clock, Info, 
  ChevronLeft, ChevronRight, CheckSquare, ArrowRight, Shield, FileImage } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { getATMGOApplicationsByUserId } from "@/actions/atmgo"
import { uploadDocument, bulkUploadDocuments, getATMGODocumentsByApplicationId } from "@/actions/atm-documents"
import { useUserContext } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"

interface FileWithPreview {
  id: string
  name: string
  size: number
  type: string
  requirementType: string
  preview?: string | null
  blobUrl?: string
  file?: File
}

interface Application {
  id: number
  business_name: string
  complete_name: string
  email: string
  cellphone?: string
  status: string
  requirements: string[]
  // Add submitted documents tracking
  submittedDocuments: {
    documentType: string
    status: string
    documentUrl: string
  }[]
}

interface DocumentUpload {
  documentType: string;
  documentUrl: string;
  originalFilename?: string;
  fileSize?: number;
  fileType?: string;
}

// Define document status type
type DocumentStatus = 'pending' | 'verified' | 'rejected';

export default function RequirementsUploadSection() {
  const { user } = useUserContext()
  const { toast } = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingDocuments, setIsCheckingDocuments] = useState(false)

  // Define required documents
  const requiredDocuments = [
    "Business Permit or Barangay Permit",
    "DTI CERTIFICATE, or SEC for Corporation, CDA for cooperative",
    "Clear copy of BANK ACCOUNT",
    "Signed Terms & Conditions",
    "Picture of STORE"
  ]
  
  // Step-by-step upload states
  const [activeApplicationId, setActiveApplicationId] = useState<number | null>(null)
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [uploadStage, setUploadStage] = useState<"selection" | "upload" | "review">("selection")
  
  // Drag and drop states (KYC-style)
  const [draggingDocument, setDraggingDocument] = useState<string | null>(null)
  
// The issue is in the useEffect's document fetching logic and the missing dependency array
// Here's the corrected section:

useEffect(() => {
  const fetchApplications = async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsCheckingDocuments(true)
      const response = await getATMGOApplicationsByUserId(user.id)
      
      if (response.success && response.data) {
        // Convert the API response to our Application interface
        const apps = Array.isArray(response.data) ? response.data : [response.data]
        
        const formattedApps = apps
          .filter(app => app.status === "Approved" as Application["status"]) // Only show approved applications
          .map(app => ({
            id: typeof app.id === 'number' ? app.id : 0,
            business_name: app.business_name,
            complete_name: app.complete_name,
            email: app.email,
            cellphone: app.cellphone,
            status: "Pending Requirements",
            requirements: requiredDocuments,
            submittedDocuments: [] // Initialize with empty array
          }))
        
        setApplications(formattedApps)
        
        // Now fetch documents for each application
        for (const app of formattedApps) {
          const docResponse = await getATMGODocumentsByApplicationId(app.id, user.id)
          
          if (docResponse.success && docResponse.data) {
            // Update the application with document data
            setApplications(prev => {
              return prev.map(prevApp => {
                if (prevApp.id === app.id) {
                  // Map the documents to our format
                  const submittedDocs = docResponse.data.map((doc) => ({
                    documentType: doc.document_type,
                    status: doc.status,
                    documentUrl: doc.document_url
                  }))
                  
                  // Check if all requirements are submitted
                  const allRequirementsSubmitted = requiredDocuments.every(req => 
                    submittedDocs.some(doc => doc.documentType === req)
                  )
                  
                  // Initialize appFiles with the submitted documents
                  if (submittedDocs.length > 0) {
                    setAppFiles(prev => {
                      const files = submittedDocs.map(doc => ({
                        id: `existing-${doc.documentType}`,
                        name: doc.documentType,
                        size: 0,
                        type: doc.documentUrl.includes('.pdf') ? 'application/pdf' : 
                              doc.documentUrl.includes('.jpg') || doc.documentUrl.includes('.jpeg') ? 'image/jpeg' :
                              doc.documentUrl.includes('.png') ? 'image/png' : 'application/octet-stream',
                        requirementType: doc.documentType,
                        preview: null,
                        blobUrl: doc.documentUrl
                      }))
                      
                      return {
                        ...prev,
                        [app.id]: {
                          files: files,
                          uploading: false,
                          progress: 100,
                          error: null,
                          uploaded: allRequirementsSubmitted
                        }
                      }
                    })
                  }
                  
                  return {
                    ...prevApp,
                    submittedDocuments: submittedDocs,
                    // If all documents are submitted, update status
                    status: allRequirementsSubmitted ? "Documents Submitted" : "Pending Requirements"
                  }
                }
                return prevApp
              })
            })
          }
        }
      }
    } catch (error) {
      console.error("Error fetching applications or documents:", error)
      toast({
        title: "Error",
        description: "Failed to load your application data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setIsCheckingDocuments(false)
    }
  }

  fetchApplications()
}, [user?.id, toast]) // Remove requiredDocuments from the dependency array

  const [appFiles, setAppFiles] = useState<
    Record<
      number,
      {
        files: FileWithPreview[]
        uploading: boolean
        progress: number
        error: string | null
        uploaded: boolean
      }
    >
  >({})

  const [expandedApp, setExpandedApp] = useState<number | null>(null)

  // File input references for each document type
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Constants
  const MAX_FILE_SIZE_MB = 10
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
  const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf", "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]

  // UI helper functions
  const getFileIcon = (file: FileWithPreview) => {
    if (file.type.includes("pdf")) {
      return <FileText className="h-6 w-6 text-red-500" />
    }

    if (file.type.includes("word") || file.type.includes("document")) {
      return <FileText className="h-6 w-6 text-blue-500" />
    }

    if (file.type.includes("excel") || file.type.includes("sheet")) {
      return <FileText className="h-6 w-6 text-green-500" />
    }

    if (file.type.includes("image")) {
      return <FileImage className="h-6 w-6 text-purple-500" />
    }

    return <FileText className="h-6 w-6 text-gray-500" />
  }

  const getFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`
    }
  }

  // Check if a document type is already submitted and pending
  const isDocumentSubmitted = (appId: number, documentType: string): boolean => {
    const app = applications.find(a => a.id === appId)
    if (!app) return false
    
    return app.submittedDocuments.some(doc => 
      doc.documentType === documentType && 
      (doc.status === 'pending' || doc.status === 'verified')
    )
  }

  // Get document status if submitted
  const getDocumentStatus = (appId: number, documentType: string): DocumentStatus | null => {
    const app = applications.find(a => a.id === appId)
    if (!app) return null
    
    const doc = app.submittedDocuments.find(d => d.documentType === documentType)
    return doc ? doc.status as DocumentStatus : null
  }

  // File validation function (KYC-style)
  const validateFile = (file: File): { valid: boolean; message?: string } => {
    if (!ACCEPTED_FILE_TYPES.some(type => file.type.includes(type.split('/')[1]))) {
      return {
        valid: false,
        message: "Invalid file type. Please upload an image, PDF, or document file.",
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

  // Process the file (KYC-style)
  const processFile = (appId: number, requirementType: string, file: File) => {
    // First check if this document type is already submitted
    if (isDocumentSubmitted(appId, requirementType)) {
      toast({
        title: "Document Already Submitted",
        description: `Your ${requirementType} has already been submitted and is ${getDocumentStatus(appId, requirementType) || 'pending'} review.`,
        variant: "default"
      })
      return
    }
    
    const validation = validateFile(file)

    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.message,
        variant: "destructive",
      })
      return
    }

    // Create a unique ID for this file
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Create a preview for image files
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const fileWithPreview: FileWithPreview = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          requirementType: requirementType,
          preview: e.target?.result as string,
          file: file // Store the actual file for upload later
        }
        
        // Add this file to the application's files
        setAppFiles(prev => {
          const currentFiles = prev[appId]?.files || []
          
          // Remove any existing file for this requirement type
          const filteredFiles = currentFiles.filter(f => f.requirementType !== requirementType)
          
          return {
            ...prev,
            [appId]: {
              ...prev[appId],
              files: [...filteredFiles, fileWithPreview],
              error: null
            }
          }
        })
      }
      reader.readAsDataURL(file)
    } else {
      // Non-image file without preview
      const fileWithPreview: FileWithPreview = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        requirementType: requirementType,
        preview: null,
        file: file // Store the actual file for upload later
      }
      
      // Add this file to the application's files
      setAppFiles(prev => {
        const currentFiles = prev[appId]?.files || []
        
        // Remove any existing file for this requirement type
        const filteredFiles = currentFiles.filter(f => f.requirementType !== requirementType)
        
        return {
          ...prev,
          [appId]: {
            ...prev[appId],
            files: [...filteredFiles, fileWithPreview],
            error: null
          }
        }
      })
    }

    // Show success toast
    toast({
      title: "File Added",
      description: `${file.name} has been selected for ${requirementType}.`,
      variant: "default"
    })
  }

  // Start the step-by-step upload process
  const startStepByStepUpload = (appId: number) => {
    setActiveApplicationId(appId)
    setCurrentStep(0)
    setUploadStage("upload")
    
    // Initialize files for this application if not already present
    if (!appFiles[appId]) {
      setAppFiles(prev => ({
        ...prev,
        [appId]: {
          files: [],
          uploading: false,
          progress: 0,
          error: null,
          uploaded: false
        }
      }))
    }
    
    // Find the first document that needs to be uploaded
    const app = applications.find(a => a.id === appId)
    if (app) {
      // Find first requirement that doesn't have a document
      const firstMissingIndex = requiredDocuments.findIndex(req => 
        !app.submittedDocuments.some(doc => doc.documentType === req)
      )
      if (firstMissingIndex >= 0) {
        setCurrentStep(firstMissingIndex)
      }
    }
  }

  // Handle file selection for a specific requirement - click to upload
  const handleFileSelection = (appId: number, requirementType: string) => {
    // Check if already submitted
    if (isDocumentSubmitted(appId, requirementType)) {
      toast({
        title: "Document Already Submitted",
        description: `Your ${requirementType} has already been submitted and is ${getDocumentStatus(appId, requirementType) || 'pending'} review.`,
        variant: "default"
      })
      return
    }
    
    const inputRef = fileInputRefs.current[requirementType]
    if (inputRef) {
      inputRef.click()
    }
  }

  // Handle file change from input
  const handleFileChange = (appId: number, requirementType: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    processFile(appId, requirementType, file)
  }

  // Handle drag events (KYC-style)
  const handleDragOver = (requirementType: string) => (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingDocument(requirementType)
  }

  const handleDragLeave = () => (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingDocument(null)
  }

  const handleDrop = (appId: number, requirementType: string) => (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingDocument(null)

    // Check if already submitted
    if (isDocumentSubmitted(appId, requirementType)) {
      toast({
        title: "Document Already Submitted",
        description: `Your ${requirementType} has already been submitted and is ${getDocumentStatus(appId, requirementType) || 'pending'} review.`,
        variant: "default"
      })
      return
    }

    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(appId, requirementType, file)
    }
  }

  // Remove a specific file
  const removeFile = (appId: number, fileId: string) => {
    // Get the file data
    const file = appFiles[appId]?.files.find(f => f.id === fileId)
    if (!file) return
    
    // Check if this is an existing submitted document
    if (isDocumentSubmitted(appId, file.requirementType)) {
      toast({
        title: "Cannot Remove",
        description: `This document has already been submitted and is being reviewed. Contact support if you need to make changes.`,
        variant: "destructive"
      })
      return
    }
    
    setAppFiles(prev => {
      const appFile = prev[appId]
      if (!appFile) return prev

      return {
        ...prev,
        [appId]: {
          ...appFile,
          files: appFile.files.filter(f => f.id !== fileId)
        }
      }
    })
  }

  // Go to next step in the upload process
  const goToNextStep = () => {
    if (currentStep < requiredDocuments.length - 1) {
      // Find the next document that needs to be uploaded
      const app = applications.find(a => a.id === activeApplicationId)
      if (app) {
        // Start from the next step
        let nextStep = currentStep + 1
        
        // Keep incrementing until we find a document that's not submitted or we reach the end
        while (
          nextStep < requiredDocuments.length && 
          isDocumentSubmitted(activeApplicationId!, requiredDocuments[nextStep])
        ) {
          nextStep++
        }
        
        if (nextStep < requiredDocuments.length) {
          setCurrentStep(nextStep)
        } else {
          // All remaining documents are already submitted, move to review
          setUploadStage("review")
        }
      } else {
        setCurrentStep(prev => prev + 1)
      }
    } else {
      // All steps completed, move to review stage
      setUploadStage("review")
    }
  }

  // Go to previous step in the upload process
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      // Find the previous document that needs to be uploaded
      const app = applications.find(a => a.id === activeApplicationId)
      if (app) {
        // Start from the previous step
        let prevStep = currentStep - 1
        
        // Keep decrementing until we find a document that's not submitted or we reach the beginning
        while (
          prevStep > 0 && 
          isDocumentSubmitted(activeApplicationId!, requiredDocuments[prevStep])
        ) {
          prevStep--
        }
        
        setCurrentStep(prevStep)
      } else {
        setCurrentStep(prev => prev - 1)
      }
    }
  }

  // Upload a single file to Vercel Blob and get the URL
  const uploadFileToBlob = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`)
      }
      
      const data = await response.json()
      return data.url // Return the Vercel Blob URL
    } catch (error) {
      console.error('Error uploading to Blob:', error)
      throw error
    }
  }

  // Update the progress during upload
  const updateUploadProgress = (appId: number, progress: number) => {
    setAppFiles(prev => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        progress
      }
    }))
  }

  // Start the actual upload process after reviewing
  const startUpload = async (appId: number) => {
    // Get the application
    const app = applications.find(a => a.id === appId)
    if (!app) return
    
    // Check which documents still need to be uploaded
    const remainingDocuments = appFiles[appId]?.files.filter(file => 
      !isDocumentSubmitted(appId, file.requirementType)
    ) || []
    
    // If no new documents to upload, we're done
    if (remainingDocuments.length === 0) {
      toast({
        title: "No New Documents",
        description: "All required documents have already been submitted.",
        variant: "default"
      })
      setActiveApplicationId(null)
      setUploadStage("selection")
      return
    }
    
    setAppFiles(prev => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        uploading: true,
        progress: 0
      }
    }))

    try {
      // Calculate progress increment per file
      const progressIncrement = 100 / remainingDocuments.length
      let completedUploads = 0

      // Array to store document upload data
      const documents: DocumentUpload[] = [];

      // Upload each file sequentially
      for (const fileData of remainingDocuments) {
        try {
          // Skip already submitted documents
          if (isDocumentSubmitted(appId, fileData.requirementType)) {
            continue
          }
          
          // Update progress at the start of each file upload
          updateUploadProgress(appId, Math.round(completedUploads * progressIncrement))
          
          // Get the file from the fileData object
          const file = fileData.file
          if (!file) {
            throw new Error(`No file available for ${fileData.name}`)
          }
          
          // Upload to Vercel Blob
          const blobUrl = await uploadFileToBlob(file)
          
          // Add to documents array for bulk upload
          documents.push({
            documentType: fileData.requirementType,
            documentUrl: blobUrl,
            originalFilename: file.name,
            fileSize: file.size,
            fileType: file.type
          })
          
          // Update the file data with the blob URL
          setAppFiles(prev => {
            const updatedFiles = prev[appId].files.map(f => 
              f.id === fileData.id ? { ...f, blobUrl } : f
            )
            
            return {
              ...prev,
              [appId]: {
                ...prev[appId],
                files: updatedFiles
              }
            }
          })
          
          // Update progress after each file
          completedUploads++
          updateUploadProgress(appId, Math.min(Math.round(completedUploads * progressIncrement), 95))
        } catch (error) {
          console.error(`Error uploading file ${fileData.name}:`, error)
          throw error
        }
      }

      // All files uploaded to Blob, now store URLs in database
      updateUploadProgress(appId, 96)
      
      // If no documents to upload (all already submitted), we're done
      if (documents.length === 0) {
        toast({
          title: "No New Documents",
          description: "All required documents have already been submitted.",
          variant: "default"
        })
        
        setAppFiles(prev => ({
          ...prev,
          [appId]: {
            ...prev[appId],
            uploading: false,
            progress: 0
          }
        }))
        
        setActiveApplicationId(null)
        setUploadStage("selection")
        return
      }
      
      // Call bulkUploadDocuments server action
      const result = await bulkUploadDocuments({
        applicationId: appId,
        userId: user?.id || 0,
        documents: documents
      })
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to store document URLs in database')
      }
      
      // Update the application's submitted documents
      setApplications(prev => {
        return prev.map(prevApp => {
          if (prevApp.id === appId) {
            // Add the new documents to the submitted documents list
            const newSubmittedDocs = [
              ...prevApp.submittedDocuments,
              ...documents.map(doc => ({
                documentType: doc.documentType,
                status: 'pending' as DocumentStatus,
                documentUrl: doc.documentUrl
              }))
            ]
            
            // Check if all requirements are now submitted
            const allRequirementsSubmitted = requiredDocuments.every(req => 
              newSubmittedDocs.some(doc => doc.documentType === req)
            )
            
            return {
              ...prevApp,
              submittedDocuments: newSubmittedDocs,
              status: allRequirementsSubmitted ? "Documents Submitted" : "Pending Requirements"
            }
          }
          return prevApp
        })
      })
      
      // All uploads completed successfully
      setAppFiles(prev => ({
        ...prev,
        [appId]: {
          ...prev[appId],
          uploading: false,
          progress: 100,
          uploaded: true
        }
      }))

      // Show success toast
      toast({
        title: "Upload Complete",
        description: "Your documents have been successfully submitted for review.",
        variant: "default"
      })

      // Reset steps
      setTimeout(() => {
        setActiveApplicationId(null)
        setUploadStage("selection")
        setCurrentStep(0)
      }, 1500)
    } catch (error) {
      console.error("Upload error:", error)
      
      setAppFiles(prev => ({
        ...prev,
        [appId]: {
          ...prev[appId],
          uploading: false,
          error: error instanceof Error ? error.message : "Unknown error occurred during upload"
        }
      }))
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload documents",
        variant: "destructive"
      })
    }
  }

  // Cancel the upload process
  const cancelUpload = () => {
    setActiveApplicationId(null)
    setUploadStage("selection")
    setCurrentStep(0)
  }

  // Check if a file has been uploaded for the current requirement
  const hasFileForCurrentRequirement = (appId: number) => {
    // Check if document is already submitted
    if (isDocumentSubmitted(appId, requiredDocuments[currentStep])) {
      return true
    }
    
    // Check if file is selected but not uploaded yet
    if (!appId || !appFiles[appId]) return false
    
    const currentRequirement = requiredDocuments[currentStep]
    return appFiles[appId].files.some(file => file.requirementType === currentRequirement)
  }

  // Count how many requirements have been fulfilled
  const countCompletedRequirements = (appId: number) => {
    const app = applications.find(a => a.id === appId)
    if (!app) return 0
    
    // Count submitted documents
    const submittedCount = app.submittedDocuments.length
    
    // Count new documents that are not yet submitted
    const newFiles = appFiles[appId]?.files.filter(file => 
      !isDocumentSubmitted(appId, file.requirementType)
    ) || []
    
    // Return the total number of unique document types
    const uniqueTypes = new Set([
      ...app.submittedDocuments.map(doc => doc.documentType),
      ...newFiles.map(file => file.requirementType)
    ])
    
    return uniqueTypes.size
  }

  // Determine if all documents are already submitted
  const areAllDocumentsSubmitted = (appId: number): boolean => {
    const app = applications.find(a => a.id === appId)
    if (!app) return false
    
    return requiredDocuments.every(req => 
      app.submittedDocuments.some(doc => doc.documentType === req)
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center">
          <Shield className="w-8 h-8 text-[#1A5EA2] mr-3" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1A5EA2]">Document Requirements</h2>
            <p className="text-muted-foreground">
              Upload supporting documents to complete the onboarding process.
            </p>
          </div>
        </div>

        {isLoading || isCheckingDocuments ? (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>{isCheckingDocuments ? "Checking documents..." : "Loading applications..."}</span>
          </div>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 text-sm bg-amber-50 border-amber-200 text-amber-700 self-start">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {applications.length} {applications.length === 1 ? "application" : "applications"} pending
          </Badge>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Separator className="mb-6" />
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <p>Loading your applications...</p>
        </div>
      ) : applications.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 max-w-2xl mx-auto">
          {applications.map((app) => {
            const appFile = appFiles[app.id]
            const isExpanded = expandedApp === app.id
            const isActive = activeApplicationId === app.id
            const completedCount = countCompletedRequirements(app.id)
            const totalCount = requiredDocuments.length
            const allSubmitted = areAllDocumentsSubmitted(app.id)
            
            // Show application if we're in selection mode, or if this is the active application
            if (uploadStage !== "selection" && !isActive) {
              return null
            }
            
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card
                  className={`overflow-hidden transition-all ${
                    appFile?.uploading ? "border-blue-200 shadow-md" : 
                    allSubmitted ? "border-green-200" : ""
                  }`}
                >
                  <CardHeader className={`pb-3 bg-gradient-to-r ${
                    allSubmitted ? "from-green-50 to-white" : "from-blue-50 to-white"
                  } border-b`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{app.business_name}</CardTitle>
                        <CardDescription>Application ID: {app.id}</CardDescription>
                      </div>
                      
                      {uploadStage === "selection" && (
                        <div className="flex items-center gap-2">
                          {allSubmitted ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              All Documents Submitted
                            </Badge>
                          ) : appFile?.uploaded ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Submitted
                            </Badge>
                          ) : completedCount > 0 ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {completedCount}/{totalCount} Uploaded
                            </Badge>
                          ) : null}
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                                >
                                  <Info className="h-4 w-4" />
                                  <span className="sr-only">Application details</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View application details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <AnimatePresence>
                    {isExpanded && uploadStage === "selection" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardContent className="pb-3 pt-0">
                          <div className="bg-muted/30 rounded-md p-3 space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-muted-foreground">Applicant:</p>
                                <p className="font-medium">{app.complete_name}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Email:</p>
                                <p className="font-medium">{app.email}</p>
                              </div>
                              {app.cellphone && (
                                <div>
                                  <p className="text-muted-foreground">Phone:</p>
                                  <p className="font-medium">{app.cellphone}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-muted-foreground">Status:</p>
                                <Badge variant="outline" className={`${
                                  allSubmitted 
                                    ? "bg-green-50 text-green-700 border-green-200" 
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {allSubmitted ? "Documents Submitted" : "Pending Requirements"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <CardContent className={isExpanded && uploadStage === "selection" ? "pt-0" : "pt-2"}>
                    {/* SELECTION STAGE - Show list of requirements */}
                    {uploadStage === "selection" && (
                      <>
                        {allSubmitted ? (
                          <div className="py-6 text-center">
                            <div className="flex justify-center mb-3">
                              <CheckCircle className="h-12 w-12 text-green-500" />
                            </div>
                            <h3 className="text-lg font-medium text-green-700 mb-1">Thank You!</h3>
                            <p className="text-green-600 mb-4">
                              All required documents have been submitted and are being reviewed.
                            </p>
                            <Alert className="bg-blue-50 border-blue-100 mb-4">
                              <Info className="h-4 w-4 mr-2" />
                              <AlertDescription>
                                Our team will review your documents within 24-48 hours. You'll receive an email notification once the verification is complete.
                              </AlertDescription>
                            </Alert>
                            <div className="flex justify-center">
                              <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
                                Return to Dashboard
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {app.requirements && app.requirements.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-2">Required Documents:</h4>
                                <ul className="text-sm space-y-1">
                                  {app.requirements.map((req, i) => {
                                    // Check if this requirement has a file uploaded
                                    const isSubmitted = isDocumentSubmitted(app.id, req)
                                    const status = getDocumentStatus(app.id, req)
                                    const hasFile = isSubmitted || appFile?.files?.some(file => file.requirementType === req)
                                    
                                    return (
                                      <li key={i} className="flex items-center">
                                        {isSubmitted ? (
                                          status === 'verified' ? (
                                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                          ) : status === 'rejected' ? (
                                            <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                          ) : (
                                            <Clock className="h-4 w-4 mr-2 text-amber-500" />
                                          )
                                        ) : hasFile ? (
                                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                        ) : (
                                          <FileCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                                        )}
                                        <span className={
                                          isSubmitted && status === 'verified' ? "text-green-700" :
                                          isSubmitted && status === 'rejected' ? "text-red-700" :
                                          isSubmitted ? "text-amber-700" : ""
                                        }>
                                          {req}
                                        </span>
                                        {isSubmitted && (
                                          <Badge 
                                            variant="outline" 
                                            className={`ml-2 text-xs ${
                                              status === 'verified' ? "bg-green-50 text-green-700 border-green-200" :
                                              status === 'rejected' ? "bg-red-50 text-red-700 border-red-200" :
                                              "bg-amber-50 text-amber-700 border-amber-200"
                                            }`}
                                          >
                                            {status === 'verified' ? "Verified" : 
                                             status === 'rejected' ? "Rejected" : "Pending"}
                                          </Badge>
                                        )}
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex justify-center mt-4">
                              {appFile?.uploaded ? (
                                <div className="flex items-center text-green-600">
                                  <CheckCircle className="h-5 w-5 mr-2" />
                                  <span>All requirements submitted successfully</span>
                                </div>
                              ) : (
                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                  <Button 
                                    onClick={() => startStepByStepUpload(app.id)}
                                    className="w-full sm:w-auto bg-[#1A5EA2] hover:bg-[#154c87]"
                                    disabled={allSubmitted}
                                  >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {completedCount > 0 ? "Continue Upload" : "Start Upload"}
                                  </Button>
                                </motion.div>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    )}
                    
                    {/* UPLOAD STAGE - Show current step for uploading */}
                    {uploadStage === "upload" && isActive && (
                      <div className="space-y-4">
                        {/* Progress indicator */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span>Step {currentStep + 1} of {requiredDocuments.length}</span>
                            <span>{Math.round((currentStep / requiredDocuments.length) * 100)}% complete</span>
                          </div>
                          <Progress 
                            value={(currentStep / requiredDocuments.length) * 100} 
                            className="h-2" 
                          />
                        </div>
                        
                        {/* Current requirement */}
                        <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
                          <h3 className="font-medium mb-1 text-[#1A5EA2]">Upload Document {currentStep + 1}</h3>
                          <p className="text-muted-foreground text-sm mb-2">
                            Please upload your {requiredDocuments[currentStep]}
                          </p>
                          
                          {/* Show message if document already submitted */}
                          {isDocumentSubmitted(app.id, requiredDocuments[currentStep]) && (
                            <Alert className="mb-3 border-amber-200 bg-amber-50">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-amber-600" />
                                <span className="font-medium text-amber-700">Already Submitted</span>
                              </div>
                              <AlertDescription className="text-amber-700">
                                This document has already been submitted and is {getDocumentStatus(app.id, requiredDocuments[currentStep])} review.
                                {getDocumentStatus(app.id, requiredDocuments[currentStep]) === 'rejected' && 
                                  " Please contact support to update this document."}
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {/* File selection area - KYC Style */}
                          {hasFileForCurrentRequirement(app.id) && !isDocumentSubmitted(app.id, requiredDocuments[currentStep]) ? (
                            // Show selected file with preview
                            <motion.div 
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }} 
                              className="mt-2"
                            >
                              {appFile.files
                                .filter(file => file.requirementType === requiredDocuments[currentStep])
                                .map(file => (
                                  <div key={file.id} className="flex flex-col bg-white rounded-md p-3 border">
                                    {/* Show preview for image files */}
                                    {file.preview && file.type.startsWith('image/') ? (
                                      <div className="relative mb-3">
                                        <img
                                          src={file.preview}
                                          alt={`Preview of ${file.name}`}
                                          className="w-full h-48 object-contain bg-gray-100 rounded-md"
                                        />
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                                          onClick={() => removeFile(app.id, file.id)}
                                        >
                                          <X className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center overflow-hidden">
                                          <div className="mr-3 flex-shrink-0">{getFileIcon(file)}</div>
                                          <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{getFileSize(file.size)}</p>
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                          onClick={() => removeFile(app.id, file.id)}
                                        >
                                          <X className="h-4 w-4" />
                                          <span className="sr-only">Remove file</span>
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </motion.div>
                          ) : !isDocumentSubmitted(app.id, requiredDocuments[currentStep]) ? (
                            // Show drop zone (KYC-style) if not submitted
                            <div 
                              className={`border-2 border-dashed rounded-md p-6 transition-colors duration-200 cursor-pointer ${
                                draggingDocument === requiredDocuments[currentStep]
                                  ? "border-[#1A5EA2] bg-blue-100"
                                  : "border-blue-200 bg-blue-50 hover:bg-blue-100"
                              }`}
                              onDragOver={handleDragOver(requiredDocuments[currentStep])}
                              onDragLeave={handleDragLeave()}
                              onDrop={handleDrop(app.id, requiredDocuments[currentStep])}
                              onClick={() => handleFileSelection(app.id, requiredDocuments[currentStep])}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleFileSelection(app.id, requiredDocuments[currentStep]);
                                }
                              }}
                              tabIndex={0}
                              role="button"
                              aria-label={`Upload ${requiredDocuments[currentStep]}`}
                            >
                              <Upload className="w-10 h-10 text-[#1A5EA2] mb-2 mx-auto" />
                              <p className="text-sm text-center text-gray-600">
                                Drag and drop or click to upload
                              </p>
                              <p className="text-xs text-center text-muted-foreground mt-1">
                                Supports images, PDFs, and document files up to {MAX_FILE_SIZE_MB}MB
                              </p>
                              
                              {/* Hidden file input */}
                              <Input
                                id={`file-input-${app.id}-${currentStep}`}
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                onChange={handleFileChange(app.id, requiredDocuments[currentStep])}
                                className="hidden"
                                ref={el => {
                                  fileInputRefs.current[requiredDocuments[currentStep]] = el;
                                }}
                              />
                            </div>
                          ) : (
                            // For already submitted documents, show status and next button
                            <div className="flex justify-end">
                              <Button 
                                onClick={goToNextStep}
                                className="bg-[#1A5EA2] hover:bg-[#154c87]"
                              >
                                Next
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Navigation buttons */}
                        <div className="flex justify-between pt-2">
                          <Button
                            variant="outline"
                            onClick={currentStep === 0 ? cancelUpload : goToPreviousStep}
                          >
                            {currentStep === 0 ? (
                              <>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                              </>
                            ) : (
                              <>
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Previous
                              </>
                            )}
                          </Button>
                          
                          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              onClick={goToNextStep}
                              disabled={!hasFileForCurrentRequirement(app.id) && !isDocumentSubmitted(app.id, requiredDocuments[currentStep])}
                              className="bg-[#1A5EA2] hover:bg-[#154c87]"
                            >
                              {currentStep === requiredDocuments.length - 1 ? (
                                <>
                                  Review Documents
                                  <CheckSquare className="ml-2 h-4 w-4" />
                                </>
                              ) : (
                                <>
                                  Next
                                  <ChevronRight className="ml-2 h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    )}
                    
                    {/* REVIEW STAGE - Review uploaded documents before submission */}
                    {uploadStage === "review" && isActive && (
                      <div className="space-y-4">
                        <Alert className="bg-blue-50 border-blue-100">
                          <div className="flex items-center">
                            <Info className="h-4 w-4 mr-2" />
                            <span className="font-medium">Review your documents</span>
                          </div>
                          <AlertDescription>
                            Please review all your documents before final submission.
                          </AlertDescription>
                        </Alert>
                        
                        <ScrollArea className="h-[300px] rounded-md border p-3">
                          <div className="space-y-4">
                            {requiredDocuments.map((req, i) => {
                              const isSubmitted = isDocumentSubmitted(app.id, req)
                              const status = getDocumentStatus(app.id, req)
                              const matchingFiles = isSubmitted 
                                ? [] // No new files if already submitted
                                : (appFile?.files?.filter(file => file.requirementType === req) || [])
                              
                              return (
                                <div key={i} className="border-b pb-3 last:border-0 last:pb-0">
                                  <h4 className="text-sm font-medium mb-2 flex items-center">
                                    {isSubmitted ? (
                                      status === 'verified' ? (
                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                      ) : status === 'rejected' ? (
                                        <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                      ) : (
                                        <Clock className="h-4 w-4 mr-2 text-amber-500" />
                                      )
                                    ) : matchingFiles.length > 0 ? (
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                    )}
                                    {req}
                                    {isSubmitted && (
                                      <Badge 
                                        variant="outline" 
                                        className={`ml-2 text-xs ${
                                          status === 'verified' ? "bg-green-50 text-green-700 border-green-200" :
                                          status === 'rejected' ? "bg-red-50 text-red-700 border-red-200" :
                                          "bg-amber-50 text-amber-700 border-amber-200"
                                        }`}
                                      >
                                        {status === 'verified' ? "Verified" : 
                                         status === 'rejected' ? "Rejected" : "Pending"}
                                      </Badge>
                                    )}
                                  </h4>
                                  
                                  {isSubmitted ? (
                                    <div className="bg-muted/30 rounded-md p-2">
                                      <div className="flex items-center">
                                        <FileCheck className="h-5 w-5 mr-2 text-amber-500" />
                                        <div>
                                          <p className="text-sm text-amber-700">Document already submitted</p>
                                          <p className="text-xs text-amber-600">
                                            Status: {status === 'verified' ? "Verified" : 
                                                    status === 'rejected' ? "Rejected" : "Pending review"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ) : matchingFiles.length > 0 ? (
                                    <div className="bg-muted/30 rounded-md p-2">
                                      {matchingFiles.map(file => (
                                        <div key={file.id} className="flex flex-col">
                                          {/* Show preview for images */}
                                          {file.preview && file.type.startsWith('image/') ? (
                                            <div className="w-full mb-2">
                                              <img
                                                src={file.preview}
                                                alt={`Preview of ${file.name}`}
                                                className="w-full max-h-36 object-contain bg-gray-100 rounded-md"
                                              />
                                            </div>
                                          ) : null}
                                          
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center overflow-hidden">
                                              <div className="mr-2 flex-shrink-0">{getFileIcon(file)}</div>
                                              <div className="min-w-0">
                                                <p className="text-sm truncate">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">{getFileSize(file.size)}</p>
                                              </div>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0"
                                              onClick={() => {
                                                removeFile(app.id, file.id)
                                                // Return to the respective step to re-upload
                                                setCurrentStep(i)
                                                setUploadStage("upload")
                                              }}
                                            >
                                              <X className="h-4 w-4" />
                                              <span className="sr-only">Remove and replace</span>
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="bg-red-50 text-red-700 text-sm rounded-md p-2">
                                      No file uploaded for this requirement
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </ScrollArea>
                        
                        {/* Check if there are any new documents to upload */}
                        {requiredDocuments.some(req => !isDocumentSubmitted(app.id, req) && 
                           !appFile?.files?.some(file => file.requirementType === req)) && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <AlertDescription>
                              You need to upload more document(s) to complete your submission. Any missing requirements must be uploaded.
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {/* Navigation buttons */}
                        <div className="flex justify-between pt-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              // Go back to the first missing document
                              const missingIndex = requiredDocuments.findIndex(req => 
                                !isDocumentSubmitted(app.id, req) && 
                                !appFile?.files?.some(file => file.requirementType === req)
                              )
                              setCurrentStep(missingIndex >= 0 ? missingIndex : 0)
                              setUploadStage("upload")
                            }}
                          >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Edit Documents
                          </Button>
                          
                          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              onClick={() => startUpload(app.id)}
                              disabled={requiredDocuments.some(req => 
                                !isDocumentSubmitted(app.id, req) && 
                                !appFile?.files?.some(file => file.requirementType === req)
                              ) || appFile?.uploading}
                              className="bg-[#1A5EA2] hover:bg-[#154c87]"
                            >
                              {appFile?.uploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  Submit Documents
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </div>
                        
                        {/* Upload progress */}
                        <AnimatePresence>
                          {appFile?.uploading && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-[#1A5EA2]">Uploading documents...</span>
                                <span className="text-sm text-gray-600">{Math.round(appFile.progress)}%</span>
                              </div>
                              <Progress value={appFile.progress} className="h-2 bg-blue-100" />
                              
                              {appFile.error && (
                                <Alert variant="destructive" className="mt-2">
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  <AlertDescription>
                                    {appFile.error}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </CardContent>
                  
                  {uploadStage === "selection" && (
                    <CardFooter className="flex justify-center pt-1 pb-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Info className="h-4 w-4 mr-1" />
                        <span>
                          {allSubmitted ? 
                            "Document verification takes 24-48 hours." : 
                            "Upload all required documents to complete your application."}
                        </span>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Requirements Pending</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            You don't have any approved applications that need document uploads at this time.
          </p>
          <Button onClick={() => window.location.href = "/dashboard"}>
            Return to Dashboard
          </Button>
        </div>
      )}
    </div>
  )
}