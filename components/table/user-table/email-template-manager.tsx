"use client"

import { AlertDialogFooter } from "@/components/ui/alert-dialog"

import { AlertDialogDescription } from "@/components/ui/alert-dialog"

import { AlertDialogTitle } from "@/components/ui/alert-dialog"

import { AlertDialogHeader } from "@/components/ui/alert-dialog"

import { AlertDialogContent } from "@/components/ui/alert-dialog"

import { AlertDialog } from "@/components/ui/alert-dialog"

import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { CodeEditor } from "@/app/email-send-test/code-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  Copy,
  Trash2,
  Edit,
  Eye,
  Code,
  FileText,
  MoreHorizontal,
  ExternalLink,
  Save,
  RefreshCw,
  Sparkles,
  Info,
  Loader2,
} from "lucide-react"

// Template type definition
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  description: string
  htmlContent: string
  category: "welcome" | "announcement" | "promotion" | "notification" | "custom"
  createdAt: Date
  updatedAt: Date
  placeholders: string[]
}

// Sample templates
const defaultTemplates: EmailTemplate[] = [
  {
    id: "welcome-template",
    name: "Welcome Email",
    subject: "Welcome to PHILTECH BUSINESS GROUP!",
    description: "Default welcome email sent to new users",
    htmlContent: `<!DOCTYPE html>
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
</html>`,
    category: "welcome",
    createdAt: new Date(),
    updatedAt: new Date(),
    placeholders: ["userName", "email", "password", "year"],
  },
  {
    id: "announcement-template",
    name: "General Announcement",
    subject: "Important Announcement from PHILTECH BUSINESS GROUP",
    description: "Template for general announcements to all users",
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Announcement from PHILTECH BUSINESS GROUP</title>
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
    .announcement {
      background-color: #f0f7ff;
      border-left: 4px solid #3f87d6;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
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
      <h1>Important Announcement</h1>
    </div>
    <div class="content">
      <p class="greeting">Dear {{userName}},</p>
      <div class="announcement">
        <h2>{{announcementTitle}}</h2>
        <p>{{announcementContent}}</p>
      </div>
      <p>If you have any questions regarding this announcement, please don't hesitate to contact our support team.</p>
      <div class="button-container">
        <a href="{{actionUrl}}" class="button">{{actionText}}</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {{year}} PHILTECH BUSINESS GROUP. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`,
    category: "announcement",
    createdAt: new Date(),
    updatedAt: new Date(),
    placeholders: ["userName", "announcementTitle", "announcementContent", "actionUrl", "actionText", "year"],
  },
  {
    id: "promotion-template",
    name: "Special Promotion",
    subject: "Special Offer Just For You!",
    description: "Template for promotional emails and special offers",
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Promotion</title>
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
      background: linear-gradient(135deg, #3f87d6 0%, #6a92e4 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .promotion {
      background-color: #fff8e6;
      border: 2px dashed #ffc107;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      text-align: center;
    }
    .promotion h2 {
      color: #ff6b00;
      margin-top: 0;
    }
    .promotion-code {
      background-color: #f8f9fa;
      padding: 10px 15px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 2px;
      display: inline-block;
      margin: 10px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #ff6b00 0%, #ff9500 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 50px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
    .expiry {
      font-size: 14px;
      color: #666;
      margin-top: 10px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .social-links {
      margin: 15px 0;
    }
    .social-link {
      display: inline-block;
      margin: 0 10px;
      color: #3f87d6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo-container">
      <img src="https://philtechbusiness.ph/wp-content/uploads/2023/06/20000-X-5000-TRANSPARENT13.png" alt="PHILTECH BUSINESS GROUP Logo" class="logo">
    </div>
    <div class="header">
      <h1>{{promotionTitle}}</h1>
    </div>
    <div class="content">
      <p class="greeting">Dear {{userName}},</p>
      <p>{{promotionIntro}}</p>
      
      <div class="promotion">
        <h2>{{offerTitle}}</h2>
        <p>{{offerDescription}}</p>
        <div class="promotion-code">{{promoCode}}</div>
        <p class="expiry">Valid until: {{expiryDate}}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="{{actionUrl}}" class="button">{{actionText}}</a>
      </div>
      
      <p>{{closingText}}</p>
    </div>
    <div class="footer">
      <p>&copy; {{year}} PHILTECH BUSINESS GROUP. All rights reserved.</p>
      <div class="social-links">
        <a href="#" class="social-link">Facebook</a>
        <a href="#" class="social-link">Twitter</a>
        <a href="#" class="social-link">Instagram</a>
      </div>
      <p>If you no longer wish to receive promotional emails, you can <a href="{{unsubscribeUrl}}">unsubscribe</a>.</p>
    </div>
  </div>
</body>
</html>`,
    category: "promotion",
    createdAt: new Date(),
    updatedAt: new Date(),
    placeholders: [
      "userName",
      "promotionTitle",
      "promotionIntro",
      "offerTitle",
      "offerDescription",
      "promoCode",
      "expiryDate",
      "actionUrl",
      "actionText",
      "closingText",
      "year",
      "unsubscribeUrl",
    ],
  },
]

// Email Template Manager Component
export function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "placeholders">("edit")
  const [previewData, setPreviewData] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [editorTheme, setEditorTheme] = useState<"vs-light" | "vs-dark">("vs-light")
  const [isGenerating, setIsGenerating] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Partial<EmailTemplate>>({
    name: "",
    subject: "",
    description: "",
    htmlContent: "",
    category: "custom",
  })
  const { toast } = useToast()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Load templates from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem("emailTemplates")
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates)
        // Convert string dates back to Date objects
        const templatesWithDates = parsed.map((template: any) => ({
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt),
        }))
        setTemplates(templatesWithDates)
      } catch (error) {
        console.error("Error parsing saved templates:", error)
        setTemplates(defaultTemplates)
      }
    } else {
      setTemplates(defaultTemplates)
    }
  }, [])

  // Save templates to localStorage whenever they change
  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem("emailTemplates", JSON.stringify(templates))
    }
  }, [templates])

  // Create a new template
  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.htmlContent) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const placeholders = extractPlaceholders(newTemplate.htmlContent || "")

    const templateToCreate: EmailTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplate.name || "Untitled Template",
      subject: newTemplate.subject || "No Subject",
      description: newTemplate.description || "",
      htmlContent: newTemplate.htmlContent || "",
      category:
        (newTemplate.category as "welcome" | "announcement" | "promotion" | "notification" | "custom") || "custom",
      createdAt: new Date(),
      updatedAt: new Date(),
      placeholders,
    }

    setTemplates((prev) => [...prev, templateToCreate])
    setIsCreateDialogOpen(false)
    setNewTemplate({
      name: "",
      subject: "",
      description: "",
      htmlContent: "",
      category: "custom",
    })

    toast({
      title: "Template Created",
      description: `Template "${templateToCreate.name}" has been created successfully.`,
    })
  }

  // Update an existing template
  const handleUpdateTemplate = () => {
    if (!currentTemplate) return

    const placeholders = extractPlaceholders(currentTemplate.htmlContent)

    const updatedTemplate: EmailTemplate = {
      ...currentTemplate,
      updatedAt: new Date(),
      placeholders,
    }

    setTemplates((prev) => prev.map((template) => (template.id === updatedTemplate.id ? updatedTemplate : template)))

    setIsEditDialogOpen(false)
    toast({
      title: "Template Updated",
      description: `Template "${updatedTemplate.name}" has been updated successfully.`,
    })
  }

  // Delete a template
  const handleDeleteTemplate = () => {
    if (!currentTemplate) return

    setTemplates((prev) => prev.filter((template) => template.id !== currentTemplate.id))
    setIsDeleteDialogOpen(false)
    toast({
      title: "Template Deleted",
      description: `Template "${currentTemplate.name}" has been deleted.`,
    })
    setCurrentTemplate(null)
  }

  // Duplicate a template
  const handleDuplicateTemplate = (template: EmailTemplate) => {
    const duplicatedTemplate: EmailTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setTemplates((prev) => [...prev, duplicatedTemplate])
    toast({
      title: "Template Duplicated",
      description: `Template "${template.name}" has been duplicated.`,
    })
  }

  // Preview a template with sample data
  const handlePreviewTemplate = (template: EmailTemplate) => {
    setCurrentTemplate(template)

    // Generate sample data for preview based on placeholders
    const sampleData: Record<string, string> = {}
    template.placeholders.forEach((placeholder) => {
      switch (placeholder) {
        case "userName":
          sampleData[placeholder] = "John Doe"
          break
        case "email":
          sampleData[placeholder] = "john.doe@example.com"
          break
        case "password":
          sampleData[placeholder] = "********"
          break
        case "year":
          sampleData[placeholder] = new Date().getFullYear().toString()
          break
        case "announcementTitle":
          sampleData[placeholder] = "System Maintenance Scheduled"
          break
        case "announcementContent":
          sampleData[placeholder] =
            "We will be performing scheduled maintenance on our systems on Saturday, June 15th from 2:00 AM to 5:00 AM UTC. During this time, the platform may be temporarily unavailable."
          break
        case "actionUrl":
          sampleData[placeholder] = "https://philtechbusiness.ph/announcements"
          break
        case "actionText":
          sampleData[placeholder] = "View Details"
          break
        case "promotionTitle":
          sampleData[placeholder] = "Special Summer Discount!"
          break
        case "promotionIntro":
          sampleData[placeholder] =
            "We're excited to offer you an exclusive discount on our premium services this summer."
          break
        case "offerTitle":
          sampleData[placeholder] = "Get 25% OFF Premium Package"
          break
        case "offerDescription":
          sampleData[placeholder] = "Use the code below to get 25% off when you upgrade to our Premium Package."
          break
        case "promoCode":
          sampleData[placeholder] = "SUMMER25"
          break
        case "expiryDate":
          sampleData[placeholder] = "August 31, 2023"
          break
        case "closingText":
          sampleData[placeholder] = "Thank you for being a valued customer. We hope you enjoy this special offer!"
          break
        case "unsubscribeUrl":
          sampleData[placeholder] = "https://philtechbusiness.ph/unsubscribe"
          break
        default:
          sampleData[placeholder] = `[${placeholder}]`
      }
    })

    setPreviewData(sampleData)
    setIsPreviewDialogOpen(true)
    setActiveTab("preview")
  }

  // Generate preview HTML with sample data
  const getPreviewHTML = () => {
    if (!currentTemplate) return ""

    let previewHTML = currentTemplate.htmlContent

    // Replace placeholders with sample data
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g")
      previewHTML = previewHTML.replace(regex, value)
    })

    return previewHTML
  }

  // Update iframe content
  useEffect(() => {
    if (isPreviewDialogOpen && iframeRef.current && activeTab === "preview") {
      const iframe = iframeRef.current
      const previewHTML = getPreviewHTML()

      if (iframe.contentWindow) {
        iframe.contentWindow.document.open()
        iframe.contentWindow.document.write(previewHTML)
        iframe.contentWindow.document.close()
      }
    }
  }, [isPreviewDialogOpen, previewData, activeTab, currentTemplate])

  // Extract placeholders from HTML content
  const extractPlaceholders = (htmlContent: string) => {
    const regex = /{{([^}]+)}}/g
    const matches = htmlContent.match(regex) || []
    const placeholders = matches.map((match) => match.replace(/{{|}}/g, ""))
    return [...new Set(placeholders)] // Remove duplicates
  }

  // Filter templates based on search query and category
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Generate a new template with AI assistance
  const handleGenerateTemplate = async () => {
    setIsGenerating(true)

    try {
      // In a real implementation, this would call an AI service
      // For now, we'll simulate a delay and create a template
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newTemplate: EmailTemplate = {
        id: `template-${Date.now()}`,
        name: "AI Generated Template",
        subject: "Special Announcement from PHILTECH BUSINESS GROUP",
        description: "AI-generated template for special announcements",
        htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Announcement</title>
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
    .header {
      background: linear-gradient(135deg, #4a6fdc 0%, #6a92e4 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .message {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #4a6fdc 0%, #6a92e4 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 50px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .social-links {
      margin: 15px 0;
    }
    .social-link {
      display: inline-block;
      margin: 0 10px;
      color: #4a6fdc;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>{{title}}</h1>
    </div>
    <div class="content">
      <p class="greeting">Dear {{userName}},</p>
      <div class="message">
        <p>{{message}}</p>
      </div>
      <div style="text-align: center;">
        <a href="{{ctaUrl}}" class="cta-button">{{ctaText}}</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {{year}} PHILTECH BUSINESS GROUP. All rights reserved.</p>
      <div class="social-links">
        <a href="#" class="social-link">Facebook</a>
        <a href="#" class="social-link">Twitter</a>
        <a href="#" class="social-link">LinkedIn</a>
      </div>
      <p>If you no longer wish to receive these emails, you can <a href="{{unsubscribeUrl}}">unsubscribe</a>.</p>
    </div>
  </div>
</body>
</html>`,
        category: "announcement",
        createdAt: new Date(),
        updatedAt: new Date(),
        placeholders: ["title", "userName", "message", "ctaUrl", "ctaText", "year", "unsubscribeUrl"],
      }

      setTemplates((prev) => [...prev, newTemplate])
      toast({
        title: "Template Generated",
        description: "AI-generated template has been created successfully.",
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Open preview in new tab
  const handleOpenPreviewInNewTab = () => {
    if (!currentTemplate) return

    const previewHTML = getPreviewHTML()
    const newWindow = window.open("", "_blank")

    if (newWindow) {
      newWindow.document.write(previewHTML)
      newWindow.document.close()
    }
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "welcome":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "announcement":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "promotion":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100"
      case "notification":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">Create and manage email templates for your users</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerateTemplate} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate with AI
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Email Template</DialogTitle>
                <DialogDescription>Create a new email template for sending to your users.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name*
                  </Label>
                  <Input
                    id="name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="col-span-3"
                    placeholder="Welcome Email"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subject" className="text-right">
                    Subject*
                  </Label>
                  <Input
                    id="subject"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    className="col-span-3"
                    placeholder="Welcome to PHILTECH BUSINESS GROUP"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    className="col-span-3"
                    placeholder="A brief description of this template"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select
                    value={newTemplate.category}
                    onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value as any })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <Label htmlFor="htmlContent" className="text-right pt-2">
                    HTML Content*
                  </Label>
                  <div className="col-span-3 border rounded-md h-[400px] overflow-hidden">
                    <CodeEditor
                      value={newTemplate.htmlContent || ""}
                      onChange={(value) => setNewTemplate({ ...newTemplate, htmlContent: value })}
                      language="html"
                      theme={editorTheme}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditorTheme(editorTheme === "vs-light" ? "vs-dark" : "vs-light")}
                  >
                    Toggle Theme
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>Create Template</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-full"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="welcome">Welcome</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="promotion">Promotion</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Templates Found</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            {searchQuery || categoryFilter !== "all"
              ? "No templates match your search criteria. Try adjusting your filters."
              : "You don't have any email templates yet. Create your first template to get started."}
          </p>
          {(searchQuery || categoryFilter !== "all") && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("")
                setCategoryFilter("all")
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-1">{template.subject}</CardDescription>
                  </div>
                  <Badge variant="secondary" className={getCategoryColor(template.category)}>
                    {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.placeholders.slice(0, 3).map((placeholder) => (
                    <Badge key={placeholder} variant="outline" className="text-xs">
                      {placeholder}
                    </Badge>
                  ))}
                  {template.placeholders.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.placeholders.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <div className="text-xs text-muted-foreground">Updated {formatDate(template.updatedAt)}</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => {
                        setCurrentTemplate(template)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setCurrentTemplate(template)
                        setIsDeleteDialogOpen(true)
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Make changes to your email template.</DialogDescription>
          </DialogHeader>
          {currentTemplate && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={currentTemplate.name}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-subject" className="text-right">
                  Subject
                </Label>
                <Input
                  id="edit-subject"
                  value={currentTemplate.subject}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, subject: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={currentTemplate.description}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="text-right">
                  Category
                </Label>
                <Select
                  value={currentTemplate.category}
                  onValueChange={(value) => setCurrentTemplate({ ...currentTemplate, category: value as any })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Label htmlFor="edit-htmlContent" className="text-right pt-2">
                  HTML Content
                </Label>
                <div className="col-span-3 border rounded-md h-[400px] overflow-hidden">
                  <CodeEditor
                    value={currentTemplate.htmlContent}
                    onChange={(value) => setCurrentTemplate({ ...currentTemplate, htmlContent: value })}
                    language="html"
                    theme={editorTheme}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditorTheme(editorTheme === "vs-light" ? "vs-dark" : "vs-light")}
                >
                  Toggle Theme
                </Button>
              </div>
              <div className="col-span-full">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <p>Detected placeholders:</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {extractPlaceholders(currentTemplate.htmlContent).map((placeholder) => (
                        <Badge key={placeholder} variant="outline">
                          {placeholder}
                        </Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>Preview how your email will look to recipients.</DialogDescription>
          </DialogHeader>
          {currentTemplate && (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="placeholders">
                  <Code className="h-4 w-4 mr-2" />
                  Placeholders
                </TabsTrigger>
                <TabsTrigger value="edit">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="mt-4">
                <div className="flex justify-end mb-2">
                  <Button variant="outline" size="sm" onClick={handleOpenPreviewInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
                <div className="border rounded-md h-[500px] overflow-hidden">
                  <iframe ref={iframeRef} title="Email Preview" className="w-full h-full" sandbox="allow-same-origin" />
                </div>
              </TabsContent>
              <TabsContent value="placeholders" className="mt-4">
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Customize the placeholder values to see how your email will look with different data.
                    </AlertDescription>
                  </Alert>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentTemplate.placeholders.map((placeholder) => (
                      <div key={placeholder} className="space-y-2">
                        <Label htmlFor={`placeholder-${placeholder}`}>{placeholder}</Label>
                        <Input
                          id={`placeholder-${placeholder}`}
                          value={previewData[placeholder] || ""}
                          onChange={(e) => setPreviewData({ ...previewData, [placeholder]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="edit" className="mt-4">
                <div className="border rounded-md h-[500px] overflow-hidden">
                  <CodeEditor
                    value={currentTemplate.htmlContent}
                    onChange={(value) => setCurrentTemplate({ ...currentTemplate, htmlContent: value })}
                    language="html"
                    theme={editorTheme}
                  />
                </div>
                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditorTheme(editorTheme === "vs-light" ? "vs-dark" : "vs-light")}
                  >
                    Toggle Theme
                  </Button>
                  <Button onClick={handleUpdateTemplate}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
