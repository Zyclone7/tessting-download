"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatNumber } from "@/lib/utils"
import {
  Loader2,
  Edit,
  X,
  Save,
  User,
  Mail,
  Phone,
  Building,
  CreditCard,
  Calendar,
  Lock,
  UserPlus,
  ShieldCheck,
  Globe,
  MapPin,
  Briefcase,
  Instagram,
  CheckCircle2,
  AlertCircle,
  Copy,
  Info,
  Eye,
  EyeOff,
  Store,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatUserRole } from "@/lib/utils"
import { checkMerchantIdExists } from "@/actions/user"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"

interface UserDialogProps {
  user: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdate?: (updatedUser: any) => Promise<void>
  onUserCreate?: (newUser: any) => Promise<void>
  mode?: "edit" | "create" | "admin"
  isAdmin?: boolean
}

export function UserDialog({
  user,
  open,
  onOpenChange,
  onUserUpdate,
  onUserCreate,
  mode = "edit",
  isAdmin = false,
}: UserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(mode === "create")
  const [formData, setFormData] = useState({
    ID: 0,
    user_nicename: "",
    user_login: "",
    user_email: "",
    user_pass: "",
    user_contact_number: "",
    user_url: "",
    user_status: 1,
    user_role: "",
    user_level: 0,
    user_credits: 0,
    user_referral_code: "",
    merchant_id: "",
    business_name: "",
    business_address: "",
    travel_agency: "",
    social_media_page: "",
    bank_name: "",
    bank_account_number: "",
    cf_share: 0,
    retailer_count: null as number | null, // Explicitly type as number | null
  });
  const [isSaving, setIsSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)
  const [merchantIdError, setMerchantIdError] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [activeTab, setActiveTab] = useState("basic")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState("")
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (mode === "edit" || mode === "admin") {
      setCurrentUser(user)
    }
  }, [user, mode])

  // Initialize form data with default role for new users
  useEffect(() => {
    if (open) {
      // Reset form data when dialog opens
      if ((mode === "edit" || mode === "admin") && currentUser) {
        setFormData({
          ID: user.ID || 0,
          user_nicename: user.user_nicename || "",
          user_login: user.user_login || "",
          user_email: user.user_email || "",
          user_pass: "",
          user_contact_number: user.user_contact_number || "",
          user_url: user.user_url || "",
          user_status: user.user_status ?? 1,
          user_role: user.user_role || "",
          user_level: user.user_level || 0,
          user_credits: user.user_credits || 0,
          user_referral_code: user.user_referral_code || "",
          merchant_id: user.merchant_id || "",
          business_name: user.business_name || "",
          business_address: user.business_address || "",
          travel_agency: user.travel_agency || "",
          social_media_page: user.social_media_page || "",
          bank_name: user.bank_name || "",
          bank_account_number: user.bank_account_number || "",
          cf_share: user.cf_share || 0,
          retailer_count: user.retailer_count ?? null, // Preserve null explicitly
        });
        setIsEditing(false)
      } else {
        // For create mode, initialize with empty values and default role
        setFormData({
          ID: 0,
          user_nicename: "",
          user_login: "",
          user_email: "",
          user_pass: "",
          user_contact_number: "",
          user_url: "",
          user_status: 1,
          user_role: isAdmin ? "admin" : "Basic_Merchant_Package",
          user_level: 0,
          user_credits: 0,
          user_referral_code: "",
          merchant_id: "",
          business_name: "",
          business_address: "",
          travel_agency: "",
          social_media_page: "",
          bank_name: "",
          bank_account_number: "",
          cf_share: 0,
          retailer_count: null, // Default to null for new users
        });
        setIsEditing(true)
      }
      setMerchantIdError("")
      setPasswordError("")
      setPasswordConfirm("")
      setPasswordStrength(0)
      setPasswordFeedback("")
    }
  }, [open, currentUser, mode, isAdmin])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // For numeric fields, convert to number or preserve null
    if (name === "retailer_count") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? null : Number(value),
      }));
    } else if (["user_level", "user_credits", "user_status"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : Number(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear merchant ID error when user types
    if (name === "merchant_id") {
      setMerchantIdError("");
    }

    // Check password strength when user types
    if (name === "user_pass") {
      checkPasswordStrength(value);
      setPasswordError("");
    }
  };

  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(0)
      setPasswordFeedback("")
      return
    }

    // Calculate password strength
    let strength = 0
    const feedback = []

    // Length check
    if (password.length >= 8) {
      strength += 1
    } else {
      feedback.push("Password should be at least 8 characters")
    }

    // Contains lowercase
    if (/[a-z]/.test(password)) {
      strength += 1
    } else {
      feedback.push("Include lowercase letters")
    }

    // Contains uppercase
    if (/[A-Z]/.test(password)) {
      strength += 1
    } else {
      feedback.push("Include uppercase letters")
    }

    // Contains numbers
    if (/\d/.test(password)) {
      strength += 1
    } else {
      feedback.push("Include numbers")
    }

    // Contains special characters
    if (/[^a-zA-Z0-9]/.test(password)) {
      strength += 1
    } else {
      feedback.push("Include special characters")
    }

    setPasswordStrength(strength)
    setPasswordFeedback(feedback.join(", "))
  }

  const handlePasswordConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordConfirm(e.target.value)
    setPasswordError("")
  }

  const handleSelectChange = (name: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked ? 1 : 0,
    }))
  }

  const validateMerchantId = async (merchantId: string) => {
    if (!merchantId) return true // Empty merchant ID is valid (not all users need one)
    if (isAdmin) return true // Skip merchant ID validation for admin users

    // Check if merchant ID format is valid
    if (!/^88\d{13}$/.test(merchantId)) {
      setMerchantIdError("Merchant ID must start with '88' followed by 13 digits")
      return false
    }

    // Check if merchant ID exists and is different from current
    if ((mode === "edit" || mode === "admin") && merchantId !== currentUser?.merchant_id) {
      const result = await checkMerchantIdExists(merchantId)
      if (result.exists) {
        setMerchantIdError("This Merchant ID already exists")
        return false
      }
    } else if (mode === "create") {
      const result = await checkMerchantIdExists(merchantId)
      if (result.exists) {
        setMerchantIdError("This Merchant ID already exists")
        return false
      }
    }

    setMerchantIdError("")
    return true
  }

  // Improve form validation to avoid errors
  const validateForm = () => {
    if (!formData.user_email) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      })
      return false
    }

    // Email format - simple check
    if (!formData.user_email.includes("@")) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return false
    }

    // Name is required
    if (!formData.user_nicename) {
      toast({
        title: "Validation Error",
        description: "Full name is required",
        variant: "destructive",
      })
      return false
    }

    // Password validation for create mode
    if (mode === "create") {
      if (!formData.user_pass) {
        toast({
          title: "Validation Error",
          description: "Password is required for new users",
          variant: "destructive",
        })
        return false
      }

      if (formData.user_pass !== passwordConfirm) {
        setPasswordError("Passwords do not match")
        return false
      }
    }

    // Password validation for edit mode (only if password is being changed)
    if ((mode === "edit" || mode === "admin") && formData.user_pass) {
      if (formData.user_pass !== passwordConfirm) {
        setPasswordError("Passwords do not match")
        return false
      }
    }

    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      // Validate merchant ID if provided and not in admin mode
      if (formData.merchant_id && !isAdmin) {
        const isValid = await validateMerchantId(formData.merchant_id)
        if (!isValid) {
          setIsSaving(false)
          return
        }
      }

      if ((mode === "edit" || mode === "admin") && onUserUpdate) {
        // For edit mode, update existing user
        const updatedUser = {
          ...currentUser,
          ...formData,
        }

        // If password is empty, remove it from the update data
        if (!updatedUser.user_pass) {
          delete updatedUser.user_pass
        }
        // The server will handle password hashing

        await onUserUpdate(updatedUser)
        setCurrentUser(updatedUser)
        setIsEditing(false)
        toast({
          title: "Success",
          description: "User information updated successfully",
        })
      } else if (mode === "create" && onUserCreate) {
        // For create mode, create new user
        // The server will handle password hashing
        await onUserCreate(formData)
        toast({
          title: "Success",
          description: "User created successfully",
        })
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Failed to save user:", error)
      toast({
        title: "Error",
        description: "Failed to save user information",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (mode === "edit" || mode === "admin") {
      // Reset form data to original values
      setFormData({
        ID: currentUser?.ID || 0,
        user_nicename: currentUser?.user_nicename || "",
        user_login: currentUser?.user_login || "",
        user_email: currentUser?.user_email || "",
        user_pass: "", // Don't populate password for security
        user_contact_number: currentUser?.user_contact_number || "",
        user_url: currentUser?.user_url || "",
        user_status: currentUser?.user_status || 1,
        user_role: currentUser?.user_role || "",
        user_level: currentUser?.user_level || 0,
        user_credits: currentUser?.user_credits || 0,
        user_referral_code: currentUser?.user_referral_code || "",
        merchant_id: currentUser?.merchant_id || "",
        business_name: currentUser?.business_name || "",
        business_address: currentUser?.business_address || "",
        travel_agency: currentUser?.travel_agency || "",
        social_media_page: currentUser?.social_media_page || "",
        bank_name: currentUser?.bank_name || "",
        bank_account_number: currentUser?.bank_account_number || "",
        cf_share: currentUser?.cf_share || 0,
        retailer_count: currentUser?.retailer_count || 0, // Added retailer_count
      })
      setIsEditing(false)
    } else {
      // For create mode, close the dialog
      onOpenChange(false)
    }
    setMerchantIdError("")
    setPasswordError("")
  }

  // Get initials for avatar
  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Generate a random password
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()"
    let password = ""
    // Ensure at least one uppercase, one lowercase, one number, and one special char
    password += chars.charAt(Math.floor(Math.random() * 26)) // Uppercase
    password += chars.charAt(26 + Math.floor(Math.random() * 26)) // Lowercase
    password += chars.charAt(52 + Math.floor(Math.random() * 10)) // Number
    password += chars.charAt(62 + Math.floor(Math.random() * 10)) // Special

    // Add more random characters to reach desired length (12)
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Shuffle the password
    password = password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("")

    setFormData((prev) => ({ ...prev, user_pass: password }))
    setPasswordConfirm(password)
    checkPasswordStrength(password)

    toast({
      title: "Password Generated",
      description: "A strong random password has been generated.",
    })
  }

  // Copy text to clipboard
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: message,
      })
    })
  }

  // Determine which roles to show based on context
  const getRoleOptions = () => {
    return (
      <>
        <SelectItem value="Basic_Merchant_Package">Basic Merchant</SelectItem>
        <SelectItem value="Premium_Merchant_Package">Premium Merchant</SelectItem>
        <SelectItem value="Elite_Distributor_Package">Elite Distributor</SelectItem>
        <SelectItem value="Elite_Plus_Distributor_Package">Elite Plus Distributor</SelectItem>
      </>
    )
  }

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  }

  const slideUp = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[825px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {(mode === "edit" || mode === "admin") && currentUser && (
                  <Avatar className="h-14 w-14 border-2 border-primary/20">
                    {currentUser.profile_pic_url ? (
                      <AvatarImage
                        src={currentUser.profile_pic_url || "/placeholder.svg"}
                        alt={currentUser.user_nicename || "User"}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-lg font-semibold">
                      {getInitials(currentUser.user_nicename)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    {mode === "create"
                      ? `Create New ${isAdmin ? "Admin" : "User"}`
                      : `${isAdmin ? "Admin" : "User"} Details`}
                  </DialogTitle>
                  {(mode === "edit" || mode === "admin") && currentUser && (
                    <div className="flex items-center mt-1 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 mr-1" />
                      {currentUser.user_email}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      {mode === "create" ? "Create" : "Save"}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {(mode === "edit" || mode === "admin") && currentUser && (
              <motion.div className="flex flex-wrap gap-2 mt-4" initial="hidden" animate="visible" variants={slideUp}>
                <Badge variant={currentUser.user_status === 1 ? "outline" : "secondary"} className="animate-fadeIn">
                  {currentUser.user_status === 1 ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="secondary" className="animate-fadeIn">
                  ID: {currentUser.ID}
                </Badge>
                <Badge variant="outline" className="font-normal animate-fadeIn">
                  {isAdmin ? currentUser.user_role : formatUserRole(currentUser.user_role || "")}
                </Badge>
                {currentUser.merchant_id && !isAdmin && (
                  <Badge variant="outline" className="font-mono animate-fadeIn">
                    {currentUser.merchant_id}
                  </Badge>
                )}
              </motion.div>
            )}
          </DialogHeader>
        </motion.div>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b px-6">
            <TabsList className="bg-transparent h-12 p-0">
              <TabsTrigger
                value="basic"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Basic Info
              </TabsTrigger>
              {!isAdmin && (
                <TabsTrigger
                  value="business"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  Business Details
                </TabsTrigger>
              )}
              <TabsTrigger
                value="security"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Security
              </TabsTrigger>
              {(mode === "edit" || mode === "admin") && (
                <TabsTrigger
                  value="advanced"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  Advanced
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 h-[500px]">
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="p-6 pt-4 m-0">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <Card className="border-primary/10 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <User className="h-4 w-4 mr-2 text-primary" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>User's basic contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user_nicename">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="user_nicename"
                          name="user_nicename"
                          value={formData.user_nicename || ""}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          placeholder="Enter full name"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {currentUser?.user_nicename || "Not provided"}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_email">Email Address</Label>
                      {isEditing ? (
                        <Input
                          id="user_email"
                          name="user_email"
                          type="email"
                          value={formData.user_email || ""}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          placeholder="Enter email address"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {currentUser?.user_email || "Not provided"}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto"
                            onClick={() => copyToClipboard(currentUser?.user_email || "", "Email copied to clipboard")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_contact_number">Contact Number</Label>
                      {isEditing ? (
                        <Input
                          id="user_contact_number"
                          name="user_contact_number"
                          value={formData.user_contact_number || ""}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          placeholder="Enter contact number"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {currentUser?.user_contact_number || "Not provided"}
                          {currentUser?.user_contact_number && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-auto"
                              onClick={() =>
                                copyToClipboard(
                                  currentUser?.user_contact_number || "",
                                  "Phone number copied to clipboard",
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_url">Website</Label>
                      {isEditing ? (
                        <Input
                          id="user_url"
                          name="user_url"
                          value={formData.user_url || ""}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          placeholder="Enter website URL"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          {currentUser?.user_url ? (
                            <a
                              href={
                                currentUser.user_url.startsWith("http")
                                  ? currentUser.user_url
                                  : `https://${currentUser.user_url}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {currentUser.user_url}
                            </a>
                          ) : (
                            "Not provided"
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retailer_count">Retailer Count</Label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="retailer_count_toggle"
                              checked={formData.retailer_count !== null}
                              onCheckedChange={(checked) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  retailer_count: checked ? 0 : null,
                                }))
                              }
                            />
                            <Label htmlFor="retailer_count_toggle" className="cursor-pointer">
                              {formData.retailer_count !== null ? "Set" : "Default"}
                            </Label>
                          </div>
                          {formData.retailer_count !== null && (
                            <Input
                              id="retailer_count"
                              name="retailer_count"
                              type="number"
                              min="0"
                              value={formData.retailer_count ?? ""}
                              onChange={handleInputChange}
                              className="transition-all focus:ring-2 focus:ring-primary/20"
                              placeholder="Enter retailer count"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          {currentUser?.retailer_count !== null ? currentUser.retailer_count : "Default"}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/10 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                      Role & Status
                    </CardTitle>
                    <CardDescription>User's role and account status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user_role">User Role</Label>
                      {isEditing ? (
                        <Select
                          value={formData.user_role || ""}
                          onValueChange={(value) => handleSelectChange("user_role", value)}
                        >
                          <SelectTrigger id="user_role" className="transition-all focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>{getRoleOptions()}</SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                          {isAdmin ? currentUser?.user_role : formatUserRole(currentUser?.user_role || "")}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_level">User Level</Label>
                      {isEditing ? (
                        <Input
                          id="user_level"
                          name="user_level"
                          type="number"
                          value={formData.user_level || 0}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                          Level {currentUser?.user_level || 0}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_credits">Credits</Label>
                      {isEditing ? (
                        <Input
                          id="user_credits"
                          name="user_credits"
                          type="number"
                          step="0.01"
                          value={formData.user_credits || 0}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {formatNumber(currentUser?.user_credits) || "0.00"}
                        </div>
                      )}
                    </div>

                    {!isAdmin && (
                      <div className="space-y-2">
                        <Label htmlFor="user_referral_code">Referral Code</Label>
                        {isEditing ? (
                          <Input
                            id="user_referral_code"
                            name="user_referral_code"
                            value={formData.user_referral_code || ""}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter referral code"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                            {currentUser?.user_referral_code || "Not provided"}
                            {currentUser?.user_referral_code && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-auto"
                                onClick={() =>
                                  copyToClipboard(
                                    currentUser?.user_referral_code || "",
                                    "Referral code copied to clipboard",
                                  )
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="user_status">Account Status</Label>
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="user_status"
                            checked={formData.user_status === 1}
                            onCheckedChange={(checked) => handleSwitchChange("user_status", checked)}
                          />
                          <Label htmlFor="user_status" className="cursor-pointer">
                            {formData.user_status === 1 ? "Active" : "Inactive"}
                          </Label>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant={currentUser?.user_status === 1 ? "outline" : "secondary"}>
                            {currentUser?.user_status === 1 ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {(mode === "edit" || mode === "admin") && currentUser && (
                      <div className="space-y-2">
                        <Label>Registration Date</Label>
                        <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {currentUser.user_registered ? formatDate(currentUser.user_registered) : "Not available"}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Business Details Tab - Only show for regular users, not admins */}
            {!isAdmin && (
              <TabsContent value="business" className="p-6 pt-4 m-0">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <Card className="border-primary/10 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <Building className="h-4 w-4 mr-2 text-primary" />
                        Merchant Information
                      </CardTitle>
                      <CardDescription>Business and merchant details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="merchant_id">Merchant ID</Label>
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input
                              id="merchant_id"
                              name="merchant_id"
                              value={formData.merchant_id || ""}
                              onChange={handleInputChange}
                              className={`transition-all focus:ring-2 focus:ring-primary/20 ${merchantIdError ? "border-red-500" : ""}`}
                              placeholder="88XXXXXXXXXXXXX"
                            />
                            {merchantIdError && (
                              <p className="text-red-500 text-xs flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {merchantIdError}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground flex items-center">
                              <Info className="h-3 w-3 mr-1" />
                              Format: 88 followed by 13 digits (e.g., 8800000000XXXXX)
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md font-mono">
                            {currentUser?.merchant_id ? (
                              <>
                                <div className="bg-muted px-2 py-1 rounded text-xs">{currentUser.merchant_id}</div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 ml-auto"
                                  onClick={() =>
                                    copyToClipboard(currentUser?.merchant_id || "", "Merchant ID copied to clipboard")
                                  }
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-muted-foreground">Not assigned</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="business_name">Business Name</Label>
                        {isEditing ? (
                          <Input
                            id="business_name"
                            name="business_name"
                            value={formData.business_name || ""}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter business name"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            {currentUser?.business_name || "Not provided"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="business_address">Business Address</Label>
                        {isEditing ? (
                          <Textarea
                            id="business_address"
                            name="business_address"
                            value={formData.business_address || ""}
                            onChange={handleInputChange}
                            rows={3}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter business address"
                          />
                        ) : (
                          <div className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded-md">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>{currentUser?.business_address || "Not provided"}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bank_name">Bank Name</Label>
                        {isEditing ? (
                          <Input
                            id="bank_name"
                            name="bank_name"
                            value={formData.bank_name || ""}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter bank name"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            {currentUser?.bank_name || "Not provided"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bank_account_number">Bank Account Number</Label>
                        {isEditing ? (
                          <Input
                            id="bank_account_number"
                            name="bank_account_number"
                            value={formData.bank_account_number || ""}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter bank account number"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            {currentUser?.bank_account_number ? (
                              <>
                                {currentUser.bank_account_number}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 ml-auto"
                                  onClick={() =>
                                    copyToClipboard(
                                      currentUser?.bank_account_number || "",
                                      "Bank account number copied to clipboard",
                                    )
                                  }
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              "Not provided"
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cf_share">CF Share (%)</Label>
                        {isEditing ? (
                          <Input
                            id="cf_share"
                            name="cf_share"
                            type="number"
                            step="0.01"
                            value={formData.cf_share || 0}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter CF share percentage"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            {currentUser?.cf_share !== null && currentUser?.cf_share !== undefined
                              ? `${currentUser.cf_share}%`
                              : "Not provided"}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/10 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-primary" />
                        Additional Information
                      </CardTitle>
                      <CardDescription>Other business details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="travel_agency">Travel Agency</Label>
                        {isEditing ? (
                          <Input
                            id="travel_agency"
                            name="travel_agency"
                            value={formData.travel_agency || ""}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter travel agency name"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            {currentUser?.travel_agency || "Not provided"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="social_media_page">Social Media Page</Label>
                        {isEditing ? (
                          <Input
                            id="social_media_page"
                            name="social_media_page"
                            value={formData.social_media_page || ""}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter social media page URL"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                            <Instagram className="h-4 w-4 text-muted-foreground" />
                            {currentUser?.social_media_page ? (
                              <a
                                href={
                                  currentUser.social_media_page.startsWith("http")
                                    ? currentUser.social_media_page
                                    : `https://${currentUser.social_media_page}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {currentUser.social_media_page}
                              </a>
                            ) : (
                              "Not provided"
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            )}

            {/* Security Tab */}
            <TabsContent value="security" className="p-6 pt-4 m-0">
              <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                <Card className="border-primary/10 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-primary" />
                      Password Management
                    </CardTitle>
                    <CardDescription>Manage user password securely</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateRandomPassword}
                          type="button"
                          className="text-xs"
                        >
                          Generate Strong Password
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="user_pass">{mode === "create" ? "Password" : "New Password"}</Label>
                      {isEditing ? (
                        <div className="space-y-1">
                          <div className="relative">
                            <Input
                              id="user_pass"
                              name="user_pass"
                              type={showPassword ? "text" : "password"}
                              value={formData.user_pass || ""}
                              onChange={handleInputChange}
                              className="transition-all focus:ring-2 focus:ring-primary/20 pr-20"
                              placeholder={
                                mode === "create" ? "Enter password" : "Leave blank to keep current password"
                              }
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setShowPassword(!showPassword)}
                                type="button"
                              >
                                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </Button>
                              {formData.user_pass && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() =>
                                          copyToClipboard(formData.user_pass, "Password copied to clipboard")
                                        }
                                        type="button"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Copy password</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>

                          {formData.user_pass && (
                            <div className="mt-2">
                              <div className="flex items-center space-x-1 mb-1">
                                <div
                                  className={`h-1 flex-1 rounded-full ${passwordStrength >= 1 ? "bg-red-500" : "bg-gray-200"}`}
                                ></div>
                                <div
                                  className={`h-1 flex-1 rounded-full ${passwordStrength >= 2 ? "bg-orange-500" : "bg-gray-200"}`}
                                ></div>
                                <div
                                  className={`h-1 flex-1 rounded-full ${passwordStrength >= 3 ? "bg-yellow-500" : "bg-gray-200"}`}
                                ></div>
                                <div
                                  className={`h-1 flex-1 rounded-full ${passwordStrength >= 4 ? "bg-green-500" : "bg-gray-200"}`}
                                ></div>
                                <div
                                  className={`h-1 flex-1 rounded-full ${passwordStrength >= 5 ? "bg-green-600" : "bg-gray-200"}`}
                                ></div>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center">
                                <Info className="h-3 w-3 mr-1" />
                                {passwordStrength < 3
                                  ? "Weak password"
                                  : passwordStrength < 5
                                    ? "Medium strength password"
                                    : "Strong password"}
                              </p>
                              {passwordFeedback && (
                                <p className="text-xs text-amber-600 mt-1 flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {passwordFeedback}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Password hidden for security</span>
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className="space-y-2">
                        <Label htmlFor="password_confirm">Confirm Password</Label>
                        <div className="space-y-1">
                          <div className="relative">
                            <Input
                              id="password_confirm"
                              type={showPassword ? "text" : "password"}
                              value={passwordConfirm}
                              onChange={handlePasswordConfirmChange}
                              placeholder="Confirm password"
                              className={`transition-all focus:ring-2 focus:ring-primary/20 ${passwordError ? "border-red-500" : ""}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 absolute right-2 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowPassword(!showPassword)}
                              type="button"
                            >
                              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                          {passwordError && (
                            <p className="text-red-500 text-xs flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {passwordError}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {(mode === "edit" || mode === "admin") && !isEditing && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsEditing(true)
                            setActiveTab("security")
                          }}
                          className="transition-all hover:bg-primary/5"
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Advanced Tab (only for edit mode) */}
            {(mode === "edit" || mode === "admin") && (
              <TabsContent value="advanced" className="p-6 pt-4 m-0">
                <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                  <Card className="border-primary/10 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <Info className="h-4 w-4 mr-2 text-primary" />
                        Advanced Settings
                      </CardTitle>
                      <CardDescription>System information and references</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>User ID</Label>
                        <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                          <Badge variant="outline">{currentUser?.ID}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto"
                            onClick={() =>
                              copyToClipboard(currentUser?.ID.toString() || "", "User ID copied to clipboard")
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {currentUser?.user_upline_id && (
                        <div className="space-y-2">
                          <Label>Upline ID</Label>
                          <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                            <Badge variant="outline">{currentUser.user_upline_id}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-auto"
                              onClick={() =>
                                copyToClipboard(currentUser.user_upline_id.toString(), "Upline ID copied to clipboard")
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {currentUser?.user_referred_by_id && (
                        <div className="space-y-2">
                          <Label>Referred By</Label>
                          <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                            <Badge variant="outline">{currentUser.user_referred_by_id}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-auto"
                              onClick={() =>
                                copyToClipboard(
                                  currentUser.user_referred_by_id.toString(),
                                  "Referrer ID copied to clipboard",
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {currentUser?.user_kyc !== null && (
                        <div className="space-y-2">
                          <Label>KYC Status</Label>
                          <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                            <Badge
                              variant={currentUser.user_kyc === 1 ? "outline" : "secondary"}
                              className={
                                currentUser.user_kyc === 1 ? "bg-green-50 text-green-700 border-green-200" : ""
                              }
                            >
                              {currentUser.user_kyc === 1 ? (
                                <span className="flex items-center">
                                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                                  Verified
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1 text-amber-600" />
                                  Not Verified
                                </span>
                              )}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            )}
          </ScrollArea>
        </Tabs>

        <DialogFooter className="p-6 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
