import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Package, Calendar, Tag, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { Receipt } from "./receipt";
import ProductImage1 from "@/public/images/mp.jpg";
import ProductImage2 from "@/public/images/dp.jpg";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
// Import user context
import { useUserContext } from "@/hooks/use-user";
import { LoadingOverlay } from "@/components/loading-overlay";

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

interface ProductDialogProps {
  product: Product;
  onClose: () => void;
  onBuy: (product: Product, quantity: number, paymentMethod: string) => Promise<void>;
  userCredit: number;
  userData?: any; // User data for payment
  userId?: string; // User ID for payment
}

export function ProductDialog({
  product,
  onClose,
  onBuy,
  userCredit,
  userData,
  userId,
}: ProductDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [transactionReferenceNumber, setTransactionReferenceNumber] = useState("");
  const [paymentStep, setPaymentStep] = useState<"details" | "payment" | "processing" | "receipt">("details");

  // Payment state variables
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentLinkId, setPaymentLinkId] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({
    inventory: false,
    license: false,
    notification: false,
    analytics: false
  });
  const [processingComplete, setProcessingComplete] = useState(false);

  // Access user from context
  const { user } = useUserContext();

  interface User {
    user_kyc?: number | string;
    kycStatus?: number | string;
    profile?: {
      user_kyc?: number | string;
    };
  }

  const isKycApproved = (user: User | undefined): boolean => {
    return user?.user_kyc?.toString() === '1' ||
      user?.kycStatus === '1' ||
      user?.profile?.user_kyc?.toString() === '1';
  };

  useEffect(() => {
    // Generate a transaction reference number when dialog opens
    setTransactionReferenceNumber(`ORDER-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`);
  }, []);

  // New useEffect to handle scrolling when payment modal appears
  useEffect(() => {
    if (showPaymentModal && paymentUrl) {
      // Scroll to top when payment modal is shown
      window.scrollTo(0, 0);

      // Focus the payment modal container
      const paymentContainer = document.getElementById('payment-modal-container');
      if (paymentContainer) {
        paymentContainer.focus();
      }
    }
  }, [showPaymentModal, paymentUrl]);

  // useEffect for payment status checking
  useEffect(() => {
    let isActive = true;
    let checkInterval: any | null = null;

    // Start checking payment status when paymentLinkId is available
    if (paymentLinkId && showPaymentModal) {
      const checkStatus = async () => {
        try {
          const retrievePayment = await retrieveLink(paymentLinkId);
          console.log("Retrieve Payment Status:", retrievePayment.data.attributes.status);

          if (!isActive) return;

          if (retrievePayment.data.attributes.status === "paid") {
            if (checkInterval) clearInterval(checkInterval);
            setShowPaymentModal(false);

            // Move to processing step before showing receipt
            setPaymentStep("processing");
            // Start post-payment processing
            processSuccessfulPayment();
          }
          else if (retrievePayment.data.attributes.status === "failed") {
            if (checkInterval) clearInterval(checkInterval);
            setShowPaymentModal(false);
            toast({
              title: "Error",
              description: "An error occurred during payment.",
              variant: "destructive",
            });
          }
        } catch (error) {
          if (checkInterval) clearInterval(checkInterval);
          setShowPaymentModal(false);
          console.error("Error retrieving payment status:", error);
          toast({
            title: "Error",
            description: "An error occurred. Please contact support.",
            variant: "destructive",
          });
        }
      };

      // Initial check
      checkStatus();

      // Set up interval for periodic checks
      checkInterval = setInterval(checkStatus, 5000);

      // Cleanup function
      return () => {
        isActive = false;
        if (checkInterval) clearInterval(checkInterval);
      };
    }
  }, [paymentLinkId, showPaymentModal]);

  const totalPrice = product.price * quantity;
  const isInsufficientCredit = paymentMethod === "credits" && totalPrice > userCredit;

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
    setPaymentStep("details");
    setPaymentUrl(null);
    setShowPaymentModal(false);
  };

  const resetProcessingStatus = () => {
    setProcessingStatus({
      inventory: false,
      license: false,
      notification: false,
      analytics: false
    });
  };

  const createPaymentLink = async () => {
    setIsProcessing(true);

    try {
      const selectedProduct = {
        name: product.name,
        price: product.price,
        label: product.label
      };

      const paymentUserData = userData || {
        first_name: "Customer",
        last_name: "Name",
        user_email: "customer@example.com",
        user_role: product.name
      };

      const response = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId || "default-user-id",
          amount: Math.round(selectedProduct.price * quantity * 100),
          description: selectedProduct.label,
          name: `${paymentUserData.first_name} ${paymentUserData.last_name}`,
          email: paymentUserData.user_email,
          userData: {
            ...paymentUserData,
            quantity: quantity,
            orderId: transactionReferenceNumber
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment link");
      }

      setPaymentUrl(data.checkoutUrl);
      setPaymentLinkId(data.id.data.id);
      setPaymentStep("payment");
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Error creating payment link:", error);
      toast({
        title: "Error",
        description: "Failed to create payment link. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuy = async () => {
    setIsProcessing(true);

    // Generate a unique transaction ID if we don't have one yet
    if (!transactionReferenceNumber) {
      setTransactionReferenceNumber(`ORDER-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`);
    }

    try {
      if (paymentMethod === "credits") {
        // Process credits payment directly
        await onBuy(product, quantity, "credits");
        setReferenceNumber(transactionReferenceNumber);
        setShowReceipt(true);
      } else if (paymentMethod === "paymongo") {
        // Use the payment link creation flow
        await createPaymentLink();
      } else {
        // Handle other payment methods (bank, gcash)
        await onBuy(product, quantity, paymentMethod);
        const mockReferenceNumber = transactionReferenceNumber || `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        setReferenceNumber(mockReferenceNumber);
        setShowReceipt(true);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing your payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  async function retrieveLink(id: string) {
    try {
      if (!id) throw new Error("Payment link ID is required");

      const response = await fetch(`/api/retrieve-payment-link?id=${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      // Attempt to parse response JSON safely
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Invalid JSON response:", jsonError);
        throw new Error("Received an invalid response from the server.");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to retrieve payment link");
      }

      return data;
    } catch (error) {
      console.error("Error fetching payment link:", error);
      throw error;
    }
  }

  const processSuccessfulPayment = async () => {
    try {
      // Step 1: Update inventory
      await updateInventory();

      // Step 2: Generate license or access credentials
      await generateLicense();

      // Step 3: Send notifications
      await sendNotifications();

      // Step 4: Record analytics
      await recordAnalytics();

      // Step 5: Call the onBuy handler from props
      await onBuy(product, quantity, "paymongo");

      // Set reference number and complete processing
      setReferenceNumber(transactionReferenceNumber);
      setProcessingComplete(true);

      // Short delay before showing receipt
      setTimeout(() => {
        setPaymentStep("receipt");
        setShowReceipt(true);
      }, 1000);

      toast({
        title: "Success",
        description: "Your purchase was successful!",
      });
    } catch (error) {
      console.error("Error in post-payment processing:", error);
      toast({
        title: "Processing Error",
        description: "There was an issue with order processing. Please contact support with reference: " + transactionReferenceNumber,
        variant: "destructive",
      });
    }
  };

  // Simulated processing functions with delays to show progress
  const updateInventory = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setProcessingStatus(prev => ({ ...prev, inventory: true }));
        resolve();
      }, 700);
    });
  };

  const generateLicense = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setProcessingStatus(prev => ({ ...prev, license: true }));
        resolve();
      }, 800);
    });
  };

  const sendNotifications = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setProcessingStatus(prev => ({ ...prev, notification: true }));
        resolve();
      }, 600);
    });
  };

  const recordAnalytics = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setProcessingStatus(prev => ({ ...prev, analytics: true }));
        resolve();
      }, 500);
    });
  };

  const backToDetails = () => {
    setPaymentStep("details");
    setPaymentUrl(null);
    setShowPaymentModal(false);
  };

  if (showReceipt) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] w-full overflow-y-auto">
          <Receipt
            referenceNumber={referenceNumber}
            product={{
              name: product.label,
              price: product.price,
              image: product.image,
            }}
            quantity={quantity}
            totalAmount={totalPrice}
            paymentMethod={paymentMethod}
            purchaseDate={new Date()}
            onClose={onClose}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (paymentStep === "processing") {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Processing Your Order
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${processingStatus.inventory ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {processingStatus.inventory ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-3 h-3 rounded-full bg-gray-400 animate-pulse"></div>}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Updating inventory</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${processingStatus.license ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {processingStatus.license ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-3 h-3 rounded-full bg-gray-400 animate-pulse"></div>}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Generating access credentials</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${processingStatus.notification ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {processingStatus.notification ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-3 h-3 rounded-full bg-gray-400 animate-pulse"></div>}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Sending confirmation</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${processingStatus.analytics ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {processingStatus.analytics ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-3 h-3 rounded-full bg-gray-400 animate-pulse"></div>}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Recording purchase</p>
                </div>
              </div>
            </div>

            {processingComplete && (
              <div className="flex justify-center mt-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </motion.div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Check if we should show payment modal in a separate dialog
  if (showPaymentModal && paymentUrl) {
    return (
      <Dialog open={true} onOpenChange={() => backToDetails()}>
        <DialogContent className="sm:max-w-[800px] p-0 max-h-[90vh] h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="p-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg">Complete Your Payment</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={backToDetails}
              aria-label="Close payment window"
            >
              ✕
            </Button>
          </DialogHeader>

          <div
            id="payment-modal-container"
            className="flex-1 w-full relative"
            tabIndex={-1}
          >
            <iframe
              src={paymentUrl}
              className="w-full h-full border-0"
              title="Payment Gateway"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Processing your order..." submessage="Please DO NOT close or refresh this page. This process may take a few moments to complete." forPurpose="order" />}
      <Dialog open={true} onOpenChange={(isOpen) => !isProcessing && !isOpen && onClose()}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {product.label}
            </DialogTitle>
            <Badge variant="secondary" className="w-fit">
              {product.category}
            </Badge>
          </DialogHeader>
          <div className="gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-lg object-cover">
                  <img
                    src={product.image || ProductImage1.src}
                    alt={product.label}
                    className="transition-all duration-300 hover:scale-105"
                  />
                </div>
              </div>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    {product.package_type}
                  </h3>
                  <div className="text-3xl font-bold mb-4">
                    ₱
                    {product.price.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6 mt-4">
              <div>
                <div className="flex flex-wrap gap-6 mt-4">
                  {/* Product Details Section */}
                  <div className="flex-1">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Product Details</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {product.short_description}
                      </p>
                      <div className="flex items-center gap-2 mt-4">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          ₱
                          {product.price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          Created: {new Date().toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mt-4">Earnings</h3>
                      <p className="text-sm mt-2">{product.earn_description}</p>
                      {product.refer_earn && (
                        <p className="text-sm font-medium mt-2 text-green-600">
                          REFER & EARN PROGRAM available
                        </p>
                      )}
                    </CardContent>
                  </div>
                  {/* Payment and Quantity Section */}
                  <div className="flex-1 pt-10 space-y-6">
                    {/* Credit Balance Display */}
                    {paymentMethod === "credits" && (
                      <div>
                        <CardContent className="p-4 flex items-center justify-between bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary" />
                            <span className="font-medium text-primary">
                              Available Credit
                            </span>
                          </div>
                          <span className="font-semibold text-lg text-primary">
                            ₱{userCredit.toFixed(2)}
                          </span>
                        </CardContent>
                      </div>
                    )}
                    <Separator className="my-4" />
                    {/* Payment Method */}
                    <div className="flex flex-col gap-4 w-full">
                      <Label
                        htmlFor="paymentMethod"
                        className="text-muted-foreground justify-start"
                      >
                        Payment Method
                      </Label>
                      <div className="w-full">
                        <Select
                          value={paymentMethod}
                          onValueChange={handlePaymentMethodChange}
                          aria-label="Select payment method"
                        >
                          <SelectTrigger id="paymentMethod" className="w-full">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Conditionally render "Credits" only if user_kyc is approved */}
                            {(user?.user_kyc?.toString() === '1' || user?.status?.toString() === '1') && (
                              <SelectItem value="credits">Credits</SelectItem>
                            )}
                            <SelectItem value="paymongo">Online Payment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Quantity Input */}
                    <div className="flex flex-col gap-4">
                      <Label htmlFor="quantity" className="text-muted-foreground">
                        Quantity
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(1, parseInt(e.target.value)))
                        }
                        className="w-full"
                        min="1"
                        aria-label="Select quantity"
                      />
                    </div>
                    {/* Error Message for Insufficient Credit */}
                    {isInsufficientCredit && (
                      <p className="text-sm text-destructive text-center">
                        Insufficient credit balance.
                      </p>
                    )}
                    <Separator className="my-2" />
                    {/* Total Price */}
                    <div className="flex justify-between items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        {product.package_type}
                      </div>
                      <div>
                        <Label htmlFor="total" className="text-muted-foreground">
                          Total
                        </Label>
                        <div className="font-semibold text-lg text-primary">
                          ₱
                          {totalPrice.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBuy}
                  disabled={
                    isProcessing || !paymentMethod || isInsufficientCredit
                  }
                  className="w-full sm:w-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Avail Now"
                  )}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}