"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import type { Term } from "@/types/types"

interface PreviewTermsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    terms: Term[]
}

export function PreviewTermsDialog({ open, onOpenChange, terms }: PreviewTermsDialogProps) {
    const [currentSection, setCurrentSection] = useState(0)
    const [isChecked, setIsChecked] = useState(false)

    const handleOpenChange = (open: boolean) => {
        onOpenChange(open)
        if (open) {
            setCurrentSection(0)
            setIsChecked(false)
        }
    }

    const nextSection = () => {
        if (currentSection < terms.length - 1) {
            setCurrentSection(currentSection + 1)
        }
    }

    const isLastSection = currentSection === terms.length - 1
    const buttonText = isLastSection
        ? isChecked
            ? "Accept Terms and Conditions"
            : "Please check the box to accept"
        : "Next Section"

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>PHILTECH NEGOSYO FRANCHISE TERMS & CONDITIONS</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            Section {currentSection + 1} of {terms.length}
                        </span>
                    </DialogTitle>
                    <DialogDescription>Preview how your terms and conditions will appear to users.</DialogDescription>
                </DialogHeader>
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
                            <h2 className="text-2xl font-bold mb-4">{terms[currentSection]?.title || "No title"}</h2>
                            <p className="whitespace-pre-wrap leading-relaxed text-lg">
                                {terms[currentSection]?.content || "No content"}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </ScrollArea>
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 p-4">
                    <div className="flex items-center space-x-2 sm:order-1">
                        <Checkbox
                            id="terms"
                            checked={isChecked}
                            onCheckedChange={(checked) => setIsChecked(checked as boolean)}
                            disabled={!isLastSection}
                            className={!isLastSection ? "opacity-50" : ""}
                        />
                        <Label htmlFor="terms" className={`${!isLastSection ? "text-gray-400" : ""} text-sm`}>
                            I have read and agree to the terms and conditions
                        </Label>
                    </div>
                    <Button onClick={nextSection} disabled={isLastSection && !isChecked} className="sm:order-2 w-full sm:w-auto">
                        {buttonText} {!isLastSection && <ChevronRight className="ml-2" />}
                    </Button>
                </div>
                <div className="relative w-full mt-4">
                    <motion.div
                        className="absolute bottom-0 left-0 h-2 bg-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                            width: `${((currentSection + 1) / terms.length) * 100}%`,
                        }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
