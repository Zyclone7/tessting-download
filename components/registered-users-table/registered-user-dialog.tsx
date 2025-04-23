'use client'

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getRegisteredUserInfo } from '@/actions/user';
import { Label } from "@/components/ui/label"
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

import { 
  Card, 
  CardContent, 
} from "@/components/ui/card"

import { 
  Tabs, 
  TabsContent, 
} from "@/components/ui/tabs"

interface FormData {
  user_nicename: string;
  user_email: string;
  user_contact_number: string;
  merchant_id: string;
  business_name: string;
  business_address: string;
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
  user_registered: Date;
  user_role: string;
}

const RegisteredUserDialog = ({ userId }: { userId: number }) => {
  const { formState: { errors }, reset } = useForm<FormData>();
  const [userData, setUserData] = useState<FormData>({
    user_nicename: '',
    user_email: '',
    user_contact_number: '',
    merchant_id: '',
    business_name: '',
    business_address: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
    user_registered: new Date(),
    user_role:''
  })
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUserData() {
      if (userId) {
        try {
          const userData: any = await getRegisteredUserInfo(userId);
          setUserData(userData)
          if (!userData) throw new Error("No user data returned");
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({
            title: "Error",
            description: "Failed to load user data. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsDataLoading(false);
        }
      } else {
        console.error("No userId provided");
        setIsDataLoading(false);
      }
    }

    fetchUserData();

  }, [userId, reset, toast]);

  if (isDataLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full ml-4 max-w-[45rem]">
      <CardContent>
        <Tabs defaultValue="personal" className="w-full">
          <form>
            <TabsContent value="personal">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6 mt-6"
              >
                <div className="grid grid-cols-1 gap-4">
                  {/* Name */}
                  <div className="flex flex-col">
                    <Label htmlFor="user_nicename" className="text-sm font-medium text-gray-700">
                      Name
                    </Label>
                    <input 
                      value={userData.user_nicename}
                      disabled
                      className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Business Name */}
                  <div className="flex flex-col">
                    <Label htmlFor="business_name" className="text-sm font-medium text-gray-700">
                      Business Name
                    </Label>
                    <input 
                      value={userData.business_name}
                      disabled
                      className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Business Address */}
                  <div className="flex flex-col">
                    <Label htmlFor="business_address" className="text-sm font-medium text-gray-700">
                      Business Address
                    </Label>
                    <input 
                      value={userData.business_address}
                      disabled
                      className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col">
                    <Label htmlFor="user_email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <input 
                      value={userData.user_email}
                      disabled
                      className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Contact Number */}
                  <div className="flex flex-col">
                    <Label htmlFor="user_contact_number" className="text-sm font-medium text-gray-700">
                      Contact Number
                    </Label>
                    <input 
                      value={userData.user_contact_number}
                      disabled
                      className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Selected Package */}
                  <div className="flex flex-col">
                    <Label htmlFor="user_role" className="text-sm font-medium text-gray-700">
                      Selected Package
                    </Label>
                    <input 
                      value={(userData.user_role as string).replace(/_/g, " ")}
                      disabled
                      className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Date Registered */}
                  <div className="flex flex-col">
                    <Label htmlFor="user_registered" className="text-sm font-medium text-gray-700">
                      Date Registered
                    </Label>
                    <input 
                      value={userData.user_registered.toISOString().split('T')[0]}
                      disabled
                      className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </motion.div>
            </TabsContent>      
          </form>
        </Tabs>
      </CardContent>
    </div>
  );
}

export default RegisteredUserDialog;