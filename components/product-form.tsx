import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, Plus } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createProduct, updateProduct } from "@/actions/package-products"

interface ProductFormProps {
  product?: any | null
  onSuccess?: () => void
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || "",
    label: product?.label || "",
    category: product?.category || "",
    price: product?.price || 0,
    status: product?.status || 1,
    retailer_count: product?.retailer_count || 0,
    free_credits: product?.free_credits || 0,
    short_description: product?.short_description || "",
    payment_type: product?.payment_type || "",
    package_type: product?.package_type || "",
  })
  const [features, setFeatures] = useState<string[]>(
    product?.pt_package_features.map((f: any) => f.feature) || [""]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const data = {
      ...formData,
      price: parseFloat(formData.price.toString()),
      status: parseInt(formData.status.toString()),
      retailer_count: parseInt(formData.retailer_count.toString()),
      free_credits: parseInt(formData.free_credits.toString()),
      pt_package_features: features.filter(f => f.trim() !== "").map(feature => ({ feature })),
    }

    try {
      if (product) {
        await updateProduct(product.id, data)
      } else {
        await createProduct(data as Required<typeof data>)
      }

      if (onSuccess) {
        onSuccess()
      }

      toast({
        title: "Success",
        description: `Product ${product ? "updated" : "created"} successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${product ? "update" : "create"} product`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features]
    newFeatures[index] = value
    setFeatures(newFeatures)
  }

  const addFeature = () => {
    setFeatures([...features, ""])
  }

  const removeFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index)
    setFeatures(newFeatures)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="Enter product label"
                  className="transition-all focus:scale-[1.02]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  className="transition-all focus:scale-[1.02]"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Enter category"
                  className="transition-all focus:scale-[1.02]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Enter price"
                  className="transition-all focus:scale-[1.02]"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  value={formData.status.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: parseInt(value) }))}
                  required
                >
                  <SelectTrigger className="transition-all focus:scale-[1.02]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="0">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Retailer Count</Label>
                <Input
                  id="retailer_count"
                  name="retailer_count"
                  type="number"
                  value={formData.retailer_count}
                  onChange={handleInputChange}
                  placeholder="Enter retailer count"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Free Credits</Label>
                <Input
                  id="free_credits"
                  name="free_credits"
                  type="number"
                  value={formData.free_credits}
                  onChange={handleInputChange}
                  placeholder="Enter free credits"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description</Label>
              <Input
                id="short_description"
                name="short_description"
                value={formData.short_description}
                onChange={handleInputChange}
                placeholder="Enter short description"
                className="transition-all focus:scale-[1.02]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_type">Payment Type</Label>
                <Input
                  id="payment_type"
                  name="payment_type"
                  value={formData.payment_type}
                  onChange={handleInputChange}
                  placeholder="Enter payment type"
                  className="transition-all focus:scale-[1.02]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package_type">Package Type</Label>
                <Input
                  id="package_type"
                  name="package_type"
                  value={formData.package_type}
                  onChange={handleInputChange}
                  placeholder="Enter package type"
                  className="transition-all focus:scale-[1.02]"
                />
              </div>
            </div>
          </motion.div>
        </TabsContent>
        <TabsContent value="features">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center space-x-2"
              >
                <Input
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  placeholder="Enter feature"
                  className="transition-all focus:scale-[1.02]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeFeature(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addFeature}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </motion.div>
        </TabsContent>
      </Tabs>
      <Button
        type="submit"
        className="w-full transition-all hover:scale-[1.02]"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {product ? "Updating..." : "Creating..."}
          </>
        ) : product ? (
          "Update Product"
        ) : (
          "Create Product"
        )}
      </Button>
    </form>
  )
}
