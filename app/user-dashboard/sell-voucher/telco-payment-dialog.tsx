import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader, Wallet, Check, AlertCircle, Info, Tag, Percent, CreditCard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { getUserProfile } from "@/actions/user";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Define interfaces
interface TelcoBookingDetails {
  typeOfVoucher: "TELCO";
  product_code: string;
  productName: string;
  email: string;
  phoneNumber: string;
  quantity: number;
  serviceFee: number;
  pricing: {
    basePrice: number;
    productPrice: number;
    subtotal: number;
    total: number;
    discountPercentage: number;
    userRole: string;
  };
  telcoProvider?: string;
}

interface User {
  id: string | number;
}

interface UserContext {
  user: User | null;
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// Format user role for display
const formatUserRole = (role: string) => {
  if (!role) return "N/A";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .replace("Package", "");
};

// Role Badge with loading state
const RoleBadge = ({ role, isLoading }: { role: string; isLoading: boolean }) => {
  if (isLoading) {
    return <Skeleton className="h-7 w-32 rounded-2xl" />;
  }

  const baseStyle = "text-white px-2 py-1 text-sm font-semibold rounded-2xl";
  let badgeStyle = `${baseStyle} bg-gradient-to-r from-gray-400 to-gray-600`;
  
  switch (role) {
    case "Premium_Merchant_Package":
      badgeStyle = `${baseStyle} bg-[linear-gradient(to_right,_#1D6DBB,_#145998,_#0B4674,_#023251)]`;
      break;
    case "Basic_Merchant_Package":
      badgeStyle = `${baseStyle} bg-[linear-gradient(to_right,_#020024,_#6de7f7,_#00d4ff)]`;
      break;
    case "Elite_Distributor_Package":
      badgeStyle = `${baseStyle} bg-[linear-gradient(to_right,_#1D6DBB,_#145998,_#0B4674,_#023251)]`;
      break;
    case "Elite_Plus_Distributor_Package":
      badgeStyle = `${baseStyle} bg-[linear-gradient(to_right,_#3D89D6,_#1A5EA2,_#0B4674,_#023251)]`;
      break;
    case "Admin":
      badgeStyle = `${baseStyle} bg-gradient-to-r from-red-400 to-red-600`;
      break;
  }

  return <div className={badgeStyle}>{formatUserRole(role)}</div>;
};

export const TelcoPaymentDialog = ({ 
  open, 
  onClose, 
  bookingDetails, 
  onBookingSuccess, 
  userCredit 
}: { 
  open: boolean; 
  onClose: () => void; 
  bookingDetails: TelcoBookingDetails; 
  onBookingSuccess: (paymentMethod: string, proofOfPaymentUrl?: string) => void;
  userCredit: number;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [kycStatus, setKycStatus] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("credits");

  // Get pricing information from bookingDetails
  const pricing = bookingDetails?.pricing || {
    basePrice: 0,
    productPrice: 0,
    subtotal: 0,
    total: 0,
    discountPercentage: 0,
    userRole: "",
  };

  // Calculate amounts based on booking details
  const serviceAmount = pricing.subtotal;
  const serviceFee = bookingDetails?.serviceFee || 0;
  const totalAmount = pricing.total;
  const hasEnoughCredits = userCredit >= totalAmount; // Check against total amount including service fee

  // Fetch user KYC status and role
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (open) {
        setIsLoading(true);
        try {
          // In a real app, this would use the user from context
          // For now, we'll simulate with a hardcoded ID
          const userId = "12345"; // This would come from user context
          const response = await getUserProfile(userId);
          if (response.success && response.data) {
            setKycStatus(Number.parseInt(response.data.user_kyc?.toString() || "0"));
            if (response.data.user_role) {
              setUserRole(response.data.user_role);
            }
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        } finally {
          // Add a small delay to ensure smooth transition
          setTimeout(() => {
            setIsLoading(false);
          }, 300);
        }
      }
    };

    fetchUserProfile();
  }, [open]);

  // Use the role from pricing if available, otherwise use the fetched role
  const displayRole = pricing.userRole || userRole;

