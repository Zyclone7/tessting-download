"use client"

import type * as React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  AirplayIcon,
  BarChart3,
  Bell,
  BookAIcon,
  Calendar,
  ChevronDown,
  CreditCardIcon as IdCardIcon,
  FileText,
  Home,
  LayoutDashboard,
  LoaderCircleIcon,
  LogOut,
  MessageCircleQuestion,
  MessagesSquare,
  Package,
  PieChart,
  PlaneIcon,
  Settings,
  Shield,
  StoreIcon,
  User2,
  Users,
  Wallet,
  PhoneIcon,
  User2Icon,
  LucideStore,
  ShoppingCartIcon,
  PenIcon,
  Edit2,
  FileInput,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"
import { useUserContext } from "@/hooks/use-user"
import { getUserKYCStatus } from "@/actions/user"
import { getATMGOApplicationStatus } from "@/actions/atmgo" // Import the ATM GO status function
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge" // Import Badge component
import Logo from "@/public/images/pt-logo-cropped.png"
import BusinessName from "@/public/images/pt-business-name-cropped2.png"
import { preload } from "react-dom"
import {
  UsersIcon as IconUsersGroup,
  InfoIcon as IconReport,
  PiggyBankIcon as IconMoneybag,
  CoinsIcon as IconCash,
  PackageIcon as IconPackages,
  TicketIcon as IconTicket,
  PlaneIcon as IconPlane,
  MapIcon as IconSitemap,
} from "lucide-react"
import { MobileIcon } from "@radix-ui/react-icons"

// Prefetch Link component to optimize navigation
const PrefetchLink = ({
  href,
  children,
  className,
}: { href: string; children: React.ReactNode; className?: string }) => {
  const handleMouseEnter = () => {
    // Use React 19's preload API to preload the page
    preload(href, { as: "document" })
  }

  return (
    <Link href={href} className={className} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  )
}

// Add this data structure after the PrefetchLink component and before the existing menu items
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: Wallet,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/admin-dashboard",
      icon: LayoutDashboard,
      isActive: true,
      forRoles: ["admin"],
    },
    {
      title: "Users",
      url: "/admin-dashboard/users",
      icon: IconUsersGroup,
      isActive: true,
      forRoles: ["admin", "manager", "kyc_approver"],
    },
    {
      title: "KYC Verification",
      url: "/admin-dashboard/kyc",
      icon: IconUsersGroup,
      isActive: true,
      forRoles: ["admin", "verifier", "kyc_approver"],
    },
    {
      title: "ATM Transactions",
      url: "/admin-dashboard/atm-transaction",
      icon: IconReport,
      isActive: true,
      forRoles: ["verifier", "uploader", "admin", "approver"],
    },
    {
      title: "Passive Income",
      url: "/admin-dashboard/passive-income",
      icon: IconMoneybag,
      isActive: true,
      forRoles: ["admin", "manager"],
    },
    {
      title: "Referral Income",
      url: "/admin-dashboard/referral-income",
      icon: IconCash,
      isActive: true,
      forRoles: ["admin", "manager"],
    },
    {
      title: "Genealogy",
      url: "/admin-dashboard/genealogy",
      icon: IconPackages,
      isActive: true,
      forRoles: ["admin", "manager"],
    },
    {
      title: "Packages",
      url: "/admin-dashboard/product-info",
      icon: Package,
      isActive: true,
      forRoles: ["admin", "manager"],
    },
    {
      title: "Vouchers",
      url: "/admin-dashboard/vouchers",
      icon: IconTicket,
      isActive: true,
      forRoles: ["admin", "uploader", "voucher_uploader"],
    },
    {
      title: "Travels",
      url: "/admin-dashboard/travels",
      icon: IconPlane,
      isActive: true,
      forRoles: ["admin", "manager", "travel_approver"],
    },
    {
      title: "Hotels",
      url: "/admin-dashboard/hotel",
      icon: IconSitemap,
      isActive: true,
      forRoles: ["admin", "manager", "travel_approver"],
    },
    {
      title: "Pending Bank Details",
      url: "/admin-dashboard/pending-updates",
      icon: PenIcon,
      isActive: true,
      forRoles: ["admin"],
    },
    {
      title: "ATM FORM APPROVED",
      url: "/admin-dashboard/atm-go-form",
      icon: PenIcon,
      isActive: true,
      forRoles: ["admin"],
    },
    {
      title: "Bank Management",
      url: "/admin-dashboard/bank-details",
      icon: Edit2,
      isActive: true,
      forRoles: ["admin", "kyc_approver"],
    },
    {
      title: "Settings",
      icon: Settings,
      isActive: true,
      forRoles: ["admin"],
      subItems: [
        {
          title: "General",
          url: "/admin-dashboard/settings",
          icon: FileText,
          forRoles: ["admin"],
        },
        {
          title: "Terms Management",
          url: "/admin-dashboard/terms-management",
          icon: BookAIcon,
          forRoles: ["admin"],
        },
        {
          title: "User Access",
          url: "/admin-dashboard/settings/user-access",
          icon: User2,
          forRoles: ["admin"],
        },
        {
          title: "Notifications",
          url: "/admin-dashboard/settings/notifications",
          icon: Bell,
          forRoles: ["admin"],
        },
        {
          title: "Security",
          url: "/admin-dashboard/settings/security",
          icon: Shield,
          forRoles: ["admin"],
        },
      ],
    },
  ],
}

