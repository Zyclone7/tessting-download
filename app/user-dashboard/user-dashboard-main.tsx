"use client";
import Link from "next/link";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Search,
  ArrowRight,
  Clock,
  CreditCard,
  LockIcon,
  Mail,
  Package,
  PlusCircle,
  User,
  UserPlus,
  Users2,
  ShoppingBag,
  Wallet,
  ArrowUpRight,
  Calendar,
  BarChart3,
  ChevronRight,
  Loader2,
  CheckCircle,
  Copy,
  Sparkles,
  CreditCardIcon,
  Zap,
  ShoppingCart,
  Plane,
} from "lucide-react";

import type React from "react";
import type SignaturePad from "react-signature-canvas";
import { Tooltip as RechartsTooltip } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useUserContext } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { getInvitationCodesByUserId } from "@/actions/invitation-codes";
import { getTransactionCountsApproved } from "@/actions/atm-transaction";
import { getReferralIncomeHistoryByUserId } from "@/actions/referral";
import { getMyPassiveIncomeTransactions } from "@/actions/passive-income";
import { getTvVoucherByUserId } from "@/actions/tv-voucher";
import { getUserProfile, getUserKYCStatus } from "@/actions/user";
import { ManualRegistrationModal } from "@/components/manual-registration-modal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DatePickerWithRange } from "@/components/date-picker-with-range";
import {
  IconCashBanknote,
  IconDeviceIpadStar,
  IconShoppingCart,
  IconTransfer,
} from "@tabler/icons-react";
import { ActivationDialog } from "./dialog";
import { AnimatePresence, motion } from "framer-motion";
import { getOrganizationMembers, getAllRegisteredUser } from "@/actions/user";
import { getHotelBookingsByUserId } from "@/actions/hotel-booking";
import { getBookingHistoryByUserId } from "@/actions/booking";
import { getWiFiVoucherByUserId } from "@/actions/wifi-voucher";
import { getGsatVoucherByUserId } from "@/actions/gsat-voucher";
import { getCreditTransactions } from "@/actions/credits";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/tabs-dashboard";
import { Badge } from "@/components/ui/badge";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Bar,
  Line,
  ResponsiveContainer,
} from "recharts";
import { Progress } from "@/components/progress-dashboard";
import { Checkbox } from "@/components/ui/checkbox";
import { findUserForTransfer } from "@/actions/credits-transfer";
import { getCreditTransactionHistory } from "@/actions/credits-transfer";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"; // For AlertDialog components
import { transferCredits } from "@/lib/credits-transfer-with-emails";
import { LoadingOverlay } from "@/components/loading-overlay";
import AnalyticsDashboard from "@/components/history-modal/analytics-dashboard";

interface Product {
  id: number;
  name: string;
  label: string;
  short_description: string;
  payment_type: string;
  price: number;
  status: number;
  the_order: number;
  created_at: number;
  category: string;
  image: string;
  package_type: string;
  features: string[];
  earn_description: string;
  refer_earn: boolean;
}

const documents = [
  { name: "Memorandum of Agreement", icon: "📄", key: "moa" },
  { name: "Business Permit", icon: "🏢", key: "permit" },
  { name: "DTI Certificate", icon: "📜", key: "dti" },
  { name: "Bank Account Details", icon: "🏦", key: "bank" },
  { name: "Valid ID with Signature", icon: "🪪", key: "id" },
];

const mockTransactions = [
  {
    id: 1,
    amount: 1000,
    date: "2024-12-01",
    type: "Top-Up",
    status: "Success",
    description: "Added funds",
  },
  {
    id: 2,
    amount: 500,
    date: "2024-12-03",
    type: "Purchase",
    status: "Failed",
    description: "Purchase declined",
  },
  {
    id: 3,
    amount: 1500,
    date: "2024-12-05",
    type: "Top-Up",
    status: "Success",
    description: "Added funds",
  },
  {
    id: 4,
    amount: 200,
    date: "2024-12-07",
    type: "Refund",
    status: "Success",
    description: "Refund processed",
  },
  {
    id: 5,
    amount: 700,
    date: "2024-12-08",
    type: "Purchase",
    status: "Success",
    description: "Purchase completed",
  },
];
const steps = [
  { label: "Level 1", description: "Personal Information" },
  { label: "Level 2", description: "Valid ID and Signature" },
  { label: "Level 3", description: "Employment Details" },
  { label: "Level 4", description: "Review" },
  { label: "Level 5", description: "Finish" },
];

const formatUserRole = (role: string) => {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .replace("Package", "");
};

const getRoleBadgeStyle = (role: string) => {
  const baseStyle = "text-white px-2 py-1 text-sm font-semibold rounded-2xl";
  switch (role) {
    case "Premium_Merchant_Package":
      return `${baseStyle} bg-[linear-gradient(to_right,_#1D6DBB,_#145998,_#0B4674,_#023251)]`;
    case "Basic_Merchant_Package":
      return `${baseStyle} bg-[linear-gradient(to_right,_#020024,_#6de7f7,_#00d4ff)]`;
    case "Elite_Distributor_Package":
      return `${baseStyle} bg-[linear-gradient(to_right,_#1D6DBB,_#145998,_#0B4674,_#023251)]`;
    case "Elite_Plus_Distributor_Package":
      return `${baseStyle} bg-[linear-gradient(to_right,_#3D89D6,_#1A5EA2,_#0B4674,_#023251)]`;
    case "Admin":
      return `${baseStyle} bg-gradient-to-r from-red-400 to-red-600`;
    default:
      return `${baseStyle} bg-gradient-to-r from-gray-400 to-gray-600`;
  }
};

const mockProducts: Product[] = [
  {
    id: 1,
    name: "Basic_Merchant_Package",
    label: "Basic Merchant Package",
    short_description: "Merchant Dashboard",
    payment_type: "payment",
    price: 5998.0,
    status: 0,
    the_order: 0,
    created_at: 1731660918,
    category: "Negosyo Package",
    image: "/placeholder.svg?height=420&width=380",
    package_type: "BASIC PACKAGE",
    features: [
      "Merchant Dashboard",
      "XPRESSLOAD ALL-IN-ONE",
      "10 pcs XPRESSTV Voucher",
      "Hybrid Referral Program",
      "Free Marketing Materials",
      "Free Business Training",
      "Free Business Coaching",
      "Free Lifetime Customer Support",
      "P 300K Plus Potential Income",
    ],
    earn_description: "EARN EVERY TRANSACTION",
    refer_earn: true,
  },
  {
    id: 2,
    name: "Premium_Merchant_Package",
    label: "Premium Merchant Package",
    short_description: "Merchant Dashboard",
    payment_type: "payment",
    price: 9998.0,
    status: 0,
    the_order: 0,
    created_at: 1731909110,
    category: "Negosyo Package",
    image: "/placeholder.svg?height=420&width=380",
    package_type: "PREMIUM PACKAGE",
    features: [
      "Merchant Dashboard",
      "XPRESSLOAD ALL-IN-ONE",
      "1 pc XPRESSTV Android Box",
      "Hybrid Referral Program",
      "Free Marketing Materials",
      "Free Business Training",
      "Free Business Coaching",
      "Free Lifetime Customer Support",
      "P 700K Plus Potential Income",
    ],
    earn_description: "EARN EVERY TRANSACTION",
    refer_earn: true,
  },
  {
    id: 3,
    name: "Elite_Distributor_Package",
    label: "Elite Distributor Package",
    short_description: "Distributor Dashboard",
    payment_type: "payment",
    price: 39998.0,
    status: 0,
    the_order: 0,
    created_at: 1731908052,
    category: "Negosyo Package",
    image: "/placeholder.svg?height=420&width=380",
    package_type: "ELITE DISTRIBUTOR PACKAGE",
    features: [
      "Distributor Dashboard",
      "XPRESSLOAD ALL-IN-ONE",
      "4 Units XPRESSTV BOX",
      "Hybrid Referral Program",
      "Triple Passive Income",
      "Multiple ATM Devices",
      "Free Marketing Materials",
      "Free Business Training",
      "Free Business Coaching",
      "Free Lifetime Support",
      "P 2.5 Million Potential Income",
    ],
    earn_description: "EARN EVERY END-USER",
    refer_earn: true,
  },
  {
    id: 4,
    name: "Elite_Plus_Distributor_Package",
    label: "Elite Plus Distributor Package",
    short_description: "Distributor Dashboard",
    payment_type: "payment",
    price: 99998.0,
    status: 0,
    the_order: 0,
    created_at: 1731909111,
    category: "Negosyo Package",
    image: "/placeholder.svg?height=420&width=380",
    package_type: "ELITE PLUS DISTRIBUTOR PACKAGE",
    features: [
      "Distributor Dashboard",
      "XPRESSLOAD ALL-IN-ONE",
      "10 Units XPRESSTV BOX",
      "Hybrid Referral Program",
      "Triple Passive Income",
      "Multiple ATM Devices",
      "Free Marketing Materials",
      "Free Business Training",
      "Free Business Coaching",
      "Free Lifetime Support",
      "P 5.5 Million Potential Income",
    ],
    earn_description: "EARN EVERY END-USER",
    refer_earn: true,
  },
];

type CardProps = React.ComponentProps<typeof Card>;

