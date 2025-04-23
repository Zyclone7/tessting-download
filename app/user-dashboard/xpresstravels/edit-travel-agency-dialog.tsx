'use client'

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { updateProfile } from '@/actions/user';
import { getUserInfo } from '@/actions/user';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '@/hooks/use-user';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface FormData {
  travel_agency: string;
}

interface EditTravelFormProps {
  onSuccess?: () => void;
  standalone?: boolean;
}

export function EditTravelForm({ onSuccess, standalone = false }: EditTravelFormProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useUserContext();

  useEffect(() => {
    async function fetchUserData() {
      if (user?.id) {
        try {
          const userData: any = await getUserInfo(user.id);
          reset({
            travel_agency: userData.travel_agency
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to load user data. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsDataLoading(false);
        }
      }
    }

    fetchUserData();
  }, [user, reset, toast]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      if (!user?.id) throw new Error("User ID not found");

      const submitData = {
        ...data,
        ID: user.id,
      };

      const result = await updateProfile(submitData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Edit Your Travel Agency</CardTitle>
        <CardDescription className="text-center">
          Update your travel agency information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 mt-4"
          >
            <div>
              <Label htmlFor="travel_agency">Travel Agency Name</Label>
              <Input
                id="travel_agency"
                {...register("travel_agency")}
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end mt-6"
          >
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                "Update Travel Agency"
              )}
            </Button>
          </motion.div>
        </form>
      </CardContent>
    </Card>
  );
}