// Define menu items for different roles
const userMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/user-dashboard",
    requiresVerification: false,
  },
  {
    title: "Personal Details",
    icon: User2Icon,
    url: "/user-dashboard/personal-details",
    requiresVerification: false,
  },
  {
    title: "KYC Verification",
    icon: IdCardIcon,
    url: "/user-dashboard/kyc",
    requiresVerification: false,
    hideWhenVerified: true,
  },
  {
    title: "XpressLoad",
    icon: MobileIcon,
    url: "/user-dashboard/sell-voucher",
    requiresVerification: true,
  },
  {
    title: "XpressTravels",
    icon: PlaneIcon,
    url: "/user-dashboard/xpresstravels",
    requiresVerification: true,
    disabledForRoles: ["retailer"],
  },
  {
    title: "XpressRetailers",
    icon: LucideStore,
    url: "/user-dashboard/retailers",
    requiresVerification: true,
    isActive: false,
    // disabled: true,
    disabledForRoles: ["retailer"],
  },
  {
    title: "XpressStore",
    icon: ShoppingCartIcon,
    url: "/user-dashboard/store",
    requiresVerification: true,
    disabledForRoles: ["retailer"],
  },
  {
    title: "Free Product",
    icon: AirplayIcon,
    url: "/user-dashboard/free-product",
    requiresVerification: true,
    disabledForRoles: ["retailer"],
  },
  {
    title: "ATM Go Form",
    icon: FileInput,
    url: "/user-dashboard/atm-go-form",
    requiresVerification: true,
    disabledForRoles: ["retailer"],
    disableWhenSubmitted: true, // New property to control disabling based on submission
  },
  {
    title: "Upload Requirements",
    icon: FileInput,
    url: "/user-dashboard/atm-go-requirements",
    requiresVerification: true,
    disabledForRoles: ["retailer"],
    visibleOnlyWhenFormApproved: true, // Add this property to make it visible only when ATM form is approved
  },
  {
    title: "E-Learnings",
    icon: BookAIcon,
    url: "#",
    requiresVerification: false,
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/user-dashboard/profile-edit",
    requiresVerification: false,
  }
]

