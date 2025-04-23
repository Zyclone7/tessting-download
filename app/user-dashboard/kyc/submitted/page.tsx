"use client"
import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function KYCSubmittedPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto px-4 py-16 text-center"
    >
      <div className="mb-8">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          KYC Verification Submitted
        </h1>
        <p className="text-gray-600 mb-8">
          Your documents have been successfully submitted for verification.
          Please allow 24-48 hours for processing. You'll receive an email
          notification once your verification is complete.
        </p>
        
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/user-dashboard/">
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-left">
        <h2 className="font-medium text-blue-800 mb-2">What's Next?</h2>
        <ul className="list-disc list-inside text-blue-700 space-y-2">
          <li>We'll verify your identity documents</li>
          <li>Check the quality and validity of your submissions</li>
          <li>Update your account status once approved</li>
        </ul>
      </div>
    </motion.div>
  )
}