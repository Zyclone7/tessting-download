"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Phone, Satellite, Tv, Wifi } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUserContext } from "@/hooks/use-user";
import axios from "axios";
import { getUserProfile } from "@/actions/user";
import { ProductDialog } from "./product-dialog";
import Image from "next/image";
import ProductImage1 from "@/public/images/mp.jpg";
import ProductImage2 from "@/public/images/dp.jpg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchProducts } from "@/actions/package-products";

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

const categories = ["All", "ATM", "NETTV", "WiFi", "Travel"];

function ProductCard({
  product,
  loading,
  onBuy,
}: {
  product?: Product;
  loading?: boolean;
  onBuy?: () => void;
}) {
  if (loading) {
    return (
      <Card className="animate-pulse" suppressHydrationWarning>
        <div className="aspect-[380/420] bg-muted"></div>
        <CardHeader>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="h-4 bg-muted rounded w-full mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </CardContent>
        <CardFooter>
          <div className="h-9 bg-muted rounded w-full"></div>
        </CardFooter>
      </Card>
    );
  }

  if (!product) return null;

  return (
    <Card className="flex flex-col h-full">
      <div className="relative overflow-hidden object-cover">
        <img
          src={product.image || ProductImage1.src}
          alt={product.label}
          className="transition-all duration-300 hover:scale-105"
        />
      </div>
      <CardHeader>
        <CardTitle>{product.label}</CardTitle>
        <p className="text-sm text-muted-foreground">{product.category}</p>
        <p className="text-lg font-semibold mt-2">
          ₱
          {product.price.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm mb-4">{product.short_description}</p>
        <ul className="list-disc list-inside text-sm space-y-1">
          {product.features.slice(0, 3).map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
        {product.features.length > 3 && (
          <p className="text-sm text-muted-foreground mt-2">
            + {product.features.length - 3} more features
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onBuy}>
          Avail Now
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { toast } = useToast();
  const [userCredit, setUserCredit] = useState(0);
  const { user } = useUserContext();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts(); // Call the server action to fetch the products
        const mappedData = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          label: item.label,
          short_description: item.short_description,
          payment_type: item.payment_type,
          price: item.price,
          status: item.status,
          the_order: item.the_order,
          created_at: item.created_at,
          category: item.category,
          image: item.image,
          package_type: item.package_type,
          features: item.pt_package_features.map(
            (feature: any) => feature.feature
          ),
          earn_description: item.earn_description,
          refer_earn: item.refer_earn,
        }));
        setProducts(mappedData);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch products. Please try again later.",
          variant: "destructive",
        });
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsData();
  }, [toast]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      if (user && user.id) {
        try {
          // Directly call the Server Action
          const response = await getUserProfile(user.id.toString());

          if (response.success) {
            setUserCredit(response.data?.user_credits || 0);
          } else {
            setError(response.message || "Failed to fetch user credit.");
            toast({
              title: "Error",
              description: response.message || "Failed to fetch user credit.",
              variant: "destructive",
            });
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
          setError("An unexpected error occurred. Please try again later.");
          toast({
            title: "Error",
            description: "Failed to fetch user credit. Please try again later.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user, toast]);

  const filteredProducts = products.filter(
    (product) =>
      product.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "All" || product.category === selectedCategory)
  );

// Create maps to track pending requests and processed responses
const pendingRequests = new Map();
const processedResponses = new Map();

// Function to check if a request is pending
const isPendingRequest = (productId: string | number) => {
  const pendingStatus = pendingRequests.get(productId);
  if (!pendingStatus) return false;
  
  // If request has been pending for more than 30 seconds, consider it stale
  const now = Date.now();
  if (now - pendingStatus.timestamp > 30000) {
    pendingRequests.delete(productId);
    return false;
  }
  
  return true;
};

// Function to set pending request status
const setPendingRequest = (productId: string | number, isPending: boolean) => {
  if (isPending) {
    pendingRequests.set(productId, {
      timestamp: Date.now(),
      status: true
    });
  } else {
    pendingRequests.delete(productId);
  }
};

// Function to clean up old processed responses (prevent memory leaks)
const cleanupOldProcessedResponses = () => {
  const now = Date.now();
  processedResponses.forEach((value, key) => {
    // Remove entries older than 5 minutes
    if (now - value.timestamp > 300000) {
      processedResponses.delete(key);
    }
  });
};

// Global request tracker to detect duplicate API calls across the application
const apiRequestTracker = {
  activeRequests: new Map<string, number>(),
  
  // Track a new request for a specific endpoint
  trackRequest(endpoint: string, requestId: string): boolean {
    const key = `${endpoint}-${requestId}`;
    const currentCount = this.activeRequests.get(endpoint) || 0;
    
    // If there's already a request to this endpoint with the same ID, block it
    if (this.activeRequests.has(key)) {
      console.warn(`Duplicate request detected: ${key}`);
      return false;
    }
    
    // If there are multiple requests to the same endpoint (regardless of ID), block it
    if (endpoint === "/api/invitation-code/create" && currentCount > 0) {
      console.warn(`Multiple concurrent requests to ${endpoint} detected`);
      return false;
    }
    
    // Track this request
    this.activeRequests.set(key, Date.now());
    this.activeRequests.set(endpoint, (currentCount || 0) + 1);
    return true;
  },
  
  // Clear a request when it completes
  clearRequest(endpoint: string, requestId: string): void {
    const key = `${endpoint}-${requestId}`;
    this.activeRequests.delete(key);
    
    const currentCount = this.activeRequests.get(endpoint) || 0;
    if (currentCount > 0) {
      this.activeRequests.set(endpoint, currentCount - 1);
    } else {
      this.activeRequests.delete(endpoint);
    }
  }
};

const handleBuy = async (
  product: Product,
  quantity: number,
  paymentMethod: string
) => {
  // Input validation
  if (!user?.id) {
    toast({
      title: "Authentication Error",
      description: "User ID is missing. Please log in again.",
      variant: "destructive",
    });
    return;
  }

  if (!product?.name || !product?.price || !quantity || quantity <= 0) {
    toast({
      title: "Invalid Data",
      description: "Product information or quantity is invalid.",
      variant: "destructive",
    });
    return;
  }

  // Generate a unique idempotency key that identifies this specific purchase request
  const idempotencyKey = `${user.id}-${product.id}-${quantity}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const requestId = `${product.id}-${Date.now()}`;
  const endpoint = "/api/invitation-code/create";
  
  try {
    // Check if there's already a pending request for this product
    if (isPendingRequest(product.id)) {
      toast({
        title: "Request already in progress",
        description: "Please wait for the current request to complete.",
      });
      return;
    }
    
    // Check for duplicate API calls using the global tracker
    if (!apiRequestTracker.trackRequest(endpoint, requestId)) {
      toast({
        title: "Duplicate request detected",
        description: "Another request to create invitation codes is already in progress.",
      });
      return;
    }
    
    // Set this request as pending BEFORE making the API call
    setPendingRequest(product.id, true);
    
    // Add a small delay to ensure UI updates and prevent accidental double-clicks
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Log request details (helpful for debugging)
    console.log("Making purchase request:", {
      endpoint,
      product: product.id,
      userId: user.id,
      paymentMethod,
      quantity,
      requestId,
      idempotencyKey
    });
    
    const response = await axios.post(endpoint, {
      packages: [
        {
          packageName: product.name,
          amount: product.price,
          quantity: quantity,
        },
      ],
      user_id: user.id,
      paymentMethod,
      idempotencyKey, // Use the proper idempotency key matching the backend API
      requestId, // Keep the request ID for client-side tracking
    }, {
      timeout: 15000, // 15 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    // Get a response ID (could be from the response or generate one based on the request)
    const responseId = response.data.responseId || `response-${requestId}`;
    
    // Check if we've already processed this response
    if (processedResponses.has(responseId)) {
      console.log(`Ignoring duplicate response for request ${requestId}`);
      // Clear pending status for duplicate responses
      setPendingRequest(product.id, false);
      // Clear the request from the tracker
      apiRequestTracker.clearRequest(endpoint, requestId);
      return;
    }
    
    // Mark this response as processed
    processedResponses.set(responseId, {
      timestamp: Date.now(),
      processed: true
    });
    
    // Clean up old processed responses (optional, to prevent memory leaks)
    cleanupOldProcessedResponses();
    const data = response.data;
    
    // Clear pending status
    setPendingRequest(product.id, false);
    // Clear the request from the tracker
    apiRequestTracker.clearRequest(endpoint, requestId);
    
    if (data.success) {
      // Use the quantity parameter instead of data.data.length to avoid counting duplicates
      toast({
        title: "Purchase successful",
        description: `${quantity} invitation code(s) created successfully. Payment method: ${paymentMethod}`,
      });
      // Update user credit after successful purchase
      setUserCredit(data.updatedCredit);
    } else {
      throw new Error(data.message || "An error occurred during purchase.");
    }
  } catch (error: any) {
    // Clear pending status in case of error
    setPendingRequest(product.id, false);
    // Clear the request from the tracker
    apiRequestTracker.clearRequest(endpoint, requestId);
    
    // Enhanced error logging
    console.error("Error during purchase:", error);
    console.error("Request details:", {
      endpoint,
      product: product.id,
      userId: user?.id,
      paymentMethod,
      idempotencyKey,
      requestId
    });
    
    // More detailed error message to help debug issues
    let errorMessage = "An unexpected error occurred.";
    if (error.response) {
      // The server responded with an error status code
      errorMessage = error.response.data?.message || 
                    `Server error (${error.response.status}): ${error.response.statusText}`;
      console.error("Server response:", error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = "No response received from server. Please check your connection.";
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = `Error setting up request: ${error.message}`;
    }
    
    toast({
      title: "Purchase failed",
      description: errorMessage,
      variant: "destructive",
    });
  }
};

  return (
    <div className="container mx-auto px-4 py-8">
      <main className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Our Products</h1>

          <div className="flex items-center space-x-4">
            <Card>
              <CardContent className="p-4">
                {userCredit === 0 ? (
                  <div
                    className="h-6 bg-muted rounded w-32 animate-pulse"
                    aria-hidden="true"
                  ></div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-medium" aria-live="polite">
                      ₱
                      {userCredit.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex flex-row md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm font-medium mb-2 block">
              Search Products
            </Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full mx-auto grid-cols-6 mb-6">
            <TabsTrigger
              value="all"
              className="flex items-center justify-center gap-2"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="negosyo_package"
              className="flex items-center justify-center gap-2"
            >
              Negosyo Package
            </TabsTrigger>
            <TabsTrigger
              value="wifi"
              className="flex items-center justify-center gap-2"
            >
              BPOS
            </TabsTrigger>
            <TabsTrigger
              value="tv"
              className="flex items-center justify-center gap-2"
            >
              CPOS
            </TabsTrigger>
            <TabsTrigger
              value="telco"
              className="flex items-center justify-center gap-2"
            >
              Fili TV
            </TabsTrigger>
            <TabsTrigger
              value="bills"
              className="flex items-center justify-center gap-2"
            >
              Other
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            {/* Display ALL PRODUCTS */}
            {/* <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
              
                  </div>
                </div> */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading
                ? [...Array(8)].map((_, index) => (
                    <ProductCard key={index} loading={true} />
                  ))
                : filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onBuy={() => setSelectedProduct(product)}
                    />
                  ))}
            </div>
            {filteredProducts.length === 0 && !loading && (
              <p className="text-center text-muted-foreground mt-8">
                No products found.
              </p>
            )}
            {selectedProduct && (
              <ProductDialog
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onBuy={handleBuy}
                userCredit={userCredit}
              />
            )}
          </TabsContent>
          <TabsContent value="negosyo_package">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading
                ? [...Array(8)].map((_, index) => (
                    <ProductCard key={index} loading={true} />
                  ))
                : filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onBuy={() => setSelectedProduct(product)}
                    />
                  ))}
            </div>
          </TabsContent>
          <TabsContent value="wifi">{/* Content for BPOS */}</TabsContent>
          <TabsContent value="tv">{/* Content for CPOS */}</TabsContent>
          <TabsContent value="telco">{/* Content for Fili TV */}</TabsContent>
          <TabsContent value="bills">{/* Content for Other */}</TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
