"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { IncentivesForm } from "./incentives-forms"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Upload,
  ImageIcon,
  X,
  Check,
  AlertCircle,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react"
import Image from "next/image"
import { updateProduct } from "@/actions/package-products"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Cropper, ImageRestriction, type CropperRef } from "react-advanced-cropper"
import "react-advanced-cropper/dist/style.css"

interface ProductDetailsProps {
  product: any | null
  isOpen: boolean
  onClose: () => void
}

export function ProductDetails({ product, isOpen, onClose }: ProductDetailsProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [cropperImage, setCropperImage] = useState<string | null>(null)
  const cropperRef = useRef<CropperRef>(null)
  const [cropperSettings, setCropperSettings] = useState({
    aspectRatio: 1,
    quality: 85,
    maxSize: 1600,
    rotation: 0,
    zoom: 1,
  })
  const [showFullPreview, setShowFullPreview] = useState(false)
  const [originalFile, setOriginalFile] = useState<File | null>(null)

  // Initialize image preview from product data when component mounts or product changes
  useEffect(() => {
    if (product?.image) {
      setImagePreview(product.image)
    } else {
      setImagePreview(null)
    }
  }, [product])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }, [])

  const handleFileSelection = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file")
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image size should be less than 10MB")
      return
    }

    setUploadError(null)
    setOriginalFile(file)

    // Create preview for cropper
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setCropperImage(result)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      handleFileSelection(file)
    },
    [handleFileSelection],
  )

  const handleCropComplete = useCallback(async () => {
    if (!cropperRef.current || !originalFile) return

    setShowCropper(false)
    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Get cropped canvas and convert to blob
      const canvas = cropperRef.current.getCanvas()
      if (!canvas) {
        throw new Error("Failed to get cropped image")
      }

      // Apply quality settings
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else throw new Error("Failed to create blob from canvas")
          },
          "image/jpeg",
          cropperSettings.quality / 100,
        )
      })

      // Create a file from the blob
      const croppedFile = new File([blob], originalFile.name, {
        type: "image/jpeg",
        lastModified: Date.now(),
      })

      // Create local preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(croppedFile)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      // Create form data for upload
      const formData = new FormData()
      formData.append("file", croppedFile)
      formData.append("type", "product")

      // Pass the product ID as productId, not userId
      if (product?.id) {
        formData.append("productId", product.id.toString())
      }

      // Only pass the current image URL if it exists
      if (product?.image) {
        formData.append("currentImageUrl", product.image)
      } else {
        // Explicitly indicate there's no previous image
        formData.append("hasNoImage", "true")
      }

      // Upload to server
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload image")
      }

      const data = await response.json()
      setUploadProgress(100)

      // Update product with new image URL
      if (product?.id) {
        await updateProduct(product.id, {
          ...product,
          image: data.url,
          retailer_count: product.retailer_count || 0,
        })
      }

      toast({
        title: "Image uploaded successfully",
        description: "Your product image has been updated",
      })

      // Update the preview with the actual URL from the server
      setImagePreview(data.url)
      setOriginalFile(null)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to upload image")
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [cropperRef, originalFile, cropperSettings.quality, product, toast])

  const cancelCrop = useCallback(() => {
    setShowCropper(false)
    setOriginalFile(null)
    setCropperImage(null)
  }, [])

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const removeImage = useCallback(async () => {
    if (!product?.id || !product.image) return

    setIsUploading(true)
    try {
      // Create a special request to delete the image without uploading a new one
      const formData = new FormData()
      formData.append("type", "product")
      formData.append("productId", product.id.toString())
      formData.append("deleteOnly", "true")
      formData.append("currentImageUrl", product.image)

      // Send delete request to the API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete image")
      }

      // Update product to remove image reference
      await updateProduct(product.id, {
        ...product,
        image: null,
        retailer_count: product.retailer_count || 0,
      })

      setImagePreview(null)
      toast({
        title: "Image removed",
        description: "Product image has been removed",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove image",
      })
    } finally {
      setIsUploading(false)
    }
  }, [product, toast])

  const handleRotate = useCallback((direction: "clockwise" | "counterclockwise") => {
    setCropperSettings((prev) => ({
      ...prev,
      rotation: prev.rotation + (direction === "clockwise" ? 90 : -90),
    }))
  }, [])

  const handleZoom = useCallback((direction: "in" | "out") => {
    setCropperSettings((prev) => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(3, prev.zoom + (direction === "in" ? 0.1 : -0.1))),
    }))
  }, [])

  const resetCropper = useCallback(() => {
    if (cropperRef.current) {
      cropperRef.current.reset()
    }
    setCropperSettings({
      aspectRatio: 1,
      quality: 85,
      maxSize: 1600,
      rotation: 0,
      zoom: 1,
    })
  }, [])

  if (!product) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[720px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {product.label}
              {product.status === 1 && (
                <Badge variant="default" className="ml-2">
                  Active
                </Badge>
              )}
              {product.status !== 1 && (
                <Badge variant="secondary" className="ml-2">
                  Inactive
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>Product details, features, and incentives</DialogDescription>
          </DialogHeader>
          <ScrollArea className="mt-4 max-h-[calc(80vh-120px)]">
            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="incentives">Commission</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4 space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Image</CardTitle>
                      <CardDescription>Upload or update the product image</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {showCropper && cropperImage ? (
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4">
                            <Cropper
                              ref={cropperRef}
                              src={cropperImage}
                              className="h-[300px]"
                              stencilProps={{
                                aspectRatio: cropperSettings.aspectRatio,
                              }}
                              imageRestriction={ImageRestriction.stencil}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                              <Select
                                value={String(cropperSettings.aspectRatio)}
                                onValueChange={(value) =>
                                  setCropperSettings((prev) => ({
                                    ...prev,
                                    aspectRatio: Number.parseFloat(value),
                                  }))
                                }
                              >
                                <SelectTrigger id="aspect-ratio">
                                  <SelectValue placeholder="Select aspect ratio" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1:1 (Square)</SelectItem>
                                  <SelectItem value="1.33">4:3 (Standard)</SelectItem>
                                  <SelectItem value="1.78">16:9 (Widescreen)</SelectItem>
                                  <SelectItem value="0.75">3:4 (Portrait)</SelectItem>
                                  <SelectItem value="0.56">9:16 (Mobile)</SelectItem>
                                  <SelectItem value="0">Free Form</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="quality">Image Quality: {cropperSettings.quality}%</Label>
                              <Slider
                                id="quality"
                                min={50}
                                max={100}
                                step={5}
                                value={[cropperSettings.quality]}
                                onValueChange={(value) =>
                                  setCropperSettings((prev) => ({
                                    ...prev,
                                    quality: value[0],
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 justify-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleRotate("counterclockwise")}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Rotate Left</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" onClick={() => handleRotate("clockwise")}>
                                    <RotateCw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Rotate Right</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" onClick={() => handleZoom("in")}>
                                    <ZoomIn className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Zoom In</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" onClick={() => handleZoom("out")}>
                                    <ZoomOut className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Zoom Out</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" onClick={resetCropper}>
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reset</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          <div className="flex justify-center gap-2 mt-4">
                            <Button variant="default" onClick={handleCropComplete} className="flex items-center gap-2">
                              <Save className="h-4 w-4" />
                              Save & Upload
                            </Button>
                            <Button variant="outline" onClick={cancelCrop} className="flex items-center gap-2">
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <div
                            className={`relative w-full max-w-[300px] h-[200px] border-2 ${isDragging ? "border-primary" : "border-dashed"} rounded-lg flex items-center justify-center overflow-hidden ${isUploading ? "bg-muted/50" : "bg-background hover:bg-muted/30"
                              } transition-colors cursor-pointer`}
                            onClick={triggerFileInput}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            {imagePreview ? (
                              <>
                                <Image
                                  src={imagePreview || "/placeholder.svg"}
                                  alt={product.label || "Product image"}
                                  fill
                                  className="object-contain"
                                  sizes="(max-width: 300px) 100vw, 300px"
                                />
                                {!isUploading && (
                                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-colors">
                                    <div className="flex gap-2">
                                      <Button
                                        variant="secondary"
                                        size="icon"
                                        className="opacity-0 hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setShowFullPreview(true)
                                        }}
                                      >
                                        <Maximize2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        size="icon"
                                        className="opacity-0 hover:opacity-100 transition-opacity"
                                      >
                                        <Upload className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                {isUploading && (
                                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                    <span className="text-sm font-medium">{uploadProgress}%</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-4 text-center">
                                {isUploading ? (
                                  <>
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                    <span className="text-sm font-medium">{uploadProgress}%</span>
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                      Drag and drop or click to upload product image
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Supports JPG, PNG, WebP (max 10MB)
                                    </p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {uploadError && (
                            <Alert variant="destructive" className="mt-4">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{uploadError}</AlertDescription>
                            </Alert>
                          )}

                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                            disabled={isUploading}
                          />
                        </div>
                      )}
                    </CardContent>
                    {!showCropper && (
                      <CardFooter className="flex justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={triggerFileInput}
                          disabled={isUploading}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {imagePreview ? "Change Image" : "Upload Image"}
                        </Button>
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={removeImage}
                            disabled={isUploading}
                            className="flex items-center gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </CardFooter>
                    )}
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Information</CardTitle>
                      <CardDescription>Detailed information about the product</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-medium">Name URL:</span>
                        <span className="col-span-2">{product.name}</span>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-medium">Category:</span>
                        <span className="col-span-2">{product.category}</span>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-medium">Price:</span>
                        <span className="col-span-2">₱ {product.price.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-medium">Description:</span>
                        <span className="col-span-2">{product.short_description}</span>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-medium">Payment Type:</span>
                        <span className="col-span-2">{product.payment_type}</span>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-medium">Package Type:</span>
                        <span className="col-span-2">{product.package_type}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
              <TabsContent value="features" className="mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Features</CardTitle>
                      <CardDescription>List of features for this product</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {product.pt_package_features && product.pt_package_features.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-2">
                          {product.pt_package_features.map((feature: any, index: number) => (
                            <motion.li
                              key={feature.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="flex items-start gap-2"
                            >
                              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>{feature.feature}</span>
                            </motion.li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No features available for this product.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
              <TabsContent value="incentives" className="mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Referral Incentives</CardTitle>
                      <CardDescription>Manage referral incentives for this product</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <IncentivesForm productId={product.id} />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Full Image Preview Dialog */}
      {showFullPreview && imagePreview && (
        <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
            <div className="relative w-full h-[80vh]">
              <Image
                src={imagePreview || "/placeholder.svg"}
                alt={product.label || "Product image"}
                fill
                className="object-contain"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
              <Button
                className="absolute top-2 right-2"
                size="icon"
                variant="secondary"
                onClick={() => setShowFullPreview(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
