"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
    Upload,
    AlertCircle,
    Check,
    Search,
    X,
    FileText,
    Edit,
    Trash2,
    ChevronRight,
    ChevronLeft,
    Info,
    FileUp,
    Eye,
    Users,
    ArrowDown,
    Minimize,
    Maximize,
    ZoomIn,
    ZoomOut,
    RefreshCw,
    Mail,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Sparkles,
} from "lucide-react"
import { bulkUploadUsers, validateBulkUsers, type BulkUserInput } from "@/actions/user"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CodeEditor } from "@/app/email-send-test/code-editor"
import { Progress } from "@/components/ui/progress"

const Tree = dynamic(() => import("react-d3-tree"), { ssr: false })

const accountTypeMap: Record<string, string> = {
    "BASIC MERCHANT ACCOUNT": "Basic_Merchant_Package",
    "PREMIUM MERCHANT ACCOUNT": "Premium_Merchant_Package",
    "ELITE DISTRIBUTOR ACCOUNT": "Elite_Distributor_Package",
    "ELITE PLUS DISTRIBUTOR ACCOUNT": "Elite_Plus_Distributor_Package",
}

const reverseAccountTypeMap: Record<string, string> = {
    Basic_Merchant_Package: "BASIC MERCHANT ACCOUNT",
    Premium_Merchant_Package: "PREMIUM MERCHANT ACCOUNT",
    Elite_Distributor_Package: "ELITE DISTRIBUTOR ACCOUNT",
    Elite_Plus_Distributor_Package: "ELITE PLUS DISTRIBUTOR ACCOUNT",
}

const roleColors: Record<string, string> = {
    Basic_Merchant_Package: "#3b82f6",
    Premium_Merchant_Package: "#8b5cf6",
    Elite_Distributor_Package: "#ec4899",
    Elite_Plus_Distributor_Package: "#ef4444",
}

const defaultEmailTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to PHILTECH BUSINESS GROUP</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #e0e0e0;
    }
    .logo-container {
      text-align: center;
      padding: 25px;
      background-color: #f8f8f8;
      border-bottom: 1px solid #e0e0e0;
    }
    .logo {
      max-width: 250px;
      height: auto;
    }
    .header {
      background-color: #3f87d6;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background-color: #f9f9f9;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
    }
    .details-table th, .details-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    .details-table th {
      background-color: #addaf7;
      font-weight: 600;
      width: 30%;
      color: #333;
    }
    .button {
      display: inline-block;
      background-color: #3f87d6;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 4px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: background-color 0.3s ease;
      font-size: 16px;
      letter-spacing: 0.5px;
    }
    .button:hover {
      background-color: #3678c0;
    }
    .warning {
      background-color: #fff8f8;
      border-left: 4px solid #ff5252;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    .footer {
      background-color: #addaf7;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #333;
    }
    .highlight {
      background-color: #addaf7;
      padding: 2px 4px;
      border-radius: 2px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo-container">
      <img src="https://philtechbusiness.ph/wp-content/uploads/2023/06/20000-X-5000-TRANSPARENT13.png" alt="PHILTECH BUSINESS GROUP Logo" class="logo">
    </div>
    <div class="header">
      <h1>Welcome to PHILTECH BUSINESS GROUP!</h1>
    </div>
    <div class="content">
      <p class="greeting">Good day Mr/Ms {{userName}},</p>
      <p>We are excited to inform you that your account has been <span class="highlight">successfully created</span>! Below are your login credentials:</p>
      <table class="details-table">
        <tr><th>Email</th><td>{{email}}</td></tr>
        <tr><th>Password</th><td>{{password}}</td></tr>
      </table>
      <div class="warning">
        <p style="margin: 0;"><strong>IMPORTANT:</strong> Please ensure that you enter your login credentials exactly as shown above to avoid any errors.
        For your security, we strongly recommend that you change your password immediately after logging in.</p>
      </div>
      <div class="button-container">
        <a href="https://app.philtechbusiness.ph/login" class="button">Log In & Change Password</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {{year}} PHILTECH BUSINESS GROUP. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`

const colorThemes = [
    {
        name: "Default Blue",
        primary: "#3b82f6",
        secondary: "#8b5cf6",
        accent: "#f472b6",
        background: "#f8fafc",
    },
    {
        name: "Corporate Green",
        primary: "#10b981",
        secondary: "#059669",
        accent: "#34d399",
        background: "#f0fdf4",
    },
    {
        name: "Elegant Purple",
        primary: "#8b5cf6",
        secondary: "#7c3aed",
        accent: "#a78bfa",
        background: "#f5f3ff",
    },
    {
        name: "Warm Orange",
        primary: "#f97316",
        secondary: "#ea580c",
        accent: "#fb923c",
        background: "#fff7ed",
    },
]

interface BulkUploadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (users: any[]) => void
    allUsers: any[]
}

const defaultRetailerCounts: Record<string, number> = {
    Basic_Merchant_Package: 3,
    Premium_Merchant_Package: 6,
    Elite_Distributor_Package: 10,
    Elite_Plus_Distributor_Package: 15,
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess, allUsers }: BulkUploadDialogProps) {
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isValidating, setIsValidating] = useState(false)
    const [parsedData, setParsedData] = useState<BulkUserInput[]>([])
    const [editableData, setEditableData] = useState<BulkUserInput[]>([])
    const [errors, setErrors] = useState<string[]>([])
    const [step, setStep] = useState<"upload" | "preview" | "upline" | "review" | "processing" | "email-template" | "retailer-settings">(
        "upload",
    )
    const [selectedUplineId, setSelectedUplineId] = useState<number | null>(null)
    const [uplineSearchTerm, setUplineSearchTerm] = useState("")
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [selectedUplineUser, setSelectedUplineUser] = useState<any | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [validationResults, setValidationResults] = useState<any>(null)
    const [editingRow, setEditingRow] = useState<number | null>(null)
    const [editFormData, setEditFormData] = useState<BulkUserInput | null>(null)
    const [activeTab, setActiveTab] = useState<"all" | "valid" | "invalid">("all")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const treeContainerRef = useRef<HTMLDivElement>(null)
    const { toast } = useToast()
    const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true)
    const [emailTemplate, setEmailTemplate] = useState(defaultEmailTemplate)
    const [showUplinePreview, setShowUplinePreview] = useState(false)
    const [isFullscreenPreview, setIsFullscreenPreview] = useState(false)
    const [showEmailPreview, setShowEmailPreview] = useState(false)
    const [previewData, setPreviewData] = useState({
        userName: "John Doe",
        email: "john.doe@example.com",
        password: "12345",
        year: new Date().getFullYear().toString(),
    })
    const [zoomLevel, setZoomLevel] = useState(1)
    const [antiSpamFeatures, setAntiSpamFeatures] = useState({
        dkim: true,
        spf: true,
        personalizedSubject: true,
        unsubscribeLink: true,
        plainTextAlternative: true,
    })
    const [treeTranslate, setTreeTranslate] = useState({ x: 0, y: 0 })
    const [treeOrientation, setTreeOrientation] = useState<"vertical" | "horizontal">("vertical")
    const [selectedTheme, setSelectedTheme] = useState(colorThemes[0])
    const [treeNodeSize, setTreeNodeSize] = useState({ x: 220, y: 120 })
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
    const [processingBatch, setProcessingBatch] = useState({ current: 0, total: 0 })
    const [uploadResults, setUploadResults] = useState<{ success: any[]; failed: any[]; total: number } | null>(null)
    const [retailerCounts, setRetailerCounts] = useState(defaultRetailerCounts)

    useEffect(() => {
        if (!open) {
            setFile(null)
            setParsedData([])
            setEditableData([])
            setErrors([])
            setStep("upload")
            setSelectedUplineId(null)
            setUplineSearchTerm("")
            setSelectedUplineUser(null)
            setUploadProgress(0)
            setValidationResults(null)
            setEditingRow(null)
            setEditFormData(null)
            setActiveTab("all")
            setSendWelcomeEmail(false)
            setEmailTemplate(defaultEmailTemplate)
            setShowUplinePreview(false)
            setIsFullscreenPreview(false)
            setShowEmailPreview(false)
            setZoomLevel(1)
            setTreeTranslate({ x: 0, y: 0 })
            setTreeOrientation("vertical")
            setSelectedTheme(colorThemes[0])
            setTreeNodeSize({ x: 220, y: 120 })
            setShowAdvancedOptions(false)
            setProcessingBatch({ current: 0, total: 0 })
            setUploadResults(null)
        }
    }, [open])

    useEffect(() => {
        if (showUplinePreview && treeContainerRef.current) {
            const containerWidth = treeContainerRef.current.offsetWidth
            const containerHeight = treeContainerRef.current.offsetHeight

            setTreeTranslate({
                x: containerWidth / 2,
                y: containerHeight / 4,
            })
        }
    }, [showUplinePreview, treeOrientation])

    // Auto-trigger upload when in processing step
    useEffect(() => {
        if (step === "processing" && validationResults?.valid.length > 0) {
            // The upload will be triggered by the BulkUploadClient component
            // when it renders with the button visible
        }
    }, [step, validationResults])

    const filteredUsers = allUsers.filter((user) => {
        const searchTermLower = uplineSearchTerm.toLowerCase()
        return (
            (user.user_nicename && user.user_nicename.toLowerCase().includes(searchTermLower)) ||
            (user.user_email && user.user_email.toLowerCase().includes(searchTermLower)) ||
            (user.business_name && user.business_name.toLowerCase().includes(searchTermLower))
        )
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            await parseCSV(selectedFile)
        }
    }

    const parseCSV = async (file: File) => {
        const reader = new FileReader()

        reader.onload = async (event) => {
            try {
                const csvText = event.target?.result as string
                const lines = csvText.split("\n")
                const headers = lines[0].split(",").map((header) => header.trim().replace(/^"|"$/g, ""))

                const expectedHeaders = [
                    "ACCOUNT TYPE",
                    "MID",
                    "TID",
                    "STORE NAME",
                    "ADDRESS",
                    "NAME",
                    "CONTACT NUMBER",
                    "EMAIL ADDRESS",
                    "DATE JOINED",
                    "REMARKS",
                ]

                const validationErrors = []
                const missingRequiredHeaders = []

                if (!headers.includes("NAME") && !headers.includes("name")) {
                    missingRequiredHeaders.push("NAME")
                }

                if (!headers.includes("EMAIL ADDRESS") && !headers.includes("email address")) {
                    missingRequiredHeaders.push("EMAIL ADDRESS")
                }

                if (missingRequiredHeaders.length > 0) {
                    validationErrors.push(`Missing required headers: ${missingRequiredHeaders.join(", ")}`)
                }

                if (validationErrors.length > 0) {
                    setErrors(validationErrors)
                    return
                }

                const parsedRows = []
                const rowErrors = []

                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue

                    const row: string[] = []
                    let inQuotes = false
                    let currentValue = ""

                    for (const char of lines[i]) {
                        if (char === '"') {
                            inQuotes = !inQuotes
                        } else if (char === "," && !inQuotes) {
                            row.push(currentValue.trim())
                            currentValue = ""
                        } else {
                            currentValue += char
                        }
                    }

                    row.push(currentValue.trim())

                    const rowData: Record<string, string> = {}

                    for (let j = 0; j < headers.length; j++) {
                        const header = headers[j]
                        const value = row[j] ? row[j].replace(/^"|"$/g, "") : ""
                        rowData[header] = value
                    }

                    const name = rowData["NAME"] || rowData["name"] || ""
                    const email = rowData["EMAIL ADDRESS"] || rowData["email address"] || ""

                    if (!name) {
                        rowErrors.push(`Row ${i}: Missing required field 'NAME'`)
                        continue
                    }

                    if (!email) {
                        rowErrors.push(`Row ${i}: Missing required field 'EMAIL ADDRESS'`)
                        continue
                    }

                    const accountType = rowData["ACCOUNT TYPE"] || rowData["account type"] || ""
                    const role = accountTypeMap[accountType.toUpperCase()] || "Basic_Merchant_Package"
                    const retailerCount = retailerCounts[role] || 0

                    let formattedDate: string | null = null
                    const dateJoined = rowData["DATE JOINED"] || rowData["date joined"] || ""

                    if (dateJoined) {
                        try {
                            const date = new Date(dateJoined)
                            if (!isNaN(date.getTime())) {
                                formattedDate = date.toISOString()
                            }
                        } catch (e) {
                            rowErrors.push(`Row ${i}: Invalid date format for 'DATE JOINED'`)
                        }
                    }

                    const formattedRow: BulkUserInput = {
                        user_nicename: name,
                        user_email: email,
                        user_role: role,
                        merchant_id: rowData["MID"] || rowData["mid"] || "",
                        terminal_id: rowData["TID"] || rowData["tid"] || "",
                        business_name: rowData["STORE NAME"] || rowData["store name"] || "",
                        business_address: rowData["ADDRESS"] || rowData["address"] || "",
                        user_contact_number: rowData["CONTACT NUMBER"] || rowData["contact number"] || "",
                        user_registered: formattedDate || new Date().toISOString(),
                        user_upline_id: undefined,
                        user_level: undefined,
                        user_status: 1,
                        retailer_count: retailerCount,
                    }

                    parsedRows.push(formattedRow)
                }

                if (rowErrors.length > 0) {
                    setErrors(rowErrors)
                } else {
                    setErrors([])
                }

                setParsedData(parsedRows)
                setEditableData(parsedRows)

                if (parsedRows.length > 0) {
                    setStep("preview")
                }
            } catch (error) {
                console.error("Error parsing CSV:", error)
                setErrors(["Failed to parse CSV file. Please check the format."])
            }
        }

        reader.readAsText(file)
    }

    const handleUplineSelect = (userId: number) => {
        const uplineUser = allUsers.find((user) => user.ID === userId)
        setSelectedUplineId(userId)
        setSelectedUplineUser(uplineUser)
        setIsSearchOpen(false)
    }

    const handleEditRow = (index: number) => {
        setEditingRow(index)
        setEditFormData({ ...editableData[index] })
    }

    const handleDeleteRow = (index: number) => {
        const newData = [...editableData]
        newData.splice(index, 1)
        setEditableData(newData)
        setValidationResults(null)
    }

    const handleSaveEdit = () => {
        if (editingRow === null || !editFormData) return

        const newData = [...editableData]
        newData[editingRow] = editFormData
        setEditableData(newData)
        setEditingRow(null)
        setEditFormData(null)
        setValidationResults(null)
    }

    const handleCancelEdit = () => {
        setEditingRow(null)
        setEditFormData(null)
    }

    const handleEditFormChange = (field: keyof BulkUserInput, value: any) => {
        if (!editFormData) return
        setEditFormData({
            ...editFormData,
            [field]: value,
        })
    }

    const handleRetailerCountChange = (role: string, value: number) => {
        setRetailerCounts((prev) => ({
            ...prev,
            [role]: value,
        }))
        // Update editableData with new retailer counts
        setEditableData((prev) =>
            prev.map((user) => ({
                ...user,
                retailer_count: user.user_role === role ? value : user.retailer_count,
            }))
        )
    }

    const validateData = async () => {
        setIsValidating(true)

        try {
            const dataWithUpline = editableData.map((user) => ({
                ...user,
                user_upline_id: selectedUplineId || undefined,
                user_level:
                    selectedUplineUser && selectedUplineUser.user_level !== null && selectedUplineUser.user_level !== undefined
                        ? selectedUplineUser.user_level + 1
                        : undefined,
            }))

            const results = await validateBulkUsers(dataWithUpline)
            setValidationResults(results.data)

            if (results.data.valid.length === 0) {
                toast({
                    title: "Validation Failed",
                    description: "No valid users found. Please check your data.",
                    variant: "destructive",
                })
            } else {
                setStep("review")
                setActiveTab("all")
            }
        } catch (error) {
            console.error("Validation error:", error)
            toast({
                title: "Validation Error",
                description: "An error occurred during validation.",
                variant: "destructive",
            })
        } finally {
            setIsValidating(false)
        }
    }

    const handleSubmit = async () => {
        if (!validationResults || validationResults.valid.length === 0) {
            toast({
                title: "No valid data",
                description: "Please validate your data first.",
                variant: "destructive",
            })
            return
        }

        setIsUploading(true)
        setStep("processing")
    }

    const handleDownloadTemplate = () => {
        try {
            const headers = [
                "ACCOUNT TYPE",
                "MID",
                "TID",
                "STORE NAME",
                "ADDRESS",
                "NAME",
                "CONTACT NUMBER",
                "EMAIL ADDRESS",
                "DATE JOINED",
                "REMARKS",
            ]

            const sampleRows = [
                [
                    "BASIC MERCHANT ACCOUNT",
                    "M12345",
                    "T67890",
                    "Sample Store",
                    "123 Main St, City",
                    "John Doe",
                    "1234567890",
                    "email@example.com",
                    "2023-01-01",
                    "Sample remarks",
                ],
                [
                    "PREMIUM MERCHANT ACCOUNT",
                    "M54321",
                    "T09876",
                    "Premium Store",
                    "456 High St, Town",
                    "Jane Smith",
                    "0987654321",
                    "jane@example.com",
                    "2023-02-15",
                    "Premium user",
                ],
                [
                    "ELITE DISTRIBUTOR ACCOUNT",
                    "M98765",
                    "T12345",
                    "Elite Business",
                    "789 Elite Ave, City",
                    "Robert Johnson",
                    "5551234567",
                    "robert@example.com",
                    "2023-03-20",
                    "Elite distributor",
                ],
            ]

            const csvContent = [
                headers.join(","),
                ...sampleRows.map((row) => row.map((value) => `"${value}"`).join(",")),
            ].join("\n")

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.setAttribute("href", url)
            link.setAttribute("download", `user_upload_template.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast({
                title: "Template Downloaded",
                description: "CSV template has been downloaded successfully.",
            })
        } catch (error) {
            console.error("Error downloading template:", error)
            toast({
                title: "Download Failed",
                description: "Failed to download CSV template.",
                variant: "destructive",
            })
        }
    }

    const prepareTreeData = () => {
        if (!selectedUplineUser) return { name: "No upline selected", children: [] }

        const rootNode: any = {
            name: selectedUplineUser.user_nicename || selectedUplineUser.user_email || `User #${selectedUplineUser.ID}`,
            attributes: {
                role: selectedUplineUser.user_role || "Unknown",
                level: selectedUplineUser.user_level !== null ? selectedUplineUser.user_level : 0,
                email: selectedUplineUser.user_email || "No email",
                id: selectedUplineUser.ID,
            },
            children: [],
        }

        if (editableData.length > 0) {
            const usersByRole: Record<string, BulkUserInput[]> = {}

            editableData.forEach((user) => {
                const role = user.user_role || "Basic_Merchant_Package"
                if (!usersByRole[role]) {
                    usersByRole[role] = []
                }
                usersByRole[role].push(user)
            })

            Object.entries(usersByRole).forEach(([role, users]) => {
                const roleNode = {
                    name: role.replace(/_/g, " "),
                    attributes: {
                        count: users.length,
                        role: role,
                    },
                    children: users.map((user) => ({
                        name: user.user_nicename,
                        attributes: {
                            email: user.user_email,
                            business: user.business_name || "No business name",
                            level: (selectedUplineUser.user_level !== null ? selectedUplineUser.user_level : 0) + 1,
                        },
                    })),
                }

                rootNode.children.push(roleNode)
            })
        }

        return rootNode
    }

    const renderCustomNode = ({ nodeDatum, toggleNode }: any) => {
        const isRoot = !nodeDatum.parent
        const isRoleGroup = nodeDatum.attributes?.count !== undefined

        let bgColor = "#f3f4f6"
        let textColor = "#111827"
        let borderColor = "#d1d5db"

        if (isRoot) {
            bgColor = selectedTheme.primary + "20"
            borderColor = selectedTheme.primary
            textColor = selectedTheme.primary
        } else if (isRoleGroup) {
            const role = nodeDatum.attributes.role
            bgColor = roleColors[role] ? roleColors[role] + "20" : "#f3f4f6"
            borderColor = roleColors[role] || "#d1d5db"
            textColor = roleColors[role] ? roleColors[role] : "#111827"
        }

        return (
            <g>
                <rect
                    width={treeNodeSize.x}
                    height={isRoleGroup ? 60 : treeNodeSize.y}
                    x={-treeNodeSize.x / 2}
                    y={-treeNodeSize.y / 2}
                    rx={8}
                    ry={8}
                    fill={bgColor}
                    stroke={borderColor}
                    strokeWidth={2}
                    onClick={toggleNode}
                    style={{ cursor: "pointer" }}
                />
                <text
                    fill={textColor}
                    x={0}
                    y={-15}
                    textAnchor="middle"
                    style={{
                        fontWeight: isRoot || isRoleGroup ? "600" : "normal",
                        fontSize: isRoot ? 14 : 12,
                        textShadow: "0 0 3px rgba(255,255,255,0.5)",
                    }}
                >
                    {nodeDatum.name}
                </text>

                {isRoot && (
                    <>
                        <text fill={textColor} x={0} y={5} textAnchor="middle" style={{ fontSize: 11, fontWeight: "normal" }}>
                            Level: {nodeDatum.attributes.level}
                        </text>
                        <text fill={textColor} x={0} y={20} textAnchor="middle" style={{ fontSize: 11, fontWeight: "normal" }}>
                            {nodeDatum.attributes?.role ? nodeDatum.attributes.role.replace(/_/g, " ") : "No Role"}
                        </text>
                    </>
                )}

                {isRoleGroup && (
                    <text fill={textColor} x={0} y={5} textAnchor="middle" style={{ fontSize: 11, fontWeight: "normal" }}>
                        {nodeDatum.attributes.count} users
                    </text>
                )}

                {!isRoot && !isRoleGroup && (
                    <text
                        fill={textColor}
                        x={0}
                        y={5}
                        textAnchor="middle"
                        style={{ fontSize: 10, fontWeight: "normal", letterSpacing: "0.2px" }}
                    >
                        {nodeDatum.attributes.email}
                    </text>
                )}
            </g>
        )
    }

    const renderEmailPreview = () => {
        const previewHtml = emailTemplate
            .replace(/{{userName}}/g, previewData.userName)
            .replace(/{{email}}/g, previewData.email)
            .replace(/{{password}}/g, previewData.password)
            .replace(/{{year}}/g, previewData.year)

        return (
            <div className="border rounded-md overflow-hidden bg-white">
                <div className="p-2 bg-muted border-b flex justify-between items-center">
                    <span className="text-sm font-medium">Email Preview</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowEmailPreview(false)} className="h-7 w-7 p-0">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <iframe srcDoc={previewHtml} className="w-full h-[500px] border-0" title="Email Preview" />
            </div>
        )
    }

    const renderStepContent = () => {
        switch (step) {
            case "upload":
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-2 border-primary/20 shadow-md">
                                <CardHeader className="bg-primary/5 pb-2">
                                    <CardTitle className="text-base flex items-center">
                                        <Upload className="h-4 w-4 mr-2 text-primary" />
                                        Upload CSV File
                                    </CardTitle>
                                    <CardDescription>Upload a CSV file with user data</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div
                                            className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:bg-primary/5 transition-colors cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <FileUp className="h-10 w-10 text-primary/50 mx-auto mb-4" />
                                            <p className="text-sm font-medium mb-1">Drag and drop your CSV file here</p>
                                            <p className="text-xs text-muted-foreground">or click to browse</p>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept=".csv"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </div>

                                        {file && (
                                            <div className="flex items-center gap-2 p-3 bg-muted rounded-md animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <FileText className="h-5 w-5 text-primary" />
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium">{file.name}</div>
                                                    <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setFile(null)
                                                        setParsedData([])
                                                        setEditableData([])
                                                        setErrors([])
                                                        if (fileInputRef.current) fileInputRef.current.value = ""
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t pt-4">
                                    <Button variant="outline" onClick={handleDownloadTemplate}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Download Template
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (parsedData.length > 0) {
                                                setStep("preview")
                                            } else {
                                                toast({
                                                    title: "No data found",
                                                    description: "Please upload a valid CSV file with user data.",
                                                    variant: "destructive",
                                                })
                                            }
                                        }}
                                        disabled={parsedData.length === 0}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview Data
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card>
                                <CardHeader className="bg-muted/50 pb-2">
                                    <CardTitle className="text-base flex items-center">
                                        <Info className="h-4 w-4 mr-2 text-primary" />
                                        CSV Format Guide
                                    </CardTitle>
                                    <CardDescription>Required format for the CSV file</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2 flex items-center">
                                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                            Required Headers
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Badge
                                                variant="outline"
                                                className="justify-start bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800"
                                            >
                                                NAME
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="justify-start bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800"
                                            >
                                                EMAIL ADDRESS
                                            </Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold mb-2 flex items-center">
                                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                            Optional Headers
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Badge variant="outline" className="justify-start">
                                                ACCOUNT TYPE
                                            </Badge>
                                            <Badge variant="outline" className="justify-start">
                                                MID
                                            </Badge>
                                            <Badge variant="outline" className="justify-start">
                                                TID
                                            </Badge>
                                            <Badge variant="outline" className="justify-start">
                                                STORE NAME
                                            </Badge>
                                            <Badge variant="outline" className="justify-start">
                                                ADDRESS
                                            </Badge>
                                            <Badge variant="outline" className="justify-start">
                                                CONTACT NUMBER
                                            </Badge>
                                            <Badge variant="outline" className="justify-start">
                                                DATE JOINED
                                            </Badge>
                                            <Badge variant="outline" className="justify-start">
                                                REMARKS
                                            </Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold mb-2 flex items-center">
                                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            Account Types
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                <span className="text-xs">BASIC MERCHANT ACCOUNT</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                                <span className="text-xs">PREMIUM MERCHANT ACCOUNT</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                                                <span className="text-xs">ELITE DISTRIBUTOR ACCOUNT</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                <span className="text-xs">ELITE PLUS DISTRIBUTOR ACCOUNT</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Alert className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-xs">
                                            Passwords will be automatically generated for each user. You can view them in the welcome emails.
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </div>

                        {errors.length > 0 && (
                            <Alert variant="destructive" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="font-medium mb-1">Errors found in CSV file:</div>
                                    <ScrollArea className="h-[100px]">
                                        <ul className="list-disc pl-5 space-y-1">
                                            {errors.map((error, index) => (
                                                <li key={index} className="text-sm">
                                                    {error}
                                                </li>
                                            ))}
                                        </ul>
                                    </ScrollArea>
                                </AlertDescription>
                            </Alert>
                        )}
                    </motion.div>
                )

            case "processing":
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <Card className="border-2 border-primary/20 shadow-md">
                            <CardHeader className="bg-primary/5 pb-2">
                                <CardTitle className="text-base flex items-center">
                                    {/* Only show spinner when actually uploading */}
                                    {/* {isUploading ? (
                                        <Loader2 className="h-4 w-4 mr-2 text-primary animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                                    )} */}
                                    {isUploading ? "Processing Upload" : "Ready to Upload"}
                                </CardTitle>
                                <CardDescription>
                                    {isUploading
                                        ? `Uploading ${validationResults?.valid.length || 0} users to the database`
                                        : `Ready to upload ${validationResults?.valid.length || 0} users to the database`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <BulkUploadClient
                                    users={validationResults?.valid || []}
                                    shouldSendWelcomeEmail={sendWelcomeEmail}
                                    emailTemplate={emailTemplate}
                                    antiSpamFeatures={antiSpamFeatures}
                                    batchSize={5}
                                    onComplete={(results: any) => {
                                        setUploadResults(results)
                                        setUploadProgress(100)
                                        setTimeout(() => {
                                            onSuccess(results.success)
                                            onOpenChange(false)
                                        }, 1000)
                                    }}
                                />

                                <div className="bg-muted p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium">Upload Details</span>
                                    </div>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex justify-between">
                                            <span className="text-muted-foreground">Total Users:</span>
                                            <span>{validationResults?.valid.length || 0}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-muted-foreground">Upline User:</span>
                                            <span>{selectedUplineUser ? selectedUplineUser.user_nicename : "None"}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-muted-foreground">User Level:</span>
                                            <span>
                                                {selectedUplineUser
                                                    ? (selectedUplineUser.user_level !== null ? selectedUplineUser.user_level : 0) + 1
                                                    : "Default (0)"}
                                            </span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-muted-foreground">Send Welcome Email:</span>
                                            <span>{sendWelcomeEmail ? "Yes" : "No"}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-muted-foreground">Anti-Spam Features:</span>
                                            <span>{Object.values(antiSpamFeatures).filter(Boolean).length} enabled</span>
                                        </li>
                                    </ul>
                                </div>

                                {uploadProgress === 100 && (
                                    <Alert className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <AlertDescription>
                                            Upload completed successfully! The dialog will close automatically.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )

            case "preview":
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <Card className="border-2 border-primary/20 shadow-md">
                            <CardHeader className="bg-primary/5 pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-base flex items-center">
                                        <Eye className="h-4 w-4 mr-2 text-primary" />
                                        Preview Data
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                        {editableData.length} users
                                    </Badge>
                                </div>
                                <CardDescription>Review and edit the data before uploading</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[400px]">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background z-10">
                                            <TableRow>
                                                <TableHead className="w-[50px]">#</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Account Type</TableHead>
                                                <TableHead>MID</TableHead>
                                                <TableHead>Business Name</TableHead>
                                                <TableHead>Retailers</TableHead>
                                                <TableHead>Password</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {editableData.length > 0 ? (
                                                editableData.map((row, index) => (
                                                    <TableRow key={index} className={editingRow === index ? "bg-muted" : ""}>
                                                        {editingRow === index ? (
                                                            <>
                                                                <TableCell>{index + 1}</TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        value={editFormData?.user_nicename || ""}
                                                                        onChange={(e) => handleEditFormChange("user_nicename", e.target.value)}
                                                                        className="w-full"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        value={editFormData?.user_email || ""}
                                                                        onChange={(e) => handleEditFormChange("user_email", e.target.value)}
                                                                        className="w-full"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Select
                                                                        value={editFormData?.user_role || "Basic_Merchant_Package"}
                                                                        onValueChange={(value: string) => handleEditFormChange("user_role", value)}
                                                                    >
                                                                        <SelectTrigger className="w-full">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Basic_Merchant_Package">Basic Merchant Package</SelectItem>
                                                                            <SelectItem value="Premium_Merchant_Package">Premium Merchant Package</SelectItem>
                                                                            <SelectItem value="Elite_Distributor_Package">
                                                                                Elite Distributor Package
                                                                            </SelectItem>
                                                                            <SelectItem value="Elite_Plus_Distributor_Package">
                                                                                Elite Plus Distributor Package
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        value={editFormData?.merchant_id || ""}
                                                                        onChange={(e) => handleEditFormChange("merchant_id", e.target.value)}
                                                                        className="w-full"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        value={editFormData?.business_name || ""}
                                                                        onChange={(e) => handleEditFormChange("business_name", e.target.value)}
                                                                        className="w-full"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        type="number"
                                                                        value={retailerCounts[editFormData?.user_role || "Basic_Merchant_Package"] || 0}
                                                                        disabled
                                                                        className="w-full"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="text-xs text-muted-foreground">(Auto-generated)</div>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button size="sm" onClick={handleSaveEdit}>
                                                                            <Check className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <TableCell>{index + 1}</TableCell>
                                                                <TableCell>{row.user_nicename}</TableCell>
                                                                <TableCell>{row.user_email}</TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="capitalize"
                                                                        style={{
                                                                            backgroundColor: roleColors[row.user_role || "Basic_Merchant_Package"] + "20",
                                                                            color: roleColors[row.user_role || "Basic_Merchant_Package"],
                                                                            borderColor: roleColors[row.user_role || "Basic_Merchant_Package"] + "50",
                                                                        }}
                                                                    >
                                                                        {row.user_role?.replace(/_/g, " ").toLowerCase() || "Basic"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>{row.merchant_id || "-"}</TableCell>
                                                                <TableCell>{row.business_name || "-"}</TableCell>
                                                                <TableCell>{row.retailer_count || 0}</TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="text-xs bg-muted px-2 py-1 rounded">Auto-generated</div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button size="sm" variant="ghost" onClick={() => handleEditRow(index)}>
                                                                                        <Edit className="h-4 w-4" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>Edit user</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteRow(index)}>
                                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>Delete user</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    </div>
                                                                </TableCell>
                                                            </>
                                                        )}
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="h-24 text-center">
                                                        No data available
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-4">
                                <Button variant="outline" onClick={() => setStep("upload")}>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setStep("retailer-settings")}>
                                        Retailer Settings
                                    </Button>
                                    <Button onClick={() => setStep("upline")} disabled={editableData.length === 0}>
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )

            case "retailer-settings":
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <Card className="border-2 border-primary/20 shadow-md">
                            <CardHeader className="bg-primary/5 pb-2">
                                <CardTitle className="text-base flex items-center">
                                    <Users className="h-4 w-4 mr-2 text-primary" />
                                    Retailer Count Settings
                                </CardTitle>
                                <CardDescription>Configure the number of retailers for each account type</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="basic-retailers">Basic Merchant Package</Label>
                                        <Input
                                            id="basic-retailers"
                                            type="number"
                                            min="0"
                                            value={retailerCounts.Basic_Merchant_Package}
                                            onChange={(e) => handleRetailerCountChange("Basic_Merchant_Package", Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="premium-retailers">Premium Merchant Package</Label>
                                        <Input
                                            id="premium-retailers"
                                            type="number"
                                            min="0"
                                            value={retailerCounts.Premium_Merchant_Package}
                                            onChange={(e) => handleRetailerCountChange("Premium_Merchant_Package", Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="elite-retailers">Elite Distributor Package</Label>
                                        <Input
                                            id="elite-retailers"
                                            type="number"
                                            min="0"
                                            value={retailerCounts.Elite_Distributor_Package}
                                            onChange={(e) => handleRetailerCountChange("Elite_Distributor_Package", Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="elite-plus-retailers">Elite Plus Distributor Package</Label>
                                        <Input
                                            id="elite-plus-retailers"
                                            type="number"
                                            min="0"
                                            value={retailerCounts.Elite_Plus_Distributor_Package}
                                            onChange={(e) => handleRetailerCountChange("Elite_Plus_Distributor_Package", Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                <Alert className="bg-primary/10 border-primary/30">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        These settings will apply to all users in the current upload batch and will be saved for this session.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-4">
                                <Button variant="outline" onClick={() => setStep("preview")}>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <Button onClick={() => setStep("preview")}>
                                    Save Settings
                                    <Check className="h-4 w-4 ml-2" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )

            case "upline":
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <Card className="border-2 border-primary/20 shadow-md">
                            <CardHeader className="bg-primary/5 pb-2">
                                <CardTitle className="text-base flex items-center">
                                    <Users className="h-4 w-4 mr-2 text-primary" />
                                    Select Upline User (Optional)
                                </CardTitle>
                                <CardDescription>Choose a user to set as upline for all imported users</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, email, or business name..."
                                        value={uplineSearchTerm}
                                        onChange={(e) => setUplineSearchTerm(e.target.value)}
                                        className="pl-8"
                                        onClick={() => setIsSearchOpen(true)}
                                    />
                                    {isSearchOpen && (
                                        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
                                            <CardContent className="p-0">
                                                <Command>
                                                    <CommandList>
                                                        <CommandInput
                                                            placeholder="Search users..."
                                                            value={uplineSearchTerm}
                                                            onValueChange={setUplineSearchTerm}
                                                        />
                                                        <CommandEmpty>No users found</CommandEmpty>
                                                        <CommandGroup>
                                                            {filteredUsers.map((user) => (
                                                                <CommandItem
                                                                    key={user.ID}
                                                                    onSelect={() => handleUplineSelect(user.ID)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{user.user_nicename || user.user_email}</span>
                                                                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                                                                            <span>{user.user_email}</span>
                                                                            {user.user_role && (
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="text-[10px] h-4"
                                                                                    style={{
                                                                                        backgroundColor: roleColors[user.user_role]
                                                                                            ? roleColors[user.user_role] + "20"
                                                                                            : undefined,
                                                                                        color: roleColors[user.user_role] || undefined,
                                                                                        borderColor: roleColors[user.user_role]
                                                                                            ? roleColors[user.user_role] + "50"
                                                                                            : undefined,
                                                                                    }}
                                                                                >
                                                                                    {user.user_role.replace(/_/g, " ")}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {selectedUplineUser ? (
                                    <Card className="bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="text-base">Selected Upline</CardTitle>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedUplineId(null)
                                                        setSelectedUplineUser(null)
                                                        setUplineSearchTerm("")
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium">Name:</span>
                                                    <span>{selectedUplineUser.user_nicename}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium">Email:</span>
                                                    <span>{selectedUplineUser.user_email}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium">Role:</span>
                                                    <Badge
                                                        variant="outline"
                                                        style={{
                                                            backgroundColor: roleColors[selectedUplineUser.user_role]
                                                                ? roleColors[selectedUplineUser.user_role] + "20"
                                                                : undefined,
                                                            color: roleColors[selectedUplineUser.user_role] || undefined,
                                                            borderColor: roleColors[selectedUplineUser.user_role]
                                                                ? roleColors[selectedUplineUser.user_role] + "50"
                                                                : undefined,
                                                        }}
                                                    >
                                                        {selectedUplineUser.user_role?.replace(/_/g, " ") || "N/A"}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium">Level:</span>
                                                    <span>{selectedUplineUser.user_level !== null ? selectedUplineUser.user_level : "N/A"}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="bg-muted/50 p-4 rounded-lg border border-dashed border-muted-foreground/20 text-center">
                                        <p className="text-sm text-muted-foreground">No upline selected</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Users will be imported without an upline relationship
                                        </p>
                                    </div>
                                )}

                                <Button
                                    variant={showUplinePreview ? "default" : "outline"}
                                    className="w-full"
                                    onClick={() => setShowUplinePreview(!showUplinePreview)}
                                    disabled={!selectedUplineUser}
                                >
                                    {showUplinePreview ? "Hide" : "Show"} Upline Relationship Preview
                                    {showUplinePreview ? (
                                        <ChevronLeft className="h-4 w-4 ml-2" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    )}
                                </Button>

                                {showUplinePreview && selectedUplineUser && (
                                    <div className="border rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="bg-muted p-2 flex justify-between items-center border-b">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">Organization Tree</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {editableData.length} users
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() =>
                                                        setTreeOrientation((prev) => (prev === "vertical" ? "horizontal" : "vertical"))
                                                    }
                                                >
                                                    {treeOrientation === "vertical" ? (
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                                                >
                                                    {isFullscreenPreview ? (
                                                        <Minimize className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <Maximize className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="sm" className="w-full rounded-none border-b flex justify-between">
                                                    <span className="text-xs">Advanced Options</span>
                                                    <ChevronRight
                                                        className={`h-4 w-4 transition-transform ${showAdvancedOptions ? "rotate-90" : ""}`}
                                                    />
                                                </Button>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="p-3 bg-muted/30 border-b space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Label htmlFor="nodeWidth" className="text-xs">
                                                                Node Width
                                                            </Label>
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    id="nodeWidth"
                                                                    type="number"
                                                                    value={treeNodeSize.x}
                                                                    onChange={(e) => setTreeNodeSize((prev) => ({ ...prev, x: Number(e.target.value) }))}
                                                                    className="h-7"
                                                                    min={100}
                                                                    max={400}
                                                                />
                                                                <span className="text-xs text-muted-foreground">px</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label htmlFor="nodeHeight" className="text-xs">
                                                                Node Height
                                                            </Label>
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    id="nodeHeight"
                                                                    type="number"
                                                                    value={treeNodeSize.y}
                                                                    onChange={(e) => setTreeNodeSize((prev) => ({ ...prev, y: Number(e.target.value) }))}
                                                                    className="h-7"
                                                                    min={50}
                                                                    max={200}
                                                                />
                                                                <span className="text-xs text-muted-foreground">px</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Color Theme</Label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {colorThemes.map((theme, index) => (
                                                                <Button
                                                                    key={index}
                                                                    type="button"
                                                                    variant="outline"
                                                                    className={`h-8 px-2 ${selectedTheme.name === theme.name ? "ring-2 ring-primary ring-offset-2" : ""}`}
                                                                    style={{ backgroundColor: theme.background }}
                                                                    onClick={() => setSelectedTheme(theme)}
                                                                >
                                                                    <div className="flex items-center gap-1">
                                                                        <div
                                                                            className="w-3 h-3 rounded-full"
                                                                            style={{ backgroundColor: theme.primary }}
                                                                        ></div>
                                                                        <span className="text-xs" style={{ color: theme.primary }}>
                                                                            {theme.name}
                                                                        </span>
                                                                    </div>
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>

                                        <div
                                            className={`relative ${isFullscreenPreview ? "fixed inset-0 z-50 bg-background/95 p-6" : "h-[400px]"}`}
                                            ref={treeContainerRef}
                                        >
                                            {isFullscreenPreview && (
                                                <div className="absolute top-4 right-4 flex gap-2 z-10">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => setIsFullscreenPreview(false)}
                                                        className="h-8 w-8"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}

                                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-background/80 p-2 rounded-full shadow-md z-10">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.1))}
                                                    className="h-8 w-8 rounded-full"
                                                >
                                                    <ZoomOut className="h-4 w-4" />
                                                </Button>
                                                <span className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setZoomLevel((prev) => Math.min(2, prev + 0.1))}
                                                    className="h-8 w-8 rounded-full"
                                                >
                                                    <ZoomIn className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => setZoomLevel(1)} className="h-8 text-xs">
                                                    <RefreshCw className="h-3 w-3 mr-1" />
                                                    Reset
                                                </Button>
                                            </div>

                                            <div className="w-full h-full">
                                                {typeof window !== "undefined" && (
                                                    <Tree
                                                        data={prepareTreeData()}
                                                        orientation={treeOrientation}
                                                        translate={{ x: treeTranslate.x, y: treeTranslate.y }}
                                                        nodeSize={treeNodeSize}
                                                        separation={{ siblings: 2, nonSiblings: 2.5 }}
                                                        zoom={zoomLevel}
                                                        renderCustomNodeElement={renderCustomNode}
                                                        pathClassFunc={() => "stroke-primary/50 stroke-2"}
                                                        enableLegacyTransitions={true}
                                                        transitionDuration={800}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <Alert className={selectedUplineUser ? "bg-primary/10 border-primary/30" : "bg-muted"}>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        {selectedUplineUser ? (
                                            <>
                                                All imported users will have <strong>{selectedUplineUser.user_nicename}</strong> as their
                                                upline. Their level will be set to{" "}
                                                <strong>
                                                    {(selectedUplineUser.user_level !== null ? selectedUplineUser.user_level : 0) + 1}
                                                </strong>
                                                .
                                            </>
                                        ) : (
                                            <>No upline selected. Users will be imported without an upline relationship.</>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-4">
                                <Button variant="outline" onClick={() => setStep("preview")}>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setStep("email-template")}>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Email Template
                                    </Button>
                                    <Button
                                        onClick={validateData}
                                        disabled={isValidating || editableData.length === 0 || !selectedUplineUser}
                                    >
                                        {isValidating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Validating...
                                            </>
                                        ) : (
                                            <>
                                                Validate & Review
                                                <ChevronRight className="h-4 w-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )

            case "email-template":
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <Card className="border-2 border-primary/20 shadow-md">
                            <CardHeader className="bg-primary/5 pb-2">
                                <CardTitle className="text-base flex items-center">
                                    <Mail className="h-4 w-4 mr-2 text-primary" />
                                    Email Template Editor
                                </CardTitle>
                                <CardDescription>Customize the welcome email template sent to new users</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        <p>You can use the following placeholders in your template:</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                            <li>
                                                <code>{"{{userName}}"}</code> - User's name
                                            </li>
                                            <li>
                                                <code>{"{{email}}"}</code> - User's email address
                                            </li>
                                            <li>
                                                <code>{"{{password}}"}</code> - Generated password
                                            </li>
                                            <li>
                                                <code>{"{{year}}"}</code> - Current year
                                            </li>
                                        </ul>
                                    </AlertDescription>
                                </Alert>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-medium">HTML Template Editor</h3>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEmailTemplate(defaultEmailTemplate)}
                                                    className="text-xs h-7"
                                                >
                                                    Reset to Default
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowEmailPreview(!showEmailPreview)}
                                                    className="text-xs h-7"
                                                >
                                                    {showEmailPreview ? "Hide Preview" : "Show Preview"}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="border rounded-md h-[500px] overflow-hidden">
                                            <CodeEditor value={emailTemplate} onChange={setEmailTemplate} language="html" theme="vs-light" />
                                        </div>
                                    </div>

                                    {showEmailPreview && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-sm font-medium">Preview Settings</h3>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setPreviewData({
                                                            userName: "John Doe",
                                                            email: "john.doe@example.com",
                                                            password: "12345",
                                                            year: new Date().getFullYear().toString(),
                                                        })
                                                    }
                                                    className="text-xs h-7"
                                                >
                                                    <RefreshCw className="h-3 w-3 mr-1" />
                                                    Reset
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label htmlFor="previewName" className="text-xs">
                                                        Name
                                                    </Label>
                                                    <Input
                                                        id="previewName"
                                                        value={previewData.userName}
                                                        onChange={(e) => setPreviewData({ ...previewData, userName: e.target.value })}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="previewEmail" className="text-xs">
                                                        Email
                                                    </Label>
                                                    <Input
                                                        id="previewEmail"
                                                        value={previewData.email}
                                                        onChange={(e) => setPreviewData({ ...previewData, email: e.target.value })}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="previewPassword" className="text-xs">
                                                        Password
                                                    </Label>
                                                    <Input
                                                        id="previewPassword"
                                                        value={previewData.password}
                                                        onChange={(e) => setPreviewData({ ...previewData, password: e.target.value })}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="previewYear" className="text-xs">
                                                        Year
                                                    </Label>
                                                    <Input
                                                        id="previewYear"
                                                        value={previewData.year}
                                                        onChange={(e) => setPreviewData({ ...previewData, year: e.target.value })}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {renderEmailPreview()}
                                        </div>
                                    )}
                                </div>

                                <Separator className="my-4" />

                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium flex items-center">
                                        <Sparkles className="h-4 w-4 mr-2 text-primary" />
                                        Anti-Spam Measures
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Enable these features to help prevent your emails from being marked as spam by email providers.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between space-x-2">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="dkim">DKIM Authentication</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Digitally signs emails to verify sender identity
                                                </p>
                                            </div>
                                            <Switch
                                                id="dkim"
                                                checked={antiSpamFeatures.dkim}
                                                onCheckedChange={(checked) => setAntiSpamFeatures({ ...antiSpamFeatures, dkim: checked })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between space-x-2">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="spf">SPF Records</Label>
                                                <p className="text-xs text-muted-foreground">Verifies sending server is authorized</p>
                                            </div>
                                            <Switch
                                                id="spf"
                                                checked={antiSpamFeatures.spf}
                                                onCheckedChange={(checked) => setAntiSpamFeatures({ ...antiSpamFeatures, spf: checked })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between space-x-2">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="personalized">Personalized Subject</Label>
                                                <p className="text-xs text-muted-foreground">Includes recipient's name in email subject</p>
                                            </div>
                                            <Switch
                                                id="personalized"
                                                checked={antiSpamFeatures.personalizedSubject}
                                                onCheckedChange={(checked) =>
                                                    setAntiSpamFeatures({ ...antiSpamFeatures, personalizedSubject: checked })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between space-x-2">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="unsubscribe">Unsubscribe Link</Label>
                                                <p className="text-xs text-muted-foreground">Adds unsubscribe option in email footer</p>
                                            </div>
                                            <Switch
                                                id="unsubscribe"
                                                checked={antiSpamFeatures.unsubscribeLink}
                                                onCheckedChange={(checked) =>
                                                    setAntiSpamFeatures({ ...antiSpamFeatures, unsubscribeLink: checked })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between space-x-2">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="plaintext">Plain Text Alternative</Label>
                                                <p className="text-xs text-muted-foreground">Includes plain text version alongside HTML</p>
                                            </div>
                                            <Switch
                                                id="plaintext"
                                                checked={antiSpamFeatures.plainTextAlternative}
                                                onCheckedChange={(checked) =>
                                                    setAntiSpamFeatures({ ...antiSpamFeatures, plainTextAlternative: checked })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-4">
                                <Button variant="outline" onClick={() => setStep("upline")}>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <Button onClick={() => setStep("upline")}>
                                    Save Template
                                    <Check className="h-4 w-4 ml-2" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )

            case "review":
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <Card className="border-2 border-primary/20 shadow-md">
                            <CardHeader className="bg-primary/5 pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-base flex items-center">
                                        <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                                        Review & Confirm
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Badge
                                            variant="outline"
                                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                        >
                                            {validationResults?.valid.length || 0} Valid
                                        </Badge>
                                        {validationResults?.invalid.length > 0 && (
                                            <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                                {validationResults.invalid.length} Invalid
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CardDescription>Review the validated data before final upload</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "valid" | "invalid")}>
                                    <div className="border-b px-4">
                                        <TabsList className="h-10">
                                            <TabsTrigger value="all" className="data-[state=active]:bg-background">
                                                All Users
                                            </TabsTrigger>
                                            <TabsTrigger value="valid" className="data-[state=active]:bg-background">
                                                Valid Users
                                            </TabsTrigger>
                                            {validationResults?.invalid.length > 0 && (
                                                <TabsTrigger value="invalid" className="data-[state=active]:bg-background">
                                                    Invalid Users
                                                </TabsTrigger>
                                            )}
                                        </TabsList>
                                    </div>

                                    <TabsContent value="all" className="m-0">
                                        <ScrollArea className="h-[350px]">
                                            <Table>
                                                <TableHeader className="sticky top-0 bg-background z-10">
                                                    <TableRow>
                                                        <TableHead className="w-[50px]">#</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Email</TableHead>
                                                        <TableHead>Account Type</TableHead>
                                                        <TableHead>MID</TableHead>
                                                        <TableHead>Error</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {validationResults ? (
                                                        [
                                                            ...validationResults.valid,
                                                            ...validationResults.invalid.map((item: any) => item.user),
                                                        ].map((user, index) => {
                                                            const error = validationResults.invalid.find(
                                                                (item: any) => item.user.user_email === user.user_email,
                                                            )?.error
                                                            const isValid = !error

                                                            return (
                                                                <TableRow key={index} className={isValid ? "" : "bg-red-50/50 dark:bg-red-950/20"}>
                                                                    <TableCell>{index + 1}</TableCell>
                                                                    <TableCell>
                                                                        {isValid ? (
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                                            >
                                                                                <Check className="h-3 w-3 mr-1" />
                                                                                Valid
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                                                            >
                                                                                <X className="h-3 w-3 mr-1" />
                                                                                Invalid
                                                                            </Badge>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>{user.user_nicename}</TableCell>
                                                                    <TableCell>{user.user_email}</TableCell>
                                                                    <TableCell>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="capitalize"
                                                                            style={{
                                                                                backgroundColor: roleColors[user.user_role || "Basic_Merchant_Package"] + "20",
                                                                                color: roleColors[user.user_role || "Basic_Merchant_Package"],
                                                                                borderColor: roleColors[user.user_role || "Basic_Merchant_Package"] + "50",
                                                                            }}
                                                                        >
                                                                            {user.user_role?.replace(/_/g, " ").toLowerCase() || "Basic"}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell>{user.merchant_id || "-"}</TableCell>
                                                                    <TableCell>
                                                                        {error && (
                                                                            <Popover>
                                                                                <PopoverTrigger asChild>
                                                                                    <Button variant="ghost" size="sm" className="text-red-500 h-7 px-2">
                                                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                                                        View Error
                                                                                    </Button>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-80">
                                                                                    <div className="text-sm font-medium mb-1">Validation Error</div>
                                                                                    <div className="text-xs text-muted-foreground">{error}</div>
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        })
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={7} className="h-24 text-center">
                                                                No validation results available
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </TabsContent>

                                    <TabsContent value="valid" className="m-0">
                                        <ScrollArea className="h-[350px]">
                                            <Table>
                                                <TableHeader className="sticky top-0 bg-background z-10">
                                                    <TableRow>
                                                        <TableHead className="w-[50px]">#</TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Email</TableHead>
                                                        <TableHead>Account Type</TableHead>
                                                        <TableHead>MID</TableHead>
                                                        <TableHead>Business Name</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {validationResults?.valid.length > 0 ? (
                                                        validationResults.valid.map((user: any, index: any) => (
                                                            <TableRow key={index}>
                                                                <TableCell>{index + 1}</TableCell>
                                                                <TableCell>{user.user_nicename}</TableCell>
                                                                <TableCell>{user.user_email}</TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="capitalize"
                                                                        style={{
                                                                            backgroundColor: roleColors[user.user_role || "Basic_Merchant_Package"] + "20",
                                                                            color: roleColors[user.user_role || "Basic_Merchant_Package"],
                                                                            borderColor: roleColors[user.user_role || "Basic_Merchant_Package"] + "50",
                                                                        }}
                                                                    >
                                                                        {user.user_role?.replace(/_/g, " ").toLowerCase() || "basic"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>{user.merchant_id || "-"}</TableCell>
                                                                <TableCell>{user.business_name || "-"}</TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="h-24 text-center">
                                                                No valid users found
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </TabsContent>

                                    <TabsContent value="invalid" className="m-0">
                                        <ScrollArea className="h-[350px]">
                                            <Table>
                                                <TableHeader className="sticky top-0 bg-background z-10">
                                                    <TableRow>
                                                        <TableHead className="w-[50px]">#</TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Email</TableHead>
                                                        <TableHead>Account Type</TableHead>
                                                        <TableHead>Error</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {validationResults?.invalid.length > 0 ? (
                                                        validationResults.invalid.map((item: any, index: any) => (
                                                            <TableRow key={index} className="bg-red-50/50 dark:bg-red-950/20">
                                                                <TableCell>{index + 1}</TableCell>
                                                                <TableCell>{item.user.user_nicename}</TableCell>
                                                                <TableCell>{item.user.user_email}</TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="capitalize"
                                                                        style={{
                                                                            backgroundColor:
                                                                                roleColors[item.user.user_role || "Basic_Merchant_Package"] + "20",
                                                                            color: roleColors[item.user.user_role || "Basic_Merchant_Package"],
                                                                            borderColor: roleColors[item.user.user_role || "Basic_Merchant_Package"] + "50",
                                                                        }}
                                                                    >
                                                                        {item.user.user_role?.replace(/_/g, " ").toLowerCase() || "Basic"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="text-xs text-red-600 dark:text-red-400">{item.error}</div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="h-24 text-center">
                                                                No invalid users found
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                            <div className="px-6 pb-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="send-welcome-email"
                                        checked={sendWelcomeEmail}
                                        onCheckedChange={(checked) => setSendWelcomeEmail(checked === true)}
                                    />
                                    <Label htmlFor="send-welcome-email" className="text-sm font-medium">
                                        Send welcome email to each user with login credentials
                                    </Label>
                                </div>
                            </div>
                            <CardFooter className="flex justify-between border-t pt-4">
                                <Button variant="outline" onClick={() => setStep("upline")}>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <Button onClick={handleSubmit} disabled={!validationResults || validationResults.valid.length === 0}>
                                    Upload {validationResults?.valid.length || 0} Users
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step === "upload" && (
                            <>
                                <Upload className="h-5 w-5 text-primary" />
                                Bulk Upload Users
                            </>
                        )}
                        {step === "preview" && (
                            <>
                                <Eye className="h-5 w-5 text-primary" />
                                Preview User Data
                            </>
                        )}
                        {step === "upline" && (
                            <>
                                <Users className="h-5 w-5 text-primary" />
                                Select Upline User
                            </>
                        )}
                        {step === "email-template" && (
                            <>
                                <Mail className="h-5 w-5 text-primary" />
                                Email Template Editor
                            </>
                        )}
                        {step === "review" && (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                Review & Confirm
                            </>
                        )}
                        {step === "processing" && (
                            <>
                                {/* {isUploading ? (
                                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                )} */}
                                {isUploading ? "Processing Upload" : "Ready to Upload"}
                            </>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>

                {step !== "processing" && (
                    <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-4 mt-4">
                        <div className="flex items-center gap-1">
                            <Badge
                                variant={step === "upload" ? "default" : "outline"}
                                className="rounded-full h-6 w-6 p-0 flex items-center justify-center"
                            >
                                1
                            </Badge>
                            <div className="h-[2px] w-4 bg-muted-foreground/30"></div>
                            <Badge
                                variant={step === "preview" ? "default" : "outline"}
                                className="rounded-full h-6 w-6 p-0 flex items-center justify-center"
                            >
                                2
                            </Badge>
                            <div className="h-[2px] w-4 bg-muted-foreground/30"></div>
                            <Badge
                                variant={step === "upline" || step === "email-template" ? "default" : "outline"}
                                className="rounded-full h-6 w-6 p-0 flex items-center justify-center"
                            >
                                3
                            </Badge>
                            <div className="h-[2px] w-4 bg-muted-foreground/30"></div>
                            <Badge
                                variant={step === "review" ? "default" : "outline"}
                                className="rounded-full h-6 w-6 p-0 flex items-center justify-center"
                            >
                                4
                            </Badge>
                        </div>

                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}

interface BulkUploadClientProps {
    users: any[]
    shouldSendWelcomeEmail?: boolean
    emailTemplate?: string
    antiSpamFeatures?: {
        dkim: boolean
        spf: boolean
        personalizedSubject: boolean
        unsubscribeLink: boolean
        plainTextAlternative: boolean
    }
    batchSize?: number
    onComplete?: (results: any) => void
}

export function BulkUploadClient({
    users,
    shouldSendWelcomeEmail = false,
    emailTemplate,
    antiSpamFeatures,
    batchSize = 5,
    onComplete,
}: BulkUploadClientProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentBatch, setCurrentBatch] = useState({ current: 0, total: 0 })
    const [results, setResults] = useState<{ success: any[]; failed: any[]; total: number }>({
        success: [],
        failed: [],
        total: 0,
    })
    const { toast } = useToast()

    const handleUpload = async () => {
        if (!users.length) return

        setIsUploading(true)
        setProgress(0)

        const totalBatches = Math.ceil(users.length / batchSize)
        setCurrentBatch({ current: 0, total: totalBatches })

        const uploadResults = {
            success: [] as any[],
            failed: [] as { user: any; error: string }[],
            total: users.length,
        }

        // Process users in batches for UI updates, but upload one at a time
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize)
            const batchNumber = Math.floor(i / batchSize) + 1
            setCurrentBatch({ current: batchNumber, total: totalBatches })

            // Process each user in the batch sequentially
            for (let j = 0; j < batch.length; j++) {
                const user = batch[j]
                const overallIndex = i + j
                const progressPercent = Math.min(Math.round((overallIndex / users.length) * 100), 95)
                setProgress(progressPercent)

                try {
                    const result = await bulkUploadUsers(user, shouldSendWelcomeEmail, emailTemplate, antiSpamFeatures)

                    if (result.success) {
                        uploadResults.success.push(result.data)
                    } else {
                        uploadResults.failed.push({
                            user,
                            error: result.error || "Failed to create user",
                        })
                    }
                } catch (error) {
                    uploadResults.failed.push({
                        user,
                        error: error instanceof Error ? error.message : "Unknown error",
                    })
                }

                // Small delay to prevent UI freezing and allow for progress updates
                await new Promise((resolve) => setTimeout(resolve, 50))
            }
        }

        setProgress(100)
        setResults(uploadResults)

        if (uploadResults.success.length > 0) {
            toast({
                title: "Upload Successful",
                description: `Successfully created ${uploadResults.success.length} out of ${uploadResults.total} users`,
            })
        } else {
            toast({
                title: "Upload Failed",
                description: "Failed to upload users. Please try again.",
                variant: "destructive",
            })
        }

        if (onComplete) {
            onComplete(uploadResults)
        }

        setTimeout(() => {
            setIsUploading(false)
        }, 1000)
    }

    // Only show the upload button if not uploading and there are no results yet
    const showUploadButton = !isUploading && results.success.length === 0 && results.failed.length === 0

    // Only show progress indicators if actively uploading
    const showProgressIndicators = isUploading

    // Only show results if we have them and we're not uploading
    const showResults = !isUploading && (results.success.length > 0 || results.failed.length > 0)

    return (
        <div className="space-y-4">
            {showUploadButton && (
                <Button onClick={handleUpload} disabled={!users.length} className="w-full">
                    Upload {users.length} Users
                </Button>
            )}

            {showProgressIndicators && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Loader2 className="h-4 w-4 text-primary animate-spin" />
                            <span className="text-sm font-medium">Upload Details</span>
                        </div>
                        <ul className="space-y-2 text-sm">
                            <li className="flex justify-between">
                                <span className="text-muted-foreground">Total Users:</span>
                                <span>{users.length}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-muted-foreground">Current Batch:</span>
                                <span>
                                    {currentBatch.current} of {currentBatch.total}
                                </span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-muted-foreground">Processed:</span>
                                <span>
                                    {results.success.length + results.failed.length} of {users.length}
                                </span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-muted-foreground">Successful:</span>
                                <span>{results.success.length}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-muted-foreground">Failed:</span>
                                <span>{results.failed.length}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {showResults && results.success.length > 0 && (
                <Alert className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                        Successfully uploaded {results.success.length} out of {results.total} users.
                    </AlertDescription>
                </Alert>
            )}

            {showResults && results.failed.length > 0 && (
                <div className="space-y-2">
                    <Alert className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{results.failed.length} users failed to upload. See details below.</AlertDescription>
                    </Alert>

                    <div className="max-h-60 overflow-y-auto border rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Error</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {results.failed.map((item, index) => (
                                    <tr key={index} className="bg-white dark:bg-gray-900">
                                        <td className="px-4 py-2 text-sm">{item.user.user_nicename}</td>
                                        <td className="px-4 py-2 text-sm">{item.user.user_email}</td>
                                        <td className="px-4 py-2 text-sm text-red-600 dark:text-red-400">{item.error}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
