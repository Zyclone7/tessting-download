"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wifi, Package, Printer, CheckCircle, XCircle, Loader2 } from "lucide-react";
import SoldVoucherTable from "@/components/table/sold-voucher-table";
import { DialogTrigger } from "@radix-ui/react-dialog";

const SellWiFiVoucher = () => {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [stocks, setStocks] = useState(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("idle"); // idle, processing, success, failed
  
  // Updated product list with the new vouchers
  const products = [
    { id: "WiFi-10", name: "WiFi-10", price: 10, stock: 50 },
    { id: "WiFi-20", name: "WiFi-20", price: 20, stock: 50 },
  ];

  const handleSubmit = () => {
    // Show receipt first
    setShowReceipt(true);
  };

  const handleConfirmPurchase = () => {
    setShowReceipt(false);
    setShowConfirmation(true);
    setProcessingStatus("processing");
    
    // Mock processing - simulate a network request
    setTimeout(() => {
      // 80% chance of success
      const isSuccess = Math.random() < 0.8;
      setProcessingStatus(isSuccess ? "success" : "failed");
      
      // Log the transaction details
      const product = products.find(p => p.id === selectedProduct);
      console.log({ 
        selectedProduct, 
        price: product?.price, 
        quantity: stocks, 
        totalAmount: product ? product.price * stocks : 0,
        email, 
        phone,
        status: isSuccess ? "success" : "failed"
      });
    }, 2000);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setProcessingStatus("idle");
    
    // If successful, reset form
    if (processingStatus === "success") {
      setSelectedProduct("");
      setStocks(1);
      setEmail("");
      setPhone("");
    }
  };

  // Calculate total amount
  const calculateTotal = () => {
    const product = products.find(p => p.id === selectedProduct);
    return product ? product.price * stocks : 0;
  };

  // Generate a random transaction ID
  const transactionId = Math.random().toString(36).substring(2, 10).toUpperCase();

  return (
    <div className="min-h-screen w-full bg-background">
      <Separator />
      <p className="text-3xl font-bold mt-6">WiFi Services</p>
      
      <main className="container mx-auto py-6">
        <Tabs defaultValue="wifi" className="w-full">
          <TabsList className="grid w-full mx-auto grid-cols-1 mb-6">
            <TabsTrigger value="wifi" className="flex items-center justify-center gap-2">
              <Wifi className="w-4 h-4" />
              WiFi
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="wifi">
            <div>
              <div className="flex items-center justify-between">
                <CardHeader>
                  <CardTitle>Purchase WiFi Voucher</CardTitle>
                  <CardDescription>Select your desired WiFi voucher.</CardDescription>
                </CardHeader>
                <div className="pr-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Transaction History</Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-4xl">
                      <DialogTitle>Transaction History</DialogTitle>
                      <SoldVoucherTable />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="product">Select Product</Label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            SKU
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogTitle>Stock Keeping Unit</DialogTitle>
                          <div className="mt-4">
                            <p className="mb-2">You have these free products:</p>
                            <ul className="space-y-2">
                              {products.map((product) => (
                                <li key={product.id} className="p-2 bg-gray-100 rounded-md flex justify-between">
                                  <span>{product.name} voucher</span>
                                  <span className="font-medium">x {product.stock} pcs</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger id="product">
                        <SelectValue placeholder="Select a Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ₱{product.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stocks">Enter Number of Vouchers</Label>
                    <Input 
                      type="number" 
                      id="stocks" 
                      value={stocks} 
                      onChange={(e) => setStocks(Number(e.target.value))} 
                      min="1" 
                      max={selectedProduct ? products.find(p => p.id === selectedProduct)?.stock : 100}
                      placeholder="Enter quantity" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number" />
                  </div>

                  {selectedProduct && (
                    <div className="p-4 bg-gray-100 rounded-md">
                      <p className="font-medium">Order Summary</p>
                      <div className="flex justify-between mt-2">
                        <span>Price per voucher:</span>
                        <span>₱{products.find(p => p.id === selectedProduct)?.price}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Quantity:</span>
                        <span>{stocks}</span>
                      </div>
                      <div className="flex justify-between mt-1 font-bold">
                        <span>Total Amount:</span>
                        <span>₱{calculateTotal()}</span>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full mt-4" 
                    onClick={handleSubmit}
                    disabled={!selectedProduct || stocks < 1 || !email || !phone}
                  >
                    Purchase Vouchers
                  </Button>
                </div>
              </CardContent>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Purchase Receipt
          </DialogTitle>
          <div className="space-y-4">
            <div className="border-b pb-2">
              <p className="text-sm text-gray-500">Transaction ID: {transactionId}</p>
              <p className="text-sm text-gray-500">Date: {new Date().toLocaleString()}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Customer Details</h3>
              <p>Email: {email}</p>
              <p>Phone: {phone}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Order Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p>{products.find(p => p.id === selectedProduct)?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <p>{stocks}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unit Price</p>
                  <p>₱{products.find(p => p.id === selectedProduct)?.price}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-md">
              <div className="flex justify-between font-bold">
                <span>Total Amount:</span>
                <span>₱{calculateTotal()}</span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="font-medium">Proceed with this purchase?</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceipt(false)}>No, Cancel</Button>
            <Button onClick={handleConfirmPurchase}>Yes, Proceed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={(open) => {
        // Only allow closing the dialog if not in processing state
        if (processingStatus !== "processing") {
          setShowConfirmation(open);
        }
      }}>
        <DialogContent>
          {processingStatus === "processing" && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <DialogTitle>Processing Your Purchase</DialogTitle>
              <p className="text-center text-gray-500">Please wait while we process your transaction...</p>
            </div>
          )}
          
          {processingStatus === "success" && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <DialogTitle>Purchase Successful!</DialogTitle>
              <p className="text-center text-gray-500">Your WiFi vouchers have been purchased successfully. You will receive the details via email shortly.</p>
              <div className="bg-gray-100 p-4 rounded-md w-full">
                <p className="font-medium text-center">Transaction ID: {transactionId}</p>
              </div>
              <Button onClick={handleCloseConfirmation} className="mt-4">Close</Button>
            </div>
          )}
          
          {processingStatus === "failed" && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <XCircle className="w-12 h-12 text-red-500" />
              <DialogTitle>Purchase Failed</DialogTitle>
              <p className="text-center text-gray-500">We encountered an issue while processing your transaction. Please try again later.</p>
              <Button onClick={handleCloseConfirmation} variant="destructive" className="mt-4">Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellWiFiVoucher;