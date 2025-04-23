"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, ChevronRight } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { getPoliciesForDisplay } from "@/actions/terms-and-data-policy"
import type { Policy } from "@/types/types"

interface DataPrivacyDialogProps {
  onAccept: () => void
  accepted: boolean
}

export function DataPrivacyDialog({ onAccept, accepted }: DataPrivacyDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const [isChecked, setIsChecked] = useState(false)
  const [sections, setSections] = useState<Policy[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const result: any = await getPoliciesForDisplay()
        setSections(result.policies)
      } catch (error) {
        console.error("Error fetching privacy policies:", error)
        toast({
          title: "Error",
          description: "Failed to load privacy policy",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPolicies()
    /*************  ✨ Windsurf Command ⭐  *************/
    /**
     * Handles changes to the open state of the dialog.
     * When the dialog is opened, it resets the current section to 0 and unchecks the checkbox.
     * @param {boolean} open Whether the dialog is open or not.
     */
    /*******  6c3b6089-0236-45d2-bb8a-a6a0c9cd2c48  *******/
}, [])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setCurrentSection(0)
      setIsChecked(false)
    }
  }

  const handleAccept = () => {
    if (isChecked) {
      onAccept()
      setIsOpen(false)
      toast({
        title: "PHILTECH, INC Privacy Policy Accepted ✓",
        description: "You have successfully accepted the PHILTECH, INC Privacy Policy.",
        variant: "default",
      })
    }
  }

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1)
      toast({
        title: `Section ${currentSection + 2} of ${sections.length}`,
        description: `Reading: ${sections[currentSection + 1].title}`,
        variant: "default",
      })
    }
  }

  const isLastSection = currentSection === sections.length - 1
  const buttonText = isLastSection
    ? isChecked
      ? "Accept PHILTECH, INC Privacy Policy"
      : "Please check the box to accept"
    : "Next Section"

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full relative group">
          {accepted ? (
            <span className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              PHILTECH, INC Privacy Policy Accepted
            </span>
          ) : (
            <>
              Read PHILTECH, INC Privacy Policy
              <motion.span
                className="absolute right-4 opacity-0 group-hover:opacity-100"
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                →
              </motion.span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>PHILTECH PRIVACY POLICY</span>
            <span className="text-sm font-normal text-muted-foreground">
              Section {currentSection + 1} of {sections.length}
            </span>
          </DialogTitle>
          <DialogDescription>Please read our data privacy policy.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-grow flex justify-center items-center">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Loading privacy policy...</p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-grow pr-4 mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 space-y-4"
                >
                  <h2 className="text-2xl font-bold mb-4">
                    {sections[currentSection]?.title || "No policy available"}
                  </h2>
                  <p className="whitespace-pre-wrap leading-relaxed text-lg">
                    {sections[currentSection]?.content || "Please contact support if you're seeing this message."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </ScrollArea>
            <DialogFooter className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
              <div className="flex items-center space-x-2 sm:order-1">
                <Checkbox
                  id="terms"
                  checked={isChecked}
                  onCheckedChange={(checked) => setIsChecked(checked as boolean)}
                  disabled={!isLastSection}
                  className={!isLastSection ? "opacity-50" : ""}
                />
                <Label htmlFor="terms" className={`${!isLastSection ? "text-gray-400" : ""} text-sm`}>
                  I have read and agree to the PHILTECH INC Privacy Policy
                </Label>
              </div>
              <Button
                onClick={isLastSection ? handleAccept : nextSection}
                disabled={isLastSection && !isChecked}
                className="sm:order-2 w-full sm:w-auto"
              >
                {buttonText} {!isLastSection && <ChevronRight className="ml-2" />}
              </Button>
            </DialogFooter>
            <div className="relative w-full mt-4">
              <motion.div
                className="absolute bottom-0 left-0 h-2 bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentSection + 1) / sections.length) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