const userSupportItems = [
  {
    title: "FAQ",
    icon: MessageCircleQuestion,
    url: "https://philtechbusiness.ph/faq/",
    requiresVerification: false,
  },
  {
    title: "Contact Us",
    icon: MessagesSquare,
    url: "https://philtechbusiness.ph/contact/",
    requiresVerification: false,
  },
]

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/admin-dashboard",
    icon: LayoutDashboard,
    forRoles: ["admin"],
  },
  {
    title: "Users",
    url: "/admin-dashboard/users",
    icon: Users,
    forRoles: ["admin", "manager", "kyc_approver"],
  },
  {
    title: "KYC Verification",
    url: "/admin-dashboard/kyc",
    icon: IdCardIcon,
    forRoles: ["admin", "verifier", "kyc_approver"],
  },
  {
    title: "ATM Transactions",
    url: "/admin-dashboard/atm-transaction",
    icon: BarChart3,
    forRoles: ["verifier", "uploader", "admin", "approver"],
  },
  {
    title: "Passive Income",
    url: "/admin-dashboard/passive-income",
    icon: Wallet,
    forRoles: ["admin", "manager"],
  },
  {
    title: "Referral Income",
    url: "/admin-dashboard/referral-income",
    icon: PieChart,
    forRoles: ["admin", "manager"],
  },
  {
    title: "Genealogy",
    url: "/admin-dashboard/genealogy",
    icon: Users,
    forRoles: ["admin", "manager"],
  },
  {
    title: "Packages",
    url: "/admin-dashboard/product-info",
    icon: Package,
    forRoles: ["admin", "manager"],
  },
  {
    title: "Vouchers",
    url: "/admin-dashboard/vouchers",
    icon: Calendar,
    forRoles: ["admin", "uploader"],
  },
  {
    title: "Travels",
    url: "/admin-dashboard/travels",
    icon: PlaneIcon,
    forRoles: ["admin", "manager"],
  },
  {
    title: "Hotels",
    url: "/admin-dashboard/hotel",
    icon: Home,
    forRoles: ["admin", "manager"],
  },
  {
    title: "Settings",
    icon: Settings,
    forRoles: ["admin"],
    subItems: [
      {
        title: "General",
        url: "/admin-dashboard/settings",
        icon: FileText,
        forRoles: ["admin"],
      },
      {
        title: "User Access",
        url: "/admin-dashboard/settings/user-access",
        icon: User2,
        forRoles: ["admin"],
      },
      {
        title: "Notifications",
        url: "/admin-dashboard/settings/notifications",
        icon: Bell,
        forRoles: ["admin"],
      },
      {
        title: "Security",
        url: "/admin-dashboard/settings/security",
        icon: Shield,
        forRoles: ["admin"],
      },
    ],
  },
]