export default function UserDashboardMain({ className, ...props }: CardProps) {
  const router = useRouter();
  const { user, clearUser, setUser } = useUserContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [buyingLoading, setBuyingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTopUpModalOpen, setTopUpModalOpen] = useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [isCreditsTransferOpen, setCreditsTransferOpen] = useState(false);
  const [isManualRegistrationModalOpen, setManualRegistrationModalOpen] =
    useState(false);
  const [filteredTransactions, setFilteredTransactions] =
    useState(mockTransactions);
  const [transactionType, setTransactionType] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [profile, setProfile] = useState<any>(null);
  const [activationCount, setActivationCount] = useState<number>(0);
  const [availableCode, setAvailableCode] = useState<number>(0);
  const [redeemedCode, setRedeemedCode] = useState<number>(0);
  const [showMerchants, setShowMerchants] = useState(false);
  const [showDistributors, setShowDistributors] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionCount, setTransactionCount] = useState({
    myTransactionCount: 0,
    myMerchantTransactionCount: 0,
  });
  // Add these state variables near the other state declarations in the UserDashboardMain component
  const [passiveIncomeTransactions, setPassiveIncomeTransactions] = useState<
    any[]
  >([]);
  const [referralTransactions, setReferralTransactions] = useState<any[]>([]);

  const [organizationMembers, setOrganizationMembers] = useState<any[]>([]);
  const [registeredMembers, setRegisteredMembers] = useState<any[]>([]);
  const [signaturePadWidth, setSignaturePadWidth] = useState(0);
  const signaturePadRef = useRef<HTMLDivElement>(null);
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [profileLoading, setProfileLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [activationLoading, setActivationLoading] = useState(true);
  const [organizationLoading, setOrganizationLoading] = useState(true);
  const [registeredLoading, setRegisteredLoading] = useState(true);
  const [passiveIncomeLoading, setPassiveIncomeLoading] = useState(true);
  const [referralIncomeLoading, setReferralIncomeLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [transferTransactions, setTransferTransactions] = useState<any[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<any[]>([]);
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [transferSearchQuery, setTransferSearchQuery] = useState("");
  const [transferDateRange, setTransferDateRange] = useState<any | undefined>();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    const fetchProfileAndKYCStatus = async () => {
      setProfileLoading(true);
      try {
        if (user) {
          const profileResult = await getUserProfile(user.id.toString());
          if (profileResult.success && profileResult.data) {
            setProfile(profileResult.data);

            // Now fetch KYC status
            const kycResult = await getUserKYCStatus(user.id.toString());
            if (kycResult.success) {
              if (kycResult.data) {
                setKycStatus(kycResult.data.toString());
              }
            } else {
              console.error("Failed to fetch KYC status:", kycResult.message);
            }

            setError(null);
          } else {
            setError(profileResult.message || "Failed to fetch profile data.");
          }
        }
      } catch (err) {
        console.error("Error fetching profile and KYC status:", err);
        setError("Failed to fetch profile data. Please try again later.");
      } finally {
        setProfileLoading(false);
        setLoading(false);
      }
    };

    fetchProfileAndKYCStatus();
  }, [user]);

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const result = await getTransactionCountsApproved(
        user?.id.toString() || ""
      );

      if (result.success && result.data) {
        setTransactionCount({
          myTransactionCount: result.data.userTransactionCount,
          myMerchantTransactionCount: result.data.merchantTransactionCount,
        });
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Add this to your existing useEffect that fetches the user profile

  useEffect(() => {
    const updateSignaturePadWidth = () => {
      if (signaturePadRef.current) {
        setSignaturePadWidth(signaturePadRef.current.offsetWidth);
      }
    };

    updateSignaturePadWidth();
    window.addEventListener("resize", updateSignaturePadWidth);

    return () => {
      window.removeEventListener("resize", updateSignaturePadWidth);
    };
  }, []);

  const handleUpload = (type: string) => {
    console.log(`Upload initiated for: ${type}`);
  };

  const [imageURL, setImageURL] = useState<string | null>(null);
  const [submittedSignature, setSubmittedSignature] = useState<string | null>(
    null
  );
  const sigCanvas = useRef<SignaturePad>(null);

  const clear = () => sigCanvas.current?.clear();

  const save = () => {
    if (sigCanvas.current) {
      setImageURL(sigCanvas.current.getTrimmedCanvas().toDataURL("image/png"));
    }
  };

  const close = () => {
    setImageURL(null);
  };

  const handleSubmit = () => {
    if (imageURL) {
      setSubmittedSignature(imageURL);
      console.log("Submitting signature image: ", imageURL);
      toast({
        title: "Success",
        description: "Signature submitted successfully!",
      });
      close();
    } else {
      toast({
        title: "Error",
        description: "Please add your signature before submitting.",
        variant: "destructive",
      });
    }
  };

  const [packageAvailability, setPackageAvailability] = useState([
    { name: "Basic Merchant Package", available: 0 },
    { name: "Premium Merchant Package", available: 0 },
    { name: "Elite Distributor Package", available: 0 },
    { name: "Elite Plus Distributor Package", available: 0 },
  ]);

  const handleFilterChange = () => {
    let filtered = [...mockTransactions];

    if (transactionType && transactionType !== "all") {
      filtered = filtered.filter((tx) => tx.type === transactionType);
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(
        (tx) =>
          new Date(tx.date) >= new Date(dateRange.start) &&
          new Date(tx.date) <= new Date(dateRange.end)
      );
    }

    setFilteredTransactions(filtered);
  };

  const [country, setCountry] = useState("");
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user) {
          const result = await getUserProfile(user.id.toString());
          if (result.success && result.data) {
            setProfile(result.data);
            setError(null);
          } else {
            setError(result.message || "Failed to fetch profile data.");
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to fetch profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchActivationCount = async () => {
      if (user) {
        setActivationLoading(true);
        try {
          const result = await getInvitationCodesByUserId(user.id.toString());
          if (result.success && result.data) {
            setActivationCount(result.data.length);
            setAvailableCode(
              result.data.filter((code: any) => !code.redeemed_by).length
            );
            setRedeemedCode(
              result.data.filter((code: any) => code.redeemed_by).length
            );

            const packageCounts = result.data.reduce((acc: any, code: any) => {
              if (!code.redeemed_by) {
                acc[code.package] = (acc[code.package] || 0) + 1;
              }
              return acc;
            }, {});

            setPackageAvailability([
              {
                name: "Basic Merchant Package",
                available: packageCounts["Basic_Merchant_Package"] || 0,
              },
              {
                name: "Premium Merchant Package",
                available: packageCounts["Premium_Merchant_Package"] || 0,
              },
              {
                name: "Elite Distributor Package",
                available: packageCounts["Elite_Distributor_Package"] || 0,
              },
              {
                name: "Elite Plus Distributor Package",
                available: packageCounts["Elite_Plus_Distributor_Package"] || 0,
              },
            ]);
          } else {
            console.error("Error fetching activation codes:", result.message);
          }
        } catch (error) {
          console.error("Error fetching activation count:", error);
        } finally {
          setActivationLoading(false);
        }
      }
    };

    fetchActivationCount();
  }, [user]);

  useEffect(() => {
    const fetchRegisteredMembers = async () => {
      if (user) {
        setRegisteredLoading(true);
        try {
          const result: any = await getAllRegisteredUser(user.id);
          if (result.success) {
            setRegisteredMembers(result.data);
          } else {
            console.error("Error fetching organization members:", result.error);
          }
        } catch (error) {
          console.error("Error fetching organization members:", error);
        } finally {
          setRegisteredLoading(false);
        }
      }
    };
    fetchRegisteredMembers();
  }, [user]);

  useEffect(() => {
    const fetchOrganizationMembers = async () => {
      if (user) {
        setOrganizationLoading(true);
        try {
          const result: any = await getOrganizationMembers(user.id);
          if (result.success) {
            setOrganizationMembers(result.data);
          } else {
            console.error("Error fetching organization members:", result.error);
          }
        } catch (error) {
          console.error("Error fetching organization members:", error);
        } finally {
          setOrganizationLoading(false);
        }
      }
    };

    fetchOrganizationMembers();
  }, [user]);

  // Add this useEffect to fetch the transaction data when the component mounts
  useEffect(() => {
    if (user) {
      fetchPassiveIncomeTransactions();
      fetchReferralTransactions();
    }
  }, [user]);

  // Add these functions to fetch the transaction data
  const fetchPassiveIncomeTransactions = async () => {
    try {
      const result: any = await getMyPassiveIncomeTransactions(
        Number(user?.id)
      );
      if (result.success) {
        const nonZeroTransactions = result.data.filter(
          (tx: any) => tx.income_amount > 0
        );
        setPassiveIncomeTransactions(nonZeroTransactions);
        setPassiveIncomeLoading(false);
      }
    } catch (error) {
      console.error("Error fetching passive income transactions:", error);
    }
  };

  const fetchReferralTransactions = async () => {
    try {
      const result: any = await getReferralIncomeHistoryByUserId(
        Number(user?.id)
      );
      if (result.success) {
        const nonZeroTransactions = result.data.filter(
          (tx: any) => Number(tx.income_amount) > 0
        );
        setReferralTransactions(nonZeroTransactions);
        setReferralIncomeLoading(false);
      }
    } catch (error) {
      console.error("Error fetching referral transactions:", error);
    }
  };

  const handleShowMerchants = () => {
    if (!showMerchants) {
      setShowMerchants(true);
    } else {
      setShowMerchants(false);
    }
    setShowDistributors(false);
  };

  const handleShowDistributors = () => {
    if (!showDistributors) {
      setShowDistributors(true);
    } else {
      setShowDistributors(false);
    }
    setShowMerchants(false);
  };

  const handleBuyPackage = () => {
    const packageToSelect =
      mockProducts.find((p) => p.name === user?.role) || mockProducts[0];
    setSelectedPackage(packageToSelect);
    setIsProductDialogOpen(true);
  };

  // Add this function to your code
  const processReferralIncentivesForSelfActivation = async (
    userId: number,
    uplineId: number,
    userRole: string,
    referralCode: string
  ) => {
    try {
      // Import the referral incentive function
      const { applyReferralIncentives } = await import(
        "@/actions/referral-incentive"
      );

      let currentGen = 1;
      while (true) {
        const endGen = currentGen + 2; // Process 3 generations at a time

        const result = await applyReferralIncentives(
          uplineId,
          userRole,
          userId,
          referralCode,
          currentGen,
          endGen
        );

        if (!result.success) {
          throw new Error(
            result.message || "Failed to apply referral incentives"
          );
        }

        // Stop if there are no more uplines to process
        if (!result.nextGeneration) {
          break;
        }

        currentGen = result.nextGeneration;
      }

      return { success: true };
    } catch (error) {
      console.error("Error processing referral incentives:", error);
      throw error;
    }
  };
  // Store for tracking recent purchase attempts
  const recentPurchaseAttempts = new Map();

  const handleBuy = async (
    product: Product,
    quantity: number,
    paymentMethod: string
  ) => {
    // Generate a unique request identifier
    const requestId = `${product.id}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    // Check for duplicate purchase attempts
    const productKey = `${product.id}-${quantity}-${paymentMethod}`;
    if (recentPurchaseAttempts.has(productKey)) {
      const lastAttempt = recentPurchaseAttempts.get(productKey);
      // Prevent duplicate purchases within 5 seconds
      if (Date.now() - lastAttempt < 5000) {
        toast({
          title: "Duplicate request detected",
          description:
            "Please wait before submitting another purchase request.",
          variant: "destructive",
        });
        return;
      }
    }

    // Record this purchase attempt
    recentPurchaseAttempts.set(productKey, Date.now());

    // Set loading state to disable UI
    setBuyingLoading(true);

    try {
      // Add a small delay to prevent accidental double-clicks
      await new Promise((resolve) => setTimeout(resolve, 200));

      const response = await axios.post(
        "/api/invitation-code/buy",
        {
          packages: [
            {
              packageName: product.name,
              amount: product.price,
              quantity: quantity,
            },
          ],
          user_id: user?.id,
          paymentMethod,
          requestId, // Send request ID to help backend identify duplicates
        },
        {
          headers: {
            "Idempotency-Key": requestId, // Add idempotency key for API-level duplicate prevention
          },
        }
      );

      const data = response.data;

      if (data.success) {
        toast({
          title: "Purchase successful",
          description: `${data.data.length} invitation code(s) bought successfully, please relogin. Payment method: ${paymentMethod}`,
        });

        setProfile((prevProfile: any) => ({
          ...prevProfile,
          user_credits: data.updatedCredit,
        }));

        const updatedCodes = await getInvitationCodesByUserId(
          user?.id.toString() || ""
        );
        if (updatedCodes.success && updatedCodes.data) {
          setActivationCount(updatedCodes.data.length);
          setAvailableCode(
            updatedCodes.data.filter((code: any) => !code.redeemed_by).length
          );
          setRedeemedCode(
            updatedCodes.data.filter((code: any) => code.redeemed_by).length
          );
        }

        setTimeout(() => {
          setIsProductDialogOpen(false);
        }, 1000);

        if (user) {
          setUser({
            ...user,
            status: 1, // Example: Update status to 1
          });
          try {
            const userProfile = await getUserProfile(user.id.toString());

            if (
              userProfile.success &&
              userProfile.data &&
              userProfile.data.user_upline_id
            ) {
              // User has an upline, process referral incentives
              await processReferralIncentivesForSelfActivation(
                user.id,
                userProfile.data.user_upline_id,
                user.role ?? "",
                // You may need to store the referral code or get it from user profile
                ""
              );
            }
          } catch (referralError) {
            console.error(
              "Error processing referral incentives:",
              referralError
            );
            // Don't block the activation if referral processing fails
          }
        }
      } else {
        throw new Error(data.message || "An error occurred during purchase.");
      }
    } catch (error: any) {
      console.error("Error during purchase:", error);
      toast({
        title: "Purchase failed",
        description:
          error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setBuyingLoading(false);

      // Clean up old purchase attempts after 10 minutes
      setTimeout(() => {
        recentPurchaseAttempts.delete(productKey);
      }, 10 * 60 * 1000);
    }
  };

  // Optional: Initialize cleanup interval to prevent memory leaks
  // This cleans up any purchase attempts older than 10 minutes
  const cleanupPurchaseAttempts = () => {
    const now = Date.now();
    for (const [key, timestamp] of recentPurchaseAttempts.entries()) {
      if (now - timestamp > 10 * 60 * 1000) {
        recentPurchaseAttempts.delete(key);
      }
    }
  };
  // Run cleanup every 10 minutes
  setInterval(cleanupPurchaseAttempts, 10 * 60 * 1000);

  if (loading) return <DashboardSkeleton />;

  // Format date for display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };

    return date.toLocaleDateString("en-US", options);
  };

  // Format time for display
  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };

    return date.toLocaleTimeString("en-US", options);
  };

  // Get day of week
  const getDayOfWeek = (date: Date) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[date.getDay()];
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  // Simulate loading a specific section
  const simulateLoadSection = (section: string) => {
    setLoadingSection(section);
    setTimeout(() => setLoadingSection(null), 1500);
  };

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full px-4 py-8 mx-auto md:px-6 lg:px-8"
    >
      {user?.status === 0 ? (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Alert variant="destructive" className="mb-4">
            <div className="flex flex-row justify-between items-center">
              <div>
                <AlertTitle>Account Inactive</AlertTitle>
                <AlertDescription>
                  Buy Your Package to Activate Account
                </AlertDescription>
              </div>
              <Button
                variant="outline"
                className="animate-pulse"
                onClick={handleBuyPackage}
              >
                <IconShoppingCart className="w-4 h-4 mr-2" />
                Buy Activation Code
              </Button>
            </div>
          </Alert>
        </motion.div>
      ) : null}
      <div
        className={`${user?.status === 0 ? "opacity-50 pointer-events-none" : ""
          }`}
      >
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3 xl:gap-10 w-full mx-auto">
          {/* Profile Section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden h-full"
          >
            {/* Profile Header */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Profile</h2>
              </div>
              <Badge
                variant="outline"
                className="bg-white/10 text-white border-white/20 flex items-center gap-1.5 px-3 py-1.5"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{getDayOfWeek(currentDateTime)}</span>
              </Badge>
            </motion.div>

            {/* Profile Content */}
            <div className="p-6 flex flex-col items-center">
              {/* Avatar with loading state */}
              {!profile ? (
                <div className="relative w-36 h-36">
                  <Skeleton className="h-36 w-36 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
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
                </div>
              ) : (
                <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} className="relative">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                    <Avatar className="h-52 w-52 border-4 border-white shadow-lg">
                      <AvatarImage src={profile?.profile_pic_url} alt="Profile picture" className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-[#3D89D6] to-[#1A5EA2] text-white text-3xl font-bold">
                        {user?.nickname?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-md"
                    >
                      <div className="bg-[#3D89D6] text-white p-2 rounded-full">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* User Info */}
              <div className="mt-6 w-full text-center space-y-4">
                {!profile ? (
                  <Skeleton className="h-8 w-40 mx-auto" />
                ) : (
                  <motion.h3 variants={itemVariants} className="text-2xl font-bold text-gray-800">
                    {user?.nickname || "User"}
                  </motion.h3>
                )}

                {profile?.user_role && profile && (
                  <motion.div variants={itemVariants}>
                    <span
                      className={`${getRoleBadgeStyle(profile.user_role)} inline-block px-4 py-1.5 rounded-full text-base font-medium shadow-sm`}
                    >
                      {formatUserRole(profile.user_role)}
                    </span>
                  </motion.div>
                )}

                {/* Profile completion */}
                {profile && (
                  <motion.div variants={itemVariants} className="w-full mt-5 px-2">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Profile Completion</span>
                      <span className="font-medium text-[#3D89D6]">{profileCompletionPercentage}%</span>
                    </div>
                    <Progress value={profileCompletionPercentage} className="h-2" />
                  </motion.div>
                )}
              </div>

              {/* User Details */}
              <motion.div variants={containerVariants} className="grid grid-cols-1 gap-3 mt-8 w-full">
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
                    color: "bg-purple-100 text-purple-600",
                  },
                  {
                    label: "Merchant ID",
                    value: user?.merchant_id || "N/A",
                    icon: User,
                    color: "bg-[#E6F0FA] text-[#3D89D6]",
                    copyable: true,
                  },
                  {
                    label: "Contact",
                    value: user?.social_media_page || "N/A",
                    isLink: true,
                    icon: Mail,
                    color: "bg-emerald-100 text-emerald-600",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    className="bg-white p-4 rounded-lg flex items-center justify-between shadow-sm border border-gray-100 hover:border-[#3D89D6]/30 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${item.color} p-2 rounded-full`}>
                        <item.icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-gray-600 text-sm">{item.label}</span>
                    </div>
                    {!profile ? (
                      <Skeleton className="h-5 w-24" />
                    ) : item.isLink && item.value && item.value !== "N/A" ? (
                      <a
                        href={!item.value.startsWith("http") ? `https://${item.value}` : item.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[#3D89D6] font-medium hover:underline text-sm"
                      >
                        <span className="truncate max-w-[120px]">{item.value}</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800 font-medium text-sm truncate max-w-[120px]">{item.value}</span>
                        {item.copyable && (
                          <button
                            onClick={() => copyToClipboard(item.value, item.label)}
                            className="text-gray-400 hover:text-[#3D89D6] transition-colors"
                          >
                            {copied === item.label ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {/* View Profile Button */}
              <motion.div variants={itemVariants} className="w-full mt-6">
                <Link href="/user-dashboard/personal-details" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full text-[#3D89D6] border-[#3D89D6]/30 hover:bg-[#3D89D6]/10 hover:text-[#3D89D6] flex items-center justify-center gap-2 py-5 text-base"
                  >
                    View Full Profile
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Wallet Section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden h-full"
          >
            {/* Wallet Header */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Wallet</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-white hover:bg-white/10 hover:text-white"
                onClick={() => simulateLoadSection("wallet")}
              >
                {loadingSection === "wallet" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </Button>
            </motion.div>

            {/* Wallet Content */}
            <div className="p-6 space-y-6">
              {/* Reward Points Card */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-r from-indigo-50 to-white rounded-lg p-5 flex items-center justify-between shadow-sm border border-indigo-100"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2.5 rounded-full shadow-sm border border-indigo-100">
                    <Sparkles className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">My Points</h3>
                    <p className="text-sm text-gray-500">Coming Soon</p>
                  </div>
                </div>
                <div className="bg-white/80 p-2 rounded-full border border-gray-100">
                  <LockIcon className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>

              {/* Pay-out Credits Card - MODIFIED */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.3, duration: 0.5 }} // Adjusted delay
              >
                <motion.div
                  // Removed inner variants={itemVariants} as parent handles animation
                  whileHover={{ scale: 1.02 }}
                  // **** MODIFIED CLASSES ****
                  className="bg-gradient-to-r from-emerald-50 to-white rounded-lg p-5 flex items-center justify-between shadow-sm border border-emerald-100"
                >
                  <div className="flex items-center gap-4">
                    {/* **** MODIFIED CLASSES **** */}
                    <div className="bg-white p-2.5 rounded-full shadow-sm border border-emerald-100">
                      {/* **** MODIFIED CLASSES **** */}
                      {/* Ensure IconCashBanknote is imported */}
                      <IconCashBanknote className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">Pay-out Credits</h3>
                      <p className="text-sm text-gray-500">Coming Soon</p>
                    </div>
                  </div>
                  <div className="bg-white/80 p-2 rounded-full border border-gray-100">
                    <LockIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </motion.div>
              </motion.div>

              {/* Credits Card */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2, duration: 0.5 }}
                className={`rounded-xl p-6 ${kycStatus === "1" ? "bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2]" : "bg-gradient-to-r from-gray-600 to-gray-700"} shadow-md relative overflow-hidden`}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <CreditCardIcon className="w-6 h-6 text-white" />
                      <h3 className="text-lg font-semibold text-white">Credits</h3>
                    </div>
                    {kycStatus !== "1" && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7, type: "spring" }} // Increased delay slightly
                        className="text-sm bg-yellow-300/20 px-3 py-1.5 rounded-full text-yellow-200 border border-yellow-200/30"
                      >
                        Verify KYC
                      </motion.span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-center mb-5 min-h-[60px]"> {/* Added min-height */}
                    {passiveIncomeLoading || referralIncomeLoading ? ( // Simplified condition
                      <Skeleton className="h-14 w-40 mx-auto bg-white/20" />
                    ) : (
                      <div className="text-white">
                        {kycStatus === "1" ? (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                            className="relative inline-block"
                          >
                            <span className="text-4xl font-bold">₱{profile?.user_credits?.toLocaleString() || "0"}</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-3"
                          >
                            <LockIcon className="w-12 h-12 text-yellow-300 mx-auto" />
                            <span className="text-base text-white/70 block">Complete KYC to unlock</span>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Transaction Chart */}
                  {kycStatus === "1" && (
                    <motion.div
                      variants={itemVariants} // Use item variants for consistency
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="bg-white/10 rounded-lg p-4 mb-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-white">Transaction History</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 h-auto"
                          onClick={() => setHistoryModalOpen(true)}
                        >
                          <BarChart3 className="w-4.5 h-4.5" /> {/* Corrected class name */}
                        </Button>
                      </div>
                      <div className="h-[90px]">
                        <TransactionHistoryChart
                          passiveIncome={passiveIncomeTransactions}
                          referralIncome={referralTransactions}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <motion.div
                    variants={itemVariants} // Use item variants for consistency
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: kycStatus === "1" ? 0.6 : 0.5, duration: 0.5 }} // Delay slightly more if chart is shown
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { icon: PlusCircle, label: "Top-up", action: () => setTopUpModalOpen(true) },
                      { icon: CreditCardIcon, label: "Transfer", action: () => setCreditsTransferOpen(true) },
                      { icon: Clock, label: "History", action: () => setHistoryModalOpen(true) },
                    ].map((btn, index) => (
                      <TooltipProvider key={index} delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.button
                              // Removed variants here as parent div handles staggered animation if needed
                              whileHover={{ y: -3, ...(kycStatus !== "1" && { y: 0 }) }} // Only lift if enabled
                              whileTap={{ scale: kycStatus === "1" ? 0.95 : 1 }} // Only scale if enabled
                              className={`py-3 px-2 rounded-lg ${kycStatus === "1" ? "bg-white/10 hover:bg-white/20 cursor-pointer" : "bg-gray-200/30 cursor-not-allowed"} flex flex-col items-center gap-2 transition-all duration-200`} // Adjusted duration and added cursor styles
                              onClick={kycStatus === "1" ? btn.action : undefined} // Only set onClick if enabled
                              disabled={kycStatus !== "1"} // Use disabled attribute
                              aria-disabled={kycStatus !== "1"} // Add aria-disabled for accessibility
                            >
                              <btn.icon className={`w-5 h-5 ${kycStatus === "1" ? 'text-white' : 'text-gray-400'}`} /> {/* Adjust icon color when disabled */}
                              <span className={`text-sm ${kycStatus === "1" ? 'text-white' : 'text-gray-400'}`}>{btn.label}</span> {/* Adjust text color when disabled */}
                            </motion.button>
                          </TooltipTrigger>
                          {kycStatus !== "1" && (
                            <TooltipContent>
                              <span className="text-xs">Verify KYC to enable</span> {/* Slightly smaller text */}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </motion.div>
                </div>
              </motion.div>


            </div>
          </motion.div>

          {/* Marketplace Section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden h-full"
          >
            {/* Marketplace Header */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Marketplace</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-white hover:bg-white/10 hover:text-white"
                onClick={() => simulateLoadSection("marketplace")}
              >
                {loadingSection === "marketplace" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ShoppingCart className="w-5 h-5" />
                )}
              </Button>
            </motion.div>

            {/* Marketplace Content */}
            <div className="p-6 space-y-6">
              {/* Products Section */}
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">Products</h3>
                    <p className="text-sm text-gray-500">Explore our packages</p>
                  </div>
                  <Link href="/user-dashboard/store">
                    <Button
                      variant="outline"
                      className="h-9 text-sm text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      View All
                    </Button>
                  </Link>
                </div>

                {profileLoading || loadingSection === "marketplace" ? (
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-36 w-full rounded-lg" />
                    <Skeleton className="h-36 w-full rounded-lg" />
                    <Skeleton className="h-36 w-full rounded-lg" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {mockProducts.slice(0, 3).map((product, index) => (
                      <motion.div
                        key={product.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.05, y: -3 }}
                        className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden flex flex-col"
                      >
                        <div className="h-20 bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] flex items-center justify-center">
                          <Package className="w-8 h-8 text-white" />
                        </div>
                        <div className="p-3 flex-grow flex flex-col justify-between">
                          <h4 className="text-sm font-medium text-gray-800 line-clamp-1">{product.label}</h4>
                          <p className="text-blue-600 font-bold text-base mt-2">₱{product.price.toLocaleString()}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Services Section */}
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">Services</h3>
                    <p className="text-sm text-gray-500">Business solutions</p>
                  </div>
                  <Button
                    variant="outline"
                    className="h-9 text-sm text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    All Services
                  </Button>
                </div>

                {profileLoading || loadingSection === "marketplace" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        name: "ATM",
                        icon: CreditCardIcon,
                        color: "from-blue-400/20 to-blue-500/10",
                        iconColor: "text-blue-500",
                      },
                      {
                        name: "XpressLoad",
                        icon: Zap,
                        color: "from-green-400/20 to-green-500/10",
                        iconColor: "text-green-500",
                      },
                      {
                        name: "XpressTravels",
                        icon: Plane,
                        color: "from-purple-400/20 to-purple-500/10",
                        iconColor: "text-purple-500",
                      },
                      {
                        name: "XpressStore",
                        icon: ShoppingCart,
                        color: "from-amber-400/20 to-amber-500/10",
                        iconColor: "text-amber-500",
                      },
                    ].map((service, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className={`bg-gradient-to-br ${service.color} rounded-lg p-4 flex flex-col items-center gap-3 h-24 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer`}
                      >
                        <div className="bg-white p-2 rounded-full shadow-sm">
                          <service.icon className={`w-5 h-5 ${service.iconColor}`} />
                        </div>
                        <span className="text-sm font-semibold text-gray-70">{service.name}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Featured Card */}
              <motion.div variants={itemVariants} className="mt-5">
                <div className="relative">
                  {/* Card */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-[#1A5EA2]">Featured Offer</CardTitle>
                      <CardDescription className="text-sm">Limited time promotion</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <Sparkles className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-gray-800">Premium Package</h4>
                          <p className="text-sm text-gray-500">Get 20% off this month</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button className="w-full text-sm bg-[#1A5EA2] hover:bg-blue-700 py-5" disabled>
                        Learn More
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center pointer-events-none rounded-2xl">
                    <div className="text-[#1A5EA2] text-sm font-semibold bg-white/90 px-4 py-2 rounded-lg shadow-md border border-blue-100">
                      🚧 Coming Soon
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </motion.div>
        </section>

        <motion.hr
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="h-2 rounded-full bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] border-0 mt-8"
        />

        <section className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            {/*RECENT TRANSACTIONS - ENHANCED*/}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full md:col-span-1 mb-0"
            >
              <div className="bg-gradient-to-br from-white to-blue-50 shadow-xl rounded-2xl overflow-hidden border border-blue-100 h-full">
                {/* Header with animated badge and filter options */}
                <div className="bg-gradient-to-r from-[#337DC7] to-[#1A5EA2] p-5 text-white">
                  <div className="flex justify-between items-center mb-3">
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h2 className="text-2xl font-bold">
                        Recent Transactions
                      </h2>
                      <p className="text-sm text-white/80">
                        Your latest financial activities
                      </p>
                    </motion.div>
                    <motion.div
                      className="relative"
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.3,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-full">
                        <Wallet className="text-white w-6 h-6" />
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        {passiveIncomeTransactions.length +
                          referralTransactions.length}
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Filter tabs */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex space-x-2 overflow-x-auto scrollbar-hide pb-1"
                  >
                    {[
                      "All",
                      "Passive Income",
                      "Referral",
                      "Today",
                      "This Week",
                    ].map((filter, index) => (
                      <motion.button
                        key={filter}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 transition-all whitespace-nowrap"
                      >
                        {filter}
                      </motion.button>
                    ))}
                  </motion.div>
                </div>

                {/* Transactions List with enhanced animations */}
                <div className="p-4">
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 ">
                    {passiveIncomeLoading || referralIncomeLoading
                      ? // Loading state
                      Array(5)
                        .fill(0)
                        .map((_, index) => (
                          <motion.div
                            key={`skeleton-${index}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-100 shadow-sm"
                          >
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 animate-pulse"></div>
                            <div className="flex-grow">
                              <Skeleton className="h-4 w-3/4 mb-2" />
                              <Skeleton className="h-3 w-1/2 mb-1" />
                              <Skeleton className="h-3 w-1/4" />
                            </div>
                            <Skeleton className="h-6 w-20" />
                          </motion.div>
                        ))
                      : // Combine and sort transactions by date (newest first)
                      [...passiveIncomeTransactions, ...referralTransactions]
                        .sort(
                          (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime()
                        )
                        .slice(0, 5) // Show 5 most recent transactions
                        .map((transaction, index) => {
                          const isPassive = "income_amount" in transaction;
                          const amount = isPassive
                            ? transaction.income_amount
                            : Number(transaction.income_amount);
                          const senderName =
                            transaction.sender?.user_nicename || "Unknown";
                          const transactionDate = new Date(
                            transaction.created_at
                          );

                          // Calculate time difference
                          const now = new Date();
                          const diffMs =
                            now.getTime() - transactionDate.getTime();
                          const diffMins = Math.round(diffMs / 60000);
                          const diffHours = Math.round(diffMs / 3600000);
                          const diffDays = Math.round(diffMs / 86400000);

                          let timeAgo;
                          if (diffMins < 60) {
                            timeAgo = `${diffMins} min${diffMins !== 1 ? "s" : ""
                              } ago`;
                          } else if (diffHours < 24) {
                            timeAgo = `${diffHours} hour${diffHours !== 1 ? "s" : ""
                              } ago`;
                          } else {
                            timeAgo = `${diffDays} day${diffDays !== 1 ? "s" : ""
                              } ago`;
                          }

                          // Determine transaction icon and color
                          const transactionType = isPassive
                            ? "passive"
                            : "referral";
                          const iconBgColor = isPassive
                            ? "bg-green-100"
                            : "bg-blue-100";
                          const iconColor = isPassive
                            ? "text-green-600"
                            : "text-blue-600";
                          const borderColor = isPassive
                            ? "border-green-200"
                            : "border-blue-200";
                          const hoverBgColor = isPassive
                            ? "hover:bg-green-50"
                            : "hover:bg-blue-50";

                          return (
                            <motion.div
                              key={transaction.id || transaction.ID}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.1 + 0.05 * index,
                                duration: 0.3,
                              }}
                              className={`flex items-center gap-3 bg-white p-4 rounded-lg border ${borderColor} shadow-sm ${hoverBgColor} transition-all duration-300 cursor-pointer group`}
                            >
                              {/* Transaction icon */}
                              <div
                                className={`${iconBgColor} p-2 rounded-full transition-all duration-300 group-hover:scale-110`}
                              >
                                {isPassive ? (
                                  <motion.div
                                    whileHover={{ rotate: 15 }}
                                    className={iconColor}
                                  >
                                    <CreditCard className="w-5 h-5" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    whileHover={{ rotate: 15 }}
                                    className={iconColor}
                                  >
                                    <Users2 className="w-5 h-5" />
                                  </motion.div>
                                )}
                              </div>

                              {/* Transaction details */}
                              <div className="flex-grow">
                                <div className="flex items-center">
                                  <p className="font-semibold text-gray-800">
                                    {!isPassive
                                      ? "Passive Income"
                                      : "Referral Income"}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="ml-2 h-5 text-xs"
                                  >
                                    Level {transaction.level}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  From {senderName}
                                </p>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {timeAgo}
                                </div>
                              </div>

                              {/* Amount with animation */}
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="text-right flex flex-col items-end"
                              >
                                <p className="text-lg font-bold text-green-600">
                                  +₱{amount.toLocaleString()}
                                </p>
                                <div className="flex items-center text-xs text-gray-500">
                                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                                  Completed
                                </div>
                              </motion.div>
                            </motion.div>
                          );
                        })}

                    {/* Empty state when no transactions */}
                    {!passiveIncomeLoading &&
                      !referralIncomeLoading &&
                      passiveIncomeTransactions.length === 0 &&
                      referralTransactions.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-10 text-center"
                        >
                          <div className="bg-blue-50 p-6 rounded-full mb-4 border border-blue-100">
                            <Wallet className="w-10 h-10 text-[#337DC7]" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            No transactions yet
                          </h3>
                          <p className="text-gray-500 max-w-xs mb-4">
                            Your recent financial activities will appear here
                            once you start receiving income.
                          </p>
                          <Button
                            variant="outline"
                            className="text-[#337DC7] border-[#337DC7]"
                          >
                            Learn how to earn
                          </Button>
                        </motion.div>
                      )}
                  </div>

                  {/* Footer with stats and view all button */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4">
                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">
                          Passive Income
                        </p>
                        <p className="text-lg font-bold text-[#337DC7]">
                          ₱
                          {passiveIncomeTransactions
                            .reduce(
                              (sum, tx) => sum + Number(tx.income_amount || 0),
                              0
                            )
                            .toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">
                          Referral Income
                        </p>
                        <p className="text-lg font-bold text-[#337DC7]">
                          ₱
                          {referralTransactions
                            .reduce(
                              (sum, tx) => sum + Number(tx.income_amount || 0),
                              0
                            )
                            .toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* View All Button */}
                    <div className="flex justify-between items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#337DC7]"
                      >
                        Download CSV
                      </Button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setHistoryModalOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-[#337DC7] to-[#1A5EA2] text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <BarChart3 className="w-4 h-4" /> View All
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/*TABS*/}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full w-full md:col-span-2 flex"
            >
              <div className="w-full">
                <Tabs defaultValue="dashboard">
                  <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white/60 gap-3 tracking-tight rounded-t-xl shadow-md">
                    <TabsTrigger
                      value="dashboard"
                      variant="secondary"
                      className="text-[10px] md:text-lg data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-sm transition-all duration-300"
                    >
                      DASHBOARD
                    </TabsTrigger>
                    <TabsTrigger
                      value="transactions"
                      variant="secondary"
                      className="text-[10px] md:text-lg data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-sm transition-all duration-300"
                    >
                      ATM TRANSACTION
                    </TabsTrigger>
                    <TabsTrigger
                      value="activation"
                      variant="secondary"
                      className="text-[10px] md:text-lg data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-sm transition-all duration-300"
                    >
                      ACTIVATION CODE
                    </TabsTrigger>
                  </TabsList>

                  {/* Fixed height container for all tab content */}
                  <div className="bg-white rounded-b-xl shadow-xl border border-blue-100 border-t-0 h-[600px] overflow-hidden">
                    {/*DASHBOARD- --- MY TEAM AND ADD MERCHANT AND DISTRIBUTOR*/}
                    <TabsContent
                      value="dashboard"
                      className="h-full"
                      style={{ animation: "none" }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key="dashboard"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 h-full overflow-auto"
                        >
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="border border-[#337DC7] rounded-2xl overflow-hidden shadow-lg h-min"
                          >
                            <Card className="border-0">
                              <CardHeader className="p-0">
                                <Link href={"/user-dashboard/my-organization"}>
                                  <CardTitle className="flex items-center justify-center bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white p-5 gap-3 hover:from-[#1A5EA2] hover:to-[#3D89D6] transition-all duration-500">
                                    <Users2 className="w-5 h-5" />
                                    My Team
                                  </CardTitle>
                                </Link>
                                <CardDescription className="p-5 text-sm">
                                  Total users in my team:
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                {organizationLoading ? (
                                  <div className="space-y-4">
                                    <Skeleton className="w-16 h-8 rounded-md" />
                                    <Skeleton className="w-32 h-4 rounded" />
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2 sm:gap-3">
                                    <motion.div
                                      initial={{ scale: 0.8, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ duration: 0.5, delay: 0.2 }}
                                      className="text-5xl self-center sm:text-3xl font-extrabold bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-transparent bg-clip-text"
                                    >
                                      {
                                        organizationMembers.filter(
                                          (member) => member.user_status === 1
                                        ).length
                                      }
                                    </motion.div>
                                    <div className="text-xs self-center sm:text-sm text-muted-foreground">
                                      Total Users in My Team
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                              <CardFooter className="mt-2 flex flex-col gap-3 items-start">
                                <motion.div
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: 0.3 }}
                                  className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg w-full"
                                >
                                  <div className="w-3 h-3 bg-[#337DC7] rounded-full"></div>
                                  <div className="text-sm font-semibold">
                                    {organizationLoading ? (
                                      <Skeleton className="h-4 w-20 inline-block" />
                                    ) : (
                                      organizationMembers.filter(
                                        (m) =>
                                          m.user_role.includes("Merchant") &&
                                          m.user_status === 1
                                      ).length
                                    )}{" "}
                                    Merchants
                                  </div>
                                </motion.div>
                                <motion.div
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: 0.4 }}
                                  className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg w-full"
                                >
                                  <div className="w-3 h-3 bg-[#337DC7] rounded-full"></div>
                                  <div className="text-sm font-semibold">
                                    {organizationLoading ? (
                                      <Skeleton className="h-4 w-20 inline-block" />
                                    ) : (
                                      organizationMembers.filter(
                                        (m) =>
                                          m.user_role.includes("Distributor") &&
                                          m.user_status === 1
                                      ).length
                                    )}{" "}
                                    Distributors
                                  </div>
                                </motion.div>
                              </CardFooter>
                            </Card>
                          </motion.div>

                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            whileHover={{ scale: 1.02 }}
                            className="border border-[#337DC7] rounded-2xl overflow-hidden shadow-lg h-min"
                          >
                            <Card className="border-0">
                              <CardHeader className="p-0">
                                <CardTitle className="flex items-center justify-center bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white p-5 gap-3 hover:from-[#1A5EA2] hover:to-[#3D89D6] transition-all duration-500">
                                  <div className="flex items-center gap-2">
                                    <UserPlus className="w-5 h-5" />
                                    <Link href={"/user-dashboard/add-manual"}>
                                      <span className="text-sm md:text-base">
                                        Add Merchant/Distributor
                                      </span>
                                    </Link>
                                  </div>
                                </CardTitle>
                                <CardDescription className="pt-5 px-5 text-sm">
                                  Registered Merchants / Distributors:
                                </CardDescription>
                              </CardHeader>
                              {/* Content */}
                              <CardContent className="mt-2">
                                {/* List Skeleton */}
                                {registeredLoading ? (
                                  <div className="space-y-3 mt-2">
                                    {[1, 2, 3].map((i) => (
                                      <Skeleton
                                        key={i}
                                        className="w-full h-14"
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-4 mt-2">
                                    <ul>
                                      {registeredMembers
                                        .slice(0, 3)
                                        .map((member, index) => (
                                          <motion.li
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                              delay: 0.3 + index * 0.1,
                                            }}
                                            className="bg-gradient-to-r from-[#1D6DBB] via-[#145998] to-[#023251] rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-300 mb-2"
                                          >
                                            <div className="flex justify-between items-center mb-1">
                                              <span className="text-sm font-medium text-white">
                                                {member.user_nicename}
                                              </span>
                                              <span className="text-xs text-gray-300">
                                                {new Date(
                                                  member.user_registered
                                                ).toLocaleDateString()}
                                              </span>
                                            </div>
                                            <div className="text-xs text-center">
                                              <Badge className="bg-white/20 text-white border-none">
                                                {formatUserRole(member.user_role)}
                                              </Badge>
                                            </div>
                                          </motion.li>
                                        ))}
                                    </ul>
                                    {registeredMembers.length === 0 ? (
                                      <div className="mt-12 flex justify-center items-center w-full text-gray-500">
                                        No Registered User Found
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </CardContent>
                              <CardFooter className="flex justify-end">
                                <Link href="/user-dashboard/registered-users">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white px-6 py-3 rounded-md text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300"
                                  >
                                    View All <ArrowRight className="w-4 h-4" />
                                  </motion.button>
                                </Link>
                              </CardFooter>
                            </Card>
                          </motion.div>
                        </motion.div>
                      </AnimatePresence>
                    </TabsContent>

                    {/*--ATM--TRANSACTION*/}
                    <TabsContent
                      value="transactions"
                      className="h-full"
                      style={{ animation: "none" }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key="transactions"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 h-full overflow-auto"
                        >
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="border border-[#337DC7] rounded-2xl overflow-hidden shadow-lg h-min"
                          >
                            <Link href={"/user-dashboard/atm-transaction"}>
                              <Card className="border-0">
                                <CardHeader className="p-0">
                                  <CardTitle className="flex items-center justify-center bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white p-5 gap-3 hover:from-[#1A5EA2] hover:to-[#3D89D6] transition-all duration-500">
                                    <BarChart3 className="w-5 h-5" />
                                    My ATM Transaction
                                  </CardTitle>
                                  <CardDescription className="p-5 text-sm">
                                    Total ATM Transactions
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-center justify-center p-8">
                                  {transactionsLoading ? (
                                    <Skeleton className="h-20 w-20 rounded-full" />
                                  ) : (
                                    <motion.div
                                      initial={{ scale: 0.8, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{
                                        duration: 0.5,
                                        type: "spring",
                                      }}
                                      className="relative flex items-center justify-center"
                                    >
                                      <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                                      <div className="relative bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white text-5xl font-bold w-24 h-24 rounded-full flex items-center justify-center shadow-lg">
                                        {transactionCount.myTransactionCount}
                                      </div>
                                    </motion.div>
                                  )}
                                </CardContent>
                                <CardFooter className="flex justify-center p-4">
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-blue-50 text-[#3D89D6] px-4 py-2 rounded-lg flex items-center gap-2"
                                  >
                                    <span>View Details</span>
                                    <ChevronRight className="w-4 h-4" />
                                  </motion.div>
                                </CardFooter>
                              </Card>
                            </Link>
                          </motion.div>

                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            whileHover={{ scale: 1.02 }}
                            className="border border-[#337DC7] rounded-2xl overflow-hidden shadow-lg h-min"
                          >
                            <Link
                              href={
                                "/user-dashboard/my-merchant-atm-transactions"
                              }
                            >
                              <Card className="border-0">
                                <CardHeader className="p-0">
                                  <CardTitle className="flex items-center justify-center bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white p-5 gap-3 hover:from-[#1A5EA2] hover:to-[#3D89D6] transition-all duration-500">
                                    <BarChart3 className="w-5 h-5" />
                                    My Merchant Total ATM Transactions
                                  </CardTitle>
                                  <CardDescription className="p-5 text-sm">
                                    Total ATM Transactions
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-center justify-center p-8">
                                  {transactionsLoading ? (
                                    <Skeleton className="h-20 w-20 rounded-full" />
                                  ) : (
                                    <motion.div
                                      initial={{ scale: 0.8, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{
                                        duration: 0.5,
                                        type: "spring",
                                      }}
                                      className="relative flex items-center justify-center"
                                    >
                                      <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                                      <div className="relative bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white text-5xl font-bold w-24 h-24 rounded-full flex items-center justify-center shadow-lg">
                                        {
                                          transactionCount.myMerchantTransactionCount
                                        }
                                      </div>
                                    </motion.div>
                                  )}
                                </CardContent>
                                <CardFooter className="flex justify-center p-4">
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-blue-50 text-[#3D89D6] px-4 py-2 rounded-lg flex items-center gap-2"
                                  >
                                    <span>View Details</span>
                                    <ChevronRight className="w-4 h-4" />
                                  </motion.div>
                                </CardFooter>
                              </Card>
                            </Link>
                          </motion.div>
                        </motion.div>
                      </AnimatePresence>
                    </TabsContent>

                    {/*ACTIVATION*/}
                    <TabsContent
                      value="activation"
                      className="h-full"
                      style={{ animation: "none" }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key="activation"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="p-6 h-full overflow-auto"
                        >
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="border border-[#337DC7] rounded-2xl overflow-hidden shadow-lg"
                          >
                            <Card className="border-0">
                              <CardHeader className="p-0">
                                <CardTitle className="flex items-center justify-center bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white p-5 gap-3 hover:from-[#1A5EA2] hover:to-[#3D89D6] transition-all duration-500">
                                  <Package className="w-5 h-5" />
                                  Activation Codes & Packages
                                </CardTitle>
                              </CardHeader>

                              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                {activationLoading ? (
                                  <>
                                    <Skeleton className="h-32 w-full" />
                                    <Skeleton className="h-32 w-full" />
                                  </>
                                ) : (
                                  <>
                                    <motion.div
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3 }}
                                      whileHover={{ scale: 1.03 }}
                                      className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md p-6 w-full border border-blue-100"
                                    >
                                      <span className="text-[#3D89D6] text-xl font-bold mb-2">
                                        Total Activation Codes
                                      </span>
                                      <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{
                                          delay: 0.2,
                                          duration: 0.5,
                                          type: "spring",
                                        }}
                                        className="relative"
                                      >
                                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse opacity-20"></div>
                                        <div className="relative bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white text-5xl font-bold w-20 h-20 rounded-full flex items-center justify-center shadow-lg">
                                          {activationCount}
                                        </div>
                                      </motion.div>
                                    </motion.div>
                                    <motion.div
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3, delay: 0.1 }}
                                      whileHover={{ scale: 1.03 }}
                                      className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md p-6 w-full border border-blue-100"
                                    >
                                      <span className="text-[#3D89D6] text-xl font-bold mb-2">
                                        Available Codes
                                      </span>
                                      <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{
                                          delay: 0.3,
                                          duration: 0.5,
                                          type: "spring",
                                        }}
                                        className="relative"
                                      >
                                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse opacity-20"></div>
                                        <div className="relative bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white text-5xl font-bold w-20 h-20 rounded-full flex items-center justify-center shadow-lg">
                                          {availableCode}
                                        </div>
                                      </motion.div>
                                    </motion.div>
                                  </>
                                )}
                              </CardContent>
                              {/* Footer with Package List and View Details Button */}

                              <CardFooter className="grid grid-cols-1 md:grid-cols-[2fr_1fr] items-stretch gap-4 p-6">
                                {/* Left Side - Package List Table */}
                                <motion.div
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.3 }}
                                  className="bg-white shadow-md rounded-lg border p-4 flex flex-col"
                                >
                                  {activationLoading ? (
                                    <div className="space-y-3">
                                      {[1, 2, 3, 4].map((i) => (
                                        <Skeleton
                                          key={i}
                                          className="h-8 w-full"
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    packageAvailability.map(
                                      (pkg: any, index) => (
                                        <motion.div
                                          key={pkg.name}
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{
                                            delay: 0.4 + index * 0.1,
                                            duration: 0.3,
                                          }}
                                          whileHover={{
                                            backgroundColor: "#f0f9ff",
                                          }}
                                          className="flex justify-between py-2 border-b border-blue-100 last:border-none cursor-pointer rounded-md px-3"
                                          onClick={() => {
                                            setSelectedPackage(pkg);
                                            setIsProductDialogOpen(true);
                                          }}
                                        >
                                          <span className="p-2 text-gray-700">
                                            {pkg.name}
                                          </span>
                                          <span className="p-2 text-right text-[#3D89D6] font-semibold">
                                            {pkg.available}
                                          </span>
                                        </motion.div>
                                      )
                                    )
                                  )}
                                </motion.div>

                                {/* Right Side - View Details Button at Bottom Right */}
                                <div className="flex items-end justify-end">
                                  <Link href="/user-dashboard/activation-codes">
                                    <motion.button
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: 0.5 }}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white px-6 py-3 rounded-md text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300"
                                    >
                                      View Details{" "}
                                      <ArrowRight className="w-4 h-4" />
                                    </motion.button>
                                  </Link>
                                </div>
                              </CardFooter>
                            </Card>
                          </motion.div>
                        </motion.div>
                      </AnimatePresence>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </motion.div>
          </div>
        </section>

        <TopUpModal
          isOpen={isTopUpModalOpen}
          onClose={() => setTopUpModalOpen(false)}
          user={user}
        />
        <HistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          user={user}
        />
        <CreditsTransferModal
          isOpen={isCreditsTransferOpen}
          onClose={() => setCreditsTransferOpen(false)}
          maxCredits={profile?.user_credits}
        />
        <ManualRegistrationModal
          isOpen={isManualRegistrationModalOpen}
          onClose={() => setManualRegistrationModalOpen(false)}
        />
      </div>
      <ActivationDialog
        product={selectedPackage}
        onClose={() => setIsProductDialogOpen(false)}
        onBuy={handleBuy}
        isOpen={isProductDialogOpen}
        userCredit={profile?.user_credits || 0}
        isLoading={buyingLoading}
      />
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="w-full px-4 py-8 mx-auto md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-52 h-52 rounded-full" />
          <Skeleton className="w-40 h-6 mb-2" />
          <Skeleton className="w-full h-10" />
          <div className="w-full space-y-3">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </div>
        </div>

        <div className="grid grid-rows-3 gap-4">
          <Skeleton className="h-full w-full" />
          <Skeleton className="h-full w-full row-span-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full col-span-2" />
          <Skeleton className="h-48 w-full col-span-2" />
        </div>
      </div>

      <Skeleton className="h-2 w-full my-8" />

      <div className="grid gap-6 mt-8 md:grid-cols-3">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full md:col-span-2" />
      </div>
    </div>
  );
}

// Top top dialog but not yet implemented
// Update the TopUpModal definition in your component file

function TopUpModal({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}) {
  const [amount, setAmount] = useState<string>("");
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [paymentLinkId, setPaymentLinkId] = useState("");
  const { toast } = useToast();

  const presetAmounts = [1000, 2000, 3000, 4000, 5000];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setIsCustomAmount(false);
      setIsLoading(false);
      setShowPaymentModal(false);
      setShowSuccessModal(false);
      setPaymentUrl("");
      setPaymentLinkId("");
    }
  }, [isOpen]);

  const handlePresetSelect = (value: number) => {
    setAmount(value.toString());
    setIsCustomAmount(false);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric input
    if (/^\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const isValidAmount = (): boolean => {
    const numAmount = Number(amount);
    return amount !== "" && numAmount >= 1000 && numAmount <= 50000;
  };

  // Calculate payment amount with 2% fee
  const calculatePaymentAmount = (baseAmount: number): number => {
    const fee = baseAmount * 0.02; // 2% fee
    return baseAmount + fee;
  };

  const createPaymentLink = async () => {
    try {
      if (!isValidAmount()) return null;

      // Calculate payment amount with 2% fee
      const creditAmount = Number(amount);
      const paymentAmount = calculatePaymentAmount(creditAmount);

      const response = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          amount: Math.round(paymentAmount * 100), // Convert to cents for Paymongo
          creditAmount: creditAmount, // Store the actual credit amount to add
          description: `TopUp Credits - ${user.nickname || user.email}`,
          name:
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            user.nickname ||
            "User",
          email: user.email,
          transactionType: "credits_topup",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment link");
      }

      // Check if we have a checkout URL - if not, we're using a different payment flow
      const hasCheckoutUrl = data.checkoutUrl && data.checkoutUrl.length > 0;

      setPaymentUrl(hasCheckoutUrl ? data.checkoutUrl : "");
      setPaymentLinkId(data.id.data.id);

      return {
        paymentUrl: hasCheckoutUrl ? data.checkoutUrl : "",
        paymentLinkId: data.id.data.id,
      };
    } catch (error) {
      console.error("Error creating payment link:", error);
      toast({
        title: "Error",
        description: "Failed to create payment link. Please try again later.",
        variant: "destructive",
      });
      return null;
    }
  };

  const checkPaymentStatus = async (paymentID: string) => {
    try {
      const pollPaymentStatus = async () => {
        try {
          const response = await fetch(
            `/api/retrieve-payment-link?id=${paymentID}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );

          const data = await response.json();
          console.log("Retrieve Payment Status:", data.data.attributes.status);

          if (data.data.attributes.status === "paid") {
            // Close payment iframe first
            setShowPaymentModal(false);
            // Also close the main top-up modal
            onClose();

            // Show processing state
            toast({
              title: "Processing Payment",
              description:
                "Your payment was successful. Adding credits to your account...",
              variant: "default",
            });

            // Wait 2 seconds before updating credits
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Update user credits through API
            // Note: We send the original amount for credits, not the amount with fee
            const creditUpdate = await fetch("/api/credits/add", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                amount: Number(amount), // This is the credit amount without fee
                paymentReference: paymentID,
              }),
            });

            const creditResult = await creditUpdate.json();

            if (creditUpdate.ok && creditResult.success) {
              // Show success toast instead of modal since we already closed the main dialog
              toast({
                title: "Purchase Successful",
                description: `₱${Number(
                  amount
                ).toLocaleString()} has been added to your account.`,
                variant: "default",
                duration: 5000,
              });

              // Refresh the page to update balances
              setTimeout(() => window.location.reload(), 2000);
            } else {
              throw new Error(
                creditResult.message ||
                "Failed to update user credits. Please contact support."
              );
            }
          } else if (data.data.attributes.status === "failed") {
            setShowPaymentModal(false);
            toast({
              title: "Error",
              description: "Payment failed. Please try again.",
              variant: "destructive",
            });
          } else {
            // Continue polling if status is not paid or failed
            setTimeout(() => pollPaymentStatus(), 5000);
          }
        } catch (error) {
          setShowPaymentModal(false);
          console.error("Error checking payment status:", error);
          toast({
            title: "Error",
            description: "An error occurred while checking payment status.",
            variant: "destructive",
          });
        }
      };

      pollPaymentStatus();
    } catch (error) {
      console.error("Error in payment status check:", error);
      setShowPaymentModal(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValidAmount()) return;

    setIsLoading(true);

    try {
      const paymentDetails = await createPaymentLink();

      if (paymentDetails) {
        // If we need to show the payment iframe
        if (paymentDetails.paymentUrl) {
          setShowPaymentModal(true);
          await checkPaymentStatus(paymentDetails.paymentLinkId);
        } else {
          // If no iframe URL is provided, close the top-up modal immediately
          // and process the payment directly
          toast({
            title: "Processing Payment",
            description: "Processing your top-up request...",
            variant: "default",
          });

          // Call the API to add credits directly
          const creditUpdate = await fetch("/api/credits/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              amount: Number(amount),
              paymentReference: paymentDetails.paymentLinkId,
            }),
          });

          const creditResult = await creditUpdate.json();

          if (creditUpdate.ok && creditResult.success) {
            onClose(); // Close the top-up modal

            // Show success toast
            toast({
              title: "Purchase Successful",
              description: `₱${Number(
                amount
              ).toLocaleString()} has been added to your account.`,
              variant: "default",
            });

            // Refresh the page to update balances
            setTimeout(() => window.location.reload(), 2000);
          } else {
            throw new Error(
              creditResult.message || "Failed to process payment"
            );
          }
        }
      } else {
        throw new Error("Could not create payment link");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment Failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <LoadingOverlay message="Processing Payment" submessage="Please DO NOT close or refresh this page. This process may take a few moments to complete." forPurpose="payment" />}
      <Dialog open={isOpen} onOpenChange={isLoading ? () => { } : onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top-Up Credits</DialogTitle>
            <DialogDescription>
              Select an amount to add to your account balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Amount
              </label>
              <div className="grid grid-cols-3 gap-3">
                {presetAmounts.map((value) => (
                  <Button
                    key={value}
                    variant={
                      amount === value.toString() && !isCustomAmount
                        ? "default"
                        : "outline"
                    }
                    onClick={() => handlePresetSelect(value)}
                    className="h-12 text-base relative overflow-hidden group"
                    disabled={isLoading}
                  >
                    <span className="relative z-10">
                      ₱{value.toLocaleString()}
                    </span>
                    {amount === value.toString() && !isCustomAmount && (
                      <motion.div
                        className="absolute inset-0 bg-primary opacity-10"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </Button>
                ))}
                <Button
                  variant={isCustomAmount ? "default" : "outline"}
                  onClick={() => {
                    setIsCustomAmount(true);
                    setAmount("");
                  }}
                  className="h-12 text-base relative overflow-hidden group"
                  disabled={isLoading}
                >
                  <span className="relative z-10">Custom</span>
                  {isCustomAmount && (
                    <motion.div
                      className="absolute inset-0 bg-primary opacity-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Button>
              </div>
            </div>
            {isCustomAmount && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Enter amount (₱1,000 - ₱50,000):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₱
                  </span>
                  <Input
                    type="text"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={handleCustomAmountChange}
                    className="pl-7 text-base"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
                {amount && (Number(amount) < 1000 || Number(amount) > 50000) && (
                  <p className="text-sm text-red-500">
                    Amount must be between ₱1,000 and ₱50,000
                  </p>
                )}
              </div>
            )}
            {amount && isValidAmount() && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Credits to add:</span>
                  <span className="font-bold text-lg">
                    ₱{Number(amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">
                    Processing fee (2%):
                  </span>
                  <span className="text-sm font-medium">
                    ₱{(Number(amount) * 0.02).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1 border-t pt-2 border-blue-200">
                  <span className="text-sm font-medium text-gray-700">
                    Total payment:
                  </span>
                  <span className="font-bold text-base">
                    ₱{(Number(amount) * 1.02).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Payment method:</span>
                  <span className="text-sm font-medium">Paymongo Gateway</span>
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-md text-sm text-blue-700">
                  <p className="font-medium">After this transaction:</p>
                  <p className="mt-1">
                    Your new balance will be approximately ₱
                    {(
                      Number(user?.credits || 0) + Number(amount)
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* Payment Modal */}
          <AnimatePresence>
            {showPaymentModal && (
              <motion.div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="w-full max-w-lg h-[70vh] flex flex-col mx-auto">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Complete Your Payment</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPaymentModal(false)}
                    >
                      ✕
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 relative">
                    {paymentUrl ? (
                      <iframe
                        src={paymentUrl}
                        className="w-full h-full rounded-lg border"
                        title="Payment Gateway"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Success Dialog */}
          <AnimatePresence>
            {showSuccessModal && (
              <motion.div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="bg-white rounded-lg p-8 max-w-md mx-auto flex flex-col items-center shadow-xl"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-2">
                    Purchase Successful!
                  </h2>
                  <p className="text-gray-600 text-center mb-6">
                    ₱{Number(amount).toLocaleString()} has been added to your
                    account.
                  </p>
                  <div className="text-sm text-gray-500">
                    This window will close automatically...
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <DialogFooter>
            <Button onClick={onClose} variant="outline" disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValidAmount() || isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface HotelBooking {
  id: number;
  reference_no: string;
  booking_id: string;
  first_name: string;
  last_name: string;
  hotel_name: string;
  room_type: string;
  check_in_date: string;
  status: string;
  selling_price: string;
  amount_paid?: string; // Add this property to fix the error
  created_at?: string; // Add this property if applicable
}
interface CreditTransaction {
  id: number
  user_id: number
  amount: number
  transaction_type: string
  payment_method: string
  transaction_reference: string
  previous_balance: number
  new_balance: number
  status: string
  created_at: string
  updated_at: string
}

function HistoryModal({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean
  onClose: () => void
  user: any
}) {
  const [activeTab, setActiveTab] = useState("transactions")
  const [passiveIncomeTransactions, setPassiveIncomeTransactions] = useState<any[]>([])
  const [referralTransactions, setReferralTransactions] = useState<any[]>([])
  const [filteredPassiveIncome, setFilteredPassiveIncome] = useState<any[]>([])
  const [filteredReferrals, setFilteredReferrals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isReferralLoading, setIsReferralLoading] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [passiveSearchQuery, setPassiveSearchQuery] = useState("")
  const [referralSearchQuery, setReferralSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<any | undefined>()
  const [passiveDateRange, setPassiveDateRange] = useState<any | undefined>()
  const [referralDateRange, setReferralDateRange] = useState<any | undefined>()
  const [combinedTransactions, setCombinedTransactions] = useState<any[]>([])
  const [filteredCombined, setFilteredCombined] = useState<any[]>([])
  const [combinedSearchQuery, setCombinedSearchQuery] = useState("")
  const [combinedDateRange, setCombinedDateRange] = useState<any | undefined>()
  const [productPurchases, setProductPurchases] = useState<any[]>([])
  const [filteredPurchases, setFilteredPurchases] = useState<any[]>([])
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false)
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState("")
  const [purchaseDateRange, setPurchaseDateRange] = useState<any | undefined>()
  const [bookingTransactions, setBookingTransactions] = useState<any[]>([])
  const [filteredBookings, setFilteredBookings] = useState<any[]>([])
  const [isBookingLoading, setIsBookingLoading] = useState(false)
  const [bookingSearchQuery, setBookingSearchQuery] = useState("")
  const [bookingDateRange, setBookingDateRange] = useState<any | undefined>()
  const [wifiVouchers, setWifiVouchers] = useState<any[]>([])
  const [gsatVouchers, setGsatVouchers] = useState<any[]>([])
  const [xpressloadPurchases, setXpressloadPurchases] = useState<any[]>([])
  const [transferTransactions, setTransferTransactions] = useState<any[]>([])
  const [transferSearchQuery, setTransferSearchQuery] = useState<string>("")
  const [transferDateRange, setTransferDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)
  const [filteredTransfers, setFilteredTransfers] = useState<any[]>([])
  const [filteredXpressload, setFilteredXpressload] = useState<any[]>([])
  const [isTransferLoading, setIsTransferLoading] = useState(false)
  const [isWifiLoading, setIsWifiLoading] = useState(false)
  const [isGsatLoading, setIsGsatLoading] = useState(false)
  const [xpressloadSearchQuery, setXpressloadSearchQuery] = useState("")
  const [xpressloadDateRange, setXpressloadDateRange] = useState<any | undefined>()
  const [selectedXpressloadType, setSelectedXpressloadType] = useState<string>("all")
  const [tvVouchers, setTvVouchers] = useState<any[]>([])
  const [isTvLoading, setIsTvLoading] = useState(false)

  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([])
  const [filteredHotelBookings, setFilteredHotelBookings] = useState<HotelBooking[]>([])
  const [isHotelLoading, setIsHotelLoading] = useState(false)
  const [hotelSearchQuery, setHotelSearchQuery] = useState("")
  const [hotelDateRange, setHotelDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([])
  const [filteredCreditTransactions, setFilteredCreditTransactions] = useState<CreditTransaction[]>([])
  const [isCreditLoading, setIsCreditLoading] = useState(false)
  const [creditSearchQuery, setCreditSearchQuery] = useState("")
  const [creditDateRange, setCreditDateRange] = useState<any | undefined>()

  // New state for analytics view
  const [showAnalytics, setShowAnalytics] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchPassiveIncomeTransactions()
      fetchReferralTransactions()
      fetchProductPurchases()
      fetchBookingTransactions()
      fetchWifiVouchers()
      fetchGsatVouchers()
      fetchTvVouchers()
      fetchHotelBookings()
      fetchCreditTransactions()
      fetchCreditTransferHistory()
    }
  }, [isOpen])

  useEffect(() => {
    // Combine all voucher types into one array
    const combined = [
      ...wifiVouchers.map((voucher) => ({
        ...voucher,
        type: "wifi",
        amount: Number(voucher.price || voucher.amount || 0),
        date: new Date(voucher.created_at || voucher.purchase_date),
      })),
      ...gsatVouchers.map((voucher) => ({
        ...voucher,
        type: "gsat",
        amount: Number(voucher.price || voucher.amount || 0),
        date: new Date(voucher.created_at || voucher.purchase_date),
      })),
      ...tvVouchers.map((voucher) => ({
        ...voucher,
        type: "tv",
        amount: Number(voucher.price || voucher.amount || 0),
        date: new Date(voucher.created_at || voucher.purchase_date),
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime())

    setXpressloadPurchases(combined)
  }, [wifiVouchers, gsatVouchers, tvVouchers])

  useEffect(() => {
    filterHotelBookings()
  }, [hotelBookings, hotelSearchQuery, hotelDateRange])

  useEffect(() => {
    filterPassiveIncomeTransactions()
  }, [passiveIncomeTransactions, passiveSearchQuery, passiveDateRange])

  useEffect(() => {
    filterReferralTransactions()
  }, [referralTransactions, referralSearchQuery, referralDateRange])

  useEffect(() => {
    filterProductPurchases()
  }, [productPurchases, purchaseSearchQuery, purchaseDateRange])

  useEffect(() => {
    filterBookingTransactions()
  }, [bookingTransactions, bookingSearchQuery, bookingDateRange])

  useEffect(() => {
    filterXpressloadPurchases()
  }, [xpressloadPurchases, xpressloadSearchQuery, xpressloadDateRange, selectedXpressloadType])

  useEffect(() => {
    if (
      passiveIncomeTransactions.length ||
      referralTransactions.length ||
      productPurchases.length ||
      bookingTransactions.length ||
      wifiVouchers.length ||
      gsatVouchers.length ||
      tvVouchers.length ||
      hotelBookings.length ||
      creditTransactions.length ||
      transferTransactions.length
    ) {
      const combined = [
        ...passiveIncomeTransactions.map((tx) => ({
          ...tx,
          type: "passive",
          amount: tx.income_amount,
          date: new Date(tx.created_at),
        })),
        ...referralTransactions.map((tx) => ({
          ...tx,
          type: "referral",
          amount: Number(tx.income_amount),
          date: new Date(tx.created_at),
        })),
        ...productPurchases.map((tx) => ({
          ...tx,
          type: "purchase",
          amount: -Number(tx.amount),
          date: new Date(tx.date_purchased || tx.created_at),
        })),
        ...bookingTransactions.map((tx) => ({
          ...tx,
          type: "booking",
          amount: -Number(tx.amount_paid || 0),
          date: new Date(tx.date_booked_request || tx.bookingDate || tx.created_at),
        })),
        ...hotelBookings.map((booking) => ({
          ...booking,
          type: "hotel",
          amount: -Number(booking.amount_paid || 0),
          date: new Date(booking.check_in_date || booking.created_at || Date.now()),
        })),
        ...wifiVouchers.map((voucher) => ({
          ...voucher,
          type: "wifi",
          amount: -Number(voucher.price || voucher.amount || 0),
          date: new Date(voucher.created_at || voucher.purchase_date),
        })),
        ...gsatVouchers.map((voucher) => ({
          ...voucher,
          type: "gsat",
          amount: -Number(voucher.price || voucher.amount || 0),
          date: new Date(voucher.created_at || voucher.purchase_date),
        })),
        ...tvVouchers.map((voucher) => ({
          ...voucher,
          type: "tv",
          amount: -Number(voucher.price || voucher.amount || 0),
          date: new Date(voucher.created_at || voucher.purchase_date),
        })),
        ...creditTransactions.map((tx) => ({
          ...tx,
          type: "credit",
          amount: tx.transaction_type === "TOP_UP" ? Number(tx.amount) : -Number(tx.amount),
          date: new Date(tx.created_at),
        })),
        ...transferTransactions.map((tx) => ({
          ...tx,
          type: "transfer",
          amount: tx.isIncoming ? Number(tx.amount) : -Number(tx.amount),
          date: new Date(tx.transaction_date),
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime())

      setCombinedTransactions(combined)
      setFilteredCombined(combined)
    }
  }, [
    passiveIncomeTransactions,
    referralTransactions,
    productPurchases,
    bookingTransactions,
    wifiVouchers,
    gsatVouchers,
    tvVouchers,
    hotelBookings,
    creditTransactions,
    transferTransactions,
  ])

  useEffect(() => {
    filterCombinedTransactions()
  }, [combinedTransactions, combinedSearchQuery, combinedDateRange])

  const fetchCreditTransactions = async () => {
    setIsCreditLoading(true)
    try {
      const result = await getCreditTransactions({
        userId: Number(user?.id),
        page: 1,
        limit: 100,
      })

      if (result.success && result.data) {
        setCreditTransactions(result.data.transactions)
        setFilteredCreditTransactions(result.data.transactions)
      }
    } catch (error) {
      console.error("Error fetching credit transactions:", error)
    } finally {
      setIsCreditLoading(false)
    }
  }

  useEffect(() => {
    filterCreditTransactions()
  }, [creditTransactions, creditSearchQuery, creditDateRange])

  useEffect(() => {
    filterTransferTransactions()
  }, [transferTransactions, transferSearchQuery, transferDateRange])

  const fetchTvVouchers = async () => {
    setIsTvLoading(true)
    try {
      const result: any = await getTvVoucherByUserId(Number(user?.id))
      if (result.success) {
        setTvVouchers(result.data)
      }
    } catch (error) {
      console.error("Error fetching TV vouchers:", error)
    } finally {
      setIsTvLoading(false)
    }
  }

  const filterCreditTransactions = () => {
    let filtered = [...creditTransactions]

    if (creditSearchQuery) {
      filtered = filtered.filter(
        (tx) =>
          tx.transaction_reference.toLowerCase().includes(creditSearchQuery.toLowerCase()) ||
          tx.payment_method.toLowerCase().includes(creditSearchQuery.toLowerCase()) ||
          tx.transaction_type.toLowerCase().includes(creditSearchQuery.toLowerCase()),
      )
    }

    if (creditDateRange?.from) {
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.created_at)
        if (creditDateRange.from && txDate < creditDateRange.from) return false
        if (creditDateRange.to && txDate > creditDateRange.to) return false
        return true
      })
    }

    setFilteredCreditTransactions(filtered)
  }

  const fetchCreditTransferHistory = async () => {
    setIsTransferLoading(true)
    try {
      const result = await getCreditTransactionHistory(Number(user?.id), 100)
      if (result.success && result.data) {
        setTransferTransactions(result.data)
        setFilteredTransfers(result.data)
      }
    } catch (error) {
      console.error("Error fetching credit transfer history:", error)
    } finally {
      setIsTransferLoading(false)
    }
  }

  const filterTransferTransactions = () => {
    let filtered = [...transferTransactions]

    if (transferSearchQuery) {
      filtered = filtered.filter((tx) => {
        const senderMatch = tx.sender?.name?.toLowerCase().includes(transferSearchQuery.toLowerCase())
        const recipientMatch = tx.recipient?.name?.toLowerCase().includes(transferSearchQuery.toLowerCase())
        const noteMatch = tx.note?.toLowerCase().includes(transferSearchQuery.toLowerCase())

        return senderMatch || recipientMatch || noteMatch
      })
    }

    if (transferDateRange?.from) {
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.transaction_date)
        if (transferDateRange.from && txDate < transferDateRange.from) return false
        if (transferDateRange.to && txDate > transferDateRange.to) return false
        return true
      })
    }

    setFilteredTransfers(filtered)
  }

  const fetchHotelBookings = async () => {
    setIsHotelLoading(true)
    try {
      const result = await getHotelBookingsByUserId(Number(user?.id))
      if (result.success) {
        setHotelBookings(result.data || [])
      }
    } catch (error) {
      console.error("Error fetching hotel bookings:", error)
    } finally {
      setIsHotelLoading(false)
    }
  }

  const fetchPassiveIncomeTransactions = async () => {
    setIsLoading(true)
    try {
      const result: any = await getMyPassiveIncomeTransactions(Number(user?.id))
      if (result.success) {
        const nonZeroTransactions = result.data.filter((tx: any) => tx.income_amount > 0)
        setPassiveIncomeTransactions(nonZeroTransactions)
        setFilteredPassiveIncome(nonZeroTransactions)
      }
    } catch (error) {
      console.error("Error fetching passive income transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterHotelBookings = () => {
    let filtered = [...hotelBookings]

    if (hotelSearchQuery) {
      filtered = filtered.filter(
        (booking) =>
          booking.first_name?.toLowerCase().includes(hotelSearchQuery.toLowerCase()) ||
          booking.last_name?.toLowerCase().includes(hotelSearchQuery.toLowerCase()) ||
          booking.hotel_name?.toLowerCase().includes(hotelSearchQuery.toLowerCase()) ||
          booking.booking_id?.toLowerCase().includes(hotelSearchQuery.toLowerCase()),
      )
    }

    if (hotelDateRange?.from) {
      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.check_in_date ?? booking.created_at ?? Date.now())
        if (hotelDateRange.from && bookingDate < hotelDateRange.from) return false
        if (hotelDateRange.to && bookingDate > hotelDateRange.to) return false
        return true
      })
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.check_in_date || a.created_at || Date.now()).getTime()
      const dateB = new Date(b.check_in_date ?? b.created_at ?? 0).getTime()
      return dateB - dateA
    })

    setFilteredHotelBookings(filtered)
  }

  const fetchBookingTransactions = async () => {
    setIsBookingLoading(true)
    try {
      const result: any = await getBookingHistoryByUserId(Number(user?.id))
      if (result.success) {
        setBookingTransactions(result.data)
        setFilteredBookings(result.data)
      }
    } catch (error) {
      console.error("Error fetching booking transactions:", error)
    } finally {
      setIsBookingLoading(false)
    }
  }

  const fetchReferralTransactions = async () => {
    setIsReferralLoading(true)
    try {
      const result: any = await getReferralIncomeHistoryByUserId(Number(user?.id))
      if (result.success) {
        const nonZeroTransactions = result.data.filter((tx: any) => Number(tx.income_amount) > 0)
        setReferralTransactions(nonZeroTransactions)
        setFilteredReferrals(nonZeroTransactions)
      }
    } catch (error) {
      console.error("Error fetching referral transactions:", error)
    } finally {
      setIsReferralLoading(false)
    }
  }

  const fetchWifiVouchers = async () => {
    setIsWifiLoading(true)
    try {
      const result: any = await getWiFiVoucherByUserId(Number(user?.id))
      if (result.success) {
        setWifiVouchers(result.data)
      }
    } catch (error) {
      console.error("Error fetching WiFi vouchers:", error)
    } finally {
      setIsWifiLoading(false)
    }
  }

  const fetchGsatVouchers = async () => {
    setIsGsatLoading(true)
    try {
      const result: any = await getGsatVoucherByUserId(Number(user?.id))
      if (result.success) {
        setGsatVouchers(result.data)
      }
    } catch (error) {
      console.error("Error fetching GSAT ePIN:", error)
    } finally {
      setIsGsatLoading(false)
    }
  }

  const fetchProductPurchases = async () => {
    setIsPurchaseLoading(true)
    try {
      const result: any = await getInvitationCodesByUserId(user?.id.toString())
      if (result.success) {
        setProductPurchases(result.data)
        setFilteredPurchases(result.data)
      }
    } catch (error) {
      console.error("Error fetching product purchases:", error)
    } finally {
      setIsPurchaseLoading(false)
    }
  }

  const filterXpressloadPurchases = () => {
    let filtered = [...xpressloadPurchases]

    if (selectedXpressloadType !== "all") {
      filtered = filtered.filter((item) => item.type === selectedXpressloadType)
    }

    if (xpressloadSearchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.voucher_code?.toLowerCase().includes(xpressloadSearchQuery.toLowerCase()) ||
          item.location?.toLowerCase().includes(xpressloadSearchQuery.toLowerCase()),
      )
    }

    if (xpressloadDateRange?.from) {
      filtered = filtered.filter((item) => {
        if (xpressloadDateRange.from && item.date < xpressloadDateRange.from) return false
        if (xpressloadDateRange.to && item.date > xpressloadDateRange.to) return false
        return true
      })
    }

    setFilteredXpressload(filtered)
  }

  const filterPassiveIncomeTransactions = () => {
    let filtered = [...passiveIncomeTransactions]

    if (passiveSearchQuery) {
      filtered = filtered.filter((tx) =>
        tx.sender?.user_nicename.toLowerCase().includes(passiveSearchQuery.toLowerCase()),
      )
    }

    if (passiveDateRange?.from) {
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.created_at)
        if (passiveDateRange.from && txDate < passiveDateRange.from) return false
        if (passiveDateRange.to && txDate > passiveDateRange.to) return false
        return true
      })
    }

    setFilteredPassiveIncome(filtered)
  }

  const filterReferralTransactions = () => {
    let filtered = [...referralTransactions]

    if (referralSearchQuery) {
      filtered = filtered.filter(
        (tx) =>
          tx.sender?.user_nicename.toLowerCase().includes(referralSearchQuery.toLowerCase()) ||
          tx.invitation_code?.code.toLowerCase().includes(referralSearchQuery.toLowerCase()),
      )
    }

    if (referralDateRange?.from) {
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.created_at)
        if (referralDateRange.from && txDate < referralDateRange.from) return false
        if (referralDateRange.to && txDate > referralDateRange.to) return false
        return true
      })
    }

    setFilteredReferrals(filtered)
  }

  const filterProductPurchases = () => {
    let filtered = [...productPurchases]

    if (purchaseSearchQuery) {
      filtered = filtered.filter(
        (tx) =>
          tx.package?.toLowerCase().includes(purchaseSearchQuery.toLowerCase()) ||
          tx.code?.toLowerCase().includes(purchaseSearchQuery.toLowerCase()),
      )
    }

    if (purchaseDateRange?.from) {
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.date_purchased || tx.created_at)
        if (purchaseDateRange.from && txDate < purchaseDateRange.from) return false
        if (purchaseDateRange.to && txDate > purchaseDateRange.to) return false
        return true
      })
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date_purchased || a.created_at).getTime()
      const dateB = new Date(b.date_purchased || b.created_at).getTime()
      return dateB - dateA
    })

    setFilteredPurchases(filtered)
  }

  const filterBookingTransactions = () => {
    let filtered = [...bookingTransactions]

    if (bookingSearchQuery) {
      filtered = filtered.filter(
        (tx) =>
          tx.firstName?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
          tx.lastName?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
          tx.airline?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
          tx.pnr?.toLowerCase().includes(bookingSearchQuery.toLowerCase()),
      )
    }

    if (bookingDateRange?.from) {
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.date_booked_request || tx.bookingDate || tx.created_at)
        if (bookingDateRange.from && txDate < bookingDateRange.from) return false
        if (bookingDateRange.to && txDate > bookingDateRange.to) return false
        return true
      })
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.bookingDate || a.created_at).getTime()
      const dateB = new Date(b.bookingDate || b.created_at).getTime()
      return dateB - dateA
    })

    setFilteredBookings(filtered)
  }

  const filterCombinedTransactions = () => {
    let filtered = [...combinedTransactions]

    if (combinedSearchQuery) {
      filtered = filtered.filter(
        (tx) =>
          tx.sender?.user_nicename?.toLowerCase().includes(combinedSearchQuery.toLowerCase()) ||
          (tx.type === "referral" &&
            tx.invitation_code?.code?.toLowerCase().includes(combinedSearchQuery.toLowerCase())) ||
          (tx.type === "booking" &&
            (tx.firstName?.toLowerCase().includes(combinedSearchQuery.toLowerCase()) ||
              tx.lastName?.toLowerCase().includes(combinedSearchQuery.toLowerCase()) ||
              tx.airline?.toLowerCase().includes(combinedSearchQuery.toLowerCase()) ||
              tx.pnr?.toLowerCase().includes(combinedSearchQuery.toLowerCase()))) ||
          (tx.type === "hotel" &&
            (tx.first_name?.toLowerCase().includes(combinedSearchQuery.toLowerCase()) ||
              tx.last_name?.toLowerCase().includes(combinedSearchQuery.toLowerCase()) ||
              tx.hotel_name?.toLowerCase().includes(combinedSearchQuery.toLowerCase()) ||
              tx.booking_id?.toLowerCase().includes(combinedSearchQuery.toLowerCase()))) ||
          ((tx.type === "wifi" || tx.type === "gsat") &&
            (tx.voucher_code?.toLowerCase().includes(combinedSearchQuery.toLowerCase()) ||
              tx.location?.toLowerCase().includes(combinedSearchQuery.toLowerCase()))),
      )
    }

    if (combinedDateRange?.from) {
      filtered = filtered.filter((tx) => {
        if (combinedDateRange.from && tx.date < combinedDateRange.from) return false
        if (combinedDateRange.to && tx.date > combinedDateRange.to) return false
        return true
      })
    }

    setFilteredCombined(filtered)
  }

  // Function to format date in a readable format
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  // Function to format time in a readable format
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  }

  // Helper function to format user roles


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-[100vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex justify-between items-center">
            <span>Transaction History</span>
            <Button variant="outline" onClick={() => setShowAnalytics(!showAnalytics)} className="ml-auto">
              {showAnalytics ? "View Transactions" : "View Analytics"}
            </Button>
          </DialogTitle>
        </DialogHeader>

        {showAnalytics ? (
          <AnalyticsDashboard
            combinedTransactions={combinedTransactions}
            referralTransactions={referralTransactions}
            passiveIncomeTransactions={passiveIncomeTransactions}
            productPurchases={productPurchases.map((purchase) => ({
              ...purchase,
              package: formatUserRole(purchase.package),
            }))}
            xpressloadPurchases={xpressloadPurchases}
            bookingTransactions={bookingTransactions}
            hotelBookings={hotelBookings}
            creditTransactions={creditTransactions}
            transferTransactions={transferTransactions}
          />
        ) : (
          <Tabs defaultValue="all-history" className="w-full">
            <TabsList className="flex flex-wrap max-h-[150px] gap-2 mb-6 overflow-x-auto sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-9 p-2 bg-muted rounded-lg">
              <TabsTrigger
                value="all-history"
                className="flex-1 min-w-[120px] text-xs sm:text-sm md:text-base py-2 px-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-foreground/20 transition-all whitespace-normal"
              >
                All History
              </TabsTrigger>
              <TabsTrigger
                value="referral-history"
                className="flex-1 min-w-[120px] text-xs sm:text-sm md:text-base py-2 px-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-foreground/20 transition-all whitespace-normal"
              >
                Referral History
              </TabsTrigger>
              <TabsTrigger
                value="passive-income"
                className="flex-1 min-w-[120px] text-xs sm:text-sm md:text-base py-2 px-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-foreground/20 transition-all whitespace-normal"
              >
                Passive Income
              </TabsTrigger>
              <TabsTrigger
                value="product-purchase"
                className="flex-1 min-w-[120px] text-xs sm:text-sm md:text-base py-2 px-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-foreground/20 transition-all whitespace-normal"
              >
                Product Purchase
              </TabsTrigger>
              <TabsTrigger
                value="xpressload-purchase"
                className="flex-1 min-w-[120px] text-xs sm:text-sm md:text-base py-2 px-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-foreground/20 transition-all whitespace-normal"
              >
                Xpressload
              </TabsTrigger>
              <TabsTrigger
                value="itinerary-transaction"
                className="flex-1 min-w-[120px] text-xs sm:text-sm md:text-base py-2 px-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-foreground/20 transition-all whitespace-normal"
              >
                Airline Bookings
              </TabsTrigger>
              <TabsTrigger
                value="hotel-bookings"
                className="flex-1 min-w-[120px] text-xs sm:text-sm md:text-base py-2 px-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-foreground/20 transition-all whitespace-normal"
              >
                Hotel Bookings
              </TabsTrigger>
              <TabsTrigger
                value="credit-transactions"
                className="flex-1 min-w-[120px] text-xs sm:text-sm md:text-base py-2 px-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-foreground/20 transition-all whitespace-normal"
              >
                Credits TOP-UP
              </TabsTrigger>
              <TabsTrigger
                value="credit-transfer-history"
                className="flex-1 min-w-[120px] text-xs sm:text-sm md:text-base py-2 px-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-foreground/20 transition-all whitespace-normal"
              >
                Credit Transfers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all-history" asChild>
              <motion.div {...fadeIn}>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or referral code..."
                        value={combinedSearchQuery}
                        onChange={(e) => setCombinedSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <DatePickerWithRange date={combinedDateRange} setDate={setCombinedDateRange} />
                  </div>

                  <div className="overflow-auto max-h-[400px] rounded-lg border bg-card">
                    <AnimatePresence mode="wait">
                      {isLoading ||
                        isReferralLoading ||
                        isPurchaseLoading ||
                        isBookingLoading ||
                        isWifiLoading ||
                        isGsatLoading ||
                        isHotelLoading ? (
                        <TransactionSkeleton />
                      ) : (
                        <motion.ul
                          className="divide-y"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {filteredCombined.length > 0 ? (
                            [...filteredCombined]
                              .sort((a, b) => {
                                const getTransactionDate = (tx: any) => {
                                  switch (tx.type) {
                                    case "booking":
                                    case "hotel":
                                      return new Date(tx.date_booked_request || tx.bookingDate || tx.created_at || 0)
                                    case "wifi":
                                    case "gsat":
                                      return new Date(tx.used_date || tx.updated_at || 0)
                                    case "transfer":
                                      return new Date(tx.transaction_date || 0)
                                    default:
                                      return tx.date instanceof Date ? tx.date : new Date(tx.date || 0)
                                  }
                                }

                                const dateA = getTransactionDate(a)
                                const dateB = getTransactionDate(b)

                                return dateB - dateA
                              })
                              .map((tx, index) => {
                                const getUniqueKey = () => {
                                  if (tx.type === "booking") {
                                    const pnr = tx.pnr || "nopnr"
                                    const date = tx.date_booked_request || tx.bookingDate || tx.created_at || Date.now()
                                    const name = `${tx.first_name || tx.firstName || ""
                                      }${tx.last_name || tx.lastName || ""}`
                                    return `b-${tx.id || pnr}-${date}-${name}-${index}`
                                  }

                                  if (tx.type === "hotel") {
                                    const refNo = tx.booking_id || "noref"
                                    const date = tx.date_booked_request || Date.now()
                                    const name = `${tx.first_name || ""}${tx.last_name || ""}`
                                    return `h-${tx.id || refNo}-${date}-${name}-${index}`
                                  }

                                  if (tx.type === "transfer") {
                                    return `t-${tx.id || index}-${tx.transaction_date || Date.now()}`
                                  }

                                  return tx.type === "passive"
                                    ? `p-${tx.ID || index}`
                                    : tx.type === "referral"
                                      ? `r-${tx.id || index}`
                                      : tx.type === "wifi"
                                        ? `w-${tx.id || index}`
                                        : tx.type === "gsat"
                                          ? `g-${tx.id || index}`
                                          : tx.type === "tv"
                                            ? `tv-${tx.id || index}`
                                            : `pu-${tx.id || index}`
                                }

                                return (
                                  <motion.li
                                    key={getUniqueKey()}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="flex justify-between p-4 hover:bg-muted/50 transition-colors"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold">
                                          {tx.type === "passive"
                                            ? "Passive Income"
                                            : tx.type === "referral"
                                              ? "Referral Income"
                                              : tx.type === "credit"
                                                ? "Credit Top-UP"
                                                : tx.type === "transfer"
                                                  ? tx.isIncoming
                                                    ? "Received Credits"
                                                    : "Sent Credits"
                                                  : tx.type === "booking"
                                                    ? "Itinerary Transaction"
                                                    : tx.type === "hotel"
                                                      ? "Hotel Booking"
                                                      : tx.type === "wifi"
                                                        ? "WiFi Voucher"
                                                        : tx.type === "gsat"
                                                          ? "GSAT ePIN"
                                                          : tx.type === "tv"
                                                            ? "TV Voucher"
                                                            : "Product Purchase"}
                                        </p>
                                        {tx.type !== "purchase" &&
                                          tx.type !== "booking" &&
                                          tx.type !== "hotel" &&
                                          tx.type !== "wifi" &&
                                          tx.type !== "gsat" &&
                                          tx.type !== "transfer" && (
                                            <Badge
                                              variant={tx.type === "passive" ? "default" : "outline"}
                                              className="h-5"
                                            >
                                              Level {tx.level}
                                            </Badge>
                                          )}
                                        {tx.type === "transfer" && (
                                          <Badge
                                            variant={tx.isIncoming ? "default" : "outline"}
                                            className={`h-5 ${tx.isIncoming ? "bg-green-600" : "text-red-600 border-red-600"
                                              }`}
                                          >
                                            {tx.isIncoming ? "Incoming" : "Outgoing"}
                                          </Badge>
                                        )}
                                        {tx.type === "purchase" && (
                                          <Badge variant="outline" className="h-5">
                                            {formatUserRole(tx.package)}
                                          </Badge>
                                        )}
                                        {tx.type === "booking" && (
                                          <Badge variant="outline" className="h-5">
                                            {tx.airline || "Flight"}
                                          </Badge>
                                        )}
                                        {tx.type === "hotel" && (
                                          <Badge variant="outline" className="h-5">
                                            {tx.room_type || "Room"}
                                          </Badge>
                                        )}
                                      </div>
                                      {tx.type === "purchase" && (
                                        <p className="text-sm text-muted-foreground">Code: {tx.code}</p>
                                      )}

                                      {(tx.type === "passive" || tx.type === "referral") && (
                                        <p className="text-sm text-muted-foreground">
                                          From: {tx.sender?.user_nicename || "Unknown"}
                                        </p>
                                      )}
                                      {tx.type === "referral" && tx.invitation_code && (
                                        <p className="text-sm text-muted-foreground">Code: {tx.invitation_code.code}</p>
                                      )}

                                      {tx.type === "transfer" && (
                                        <>
                                          {tx.isIncoming ? (
                                            <p className="text-sm text-muted-foreground">
                                              From: {tx.sender?.name || "Unknown"}
                                            </p>
                                          ) : (
                                            <p className="text-sm text-muted-foreground">
                                              To: {tx.recipient?.name || "Unknown"}
                                            </p>
                                          )}
                                          {tx.note && (
                                            <p className="text-sm text-muted-foreground italic">"{tx.note}"</p>
                                          )}
                                        </>
                                      )}

                                      {tx.type === "booking" && (
                                        <>
                                          <p className="text-sm text-muted-foreground">
                                            Name: {tx.first_name || tx.firstName} {tx.last_name || tx.lastName}
                                          </p>
                                          <p className="text-sm text-muted-foreground">PNR: {tx.pnr || "N/A"}</p>
                                          <div className="flex gap-4">
                                            <p className="text-xs text-muted-foreground">
                                              Date:{" "}
                                              {formatDate(
                                                new Date(tx.date_booked_request || tx.bookingDate || tx.created_at),
                                              )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Time:{" "}
                                              {formatTime(
                                                new Date(tx.date_booked_request || tx.bookingDate || tx.created_at),
                                              )}
                                            </p>
                                          </div>
                                        </>
                                      )}

                                      {tx.type === "hotel" && (
                                        <>
                                          <p className="text-sm text-muted-foreground">
                                            Name: {tx.first_name} {tx.last_name}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            Hotel: {tx.hotel_name || "N/A"}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            BookingID: {tx.booking_id || "N/A"}
                                          </p>
                                          <div className="flex gap-4">
                                            <p className="text-xs text-muted-foreground">
                                              Check-in:{" "}
                                              {tx.check_in_date ? formatDate(new Date(tx.check_in_date)) : "N/A"}
                                            </p>
                                          </div>
                                        </>
                                      )}

                                      {(tx.type === "wifi" || tx.type === "gsat") && (
                                        <>
                                          <p className="text-sm text-muted-foreground">
                                            Code: {tx.code || tx.product_code}
                                          </p>
                                          {tx.location && (
                                            <p className="text-sm text-muted-foreground">Location: {tx.location}</p>
                                          )}
                                          <div className="flex gap-4">
                                            <p className="text-xs text-muted-foreground">
                                              Date: {formatDate(new Date(tx.used_date || tx.updated_at))}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Time: {formatTime(new Date(tx.used_date || tx.updated_at))}
                                            </p>
                                          </div>
                                        </>
                                      )}
                                      {tx.type === "tv" && (
                                        <>
                                          <p className="text-sm text-muted-foreground">
                                            Product: {tx.product_name || "Standard TV Package"}
                                          </p>
                                          {tx.location && (
                                            <p className="text-sm text-muted-foreground">Location: {tx.location}</p>
                                          )}
                                        </>
                                      )}
                                      {tx.type === "credit" && (
                                        <>
                                          <div className="flex gap-4">
                                            <p className="text-xs text-muted-foreground">
                                              Previous Balance: ₱{Number(tx.previous_balance).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Balance: ₱{Number(tx.new_balance).toLocaleString()}
                                            </p>
                                          </div>
                                        </>
                                      )}

                                      {tx.type !== "booking" &&
                                        tx.type !== "hotel" &&
                                        tx.type !== "wifi" &&
                                        tx.type !== "gsat" &&
                                        tx.type !== "transfer" && (
                                          <div className="flex gap-4">
                                            <p className="text-xs text-muted-foreground">
                                              Date: {formatDate(new Date(tx.used_date || tx.updated_at || tx.date))}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Time: {formatTime(new Date(tx.used_date || tx.updated_at || tx.date))}
                                            </p>
                                          </div>
                                        )}

                                      {tx.type === "transfer" && (
                                        <div className="flex gap-4">
                                          <p className="text-xs text-muted-foreground">
                                            Date: {formatDate(new Date(tx.transaction_date))}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Time: {formatTime(new Date(tx.transaction_date))}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-1 text-right">
                                      {tx.amount !== undefined && (
                                        <p
                                          className={`text-lg font-bold ${tx.amount > 0
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-red-600 dark:text-red-400"
                                            }`}
                                        >
                                          {tx.amount > 0
                                            ? `+₱${tx.amount.toLocaleString()}`
                                            : `-₱${Math.abs(tx.amount).toLocaleString()}`}
                                        </p>
                                      )}
                                      {tx.type === "transfer" && tx.service_fee > 0 && !tx.isIncoming && (
                                        <p className="text-xs text-gray-500">
                                          Service fee: ₱{Number(tx.service_fee).toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  </motion.li>
                                )
                              })
                          ) : (
                            <motion.li
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-8 text-center text-muted-foreground"
                            >
                              No transactions found
                            </motion.li>
                          )}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="passive-income" asChild>
              <motion.div {...fadeIn}>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by sender..."
                        value={passiveSearchQuery}
                        onChange={(e) => setPassiveSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <DatePickerWithRange date={passiveDateRange} setDate={setPassiveDateRange} />
                  </div>

                  <div className="overflow-auto max-h-[400px] rounded-lg border bg-card">
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <TransactionSkeleton />
                      ) : (
                        <motion.ul
                          className="divide-y"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {filteredPassiveIncome.length > 0 ? (
                            filteredPassiveIncome.map((tx) => (
                              <motion.li
                                key={tx.ID}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex justify-between p-4 hover:bg-muted/50 transition-colors"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">Passive Income</p>
                                    <Badge variant="default" className="h-5">
                                      Level {tx.level}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    From: {tx.sender?.user_nicename || "Unknown"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(tx.created_at).toLocaleDateString()}{" "}
                                    {new Date(tx.created_at).toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                    +₱{tx.income_amount.toLocaleString()}
                                  </p>
                                </div>
                              </motion.li>
                            ))
                          ) : (
                            <motion.li
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-8 text-center text-muted-foreground"
                            >
                              No passive income transactions found
                            </motion.li>
                          )}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="referral-history" asChild>
              <motion.div {...fadeIn}>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by referrer or code..."
                        value={referralSearchQuery}
                        onChange={(e) => setReferralSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <DatePickerWithRange date={referralDateRange} setDate={setReferralDateRange} />
                  </div>

                  <div className="overflow-auto max-h-[400px] rounded-lg border bg-card">
                    <AnimatePresence mode="wait">
                      {isReferralLoading ? (
                        <TransactionSkeleton />
                      ) : (
                        <motion.ul
                          className="divide-y"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {filteredReferrals.length > 0 ? (
                            filteredReferrals.map((tx) => (
                              <motion.li
                                key={tx.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex justify-between p-4 hover:bg-muted/50 transition-colors"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">Referral Income</p>
                                    <Badge variant="outline" className="h-5">
                                      Level {tx.level}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    From: {tx.sender?.user_nicename || "Unknown"}
                                  </p>
                                  {tx.invitation_code && (
                                    <p className="text-sm text-muted-foreground">Code: {tx.invitation_code.code}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(tx.created_at).toLocaleDateString()}{" "}
                                    {new Date(tx.created_at).toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                    +₱{Number(tx.income_amount).toLocaleString()}
                                  </p>
                                </div>
                              </motion.li>
                            ))
                          ) : (
                            <motion.li
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-8 text-center text-muted-foreground"
                            >
                              No referral transactions found
                            </motion.li>
                          )}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="product-purchase" asChild>
              <motion.div {...fadeIn}>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by package or code..."
                        value={purchaseSearchQuery}
                        onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <DatePickerWithRange date={purchaseDateRange} setDate={setPurchaseDateRange} />
                  </div>

                  <div className="overflow-auto max-h-[400px] rounded-lg border bg-card">
                    <AnimatePresence mode="wait">
                      {isPurchaseLoading ? (
                        <TransactionSkeleton />
                      ) : (
                        <motion.ul
                          className="divide-y"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {filteredPurchases.length > 0 ? (
                            filteredPurchases.map((tx) => (
                              <motion.li
                                key={tx.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex justify-between p-4 hover:bg-muted/50 transition-colors"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">Product Purchase</p>
                                    <Badge variant="outline" className="h-5">
                                      {formatUserRole(tx.package)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">Code: {tx.code}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(tx.date_purchased || tx.updated_at).toLocaleDateString()}{" "}
                                    {new Date(tx.date_purchased || tx.updated_at).toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                    -₱{Number(tx.amount).toLocaleString()}
                                  </p>
                                </div>
                              </motion.li>
                            ))
                          ) : (
                            <motion.li
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-8 text-center text-muted-foreground"
                            >
                              No product purchases found{" "}
                            </motion.li>
                          )}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="itinerary-transaction" asChild>
              <motion.div {...fadeIn}>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, airline, or PNR..."
                        value={bookingSearchQuery}
                        onChange={(e) => setBookingSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <DatePickerWithRange date={bookingDateRange} setDate={setBookingDateRange} />
                  </div>

                  <div className="overflow-auto max-h-[400px] rounded-lg border bg-card">
                    <AnimatePresence mode="wait">
                      {isBookingLoading ? (
                        <TransactionSkeleton />
                      ) : (
                        <motion.ul
                          className="divide-y"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {filteredBookings.length > 0 ? (
                            filteredBookings.map((tx, index) => (
                              <motion.li
                                key={tx.id ? `b-${tx.id}` : `b-${index}`}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex justify-between p-4 hover:bg-muted/50 transition-colors"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">Itinerary Transaction</p>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Client: {`${tx.first_name} ${tx.last_name}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">PNR: {tx.pnr || "N/A"}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(tx.date_booked_request).toLocaleDateString()}{" "}
                                    {new Date(tx.date_booked_request).toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="space-y-1 text-right">
                                  {tx.amount_paid && (
                                    <p
                                      className={`text-lg font-bold ${Number(tx.amount_paid) < 0
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                        }`}
                                    >
                                      {Number(tx.amount_paid) < 0
                                        ? `+₱${Number(tx.amount_paid).toLocaleString()}`
                                        : `-₱${Math.abs(Number(tx.amount_paid)).toLocaleString()}`}
                                    </p>
                                  )}
                                </div>
                              </motion.li>
                            ))
                          ) : (
                            <motion.li
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-8 text-center text-muted-foreground"
                            >
                              No itinerary transactions found
                            </motion.li>
                          )}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="hotel-bookings" asChild>
              <motion.div {...fadeIn}>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, hotel, or booking id..."
                        value={hotelSearchQuery}
                        onChange={(e) => setHotelSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <DatePickerWithRange
                      date={hotelDateRange?.from ? { from: hotelDateRange.from, to: hotelDateRange.to } : undefined}
                      setDate={setHotelDateRange}
                    />
                  </div>

                  <div className="overflow-auto max-h-[400px] rounded-lg border bg-card">
                    <AnimatePresence mode="wait">
                      {isHotelLoading ? (
                        <TransactionSkeleton />
                      ) : (
                        <motion.ul
                          className="divide-y"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {filteredHotelBookings.length > 0 ? (
                            filteredHotelBookings.map((booking, index) => (
                              <motion.li
                                key={booking.id ? `hotel-${booking.id}` : `hotel-${index}`}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex justify-between p-4 hover:bg-muted/50 transition-colors"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">Hotel Booking</p>
                                    <Badge variant="outline" className="h-5">
                                      {booking.room_type || "Standard"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Guest: {`${booking.first_name} ${booking.last_name}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">Hotel: {booking.hotel_name || "N/A"}</p>
                                  <p className="text-sm text-muted-foreground">No: {booking.booking_id || "N/A"}</p>
                                  <div className="flex gap-4">
                                    <p className="text-xs text-muted-foreground">
                                      Check-in:{" "}
                                      {booking.check_in_date ? formatDate(new Date(booking.check_in_date)) : "N/A"}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-1 text-right">
                                  {booking.amount_paid && (
                                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                      -₱
                                      {Number.parseFloat(booking.amount_paid).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </motion.li>
                            ))
                          ) : (
                            <motion.li
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-8 text-center text-muted-foreground"
                            >
                              No hotel bookings found
                            </motion.li>
                          )}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="xpressload-purchase" asChild>
              <motion.div {...fadeIn}>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by voucher code or location..."
                        value={xpressloadSearchQuery}
                        onChange={(e) => setXpressloadSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <DatePickerWithRange date={xpressloadDateRange} setDate={setXpressloadDateRange} />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    <Button
                      variant={selectedXpressloadType === "wifi" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedXpressloadType("wifi")}
                    >
                      WiFi
                    </Button>
                    <Button
                      variant={selectedXpressloadType === "gsat" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedXpressloadType("gsat")}
                    >
                      GSAT
                    </Button>
                    <Button
                      variant={selectedXpressloadType === "tv" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedXpressloadType("tv")}
                    >
                      TV
                    </Button>
                  </div>

                  <div className="overflow-auto max-h-[400px] rounded-lg border bg-card">
                    <AnimatePresence mode="wait">
                      {isWifiLoading || isGsatLoading || isTvLoading ? (
                        <TransactionSkeleton />
                      ) : (
                        <motion.ul
                          className="divide-y"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {filteredXpressload.length > 0 ? (
                            filteredXpressload
                              .sort(
                                (a, b) =>
                                  new Date(b.used_date || b.updated_at).getTime() -
                                  new Date(a.used_date || a.updated_at).getTime(),
                              )
                              .map((item, index) => (
                                <motion.li
                                  key={item._uniqueId || `${item.type}-${item.id || item._id || index}`}
                                  layout
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  className="flex justify-between p-4 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold">
                                        {item.type === "wifi"
                                          ? "WiFi Voucher"
                                          : item.type === "gsat"
                                            ? "GSAT ePIN"
                                            : "TV Voucher"}
                                      </p>
                                    </div>
                                    {(item.type === "wifi" || item.type === "gsat") && (
                                      <p className="text-sm text-muted-foreground">
                                        Code: {item.code || item.product_code}
                                      </p>
                                    )}
                                    {item.type === "tv" && (
                                      <p className="text-sm text-muted-foreground">
                                        Product: {item.product_name || "Standard TV Package"}
                                      </p>
                                    )}
                                    {item.location && (
                                      <p className="text-sm text-muted-foreground">Location: {item.location}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      Date:{" "}
                                      {new Date(
                                        item.used_date || item.updated_at || item.created_at,
                                      ).toLocaleDateString("en-US", {
                                        month: "numeric",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Time:{" "}
                                      {new Date(
                                        item.used_date || item.updated_at || item.created_at,
                                      ).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                  <div className="space-y-1 text-right">
                                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                      -₱{item.amount.toLocaleString()}
                                    </p>
                                  </div>
                                </motion.li>
                              ))
                          ) : (
                            <motion.li
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-8 text-center text-muted-foreground"
                            >
                              No{" "}
                              {selectedXpressloadType === "wifi"
                                ? "WiFi vouchers"
                                : selectedXpressloadType === "gsat"
                                  ? "GSAT ePINs"
                                  : "TV vouchers"}{" "}
                              found
                            </motion.li>
                          )}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="credit-transactions" asChild>
              <motion.div {...fadeIn}>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by reference, payment method..."
                        value={creditSearchQuery}
                        onChange={(e) => setCreditSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <DatePickerWithRange date={creditDateRange} setDate={setCreditDateRange} />
                  </div>

                  <div className="overflow-auto max-h-[400px] rounded-lg border bg-card">
                    <AnimatePresence mode="wait">
                      {isCreditLoading ? (
                        <TransactionSkeleton />
                      ) : (
                        <motion.ul
                          className="divide-y"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {filteredCreditTransactions.length > 0 ? (
                            filteredCreditTransactions.map((tx) => (
                              <motion.li
                                key={`credit-${tx.id}`}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex justify-between p-4 hover:bg-muted/50 transition-colors"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">
                                      {tx.transaction_type === "TOP_UP"
                                        ? "Credit Top-Up"
                                        : tx.transaction_type === "TRANSFER"
                                          ? "Credit Transfer"
                                          : "Credit Transaction"}
                                    </p>
                                    <Badge variant={tx.status === "COMPLETED" ? "default" : "outline"} className="h-5">
                                      {tx.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground"></p>
                                  <p className="text-sm text-muted-foreground"></p>
                                  <div className="flex gap-4">
                                    <p className="text-xs text-muted-foreground">
                                      Date: {formatDate(new Date(tx.created_at))}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Time: {formatTime(new Date(tx.created_at))}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p
                                    className={`text-lg font-bold ${tx.transaction_type === "TOP_UP"
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                      }`}
                                  >
                                    {tx.transaction_type === "TOP_UP"
                                      ? `+₱${Number(tx.amount).toLocaleString()}`
                                      : `-₱${Number(tx.amount).toLocaleString()}`}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Balance: ₱{Number(tx.new_balance).toLocaleString()}
                                  </p>
                                </div>
                              </motion.li>
                            ))
                          ) : (
                            <motion.li
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-8 text-center text-muted-foreground"
                            >
                              No credit transactions found
                            </motion.li>
                          )}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="credit-transfer-history" asChild>
              <motion.div {...fadeIn}>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or note..."
                        value={transferSearchQuery}
                        onChange={(e) => setTransferSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <DatePickerWithRange
                      date={
                        transferDateRange?.from
                          ? {
                            from: transferDateRange.from,
                            to: transferDateRange.to,
                          }
                          : undefined
                      }
                      setDate={setTransferDateRange}
                    />
                  </div>

                  <div className="overflow-auto max-h-[400px] rounded-lg border bg-card">
                    <AnimatePresence mode="wait">
                      {isTransferLoading ? (
                        <TransactionSkeleton />
                      ) : (
                        <motion.ul
                          className="divide-y"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {filteredTransfers.length > 0 ? (
                            filteredTransfers.map((tx, index) => (
                              <motion.li
                                key={`transfer-${tx.id || index}`}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex justify-between p-4 hover:bg-muted/50 transition-colors"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">
                                      {tx.isIncoming ? "Received Credits" : "Sent Credits"}
                                    </p>
                                    <Badge
                                      variant={tx.isIncoming ? "default" : "outline"}
                                      className={`h-5 ${tx.isIncoming ? "bg-green-600" : "text-red-600 border-red-600"
                                        }`}
                                    >
                                      {tx.isIncoming ? "Incoming" : "Outgoing"}
                                    </Badge>
                                  </div>

                                  {tx.isIncoming ? (
                                    <p className="text-sm text-muted-foreground">
                                      From: {tx.sender?.name || "Unknown"}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      To: {tx.recipient?.name || "Unknown"}
                                    </p>
                                  )}

                                  {tx.note && <p className="text-sm text-muted-foreground italic">"{tx.note}"</p>}

                                  <div className="flex gap-4">
                                    <p className="text-xs text-muted-foreground">
                                      Date: {formatDate(new Date(tx.transaction_date))}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Time: {formatTime(new Date(tx.transaction_date))}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p
                                    className={`text-lg font-bold ${tx.isIncoming
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                      }`}
                                  >
                                    {tx.isIncoming
                                      ? `+₱${Number(tx.amount).toLocaleString()}`
                                      : `-₱${Number(tx.amount).toLocaleString()}`}
                                  </p>
                                  {tx.service_fee > 0 && !tx.isIncoming && (
                                    <p className="text-xs text-muted-foreground">
                                      Service fee: ₱{Number(tx.service_fee).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </motion.li>
                            ))
                          ) : (
                            <motion.li
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-8 text-center text-muted-foreground"
                            >
                              No credit transfers found
                            </motion.li>
                          )}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


export function TransactionSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex justify-between p-4 border rounded-md">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-6 w-24 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CreditsTransferModal({
  isOpen,
  onClose,
  maxCredits,
}: {
  isOpen: boolean
  onClose: () => void
  maxCredits: number
}) {
  // State management with sensible defaults
  const [formState, setFormState] = useState({
    fullName: "",
    recipientIdentifier: "",
    amount: "",
    serviceFee: "0",
    note: "",
    sendEmailNotification: true,
  });

  // Status states separated from form data
  const [status, setStatus] = useState({
    isLoading: false,
    isSearching: false,
    error: null as string | null,
    success: null as string | null,
    showConfirmation: false,
  });

  const [recipientInfo, setRecipientInfo] = useState<any>(null);
  const { user } = useUserContext();
  const { toast } = useToast();

  // Calculate what the recipient will receive - memoized
  const recipientReceives = useMemo(() => {
    return Number(formState.amount) || 0
  }, [formState.amount]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset form state
      setFormState({
        fullName: "",
        recipientIdentifier: "",
        amount: "",
        serviceFee: "0",
        note: "",
        sendEmailNotification: true,
      });

      // Reset status state
      setStatus({
        isLoading: false,
        isSearching: false,
        error: null,
        success: null,
        showConfirmation: false,
      });

      // Reset recipient info
      setRecipientInfo(null);
    }
  }, [isOpen]);

  // Form field update handler - single handler for multiple inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    if (id === "amount" || id === "serviceFee") {
      // Only allow numeric input for amount and service fee
      if (/^\d*$/.test(value)) {
        setFormState(prev => ({ ...prev, [id]: value }));
      }
    } else {
      setFormState(prev => ({ ...prev, [id]: value }));
    }
  };

  // Checkbox handler
  const handleCheckboxChange = (checked: boolean) => {
    setFormState(prev => ({ ...prev, sendEmailNotification: checked }));
  };

  // Search for recipient when identifier is entered
  const handleRecipientSearch = async () => {
    const { recipientIdentifier } = formState;

    if (!recipientIdentifier || recipientIdentifier.length < 3) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid merchant ID, email, or phone number (minimum 3 characters)",
        variant: "destructive",
      });
      return;
    }

    setStatus(prev => ({ ...prev, isSearching: true, error: null }));
    setRecipientInfo(null);

    try {
      const response = await findUserForTransfer({
        identifier: recipientIdentifier,
      });

      if (response.success && response.data?.user) {
        const user = response.data.user;
        setRecipientInfo(user);
        setFormState(prev => ({
          ...prev,
          fullName: user.user_nicename || user.display_name || ""
        }));

        toast({
          title: "Recipient found",
          description: `Found ${user.user_nicename || user.display_name}`,
        });
      } else {
        setStatus(prev => ({
          ...prev,
          error: response.error || "Recipient not found. Please check the ID and try again."
        }));

        toast({
          title: "Recipient not found",
          description: response.error || "Please check the ID and try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error searching for recipient:", err);
      setStatus(prev => ({
        ...prev,
        error: "Error searching for recipient. Please try again."
      }));

      toast({
        title: "Error",
        description: "Failed to search for recipient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStatus(prev => ({ ...prev, isSearching: false }));
    }
  };

  // Validation functions
  const isValidAmount = (): boolean => {
    const baseAmount = Number(formState.amount);
    return formState.amount !== "" &&
      baseAmount >= 100 &&
      baseAmount <= 50000 &&
      baseAmount <= (maxCredits || 0);
  };

  const isValidServiceFee = (): boolean => {
    const fee = Number(formState.serviceFee);
    return fee >= 0 && fee <= 1000;
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientInfo) {
      setStatus(prev => ({
        ...prev,
        error: "Please search and select a valid recipient first."
      }));
      return;
    }

    if (!isValidAmount()) {
      setStatus(prev => ({
        ...prev,
        error: "Please enter a valid amount between ₱100 and ₱50,000 that doesn't exceed your balance."
      }));
      return;
    }

    if (!isValidServiceFee()) {
      setStatus(prev => ({
        ...prev,
        error: "Service fee must be between ₱0 and ₱1,000."
      }));
      return;
    }

    // Show confirmation dialog
    setStatus(prev => ({ ...prev, showConfirmation: true }));
  };

  // Process the transfer after confirmation
  const processTransfer = async () => {
    setStatus(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      success: null
    }));

    try {
      const { recipientIdentifier, amount, serviceFee, note, sendEmailNotification } = formState;

      const response = await transferCredits({
        senderId: user?.id ?? 0,
        recipientIdentifier,
        amount: Number(amount),
        serviceFee: Number(serviceFee),
        note: note || undefined,
        sendEmailNotification,
      });

      if (response.success) {
        let successMessage = `Successfully transferred ₱${Number(amount).toLocaleString()} to ${recipientInfo.user_nicename || recipientInfo.display_name
          }`;

        // Add email notification status to success message if enabled
        if (sendEmailNotification) {
          successMessage += response.data?.emailsSent
            ? ". Email notifications have been sent."
            : ". Transfer completed but email notifications could not be sent.";
        }

        setStatus(prev => ({ ...prev, success: successMessage }));

        toast({
          title: "Transfer successful",
          description: successMessage,
        });

        // Close modal after a brief delay
        setTimeout(() => {
          onClose();
          // Refresh page to update balances
          window.location.reload();
        }, 2000);
      } else {
        setStatus(prev => ({
          ...prev,
          error: response.error || "Transfer failed. Please try again."
        }));

        toast({
          title: "Transfer failed",
          description: response.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error transferring credits:", err);
      setStatus(prev => ({
        ...prev,
        error: "Error processing transfer. Please try again."
      }));

      toast({
        title: "Error",
        description: "Failed to process transfer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        showConfirmation: false
      }));
    }
  };

  // Reset recipient handler
  const resetRecipient = () => {
    setRecipientInfo(null);
    setFormState(prev => ({ ...prev, recipientIdentifier: "" }));
  };

  // Destructure form state and status for easier access
  const {
    recipientIdentifier, amount, serviceFee, note, sendEmailNotification
  } = formState;

  const {
    isLoading, isSearching, error, success, showConfirmation
  } = status;

  return (
    <>
      {isLoading && (<LoadingOverlay message="Processing your transfer..." submessage="Please DO NOT close or refresh this page. This process may take a few moments to complete." forPurpose="transfer" />)}
      <Dialog open={isOpen} onOpenChange={isLoading ? () => { } : onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 z-10 bg-white pb-2">
            <DialogTitle>Transfer Credits</DialogTitle>
            <DialogDescription>
              Enter the details to transfer credits to another merchant or distributor.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Recipient Search Section */}
              <div className="space-y-2">
                <label className="text-left text-sm font-medium text-gray-700">
                  Recipient Merchant ID, Email, or Phone
                </label>
                <div className="flex gap-2">
                  <Input
                    id="recipientIdentifier"
                    value={recipientIdentifier}
                    placeholder="Enter ID, email, or phone"
                    onChange={handleInputChange}
                    className="flex-grow"
                    required
                    disabled={isLoading || !!recipientInfo}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRecipientSearch}
                    disabled={
                      isSearching ||
                      isLoading ||
                      !recipientIdentifier ||
                      recipientIdentifier.length < 3 ||
                      !!recipientInfo
                    }
                    className="shrink-0"
                  >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                </div>
                {!recipientInfo && recipientIdentifier && recipientIdentifier.length < 3 && (
                  <p className="text-xs text-red-500">Please enter at least 3 characters</p>
                )}
              </div>

              {/* Recipient Info Card - Only shown when recipient is found */}
              {recipientInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 p-4 rounded-lg border border-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-blue-800 truncate">
                        {recipientInfo.user_nicename || recipientInfo.display_name || `User #${recipientInfo.ID}`}
                      </p>
                      <p className="text-sm text-blue-600 truncate">{recipientInfo.user_email}</p>
                      {recipientInfo.merchant_id && (
                        <p className="text-xs text-blue-500 truncate">Merchant ID: {recipientInfo.merchant_id}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetRecipient}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Change
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-left text-sm font-medium text-gray-700">Amount (₱100 - ₱50,000)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={handleInputChange}
                    className="pl-7"
                    required
                    disabled={isLoading || !recipientInfo}
                  />
                </div>
                {amount && (
                  <p className="text-xs text-gray-500">Recipient will receive: ₱{recipientReceives.toLocaleString()}</p>
                )}
              </div>

              {/* Service Fee Input */}
              <div className="space-y-2">
                <label className="text-left text-sm font-medium text-gray-700">Service Fee (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    id="serviceFee"
                    type="text"
                    placeholder="Enter service fee"
                    value={serviceFee}
                    onChange={handleInputChange}
                    className="pl-7"
                    disabled={isLoading || !recipientInfo}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  This fee is recorded for accounting purposes only and is not included in the transfer amount.
                </p>
              </div>

              {/* Transaction Summary */}
              {amount && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-medium text-gray-800 mb-2">Transaction Summary</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Transfer amount:</span>
                      <span className="text-sm font-medium">₱{Number(amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Service fee (not included in transfer):</span>
                      <span className="text-sm font-medium">₱{Number(serviceFee).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                      <span className="text-sm font-medium text-gray-700">Total deducted:</span>
                      <span className="text-sm font-bold text-gray-800">₱{Number(amount).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Balance Check */}
                  <div
                    className={`mt-3 text-sm ${Number(amount) <= (maxCredits || 0) ? "text-green-600" : "text-red-500"}`}
                  >
                    {Number(amount) <= (maxCredits || 0) ? (
                      <>Your remaining balance will be ₱{((maxCredits || 0) - Number(amount)).toLocaleString()}</>
                    ) : (
                      <>Insufficient balance. Available: ₱{(maxCredits || 0).toLocaleString()}</>
                    )}
                  </div>
                </div>
              )}

              {/* Optional Note */}
              <div className="space-y-2">
                <label className="text-left text-sm font-medium text-gray-700">Note (Optional)</label>
                <Input
                  id="note"
                  value={note}
                  placeholder="Add a note about this transfer"
                  onChange={handleInputChange}
                  maxLength={200}
                  disabled={isLoading || !recipientInfo}
                />
                <p className="text-xs text-gray-500">{note.length}/200 characters</p>
              </div>

              {/* Email Notification Option */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="emailNotification"
                  checked={sendEmailNotification}
                  onCheckedChange={(checked) => handleCheckboxChange(checked === true)}
                  disabled={isLoading}
                  className="mt-1"
                />
                <div>
                  <label
                    htmlFor="emailNotification"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Send email notifications
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Email notifications will be sent to both you and the recipient
                  </p>
                </div>
              </div>

              {/* Email Notification Info - Only show when checked */}
              {sendEmailNotification && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <div className="text-blue-500 mt-0.5">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-blue-800 font-medium">Email notifications will include:</p>
                      <ul className="text-blue-600 text-xs mt-1 list-disc list-inside space-y-1">
                        <li>Transaction details (amount, date, reference)</li>
                        <li>Sender and recipient information</li>
                        <li>Your note (if provided)</li>
                        <li>Current balance update</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="sticky bottom-0 pt-2 pb-2 bg-white mt-4 z-10">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!recipientInfo || !isValidAmount() || !isValidServiceFee() || isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Transfer Credits"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={(open) =>
        setStatus(prev => ({ ...prev, showConfirmation: open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Credit Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to transfer ₱{Number(amount).toLocaleString()} to{" "}
              {recipientInfo?.user_nicename || recipientInfo?.display_name}?
              <div className="mt-4 bg-amber-50 p-3 rounded-md border border-amber-100">
                <div className="font-medium text-amber-800">Transfer details:</div>
                <ul className="mt-2 space-y-1 text-sm text-amber-700">
                  <li>• Amount: ₱{Number(amount).toLocaleString()}</li>
                  <li>• Recipient: {recipientInfo?.user_nicename || recipientInfo?.display_name}</li>
                  <li>• Email: {recipientInfo?.user_email}</li>
                  {note && <li>• Note: {note}</li>}
                  <li>• Email notification: {sendEmailNotification ? "Yes" : "No"}</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={processTransfer}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Yes, Transfer Credits"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const InfoItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg transition-all duration-300 ease-in-out hover:bg-muted/80">
    <div className="flex-shrink-0 bg-[#3D89D6] p-3 rounded-full">
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="flex-grow overflow-hidden">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  </div>
);

// Replace the TransactionHistoryChart function with this updated version
interface Transaction {
  date: Date;
  amount: number;
  type: "passive" | "referral";
}

interface DayData {
  date: Date;
  passive: number;
  referral: number;
  total: number;
  formattedDate: string;
}

interface TransactionHistoryChartProps {
  passiveIncome: any[];
  referralIncome: any[];
}

function TransactionHistoryChart({
  passiveIncome,
  referralIncome,
}: TransactionHistoryChartProps) {
  const processTransactionData = (): DayData[] => {
    const allTransactions: Transaction[] = [
      ...passiveIncome.map((tx) => ({
        date: new Date(tx.created_at),
        amount: Number(tx.income_amount || 0),
        type: "passive" as const,
      })),
      ...referralIncome.map((tx) => ({
        date: new Date(tx.created_at),
        amount: Number(tx.income_amount || 0),
        type: "referral" as const,
      })),
    ];

    // Sort transactions: newest first.
    allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    const transactionsByDay = new Map<string, DayData>();

    allTransactions.forEach((tx) => {
      // Use only the date portion as the key.
      const dateKey = tx.date.toISOString().split("T")[0];

      if (!transactionsByDay.has(dateKey)) {
        transactionsByDay.set(dateKey, {
          date: tx.date,
          passive: 0,
          referral: 0,
          total: 0,
          formattedDate: `${tx.date.getMonth() + 1}/${tx.date.getDate()}/${String(
            tx.date.getFullYear()
          ).slice(2)}`,
        });
      }

      const dayData = transactionsByDay.get(dateKey)!;
      if (tx.type === "passive") {
        dayData.passive += tx.amount;
      } else {
        dayData.referral += tx.amount;
      }
      dayData.total += tx.amount;
    });

    // Return the latest 6 days of data.
    return Array.from(transactionsByDay.values()).slice(0, 6);
  };

  const chartData = processTransactionData();

  // Instead of displaying mock data, show a centered "No Transaction" if there's no data.
  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-white/50">No Transaction</div>
      </div>
    );
  }

  // Reverse the array to show the oldest dates first (left-to-right).
  const sortedChartData = [...chartData].reverse();

  // Prepare the combined chart data.
  const combinedChartData = sortedChartData.map((data) => ({
    name: data.formattedDate,
    passive: data.passive,
    referral: data.referral,
    total: data.passive + data.referral,
  }));

  return (
    <div className="w-full h-full">
      <div className="w-full h-full" style={{ margin: "-8px -8px 0 -8px" }}>
        <ResponsiveChart data={combinedChartData} />
      </div>
    </div>
  );
}

interface ResponsiveChartProps {
  data: any[];
}

function ResponsiveChart({ data }: ResponsiveChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 8 }}
            axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
            tickLine={false}
          />
          <YAxis hide domain={[0, "dataMax + 100"]} />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "none",
              borderRadius: "4px",
              fontSize: "10px",
              color: "white",
              padding: "5px",
            }}
            labelStyle={{ color: "#ffffff", fontSize: 10 }}
            labelFormatter={(name: any) => `Date: ${name}`}
            formatter={(value: any, name: any) => {
              const label =
                name === "passive" ? "Passive" : name === "referral" ? "Referral" : "Total";
              return [`${label}: ₱${Number(value).toLocaleString()}`, label];
            }}
          />

          <Bar dataKey="passive" fill="#4ade80" radius={[2, 2, 0, 0]} barSize={6} />
          <Bar dataKey="referral" fill="#60a5fa" radius={[2, 2, 0, 0]} barSize={6} />
          <Line
            type="linear"
            dataKey="total"
            stroke="#ffffff"
            strokeWidth={1.5}
            dot={{ r: 3, fill: "#ffffff", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#ffffff", stroke: "#3D89D6", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}