"use client"
import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import Tree, { type TreeNodeDatum, type RenderCustomNodeElementFn } from "react-d3-tree"
import { motion } from "framer-motion"
import {
  ArrowDown,
  ArrowRight,
  BarChart2,
  LineChart,
  Search,
  Settings,
  User,
  Users,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Printer,
  Store,
  CreditCard,
  Layers,
  Crown,
  Filter,
  Eye,
  Info,
  Maximize,
  Minimize,
  HelpCircle,
  Sparkles,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Bar,
  BarChart as RechartsBarChart,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import axios from "axios"
import { saveAs } from "file-saver"
import html2canvas from "html2canvas"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { getAllUsersWithUplineIdAndLevel, getUsersWithUplineIdAndLevelByUplineId } from "@/actions/user"
import { useUserContext } from "@/hooks/use-user"
import { formatNumber } from "@/lib/utils"
import OrganizationList from "./organization-list"

interface UserType {
  ID: number
  display_name: string
  user_activation_key: string
  user_credits: number
  user_email: string
  user_level: number
  user_login: string
  user_nicename: string
  user_pass: string
  user_referral_code: string
  user_referred_by_id: number | null
  user_registered: string
  user_role: string
  user_status: number
  user_upline_id: number | null
  user_url: string
  merchant_id: string
  profile_pic_url?: string
}

interface CustomTreeNodeDatum extends TreeNodeDatum {
  id: number
  name: string
  nickname: string
  merchant_id: string
  role: string
  level: number
  uplineId: number | null
  children?: CustomTreeNodeDatum[]
  user: UserType
  x?: number
  y?: number
}

interface LinkData {
  source: {
    x: number
    y: number
  }
  target: {
    x: number
    y: number
  }
}

interface Member {
  ID: number
  user_nicename: string
  user_email: string
  user_role: string | null
  merchant_id: string | null
  business_name: string | null
  user_registered: Date | null
  user_status: number
  level: number
  latestTransaction?: {
    approved_date: Date | null
  }
}

// Utility functions
function buildHierarchy(users: UserType[]): CustomTreeNodeDatum {
  const idMap: { [key: number]: CustomTreeNodeDatum | any } = {}
  const root: { [key: number]: CustomTreeNodeDatum } = {}

  // First pass: create nodes for all users
  users.forEach((user) => {
    idMap[user.ID] = {
      id: user.ID,
      name: user.display_name,
      role: user.user_role,
      nickname: user.user_nicename,
      merchant_id: user.merchant_id,
      level: user.user_level,
      uplineId: user.user_upline_id,
      children: [],
      user: user,
    }
  })

  // Second pass: build the hierarchy
  users.forEach((user) => {
    if (user.user_upline_id === null) {
      // This is a root node
      root[user.ID] = idMap[user.ID]
    } else {
      // This is a child node
      const parent: any = idMap[user.user_upline_id]
      if (parent) {
        parent.children.push(idMap[user.ID])
      } else {
        // If parent is not found, treat this as a root node
        root[user.ID] = idMap[user.ID]
      }
    }
  })

  // Return the first root node (assuming there's at least one)
  return Object.values(root)[0]
}

// Path functions for tree connections
const stepPath = (linkData: LinkData, orientation: string): string => {
  const { source, target } = linkData
  const midY = (source.y + target.y) / 2

  if (orientation === "vertical") {
    return `M${source.x},${source.y} V${midY} H${target.x} V${target.y}`
  } else {
    return `M${source.y},${source.x} H${midY} V${target.x} H${target.y}`
  }
}

const straightPath = (linkData: LinkData, orientation: string): string => {
  const { source, target } = linkData
  if (orientation === "vertical") {
    return `M${source.x},${source.y}L${target.x},${target.y}`
  } else {
    return `M${source.y},${source.x}L${target.y},${target.x}`
  }
}

const curvePath = (linkData: LinkData, orientation: string): string => {
  const { source, target } = linkData
  if (orientation === "vertical") {
    const dx = target.x - source.x
    const dy = target.y - source.y
    const midX = source.x + dx / 2
    return `M${source.x},${source.y} C${source.x},${source.y + dy / 3} ${midX},${source.y + dy / 2} ${target.x},${target.y}`
  } else {
    const dx = target.y - source.y
    const dy = target.x - source.x
    const midY = source.y + dx / 2
    return `M${source.y},${source.x} C${source.y + dx / 3},${source.x} ${midY},${source.x + dy / 2} ${target.y},${target.x}`
  }
}

// Format user role for display
function formatUserRole(role: string) {
  if (!role) return null

  const roleMapping: any = {
    Elite_Distributor_Package: "Elite Distributor",
    Elite_Plus_Distributor_Package: "Elite Plus Distributor",
    Basic_Merchant_Package: "Basic Merchant",
    Premium_Merchant_Package: "Premium Merchant",
    retailer: "Retailer",
    distributor: "Distributor",
    merchant: "Merchant",
    admin: "Admin",
    master: "Master",
    uploader: "Uploader",
  }

  return roleMapping[role] || "Unknown Role"
}


/**
 * Returns a specific HEX color code based on the user role.
 */
function getRoleColor(role: string): string {
  if (!role) return "#D1D5DB"; // Default gray (hex for Gray 300)

  switch (role) {
    case "master":
      return "#6366F1"; // Indigo 500
    case "admin":
      return "#10B981"; // Emerald 500
    case "Elite_Distributor_Package":
      return "#3B82F6"; // Blue 500
    case "Elite_Plus_Distributor_Package":
      return "#2563EB"; // Blue 600
    case "distributor":
      return "#60A5FA"; // Blue 400
    case "Basic_Merchant_Package":
      return "#FBBF24"; // Amber 400
    case "Premium_Merchant_Package":
      return "#F97316"; // Orange 500
    case "merchant":
      return "#F59E0B"; // Amber 500
    case "retailer": // Added case for retailer
      return "#22C55E"; // Green 500
    default:
      return "#9CA3AF"; // Gray 400 fallback (slightly darker than initial default)
  }
}

/**
 * Returns Tailwind CSS classes for background color based on the user role, supporting dark mode.
 */
function getRoleBackgroundColor(role: string): string {
  if (!role) return "bg-gray-100 dark:bg-gray-800"; // Default gray

  switch (role) {
    case "master":
      return "bg-indigo-50 dark:bg-indigo-900/20"; // For master
    case "admin":
      return "bg-emerald-50 dark:bg-emerald-900/20"; // For admin
    case "Elite_Distributor_Package":
      return "bg-blue-50 dark:bg-blue-900/20"; // For elite distributor
    case "Elite_Plus_Distributor_Package":
      return "bg-blue-100 dark:bg-blue-800/20"; // Slightly different shade
    case "distributor":
      return "bg-blue-200/50 dark:bg-blue-700/20"; // Lighter blue for standard distributor (adjusted opacity)
    case "Basic_Merchant_Package":
      return "bg-yellow-50 dark:bg-yellow-900/20"; // For basic merchant
    case "Premium_Merchant_Package":
      return "bg-orange-50 dark:bg-orange-900/20"; // For premium merchant
    case "merchant":
      return "bg-amber-50 dark:bg-amber-900/20"; // Shared merchant category
    case "retailer": // Added case for retailer
      return "bg-green-50 dark:bg-green-900/20"; // For retailer
    default:
      return "bg-gray-100 dark:bg-gray-800"; // Fallback
  }
}

/**
 * Returns Tailwind CSS classes for border color based on the user role, supporting dark mode.
 */
function getRoleBorderColor(role: string): string {
  if (!role) return "border-gray-200 dark:border-gray-700"; // Default gray

  switch (role) {
    case "master":
      return "border-indigo-200 dark:border-indigo-800/50"; // For master (added dark opacity)
    case "admin":
      return "border-emerald-200 dark:border-emerald-800/50"; // For admin (added dark opacity)
    case "Elite_Distributor_Package":
      return "border-blue-200 dark:border-blue-800/50"; // Elite Distributor (added dark opacity)
    case "Elite_Plus_Distributor_Package":
      return "border-blue-300 dark:border-blue-700/50"; // Elite Plus (added dark opacity)
    case "distributor":
      return "border-blue-300/50 dark:border-blue-900/50"; // Basic Distributor (adjusted light/dark opacity)
    case "Basic_Merchant_Package":
      return "border-yellow-200 dark:border-yellow-800/50"; // Basic Merchant (added dark opacity)
    case "Premium_Merchant_Package":
      return "border-orange-200 dark:border-orange-800/50"; // Premium Merchant (added dark opacity)
    case "merchant":
      return "border-amber-200 dark:border-amber-800/50"; // Generic Merchant (added dark opacity)
    case "retailer": // Added case for retailer
      return "border-green-200 dark:border-green-800/50"; // For retailer (added dark opacity)
    default:
      return "border-gray-200 dark:border-gray-700"; // Fallback
  }
}

/**
 * Returns Tailwind CSS classes for text color based on the user role, supporting dark mode.
 */
function getRoleTextColor(role: string): string {
  if (!role) return "text-gray-700 dark:text-gray-300"; // Default gray

  switch (role) {
    case "master":
      return "text-indigo-700 dark:text-indigo-300"; // For master
    case "admin":
      return "text-emerald-700 dark:text-emerald-300"; // For admin
    case "Elite_Distributor_Package":
      return "text-blue-700 dark:text-blue-300"; // Elite Distributor
    case "Elite_Plus_Distributor_Package":
      return "text-blue-800 dark:text-blue-200"; // Elite Plus
    case "distributor":
      return "text-blue-600 dark:text-blue-400"; // Basic Distributor
    case "Basic_Merchant_Package":
      return "text-yellow-700 dark:text-yellow-300"; // Basic Merchant
    case "Premium_Merchant_Package":
      return "text-orange-700 dark:text-orange-300"; // Premium Merchant
    case "merchant":
      return "text-amber-700 dark:text-amber-300"; // Generic Merchant
    case "retailer": // Added case for retailer
      return "text-green-700 dark:text-green-300"; // For retailer
    default:
      return "text-gray-700 dark:text-gray-300"; // Fallback
  }
}


// Get role icon for visual consistency
function getRoleIcon(role: string) { // Added return type annotation
  if (role === "master" || role === "admin") {
    return <Crown className="h-4 w-4 text-indigo-500" />; // Icon for master/admin
  } else if (
    role === "Elite_Distributor_Package" ||
    role === "Elite_Plus_Distributor_Package" ||
    role === "distributor"
  ) {
    return <Users className="h-4 w-4 text-blue-500" />; // Icon for distributors
  } else if (
    role === "Basic_Merchant_Package" ||
    role === "Premium_Merchant_Package" ||
    role === "merchant"
  ) {
    return <Store className="h-4 w-4 text-amber-500" />; // Icon for merchants
  } else if (role === "retailer") { // Added case for retailer
    return <ShoppingBag className="h-4 w-4 text-green-500" />; // Icon for retailer
  }

  return <User className="h-4 w-4 text-gray-500" />; // Default icon for other roles
}


// Format date for display
function formatDate(date: string | Date | null): string {
  if (!date) return "N/A"
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Get time since for display
function getTimeSince(date: string | Date | null): string {
  if (!date) return "N/A"

  const now = new Date()
  const pastDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays} days ago`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) return `${diffInMonths} months ago`

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} years ago`
}

// Get initials from name for avatar fallback
function getInitials(name: string): string {
  if (!name) return "?"

  const parts = name.split(" ")
  if (parts.length === 1) return name.substring(0, 2).toUpperCase()

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Search component
function SearchBar({
  searchTerm,
  onSearchTermChange,
  onSearch,
  onKeyDown,
}: {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  onSearch: () => void
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="relative w-full sm:w-64 group">
      <Input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="w-full pr-8 transition-all border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-0 top-0 h-full opacity-70 group-hover:opacity-100 transition-opacity"
        onClick={onSearch}
        type="submit"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Statistics panel component
function StatisticsPanel({ users }: { users: any[] }) {
  const totalUsers = users.length
  const totalDistributors = users.filter(
    (user) => user.user_role?.includes("Distributor") || user.user_role === "distributor",
  ).length
  const totalMerchants = users.filter(
    (user) => user.user_role?.includes("Merchant") || user.user_role === "merchant",
  ).length
  const averageCredits = users.reduce((sum, user) => sum + (user.user_credits || 0), 0) / (totalUsers || 1)

  // Generate user growth data
  const userGrowthData = getUserGrowthData(users)
  const userRoleData = [
    { name: "Distributors", value: totalDistributors },
    { name: "Merchants", value: totalMerchants },
  ]

  // Generate credit distribution data
  const creditDistribution = getCreditDistribution(users)

  return (
    <div className="space-y-6 p-4 animate-in fade-in duration-500">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <StatCard
            title="Total Users"
            value={totalUsers}
            icon={User}
            trend={5}
            description="Total members in your organization"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <StatCard
            title="Distributors"
            value={totalDistributors}
            icon={Users}
            trend={8}
            description="Members who can recruit others"
            color="blue"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <StatCard
            title="Merchants"
            value={totalMerchants}
            icon={Store}
            trend={3}
            description="Members who can process transactions"
            color="amber"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <StatCard
            title="Average Credits"
            value={`₱ ${averageCredits.toFixed(2)}`}
            icon={CreditCard}
            trend={-2}
            description="Average credits per member"
            color="emerald"
          />
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="h-full"
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>User Growth</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Export Data</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Change Time Range</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>Member growth over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  users: { label: "Users", color: "hsl(215, 100%, 60%)" },
                }}
                className="h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={userGrowthData}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="var(--color-users)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="h-full"
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>User Distribution</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Export Data</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Change Chart Type</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>Distribution of member types</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: "Users", color: "hsl(25, 100%, 60%)" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={userRoleData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} barSize={60} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Credit Distribution</CardTitle>
              <Badge variant="outline" className="font-normal">
                Last 30 days
              </Badge>
            </div>
            <CardDescription>Distribution of credits across your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {creditDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">₱ {item.value.toFixed(2)}</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Stat card component
function StatCard({ title, value, icon: Icon, trend, description, color = "default" }: any) {
  const getColorClasses = () => {
    switch (color) {
      case "blue":
        return "from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 text-blue-600 dark:text-blue-300"
      case "amber":
        return "from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 text-amber-600 dark:text-amber-300"
      case "emerald":
        return "from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 text-emerald-600 dark:text-emerald-300"
      default:
        return "from-gray-50 to-gray-100/50 dark:from-gray-900/20 dark:to-gray-800/10 text-gray-600 dark:text-gray-300"
    }
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader
        className={`flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r ${getColorClasses()}`}
      >
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4" />
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend !== undefined && (
            <Badge variant={trend >= 0 ? "default" : "destructive"} className="text-xs">
              {trend >= 0 ? "+" : ""}
              {trend}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Tree controls component
function TreeControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onExportImage,
  onPrint,
  onToggleFullscreen,
  isFullscreen,
  zoom,
  onZoomChange,
}: {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onExportImage: () => void
  onPrint: () => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
  zoom: number
  onZoomChange: (value: number[]) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-wrap items-center gap-2 justify-center sm:justify-between w-full"
    >
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onZoomIn} className="h-8 w-8 p-0">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Zoom In</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="w-32 hidden sm:block">
          <Slider value={[zoom * 100]} min={10} max={200} step={5} onValueChange={onZoomChange} />
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onZoomOut} className="h-8 w-8 p-0">
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Zoom Out</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Badge variant="outline" className="h-6 px-2 hidden sm:flex">
          {Math.round(zoom * 100)}%
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onResetView} className="h-8 w-8 p-0">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Reset View</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onExportImage} className="h-8 w-8 p-0">
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Export as Image</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onPrint} className="h-8 w-8 p-0">
                <Printer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Print</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onToggleFullscreen} className="h-8 w-8 p-0">
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  )
}