  const handleSubmit = async () => {
    setIsProcessing(true);

    try {
      if (paymentMethod === "credits" && !hasEnoughCredits) {
        toast({
          title: "Insufficient Credits",
          description: "You don't have enough credits for this purchase.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Process payment based on selected method
      onBookingSuccess(paymentMethod);
      
      toast({
        title: "Payment Successful",
        description: paymentMethod === "credits" 
          ? `₱${totalAmount.toFixed(2)} has been deducted from your credits.`
          : `Your ${paymentMethod} payment was processed successfully.`,
      });
    } catch (error) {
      console.error("Payment processing error:", error);
      toast({
        title: "Payment Failed",
        description: "An error occurred while processing your payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  // Only disable payment if KYC is confirmed to be 0 or credits are insufficient when using credits
  const isPaymentDisabled = 
    (paymentMethod === "credits" && (kycStatus === 0 || !hasEnoughCredits) && !isLoading) ||
    isProcessing;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] max-h-[100vh] overflow-y-auto">
        <motion.div initial="hidden" animate="visible" exit="exit" variants={fadeIn}>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment
            </DialogTitle>
            <DialogDescription>Please select a payment method to complete your telco purchase.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Order Summary - Fixed height to prevent layout shifts */}
            <div className="mb-4 p-4 bg-muted rounded-md border border-border/50 shadow-sm min-h-[280px]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Order Summary</h3>
                <RoleBadge role={displayRole} isLoading={isLoading} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <span>Type:</span>
                  </div>
                  <span className="font-medium">
                    Telco Load
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span>Provider:</span>
                  </div>
                  <span className="font-medium">{bookingDetails?.telcoProvider || "Unknown"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span>Product:</span>
                  </div>
                  <span className="font-medium">{bookingDetails?.productName || bookingDetails?.product_code}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span>Phone Number:</span>
                  </div>
                  <span className="font-medium">+63 {bookingDetails?.phoneNumber}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span>Quantity:</span>
                  </div>
                  <span className="font-medium">{bookingDetails?.quantity}</span>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Base Price:</span>
                  {isLoading ? <Skeleton className="h-4 w-16" /> : <span>₱{pricing.basePrice.toFixed(2)}</span>}
                </div>

                <div className="flex justify-between items-center">
                  <span>Your Price:</span>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">₱{pricing.productPrice.toFixed(2)}</span>
                      {pricing.discountPercentage > 0 && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          {pricing.discountPercentage.toFixed(1)}% off
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span>Subtotal ({bookingDetails.quantity} items):</span>
                  {isLoading ? <Skeleton className="h-4 w-16" /> : <span>₱{serviceAmount.toFixed(2)}</span>}
                </div>

                <div className="flex justify-between items-center">
                  <span>Service Fee:</span>
                  <span>₱{serviceFee.toFixed(2)}</span>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total Amount:</span>
                {isLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <span className="text-primary">₱{totalAmount.toFixed(2)}</span>
                )}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-4 p-4 rounded-md border">
              <h3 className="font-semibold mb-3">Select Payment Method</h3>
              
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="credits" id="credits" />
                  <Label htmlFor="credits" className="flex items-center cursor-pointer">
                    <Wallet className="h-5 w-5 text-primary mr-2" />
                    <div>
                      <div className="font-medium">Credit Balance</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        {isLoading ? (
                          <Skeleton className="h-4 w-24" />
                        ) : (
                          <>
                            <span>Available: ₱{userCredit.toFixed(2)}</span>
                            {userCredit < totalAmount && (
                              <Badge variant="outline" className="bg-red-50 text-red-600 ml-1">Insufficient</Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* KYC Status Display - Only show when loaded and KYC is 0 */}
            {!isLoading && kycStatus === 0 && paymentMethod === "credits" && (
              <div className="mb-4 p-4 rounded-md border bg-red-50 min-h-[80px]">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">KYC Verification Required</span>
                </div>
                <p className="mt-2 text-sm text-red-600">
                  You need to complete KYC verification before you can use your credits for purchases.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose} disabled={isProcessing} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPaymentDisabled}
              className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isProcessing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Pay Now"
              )}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};