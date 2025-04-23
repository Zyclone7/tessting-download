"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { getIncentives, updateIncentives, deleteIncentive } from "@/actions/referral-incentive"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Incentive {
  id?: number
  generation: number
  basic_incentive: number
  premium_incentive: number
  elite_incentive: number
  elite_plus_incentive: number
}

interface IncentivesFormProps {
  productId: number
}

export function IncentivesForm({ productId }: IncentivesFormProps) {
  const [incentives, setIncentives] = useState<Incentive[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchIncentives = async () => {
      try {
        const data: any = await getIncentives(productId)
        setIncentives(data)
      } catch (error) {
        console.error("Error fetching incentives:", error)
        toast({
          title: "Error",
          description: "Failed to load incentives",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchIncentives()
  }, [productId, toast])

  const handleIncentiveChange = (index: number, field: keyof Incentive, value: string) => {
    const newIncentives = [...incentives]
    newIncentives[index] = { ...newIncentives[index], [field]: Number.parseFloat(value) || 0 }
    setIncentives(newIncentives)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateIncentives(productId, incentives)
      toast({
        title: "Success",
        description: "Incentives updated successfully",
      })
    } catch (error) {
      console.error("Error updating incentives:", error)
      toast({
        title: "Error",
        description: "Failed to update incentives",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addIncentive = () => {
    const newGeneration = incentives.length > 0 ? Math.max(...incentives.map((i) => i.generation)) + 1 : 1
    setIncentives([
      ...incentives,
      {
        generation: newGeneration,
        basic_incentive: 0,
        premium_incentive: 0,
        elite_incentive: 0,
        elite_plus_incentive: 0,
      },
    ])
  }

  const removeIncentive = async (index: number) => {
    const incentive = incentives[index]
    if (incentive.id) {
      try {
        await deleteIncentive(productId, incentive.id)
        toast({
          title: "Success",
          description: "Incentive deleted successfully",
        })
      } catch (error) {
        console.error("Error deleting incentive:", error)
        toast({
          title: "Error",
          description: "Failed to delete incentive",
          variant: "destructive",
        })
        return
      }
    }
    setIncentives(incentives.filter((_, i) => i !== index))
  }

  const moveIncentive = (index: number, direction: "up" | "down") => {
    const newIncentives = [...incentives]
    const newIndex = direction === "up" ? index - 1 : index + 1

    if (newIndex >= 0 && newIndex < newIncentives.length) {
      ;[newIncentives[index], newIncentives[newIndex]] = [newIncentives[newIndex], newIncentives[index]]
      setIncentives(newIncentives)
    }
  }

  if (isLoading) {
    return <div>Loading incentives...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AnimatePresence>
        {incentives.map((incentive, index) => (
          <motion.div
            key={incentive.id || index}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Generation {incentive.generation}</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveIncentive(index, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveIncentive(index, "down")}
                      disabled={index === incentives.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeIncentive(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`basic-${index}`}>Basic</Label>
                    <Input
                      id={`basic-${index}`}
                      type="number"
                      value={incentive.basic_incentive}
                      onChange={(e) => handleIncentiveChange(index, "basic_incentive", e.target.value)}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`premium-${index}`}>Premium</Label>
                    <Input
                      id={`premium-${index}`}
                      type="number"
                      value={incentive.premium_incentive}
                      onChange={(e) => handleIncentiveChange(index, "premium_incentive", e.target.value)}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`elite-${index}`}>Elite</Label>
                    <Input
                      id={`elite-${index}`}
                      type="number"
                      value={incentive.elite_incentive}
                      onChange={(e) => handleIncentiveChange(index, "elite_incentive", e.target.value)}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`elite-plus-${index}`}>Elite Plus</Label>
                    <Input
                      id={`elite-plus-${index}`}
                      type="number"
                      value={incentive.elite_plus_incentive}
                      onChange={(e) => handleIncentiveChange(index, "elite_plus_incentive", e.target.value)}
                      step="0.01"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="flex justify-between items-center">
        <Button type="button" onClick={addIncentive} variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Add Generation
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Incentives"
          )}
        </Button>
      </div>
    </form>
  )
}