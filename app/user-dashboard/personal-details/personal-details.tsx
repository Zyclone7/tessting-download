"use client"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useUserContext } from "@/hooks/use-user"
import { formatUserRole, getRoleBadgeStyle } from "@/lib/utils"
import { getUserKYCStatus, getUserProfile } from "@/actions/user"
import {
    ArrowUpRight,
    Banknote,
    Calendar,
    Mail,
    PercentCircle,
    PiggyBank,
    User,
    RefreshCw,
    Edit,
    Copy,
    CheckCircle,
    AlertCircle,
    Clock,
    Shield,
    ChevronRight,
    Activity,
    Download,
    Share2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"

const PersonalDetails = () => {
    const { user, clearUser, setUser } = useUserContext()
    const [profileLoading, setProfileLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [kycStatus, setKycStatus] = useState<string>("pending")
    const [error, setError] = useState<string | null>(null)
    const [currentDateTime, setCurrentDateTime] = useState(new Date())
    const [copied, setCopied] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("details")
    const [refreshing, setRefreshing] = useState(false)

    // Update date/time every second
    useEffect(() => {
        const interval = setInterval(() => setCurrentDateTime(new Date()), 1000)
        return () => clearInterval(interval)
    }, [])

    // Fetch profile and KYC status
    const fetchProfileAndKYCStatus = async () => {
        setProfileLoading(true)
        setRefreshing(true)
        try {
            if (user) {
                const profileResult = await getUserProfile(user.id.toString())
                if (profileResult.success && profileResult.data) {
                    setProfile(profileResult.data)
                    const kycResult = await getUserKYCStatus(user.id.toString())
                    if (kycResult.success && kycResult.data) {
                        setKycStatus(kycResult.data.toString())
                    } else {
                        // console.error("Failed to fetch KYC status:", kycResult.message)
                    }
                    setError(null)
                } else {
                    setError(profileResult.message || "Failed to fetch profile data.")
                }
            }
        } catch (err) {
            console.error("Error fetching profile and KYC status:", err)
            setError("Failed to fetch profile data. Please try again later.")
        } finally {
            setProfileLoading(false)
            setTimeout(() => setRefreshing(false), 600)
        }
    }

    useEffect(() => {
        fetchProfileAndKYCStatus()
    }, [user])

    // KYC badge styling
    const getKycBadgeStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case "approved":
            case "1":
                return "bg-green-100 text-green-800 border-green-200"
            case "pending":
            case "0":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "rejected":
            case "2":
                return "bg-red-100 text-red-800 border-red-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getKycStatusText = (status: string) => {
        if (status === "1") return "Approved"
        if (status === "0") return "Pending"
        if (status === "2") return "Rejected"
        return status
    }

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text)
        setCopied(field)
        setTimeout(() => setCopied(null), 2000)
    }

    // Calculate profile completion percentage
    const calculateProfileCompletion = () => {
        if (!profile || !user) return 0

        const fields = [
            user.nickname,
            profile.user_role,
            user.merchant_id,
            user.bank_name,
            user.bank_account_number,
            user.cf_share,
            user.social_media_page,
        ]

        const filledFields = fields.filter((field) => field && field !== "N/A").length
        return Math.round((filledFields / fields.length) * 100)
    }

    const profileCompletionPercentage = calculateProfileCompletion()

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 },
        },
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full mx-auto p-4 md:p-6 bg-gradient-to-b from-white to-blue-50 min-h-[93vh] relative overflow-hidden rounded-xl"
        >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100 rounded-full filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>

            {/* Header with glass effect */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-between w-full mb-6 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-sm border border-blue-100"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                        <User className="w-5 h-5 text-blue-700" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">
                        Personal Details
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={fetchProfileAndKYCStatus}
                                    disabled={profileLoading}
                                    className="relative"
                                >
                                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                                    {refreshing && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Refresh data</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </motion.div>

            {/* Tabs Navigation */}
            <Tabs defaultValue="details" className="w-full mb-6" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto bg-blue-50">
                    <TabsTrigger value="details" className="data-[state=active]:bg-white">
                        <User className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Details</span>
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="data-[state=active]:bg-white">
                        <Activity className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Stats</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-white">
                        <Shield className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Security</span>
                    </TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="mt-4">
                    <div className="grid md:grid-cols-[300px_1fr] gap-6">
                        {/* Avatar and Core Info Card */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 flex flex-col items-center h-fit"
                        >
                            {profileLoading ? (
                                <div className="relative mx-auto">
                                    <Skeleton className="h-32 w-32 md:h-40 md:w-40 rounded-full" />
                                    <svg
                                        className="absolute inset-0 animate-spin text-blue-200"
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 100 100"
                                    >
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeDasharray="141.37"
                                            strokeDashoffset="35.34"
                                        />
                                    </svg>
                                </div>
                            ) : (
                                <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} className="relative">
                                    <div className="relative">
                                        <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-lg">
                                            <AvatarImage src={profile?.profile_pic_url} alt="Profile picture" className="object-cover" />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                                {user?.nickname?.substring(0, 2).toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                                            <div className="bg-blue-600 text-white p-1.5 rounded-full">
                                                <Edit className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <motion.div variants={itemVariants} className="mt-4 text-center space-y-2">
                                {profileLoading ? (
                                    <Skeleton className="h-7 w-48 mx-auto" />
                                ) : (
                                    <h3 className="text-2xl font-bold text-gray-900">{user?.nickname || "User"}</h3>
                                )}

                                {profile?.user_role && !profileLoading && (
                                    <span
                                        className={`${getRoleBadgeStyle(
                                            profile.user_role,
                                        )} inline-block px-3 py-1 rounded-full text-sm font-medium`}
                                    >
                                        {formatUserRole(profile.user_role)}
                                    </span>
                                )}

                                {!profileLoading && (
                                    <div className="flex justify-center mt-2">
                                        <Badge
                                            variant="outline"
                                            className={`${getKycBadgeStyle(kycStatus)} text-sm px-3 py-1 flex items-center gap-1.5`}
                                        >
                                            {Number(kycStatus) === 1 ? (
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            ) : Number(kycStatus) === 0 ? (
                                                <Clock className="w-3.5 h-3.5" />
                                            ) : (
                                                <AlertCircle className="w-3.5 h-3.5" />
                                            )}
                                            KYC: {getKycStatusText(kycStatus)}
                                        </Badge>
                                    </div>
                                )}
                            </motion.div>

                            {!profileLoading && (
                                <motion.div variants={itemVariants} className="w-full mt-6 space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">Profile Completion</span>
                                            <span className="font-medium">{profileCompletionPercentage}%</span>
                                        </div>
                                        <Progress value={profileCompletionPercentage} className="h-2" />
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 mb-2">Quick Actions</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant="outline" size="sm" className="text-xs">
                                                <Download className="w-3.5 h-3.5 mr-1" />
                                                Export Data
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-xs">
                                                <Share2 className="w-3.5 h-3.5 mr-1" />
                                                Share Profile
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Error State */}
                        {error && !profileLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 bg-red-50 text-red-800 rounded-lg text-center border border-red-200 flex items-center justify-center"
                            >
                                <AlertCircle className="w-5 h-5 mr-2" />
                                {error}
                            </motion.div>
                        )}

                        {/* Details Grid */}
                        {!error && (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="bg-white rounded-xl shadow-sm border border-blue-100 p-6"
                            >
                                <motion.h4
                                    variants={itemVariants}
                                    className="text-lg font-semibold text-gray-800 mb-4 flex items-center"
                                >
                                    <Banknote className="w-5 h-5 mr-2 text-blue-600" />
                                    Account Information
                                </motion.h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        {
                                            label: "Joined",
                                            value: profile?.user_registered
                                                ? new Date(profile.user_registered).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "N/A",
                                            icon: Calendar,
                                            color: "bg-purple-100 text-purple-700",
                                        },
                                        {
                                            label: "Merchant ID",
                                            value: user?.merchant_id || "N/A",
                                            icon: User,
                                            color: "bg-blue-100 text-blue-700",
                                            copyable: true,
                                        },
                                        {
                                            label: "Bank Name",
                                            value: user?.bank_name || "N/A",
                                            icon: Banknote,
                                            color: "bg-green-100 text-green-700",
                                        },
                                        {
                                            label: "Bank Account",
                                            value: user?.bank_account_number || "N/A",
                                            icon: PiggyBank,
                                            color: "bg-yellow-100 text-yellow-700",
                                            copyable: true,
                                        },
                                        {
                                            label: "CF Share",
                                            value: user?.cf_share || "N/A",
                                            icon: PercentCircle,
                                            color: "bg-red-100 text-red-700",
                                        },
                                        {
                                            label: "Contact",
                                            value: user?.social_media_page,
                                            isLink: true,
                                            icon: Mail,
                                            color: "bg-indigo-100 text-indigo-700",
                                        },
                                    ].map((item, index) => (
                                        <motion.div
                                            key={index}
                                            variants={itemVariants}
                                            whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                                            className="group relative bg-white p-4 rounded-lg flex items-center justify-between border border-gray-100 hover:border-blue-200 transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`${item.color} p-2 rounded-full`}>
                                                    <item.icon className="w-4 h-4" />
                                                </div>
                                                <span className="text-gray-700 font-medium">{item.label}</span>
                                            </div>
                                            {profileLoading ? (
                                                <Skeleton className="h-4 w-28" />
                                            ) : item.isLink && item.value ? (
                                                <a
                                                    href={item.value && !item.value.startsWith("http") ? `https://${item.value}` : item.value}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-blue-600 font-medium hover:underline"
                                                >
                                                    <span className="max-w-[250px] truncate">{item.value}</span>
                                                    <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-900 font-medium max-w-[120px] truncate">{item.value}</span>
                                                    {item.copyable && (
                                                        <button
                                                            onClick={() => copyToClipboard(item.value, item.label)}
                                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                                        >
                                                            {copied === item.label ? (
                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>

                                {!profileLoading && (
                                    <motion.div
                                        variants={itemVariants}
                                        className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center"
                                    >
                                        <p className="text-xs text-gray-500">Last Updated: {currentDateTime.toLocaleTimeString()}</p>
                                        <Link href="/user-dashboard/profile-edit" passHref>
                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                Edit Details
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </Link>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                                Account Statistics
                            </CardTitle>
                            <CardDescription>View your account activity and performance metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { label: "Total Transactions", value: "124", change: "+12%" },
                                    { label: "Success Rate", value: "98.2%", change: "+0.5%" },
                                    {
                                        label: "Account Age",
                                        value: profile?.user_registered
                                            ? `${Math.floor((new Date().getTime() - new Date(profile.user_registered).getTime()) / (1000 * 60 * 60 * 24))} days`
                                            : "N/A",
                                        change: null,
                                    },
                                ].map((stat, index) => (
                                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-100">
                                        <p className="text-sm text-gray-500">{stat.label}</p>
                                        <div className="flex items-end justify-between mt-1">
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                            {stat.change && (
                                                <Badge variant="outline" className="text-green-600 bg-green-50">
                                                    {stat.change}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 text-center text-sm text-gray-500">
                                <p>Detailed statistics will be available soon</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                                Security Settings
                            </CardTitle>
                            <CardDescription>Manage your account security and privacy settings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <Shield className="w-4 h-4 text-blue-700" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Two-Factor Authentication</p>
                                            <p className="text-sm text-gray-500">Add an extra layer of security</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        Enable
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded-full">
                                            <Activity className="w-4 h-4 text-green-700" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Login Activity</p>
                                            <p className="text-sm text-gray-500">Monitor your account access</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        View
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Floating Action Button */}
            <AnimatePresence>
                {activeTab === "details" && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="fixed bottom-6 right-6 z-10"
                    >
                        
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default PersonalDetails
