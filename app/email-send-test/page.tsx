"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Trash2,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Download,
  Search,
  Save,
  Settings,
  Moon,
  Sun,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Inbox,
  Eye,
  Code,
  Mail,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sendSingleEmail } from "@/actions/test-email"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { CodeEditor } from "./code-editor"

interface EmailEntry {
  id: number
  email: string
  imageLink: string
  name?: string
  status: "pending" | "sending" | "success" | "error"
  errorMessage?: string
  sentAt?: string
  selected?: boolean
}

interface BatchInfo {
  id: string
  name: string
  createdAt: string
  emailCount: number
}

interface EmailHistory {
  date: string
  count: number
  success: number
  failed: number
}

interface EmailTemplate {
  subject: string
  htmlContent: string
}

// Default email template
const DEFAULT_EMAIL_TEMPLATE: EmailTemplate = {
  subject: "Your Monthly Settlement Report from Philtech",
  htmlContent: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settlement Report</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .header { text-align: center; margin-bottom: 30px; }
      .logo { max-width: 180px; height: auto; }
      .content { margin-bottom: 30px; }
      .image-container { margin: 25px 0; text-align: center; }
      .report-image { max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 3px 10px rgba(0,0,0,0.1); }
      .button { display: inline-block; background-color: #3d8bd5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
      .button:hover { background-color: #2d6db0; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
      .signature { margin-top: 25px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="content">
        <p>Dear {{name}},</p>
        <p>Please find attached your monthly settlement report, including proof of deposit. If you have any questions or concerns, please don't hesitate to contact us.</p>
        
        <div class="image-container">
          <img src="{{imageLink}}" alt="Settlement Report" class="report-image" />
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="{{imageLink}}" download class="button">
            Download Report Image
          </a>
        </div>
        
        <p>Thank you for your continued partnership.</p>
        
        <div class="signature">
          <p style="margin-bottom: 5px;"><strong>KAYCEE LOZADA</strong></p>
          <p style="margin-bottom: 5px;"><strong>FINANCE ASSISTANT</strong></p>
          <p>PHILTECH INC.</p>
        </div>
      </div>
      
      <div class="footer">
        <p>© 2025 PhilTech Business Group. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`,
}

// Local storage keys
const STORAGE_KEYS = {
  ENTRIES: "email-batch-entries",
  BATCHES: "email-batch-saved-batches",
  HISTORY: "email-batch-history",
  SETTINGS: "email-batch-settings",
  THEME: "email-batch-theme",
  EMAIL_TEMPLATE: "email-batch-template",
}

// Helper function to check if we're on a mobile device
const isMobileDevice = () => {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches
}

export default function EmailBatchSender() {
  // State for entries and UI
  const [idCounter, setIdCounter] = useState(1)
  const [entries, setEntries] = useState<EmailEntry[]>([{ id: 0, email: "", imageLink: "", status: "pending" }])
  const [isSending, setIsSending] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showResultSummary, setShowResultSummary] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [savedBatches, setSavedBatches] = useState<BatchInfo[]>([])
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([])
  const [showSaveBatchDialog, setShowSaveBatchDialog] = useState(false)
  const [newBatchName, setNewBatchName] = useState("")
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importText, setImportText] = useState("")
  const [darkMode, setDarkMode] = useState(false)
  const [settings, setSettings] = useState({
    autoSave: true,
    showPreview: true,
    entriesPerPage: 10,
    retryFailed: true,
  })
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>(DEFAULT_EMAIL_TEMPLATE)
  const [templateEditMode, setTemplateEditMode] = useState<"visual" | "code">("visual")
  const [previewEntry, setPreviewEntry] = useState<EmailEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { toast } = useToast()

  // Use a ref to track the current entries to avoid stale closures
  const entriesRef = useRef(entries)
  useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  // Load data from localStorage on initial render
  useEffect(() => {
    setIsLoading(true)

    // Load theme preference - default to light
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME)
    if (savedTheme) {
      const isDark = savedTheme === "dark"
      setDarkMode(isDark)
      if (isDark) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } else {
      // Default to light theme
      setDarkMode(false)
      document.documentElement.classList.remove("dark")
    }

    // Load entries
    const savedEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES)
    if (savedEntries) {
      try {
        const parsedEntries = JSON.parse(savedEntries) as EmailEntry[]
        if (Array.isArray(parsedEntries) && parsedEntries.length > 0) {
          setEntries(parsedEntries)
          // Find the highest ID to set the counter
          const maxId = Math.max(...parsedEntries.map((entry) => entry.id))
          setIdCounter(maxId + 1)
        }
      } catch (error) {
        console.error("Error parsing saved entries:", error)
      }
    }

    // Load saved batches
    const savedBatchesData = localStorage.getItem(STORAGE_KEYS.BATCHES)
    if (savedBatchesData) {
      try {
        const parsedBatches = JSON.parse(savedBatchesData) as BatchInfo[]
        if (Array.isArray(parsedBatches)) {
          setSavedBatches(parsedBatches)
        }
      } catch (error) {
        console.error("Error parsing saved batches:", error)
      }
    }

    // Load history
    const historyData = localStorage.getItem(STORAGE_KEYS.HISTORY)
    if (historyData) {
      try {
        const parsedHistory = JSON.parse(historyData) as EmailHistory[]
        if (Array.isArray(parsedHistory)) {
          setEmailHistory(parsedHistory)
        }
      } catch (error) {
        console.error("Error parsing history:", error)
      }
    }

    // Load settings
    const settingsData = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (settingsData) {
      try {
        const parsedSettings = JSON.parse(settingsData)
        setSettings((prev) => ({ ...prev, ...parsedSettings }))
      } catch (error) {
        console.error("Error parsing settings:", error)
      }
    }

    // Load email template
    const templateData = localStorage.getItem(STORAGE_KEYS.EMAIL_TEMPLATE)
    if (templateData) {
      try {
        const parsedTemplate = JSON.parse(templateData) as EmailTemplate
        setEmailTemplate(parsedTemplate)
      } catch (error) {
        console.error("Error parsing email template:", error)
      }
    }

    setIsLoading(false)
  }, [])

  // Save entries to localStorage whenever they change
  useEffect(() => {
    if (settings.autoSave && entries.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries))
    }
  }, [entries, settings.autoSave])

  useEffect(() => {
    const savedEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES)
    if (savedEntries) {
      try {
        const parsedEntries = JSON.parse(savedEntries) as EmailEntry[]
        if (Array.isArray(parsedEntries) && parsedEntries.length > 0) {
          setEntries(parsedEntries)

          // Find the highest ID to set the counter
          const maxId = Math.max(...parsedEntries.map((entry) => entry.id))
          setIdCounter(maxId + 1)
        }
      } catch (error) {
        console.error("Error parsing saved entries:", error)
      }
    }
  }, [])

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  }, [settings])

  // Save theme preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, darkMode ? "dark" : "light")
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  // Save email template whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMAIL_TEMPLATE, JSON.stringify(emailTemplate))
  }, [emailTemplate])

  // Calculate summary stats
  const totalEntries = entries.length
  const successCount = entries.filter((e) => e.status === "success").length
  const errorCount = entries.filter((e) => e.status === "error").length
  const pendingCount = entries.filter((e) => e.status === "pending" || e.status === "sending").length
  const selectedCount = entries.filter((e) => e.selected).length

  // Filter entries based on active tab and search query
  const filteredEntries = useMemo(() => {
    let filtered = [...entries]

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter((entry) => entry.status === activeTab)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (entry) =>
          entry.email.toLowerCase().includes(query) ||
          entry.name?.toLowerCase().includes(query) ||
          entry.imageLink.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [entries, activeTab, searchQuery])

  // Update progress whenever statuses change
  useEffect(() => {
    if (isSending) {
      const completedCount = entries.filter((e) => e.status === "success" || e.status === "error").length
      setProgress((completedCount / totalEntries) * 100)
    }
  }, [entries, isSending, totalEntries])

  const addEntry = () => {
    const newId = idCounter
    setIdCounter((prev) => prev + 1)
    setEntries([...entries, { id: newId, email: "", imageLink: "", status: "pending" }])
  }

  const addMultipleEntries = (count: number) => {
    const newEntries: EmailEntry[] = []
    let newId = idCounter

    for (let i = 0; i < count; i++) {
      newEntries.push({
        id: newId++,
        email: "",
        imageLink: "",
        status: "pending",
      })
    }

    setIdCounter(newId)
    setEntries([...entries, ...newEntries])
  }

  const removeEntry = (id: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((entry) => entry.id !== id))
    }
  }

  const removeSelectedEntries = () => {
    const hasSelected = entries.some((e) => e.selected)
    if (!hasSelected) {
      toast({
        title: "No Entries Selected",
        description: "Please select entries to remove.",
        variant: "destructive",
      })
      return
    }

    const remainingEntries = entries.filter((entry) => !entry.selected)
    if (remainingEntries.length === 0) {
      // Keep at least one entry
      setEntries([{ id: idCounter, email: "", imageLink: "", status: "pending" }])
      setIdCounter((prev) => prev + 1)
    } else {
      setEntries(remainingEntries)
    }

    toast({
      title: "Entries Removed",
      description: `Successfully removed ${selectedCount} entries.`,
    })
  }

  const updateEntry = (id: number, field: keyof EmailEntry, value: any) => {
    setEntries(entries.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)))
  }

  const toggleSelectEntry = (id: number) => {
    setEntries(entries.map((entry) => (entry.id === id ? { ...entry, selected: !entry.selected } : entry)))
  }

  const toggleSelectAll = () => {
    const allSelected = filteredEntries.every((e) => e.selected)
    setEntries(
      entries.map((entry) => {
        // Only toggle entries that are currently filtered/visible
        if (filteredEntries.some((e) => e.id === entry.id)) {
          return { ...entry, selected: !allSelected }
        }
        return entry
      }),
    )
  }

  const validateEntries = () => {
    const invalidEntries = entries.filter((entry) => !entry.email || !entry.imageLink)

    if (invalidEntries.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all email addresses and image links.",
        variant: "destructive",
      })
      return false
    }

    // Validate email format with specific error identification
    const invalidEmails = entries.filter((entry) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email))

    if (invalidEmails.length > 0) {
      // Mark invalid emails with error status
      setEntries(
        entries.map((entry) => {
          if (invalidEmails.includes(entry)) {
            return {
              ...entry,
              status: "error",
              errorMessage: "Invalid email format",
            }
          }
          return entry
        }),
      )

      // Show toast with specific information
      toast({
        title: "Invalid Email Format",
        description: `${invalidEmails.length} email(s) have invalid format. Please check the highlighted entries.`,
        variant: "destructive",
      })

      // Scroll to the first invalid email
      const firstInvalidId = invalidEmails[0].id
      const element = document.getElementById(`email-${firstInvalidId}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
        element.focus()
      }

      return false
    }

    return true
  }

  const resetStatuses = () => {
    setEntries(
      entries.map((entry) => ({
        ...entry,
        status: "pending",
        errorMessage: undefined,
      })),
    )
    setCurrentIndex(0)
    setProgress(0)
    setShowResultSummary(false)
  }

  const retryFailedEmails = () => {
    setEntries(
      entries.map((entry) =>
        entry.status === "error" ? { ...entry, status: "pending", errorMessage: undefined } : entry,
      ),
    )

    setCurrentIndex(0)
    setProgress(0)
    setShowResultSummary(false)

    // Start sending if there are failed emails
    if (entries.some((e) => e.status === "error")) {
      setIsSending(true)
      setTimeout(processNextEmail, 100)
    }
  }

  const validateBatch = () => {
    // Reset any previous validation errors
    setEntries(
      entries.map((entry) => ({
        ...entry,
        status: entry.status === "error" && entry.errorMessage === "Invalid email format" ? "pending" : entry.status,
        errorMessage: entry.errorMessage === "Invalid email format" ? undefined : entry.errorMessage,
      })),
    )

    let hasErrors = false
    const updatedEntries: any = entries.map((entry) => {
      const errors = []

      // Check for empty fields
      if (!entry.email) errors.push("Email is required")
      if (!entry.imageLink) errors.push("Image link is required")

      // Validate email format
      if (entry.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) {
        errors.push("Invalid email format")
      }

      // Validate image URL format
      if (entry.imageLink && !entry.imageLink.startsWith("http")) {
        errors.push("Image link must be a valid URL")
      }

      if (errors.length > 0) {
        hasErrors = true
        return {
          ...entry,
          status: "error",
          errorMessage: errors.join(". "),
        }
      }

      return entry
    })

    if (hasErrors) {
      setEntries(updatedEntries)

      // Find the first entry with an error
      const firstErrorIndex = updatedEntries.findIndex((e: any) => e.status === "error")
      if (firstErrorIndex >= 0) {
        const element = document.getElementById(`email-${updatedEntries[firstErrorIndex].id}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
          setTimeout(() => element.focus(), 100)
        }
      }

      toast({
        title: "Validation Failed",
        description: "Please fix the highlighted errors before sending.",
        variant: "destructive",
      })

      return false
    }

    return true
  }

  const startSending = () => {
    if (!validateBatch()) return

    resetStatuses()
    setIsSending(true)
    setShowConfirmDialog(false)

    // Start the sending process with a small delay to ensure state is updated
    setTimeout(processNextEmail, 100)
  }

  // Process emails one by one
  const processNextEmail = async () => {
    // Get the current entries from the ref
    const currentEntries = entriesRef.current

    // Find the next pending email
    const nextPendingIndex = currentEntries.findIndex((e) => e.status === "pending")

    if (nextPendingIndex === -1) {
      // All emails processed
      setIsSending(false)
      setShowResultSummary(true)

      const successCount = currentEntries.filter((e) => e.status === "success").length
      const errorCount = currentEntries.filter((e) => e.status === "error").length

      // Update history
      const today = new Date().toISOString().split("T")[0]
      const historyEntry = {
        date: today,
        count: successCount + errorCount,
        success: successCount,
        failed: errorCount,
      }

      setEmailHistory((prev) => {
        const existingEntryIndex = prev.findIndex((h) => h.date === today)
        if (existingEntryIndex >= 0) {
          // Update existing entry
          const updatedHistory = [...prev]
          updatedHistory[existingEntryIndex] = {
            ...updatedHistory[existingEntryIndex],
            count: updatedHistory[existingEntryIndex].count + historyEntry.count,
            success: updatedHistory[existingEntryIndex].success + historyEntry.success,
            failed: updatedHistory[existingEntryIndex].failed + historyEntry.failed,
          }
          localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory))
          return updatedHistory
        } else {
          // Add new entry
          const updatedHistory = [...prev, historyEntry]
          localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory))
          return updatedHistory
        }
      })

      // Show appropriate toast message
      if (errorCount > 0 && errorCount === currentEntries.length) {
        // All emails failed
        toast({
          title: "Email Sending Failed",
          description: "All emails failed to send. Please check the error messages and try again.",
          variant: "destructive",
        })
      } else if (errorCount > 0) {
        // Some emails failed
        toast({
          title: "Batch Process Complete",
          description: `Sent ${successCount} of ${currentEntries.length} emails. ${errorCount} failed.`,
          variant: "destructive",
        })
      } else {
        // All emails succeeded
        toast({
          title: "Batch Process Complete",
          description: `Successfully sent all ${successCount} emails.`,
        })
      }

      return
    }

    setCurrentIndex(nextPendingIndex)

    // Mark this email as sending
    setEntries((prev) => {
      const updated = [...prev]
      updated[nextPendingIndex] = {
        ...updated[nextPendingIndex],
        status: "sending",
      }
      return updated
    })

    // Wait a moment to ensure state updates
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      const emailToSend = currentEntries[nextPendingIndex]

      console.log(`Sending email to: ${emailToSend.email}`)

      // Send the email with the current template
      const result = await sendSingleEmail(
        {
          email: emailToSend.email,
          imageLink: emailToSend.imageLink,
          name: emailToSend.name,
        },
        emailTemplate,
      )

      console.log(`Result for ${emailToSend.email}:`, result)

      // Check if this is a credentials error that would affect all emails
      if (
        !result.success &&
        result.error &&
        (result.error.includes("credentials") ||
          result.error.includes("authentication") ||
          result.error.includes("login"))
      ) {
        // Stop the process and mark all pending emails as failed with the same error
        setEntries((prev) => {
          return prev.map((entry) => {
            if (entry.status === "pending" || entry.status === "sending") {
              return {
                ...entry,
                status: "error",
                errorMessage: result.error,
              }
            }
            return entry
          })
        })

        setIsSending(false)
        setShowResultSummary(true)

        toast({
          title: "Email Configuration Error",
          description: result.error,
          variant: "destructive",
        })

        return
      }

      // Update the entry with the result
      setEntries((prev) => {
        const updated = [...prev]
        updated[nextPendingIndex] = {
          ...updated[nextPendingIndex],
          status: result.success ? "success" : "error",
          errorMessage: result.error,
          sentAt: result.success ? new Date().toISOString() : undefined,
        }
        return updated
      })

      // Wait for state to update before processing next email
      setTimeout(processNextEmail, 500)
    } catch (error) {
      console.error("Error sending email:", error)

      // Handle unexpected errors
      setEntries((prev) => {
        const updated = [...prev]
        updated[nextPendingIndex] = {
          ...updated[nextPendingIndex],
          status: "error",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        }
        return updated
      })

      // Continue with next email despite error
      setTimeout(processNextEmail, 500)
    }
  }

  const cancelSending = () => {
    setIsSending(false)
    toast({
      title: "Process Cancelled",
      description: "Email sending has been cancelled.",
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    })
  }

  const saveBatch = () => {
    if (!newBatchName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a name for this batch.",
        variant: "destructive",
      })
      return
    }

    const batchId = selectedBatchId || `batch_${Date.now()}`
    const newBatch: BatchInfo = {
      id: batchId,
      name: newBatchName,
      createdAt: new Date().toISOString(),
      emailCount: entries.length,
    }

    // Save the current entries under this batch ID
    localStorage.setItem(`batch_${batchId}`, JSON.stringify(entries))

    // Update the batches list
    const updatedBatches = selectedBatchId
      ? savedBatches.map((b) => (b.id === selectedBatchId ? newBatch : b))
      : [...savedBatches, newBatch]

    setSavedBatches(updatedBatches)
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(updatedBatches))

    setSelectedBatchId(batchId)
    setShowSaveBatchDialog(false)

    toast({
      title: "Batch Saved",
      description: `Successfully saved batch "${newBatchName}".`,
    })
  }

  const loadBatch = (batchId: string) => {
    const batchData = localStorage.getItem(`batch_${batchId}`)
    if (batchData) {
      try {
        const parsedEntries = JSON.parse(batchData) as EmailEntry[]
        if (Array.isArray(parsedEntries) && parsedEntries.length > 0) {
          setEntries(parsedEntries)
          // Find the highest ID to set the counter
          const maxId = Math.max(...parsedEntries.map((entry) => entry.id))
          setIdCounter(maxId + 1)
          setSelectedBatchId(batchId)

          toast({
            title: "Batch Loaded",
            description: `Successfully loaded batch with ${parsedEntries.length} entries.`,
          })
        }
      } catch (error) {
        console.error("Error parsing batch data:", error)
        toast({
          title: "Error",
          description: "Failed to load batch data.",
          variant: "destructive",
        })
      }
    }
  }

  const deleteBatch = (batchId: string) => {
    // Remove batch data
    localStorage.removeItem(`batch_${batchId}`)

    // Update batches list
    const updatedBatches = savedBatches.filter((b) => b.id !== batchId)
    setSavedBatches(updatedBatches)
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(updatedBatches))

    if (selectedBatchId === batchId) {
      setSelectedBatchId(null)
    }

    toast({
      title: "Batch Deleted",
      description: "Successfully deleted the batch.",
    })
  }

  const exportToCsv = () => {
    // Create CSV content
    const headers = ["Email", "Image Link", "Name", "Status"]
    const rows = entries.map((entry) => [entry.email, entry.imageLink, entry.name || "", entry.status])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `email-batch-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const importFromCsv = () => {
    if (!importText.trim()) {
      toast({
        title: "Error",
        description: "Please enter CSV data to import.",
        variant: "destructive",
      })
      return
    }

    try {
      // Parse CSV
      const lines = importText.trim().split("\n")
      const headers = lines[0].split(",")

      // Check if we have the minimum required columns
      const emailIndex = headers.findIndex((h) => h.toLowerCase().includes("email"))
      const imageIndex = headers.findIndex(
        (h) => h.toLowerCase().includes("image") || h.toLowerCase().includes("link") || h.toLowerCase().includes("url"),
      )
      const nameIndex = headers.findIndex((h) => h.toLowerCase().includes("name"))

      if (emailIndex === -1 || imageIndex === -1) {
        throw new Error("CSV must contain email and image link columns")
      }

      // Parse rows
      const newEntries: EmailEntry[] = []
      let newId = idCounter

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue

        const values = lines[i].split(",")
        const email = values[emailIndex]?.trim()
        const imageLink = values[imageIndex]?.trim()

        if (email && imageLink) {
          newEntries.push({
            id: newId++,
            email,
            imageLink,
            name: nameIndex !== -1 ? values[nameIndex]?.trim() : undefined,
            status: "pending",
          })
        }
      }

      if (newEntries.length === 0) {
        throw new Error("No valid entries found in CSV")
      }

      // Update state
      setIdCounter(newId)
      setEntries((prev) => [...prev, ...newEntries])
      setShowImportDialog(false)
      setImportText("")

      toast({
        title: "Import Successful",
        description: `Imported ${newEntries.length} entries.`,
      })
    } catch (error) {
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to import CSV data.",
        variant: "destructive",
      })
    }
  }

  const clearAllEntries = () => {
    setEntries([{ id: idCounter, email: "", imageLink: "", status: "pending" }])
    setIdCounter((prev) => prev + 1)
    setSelectedBatchId(null)

    toast({
      title: "Entries Cleared",
      description: "All entries have been cleared.",
    })
  }

  const getStatusBadge = (status: EmailEntry["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "sending":
        return (
          <Badge variant="secondary" className="animate-pulse">
            Sending...
          </Badge>
        )
      case "success":
        return (
          <Badge variant="default" className="bg-green-500 text-white">
            Sent
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Failed</Badge>
    }
  }

  const saveEmailTemplate = () => {
    setShowTemplateDialog(false)

    toast({
      title: "Template Saved",
      description: "Email template has been updated successfully.",
    })
  }

  const resetEmailTemplate = () => {
    setEmailTemplate(DEFAULT_EMAIL_TEMPLATE)

    toast({
      title: "Template Reset",
      description: "Email template has been reset to default.",
    })
  }

  const previewEmailTemplate = (entry: EmailEntry) => {
    setPreviewEntry(entry)
    setShowTemplateDialog(true)
    setTemplateEditMode("visual")
  }

  // Process template variables for preview
  const processTemplate = (template: EmailTemplate, entry: EmailEntry) => {
    const recipientName = entry.name || entry.email.split("@")[0]

    const processedSubject = template.subject.replace(/{{name}}/g, recipientName).replace(/{{email}}/g, entry.email)

    const processedHtmlContent = template.htmlContent
      .replace(/{{name}}/g, recipientName)
      .replace(/{{email}}/g, entry.email)
      .replace(/{{imageLink}}/g, entry.imageLink)

    return {
      subject: processedSubject,
      htmlContent: processedHtmlContent,
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="relative w-16 h-16 mb-6">
          <Loader2 className="h-16 w-16 animate-spin text-primary absolute" />
          <Mail className="h-8 w-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">Loading Email Batch Sender</h2>
        <p className="text-muted-foreground mt-2 mb-4">Preparing your email management dashboard</p>
        <div className="w-64 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-2 w-24 bg-muted-foreground/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-2/3 animate-pulse rounded-full"></div>
            </div>
            <span className="text-xs text-muted-foreground">Loading entries</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="h-2 w-24 bg-muted-foreground/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-1/2 animate-pulse rounded-full"></div>
            </div>
            <span className="text-xs text-muted-foreground">Loading templates</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="h-2 w-24 bg-muted-foreground/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-5/6 animate-pulse rounded-full"></div>
            </div>
            <span className="text-xs text-muted-foreground">Loading settings</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Inbox className="h-6 w-6" /> Batch Email Sender
              </CardTitle>
              <CardDescription className="mt-2">
                Send personalized settlement reports to multiple recipients
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {showResultSummary && (
                <div className="flex gap-2">
                  <Badge variant="default" className="bg-green-500 text-white">
                    {successCount} Sent
                  </Badge>
                  {errorCount > 0 && <Badge variant="destructive">{errorCount} Failed</Badge>}
                </div>
              )}

              <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="ml-2">
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <Button variant="ghost" size="icon" onClick={() => setShowSettingsDialog(true)}>
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {selectedBatchId && (
            <div className="mt-2">
              <Badge variant="outline" className="text-sm">
                Batch: {savedBatches.find((b) => b.id === selectedBatchId)?.name}
              </Badge>
            </div>
          )}
        </CardHeader>

        {isSending && (
          <div className="px-6 pb-4">
            <div className="flex justify-between mb-2 text-sm">
              <div className="flex items-center">
                <span className="font-medium">
                  Sending email {currentIndex + 1} of {totalEntries}
                </span>
                <span className="ml-2 text-muted-foreground">({entries[currentIndex]?.email || "..."})</span>
              </div>
              <Badge variant="outline" className="ml-auto">
                {Math.round(progress)}%
              </Badge>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-2" />
              <div
                className="absolute top-0 h-2 bg-primary/20 animate-pulse rounded-full"
                style={{
                  left: `${Math.max(0, progress - 5)}%`,
                  width: "10%",
                  maxWidth: `${100 - progress}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{successCount} sent</span>
              <span>{errorCount} failed</span>
              <span>{pendingCount} pending</span>
            </div>
          </div>
        )}

        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search emails..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filter
                {isFilterOpen ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={addEntry}>Add Single Entry</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addMultipleEntries(5)}>Add 5 Entries</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addMultipleEntries(10)}>Add 10 Entries</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowImportDialog(true)}>Import from CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Save className="h-4 w-4 mr-1" /> Batch
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => {
                      setNewBatchName(
                        selectedBatchId ? savedBatches.find((b) => b.id === selectedBatchId)?.name || "" : "",
                      )
                      setShowSaveBatchDialog(true)
                    }}
                  >
                    Save Current Batch
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Load Saved Batch</DropdownMenuLabel>
                  {savedBatches.length === 0 ? (
                    <DropdownMenuItem disabled>No saved batches</DropdownMenuItem>
                  ) : (
                    savedBatches.map((batch) => (
                      <DropdownMenuItem
                        key={batch.id}
                        onClick={() => loadBatch(batch.id)}
                        className="flex justify-between"
                      >
                        <span>{batch.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {batch.emailCount}
                        </Badge>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={exportToCsv}>
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>

              <Button variant="outline" size="sm" onClick={() => setShowTemplateDialog(true)}>
                <Mail className="h-4 w-4 mr-1" /> Edit Template
              </Button>

              {errorCount > 0 && (
                <Button variant="outline" size="sm" onClick={retryFailedEmails} disabled={isSending}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Retry Failed
                </Button>
              )}
            </div>
          </div>

          {isFilterOpen && (
            <div className="mt-4 p-4 border rounded-md">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    All <Badge variant="outline">{totalEntries}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    Pending <Badge variant="outline">{entries.filter((e) => e.status === "pending").length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="success" className="flex items-center gap-2">
                    Sent <Badge variant="outline">{entries.filter((e) => e.status === "success").length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="error" className="flex items-center gap-2">
                    Failed <Badge variant="outline">{entries.filter((e) => e.status === "error").length}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={filteredEntries.length > 0 && filteredEntries.every((e) => e.selected)}
                    onCheckedChange={toggleSelectAll}
                  />
                  <Label htmlFor="select-all">Select All</Label>
                </div>

                {selectedCount > 0 && (
                  <Button variant="destructive" size="sm" onClick={removeSelectedEntries} disabled={isSending}>
                    <Trash2 className="h-4 w-4 mr-1" /> Remove Selected ({selectedCount})
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <CardContent>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4 pr-4">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? (
                    <>
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No entries match your search criteria.</p>
                    </>
                  ) : (
                    <>
                      <Inbox className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No entries in this category.</p>
                    </>
                  )}
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-12 gap-4 items-start p-4 rounded-lg transition-all ${entry.selected ? "ring-2 ring-primary/50 dark:ring-primary/30" : ""
                      } ${entry.status === "success"
                        ? "bg-green-50 dark:bg-green-950/30"
                        : entry.status === "error"
                          ? "bg-red-50 dark:bg-red-950/30"
                          : entry.status === "sending"
                            ? "bg-blue-50 dark:bg-blue-950/30"
                            : "bg-white dark:bg-gray-800"
                      } border dark:border-gray-700`}
                  >
                    <div className="col-span-12 sm:col-span-1 flex items-center">
                      <Checkbox
                        checked={entry.selected}
                        onCheckedChange={() => toggleSelectEntry(entry.id)}
                        disabled={isSending}
                        className="mr-2"
                      />
                      {getStatusBadge(entry.status)}
                    </div>

                    <div className="col-span-12 sm:col-span-4">
                      <Label htmlFor={`email-${entry.id}`} className="mb-1 block">
                        Email Address
                        {entry.status === "error" && entry.errorMessage && (
                          <span className="text-red-500 text-xs ml-2">{entry.errorMessage}</span>
                        )}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`email-${entry.id}`}
                          type="email"
                          value={entry.email}
                          onChange={(e) => updateEntry(entry.id, "email", e.target.value)}
                          placeholder="recipient@example.com"
                          disabled={isSending}
                          className={
                            entry.status === "error"
                              ? "border-red-300 dark:border-red-700 focus-visible:ring-red-500"
                              : ""
                          }
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(entry.email)}
                                disabled={!entry.email}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy email</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    <div className="col-span-12 sm:col-span-3">
                      <Label htmlFor={`name-${entry.id}`} className="mb-1 block">
                        Recipient Name (Optional)
                      </Label>
                      <Input
                        id={`name-${entry.id}`}
                        type="text"
                        value={entry.name || ""}
                        onChange={(e) => updateEntry(entry.id, "name", e.target.value)}
                        placeholder="John Doe"
                        disabled={isSending}
                      />
                    </div>

                    <div className="col-span-12 sm:col-span-3">
                      <Label htmlFor={`link-${entry.id}`} className="mb-1 block">
                        Image Link
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`link-${entry.id}`}
                          type="url"
                          value={entry.imageLink}
                          onChange={(e) => updateEntry(entry.id, "imageLink", e.target.value)}
                          placeholder="https://example.com/report-image.jpg"
                          disabled={isSending}
                          className={entry.status === "error" ? "border-red-300 dark:border-red-700" : ""}
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(entry.imageLink)}
                                disabled={!entry.imageLink}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy link</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    <div className="col-span-12 sm:col-span-1 flex items-center justify-end gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => previewEmailTemplate(entry)}
                              disabled={!entry.email || !entry.imageLink}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Preview email</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEntry(entry.id)}
                              disabled={entries.length === 1 || isSending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove entry</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {entry.status === "error" && entry.errorMessage && (
                      <div className="col-span-12 bg-red-50 dark:bg-red-950/30 p-3 rounded-md text-sm text-red-500 dark:text-red-400 flex items-start gap-2 mt-2 border border-red-200 dark:border-red-800">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Error sending email:</p>
                          <p>{entry.errorMessage}</p>
                          <div className="mt-2 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900"
                              onClick={() => {
                                updateEntry(entry.id, "status", "pending")
                                updateEntry(entry.id, "errorMessage", undefined)
                              }}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" /> Retry
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground"
                              onClick={() => copyToClipboard(entry.errorMessage || "")}
                            >
                              <Copy className="h-3 w-3 mr-1" /> Copy Error
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {entry.status === "success" && entry.sentAt && (
                      <div className="col-span-12 text-sm text-green-600 dark:text-green-400 flex items-center gap-2 mt-2">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>Sent at {new Date(entry.sentAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" onClick={addEntry} className="flex-1" disabled={isSending}>
              <Plus className="mr-2 h-4 w-4" /> Add Another Recipient
            </Button>

            {entries.length > 1 && (
              <Button variant="outline" onClick={clearAllEntries} className="flex-1" disabled={isSending}>
                <X className="mr-2 h-4 w-4" /> Clear All
              </Button>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3">
          {isSending ? (
            <Button onClick={cancelSending} variant="destructive" className="w-full sm:w-auto">
              Cancel Process
            </Button>
          ) : (
            <>
              {showResultSummary && (
                <Button onClick={resetStatuses} variant="outline" className="w-full sm:w-auto">
                  <RefreshCw className="mr-2 h-4 w-4" /> Reset Status
                </Button>
              )}

              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="w-full sm:ml-auto"
                disabled={entries.every((e) => !e.email || !e.imageLink) || isSending}
              >
                <Send className="mr-2 h-4 w-4" /> Send Batch Emails
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      {/* Confirm Send Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Email Sending</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send {entries.filter((e) => e.status === "pending" && e.email && e.imageLink).length}{" "}
              emails. This action cannot be undone. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={startSending}>Yes, Send Emails</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Batch Dialog */}
      <Dialog open={showSaveBatchDialog} onOpenChange={setShowSaveBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Batch</DialogTitle>
            <DialogDescription>Enter a name for this batch to save it for future use.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="batch-name">Batch Name</Label>
            <Input
              id="batch-name"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              placeholder="Monthly Settlement Reports"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveBatchDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveBatch}>Save Batch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Import from CSV</DialogTitle>
            <DialogDescription>
              Paste CSV data with headers. Required columns: Email, Image Link. Optional: Name.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Email,Image Link,Name
john@example.com,https://example.com/image1.jpg,John Doe
jane@example.com,https://example.com/image2.jpg,Jane Smith"
              className="min-h-[200px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={importFromCsv}>Import Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Customize your email batch sender preferences.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-save">Auto-Save Entries</Label>
                <p className="text-sm text-muted-foreground">Automatically save entries to local storage</p>
              </div>
              <Switch
                id="auto-save"
                checked={settings.autoSave}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoSave: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-preview">Show Email Preview</Label>
                <p className="text-sm text-muted-foreground">Preview email before sending</p>
              </div>
              <Switch
                id="show-preview"
                checked={settings.showPreview}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, showPreview: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="retry-failed">Auto-Retry Failed</Label>
                <p className="text-sm text-muted-foreground">Automatically retry failed emails</p>
              </div>
              <Switch
                id="retry-failed"
                checked={settings.retryFailed}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, retryFailed: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSettingsDialog(false)}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Template Dialog */}
      <Dialog
        open={showTemplateDialog}
        onOpenChange={(open) => {
          setShowTemplateDialog(open)
          if (!open) {
            setPreviewEntry(null)
          }
        }}
      >
        <DialogContent className="max-w-7xl h-[95vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {previewEntry ? "Email Preview" : "Edit Email Template"}
            </DialogTitle>
            <DialogDescription>
              {previewEntry
                ? "Preview how your email will look when sent to this recipient."
                : "Customize the email template. Use {{name}}, {{email}}, and {{imageLink}} as placeholders."}
            </DialogDescription>
          </DialogHeader>

          {!previewEntry && (
            <div className="flex items-center justify-between mb-2">
              <Tabs value={templateEditMode} onValueChange={(value) => setTemplateEditMode(value as "visual" | "code")}>
                <TabsList>
                  <TabsTrigger value="visual">
                    <Eye className="h-4 w-4 mr-2" /> Visual Editor
                  </TabsTrigger>
                  <TabsTrigger value="code">
                    <Code className="h-4 w-4 mr-2" /> HTML Editor
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button variant="outline" size="sm" onClick={resetEmailTemplate}>
                Reset to Default
              </Button>
            </div>
          )}

          <div className="flex flex-col space-y-4 overflow-hidden">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="email-subject">Email Subject</Label>
              <Input
                id="email-subject"
                value={emailTemplate.subject}
                onChange={(e) =>
                  setEmailTemplate((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                placeholder="Your Monthly Settlement Report"
                disabled={previewEntry !== null}
              />
            </div>

            {templateEditMode === "visual" || previewEntry ? (
              <div className="flex flex-col space-y-2 flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <Label>Email Content</Label>
                  {previewEntry && <Badge variant="outline">Preview for: {previewEntry.email}</Badge>}
                </div>
                <div className="border rounded-md overflow-hidden flex-1 h-[400px]">
                  <iframe
                    srcDoc={
                      previewEntry
                        ? processTemplate(emailTemplate, previewEntry).htmlContent
                        : emailTemplate.htmlContent
                    }
                    className="w-full h-full"
                    title="Email Preview"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 flex-1">
                <Label htmlFor="email-html">HTML Content</Label>
                <div className="h-[400px] border rounded-md overflow-hidden">
                  <CodeEditor
                    value={emailTemplate.htmlContent}
                    onChange={(value: any) =>
                      setEmailTemplate((prev) => ({
                        ...prev,
                        htmlContent: value,
                      }))
                    }
                    language="html"
                    theme={darkMode ? "vs-dark" : "vs-light"}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Available variables: <code>&#123;&#123; name &#125;&#125;</code>,{" "}
              <code>&#123;&#123; email &#125;&#125;</code>, <code>&#123;&#123; imageLink &#125;&#125;</code>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTemplateDialog(false)
                  setPreviewEntry(null)
                }}
              >
                {previewEntry ? "Close Preview" : "Cancel"}
              </Button>
              {!previewEntry && <Button onClick={saveEmailTemplate}>Save Template</Button>}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
