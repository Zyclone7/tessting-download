"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import React, { useState } from "react";
import {
  CardContent,
  CardDescription,
  CardFooter,
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
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wifi,
  Tv,
  Satellite,
  Phone,
  CreditCard,
  PhilippinePeso,
  Loader,
} from "lucide-react";
import { assignVouchers } from "@/actions/gsat-voucher";
import { useUserContext } from "@/hooks/use-user";
import SoldVoucherTable from "@/components/table/sold-voucher-table";
import { DialogTrigger } from "@radix-ui/react-dialog";
import SellWiFiVoucher from "./SellWifiVoucher";


const FreeProduct = () => {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [stocks, setStocks] = useState(1);
  const [, setCurrentVoucher] = useState("GSAT Voucher");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUserContext();
  //   const { user, token } = useUserContext();


  const products = ["G99","G200", "G300", "G500"];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!selectedProduct || !email || stocks <= 0) {
      toast({
        title: "Error",
        description:
          "Please fill out all fields and ensure stocks are greater than 0!",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("user_id", user!.id.toString()); // Replace with actual user ID when available
      formData.append("product_code", selectedProduct);
      formData.append("email", email);
      formData.append("stocks", stocks.toString());

      const result = await assignVouchers(formData);

      if (result.success) {
        toast({
          title: "Success",
          description: "Voucher successfully assigned!",
        });
      } else {
        toast({
          title: "Error",
          description:
            result.message || "Failed to assign voucher. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error buying voucher:", error);
      toast({
        title: "Error",
        description: "An error occurred while assigning the voucher.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <Separator className="" />
      <p className="text-3xl font-bold mt-6">Free Products</p>
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
     <h1 className="text-4xl font-bold text-gray-800">🚧 Under Development 🚧</h1>
      <p className="text-lg text-gray-600 mt-4">We're working hard to bring this page to life. Stay tuned!</p>
      
        
    </div>
      <main className="container mx-auto py-6">
    
      </main>
    </div>
  );
};

export default FreeProduct;