function formatAdminRole(role: string) {
  if (typeof role !== "string") {
    throw new Error("Input must be a string");
  }
  return role.replace(/_/g, " ").toUpperCase();
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, clearUser } = useUserContext()
  const pathname = usePathname()
  const router = useRouter()
  const [kycStatus, setKycStatus] = useState<string>("0")
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [atmFormStatus, setAtmFormStatus] = useState<{
    hasApplication: boolean;
    status: string | null;
    isApproved: boolean;
    isPending: boolean;
    isRejected: boolean;
    isDone: boolean; // Add this property to track DONE status
  }>({
    hasApplication: false,
    status: null,
    isApproved: false,
    isPending: false,
    isRejected: false,
    isDone: false
  })

  // Determine if user is admin based on role or pathname
  useEffect(() => {
    const adminPath = pathname?.includes("/admin-dashboard")
    const adminRole = user?.role === "admin" || user?.role?.includes("admin")
    setIsAdmin(!!adminRole || (adminPath && !!user?.role))
  }, [pathname, user])

  // Fetch KYC status for user role
  useEffect(() => {
    const fetchKYCStatus = async () => {
      if (user && user.id && !isAdmin) {
        try {
          const response: any = await getUserKYCStatus(user.id.toString())
          if (response?.success && response?.data !== undefined && response?.data !== null) {
            setKycStatus(String(response.data))
          }
        } catch (error) {
          console.error("Error fetching KYC status:", error)
        }
      }
    }

    fetchKYCStatus()
  }, [user, isAdmin])

  // Fetch ATM GO form status
  useEffect(() => {
    const fetchATMGOStatus = async () => {
      if (user && user.id && !isAdmin) {
        try {
          const response = await getATMGOApplicationStatus(user.id.toString())
          if (response?.success && response?.data) {
            setAtmFormStatus({
              hasApplication: response.data.hasApplication || false,
              status: response.data.status,
              isApproved: response.data.isApproved || false,
              isPending: response.data.isPending || false,
              isRejected: response.data.isRejected || false,
              isDone: response.data.status === "DONE" || false // Check if status is DONE
            })
          }
        } catch (error) {
          console.error("Error fetching ATM GO status:", error)
        }
      }
    }

    fetchATMGOStatus()
  }, [user, isAdmin])

  // Toggle submenu
  const toggleItem = (itemTitle: string) => {
    setActiveItem((prev) => (prev === itemTitle ? null : itemTitle))
  }

  // Auto-open parent menu when subitem is active
  useEffect(() => {
    if (isAdmin) {
      adminMenuItems.forEach((item) => {
        if (item.subItems) {
          const hasActiveSubItem = item.subItems.some((subItem) => subItem.url === pathname)
          if (hasActiveSubItem) setActiveItem(item.title)
        }
      })
    }
  }, [pathname, isAdmin])

  // Handle logout
  const handleLogout = () => {
    clearUser()
    router.push("/login")
  }

  // Check if user is verified
  const isUserVerified = user?.status !== 0 || kycStatus === "1"

  // Filter admin menu items based on user role
  const filteredAdminItems = data.navMain.filter((item) => {
    if (!item.forRoles || user?.role === "admin") return true
    return item.forRoles.includes(user?.role || "")
  })

  // Filter user menu items based on verification status and user role
  const filteredUserItems = userMenuItems.filter((item) => {
    // Hide if marked to hide when verified and user is verified
    if (item.hideWhenVerified && kycStatus === "1") return false

    // Hide if the item is disabled for the user's role
    if (item.disabledForRoles?.includes(user?.role || "")) return false

    // Hide "Upload Requirements" if ATM form is not approved
    if (item.visibleOnlyWhenFormApproved && !atmFormStatus.isApproved) return false

    return true
  })

  // Get user display data
  const userData = user
    ? {
      name: user.nickname || user.name || "User",
      email: user.email || "",
      avatar: user.profile_pic_url || "/avatars/default-avatar.png",
      role: user.role || "user",
    }
    : {
      name: "Guest",
      email: "guest@example.com",
      avatar: "/avatars/default-avatar.png",
      role: "guest",
    }

  // Format role for display
  const formatRole = (role: string) => {
    if (!role) return "User"

    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
      .replace("Package", "")
  }

  // Render status badge for ATM GO form
  const renderStatusBadge = (item: any) => {
    if (!item.showStatus || !atmFormStatus.hasApplication) return null;

    if (atmFormStatus.status === "DONE") {
      return (
        <Badge variant="outline" className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3" />
          <span className="text-xs">Done</span>
        </Badge>
      );
    } else if (atmFormStatus.isApproved) {
      return (
        <Badge variant="default" className="ml-auto flex items-center gap-1 px-2 py-0.5">
          <CheckCircle className="w-3 h-3" />
          <span className="text-xs">Approved</span>
        </Badge>
      );
    } else if (atmFormStatus.isPending) {
      return (
        <Badge variant="destructive" className="ml-auto flex items-center gap-1 px-2 py-0.5">
          <Clock className="w-3 h-3" />
          <span className="text-xs">Pending</span>
        </Badge>
      );
    } else if (atmFormStatus.isRejected) {
      return (
        <Badge variant="destructive" className="ml-auto flex items-center gap-1 px-2 py-0.5">
          <XCircle className="w-3 h-3" />
          <span className="text-xs">Rejected</span>
        </Badge>
      );
    }
    
    return null;
  };

  // Monitor sidebar collapse state
  useEffect(() => {
    const handleResize = () => {
      const sidebarElement = document.querySelector('[data-sidebar="sidebar"]')
      if (sidebarElement) {
        const isCollapsed = sidebarElement.getAttribute("data-collapsible") === "icon"
        setIsSidebarCollapsed(isCollapsed)
      }
    }

    // Initial check
    handleResize()

    // Set up observer to detect attribute changes
    const observer = new MutationObserver(handleResize)
    const sidebarElement = document.querySelector('[data-sidebar="sidebar"]')

    if (sidebarElement) {
      observer.observe(sidebarElement, { attributes: true })
    }

    // Clean up
    return () => {
      observer.disconnect()
    }
  }, [])

  // Add Speculation Rules for browsers that support it
  const SpeculationRules = () => {
    // Get all menu items URLs
    const allUrls = [
      ...data.navMain.map((item) => item.url).filter(Boolean),
      ...data.navMain
        .filter((item) => item.subItems)
        .flatMap((item) => item.subItems?.map((subItem) => subItem.url) || []),
      ...userMenuItems.map((item) => item.url).filter(Boolean),
      ...userSupportItems.map((item) => item.url).filter(Boolean),
    ]

    // Create speculation rules for prefetching
    const speculationRules = {
      prefetch: [
        {
          urls: allUrls,
          eagerness: "moderate", // Only prefetch when likely to be needed
        },
      ],
      prerender: [
        {
          urls: allUrls,
          eagerness: "conservative", // Only prerender when very likely to be needed
        },
      ],
    }

    return (
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(speculationRules),
        }}
        type="speculationrules"
      />
    )
  }

  // Add the SpeculationRules component to the JSX
  useEffect(() => {
    // Add speculation rules to the document head
    const head = document.head
    const script = document.createElement("script")
    script.type = "speculationrules"

    const allUrls = [
      ...data.navMain.map((item) => item.url).filter(Boolean),
      ...data.navMain
        .filter((item) => item.subItems)
        .flatMap((item) => item.subItems?.map((subItem) => subItem.url) || []),
      ...userMenuItems.map((item) => item.url).filter(Boolean),
      ...userSupportItems.map((item) => item.url).filter(Boolean),
    ].filter((url) => url !== "#" && url !== undefined)

    const speculationRules = {
      prefetch: [
        {
          urls: allUrls,
          eagerness: "moderate",
        },
      ],
      prerender: [
        {
          urls: allUrls,
          eagerness: "conservative",
        },
      ],
    }

    script.textContent = JSON.stringify(speculationRules)
    head.appendChild(script)

    return () => {
      head.removeChild(script)
    }
  }, [])

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-blue-100 bg-gradient-to-b from-white to-blue-50 transition-all"
      {...props}
      suppressHydrationWarning
    >
      <SidebarHeader className="p-0 border-b border-blue-100">
        <div className="flex items-center justify-center">
          <div className="relative flex items-center justify-center w-full">
            <div
              className={cn(
                "flex items-center transition-all duration-300",
                isSidebarCollapsed ? "justify-center h-12" : "justify-start h-20"
              )}
            >
              {/* Logo icon – always visible, gets smaller when collapsed */}
              <div className="flex-shrink-0">
                <img
                  src={Logo.src || "/placeholder.svg"}
                  alt="Philtech Logo"
                  className={cn(
                    "object-contain transition-all duration-300",
                    isSidebarCollapsed ? "h-12 w-8" : "h-16"
                  )}
                />
              </div>

              {/* Business name - now visible only when the sidebar is minimized */}
              <div
                className={cn(
                  "flex flex-col transition-all duration-300",
                  isSidebarCollapsed ? "block opacity-100" : ""
                )}
              >
                <img
                  src={BusinessName.src || "/placeholder.svg"}
                  alt="Philtech Business Name"
                  className="h-28 object-contain transition-all duration-300"
                />
              </div>
            </div>

            {/* Admin badge */}
            {isAdmin && (
              <div className="absolute -bottom-2 bg-background text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {formatAdminRole(user?.role || "")}
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Render appropriate menu items based on admin status */}
              {isAdmin ? (
                // Admin menu items
                filteredAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title} className="mb-0.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild={!item.subItems}
                            isActive={pathname === item.url || activeItem === item.title}
                            className={cn(
                              "group transition-all duration-200 py-2.5 px-3 rounded-md hover:bg-blue-50",
                              pathname === item.url && "bg-blue-100 text-blue-700 font-medium",
                              activeItem === item.title && "bg-blue-50",
                            )}
                            onClick={() => item.subItems && toggleItem(item.title)}
                            tooltip={item.title}
                          >
                            {item.subItems ? (
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                  {item.icon && <item.icon className="w-5 h-5" />}
                                  <span>{item.title}</span>
                                </div>
                                <ChevronDown
                                  className={cn(
                                    "w-4 h-4 transition-transform duration-200",
                                    activeItem === item.title ? "rotate-180" : "",
                                  )}
                                />
                              </div>
                            ) : (
                              <PrefetchLink href={item.url || "#"} className="flex items-center gap-3 w-full">
                                {item.icon && <item.icon className="w-5 h-5" />}
                                <span>{item.title}</span>
                              </PrefetchLink>
                            )}
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-blue-600 text-white border-blue-700 shadow-lg">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Submenu items */}
                    {item.subItems && activeItem === item.title && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="pl-8 mt-1 space-y-1 group-data-[collapsible=icon]:hidden"
                      >
                        {item.subItems.map((subItem) => (
                          <SidebarMenuButton
                            key={subItem.title}
                            asChild
                            isActive={pathname === subItem.url}
                            className={cn(
                              "py-2 px-2.5 rounded-md transition-all duration-200 hover:bg-blue-50",
                              pathname === subItem.url && "bg-blue-100 text-blue-700 font-medium",
                            )}
                          >
                            <PrefetchLink href={subItem.url} className="flex items-center gap-2">
                              {subItem.icon && <subItem.icon className="w-4 h-4" />}
                              <span className="text-sm">{subItem.title}</span>
                            </PrefetchLink>
                          </SidebarMenuButton>
                        ))}
                      </motion.div>
                    )}
                  </SidebarMenuItem>
                ))
              ) : (
                // User menu items
                <>
                  {filteredUserItems.map((item) => {
                    const isDisabled =
                      (item.requiresVerification && !isUserVerified) ||
                      ('disabled' in item && item.disabled) ||
                      (user?.role === "retailer" && ["XpressTravels", "XpressStore", "Free Product"].includes(item.title)) ||
                      // Add new condition to disable ATM Go Form when submitted and not DONE
                      (item.disableWhenSubmitted && 
                        atmFormStatus.hasApplication && 
                        atmFormStatus.status !== "DONE" &&
                        atmFormStatus.status !== "Rejected")

                    return (
                      <SidebarMenuItem key={item.title} className="mb-0.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {isDisabled ? (
                                <div
                                  className="flex items-center gap-3 py-2 px-4 opacity-50 cursor-not-allowed rounded-md"
                                  title={
                                    item.disableWhenSubmitted && atmFormStatus.hasApplication && atmFormStatus.status !== "DONE" ? 
                                      "Form already submitted. Will be available again when status is DONE" :
                                    "disabled" in item && item.disabled ? "This feature is currently unavailable" :
                                      user?.role === "retailer" ? "Not available for retailer accounts" :
                                        "Complete KYC verification to access this feature"
                                  }
                                >
                                  {item.icon && <item.icon className="w-5 h-5" />}
                                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                                </div>
                              ) : (
                                <SidebarMenuButton
                                  asChild
                                  isActive={pathname === item.url}
                                  className={cn(
                                    "transition-all duration-200 py-2.5 px-3 rounded-md hover:bg-blue-50",
                                    pathname === item.url && "bg-blue-100 text-blue-700 font-medium",
                                  )}
                                  tooltip={item.title}
                                >
                                  <PrefetchLink href={item.url} className="flex items-center gap-3 w-full">
                                    {item.icon && <item.icon className="w-5 h-5" />}
                                    <span>{item.title}</span>
                                    {/* Show ATM GO status badge */}
                                    {!isSidebarCollapsed && renderStatusBadge(item)}
                                  </PrefetchLink>
                                </SidebarMenuButton>
                              )}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-blue-600 text-white border-blue-700 shadow-lg">
                              {isDisabled ?
                                (item.disableWhenSubmitted && atmFormStatus.hasApplication && atmFormStatus.status !== "DONE" ? 
                                  "Form already submitted. Will be available again when status is DONE" :
                                  "disabled" in item && item.disabled ? "This feature is currently unavailable" :
                                  user?.role === "retailer" ? "Not available for retailer accounts" :
                                    "Complete KYC verification first")
                                : atmFormStatus.hasApplication ? 
                                  `Status: ${atmFormStatus.status}` : item.title}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </SidebarMenuItem>
                    )
                  })}

                  <SidebarSeparator className="my-3" />

                  {/* Support section with improved contrast */}
                  <div className="px-4 mb-2 group-data-[collapsible=icon]:hidden">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Support</p>
                  </div>

                  {userSupportItems.map((item) => (
                    <SidebarMenuItem key={item.title} className="mb-0.5">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              isActive={pathname === item.url}
                              className={cn(
                                "transition-all duration-200 py-2.5 px-3 rounded-md hover:bg-blue-50",
                                pathname === item.url && "bg-blue-100 text-gray-700 font-medium",
                              )}
                              tooltip={item.title}
                            >
                              <PrefetchLink href={item.url} className="flex items-center gap-3">
                                {item.icon && <item.icon className="w-5 h-5 text-gray-500" />}
                                <span className="text-gray-700 font-medium">{item.title}</span>
                              </PrefetchLink>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-blue-700 text-white border-blue-700 shadow-lg">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </SidebarMenuItem>
                  ))}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-blue-100">
        <Link href="/login">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-2 bg-white hover:from-blue-600 hover:to-blue-700 text-black py-1 rounded-md transition-all duration-300 group shadow-sm",
              isSidebarCollapsed ? "justify-center" : "justify-center",
            )}
          >
            <LogOut className={cn("w-4 h-4", isSidebarCollapsed ? "mx-auto" : "")} />
            <span className="font-medium group-data-[collapsible=icon]:hidden">Logout</span>
          </motion.button>
        </Link>
      </SidebarFooter>

      <SpeculationRules />
      <SidebarRail />
    </Sidebar>
  )

}