// Helper function to generate user growth data
function getUserGrowthData(users: UserType[]) {
  const usersWithCreatedAt = users.filter((user) => user.user_registered != null)

  const sortedUsers = usersWithCreatedAt.sort((a, b) => {
    const dateA = new Date(a.user_registered)
    const dateB = new Date(b.user_registered)
    return dateA.getTime() - dateB.getTime()
  })

  const userGrowth = sortedUsers.reduce(
    (acc, user, index) => {
      const date = new Date(user.user_registered)
      if (!isNaN(date.getTime())) {
        const dateString = date.toISOString().split("T")[0]
        if (!acc[dateString]) {
          acc[dateString] = index + 1
        }
      }
      return acc
    },
    {} as Record<string, number>,
  )

  return Object.entries(userGrowth).map(([date, users]) => ({ date, users }))
}

// Helper function to generate credit distribution data
function getCreditDistribution(users: UserType[]) {
  const distributorCredits = users
    .filter((user) => user.user_role?.includes("Distributor") || user.user_role === "distributor")
    .reduce((sum, user) => sum + (user.user_credits || 0), 0)

  const merchantCredits = users
    .filter((user) => user.user_role?.includes("Merchant") || user.user_role === "merchant")
    .reduce((sum, user) => sum + (user.user_credits || 0), 0)

  const adminCredits = users
    .filter((user) => user.user_role === "admin" || user.user_role === "master")
    .reduce((sum, user) => sum + (user.user_credits || 0), 0)

  const totalCredits = distributorCredits + merchantCredits + adminCredits || 1 // Avoid division by zero

  return [
    {
      label: "Distributors",
      value: distributorCredits,
      percentage: (distributorCredits / totalCredits) * 100,
      icon: <Users className="h-4 w-4 text-blue-500" />,
    },
    {
      label: "Merchants",
      value: merchantCredits,
      percentage: (merchantCredits / totalCredits) * 100,
      icon: <Store className="h-4 w-4 text-amber-500" />,
    },
    {
      label: "Admins",
      value: adminCredits,
      percentage: (adminCredits / totalCredits) * 100,
      icon: <Crown className="h-4 w-4 text-emerald-500" />,
    },
  ]
}

