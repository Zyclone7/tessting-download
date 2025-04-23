"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { updateProfile } from "@/actions/user"
import { getUserInfo } from "@/actions/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useUserContext } from "@/hooks/use-user"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Upload, Pencil, X, Save, Loader2, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface FormData {
  user_nicename: string
  user_email: string
  user_contact_number: string
  merchant_id: string
  business_name: string
  business_address: string
  current_password?: string
  new_password?: string
  confirm_password?: string
  profile_pic_url?: string
  travel_logo_url?: string
  travel_agency: string
  social_media_page: string
}

export function EditProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue,
  } = useForm<FormData>()

  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const { toast } = useToast()
  const { user, updateUserField } = useUserContext()

  // Profile image states
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [originalProfileImage, setOriginalProfileImage] = useState<string | null>(null)
  const [originalProfileImageUrl, setOriginalProfileImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Travel logo states
  const [travelLogo, setTravelLogo] = useState<string | null>(null)
  const [travelLogoUrl, setTravelLogoUrl] = useState<string | null>(null)
  const [originalTravelLogo, setOriginalTravelLogo] = useState<string | null>(null)
  const [originalTravelLogoUrl, setOriginalTravelLogoUrl] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  // UI states
  const [editMode, setEditMode] = useState(false)
  const [originalData, setOriginalData] = useState<FormData | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [uploadStats, setUploadStats] = useState<{ original: number; optimized: number } | null>(null)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoFileInputRef = useRef<HTMLInputElement>(null)

  const fetchUserData = async () => {
    if (user?.id) {
      setIsDataLoading(true)
      try {
        const userData: any = await getUserInfo(user.id)
        reset(userData)
        setOriginalData(userData)

        if (userData.profile_pic_url) {
          setProfileImage(userData.profile_pic_url)
          setProfileImageUrl(userData.profile_pic_url)
          setOriginalProfileImage(userData.profile_pic_url)
          setOriginalProfileImageUrl(userData.profile_pic_url)
        }

        if (userData.travel_logo_url) {
          setTravelLogo(userData.travel_logo_url)
          setTravelLogoUrl(userData.travel_logo_url)
          setOriginalTravelLogo(userData.travel_logo_url)
          setOriginalTravelLogoUrl(userData.travel_logo_url)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load user data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsDataLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [user, reset, toast])

  // Sync travel logo states with original data
  useEffect(() => {
    if (originalData?.travel_logo_url) {
      setTravelLogo(originalData.travel_logo_url)
      setTravelLogoUrl(originalData.travel_logo_url)
    }
  }, [originalData])

  // Sync profile image states with original data
  useEffect(() => {
    if (originalData?.profile_pic_url) {
      setProfileImage(originalData.profile_pic_url)
      setProfileImageUrl(originalData.profile_pic_url)
    }
  }, [originalData])

  const handleLogoClick = () => {
    if (editMode) {
      logoFileInputRef.current?.click()
    }
  }

  const handleImageClick = () => {
    if (editMode) {
      fileInputRef.current?.click()
    }
  }

  // Update the uploadImage function to pass the userId to the API
  const uploadImage = async (file: File, type: "profile" | "logo") => {
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: `Image size should be less than 5MB`,
        variant: "destructive",
      })
      return null
    }

    // Create a preview immediately for better UX
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (type === "profile") {
        setProfileImage(result)
      } else {
        setTravelLogo(result)
      }
    }
    reader.readAsDataURL(file)

    // Upload to Blob storage with optimization
    const blobFormData = new FormData()
    blobFormData.append("file", file)
    blobFormData.append("type", type)

    // Add user ID to allow the API to find and delete the old image
    if (user?.id) {
      blobFormData.append("userId", user.id.toString())
    }

    const blobUploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: blobFormData,
    })

    if (!blobUploadResponse.ok) {
      const errorData = await blobUploadResponse.json()
      throw new Error(errorData.error || "Upload failed")
    }

    const blobResult = await blobUploadResponse.json()

    // Show optimization stats
    if (blobResult.size) {
      setUploadStats({
        original: blobResult.size.original,
        optimized: blobResult.size.optimized,
      })

      // Clear stats after 5 seconds
      setTimeout(() => setUploadStats(null), 5000)
    }

    return blobResult.url
  }

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)

    try {
      const logoUrl = await uploadImage(file, "logo")

      if (logoUrl) {
        setTravelLogoUrl(logoUrl)
        setValue("travel_logo_url", logoUrl)

        toast({
          title: "Success",
          description: "Travel logo uploaded successfully",
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload travel logo. Please try again.",
        variant: "destructive",
      })
      // Revert to original image if upload fails
      setTravelLogo(originalTravelLogo)
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const imageUrl = await uploadImage(file, "profile")

      if (imageUrl) {
        setProfileImageUrl(imageUrl)
        setValue("profile_pic_url", imageUrl)

        toast({
          title: "Success",
          description: "Profile picture uploaded successfully",
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      })
      // Revert to original image if upload fails
      setProfileImage(originalProfileImage)
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      if (!user?.id) throw new Error("User ID not found")

      // Only include password fields if new password is being set
      const submitData = {
        ...data,
        ID: user.id,
        profile_pic_url: profileImageUrl,
        travel_logo_url: travelLogoUrl,
      }

      // Remove password fields if no new password is being set
      if (!data.new_password) {
        delete submitData.current_password
        delete submitData.new_password
        delete submitData.confirm_password
      }

      const result = await updateProfile(submitData)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })

        // Update the UserContext with new data
        if (data.travel_agency !== user.travel_agency) {
          updateUserField("travel_agency", data.travel_agency)
        }

        if (data.business_address !== user.business_address) {
          updateUserField("business_address", data.business_address)
        }

        if (data.social_media_page !== user.social_media_page) {
          updateUserField("social_media_page", data.social_media_page)
        }

        if (profileImageUrl !== user.profile_pic_url) {
          updateUserField("profile_pic_url", profileImageUrl || "")
        }

        if (travelLogoUrl !== user.travel_logo_url) {
          updateUserField("travel_logo_url", travelLogoUrl || "")
        }

        // Clear password fields after successful update
        if (data.new_password) {
          reset({
            ...data,
            current_password: "",
            new_password: "",
            confirm_password: "",
          })
        }

        // Update original data after successful save
        setOriginalData({
          ...data,
          profile_pic_url: profileImageUrl as string,
          travel_logo_url: travelLogoUrl as string,
        })
        setOriginalProfileImage(profileImage)
        setOriginalProfileImageUrl(profileImageUrl)
        setOriginalTravelLogo(travelLogo)
        setOriginalTravelLogoUrl(travelLogoUrl)

        // Exit edit mode
        setEditMode(false)

        // Trigger visual refresh animation
        setIsRefreshing(true)

        // Auto-refresh data after a short delay to show the animation
        setTimeout(() => {
          fetchUserData()
          // Reset the refresh animation state after data is loaded
          setTimeout(() => {
            setIsRefreshing(false)
          }, 500)
        }, 500)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Revert to original data
    if (originalData) {
      reset(originalData)
    }
    // Revert profile image
    setProfileImage(originalProfileImage)
    setProfileImageUrl(originalProfileImageUrl)
    // Revert travel logo
    setTravelLogo(originalTravelLogo)
    setTravelLogoUrl(originalTravelLogoUrl)

    // Exit edit mode
    setEditMode(false)
  }

  const handleEdit = () => {
    setEditMode(true)
  }

  if (isDataLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-8">
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get the image source for the avatar
  const imageSource = profileImage || profileImageUrl
  const logoSource = travelLogo || travelLogoUrl

  return (
    <TooltipProvider>
      <Card
        className={`w-full max-w-4xl mx-auto transition-all duration-300 shadow-lg ${isRefreshing ? "opacity-50" : "opacity-100"}`}
      >
        <CardHeader className="relative">
          {isRefreshing && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          <CardTitle className="text-2xl font-bold text-center">Edit Your Profile</CardTitle>
          <CardDescription className="text-center">
            Update your personal information and account settings
          </CardDescription>
          {!editMode && (
            <Button
              variant="outline"
              size="sm"
              className="absolute right-6 top-6 transition-all hover:bg-primary hover:text-primary-foreground"
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personal" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="personal" className="text-sm sm:text-base">
                Personal Info
              </TabsTrigger>
              <TabsTrigger value="security" className="text-sm sm:text-base">
                Security
              </TabsTrigger>
            </TabsList>
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                <TabsContent value="personal" key="personal">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      {/* Profile Picture Upload */}
                      <div className="flex flex-col items-center space-y-4">
                        <Label className="text-center font-medium">Profile Picture</Label>
                        <div
                          className={`relative ${editMode ? "cursor-pointer" : ""} group transition-all duration-300`}
                          onClick={handleImageClick}
                        >
                          <div
                            className={`h-32 w-32 rounded-full overflow-hidden border-2 ${editMode ? "border-primary" : "border-muted"} transition-all duration-300 ${editMode ? "hover:border-primary/80 hover:shadow-lg" : ""}`}
                          >
                            {imageSource ? (
                              <img
                                src={imageSource || "/placeholder.svg"}
                                alt="Profile"
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  console.error("Image failed to load:", imageSource)
                                    ; (e.target as HTMLImageElement).src = `/placeholder.svg?height=128&width=128`
                                }}
                              />
                            ) : (
                              <div className="h-full w-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                                {watch("user_nicename")?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                            )}
                          </div>
                          {editMode && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {isUploading ? (
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                              ) : (
                                <Camera className="h-8 w-8 text-white" />
                              )}
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                          disabled={!editMode}
                        />
                        {editMode && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={handleImageClick}
                            disabled={isUploading || !editMode}
                          >
                            <Upload className="h-3 w-3 mr-2" />
                            {isUploading ? "Uploading..." : "Change Photo"}
                          </Button>
                        )}

                        {/* Upload stats badge */}
                        <AnimatePresence>
                          {uploadStats && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
                                    <Info className="h-3 w-3" />
                                    {Math.round((1 - uploadStats.optimized / uploadStats.original) * 100)}% smaller
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Original: {(uploadStats.original / 1024).toFixed(1)}KB</p>
                                  <p>Optimized: {(uploadStats.optimized / 1024).toFixed(1)}KB</p>
                                </TooltipContent>
                              </Tooltip>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Travel Logo Upload */}
                      <div className="flex flex-col items-center space-y-4">
                        <Label className="text-center font-medium">Travel Agency Logo</Label>
                        <div
                          className={`relative ${editMode ? "cursor-pointer" : ""} group transition-all duration-300`}
                          onClick={handleLogoClick}
                        >
                          <div
                            className={`h-32 w-32 rounded-full overflow-hidden border-2 ${editMode ? "border-primary" : "border-muted"} transition-all duration-300 ${editMode ? "hover:border-primary/80 hover:shadow-lg" : ""}`}
                          >
                            {logoSource ? (
                              <img
                                src={logoSource || "/placeholder.svg"}
                                alt="Travel Logo"
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  console.error("Logo failed to load:", logoSource)
                                    ; (e.target as HTMLImageElement).src = `/placeholder.svg?height=128&width=128`
                                }}
                              />
                            ) : (
                              <div className="h-full w-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                                {watch("travel_agency")?.charAt(0)?.toUpperCase() || "T"}
                              </div>
                            )}
                          </div>
                          {editMode && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {isUploadingLogo ? (
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                              ) : (
                                <Camera className="h-8 w-8 text-white" />
                              )}
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={logoFileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoChange}
                          disabled={!editMode}
                        />
                        {editMode && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={handleLogoClick}
                            disabled={isUploadingLogo || !editMode}
                          >
                            <Upload className="h-3 w-3 mr-2" />
                            {isUploadingLogo ? "Uploading..." : "Change Logo"}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div>
                        <Label htmlFor="user_nicename" className="font-medium">
                          Name
                        </Label>
                        <Input
                          id="user_nicename"
                          disabled={!editMode}
                          className={`mt-1 ${!editMode ? "bg-muted/50" : ""}`}
                          {...register("user_nicename", { required: "Name is required" })}
                        />
                        {errors.user_nicename && (
                          <p className="text-destructive text-sm mt-1">{errors.user_nicename.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="user_email" className="font-medium">
                          Email
                        </Label>
                        <Input
                          id="user_email"
                          type="email"
                          disabled={!editMode}
                          className={`mt-1 ${!editMode ? "bg-muted/50" : ""}`}
                          {...register("user_email", { required: "Email is required" })}
                        />
                        {errors.user_email && (
                          <p className="text-destructive text-sm mt-1">{errors.user_email.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="user_contact_number" className="font-medium">
                          Contact Number
                        </Label>
                        <Input
                          id="user_contact_number"
                          disabled={!editMode}
                          className={`mt-1 ${!editMode ? "bg-muted/50" : ""}`}
                          {...register("user_contact_number")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="business_name" className="font-medium">
                          Business Name
                        </Label>
                        <Input
                          id="business_name"
                          disabled={!editMode}
                          className={`mt-1 ${!editMode ? "bg-muted/50" : ""}`}
                          {...register("business_name")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="business_address" className="font-medium">
                          Business Address
                        </Label>
                        <Input
                          id="business_address"
                          disabled={!editMode}
                          className={`mt-1 ${!editMode ? "bg-muted/50" : ""}`}
                          {...register("business_address")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="travel_agency" className="font-medium">
                          Travel Agency Name
                        </Label>
                        <Input
                          id="travel_agency"
                          disabled={!editMode}
                          className={`mt-1 ${!editMode ? "bg-muted/50" : ""}`}
                          {...register("travel_agency")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="social_media_page" className="font-medium">
                          Social Media
                        </Label>
                        <Input
                          id="social_media_page"
                          disabled={!editMode}
                          className={`mt-1 ${!editMode ? "bg-muted/50" : ""}`}
                          {...register("social_media_page")}
                        />
                      </div>
                      <div style={{ display: "none" }}>
                        <Input readOnly id="merchant_id" {...register("merchant_id")} />
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
                <TabsContent value="security" key="security">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="max-w-md mx-auto">
                      <div className="mb-6">
                        <Label htmlFor="current_password" className="font-medium">
                          Current Password
                        </Label>
                        <Input
                          id="current_password"
                          type="password"
                          disabled={!editMode}
                          className={`mt-1 ${!editMode ? "bg-muted/50" : ""}`}
                          {...register("current_password", {
                            required: {
                              value: !!watch("new_password"),
                              message: "Current password is required when setting a new password",
                            },
                          })}
                        />
                        {errors.current_password && (
                          <p className="text-destructive text-sm mt-1">{errors.current_password.message}</p>
                        )}
                      </div>
                      <div className="mb-6">
                        <Label htmlFor="new_password" className="font-medium">
                          New Password
                        </Label>
                        <Input
                          id="new_password"
                          type="password"
                          disabled={!editMode}
                          className={`mt-1 ${!editMode ? "bg-muted/50" : ""}`}
                          {...register("new_password", {
                            minLength: {
                              value: 8,
                              message: "Password must be at least 8 characters long",
                            },
                            validate: (value) => {
                              if (value && !watch("current_password")) {
                                return "Current password is required to set a new password"
                              }
                              return true
                            },
                          })}
                        />
                        {errors.new_password && (
                          <p className="text-destructive text-sm mt-1">{errors.new_password.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="confirm_password" className="font-medium">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirm_password"
                          type="password"
                          disabled={!editMode}
                          className={`mt-1 ${!editMode ? "bg-muted/50" : ""}`}
                          {...register("confirm_password", {
                            validate: (value) => {
                              if (watch("new_password") && value !== watch("new_password")) {
                                return "The passwords do not match"
                              }
                              return true
                            },
                          })}
                        />
                        {errors.confirm_password && (
                          <p className="text-destructive text-sm mt-1">{errors.confirm_password.message}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-end gap-2 mt-8"
              >
                {editMode ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="transition-all hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isLoading ||
                        (!isDirty &&
                          profileImageUrl === originalProfileImageUrl &&
                          travelLogoUrl === originalTravelLogoUrl)
                      }
                      className="transition-all"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Saving...
                        </span>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                ) : null}
              </motion.div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

