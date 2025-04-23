"use client"

import type React from "react"

import { useCallback, useState, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import {
  IconCircleCheck,
  IconUpload,
  IconLoader2,
  IconAlertTriangle,
  IconDownload,
  IconFileCheck,
  IconClipboardCheck,
  IconSearch,
  IconX,
  IconTrash,
  IconExclamationCircle,
  IconInfoCircle,
  IconFileTypeCsv,
  IconBulb,
  IconAlertCircle,
  IconLetterCase,
} from "@tabler/icons-react"
import { Card } from "@/components/ui/card"
import { Edit, Trash2, CheckCircle2, FileWarning, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { createTvVouchers } from "@/actions/tv"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Template CSV data
const CSV_TEMPLATE_HEADERS = ["Card No.", "Product", "Password / Recharge Code", "Discount"]
const CSV_TEMPLATE_SAMPLE = [
  ["1234567890", "TV PACKAGE 1", "ABCD1234", "0"],
  ["0987654321", "TV PACKAGE 2", "WXYZ5678", "100"],
]

// Fixed batch size of 2 as requested
const FIXED_BATCH_SIZE = 2

const TvCreation = () => {
  const [vouchers, setVouchers] = useState<any[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({})
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false)
  const [currentEditVoucher, setCurrentEditVoucher] = useState<any>(null)
  const [currentEditIndex, setCurrentEditIndex] = useState<number>(-1)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState<boolean>(false)
  const [showGuide, setShowGuide] = useState<boolean>(true)
  const [currentStep, setCurrentStep] = useState<number>(1)

  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update current step based on the state
  useEffect(() => {
    if (vouchers.length === 0) {
      setCurrentStep(1)
    } else if (Object.keys(validationErrors).length > 0) {
      setCurrentStep(2)
    } else if (vouchers.length > 0) {
      setCurrentStep(3)
    }

    if (loading) {
      setCurrentStep(4)
    }

    if (submitted) {
      setCurrentStep(5)
    }
  }, [vouchers, validationErrors, loading, submitted])

  // Function to download CSV template
  const downloadTemplate = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    // Create CSV content
    const csvContent = [CSV_TEMPLATE_HEADERS.join(","), ...CSV_TEMPLATE_SAMPLE.map((row) => row.join(","))].join("\n")

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "tv_voucher_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded successfully.",
    })
  }

  const exportToCSV = () => {
    if (vouchers.length === 0) return

    // Create CSV content from current vouchers
    const headers = ["Card No.", "Product", "Password / Recharge Code", "Discount"]
    const rows = vouchers.map((voucher) => [
      voucher.card_number,
      voucher.product_name,
      voucher.voucher_code,
      voucher.discount,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `tv_vouchers_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Complete",
      description: `${vouchers.length} vouchers exported to CSV.`,
    })
  }

  const validateVouchers = (vouchersToValidate: any[]) => {
    const errors: { [key: string]: string[] } = {}

    vouchersToValidate.forEach((voucher, index) => {
      const voucherErrors: string[] = []

      if (!voucher.card_number) {
        voucherErrors.push("Card number is required")
      }

      if (!voucher.product_name) {
        voucherErrors.push("Product name is required")
      } else if (voucher.product_name !== voucher.product_name.toUpperCase()) {
        voucherErrors.push("Product name must be in ALL CAPS")
      }

      if (voucherErrors.length > 0) {
        errors[index] = voucherErrors
      }
    })

    return errors
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFileName(file.name)
      setUploadProgress(0)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      // Parse CSV
      Papa.parse(file, {
        header: true,
        complete: (results: any) => {
          clearInterval(progressInterval)
          setUploadProgress(100)

          const jsonData = results.data
          console.log("CSV Headers:", results.meta.fields)

          // Check for required headers
          const requiredHeaders = ["Card No.", "Product"]
          const missingHeaders = requiredHeaders.filter((header) => !results.meta.fields.includes(header))

          if (missingHeaders.length > 0) {
            toast({
              title: "Invalid CSV Format",
              description: `Missing required headers: ${missingHeaders.join(", ")}`,
              variant: "destructive",
            })
            setUploadProgress(0)
            return
          }

          // Validate and map data
          const mappedVouchers = jsonData
            .filter((voucher: any) => {
              return voucher["Product"]?.toString().trim() && voucher["Card No."]?.toString().trim()
            })
            .map((voucher: any) => ({
              product_name: voucher.Product.trim(), // Remove auto-capitalization
              card_number: voucher["Card No."].trim(),
              voucher_code: voucher["Password / Recharge Code"]?.trim() || "",
              amount: null, // Set to null by default
              account: null, // Set to null by default
              discount: Number(voucher["Discount"] || voucher["discount"] || 0),
              status: voucher.status?.trim() || "active",
              // Keep original properties for display
              Product: voucher.Product.trim(), // Remove auto-capitalization
            }))

          if (mappedVouchers.length === 0) {
            toast({
              title: "No Valid Data",
              description: "CSV contains no valid voucher entries.",
              variant: "destructive",
            })
            setUploadProgress(0)
            return
          }

          // Validate vouchers
          const validationErrors = validateVouchers(mappedVouchers)
          setValidationErrors(validationErrors)

          setVouchers(mappedVouchers)

          // Show appropriate toast notification
          if (Object.keys(validationErrors).length > 0) {
            toast({
              title: "Validation Issues",
              description: `${Object.keys(validationErrors).length} vouchers have validation issues.`,
              variant: "destructive",
            })
          } else {
            toast({
              title: "Success",
              description: `${mappedVouchers.length} vouchers uploaded successfully`,
            })
          }

          // Auto-hide guide after successful upload
          setShowGuide(false)
        },
        error: (error: any) => {
          clearInterval(progressInterval)
          setUploadProgress(0)
          console.error("Error parsing CSV:", error)
          toast({
            title: "Error",
            description: "Failed to parse CSV file",
            variant: "destructive",
          })
        },
      })
    }
  }, [])

  const handleDelete = (index: number) => {
    const updatedVouchers = [...vouchers]
    updatedVouchers.splice(index, 1)
    setVouchers(updatedVouchers)

    // Update validation errors
    const newValidationErrors = { ...validationErrors }
    delete newValidationErrors[index]

    // Reindex errors
    const reindexedErrors: { [key: string]: string[] } = {}
    Object.keys(newValidationErrors).forEach((key) => {
      const numKey = Number.parseInt(key)
      if (numKey > index) {
        reindexedErrors[numKey - 1] = newValidationErrors[key]
      } else {
        reindexedErrors[key] = newValidationErrors[key]
      }
    })

    setValidationErrors(reindexedErrors)

    // Update selected rows
    const newSelectedRows = new Set(selectedRows)
    newSelectedRows.delete(index)
    // Reindex selected rows
    const reindexedSelectedRows = new Set<number>()
    newSelectedRows.forEach((rowIndex) => {
      if (rowIndex > index) {
        reindexedSelectedRows.add(rowIndex - 1)
      } else {
        reindexedSelectedRows.add(rowIndex)
      }
    })
    setSelectedRows(reindexedSelectedRows)

    toast({
      title: "Voucher Removed",
      description: "Voucher has been removed from the list.",
    })
  }

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) return

    const sortedIndices = Array.from(selectedRows).sort((a, b) => b - a) // Sort in descending order
    const updatedVouchers = [...vouchers]

    // Remove vouchers from highest index to lowest to avoid index shifting issues
    sortedIndices.forEach((index) => {
      updatedVouchers.splice(index, 1)
    })

    setVouchers(updatedVouchers)

    // Update validation errors
    const newValidationErrors: { [key: string]: string[] } = {}
    let deletedCount = 0

    Object.entries(validationErrors).forEach(([key, value]) => {
      const keyIndex = Number.parseInt(key)
      if (!selectedRows.has(keyIndex)) {
        // Calculate new index after deletions
        let newIndex = keyIndex
        for (const deletedIndex of sortedIndices) {
          if (deletedIndex < keyIndex) {
            newIndex--
          }
        }
        newValidationErrors[newIndex] = value
      } else {
        deletedCount++
      }
    })

    setValidationErrors(newValidationErrors)
    setSelectedRows(new Set())
    setSelectAll(false)

    toast({
      title: "Vouchers Removed",
      description: `${sortedIndices.length} vouchers have been removed from the list.`,
    })
  }

  const handleBulkEdit = () => {
    if (selectedRows.size === 0) return

    // Create a dialog to edit multiple vouchers at once
    const updatedVouchers = [...vouchers]

    // Apply changes to all selected vouchers
    selectedRows.forEach((index) => {
      // Convert product names to uppercase for all selected vouchers
      updatedVouchers[index].product_name = updatedVouchers[index].product_name.toUpperCase()
      updatedVouchers[index].Product = updatedVouchers[index].Product.toUpperCase()
    })

    setVouchers(updatedVouchers)

    // Revalidate all vouchers
    const newValidationErrors = validateVouchers(updatedVouchers)
    setValidationErrors(newValidationErrors)

    toast({
      title: "Bulk Edit Complete",
      description: `${selectedRows.size} vouchers have been updated.`,
    })

    setSelectedRows(new Set())
    setSelectAll(false)
  }

  const openEditDialog = (voucher: any, index: number) => {
    setCurrentEditVoucher({ ...voucher })
    setCurrentEditIndex(index)
    setIsEditDialogOpen(true)
  }

  const saveEditedVoucher = () => {
    if (!currentEditVoucher || currentEditIndex === -1) return

    // Convert product name to uppercase
    currentEditVoucher.product_name = currentEditVoucher.product_name.toUpperCase()

    const updatedVouchers = [...vouchers]
    updatedVouchers[currentEditIndex] = currentEditVoucher
    setVouchers(updatedVouchers)

    // Validate the edited voucher
    const singleVoucherValidation = validateVouchers([currentEditVoucher])
    const newValidationErrors = { ...validationErrors }

    if (Object.keys(singleVoucherValidation).length > 0) {
      newValidationErrors[currentEditIndex] = singleVoucherValidation[0]
    } else {
      delete newValidationErrors[currentEditIndex]
    }

    setValidationErrors(newValidationErrors)
    setIsEditDialogOpen(false)

    toast({
      title: "Voucher Updated",
      description: "Voucher has been updated successfully.",
    })
  }

  const isValidVoucher = (voucher: any) =>
    voucher.card_number && voucher.product_name && voucher.product_name === voucher.product_name.toUpperCase()

  const processBatch = async (voucherBatch: any[], currentBatch: number, totalBatches: number) => {
    setProcessingStatus(`Processing batch ${currentBatch} of ${totalBatches}...`)
    setBatchProgress({ current: currentBatch, total: totalBatches })

    try {
      const result = await createTvVouchers(voucherBatch)
      return result
    } catch (error) {
      console.error(`Error processing batch ${currentBatch}:`, error)
      throw error
    }
  }

  const handleCreateVouchers = async () => {
    if (vouchers.length === 0) {
      toast({
        title: "Error",
        description: "No vouchers to create",
        variant: "destructive",
      })
      return
    }

    const validVouchers = vouchers.filter(isValidVoucher)
    if (validVouchers.length === 0) {
      toast({
        title: "Error",
        description: "No valid vouchers found",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setWarning(null)

    try {
      // Process vouchers in batches with fixed size of 2
      const batches = []
      for (let i = 0; i < validVouchers.length; i += FIXED_BATCH_SIZE) {
        batches.push(validVouchers.slice(i, i + FIXED_BATCH_SIZE))
      }

      let successCount = 0
      let duplicateCount = 0
      const warnings: string[] = []

      for (let i = 0; i < batches.length; i++) {
        const result: any = await processBatch(batches[i], i + 1, batches.length)

        if (result.success) {
          successCount += result.count

          if (result.warning) {
            warnings.push(result.warning)
            duplicateCount += result.duplicateCount || 0
          }
        } else {
          throw new Error(result.error || `Failed to process batch ${i + 1}`)
        }
      }

      setLoading(false)

      if (warnings.length > 0) {
        setWarning(`${duplicateCount} voucher(s) were skipped due to duplicate serial numbers or reference numbers.`)
        toast({
          title: "Partial Success",
          description: `Created ${successCount} vouchers. ${duplicateCount} duplicates were skipped.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "TV Vouchers Created",
          description: `Successfully created ${successCount} TV vouchers.`,
        })
      }

      setSubmitted(true)
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error) {
      setLoading(false)
      console.error("Error creating vouchers:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create TV vouchers",
        variant: "destructive",
      })
    }
  }

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set())
    } else {
      const allIndices = filteredVouchers.map((_, i) => vouchers.indexOf(_))
      setSelectedRows(new Set(allIndices))
    }
    setSelectAll(!selectAll)
  }

  const toggleRowSelection = (index: number) => {
    const newSelectedRows = new Set(selectedRows)
    if (newSelectedRows.has(index)) {
      newSelectedRows.delete(index)
    } else {
      newSelectedRows.add(index)
    }
    setSelectedRows(newSelectedRows)

    // Update selectAll state
    setSelectAll(newSelectedRows.size === vouchers.length)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    noClick: true, // Disable click to prevent conflict with our custom click handler
  })

  const allVouchersValid = vouchers.length > 0 && Object.keys(validationErrors).length === 0

  // Filter vouchers based on search term and active tab
  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch =
      searchTerm === "" ||
      voucher.card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.voucher_code.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "valid") return matchesSearch && isValidVoucher(voucher)
    if (activeTab === "invalid") return matchesSearch && !isValidVoucher(voucher)

    return matchesSearch
  })

  // Get stats for the tabs
  const validCount = vouchers.filter(isValidVoucher).length
  const invalidCount = vouchers.length - validCount

  return (
    <>
      <AnimatePresence>
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                  <IconCircleCheck className="w-12 h-12 text-green-500" />
                </div>
              </motion.div>

              <h1 className="text-3xl font-bold text-primary mb-3">TV Vouchers Created!</h1>
              <p className="mt-3 text-lg text-muted-foreground text-center">
                All TV vouchers have been successfully created and added to your inventory.
              </p>

              {warning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-200 rounded-lg shadow-sm"
                >
                  <div className="flex">
                    <IconAlertTriangle className="h-6 w-6 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-base">Warning</p>
                      <p className="text-base">{warning}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="mt-8 flex gap-3">
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => router.refresh()} size="lg">
                  Return to Voucher List
                </Button>
                <Button variant="outline" className="flex-1" onClick={exportToCSV} size="lg">
                  <IconDownload className="w-4 h-4 mr-2" />
                  Export to CSV
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div
            className={`relative ${loading || (uploadProgress > 0 && uploadProgress < 100) ? "pointer-events-none filter blur-[0.5px]" : ""}`}
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {/* Guide and Steps */}
              <Collapsible open={showGuide} onOpenChange={setShowGuide} className="mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconInfoCircle className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">TV Voucher Creation Guide</h3>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <IconX className="h-3 w-3" />
                      <span className="sr-only">Toggle</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="mt-2">
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-md border bg-muted/40 p-3"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-primary font-medium">
                        <IconBulb className="h-4 w-4" />
                        <span>Follow these steps to create TV vouchers:</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex gap-3">
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${currentStep === 1 ? "bg-primary text-white" : currentStep > 1 ? "bg-green-500 text-white" : "bg-muted-foreground/20 text-muted-foreground"}`}
                          >
                            {currentStep > 1 ? <CheckCircle2 className="h-3 w-3" /> : "1"}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Upload CSV File</p>
                            <p className="text-sm text-muted-foreground">
                              Download the template and prepare your CSV file with TV voucher data.
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                              <IconLetterCase className="h-3 w-3" />
                              <span className="font-medium">IMPORTANT: Product names must be in ALL CAPS</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${currentStep === 2 ? "bg-primary text-white" : currentStep > 2 ? "bg-green-500 text-white" : "bg-muted-foreground/20 text-muted-foreground"}`}
                          >
                            {currentStep > 2 ? <CheckCircle2 className="h-3 w-3" /> : "2"}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Verify Data</p>
                            <p className="text-sm text-muted-foreground">
                              Review and fix any validation issues in your data.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${currentStep === 3 ? "bg-primary text-white" : currentStep > 3 ? "bg-green-500 text-white" : "bg-muted-foreground/20 text-muted-foreground"}`}
                          >
                            {currentStep > 3 ? <CheckCircle2 className="h-3 w-3" /> : "3"}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Submit Vouchers</p>
                            <p className="text-sm text-muted-foreground">Create vouchers when all data is valid.</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${currentStep === 4 ? "bg-primary text-white" : currentStep > 4 ? "bg-green-500 text-white" : "bg-muted-foreground/20 text-muted-foreground"}`}
                          >
                            {currentStep > 4 ? <CheckCircle2 className="h-3 w-3" /> : "4"}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Processing</p>
                            <p className="text-sm text-muted-foreground">
                              Vouchers are processed in batches of {FIXED_BATCH_SIZE}.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${currentStep === 5 ? "bg-green-500 text-white" : "bg-muted-foreground/20 text-muted-foreground"}`}
                          >
                            {currentStep === 5 ? <CheckCircle2 className="h-3 w-3" /> : "5"}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Completion</p>
                            <p className="text-sm text-muted-foreground">
                              Vouchers are created and added to inventory.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
                        <IconAlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <div>
                          <span className="font-medium">CSV Format Requirements:</span>
                          <ul className="list-disc list-inside mt-1 ml-1 space-y-0.5">
                            <li>Card No. (required)</li>
                            <li>Product (required, must be ALL CAPS)</li>
                            <li>Password / Recharge Code (optional)</li>
                            <li>Discount (optional)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CollapsibleContent>
              </Collapsible>

              {/* Header with upload and template controls */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="csv-file" className="text-sm font-medium">
                      Upload CSV File
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={downloadTemplate} className="h-7 px-2 text-xs">
                            <IconDownload className="h-3 w-3 mr-1" />
                            Template
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          <p>Download a CSV template</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {!showGuide && (
                      <Button variant="ghost" size="sm" onClick={() => setShowGuide(true)} className="h-7 px-2 text-xs">
                        <HelpCircle className="h-3 w-3 mr-1" />
                        Guide
                      </Button>
                    )}
                  </div>

                  {vouchers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/5">
                        {vouchers.length} records
                      </Badge>
                      {Object.keys(validationErrors).length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {Object.keys(validationErrors).length} issues
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Upload area */}
                <div {...getRootProps()} className="flex items-center justify-center w-full">
                  <input {...getInputProps()} id="csv-file" className="hidden" ref={fileInputRef} />
                  <div
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 ${isDragActive
                        ? "border-primary border-dashed bg-primary/5"
                        : vouchers.length > 0
                          ? "border-green-300 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800"
                          : "border-gray-300 dark:border-gray-600"
                      } rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300`}
                  >
                    {vouchers.length > 0 ? (
                      <div className="flex flex-col items-center justify-center py-3">
                        <div className="mb-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <IconFileCheck className="w-6 h-6 text-green-500" />
                        </div>
                        <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">{fileName}</span>
                        </p>
                        <Button variant="ghost" size="sm" className="text-sm h-8 px-3 mt-1" onClick={handleUploadClick}>
                          <IconUpload className="w-3 h-3 mr-1" />
                          Upload New File
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        <motion.div
                          initial={{ scale: 0.9 }}
                          animate={{ scale: [0.9, 1.05, 1] }}
                          transition={{
                            duration: 0.5,
                            repeat: isDragActive ? Number.POSITIVE_INFINITY : 0,
                            repeatType: "reverse",
                          }}
                          className="mb-2 p-2 bg-primary/10 rounded-full"
                        >
                          <IconFileTypeCsv className="w-6 h-6 text-primary" />
                        </motion.div>
                        <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <Button
                          variant="default"
                          size="sm"
                          className="mt-2 h-8 px-4 text-sm"
                          onClick={handleUploadClick}
                        >
                          Select File
                        </Button>
                      </div>
                    )}

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full px-4 mt-2">
                        <Progress value={uploadProgress} className="h-1" />
                        <p className="text-sm text-center mt-1 text-muted-foreground">Uploading... {uploadProgress}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress steps */}
              {vouchers.length > 0 && (
                <div className="flex items-center justify-between w-full max-w-md mx-auto px-2">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full text-white text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs mt-1">Upload</span>
                  </div>

                  <div
                    className={`flex-1 h-0.5 ${Object.keys(validationErrors).length === 0 ? "bg-green-500" : "bg-yellow-500"
                      }`}
                  />

                  <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold ${Object.keys(validationErrors).length === 0 ? "bg-green-500" : "bg-yellow-500"
                        }`}
                    >
                      {Object.keys(validationErrors).length === 0 ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <IconExclamationCircle className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-xs mt-1">Verify</span>
                  </div>

                  <div className={`flex-1 h-0.5 ${loading ? "bg-primary" : "bg-gray-200"}`} />

                  <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${loading ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                        }`}
                    >
                      3
                    </div>
                    <span className="text-xs mt-1">Submit</span>
                  </div>
                </div>
              )}

              {/* Validation warnings */}
              {Object.keys(validationErrors).length > 0 && vouchers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md"
                >
                  <div className="flex items-start gap-2">
                    <FileWarning className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                        Please fix the following issues before submitting:
                      </p>
                      <ul className="text-xs text-yellow-700 dark:text-yellow-300 list-disc list-inside mt-1 space-y-0.5">
                        {Object.keys(validationErrors)
                          .slice(0, 2)
                          .map((index) => (
                            <li key={index}>
                              Row {Number.parseInt(index) + 1}: {validationErrors[index].join(", ")}
                            </li>
                          ))}
                        {Object.keys(validationErrors).length > 2 && (
                          <li>And {Object.keys(validationErrors).length - 2} more issues...</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Data table section */}
              {vouchers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <TabsList className="h-8 p-0.5">
                          <TabsTrigger value="all" className="text-xs h-7 px-2">
                            All
                            <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4">
                              {vouchers.length}
                            </Badge>
                          </TabsTrigger>
                          <TabsTrigger value="valid" className="text-xs h-7 px-2">
                            Valid
                            <Badge
                              variant="outline"
                              className={`ml-1 text-[10px] px-1 py-0 h-4 ${validCount > 0 ? "bg-green-100 text-green-800 border-green-200" : ""}`}
                            >
                              {validCount}
                            </Badge>
                          </TabsTrigger>
                          <TabsTrigger value="invalid" className="text-xs h-7 px-2">
                            Issues
                            <Badge
                              variant="outline"
                              className={`ml-1 text-[10px] px-1 py-0 h-4 ${invalidCount > 0 ? "bg-red-100 text-red-800 border-red-200" : ""}`}
                            >
                              {invalidCount}
                            </Badge>
                          </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2">
                          <div className="relative w-full">
                            <IconSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
                            <Input
                              placeholder="Search..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-7 h-8 text-sm w-[140px]"
                            />
                            {searchTerm && (
                              <button
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                                onClick={() => setSearchTerm("")}
                              >
                                <IconX className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          {vouchers.length > 0 && (
                            <Button variant="outline" size="sm" onClick={exportToCSV} className="h-8 px-3 text-sm">
                              <IconDownload className="h-3 w-3 mr-1" />
                              Export
                            </Button>
                          )}

                          {selectedRows.size > 0 && (
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={handleBulkEdit} className="h-8 px-3 text-sm">
                                <Edit className="h-3 w-3 mr-1" />
                                Bulk Edit
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteSelected}
                                className="h-8 px-3 text-sm"
                              >
                                <IconTrash className="h-3 w-3 mr-1" />
                                Delete ({selectedRows.size})
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <Card className="overflow-hidden border shadow-sm">
                        <ScrollArea className="h-[calc(80vh-280px)] min-h-[180px]">
                          <TabsContent value="all" className="m-0 p-0">
                            <Table>
                              <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10">
                                <TableRow>
                                  <TableHead className="w-[30px] text-center">
                                    <Checkbox
                                      checked={selectAll}
                                      onCheckedChange={toggleSelectAll}
                                      className="data-[state=checked]:bg-primary"
                                    />
                                  </TableHead>
                                  <TableHead className="w-[40px] text-sm">#</TableHead>
                                  <TableHead className="text-sm">Card Number</TableHead>
                                  <TableHead className="text-sm">Product</TableHead>
                                  <TableHead className="text-sm">Amount</TableHead>
                                  <TableHead className="text-sm text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredVouchers.length > 0 ? (
                                  filteredVouchers.map((voucher, index) => {
                                    const voucherIndex = vouchers.indexOf(voucher)
                                    const hasError = !!validationErrors[voucherIndex]

                                    return (
                                      <TableRow
                                        key={index}
                                        className={`text-sm ${hasError ? "bg-red-50 dark:bg-red-900/10" : ""}`}
                                      >
                                        <TableCell className="p-2 text-center">
                                          <Checkbox
                                            checked={selectedRows.has(voucherIndex)}
                                            onCheckedChange={() => toggleRowSelection(voucherIndex)}
                                            className="data-[state=checked]:bg-primary"
                                          />
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 font-medium">{voucherIndex + 1}</TableCell>
                                        <TableCell className="py-1.5 px-2">{voucher.card_number}</TableCell>
                                        <TableCell className="py-1.5 px-2">
                                          <span
                                            className={
                                              voucher.product_name !== voucher.product_name.toUpperCase()
                                                ? "text-red-500"
                                                : ""
                                            }
                                          >
                                            {voucher.product_name}
                                          </span>
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2">
                                          {voucher.amount === null ? "—" : `₱${Number(voucher.amount).toFixed(2)}`}
                                        </TableCell>
                                        <TableCell className="p-2 text-right">
                                          <div className="flex justify-end gap-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => openEditDialog(voucher, voucherIndex)}
                                              className="h-6 w-6"
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => handleDelete(voucherIndex)}
                                              className="h-6 w-6 text-red-500"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-xs">
                                      {searchTerm ? "No matching vouchers found" : "No vouchers available"}
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TabsContent>

                          <TabsContent value="valid" className="m-0 p-0">
                            <Table>
                              <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10">
                                <TableRow>
                                  <TableHead className="w-[30px] text-center">
                                    <Checkbox
                                      checked={selectAll}
                                      onCheckedChange={toggleSelectAll}
                                      className="data-[state=checked]:bg-primary"
                                    />
                                  </TableHead>
                                  <TableHead className="w-[40px] text-sm">#</TableHead>
                                  <TableHead className="text-sm">Card Number</TableHead>
                                  <TableHead className="text-sm">Product</TableHead>
                                  <TableHead className="text-sm">Amount</TableHead>
                                  <TableHead className="text-sm text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredVouchers.length > 0 ? (
                                  filteredVouchers.map((voucher, index) => {
                                    const voucherIndex = vouchers.indexOf(voucher)

                                    return (
                                      <TableRow key={index} className="text-sm">
                                        <TableCell className="p-2 text-center">
                                          <Checkbox
                                            checked={selectedRows.has(voucherIndex)}
                                            onCheckedChange={() => toggleRowSelection(voucherIndex)}
                                            className="data-[state=checked]:bg-primary"
                                          />
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 font-medium">{voucherIndex + 1}</TableCell>
                                        <TableCell className="py-1.5 px-2">{voucher.card_number}</TableCell>
                                        <TableCell className="py-1.5 px-2">{voucher.product_name}</TableCell>
                                        <TableCell className="py-1.5 px-2">
                                          {voucher.amount === null ? "—" : `₱${Number(voucher.amount).toFixed(2)}`}
                                        </TableCell>
                                        <TableCell className="p-2 text-right">
                                          <div className="flex justify-end gap-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => openEditDialog(voucher, voucherIndex)}
                                              className="h-6 w-6"
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => handleDelete(voucherIndex)}
                                              className="h-6 w-6 text-red-500"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-xs">
                                      No valid vouchers found
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TabsContent>

                          <TabsContent value="invalid" className="m-0 p-0">
                            <Table>
                              <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10">
                                <TableRow>
                                  <TableHead className="w-[30px] text-center">
                                    <Checkbox
                                      checked={selectAll}
                                      onCheckedChange={toggleSelectAll}
                                      className="data-[state=checked]:bg-primary"
                                    />
                                  </TableHead>
                                  <TableHead className="w-[40px] text-sm">#</TableHead>
                                  <TableHead className="text-sm">Card Number</TableHead>
                                  <TableHead className="text-sm">Product</TableHead>
                                  <TableHead className="text-sm">Amount</TableHead>
                                  <TableHead className="text-sm">Issues</TableHead>
                                  <TableHead className="text-sm text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredVouchers.length > 0 ? (
                                  filteredVouchers.map((voucher, index) => {
                                    const voucherIndex = vouchers.indexOf(voucher)
                                    const errors = validationErrors[voucherIndex] || []

                                    return (
                                      <TableRow key={index} className="text-sm bg-red-50 dark:bg-red-900/10">
                                        <TableCell className="p-2 text-center">
                                          <Checkbox
                                            checked={selectedRows.has(voucherIndex)}
                                            onCheckedChange={() => toggleRowSelection(voucherIndex)}
                                            className="data-[state=checked]:bg-primary"
                                          />
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 font-medium">{voucherIndex + 1}</TableCell>
                                        <TableCell className="py-1.5 px-2">{voucher.card_number || "—"}</TableCell>
                                        <TableCell className="py-1.5 px-2">
                                          <span
                                            className={
                                              voucher.product_name !== voucher.product_name.toUpperCase()
                                                ? "text-red-500"
                                                : ""
                                            }
                                          >
                                            {voucher.product_name || "—"}
                                          </span>
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2">
                                          {voucher.amount === null
                                            ? "—"
                                            : isNaN(voucher.amount)
                                              ? "Invalid"
                                              : `₱${Number(voucher.amount).toFixed(2)}`}
                                        </TableCell>
                                        <TableCell className="p-2">
                                          <ul className="text-[10px] text-red-600 list-disc list-inside">
                                            {errors.map((error, i) => (
                                              <li key={i}>{error}</li>
                                            ))}
                                          </ul>
                                        </TableCell>
                                        <TableCell className="p-2 text-right">
                                          <div className="flex justify-end gap-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => openEditDialog(voucher, voucherIndex)}
                                              className="h-6 w-6"
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => handleDelete(voucherIndex)}
                                              className="h-6 w-6 text-red-500"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-xs">
                                      No vouchers with issues found
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TabsContent>
                        </ScrollArea>
                      </Card>
                    </Tabs>
                  </div>

                  {/* Batch processing info */}
                  <div className="bg-muted/20 p-2 rounded-md">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconClipboardCheck className="h-4 w-4 text-primary" />
                      <span>Vouchers will be processed in batches of {FIXED_BATCH_SIZE} to avoid timeouts.</span>
                    </div>
                  </div>

                  {/* ALL CAPS reminder */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                      <IconLetterCase className="h-4 w-4 text-blue-500" />
                      <span>
                        <strong>REMINDER:</strong> Product names must be in ALL CAPS format.
                      </span>
                    </div>
                  </motion.div>

                  {/* Submit button */}
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 shadow-md hover:shadow-lg transition-all duration-300"
                    variant="default"
                    onClick={handleCreateVouchers}
                    disabled={!allVouchersValid || loading}
                    size="sm"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <IconLoader2 className="animate-spin h-4 w-4 mr-2" />
                        {processingStatus || "Creating TV Vouchers..."}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <IconCircleCheck className="h-4 w-4 mr-2" />
                        Create TV Vouchers
                      </div>
                    )}
                  </Button>

                  {loading && batchProgress.total > 0 && (
                    <div className="mt-3 bg-primary/5 p-3 rounded-lg border border-primary/20">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-primary">Processing batches...</span>
                        <span className="font-medium">
                          {batchProgress.current} of {batchProgress.total}
                        </span>
                      </div>
                      <Progress
                        value={(batchProgress.current / batchProgress.total) * 100}
                        className="h-2.5 bg-primary/20"
                      />
                      <p className="text-sm text-center mt-2 text-muted-foreground">
                        Estimated time remaining: {Math.max(1, batchProgress.total - batchProgress.current)} minute(s)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {(loading || (uploadProgress > 0 && uploadProgress < 100)) && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl flex flex-col items-center max-w-sm w-full">
                  <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <IconLoader2 className="animate-spin h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-center">
                    {loading ? processingStatus || "Processing vouchers..." : `Uploading... ${uploadProgress}%`}
                  </p>
                  {loading && batchProgress.total > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground mt-3 text-center">
                        Processing batch {batchProgress.current} of {batchProgress.total}
                      </p>
                      <Progress
                        value={(batchProgress.current / batchProgress.total) * 100}
                        className="h-2 mt-4 w-full"
                      />
                      <p className="text-sm text-center mt-2 text-muted-foreground">
                        Please wait while we process your vouchers
                      </p>
                    </>
                  ) : (
                    uploadProgress > 0 &&
                    uploadProgress < 100 && (
                      <>
                        <Progress value={uploadProgress} className="h-2 mt-4 w-full" />
                        <p className="text-sm text-center mt-2 text-muted-foreground">Preparing your data...</p>
                      </>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Voucher</DialogTitle>
            <DialogDescription>Make changes to the voucher information below.</DialogDescription>
          </DialogHeader>

          {currentEditVoucher && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="card_number" className="text-right">
                  Card Number
                </Label>
                <Input
                  id="card_number"
                  value={currentEditVoucher.card_number}
                  onChange={(e) => setCurrentEditVoucher({ ...currentEditVoucher, card_number: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product_name" className="text-right">
                  Product Name
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="product_name"
                    value={currentEditVoucher.product_name}
                    onChange={(e) =>
                      setCurrentEditVoucher({ ...currentEditVoucher, product_name: e.target.value.toUpperCase() })
                    }
                    className="col-span-3"
                  />
                  <p className="text-xs text-muted-foreground">Product name will be converted to ALL CAPS</p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="voucher_code" className="text-right">
                  Voucher Code
                </Label>
                <Input
                  id="voucher_code"
                  value={currentEditVoucher.voucher_code}
                  onChange={(e) => setCurrentEditVoucher({ ...currentEditVoucher, voucher_code: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={currentEditVoucher.amount === null ? "" : currentEditVoucher.amount}
                  onChange={(e) => {
                    const value = e.target.value === "" ? null : Number.parseFloat(e.target.value) || 0
                    setCurrentEditVoucher({ ...currentEditVoucher, amount: value })
                  }}
                  placeholder="Leave empty for null"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discount" className="text-right">
                  Discount
                </Label>
                <Input
                  id="discount"
                  type="number"
                  value={currentEditVoucher.discount}
                  onChange={(e) =>
                    setCurrentEditVoucher({ ...currentEditVoucher, discount: Number.parseFloat(e.target.value) || 0 })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedVoucher}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TvCreation

