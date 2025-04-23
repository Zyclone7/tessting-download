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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar as CalendarIcon, Tag, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { Receipt } from "./store/receipt";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import ProductImage from "@/public/images/product.jpg";

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

interface ActivationDialogProps {
  product: Product | null;
  onClose: () => void;
  onBuy: (product: Product, quantity: number, paymentMethod: string) => Promise<void>;
  userCredit: number;
  isOpen: boolean;
  isLoading: boolean;
  userData?: any; // User data for payment
  userId?: string; // User ID for payment
}

export function ActivationDialog({
  product,
  onClose,
  onBuy,
  userCredit,
  isOpen,
  isLoading,
  userData,
  userId,
}: ActivationDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [showReceipt, setShowReceipt] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [transactionReferenceNumber, setTransactionReferenceNumber] = useState("");
  const [paymentStep, setPaymentStep] = useState<"details" | "payment" | "processing" | "receipt">("details");
  
  // Payment state variables from your original code
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentLinkId, setPaymentLinkId] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({
    inventory: false,
    license: false,
    notification: false,
    analytics: false
  });
  const [processingComplete, setProcessingComplete] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setTransactionReferenceNumber(`ORDER-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`);
      setPaymentStep("details");
      setPaymentUrl(null);
      setShowPaymentModal(false);
      setProcessingComplete(false);
      resetProcessingStatus();
    }
  }, [isOpen]);

  const resetProcessingStatus = () => {
    setProcessingStatus({
      inventory: false,
      license: false,
      notification: false,
      analytics: false
    });
  };

  const createPaymentLink = async () => {
    if (!product) return;
    
    try {
      // Use your existing createPaymentLink function logic
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

      return { paymentUrl: data.checkoutUrl, paymentLinkId: data.id.data.id };
    } catch (error) {
      console.error("Error creating payment link:", error);
      toast({
        title: "Error",
        description: "Failed to create payment link. Please try again later.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const checkPaymentStatus = async (paymentID: string) => {
    try {
      const pollPaymentStatus = async () => {
        try {
          const retrievePayment = await retrieveLink(paymentID);
          console.log("Retrieve Payment Status:", retrievePayment.data.attributes.status);
          
          if (retrievePayment.data.attributes.status === "paid") {
            setShowPaymentModal(false);
            
            // Move to processing step before showing receipt
            setPaymentStep("processing");
            // Start post-payment processing
            processSuccessfulPayment();
          } 
          else if(retrievePayment.data.attributes.status === "failed") {
            setShowPaymentModal(false);
            console.log(retrievePayment.data.attributes.status);
            toast({
              title: "Error",
              description: "An error occurred during payment.",
              variant: "destructive",
            });
          }
          else {
            // Keep polling if payment is still pending
            setTimeout(() => pollPaymentStatus(), 5000);
          }
        } catch (error) {
          setShowPaymentModal(false);
          console.error("Error retrieving payment status:", error);
          toast({
            title: "Error",
            description: "An error occurred. Please contact support.",
            variant: "destructive",
          });
        }
      };
      
      pollPaymentStatus();
    } catch (error) {
      console.error("Error checking payment status:", error);
      setShowPaymentModal(false);
    }
  };

  const processSuccessfulPayment = async () => {
    if (!product) return;
    
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

      console.log("Retrieve Link Response:", data);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to retrieve payment link");
      }

      return data;
    } catch (error) {
      console.error("Error fetching payment link:", error);
      throw error;
    }
  }

  const backToProductDetails = () => {
    setPaymentStep("details");
    setPaymentUrl(null);
    setShowPaymentModal(false);
  };

  const totalPrice = product ? product.price * quantity : 0;

  if (!product) {
    return null;
  }

  if (paymentStep === "receipt") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
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
            paymentMethod="paymongo"
            purchaseDate={new Date()}
            onClose={onClose}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (paymentStep === "processing") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {product.label}
          </DialogTitle>
          <Badge variant="secondary" className="w-fit">
            {product.category}
          </Badge>
        </DialogHeader>

        {paymentStep === "details" && (
          <div className="gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-lg">
                  <Image
                    src={ProductImage}
                    alt={product.label}
                    objectFit="cover"
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
                        <span className="text-sm">
                          Created: {new Date(product.created_at * 1000).toLocaleDateString()}
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

                  <div className="flex-1 pt-10 space-y-6">
                    <Separator className="my-4" />

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
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createPaymentLink}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
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
            </div>
          </div>
        )}

        {/* PayMongo Integration - Animated Payment Modal */}
        <AnimatePresence>
          {showPaymentModal && paymentUrl && (
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="w-full max-w-4xl h-[90vh] mx-4"
              >
                <Card className="w-full h-full flex flex-col overflow-hidden shadow-lg">
                  <CardHeader className="p-4 space-y-0 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Complete Your Payment</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={backToProductDetails}
                      aria-label="Close payment window"
                    >
                      ✕
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 w-full h-full relative">
                    {paymentUrl ? (
                      <div className="w-full h-full relative overflow-hidden rounded-b-lg">
                        <iframe
                          src={paymentUrl}
                          className="w-full h-full border-0"
                          title="Payment Gateway"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          onLoad={() => paymentLinkId && checkPaymentStatus(paymentLinkId)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-8 h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}