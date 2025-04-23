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
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Card className="w-full ml-4 max-w-[45rem]">
      <CardContent>
        <Tabs defaultValue="personal" className="w-full">
          <form>
            <TabsContent value="personal">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 mt-4"
              >
                <div>
                    <div className='flex justify-between items-center p-1'>
                      <div style={{ width: '175px' }}><Label htmlFor="user_nicename">Name:</Label></div>
                        <div style={{ width: '621px' }}>
                        <input 
                        value={userData.user_nicename}
                        disabled
                        className="w-full bg-gray-200 pl-2 rounded-sm"
                        />
                        </div>  
                      {errors.user_nicename && <p className="text-red-500 text-sm mt-1">{errors.user_nicename.message}</p>}
                    </div>

                    <div className='flex justify-between items-center p-1'>
                      <div style={{ width: '175px' }}><Label htmlFor="business_name">Business Name:</Label></div>
                      <div style={{ width: '621px' }}>
                      <input 
                      value={userData.business_name}
                      disabled
                      className="w-full bg-gray-200 pl-2 rounded-sm"
                      />
                      </div>  
                      {errors.business_name && <p className="text-red-500 text-sm mt-1">{errors.business_name.message}</p>}
                    </div> 

                    <div className='flex justify-between items-center p-1'>
                      <div style={{ width: '175px' }}><Label htmlFor="business_address">Business Address:</Label></div>
                      <div style={{ width: '621px' }}>
                        <input 
                          value={userData.business_address}
                          disabled
                          className="w-full bg-gray-200 pl-2 rounded-sm"
                        />
                      </div>  
                      {errors.business_address && <p className="text-red-500 text-sm mt-1">{errors.business_address.message}</p>}
                    </div>

                    <div className='flex justify-between items-center p-1'>
                      <div style={{ width: '175px' }}><Label htmlFor="user_email">Email:</Label></div>
                      <div style={{ width: '621px' }}>
                        <input 
                          value={userData.user_email}
                          disabled
                          className="w-full bg-gray-200 pl-2 rounded-sm"
                        />
                      </div>  
                      {errors.user_email && <p className="text-red-500 text-sm mt-1">{errors.user_email.message}</p>}
                    </div>


                    <div className='flex justify-between items-center p-1'>
                      <div style={{ width: '175px' }}><Label htmlFor="user_nicename">Contact Number:</Label></div>
                      <div style={{ width: '621px' }}>
                        <input 
                          value={userData.user_contact_number}
                          disabled
                          className="w-full bg-gray-200 pl-2 rounded-sm"
                        />
                      </div>  
                      {errors.user_contact_number && <p className="text-red-500 text-sm mt-1">{errors.user_contact_number.message}</p>}
                    </div>

                    <div className='flex justify-between items-center p-1'>
                      <div style={{ width: '175px' }}><Label htmlFor="user_role">Selected Package:</Label></div>
                      <div style={{ width: '621px' }}>
                        <input 
                          value={(userData.user_role as string).replace(/_/g, " ")}
                          disabled
                          className="w-full bg-gray-200 pl-2 rounded-sm"
                        />
                      </div>  
                      {errors.user_role && <p className="text-red-500 text-sm mt-1">{errors.user_role.message}</p>}
                    </div>

                    <div className='flex justify-between items-center p-1'>
                      <div style={{ width: '175px' }}><Label htmlFor="user_registered">Date Registered:</Label></div>
                      <div style={{ width: '621px' }}>
                        <input 
                          value={userData.user_registered.toISOString().split('T')[0]}
                          disabled
                          className="w-full bg-gray-200 pl-2 rounded-sm"
                        />
                      </div>  
                      {errors.user_registered && <p className="text-red-500 text-sm mt-1">{errors.user_registered.message}</p>}
                    </div>
                </div>
              </motion.div>
            </TabsContent>      
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default RegisteredUserDialog;