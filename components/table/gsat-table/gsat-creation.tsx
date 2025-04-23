"use client"

import { useCallback, useState, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  AlertCircle,
  CheckCircle,
  Upload,
  FileType,
  Loader2,
  Edit,
  AlertTriangle,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  Download,
  Plus,
  Save,
  Info,
  Copy,
  ChevronsUpDown,
  Filter,
  ShieldAlert,
  CheckSquare,
  FileWarning,
  UploadCloud,
  Sparkles,
  History,
  Clipboard,
  ClipboardCheck,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createGsatVouchers } from "@/actions/gsat"
import { bulkCheckDuplicates, checkDuplicate, type DuplicateCheckResult } from "@/actions/gsat"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

// Types
type Voucher = {
  serial_number: string
  reference_number: string
  product_code: string
  isValid?: boolean
  validationMessage?: string
}

type ValidationSummary = {
  totalChecked: number
  valid: number
  invalid: number
  duplicateSerials: number
  duplicateReferences: number
  missingFields: number
}

type ValidationHistory = {
  timestamp: Date
  action: string
  details: string
  status: "success" | "warning" | "error"
}

const GsatCreation = () => {
  // Core state
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [validVouchers, setValidVouchers] = useState<Voucher[]>([])
  const [invalidVouchers, setInvalidVouchers] = useState<Voucher[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [currentStep, setCurrentStep] = useState<number>(1)

  // Editing state
  const [editingVoucher, setEditingVoucher] = useState<any | null>(null)
  const [editingIndex, setEditingIndex] = useState<number>(-1)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false)
  const [newVoucher, setNewVoucher] = useState<Voucher>({
    serial_number: "",
    reference_number: "",
    product_code: "",
  })

  // UI state
  const [activeTab, setActiveTab] = useState<string>("valid")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filteredValidVouchers, setFilteredValidVouchers] = useState<Voucher[]>([])
  const [filteredInvalidVouchers, setFilteredInvalidVouchers] = useState<Voucher[]>([])
  const [sortField, setSortField] = useState<string>("serial_number")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [bulkSelected, setBulkSelected] = useState<number[]>([])
  const [showStats, setShowStats] = useState<boolean>(true)
  const [productCodeFilter, setProductCodeFilter] = useState<string>("all")
  const [uniqueProductCodes, setUniqueProductCodes] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [showHistory, setShowHistory] = useState<boolean>(false)

  // Validation state
  const [duplicateCheckInProgress, setDuplicateCheckInProgress] = useState<boolean>(false)
  const [duplicates, setDuplicates] = useState<DuplicateCheckResult[]>([])
  const [showDuplicatesDialog, setShowDuplicatesDialog] = useState<boolean>(false)
  const [validationSummary, setValidationSummary] = useState<ValidationSummary>({
    totalChecked: 0,
    valid: 0,
    invalid: 0,
    duplicateSerials: 0,
    duplicateReferences: 0,
    missingFields: 0,
  })
  const [validationHistory, setValidationHistory] = useState<ValidationHistory[]>([])
  const [showValidationSheet, setShowValidationSheet] = useState<boolean>(false)

  // Settings
  const [settings, setSettings] = useState({
    autoValidate: true,
    showInvalidInMain: false,
    darkMode: false,
    compactMode: false,
    enableAnimations: true,
    batchSize: 100,
  })
  const [showSettingsDialog, setShowSettingsDialog] = useState<boolean>(false)

  // Refs
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Extract unique product codes for filtering
  useEffect(() => {
    if (vouchers.length > 0) {
      const codes = [...new Set(vouchers.map((v) => v.product_code))]
      setUniqueProductCodes(codes)
    }
  }, [vouchers])

  // Filter and sort vouchers
  useEffect(() => {
    let filteredValid = [...validVouchers]
    let filteredInvalid = [...invalidVouchers]

    // Apply product code filter
    if (productCodeFilter !== "all") {
      filteredValid = filteredValid.filter((v) => v.product_code === productCodeFilter)
      filteredInvalid = filteredInvalid.filter((v) => v.product_code === productCodeFilter)
    }

    // Apply search filter
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      filteredValid = filteredValid.filter(
        (voucher) =>
          voucher.serial_number.toLowerCase().includes(searchLower) ||
          voucher.reference_number.toLowerCase().includes(searchLower) ||
          voucher.product_code.toLowerCase().includes(searchLower),
      )
      filteredInvalid = filteredInvalid.filter(
        (voucher) =>
          voucher.serial_number.toLowerCase().includes(searchLower) ||
          voucher.reference_number.toLowerCase().includes(searchLower) ||
          voucher.product_code.toLowerCase().includes(searchLower) ||
          voucher.validationMessage?.toLowerCase().includes(searchLower),
      )
    }

    // Apply sorting
    const sortVouchers = (a: Voucher, b: Voucher) => {
      const fieldA = a[sortField as keyof Voucher]?.toString().toLowerCase() || ""
      const fieldB = b[sortField as keyof Voucher]?.toString().toLowerCase() || ""

      if (sortDirection === "asc") {
        return fieldA.localeCompare(fieldB)
      } else {
        return fieldB.localeCompare(fieldA)
      }
    }

    filteredValid.sort(sortVouchers)
    filteredInvalid.sort(sortVouchers)

    setFilteredValidVouchers(filteredValid)
    setFilteredInvalidVouchers(filteredInvalid)
  }, [searchTerm, validVouchers, invalidVouchers, sortField, sortDirection, productCodeFilter])

  // Update progress based on current step
  useEffect(() => {
    if (currentStep === 1) setProgress(33)
    else if (currentStep === 2) setProgress(66)
    else if (currentStep === 3) setProgress(100)
  }, [currentStep])

  // Add to validation history
  const addToHistory = (action: string, details: string, status: "success" | "warning" | "error") => {
    const newEntry: ValidationHistory = {
      timestamp: new Date(),
      action,
      details,
      status,
    }
    setValidationHistory((prev) => [newEntry, ...prev.slice(0, 49)]) // Keep last 50 entries
  }

  // Process and validate vouchers
  const processVouchers = (parsedVouchers: Voucher[]) => {
    // Basic validation (missing fields)
    const validatedVouchers = parsedVouchers.map((voucher) => {
      const missingFields = []
      if (!voucher.serial_number) missingFields.push("Serial Number")
      if (!voucher.reference_number) missingFields.push("Reference Number")
      if (!voucher.product_code) missingFields.push("Product Code")

      if (missingFields.length > 0) {
        return {
          ...voucher,
          isValid: false,
          validationMessage: `Missing required fields: ${missingFields.join(", ")}`,
        }
      }

      return {
        ...voucher,
        isValid: true,
      }
    })

    // Separate valid and invalid
    const valid = validatedVouchers.filter((v) => v.isValid)
    const invalid = validatedVouchers.filter((v) => !v.isValid)

    // Update validation summary
    setValidationSummary((prev) => ({
      ...prev,
      totalChecked: validatedVouchers.length,
      valid: valid.length,
      invalid: invalid.length,
      missingFields: invalid.length,
    }))

    return { valid, invalid }
  }

  // Handle file drop/upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFileName(file.name)
      setLoading(true)
      addToHistory("upload", `Uploaded file: ${file.name}`, "success")

      Papa.parse(file, {
        header: true,
        complete: async (results: any) => {
          const jsonData = results.data

          // Map the data to our voucher format
          const parsedVouchers = jsonData
            .filter((voucher: any) => voucher.serialNumber || voucher.referenceNumber || voucher.productCode)
            .map((voucher: any) => {
              return {
                serial_number: voucher.serialNumber || "",
                reference_number: voucher.referenceNumber || "",
                product_code: voucher.productCode || "",
              }
            })

          if (parsedVouchers.length === 0) {
            setLoading(false)
            toast({
              title: "Failed",
              description: "CSV table is in the wrong format or contains no valid data",
              variant: "destructive",
            })
            addToHistory("validation", "CSV format invalid or empty", "error")
            return
          }

          // First do basic validation
          const { valid, invalid } = processVouchers(parsedVouchers)

          // Then check for duplicates in valid vouchers
          setDuplicateCheckInProgress(true)
          try {
            const { duplicates, validVouchers: nonDuplicates } = await bulkCheckDuplicates(valid)

            // Mark duplicates as invalid
            const duplicateVouchers = duplicates.map((dup) => {
              const matchingVoucher = valid.find(
                (v) =>
                  (dup.field === "serial_number" && v.serial_number === dup.value) ||
                  (dup.field === "reference_number" && v.reference_number === dup.value),
              )

              if (matchingVoucher) {
                return {
                  ...matchingVoucher,
                  isValid: false,
                  validationMessage: `Duplicate ${dup.field === "serial_number" ? "Serial Number" : "Reference Number"}: ${dup.value}`,
                }
              }

              // Fallback (shouldn't happen)
              return {
                serial_number: "",
                reference_number: "",
                product_code: "",
                isValid: false,
                validationMessage: `Duplicate ${dup.field}: ${dup.value}`,
              }
            })

            // Update validation summary with duplicate counts
            const duplicateSerials = duplicates.filter((d) => d.field === "serial_number").length
            const duplicateRefs = duplicates.filter((d) => d.field === "reference_number").length

            setValidationSummary((prev) => ({
              ...prev,
              valid: nonDuplicates.length,
              invalid: prev.invalid + duplicateVouchers.length,
              duplicateSerials,
              duplicateReferences: duplicateRefs,
            }))

            if (duplicates.length > 0) {
              setDuplicates(duplicates)
              setShowDuplicatesDialog(true)
              addToHistory("validation", `Found ${duplicates.length} duplicates`, "warning")
            }

            // Update state with valid and invalid vouchers
            setValidVouchers(nonDuplicates)
            setInvalidVouchers([...invalid, ...duplicateVouchers])
            setVouchers([...nonDuplicates, ...invalid, ...duplicateVouchers])

            toast({
              title: "Validation Complete",
              description: `${nonDuplicates.length} valid vouchers, ${invalid.length + duplicateVouchers.length} invalid${duplicates.length > 0 ? ` (${duplicates.length} duplicates found)` : ""
                }`,
              variant: nonDuplicates.length > 0 ? "default" : "destructive",
            })
          } catch (error) {
            console.error("Error checking duplicates:", error)
            // Fall back to using the basic validation results
            setValidVouchers(valid)
            setInvalidVouchers(invalid)
            setVouchers([...valid, ...invalid])

            toast({
              title: "Warning",
              description: "Uploaded vouchers but couldn't check for duplicates. Please review carefully.",
              variant: "destructive",
            })
            addToHistory("validation", "Duplicate check failed", "error")
          }

          setDuplicateCheckInProgress(false)
          setLoading(false)
          setCurrentStep(2)
        },
        error: (error: any) => {
          console.error("Error parsing CSV:", error)
          setLoading(false)
          toast({
            title: "Error",
            description: "Failed to parse CSV file",
            variant: "destructive",
          })
          addToHistory("upload", "CSV parsing failed", "error")
        },
      })
    }
  }, [])

  // Fix for file upload click issue
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Handle voucher deletion
  const handleDelete = (index: number, isInvalid = false) => {
    if (isInvalid) {
      const updatedInvalid = [...invalidVouchers]
      const deletedVoucher = updatedInvalid[index]
      updatedInvalid.splice(index, 1)
      setInvalidVouchers(updatedInvalid)

      // Also remove from main vouchers array
      setVouchers(
        vouchers.filter(
          (v) =>
            v.serial_number !== deletedVoucher.serial_number || v.reference_number !== deletedVoucher.reference_number,
        ),
      )
    } else {
      const updatedValid = [...validVouchers]
      const deletedVoucher = updatedValid[index]
      updatedValid.splice(index, 1)
      setValidVouchers(updatedValid)

      // Also remove from main vouchers array
      setVouchers(
        vouchers.filter(
          (v) =>
            v.serial_number !== deletedVoucher.serial_number || v.reference_number !== deletedVoucher.reference_number,
        ),
      )
    }

    setBulkSelected(bulkSelected.filter((i) => i !== index))

    toast({
      title: "Voucher Deleted",
      description: "The voucher has been removed from the list",
    })
    addToHistory("delete", "Deleted a voucher", "success")
  }

  // Handle voucher editing
  const handleEdit = (voucher: Voucher, index: number, isInvalid = false) => {
    setEditingVoucher({ ...voucher })
    setEditingIndex(index)
    setIsEditing(true)
  }

  // Save edited voucher
  const handleSaveEdit = async () => {
    if (editingVoucher) {
      // Check for duplicates before saving
      const duplicateCheck = await checkDuplicate(editingVoucher.serial_number, editingVoucher.reference_number)

      if (duplicateCheck.isDuplicate) {
        toast({
          title: "Duplicate Found",
          description: `This ${duplicateCheck.field === "serial_number" ? "serial number" : "reference number"} already exists in the database.`,
          variant: "destructive",
        })
        addToHistory("edit", `Edit failed: duplicate ${duplicateCheck.field}`, "error")
        return
      }

      // Basic validation
      const missingFields = []
      if (!editingVoucher.serial_number) missingFields.push("Serial Number")
      if (!editingVoucher.reference_number) missingFields.push("Reference Number")
      if (!editingVoucher.product_code) missingFields.push("Product Code")

      const isValid = missingFields.length === 0
      const validationMessage = isValid ? undefined : `Missing required fields: ${missingFields.join(", ")}`

      const updatedVoucher = {
        ...editingVoucher,
        isValid,
        validationMessage,
      }

      // Update the appropriate list
      if (updatedVoucher.isValid) {
        // If it was invalid before but valid now, move it
        if (
          invalidVouchers.some(
            (v) =>
              v.serial_number === editingVoucher.serial_number &&
              v.reference_number === editingVoucher.reference_number,
          )
        ) {
          // Remove from invalid
          setInvalidVouchers(
            invalidVouchers.filter(
              (v) =>
                v.serial_number !== editingVoucher.serial_number ||
                v.reference_number !== editingVoucher.reference_number,
            ),
          )
          // Add to valid
          setValidVouchers([...validVouchers, updatedVoucher])
        } else {
          // Just update in valid list
          const updatedValid = [...validVouchers]
          updatedValid[editingIndex] = updatedVoucher
          setValidVouchers(updatedValid)
        }
      } else {
        // If it was valid before but invalid now, move it
        if (
          validVouchers.some(
            (v) =>
              v.serial_number === editingVoucher.serial_number &&
              v.reference_number === editingVoucher.reference_number,
          )
        ) {
          // Remove from valid
          setValidVouchers(
            validVouchers.filter(
              (v) =>
                v.serial_number !== editingVoucher.serial_number ||
                v.reference_number !== editingVoucher.reference_number,
            ),
          )
          // Add to invalid
          setInvalidVouchers([...invalidVouchers, updatedVoucher])
        } else {
          // Just update in invalid list
          const updatedInvalid = [...invalidVouchers]
          updatedInvalid[editingIndex] = updatedVoucher
          setInvalidVouchers(updatedInvalid)
        }
      }

      // Update main vouchers list
      setVouchers((prev) => {
        const index = prev.findIndex(
          (v) =>
            v.serial_number === editingVoucher.serial_number && v.reference_number === editingVoucher.reference_number,
        )
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = updatedVoucher
          return updated
        }
        return [...prev, updatedVoucher]
      })

      setIsEditing(false)
      setEditingVoucher(null)

      toast({
        title: "Voucher Updated",
        description: "The voucher has been successfully updated",
      })
      addToHistory("edit", "Updated a voucher", "success")
    }
  }

  // Handle adding new voucher
  const handleAddNew = () => {
    setIsAddingNew(true)
  }

  // Save new voucher
  const handleSaveNew = async () => {
    if (
      newVoucher.serial_number.trim() !== "" &&
      newVoucher.reference_number.trim() !== "" &&
      newVoucher.product_code.trim() !== ""
    ) {
      // Check for duplicates before adding
      const duplicateCheck = await checkDuplicate(newVoucher.serial_number, newVoucher.reference_number)

      if (duplicateCheck.isDuplicate) {
        toast({
          title: "Duplicate Found",
          description: `This ${duplicateCheck.field === "serial_number" ? "serial number" : "reference number"} already exists in the database.`,
          variant: "destructive",
        })
        addToHistory("add", `Add failed: duplicate ${duplicateCheck.field}`, "error")
        return
      }

      const validatedVoucher = {
        ...newVoucher,
        isValid: true,
      }

      setValidVouchers([...validVouchers, validatedVoucher])
      setVouchers([...vouchers, validatedVoucher])
      setIsAddingNew(false)
      setNewVoucher({
        serial_number: "",
        reference_number: "",
        product_code: "",
      })

      // Update validation summary
      setValidationSummary((prev) => ({
        ...prev,
        totalChecked: prev.totalChecked + 1,
        valid: prev.valid + 1,
      }))

      toast({
        title: "Voucher Added",
        description: "New voucher has been added to the list",
      })
      addToHistory("add", "Added a new voucher", "success")
    } else {
      toast({
        title: "Invalid Voucher",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
    }
  }

  // Handle bulk deletion
  const handleBulkDelete = (isInvalid = false) => {
    if (bulkSelected.length === 0) return

    if (isInvalid) {
      // Delete selected invalid vouchers
      const updatedInvalid = invalidVouchers.filter((_, index) => !bulkSelected.includes(index))
      setInvalidVouchers(updatedInvalid)

      // Update main vouchers list
      const toDelete = bulkSelected.map((index) => invalidVouchers[index])
      setVouchers(
        vouchers.filter(
          (v) =>
            !toDelete.some((d) => d.serial_number === v.serial_number && d.reference_number === v.reference_number),
        ),
      )
    } else {
      // Delete selected valid vouchers
      const updatedValid = validVouchers.filter((_, index) => !bulkSelected.includes(index))
      setValidVouchers(updatedValid)

      // Update main vouchers list
      const toDelete = bulkSelected.map((index) => validVouchers[index])
      setVouchers(
        vouchers.filter(
          (v) =>
            !toDelete.some((d) => d.serial_number === v.serial_number && d.reference_number === v.reference_number),
        ),
      )
    }

    // Update validation summary
    setValidationSummary((prev) => ({
      ...prev,
      totalChecked: prev.totalChecked - bulkSelected.length,
      [isInvalid ? "invalid" : "valid"]: prev[isInvalid ? "invalid" : "valid"] - bulkSelected.length,
    }))

    setBulkSelected([])

    toast({
      title: "Bulk Delete Successful",
      description: `${bulkSelected.length} vouchers have been deleted`,
    })
    addToHistory("delete", `Bulk deleted ${bulkSelected.length} vouchers`, "success")
  }

  // Toggle bulk selection
  const toggleBulkSelect = (index: number) => {
    if (bulkSelected.includes(index)) {
      setBulkSelected(bulkSelected.filter((i) => i !== index))
    } else {
      setBulkSelected([...bulkSelected, index])
    }
  }

  // Select all vouchers
  const selectAll = (isInvalid = false) => {
    const vouchersToSelect = isInvalid ? filteredInvalidVouchers : filteredValidVouchers

    if (bulkSelected.length === vouchersToSelect.length) {
      setBulkSelected([])
    } else {
      setBulkSelected(vouchersToSelect.map((_, index) => index))
    }
  }

  // Move invalid to valid (fix)
  const moveToValid = (index: number) => {
    const voucherToMove = invalidVouchers[index]

    // Remove validation error
    const fixedVoucher = {
      ...voucherToMove,
      isValid: true,
      validationMessage: undefined,
    }

    // Add to valid list
    setValidVouchers([...validVouchers, fixedVoucher])

    // Remove from invalid list
    const updatedInvalid = [...invalidVouchers]
    updatedInvalid.splice(index, 1)
    setInvalidVouchers(updatedInvalid)

    // Update in main vouchers list
    setVouchers((prev) => {
      const vIndex = prev.findIndex(
        (v) => v.serial_number === voucherToMove.serial_number && v.reference_number === voucherToMove.reference_number,
      )
      if (vIndex >= 0) {
        const updated = [...prev]
        updated[vIndex] = fixedVoucher
        return updated
      }
      return prev
    })

    // Update validation summary
    setValidationSummary((prev) => ({
      ...prev,
      valid: prev.valid + 1,
      invalid: prev.invalid - 1,
    }))

    toast({
      title: "Voucher Validated",
      description: "The voucher has been moved to the valid list",
    })
    addToHistory("validate", "Manually validated a voucher", "success")
  }

  // Create vouchers
  const handleCreateVouchers = async () => {
    if (validVouchers.length === 0) {
      toast({
        title: "No Valid Vouchers",
        description: "There are no valid vouchers to create",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setWarning(null)
    setCurrentStep(3)
    addToHistory("create", `Creating ${validVouchers.length} vouchers`, "success")

    try {
      // Modified vouchers with null amount and discount
      const modifiedVouchers = validVouchers.map((voucher) => ({
        ...voucher,
        amount: null,
        discount: null,
      }))

      const result = await createGsatVouchers(modifiedVouchers)

      if (result.success) {
        setLoading(false)
        if (result.warning) {
          setWarning(result.warning)
          toast({
            title: "Partial Success",
            description: result.warning,
            variant: "destructive",
          })
          addToHistory("create", `Partial success: ${result.warning}`, "warning")
        } else {
          toast({
            title: "GSAT Vouchers Created",
            description: `Successfully created ${result.count} GSAT vouchers.`,
          })
          addToHistory("create", `Created ${result.count} vouchers successfully`, "success")
        }
        setSubmitted(true)
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        throw new Error(result.error || "Failed to create GSAT vouchers")
      }
    } catch (error) {
      setLoading(false)
      setCurrentStep(2)
      console.error("Error creating vouchers:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create GSAT vouchers",
        variant: "destructive",
      })
      addToHistory("create", `Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error")
    }
  }

  // Reset the form
  const handleReset = () => {
    setVouchers([])
    setValidVouchers([])
    setInvalidVouchers([])
    setFileName("")
    setCurrentStep(1)
    setProgress(33)
    setWarning(null)
    setSubmitted(false)
    setBulkSelected([])
    setDuplicates([])
    setValidationSummary({
      totalChecked: 0,
      valid: 0,
      invalid: 0,
      duplicateSerials: 0,
      duplicateReferences: 0,
      missingFields: 0,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    addToHistory("reset", "Reset the form", "success")
  }

  // Download template
  const downloadTemplate = () => {
    const csvContent = "serialNumber,referenceNumber,productCode\n"
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "gsat_voucher_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addToHistory("download", "Downloaded template", "success")
  }

  // Export to CSV
  const exportToCSV = (type: "all" | "valid" | "invalid" = "all") => {
    const headers = "serialNumber,referenceNumber,productCode,isValid,validationMessage\n"

    let dataToExport = []
    if (type === "all") dataToExport = vouchers
    else if (type === "valid") dataToExport = validVouchers
    else dataToExport = invalidVouchers

    const csvData = dataToExport
      .map(
        (v) =>
          `${v.serial_number},${v.reference_number},${v.product_code},${v.isValid !== false},${v.validationMessage || ""}`,
      )
      .join("\n")

    const csvContent = headers + csvData
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `gsat_vouchers_${type}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: `${dataToExport.length} vouchers exported to CSV`,
    })
    addToHistory("export", `Exported ${dataToExport.length} ${type} vouchers to CSV`, "success")
  }

  // Generate random vouchers
  const generateRandomVouchers = async (count: number) => {
    const newVouchers: any = []

    for (let i = 0; i < count; i++) {
      const randomSerial = `SN-${Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0")}`
      const randomRef = `REF-${Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0")}`
      const productCodes = ["GSAT-BASIC", "GSAT-PRO", "GSAT-PREMIUM"]
      const randomProduct = productCodes[Math.floor(Math.random() * productCodes.length)]

      newVouchers.push({
        serial_number: randomSerial,
        reference_number: randomRef,
        product_code: randomProduct,
      })
    }

    // Check for duplicates before adding
    setDuplicateCheckInProgress(true)
    try {
      const { duplicates, validVouchers: nonDuplicates } = await bulkCheckDuplicates(newVouchers)

      // Mark duplicates as invalid
      const duplicateVouchers = duplicates.map((dup) => {
        const matchingVoucher = newVouchers.find(
          (v: any) =>
            (dup.field === "serial_number" && v.serial_number === dup.value) ||
            (dup.field === "reference_number" && v.reference_number === dup.value),
        )

        if (matchingVoucher) {
          return {
            ...matchingVoucher,
            isValid: false,
            validationMessage: `Duplicate ${dup.field === "serial_number" ? "Serial Number" : "Reference Number"}: ${dup.value}`,
          }
        }

        // Fallback (shouldn't happen)
        return {
          serial_number: "",
          reference_number: "",
          product_code: "",
          isValid: false,
          validationMessage: `Duplicate ${dup.field}: ${dup.value}`,
        }
      })

      if (duplicates.length > 0) {
        setDuplicates(duplicates)
        setShowDuplicatesDialog(true)
      }

      // Add valid vouchers
      setValidVouchers([...validVouchers, ...nonDuplicates])

      // Add invalid vouchers
      if (duplicateVouchers.length > 0) {
        setInvalidVouchers([...invalidVouchers, ...duplicateVouchers])
      }

      // Update main vouchers list
      setVouchers([...vouchers, ...nonDuplicates, ...duplicateVouchers])

      // Update validation summary
      setValidationSummary((prev) => ({
        ...prev,
        totalChecked: prev.totalChecked + newVouchers.length,
        valid: prev.valid + nonDuplicates.length,
        invalid: prev.invalid + duplicateVouchers.length,
        duplicateSerials: prev.duplicateSerials + duplicates.filter((d) => d.field === "serial_number").length,
        duplicateReferences: prev.duplicateReferences + duplicates.filter((d) => d.field === "reference_number").length,
      }))

      toast({
        title: "Sample Data Generated",
        description: `${nonDuplicates.length} valid sample vouchers added${duplicates.length > 0 ? ` (${duplicates.length} duplicates found)` : ""
          }`,
      })
      addToHistory("generate", `Generated ${count} sample vouchers`, "success")
    } catch (error) {
      console.error("Error checking duplicates:", error)
      // Fall back to using all generated vouchers as valid
      const validatedVouchers = newVouchers.map((v: any) => ({ ...v, isValid: true }))
      setValidVouchers([...validVouchers, ...validatedVouchers])
      setVouchers([...vouchers, ...validatedVouchers])

      // Update validation summary
      setValidationSummary((prev) => ({
        ...prev,
        totalChecked: prev.totalChecked + newVouchers.length,
        valid: prev.valid + newVouchers.length,
      }))

      toast({
        title: "Sample Data Generated",
        description: `${count} sample vouchers have been added (duplicate check failed)`,
      })
      addToHistory("generate", `Generated ${count} sample vouchers (duplicate check failed)`, "warning")
    }

    setDuplicateCheckInProgress(false)

    if (currentStep === 1) {
      setCurrentStep(2)
    }
  }

  // Fix all fixable invalid vouchers
  const fixAllInvalid = () => {
    // Only fix vouchers with missing fields that we can auto-populate
    const fixableVouchers = invalidVouchers.filter((v) => v.validationMessage?.includes("Missing required fields"))

    if (fixableVouchers.length === 0) {
      toast({
        title: "No Fixable Vouchers",
        description: "There are no vouchers that can be automatically fixed",
        variant: "destructive",
      })
      return
    }

    // Fix each voucher
    const fixed = fixableVouchers.map((v) => {
      const fixed = { ...v, isValid: true }
      if (!fixed.serial_number) fixed.serial_number = `SN-${Math.random().toString(36).substring(2, 10)}`
      if (!fixed.reference_number) fixed.reference_number = `REF-${Math.random().toString(36).substring(2, 10)}`
      if (!fixed.product_code) fixed.product_code = "GSAT-BASIC"
      return fixed
    })

    // Move fixed vouchers to valid list
    setValidVouchers([...validVouchers, ...fixed])

    // Remove fixed vouchers from invalid list
    const remainingInvalid = invalidVouchers.filter(
      (v) =>
        !fixableVouchers.some((f) => f.serial_number === v.serial_number && f.reference_number === v.reference_number),
    )
    setInvalidVouchers(remainingInvalid)

    // Update main vouchers list
    setVouchers((prev) => {
      const updated = [...prev]
      fixableVouchers.forEach((v) => {
        const index = updated.findIndex(
          (u) => u.serial_number === v.serial_number && u.reference_number === v.reference_number,
        )
        if (index >= 0) {
          const fixedVoucher = fixed.find(
            (f) => f.serial_number === v.serial_number && f.reference_number === v.reference_number,
          )
          if (fixedVoucher) {
            updated[index] = fixedVoucher
          }
        }
      })
      return updated
    })

    // Update validation summary
    setValidationSummary((prev) => ({
      ...prev,
      valid: prev.valid + fixed.length,
      invalid: prev.invalid - fixed.length,
      missingFields: prev.missingFields - fixed.length,
    }))

    toast({
      title: "Auto-Fix Complete",
      description: `Fixed ${fixed.length} vouchers with missing fields`,
    })
    addToHistory("fix", `Auto-fixed ${fixed.length} vouchers`, "success")
  }

  // Copy vouchers to clipboard
  const copyToClipboard = (type: "all" | "valid" | "invalid" = "valid") => {
    let dataToExport = []
    if (type === "all") dataToExport = vouchers
    else if (type === "valid") dataToExport = validVouchers
    else dataToExport = invalidVouchers

    const text = dataToExport
      .map((v) => `Serial: ${v.serial_number}, Ref: ${v.reference_number}, Product: ${v.product_code}`)
      .join("\n")

    navigator.clipboard.writeText(text)

    toast({
      title: "Copied to Clipboard",
      description: `${dataToExport.length} vouchers copied to clipboard`,
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    noClick: true, // Disable click handling in useDropzone
  })

  const isValidVoucher = (voucher: Voucher) => voucher.serial_number && voucher.reference_number && voucher.product_code

  const allVouchersValid = validVouchers.length > 0 && validVouchers.every(isValidVoucher)

  // Render validation summary card
  const renderValidationSummary = () => (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Validation Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Total Vouchers</span>
            <span className="text-2xl font-bold">{validationSummary.totalChecked}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Valid</span>
            <span className="text-2xl font-bold text-green-500">{validationSummary.valid}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Invalid</span>
            <span className="text-2xl font-bold text-red-500">{validationSummary.invalid}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Duplicate Serials</span>
            <span className="text-lg font-medium text-amber-500">{validationSummary.duplicateSerials}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Duplicate References</span>
            <span className="text-lg font-medium text-amber-500">{validationSummary.duplicateReferences}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Missing Fields</span>
            <span className="text-lg font-medium text-amber-500">{validationSummary.missingFields}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Render validation history
  const renderValidationHistory = () => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] p-4">
          {validationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {validationHistory.map((entry, index) => (
                <div key={index} className="flex gap-3 text-sm">
                  <div className="flex-shrink-0 mt-0.5">
                    {entry.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {entry.status === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    {entry.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{entry.action}</div>
                    <div className="text-muted-foreground">{entry.details}</div>
                    <div className="text-xs text-muted-foreground mt-1">{entry.timestamp.toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )

  return (
    <MotionConfig transition={{ duration: settings.enableAnimations ? 0.3 : 0 }}>
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            className="flex flex-col items-center justify-center h-96"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-20 h-20 text-green-500 mb-5" />
            </motion.div>
            <h1 className="text-3xl font-bold text-primary">Vouchers Created!</h1>
            <p className="mt-2 text-lg text-muted-foreground">All vouchers have been successfully created.</p>
            {warning && (
              <motion.div
                className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <p className="font-bold">Warning</p>
                </div>
                <p>{warning}</p>
              </motion.div>
            )}
            <motion.div
              className="mt-8 flex gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button onClick={handleReset} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Create More Vouchers
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin-dashboard/vouchers/gsat")}>
                Go to Dashboard
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            className={`relative ${loading ? "pointer-events-none" : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full border-none shadow-none">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-3xl font-bold">GSAT Voucher Management</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Create and manage GSAT vouchers by uploading a CSV file or adding them manually.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{showStats ? "Hide" : "Show"} Statistics</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                            <History className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{showHistory ? "Hide" : "Show"} Activity Log</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setShowSettingsDialog(true)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Settings</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Actions <ChevronsUpDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Voucher Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={handleReset}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset All
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Download className="h-4 w-4 mr-2" />
                              Export to CSV
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => exportToCSV("all")} disabled={vouchers.length === 0}>
                                  All Vouchers
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => exportToCSV("valid")}
                                  disabled={validVouchers.length === 0}
                                >
                                  Valid Vouchers Only
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => exportToCSV("invalid")}
                                  disabled={invalidVouchers.length === 0}
                                >
                                  Invalid Vouchers Only
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuItem onClick={downloadTemplate}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Download Template
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => generateRandomVouchers(5)}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate 5 Sample Vouchers
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => generateRandomVouchers(20)}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate 20 Sample Vouchers
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => setShowValidationSheet(true)}>
                            <ShieldAlert className="h-4 w-4 mr-2" />
                            Validation Details
                          </DropdownMenuItem>
                          {invalidVouchers.length > 0 && (
                            <DropdownMenuItem onClick={fixAllInvalid}>
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Auto-Fix Invalid Vouchers
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-8">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant={currentStep >= 1 ? "default" : "outline"}>Step 1</Badge>
                        <span className="font-medium">Upload or Add Vouchers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={currentStep >= 2 ? "default" : "outline"}>Step 2</Badge>
                        <span className="font-medium">Review & Validate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={currentStep >= 3 ? "default" : "outline"}>Step 3</Badge>
                        <span className="font-medium">Create Vouchers</span>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>

                {/* Validation Summary */}
                {showStats && validationSummary.totalChecked > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6"
                  >
                    {renderValidationSummary()}
                  </motion.div>
                )}

                {/* Activity Log */}
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6"
                  >
                    {renderValidationHistory()}
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="grid md:grid-cols-2 gap-6"
                  >
                    <motion.div variants={itemVariants}>
                      <Card className="border-2 border-dashed h-full">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <UploadCloud className="h-5 w-5 text-primary" />
                            Upload CSV File
                          </CardTitle>
                          <CardDescription>
                            Upload a CSV file with serial numbers, reference numbers, and product codes
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div {...getRootProps()} className="flex items-center justify-center w-full">
                            <input {...getInputProps()} id="csv-file" ref={fileInputRef} className="hidden" />
                            <label
                              className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragActive
                                ? "border-primary bg-primary/5"
                                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"
                                }`}
                              onClick={handleUploadClick}
                            >
                              {fileName ? (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <FileSpreadsheet className="w-12 h-12 text-primary mb-2" />
                                  <p className="text-sm font-medium">{fileName}</p>
                                  <p className="text-xs text-muted-foreground mt-1">Click to upload a different file</p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                                  <p className="text-sm font-medium">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">CSV file up to 10MB</p>
                                </div>
                              )}
                            </label>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadTemplate}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download Template
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateRandomVouchers(5)}
                            className="flex items-center gap-2"
                          >
                            <Sparkles className="h-4 w-4" />
                            Generate Sample Data
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Card className="border-2 border-dashed h-full">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            Add Manually
                          </CardTitle>
                          <CardDescription>Create a new voucher by entering the details manually</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid gap-2">
                              <Label htmlFor="serial_number">Serial Number</Label>
                              <Input
                                id="serial_number"
                                value={newVoucher.serial_number}
                                onChange={(e) => setNewVoucher({ ...newVoucher, serial_number: e.target.value })}
                                placeholder="Enter serial number"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="reference_number">Reference Number</Label>
                              <Input
                                id="reference_number"
                                value={newVoucher.reference_number}
                                onChange={(e) => setNewVoucher({ ...newVoucher, reference_number: e.target.value })}
                                placeholder="Enter reference number"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="product_code">Product Code</Label>
                              <Input
                                id="product_code"
                                value={newVoucher.product_code}
                                onChange={(e) => setNewVoucher({ ...newVoucher, product_code: e.target.value })}
                                placeholder="Enter product code"
                              />
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            onClick={handleSaveNew}
                            className="w-full flex items-center gap-2"
                            disabled={
                              !newVoucher.serial_number || !newVoucher.reference_number || !newVoucher.product_code
                            }
                          >
                            <Plus className="h-4 w-4" />
                            Add Voucher
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                  >
                    <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <FileType className="h-5 w-5 text-primary" />
                        <span className="font-medium">
                          {validVouchers.length} valid, {invalidVouchers.length} invalid vouchers
                        </span>
                        {bulkSelected.length > 0 && <Badge variant="secondary">{bulkSelected.length} selected</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Search vouchers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64"
                          />

                          <Select value={productCodeFilter} onValueChange={setProductCodeFilter}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by product" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Products</SelectItem>
                              {uniqueProductCodes.map((code) => (
                                <SelectItem key={code} value={code}>
                                  {code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Filter className="h-4 w-4 mr-2" />
                              Sort
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSortField("serial_number")
                                setSortDirection("asc")
                              }}
                            >
                              Serial Number (A-Z)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSortField("serial_number")
                                setSortDirection("desc")
                              }}
                            >
                              Serial Number (Z-A)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSortField("reference_number")
                                setSortDirection("asc")
                              }}
                            >
                              Reference Number (A-Z)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSortField("reference_number")
                                setSortDirection("desc")
                              }}
                            >
                              Reference Number (Z-A)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSortField("product_code")
                                setSortDirection("asc")
                              }}
                            >
                              Product Code (A-Z)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSortField("product_code")
                                setSortDirection("desc")
                              }}
                            >
                              Product Code (Z-A)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Reset
                        </Button>
                        <Button variant="outline" onClick={handleAddNew} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add New
                        </Button>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setViewMode(viewMode === "cards" ? "table" : "cards")}
                              >
                                {viewMode === "cards" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Switch to {viewMode === "cards" ? "Table" : "Card"} View</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="valid" className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Valid Vouchers ({validVouchers.length})
                          </TabsTrigger>
                          <TabsTrigger value="invalid" className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Invalid Vouchers ({invalidVouchers.length})
                          </TabsTrigger>
                        </TabsList>

                        {/* Valid Vouchers Tab */}
                        <TabsContent value="valid" className="mt-4">
                          {bulkSelected.length > 0 && (
                            <div className="flex justify-end mb-4">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleBulkDelete(false)}
                                className="flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Selected ({bulkSelected.length})
                              </Button>
                            </div>
                          )}

                          {viewMode === "cards" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-1">
                              <AnimatePresence>
                                {filteredValidVouchers.length === 0 ? (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="col-span-full flex flex-col items-center justify-center py-12 text-center"
                                  >
                                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium">No valid vouchers found</h3>
                                    <p className="text-muted-foreground mt-2">Try adjusting your search or filters</p>
                                  </motion.div>
                                ) : (
                                  filteredValidVouchers.map((voucher, index) => (
                                    <motion.div
                                      key={`${voucher.serial_number}-${index}`}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.9 }}
                                      transition={{ duration: 0.2 }}
                                      layout
                                    >
                                      <Card
                                        className={`h-full ${bulkSelected.includes(index) ? "border-primary border-2" : ""}`}
                                      >
                                        <CardContent className="p-6">
                                          <div className="flex justify-between items-start mb-4">
                                            <input
                                              type="checkbox"
                                              checked={bulkSelected.includes(index)}
                                              onChange={() => toggleBulkSelect(index)}
                                              className="h-4 w-4"
                                            />
                                            <Badge variant="outline" className="bg-green-50">
                                              {voucher.product_code}
                                            </Badge>
                                          </div>
                                          <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                  Serial Number
                                                </h3>
                                                <p className="text-base font-semibold">{voucher.serial_number}</p>
                                              </div>
                                              <div className="text-right">
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                  Reference Number
                                                </h3>
                                                <p className="text-base font-semibold">{voucher.reference_number}</p>
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-end space-x-2 p-6 pt-0">
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(
                                                      `Serial: ${voucher.serial_number}, Ref: ${voucher.reference_number}, Product: ${voucher.product_code}`,
                                                    )
                                                    toast({
                                                      title: "Copied to clipboard",
                                                      description: "Voucher details copied to clipboard",
                                                    })
                                                  }}
                                                >
                                                  <Copy className="w-4 h-4" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>Copy details</TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(voucher, index, false)}
                                            className="flex items-center gap-1"
                                          >
                                            <Edit className="w-3 h-3" />
                                            Edit
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(index, false)}
                                            className="text-destructive flex items-center gap-1"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                          </Button>
                                        </CardFooter>
                                      </Card>
                                    </motion.div>
                                  ))
                                )}
                              </AnimatePresence>
                            </div>
                          ) : (
                            <div className="rounded-md border max-h-[50vh] overflow-y-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[50px]">
                                      <input
                                        type="checkbox"
                                        checked={
                                          bulkSelected.length === filteredValidVouchers.length &&
                                          filteredValidVouchers.length > 0
                                        }
                                        onChange={() => selectAll(false)}
                                        className="h-4 w-4"
                                      />
                                    </TableHead>
                                    <TableHead>Serial Number</TableHead>
                                    <TableHead>Reference Number</TableHead>
                                    <TableHead>Product Code</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredValidVouchers.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                        No valid vouchers found
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    filteredValidVouchers.map((voucher, index) => (
                                      <TableRow
                                        key={`table-${voucher.serial_number}-${index}`}
                                        className={bulkSelected.includes(index) ? "bg-muted/30" : ""}
                                      >
                                        <TableCell>
                                          <input
                                            type="checkbox"
                                            checked={bulkSelected.includes(index)}
                                            onChange={() => toggleBulkSelect(index)}
                                            className="h-4 w-4"
                                          />
                                        </TableCell>
                                        <TableCell className="font-medium">{voucher.serial_number}</TableCell>
                                        <TableCell>{voucher.reference_number}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="bg-green-50">
                                            {voucher.product_code}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex justify-end gap-2">
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                      navigator.clipboard.writeText(
                                                        `Serial: ${voucher.serial_number}, Ref: ${voucher.reference_number}, Product: ${voucher.product_code}`,
                                                      )
                                                      toast({
                                                        title: "Copied to clipboard",
                                                        description: "Voucher details copied to clipboard",
                                                      })
                                                    }}
                                                    className="h-8 w-8 p-0"
                                                  >
                                                    <Copy className="h-4 w-4" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Copy details</TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleEdit(voucher, index, false)}
                                              className="h-8 w-8 p-0"
                                            >
                                              <Edit className="h-4 w-4" />
                                              <span className="sr-only">Edit</span>
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDelete(index, false)}
                                              className="h-8 w-8 p-0 text-destructive"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                              <span className="sr-only">Delete</span>
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </TabsContent>

                        {/* Invalid Vouchers Tab */}
                        <TabsContent value="invalid" className="mt-4">
                          {invalidVouchers.length > 0 && (
                            <div className="flex justify-between mb-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={fixAllInvalid}
                                className="flex items-center gap-2"
                              >
                                <CheckSquare className="h-4 w-4" />
                                Auto-Fix Invalid Vouchers
                              </Button>

                              {bulkSelected.length > 0 && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleBulkDelete(true)}
                                  className="flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Selected ({bulkSelected.length})
                                </Button>
                              )}
                            </div>
                          )}

                          {viewMode === "cards" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-1">
                              <AnimatePresence>
                                {filteredInvalidVouchers.length === 0 ? (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="col-span-full flex flex-col items-center justify-center py-12 text-center"
                                  >
                                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                                    <h3 className="text-lg font-medium">No invalid vouchers found</h3>
                                    <p className="text-muted-foreground mt-2">All your vouchers are valid!</p>
                                  </motion.div>
                                ) : (
                                  filteredInvalidVouchers.map((voucher, index) => (
                                    <motion.div
                                      key={`invalid-${voucher.serial_number || "unknown"}-${index}`}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.9 }}
                                      transition={{ duration: 0.2 }}
                                      layout
                                    >
                                      <Card
                                        className={`h-full border-red-200 ${bulkSelected.includes(index) ? "border-primary border-2" : ""}`}
                                      >
                                        <CardContent className="p-6">
                                          <div className="flex justify-between items-start mb-4">
                                            <input
                                              type="checkbox"
                                              checked={bulkSelected.includes(index)}
                                              onChange={() => toggleBulkSelect(index)}
                                              className="h-4 w-4"
                                            />
                                            <Badge variant="outline" className="bg-red-50">
                                              {voucher.product_code || "Unknown"}
                                            </Badge>
                                          </div>
                                          <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                  Serial Number
                                                </h3>
                                                <p className="text-base font-semibold">
                                                  {voucher.serial_number || "Missing"}
                                                </p>
                                              </div>
                                              <div className="text-right">
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                  Reference Number
                                                </h3>
                                                <p className="text-base font-semibold">
                                                  {voucher.reference_number || "Missing"}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="pt-2 border-t border-dashed border-red-200">
                                              <h3 className="text-sm font-medium text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Error
                                              </h3>
                                              <p className="text-sm text-red-500">
                                                {voucher.validationMessage || "Unknown error"}
                                              </p>
                                            </div>
                                          </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-end space-x-2 p-6 pt-0">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => moveToValid(index)}
                                            className="flex items-center gap-1 text-green-600"
                                          >
                                            <CheckSquare className="w-3 h-3" />
                                            Fix
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(voucher, index, true)}
                                            className="flex items-center gap-1"
                                          >
                                            <Edit className="w-3 h-3" />
                                            Edit
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(index, true)}
                                            className="text-destructive flex items-center gap-1"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                          </Button>
                                        </CardFooter>
                                      </Card>
                                    </motion.div>
                                  ))
                                )}
                              </AnimatePresence>
                            </div>
                          ) : (
                            <div className="rounded-md border max-h-[50vh] overflow-y-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[50px]">
                                      <input
                                        type="checkbox"
                                        checked={
                                          bulkSelected.length === filteredInvalidVouchers.length &&
                                          filteredInvalidVouchers.length > 0
                                        }
                                        onChange={() => selectAll(true)}
                                        className="h-4 w-4"
                                      />
                                    </TableHead>
                                    <TableHead>Serial Number</TableHead>
                                    <TableHead>Reference Number</TableHead>
                                    <TableHead>Product Code</TableHead>
                                    <TableHead>Error</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredInvalidVouchers.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                        No invalid vouchers found
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    filteredInvalidVouchers.map((voucher, index) => (
                                      <TableRow
                                        key={`table-invalid-${voucher.serial_number || "unknown"}-${index}`}
                                        className={`${bulkSelected.includes(index) ? "bg-muted/30" : ""} bg-red-50/30`}
                                      >
                                        <TableCell>
                                          <input
                                            type="checkbox"
                                            checked={bulkSelected.includes(index)}
                                            onChange={() => toggleBulkSelect(index)}
                                            className="h-4 w-4"
                                          />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          {voucher.serial_number || "Missing"}
                                        </TableCell>
                                        <TableCell>{voucher.reference_number || "Missing"}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="bg-red-50">
                                            {voucher.product_code || "Unknown"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-red-500 text-sm">
                                          {voucher.validationMessage || "Unknown error"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex justify-end gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => moveToValid(index)}
                                              className="h-8 w-8 p-0 text-green-600"
                                            >
                                              <CheckSquare className="h-4 w-4" />
                                              <span className="sr-only">Fix</span>
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleEdit(voucher, index, true)}
                                              className="h-8 w-8 p-0"
                                            >
                                              <Edit className="h-4 w-4" />
                                              <span className="sr-only">Edit</span>
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDelete(index, true)}
                                              className="h-8 w-8 p-0 text-destructive"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                              <span className="sr-only">Delete</span>
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex justify-end mt-6">
                      <Button
                        onClick={handleCreateVouchers}
                        disabled={!allVouchersValid || validVouchers.length === 0 || loading}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Create {validVouchers.length} Vouchers
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Edit Voucher Dialog */}
            <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Voucher</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-serial">Serial Number</Label>
                    <Input
                      id="edit-serial"
                      value={editingVoucher?.serial_number || ""}
                      onChange={(e) => setEditingVoucher({ ...editingVoucher, serial_number: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-reference">Reference Number</Label>
                    <Input
                      id="edit-reference"
                      value={editingVoucher?.reference_number || ""}
                      onChange={(e) => setEditingVoucher({ ...editingVoucher, reference_number: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-product">Product Code</Label>
                    <Input
                      id="edit-product"
                      value={editingVoucher?.product_code || ""}
                      onChange={(e) => setEditingVoucher({ ...editingVoucher, product_code: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add New Voucher Dialog */}
            <Dialog open={isAddingNew} onOpenChange={(open) => !open && setIsAddingNew(false)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Voucher</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-serial">Serial Number</Label>
                    <Input
                      id="new-serial"
                      value={newVoucher.serial_number}
                      onChange={(e) => setNewVoucher({ ...newVoucher, serial_number: e.target.value })}
                      placeholder="Enter serial number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-reference">Reference Number</Label>
                    <Input
                      id="new-reference"
                      value={newVoucher.reference_number}
                      onChange={(e) => setNewVoucher({ ...newVoucher, reference_number: e.target.value })}
                      placeholder="Enter reference number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-product">Product Code</Label>
                    <Input
                      id="new-product"
                      value={newVoucher.product_code}
                      onChange={(e) => setNewVoucher({ ...newVoucher, product_code: e.target.value })}
                      placeholder="Enter product code"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveNew}
                    disabled={!newVoucher.serial_number || !newVoucher.reference_number || !newVoucher.product_code}
                  >
                    Add Voucher
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Duplicates Dialog */}
            <Dialog open={showDuplicatesDialog} onOpenChange={(open) => !open && setShowDuplicatesDialog(false)}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                    Duplicate Entries Found
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="mb-4">
                    The following entries were found to be duplicates and have been moved to the invalid vouchers tab:
                  </p>
                  <div className="max-h-[300px] overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Field</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {duplicates.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-4">
                              No duplicates found
                            </TableCell>
                          </TableRow>
                        ) : (
                          duplicates.map((duplicate, index) => (
                            <TableRow key={`duplicate-${index}`}>
                              <TableCell>
                                {duplicate.field === "serial_number" ? "Serial Number" : "Reference Number"}
                              </TableCell>
                              <TableCell>{duplicate.value}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowDuplicatesDialog(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={showSettingsDialog} onOpenChange={(open) => !open && setShowSettingsDialog(false)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                  <DialogDescription>Customize your voucher management experience</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-validate">Auto Validate</Label>
                      <p className="text-sm text-muted-foreground">Automatically validate vouchers on upload</p>
                    </div>
                    <Switch
                      id="auto-validate"
                      checked={settings.autoValidate}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoValidate: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-invalid">Show Invalid in Main List</Label>
                      <p className="text-sm text-muted-foreground">Include invalid vouchers in the main voucher list</p>
                    </div>
                    <Switch
                      id="show-invalid"
                      checked={settings.showInvalidInMain}
                      onCheckedChange={(checked) => setSettings({ ...settings, showInvalidInMain: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-animations">Enable Animations</Label>
                      <p className="text-sm text-muted-foreground">Show animations for a more dynamic experience</p>
                    </div>
                    <Switch
                      id="enable-animations"
                      checked={settings.enableAnimations}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableAnimations: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="batch-size">Batch Size</Label>
                    <p className="text-sm text-muted-foreground">Number of vouchers to process at once</p>
                    <Select
                      value={settings.batchSize.toString()}
                      onValueChange={(value) => setSettings({ ...settings, batchSize: Number.parseInt(value) })}
                    >
                      <SelectTrigger id="batch-size">
                        <SelectValue placeholder="Select batch size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50 vouchers</SelectItem>
                        <SelectItem value="100">100 vouchers</SelectItem>
                        <SelectItem value="250">250 vouchers</SelectItem>
                        <SelectItem value="500">500 vouchers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Validation Details Sheet */}
            <Sheet open={showValidationSheet} onOpenChange={setShowValidationSheet}>
              <SheetContent className="w-full md:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Validation Details</SheetTitle>
                  <SheetDescription>Detailed information about your voucher validation</SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  {renderValidationSummary()}

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="duplicates">
                      <AccordionTrigger className="text-amber-600 font-medium">
                        <div className="flex items-center gap-2">
                          <FileWarning className="h-4 w-4" />
                          Duplicate Vouchers (
                          {validationSummary.duplicateSerials + validationSummary.duplicateReferences})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-6">
                          <p className="text-sm text-muted-foreground">
                            Duplicate Serial Numbers: {validationSummary.duplicateSerials}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Duplicate Reference Numbers: {validationSummary.duplicateReferences}
                          </p>
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setActiveTab("invalid")
                                setShowValidationSheet(false)
                              }}
                            >
                              View Invalid Vouchers
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="missing">
                      <AccordionTrigger className="text-amber-600 font-medium">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Missing Fields ({validationSummary.missingFields})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-6">
                          <p className="text-sm text-muted-foreground">
                            Vouchers with missing required fields: {validationSummary.missingFields}
                          </p>
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={fixAllInvalid}
                              disabled={validationSummary.missingFields === 0}
                            >
                              Auto-Fix Missing Fields
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="valid">
                      <AccordionTrigger className="text-green-600 font-medium">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Valid Vouchers ({validationSummary.valid})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-6">
                          <p className="text-sm text-muted-foreground">These vouchers are ready to be created.</p>
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setActiveTab("valid")
                                setShowValidationSheet(false)
                              }}
                            >
                              View Valid Vouchers
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => copyToClipboard("valid")}
                        disabled={validVouchers.length === 0}
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        Copy Valid
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => exportToCSV("valid")}
                        disabled={validVouchers.length === 0}
                      >
                        <Download className="h-4 w-4" />
                        Export Valid
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => copyToClipboard("invalid")}
                        disabled={invalidVouchers.length === 0}
                      >
                        <Clipboard className="h-4 w-4" />
                        Copy Invalid
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => exportToCSV("invalid")}
                        disabled={invalidVouchers.length === 0}
                      >
                        <Download className="h-4 w-4" />
                        Export Invalid
                      </Button>
                    </div>
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button>Close</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {loading && (
              <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-card shadow-lg">
                  {duplicateCheckInProgress ? (
                    <>
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-lg font-medium">Checking for duplicates...</p>
                      <Progress value={progress} className="w-48 h-2" />
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-lg font-medium">
                        {currentStep === 3 ? "Creating vouchers..." : "Processing..."}
                      </p>
                      <Progress value={progress} className="w-48 h-2" />
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

export default GsatCreation
