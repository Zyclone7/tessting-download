import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Printer } from 'lucide-react';
import ProductImage from "@/public/images/product.jpg";

interface ReceiptProps {
  referenceNumber: string;
  product: {
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
  totalAmount: number;
  paymentMethod: string;
  purchaseDate: Date;
  onClose: () => void;
}

export function Receipt({
  referenceNumber,
  product,
  quantity,
  totalAmount,
  paymentMethod,
  purchaseDate,
  onClose
}: ReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Purchase Receipt</CardTitle>
        <div className="flex items-center justify-center space-x-2 mt-2">
          <Check className="w-6 h-6 text-green-500" />
          <span className="text-green-500 font-semibold">Purchase Successful</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-md">
          <p className="text-sm font-medium text-center">Reference Number</p>
          <p className="text-lg font-bold text-center">{referenceNumber}</p>
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-lg w-full mx-auto mb-4 object-cover">
            <img
              src={product.image || ProductImage.src}
              alt={product.name}

            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Product:</span>
              <span>{product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Price:</span>
              <span>₱{product.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Quantity:</span>
              <span>{quantity}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span>₱{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Payment Method:</span>
            <span>{paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Purchase Date:</span>
            <span>{purchaseDate.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex justify-between space-x-4 mt-6">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
          <Button onClick={handlePrint} className="w-full">
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