// Main component
export default function GenealogyTree() {
  const [treeData, setTreeData] = useState<CustomTreeNodeDatum | null>(null)
  const [data, setData] = useState<UserType[]>([])
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [lineStyle, setLineStyle] = useState<"step" | "diagonal" | "straight" | "curve">("step") // Default to step as requested
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical")
  const [zoom, setZoom] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNode, setSelectedNode] = useState<CustomTreeNodeDatum | null>(null)
  const [bounds, setBounds] = useState<any | null>(null)
  const [hoveredNode, setHoveredNode] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState<Omit<UserType, "ID" | "user_level" | "user_upline_id">>({
    display_name: "",
    user_activation_key: "",
    user_credits: 0,
    user_email: "",
    user_login: "",
    user_nicename: "",
    user_pass: "",
    user_referral_code: "",
    user_referred_by_id: null,
    user_registered: new Date().toISOString(),
    user_role: "distributor",
    user_status: 0,
    user_url: "",
    merchant_id: "",
  })
  const [referralCode, setReferralCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [matchedUser, setMatchedUser] = useState<UserType | null>(null)
  const treeContainerRef = useRef<HTMLDivElement>(null)
  const [searchResults, setSearchResults] = useState<CustomTreeNodeDatum[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)
  const [isUserInfoDialogOpen, setIsUserInfoDialogOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showTab, setShowTab] = useState(true)
  const [nodeSize, setNodeSize] = useState({ x: 200, y: 100 })
  const [showMiniMap, setShowMiniMap] = useState(false)
  const [showNodeLabels, setShowNodeLabels] = useState(true)
  const [highlightPath, setHighlightPath] = useState<number[]>([])
  const [showTooltip, setShowTooltip] = useState(true)
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    showMerchants: true,
    showDistributors: true,
    showAdmins: true,
    minLevel: 0,
    maxLevel: 10,
  })
  const { user } = useUserContext()
  const [optimizeForLargeTree, setOptimizeForLargeTree] = useState(false)

  const clampZoom = (value: number) => Math.min(Math.max(value, 0.1), 2)

  const form = useForm({
    defaultValues: {
      display_name: "",
      user_email: "",
      user_pass: "",
      user_nicename: "",
      user_login: "",
      merchant_id: "",
      user_role: "",
      referral_code: "",
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response: any = await getUsersWithUplineIdAndLevelByUplineId(user?.id || 0)
        console.log("Fetched data:", response.data)
        setData(response.data)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const calculateBounds = useCallback(() => {
    const container = treeContainerRef.current
    if (!container) return

    const containerWidth = container.offsetWidth
    const containerHeight = container.offsetHeight

    const scaledWidth = containerWidth / zoom
    const scaledHeight = containerHeight / zoom

    const maxX = (scaledWidth - containerWidth) / 2
    const maxY = (scaledHeight - containerHeight) / 2

    setBounds({
      left: -maxX,
      right: maxX,
      top: -maxY,
      bottom: maxY,
    })

    // Center the tree
    setTranslate({
      x: containerWidth / 2,
      y: containerHeight / 4,
    })
  }, [zoom])

  useEffect(() => {
    if (data.length > 0) {
      // Apply filters to data before building hierarchy
      let filteredData = [...data]

      if (!filterOptions.showMerchants) {
        filteredData = filteredData.filter(
          (user) => !user.user_role?.includes("Merchant") && user.user_role !== "merchant",
        )
      }

      if (!filterOptions.showDistributors) {
        filteredData = filteredData.filter(
          (user) => !user.user_role?.includes("Distributor") && user.user_role !== "distributor",
        )
      }

      if (!filterOptions.showAdmins) {
        filteredData = filteredData.filter((user) => user.user_role !== "admin" && user.user_role !== "master")
      }

      // Filter by level
      filteredData = filteredData.filter(
        (user) => user.user_level >= filterOptions.minLevel && user.user_level <= filterOptions.maxLevel,
      )

      const hierarchicalData = buildHierarchy(filteredData)
      setTreeData(hierarchicalData)
    }
  }, [data, filterOptions])

  useEffect(() => {
    calculateBounds()
  }, [zoom, calculateBounds])

  useEffect(() => {
    window.addEventListener("resize", calculateBounds)
    return () => window.removeEventListener("resize", calculateBounds)
  }, [calculateBounds])

  const renderCustomNodeElement: RenderCustomNodeElementFn = ({ nodeDatum, toggleNode }) => {
    const customNodeDatum = nodeDatum as CustomTreeNodeDatum
    const isHighlighted = highlightPath.includes(customNodeDatum.id)
    const roleColor = getRoleColor(customNodeDatum.role)
    const hasProfilePic = customNodeDatum.user?.profile_pic_url

    return (
      <g>
        {/* Node circle or avatar */}
        {hasProfilePic ? (
          <foreignObject x="-25" y="-25" width="50" height="50">
            <div
              className={`w-[50px] h-[50px] rounded-full overflow-hidden border-2 ${isHighlighted ? "border-emerald-500" : `border-[${roleColor}]`} shadow-md`}
              onMouseEnter={(event) => setHoveredNode({ ...customNodeDatum, event })}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => {
                setSelectedNode(customNodeDatum)
                setIsUserInfoDialogOpen(true)
              }}
            >
              <img
                src={customNodeDatum.user.profile_pic_url || "/placeholder.svg"}
                alt={customNodeDatum.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  ; (e.target as HTMLImageElement).style.display = "none"
                  const parent = (e.target as HTMLImageElement).parentElement
                  if (parent) {
                    parent.style.backgroundColor = roleColor
                    parent.textContent = getInitials(customNodeDatum.name)
                    parent.style.display = "flex"
                    parent.style.alignItems = "center"
                    parent.style.justifyContent = "center"
                    parent.style.color = "white"
                    parent.style.fontWeight = "bold"
                  }
                }}

              />
            </div>
          </foreignObject>
        ) : (
          <motion.circle
            initial={{ r: 0 }}
            animate={{
              r: 22,
              fill: isHighlighted ? "#10B981" : roleColor,
              stroke: isHighlighted ? "#047857" : "white",
              strokeWidth: isHighlighted ? 4 : 2,
              filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))",
            }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              setSelectedNode(customNodeDatum)
              setIsUserInfoDialogOpen(true)
            }}
            onMouseEnter={(event) => setHoveredNode({ ...customNodeDatum, event })}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer transition-all duration-300 hover:opacity-80"
          />
        )}

        {/* Node label without background overlay */}
        {showNodeLabels && (
          <foreignObject
            x={orientation === "vertical" ? "-75" : "-100"}
            y={orientation === "vertical" ? "25" : "-10"}
            width="150"
            height="40"
          >
            <div
              className={`text-sm font-medium text-center truncate px-2 py-1 rounded-md transition-all duration-300 ${getRoleTextColor(customNodeDatum.role)}`}
            >
              {customNodeDatum.nickname}
            </div>
          </foreignObject>
        )}

        {/* Expand/collapse button */}
        {customNodeDatum.children && customNodeDatum.children.length > 0 && (
          <motion.g
            whileHover={{ scale: 1.1 }}
            onClick={toggleNode}
            className="cursor-pointer transition-all duration-300"
            transform={`translate(${orientation === "vertical" ? 25 : 0}, ${orientation === "vertical" ? -25 : -25})`}
          >
            <circle
              r={10}
              fill="white"
              stroke={roleColor}
              strokeWidth="1.5"
              className="transition-colors duration-300"
            />
            <text textAnchor="middle" alignmentBaseline="central" fontSize="10" fontWeight="bold" fill={roleColor}>
              {customNodeDatum.__rd3t.collapsed ? "+" : "-"}
            </text>
          </motion.g>
        )}

        {/* Role indicator */}
        <foreignObject
          x={orientation === "vertical" ? "-40" : "-40"}
          y={orientation === "vertical" ? "-40" : "-40"}
          width="20"
          height="20"
        >
          <div className={`flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-sm`}>
            {getRoleIcon(customNodeDatum.role)}
          </div>
        </foreignObject>
      </g>
    )
  }

  const getPathFunction = () => {
    switch (lineStyle) {
      case "step":
        return (linkData: LinkData) => stepPath(linkData, orientation)
      case "diagonal":
        return "diagonal"
      case "straight":
        return (linkData: LinkData) => straightPath(linkData, orientation)
      case "curve":
        return (linkData: LinkData) => curvePath(linkData, orientation)
      default:
        return (linkData: LinkData) => stepPath(linkData, orientation)
    }
  }

  const handleSearch = useCallback(() => {
    if (!searchTerm) {
      setSearchResults([])
      return
    }

    const results = searchUsers(searchTerm)
    setSearchResults(results)
  }, [searchTerm])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        handleSearch()
      } else if (event.key === "Escape") {
        setSearchResults([])
      }
    },
    [handleSearch],
  )

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchResults([])
      }
    }

    document.addEventListener("keydown", handleEscapeKey)

    return () => {
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [])

  const searchUsers = (term: string): CustomTreeNodeDatum[] => {
    if (!treeData) return []

    const searchTermLower = term.toLowerCase()
    const queue: CustomTreeNodeDatum[] = [treeData as CustomTreeNodeDatum]
    const results: CustomTreeNodeDatum[] = []

    while (queue.length > 0) {
      const node = queue.shift()
      if (node) {
        if (
          node.name?.toLowerCase().includes(searchTermLower) ||
          node.user?.user_email?.toLowerCase().includes(searchTermLower) ||
          node.user?.user_login?.toLowerCase().includes(searchTermLower) ||
          node.user?.user_nicename?.toLowerCase().includes(searchTermLower) ||
          node.merchant_id?.toLowerCase().includes(searchTermLower)
        ) {
          results.push(node)
        }
        if (node.children) {
          queue.push(...node.children)
        }
      }
    }

    return results
  }

  const handleSelectSearchResult = (result: CustomTreeNodeDatum) => {
    setSelectedNode(result)
    setIsUserInfoDialogOpen(true)

    // Find path to the selected node and highlight it
    const path = findPathToNode(treeData, result.id)
    setHighlightPath(path)

    // Center view on the selected node if possible
    if (result.x !== undefined && result.y !== undefined && treeContainerRef.current) {
      const containerWidth = treeContainerRef.current.offsetWidth
      const containerHeight = treeContainerRef.current.offsetHeight

      setTranslate({
        x: containerWidth / 2 - (result.x || 0) * zoom,
        y: containerHeight / 2 - (result.y || 0) * zoom,
      })
    }
  }

  // Find path from root to a specific node
  const findPathToNode = (root: CustomTreeNodeDatum | null, targetId: number): number[] => {
    if (!root) return []

    if (root.id === targetId) {
      return [root.id]
    }

    if (root.children) {
      for (const child of root.children) {
        const path = findPathToNode(child, targetId)
        if (path.length > 0) {
          return [root.id, ...path]
        }
      }
    }

    return []
  }

  const handleAddUser = async () => {
    try {
      const uplineUser = data.find((user) => user.user_referral_code === referralCode)
      if (!uplineUser) {
        console.error("Invalid referral code")
        return
      }

      const newUserLevel = uplineUser.user_level + 1

      const response = await axios.post(`/api/add-user`, {
        ...newUser,
        user_upline_id: uplineUser.ID,
        user_referred_by_id: uplineUser.ID,
        user_level: newUserLevel,
      })

      setData((prevData) => [...prevData, response.data])
      setIsAddUserDialogOpen(false)
      setNewUser({
        display_name: "",
        user_activation_key: "",
        user_credits: 0,
        user_email: "",
        user_login: "",
        user_nicename: "",
        user_pass: "",
        user_referral_code: "",
        user_referred_by_id: null,
        user_registered: new Date().toISOString(),
        user_role: "distributor",
        user_status: 0,
        user_url: "",
        merchant_id: "",
      })
      setReferralCode("")
      setMatchedUser(null)
    } catch (error) {
      console.error("Error adding new user:", error)
    }
  }

  const handleReferralCodeChange = (code: string) => {
    setReferralCode(code)
    setIsLoading(true)

    const matchedUser = data.find((user) => user.user_referral_code === code)

    if (matchedUser) {
      setMatchedUser(matchedUser)
    } else {
      setMatchedUser(null)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (treeData) {
      setTreeData((prevData: any) => ({ ...prevData }))
    }
  }, [translate])

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const handleZoomIn = () => {
    setZoom((prevZoom) => clampZoom(prevZoom + 0.1))
  }

  const handleZoomOut = () => {
    setZoom((prevZoom) => clampZoom(prevZoom - 0.1))
  }

  const handleZoomChange = (values: number[]) => {
    if (values.length > 0) {
      setZoom(clampZoom(values[0] / 100))
    }
  }

  const handleResetView = () => {
    setZoom(1)
    setTranslate({ x: 0, y: 0 })
    setHighlightPath([])
  }

  const handleExportImage = async () => {
    const element = treeContainerRef.current
    if (element) {
      try {
        // Show a loading indicator
        const loadingToast = document.createElement("div")
        loadingToast.className = "fixed top-4 right-4 bg-primary text-white px-4 py-2 rounded-md shadow-lg z-50"
        loadingToast.textContent = "Generating image..."
        document.body.appendChild(loadingToast)

        const canvas = await html2canvas(element, {
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: getComputedStyle(document.body).backgroundColor || "#ffffff",
        })

        canvas.toBlob(
          (blob: any) => {
            if (blob) {
              saveAs(blob, `genealogy-tree-${new Date().toISOString().slice(0, 10)}.png`)
            }
            // Remove loading indicator
            document.body.removeChild(loadingToast)
          },
          "image/png",
          0.95,
        )
      } catch (error) {
        console.error("Error exporting image:", error)
      }
    }
  }

  const handlePrint = () => {
    const printContent = document.createElement("div")
    printContent.className = "print-content"

    // Add title and date
    const header = document.createElement("div")
    header.innerHTML = `
      <h1 style="text-align: center; font-size: 24px; margin-bottom: 8px;">Organization Genealogy Tree</h1>
      <p style="text-align: center; margin-bottom: 20px;">Generated on ${new Date().toLocaleDateString()}</p>
    `
    printContent.appendChild(header)

    // Capture the tree
    if (treeContainerRef.current) {
      html2canvas(treeContainerRef.current, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      }).then((canvas) => {
        const img = document.createElement("img")
        img.src = canvas.toDataURL("image/png")
        img.style.maxWidth = "100%"
        printContent.appendChild(img)

        // Create a print window
        const printWindow = window.open("", "_blank")
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Genealogy Tree</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  @media print {
                    @page { size: landscape; }
                  }
                </style>
              </head>
              <body>
                ${printContent.innerHTML}
              </body>
            </html>
          `)
          printWindow.document.close()

          // Print after images are loaded
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
          }, 500)
        }
      })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left mouse button
      setIsDragging(true)
      setDragStart({
        x: e.clientX - translate.x,
        y: e.clientY - translate.y,
      })
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y

        // Apply bounds if they exist
        const boundedX = bounds ? Math.min(Math.max(newX, bounds.left), bounds.right) : newX
        const boundedY = bounds ? Math.min(Math.max(newY, bounds.top), bounds.bottom) : newY

        setTranslate({
          x: boundedX,
          y: boundedY,
        })
      }
    },
    [isDragging, dragStart, bounds],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Handle wheel events for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY * -0.01
      setZoom((prevZoom) => clampZoom(prevZoom + delta))
    }
  }, [])

  useEffect(() => {
    const container = treeContainerRef.current
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false })
    }
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel)
      }
    }
  }, [handleWheel])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case "+":
        case "=":
          handleZoomIn()
          break
        case "-":
        case "_":
          handleZoomOut()
          break
        case "0":
          handleResetView()
          break
        case "f":
          handleFullscreen()
          break
        case "s":
          setShowStatistics(!showStatistics)
          break
        case "m":
          setShowMiniMap(!showMiniMap)
          break
        case "l":
          setShowNodeLabels(!showNodeLabels)
          break
        case "h":
          setIsHelpDialogOpen(true)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleZoomIn, handleZoomOut, handleResetView, handleFullscreen, showStatistics, showMiniMap, showNodeLabels])

  // Automatically optimize for large trees
  useEffect(() => {
    if (data.length > 100) {
      setOptimizeForLargeTree(true)
    }
  }, [data.length])

  const renderMiniMap = () => {
    if (!showMiniMap || !treeData) return null

    return (
      <div className="absolute bottom-20 right-4 w-56 h-56 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-xl overflow-hidden">
        <div className="relative w-full h-full p-1">
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="outline" className="bg-background/80 text-xs">
              Mini Map
            </Badge>
          </div>
          <div
            className="absolute inset-0 transform scale-[0.15] origin-center"
            style={{
              transform: `scale(0.15) translate(${-translate.x * 2}px, ${-translate.y * 2}px)`,
            }}
          >
            {treeData && (
              <Tree
                data={treeData}
                orientation={orientation}
                pathFunc="straight"
                nodeSize={{ x: 10, y: 10 }}
                renderCustomNodeElement={() => (
                  <circle r={3} fill={getRoleColor("distributor")} stroke="white" strokeWidth={1} />
                )}
                separation={{ siblings: 0.5, nonSiblings: 0.5 }}
                translate={{ x: 0, y: 0 }}
              />
            )}
          </div>
          <div
            className="absolute border-2 border-primary pointer-events-none"
            style={{
              width: `${Math.min(100, 100 / zoom)}%`,
              height: `${Math.min(100, 100 / zoom)}%`,
              left: `${50 - Math.min(50, 50 / zoom)}%`,
              top: `${50 - Math.min(50, 50 / zoom)}%`,
            }}
          />
        </div>
      </div>
    )
  }

  // Render node tooltip
  const renderNodeTooltip = () => {
    if (!hoveredNode || !showTooltip) return null

    const { user, event } = hoveredNode
    const role = formatUserRole(user.user_role)
    const roleColorClass = getRoleTextColor(user.user_role)
    const roleBgClass = getRoleBackgroundColor(user.user_role)
    const roleBorderClass = getRoleBorderColor(user.user_role)

    // Calculate position based on mouse event
    const x = (event.clientX || 0) - 200
    const y = (event.clientY || 0) - 200

    return (
      <div
        className={`absolute z-50 p-3 rounded-lg shadow-lg ${roleBgClass} ${roleBorderClass} border`}
        style={{
          left: `${x}px`,
          top: `${y}px`,
          maxWidth: "300px",
        }}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            {user.profile_pic_url ? (
              <AvatarImage src={user.profile_pic_url} alt={user.user_nicename} />
            ) : (
              <AvatarFallback>{getInitials(user.user_nicename)}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <h3 className="font-medium">{user.user_nicename}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getRoleIcon(user.user_role)}
              <span className={roleColorClass}>{role}</span>
            </div>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Level:</span>
                <Badge variant="outline" className="ml-2">
                  {user.user_level}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Credits:</span>
                <span className="font-medium">
                  ₱ {user.user_credits != null ? formatNumber(user.user_credits) : "0.00"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Joined:</span>
                <span>{formatDate(user.user_registered)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render user info dialog with improved UI
  const renderUserInfoDialog = () => {
    if (!selectedNode) return null

    const user = selectedNode.user
    const role = formatUserRole(user.user_role)
    const roleColorClass = getRoleTextColor(user.user_role)
    const roleBgClass = getRoleBackgroundColor(user.user_role)
    const roleBorderClass = getRoleBorderColor(user.user_role)

    return (
      <Dialog open={isUserInfoDialogOpen} onOpenChange={setIsUserInfoDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>User Information</DialogTitle>
            <DialogDescription>Detailed information about the selected user.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* User header with avatar and basic info */}
            <div className={`flex items-center gap-4 p-4 rounded-lg ${roleBgClass} ${roleBorderClass} border`}>
              <Avatar className="h-16 w-16 border-2 border-white">
                {user.profile_pic_url ? (
                  <AvatarImage src={user.profile_pic_url} alt={user.user_nicename} />
                ) : (
                  <AvatarFallback>{getInitials(user.user_nicename)}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{user.user_nicename}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleIcon(user.user_role)}
                  <span className={`font-medium ${roleColorClass}`}>{role}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>{user.user_email}</span>
                </div>
              </div>
            </div>

            {/* User details in card format */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Username:</span>
                    <span className="font-medium">{user.user_login}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nickname:</span>
                    <span className="font-medium">{user.user_nicename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="font-medium">{formatDate(user.user_registered)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={user.user_status === 1 ? "default" : "secondary"}>
                      {user.user_status === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Organization Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level:</span>
                    <Badge variant="outline">{user.user_level}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Upline ID:</span>
                    <span className="font-medium">{user.user_upline_id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Merchant ID:</span>
                    <span className="font-medium">{user.merchant_id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referral Code:</span>
                    <span className="font-medium">{user.user_referral_code || "N/A"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Credits Balance:</span>
                  <span className="text-xl font-bold">
                    ₱ {formatNumber(user.user_credits ?? 0)}
                  </span>

                </div>
                <Progress value={Math.min((user.user_credits / 1000) * 100, 100)} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {user.user_credits < 500 ? "Low" : user.user_credits < 2000 ? "Good" : "Excellent"} balance
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setHighlightPath([])}>
              Clear Highlight
            </Button>
            <Button type="button" onClick={() => setIsUserInfoDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Render list view of users
  const renderListView = () => {
    return (
      <div className="p-4 overflow-auto h-full">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((user) => (
            <Card
              key={user.ID}
              className={`overflow-hidden transition-all hover:shadow-md ${getRoleBorderColor(user.user_role)} border`}
            >
              <CardHeader className={`pb-2 ${getRoleBackgroundColor(user.user_role)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-white">
                      {user.profile_pic_url ? (
                        <AvatarImage src={user.profile_pic_url} alt={user.display_name} />
                      ) : (
                        <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                      )}
                    </Avatar>
                    <CardTitle className="text-sm font-medium truncate">{user.display_name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Level {user.user_level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {getRoleIcon(user.user_role)}
                  <span className={`${getRoleTextColor(user.user_role)}`}>{formatUserRole(user.user_role)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="truncate">{user.user_email}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-muted-foreground">Credits:</span>
                  <span className="font-medium">₱ {formatNumber(user.user_credits ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="text-xs">{formatDate(user.user_registered)}</span>
                </div>
              </CardContent>
              <CardFooter className="p-2 bg-muted/50 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const node = {
                      ...user,
                      id: user.ID,
                      name: user.display_name,
                      role: user.user_role,
                      nickname: user.user_nicename,
                      merchant_id: user.merchant_id,
                      level: user.user_level,
                      uplineId: user.user_upline_id,
                      user: user,
                    } as unknown as CustomTreeNodeDatum
                    setSelectedNode(node)
                    setIsUserInfoDialogOpen(true)
                  }}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-hidden relative flex flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        {/* Title and Description Section */}
        <div className="flex flex-col w-full sm:w-auto">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl sm:text-3xl font-bold flex items-center gap-2"
          >
            <Sparkles className="h-6 w-6 text-primary" />
            My Organization
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-muted-foreground text-sm sm:text-base mt-1"
          >
            Analyze and manage your organization's genealogy tree
          </motion.p>
        </div>

        {/* Search and Actions Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* Search Bar */}
          <SearchBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSearch={handleSearch}
            onKeyDown={handleKeyDown}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsFilterDialogOpen(true)}
                    className="h-9 w-9 transition-all hover:border-primary hover:text-primary"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Filter Tree</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowStatistics(!showStatistics)}
                    className={`h-9 w-9 transition-all ${showStatistics ? "bg-primary/10 text-primary border-primary" : "hover:border-primary hover:text-primary"}`}
                  >
                    <BarChart2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{showStatistics ? "Hide Statistics" : "Show Statistics"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsHelpDialogOpen(true)}
                    className="h-9 w-9 transition-all hover:border-primary hover:text-primary"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Help</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Tree Settings"
                  className="h-9 w-9 transition-all hover:border-primary hover:text-primary"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Tree Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {/* Line Style Settings */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <LineChart className="mr-2 h-4 w-4" />
                      Line Style
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() => setLineStyle("step")}
                          className={lineStyle === "step" ? "bg-primary/10 text-primary" : ""}
                        >
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Step
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLineStyle("diagonal")}
                          className={lineStyle === "diagonal" ? "bg-primary/10 text-primary" : ""}
                        >
                          <ArrowDown className="mr-2 h-4 w-4 rotate-45" />
                          Diagonal
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLineStyle("straight")}
                          className={lineStyle === "straight" ? "bg-primary/10 text-primary" : ""}
                        >
                          <ArrowDown className="mr-2 h-4 w-4" />
                          Straight
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLineStyle("curve")}
                          className={lineStyle === "curve" ? "bg-primary/10 text-primary" : ""}
                        >
                          <LineChart className="mr-2 h-4 w-4" />
                          Curve
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  {/* Orientation Settings */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Orientation
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() => setOrientation("vertical")}
                          className={orientation === "vertical" ? "bg-primary/10 text-primary" : ""}
                        >
                          <ArrowDown className="mr-2 h-4 w-4" />
                          Vertical
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setOrientation("horizontal")}
                          className={orientation === "horizontal" ? "bg-primary/10 text-primary" : ""}
                        >
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Horizontal
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  {/* Display Options */}
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={showNodeLabels} onCheckedChange={setShowNodeLabels}>
                    <Eye className="mr-2 h-4 w-4" />
                    Show Node Labels
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showMiniMap} onCheckedChange={setShowMiniMap}>
                    <Maximize className="mr-2 h-4 w-4" />
                    Show Mini Map
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showTooltip} onCheckedChange={setShowTooltip}>
                    <Info className="mr-2 h-4 w-4" />
                    Show Tooltips
                  </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <Tabs defaultValue="genealogy" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="genealogy" onClick={() => setShowTab(true)}>
            <Users className="h-4 w-4 mr-2" />
            Genealogy
          </TabsTrigger>
          <TabsTrigger value="list" onClick={() => setShowTab(false)}>
            <Layers className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="genealogy" className="flex-1 flex overflow-hidden">
          {showStatistics && (
            <div className="w-full p-4 bg-background border-r overflow-y-auto">
              <StatisticsPanel users={data} />
            </div>
          )}
          <div
            ref={treeContainerRef}
            className="relative flex-1 overflow-hidden bg-gradient-to-br from-background to-background/80"
            onMouseDown={handleMouseDown}
            style={{
              cursor: isDragging ? "grabbing" : "grab",
              height: "calc(100vh - 160px)", // Explicit height calculation
            }}
          >
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">Loading organization data...</p>
                </div>
              </div>
            ) : treeData ? (
              <>
                {!isLoading && treeData && Object.keys(treeData).length > 0 && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                      {data.length} members
                    </Badge>
                  </div>
                )}
                <Tree
                  data={treeData}
                  orientation={orientation}
                  translate={translate}
                  zoom={zoom}
                  pathFunc={getPathFunction()}
                  renderCustomNodeElement={renderCustomNodeElement}
                  nodeSize={nodeSize}
                  separation={{ siblings: 1.5, nonSiblings: 2 }}
                  enableLegacyTransitions={!optimizeForLargeTree}
                  transitionDuration={optimizeForLargeTree ? 0 : 500}
                />
                <div className="absolute bottom-4 left-4 right-4">
                  <TreeControls
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onResetView={handleResetView}
                    onExportImage={handleExportImage}
                    onPrint={handlePrint}
                    onToggleFullscreen={handleFullscreen}
                    isFullscreen={isFullscreen}
                    zoom={zoom}
                    onZoomChange={handleZoomChange}
                  />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                No data available.
              </div>
            )}
            {renderMiniMap()}
            {renderNodeTooltip()}
          </div>
        </TabsContent>

        <TabsContent value="list" className="h-full overflow-scroll ml-4 mr-4">
          {showTab === false && <OrganizationList userId={user?.id ?? 0} />}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {renderUserInfoDialog()}

      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Add a new user to the organization.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddUser)} className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="johndoe@example.com"
                        {...field}
                        onChange={(e) => setNewUser({ ...newUser, user_email: e.target.value })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user_login"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="johndoe"
                        {...field}
                        onChange={(e) => setNewUser({ ...newUser, user_login: e.target.value })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user_pass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        onChange={(e) => setNewUser({ ...newUser, user_pass: e.target.value })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={"user_nicename"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nickname</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John"
                        {...field}
                        onChange={(e) => setNewUser({ ...newUser, user_nicename: e.target.value })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="merchant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merchant ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional"
                        {...field}
                        onChange={(e) => setNewUser({ ...newUser, merchant_id: e.target.value })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={(value) => setNewUser({ ...newUser, user_role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Elite_Distributor_Package">Elite Distributor</SelectItem>
                        <SelectItem value="Elite_Plus_Distributor_Package">Elite Plus Distributor</SelectItem>
                        <SelectItem value="Basic_Merchant_Package">Basic Merchant</SelectItem>
                        <SelectItem value="Premium_Merchant_Package">Premium Merchant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="referral_code" className="text-right">
                  Referral Code
                </Label>
                <Input
                  type="text"
                  id="referral_code"
                  placeholder="Enter referral code"
                  value={referralCode}
                  onChange={(e) => handleReferralCodeChange(e.target.value)}
                  className="col-span-3"
                />
              </div>
              {isLoading && <p>Checking referral code...</p>}
              {matchedUser && (
                <div className="col-span-4">
                  <Badge variant="secondary">
                    Referred by: {matchedUser.display_name} ({matchedUser.user_email})
                  </Badge>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add User</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Help</DialogTitle>
            <DialogDescription>Here are some tips to help you navigate the genealogy tree.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <h3 className="font-semibold mb-2">Basic Controls</h3>
              <p>
                <strong>Zooming:</strong> Use the zoom controls or your mouse wheel (Ctrl + Wheel) to zoom in and out.
              </p>
              <p>
                <strong>Panning:</strong> Click and drag the tree to pan around.
              </p>
              <p>
                <strong>Node Information:</strong> Click on a node to view detailed information about the user.
              </p>
              <p>
                <strong>Searching:</strong> Use the search bar to find specific users by name, email, or merchant ID.
              </p>
              <p>
                <strong>Filtering:</strong> Use the filter options to show or hide specific types of users.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Keyboard Shortcuts</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">+/=</div>
                <div>Zoom In</div>
                <div className="font-medium">-/_</div>
                <div>Zoom Out</div>
                <div className="font-medium">0</div>
                <div>Reset View</div>
                <div className="font-medium">f</div>
                <div>Toggle Fullscreen</div>
                <div className="font-medium">s</div>
                <div>Toggle Statistics</div>
                <div className="font-medium">m</div>
                <div>Toggle Mini Map</div>
                <div className="font-medium">l</div>
                <div>Toggle Node Labels</div>
                <div className="font-medium">h</div>
                <div>Show Help</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setIsHelpDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filter Options</DialogTitle>
            <DialogDescription>Customize the visibility of nodes in the genealogy tree.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="showMerchants"
                checked={filterOptions.showMerchants}
                onCheckedChange={(checked) => setFilterOptions({ ...filterOptions, showMerchants: checked })}
              />
              <Label htmlFor="showMerchants" className="flex items-center gap-2">
                <Store className="h-4 w-4 text-amber-500" />
                Show Merchants
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="showDistributors"
                checked={filterOptions.showDistributors}
                onCheckedChange={(checked) => setFilterOptions({ ...filterOptions, showDistributors: checked })}
              />
              <Label htmlFor="showDistributors" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Show Distributors
              </Label>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minLevel" className="text-right">
                Min Level
              </Label>
              <Input
                type="number"
                id="minLevel"
                value={filterOptions.minLevel}
                onChange={(e) =>
                  setFilterOptions({
                    ...filterOptions,
                    minLevel: Number.parseInt(e.target.value),
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxLevel" className="text-right">
                Max Level
              </Label>
              <Input
                type="number"
                id="maxLevel"
                value={filterOptions.maxLevel}
                onChange={(e) =>
                  setFilterOptions({
                    ...filterOptions,
                    maxLevel: Number.parseInt(e.target.value),
                  })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setIsFilterDialogOpen(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-16 left-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20 shadow-md rounded-md overflow-hidden"
        >
          <ul className="py-2">
            {searchResults.map((result) => (
              <motion.li
                key={result.id}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                onClick={() => handleSelectSearchResult(result)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {result.user.profile_pic_url ? (
                      <AvatarImage src={result.user.profile_pic_url} alt={result.nickname} />
                    ) : (
                      <AvatarFallback>{getInitials(result.nickname)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium">{result.nickname}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      {getRoleIcon(result.role)}
                      <span>{formatUserRole(result.role)}</span>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}

// Add keyboard shortcuts


