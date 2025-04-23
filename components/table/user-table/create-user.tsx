"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUser } from "@/actions/user"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import bcrypt from "bcryptjs"
import { sendWelcomeEmail } from "@/lib/email"

// Function to generate a secure random password
const generateRandomPassword = () => {
  const length = 10
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  return password
}

export function CreateUserForm() {
  const [formData, setFormData] = useState({
    user_nicename: "",
    user_email: "",
    user_role: "Basic_Merchant_Package",
    merchant_id: "",
    terminal_id: "",
    business_name: "",
    business_address: "",
    user_contact_number: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Generate a random password
      const randomPassword = generateRandomPassword()

      // Hash the password on the client side
      const hashedPassword = await bcrypt.hash(randomPassword, 10)

      // Create the user with the hashed password
      const result = await createUser({
        ...formData,
        user_pass: hashedPassword,
      })

      if (result.success) {
        toast({
          title: "User Created",
          description: `User ${formData.user_nicename} has been created successfully.`,
        })

        // Reset form
        setFormData({
          user_nicename: "",
          user_email: "",
          user_role: "Basic_Merchant_Package",
          merchant_id: "",
          terminal_id: "",
          business_name: "",
          business_address: "",
          user_contact_number: "",
        })

        // Show password to admin
        toast({
          title: "User Credentials",
          description: (
            <div className="mt-2 p-2 bg-muted rounded-md">
              <p>
                <strong>Email:</strong> {formData.user_email}
              </p>
              <p>
                <strong>Password:</strong> {randomPassword}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Please save this password or share it with the user.</p>
            </div>
          ),
          duration: 10000, // Show for 10 seconds
        })

        // Send welcome email if needed
        try {
          await sendWelcomeEmail(
            formData.user_email,
            {
              user_nicename: formData.user_nicename,
              business_name: formData.business_name,
            },
            randomPassword,
          )

          toast({
            title: "Welcome Email Sent",
            description: `A welcome email has been sent to ${formData.user_email}`,
          })
        } catch (error) {
          console.error("Error sending welcome email:", error)
          toast({
            title: "Email Not Sent",
            description: "User was created but welcome email could not be sent",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
        <CardDescription>Add a new user to the system</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user_nicename">Name *</Label>
              <Input
                id="user_nicename"
                value={formData.user_nicename}
                onChange={(e) => handleChange("user_nicename", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_email">Email *</Label>
              <Input
                id="user_email"
                type="email"
                value={formData.user_email}
                onChange={(e) => handleChange("user_email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_role">Role *</Label>
              <Select value={formData.user_role} onValueChange={(value) => handleChange("user_role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basic_Merchant_Package">Basic Merchant Package</SelectItem>
                  <SelectItem value="Premium_Merchant_Package">Premium Merchant Package</SelectItem>
                  <SelectItem value="Elite_Distributor_Package">Elite Distributor Package</SelectItem>
                  <SelectItem value="Elite_Plus_Distributor_Package">Elite Plus Distributor Package</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_contact_number">Contact Number</Label>
              <Input
                id="user_contact_number"
                value={formData.user_contact_number}
                onChange={(e) => handleChange("user_contact_number", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant_id">Merchant ID</Label>
              <Input
                id="merchant_id"
                value={formData.merchant_id}
                onChange={(e) => handleChange("merchant_id", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terminal_id">Terminal ID</Label>
              <Input
                id="terminal_id"
                value={formData.terminal_id}
                onChange={(e) => handleChange("terminal_id", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => handleChange("business_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_address">Business Address</Label>
              <Input
                id="business_address"
                value={formData.business_address}
                onChange={(e) => handleChange("business_address", e.target.value)}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            * Required fields. A random password will be generated for the user.
          </p>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create User"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

