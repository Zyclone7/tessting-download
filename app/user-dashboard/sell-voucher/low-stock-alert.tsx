"use client"

import type React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

interface LowStockAlertProps {
  open: boolean
  onClose: () => void
  voucherType: string
  productDetails: string
  stockCount: number
}

export const LowStockAlert: React.FC<LowStockAlertProps> = ({
  open,
  onClose,
  voucherType,
  productDetails,
  stockCount,
}) => {
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center justify-center p-4">
            <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Low Stock Alert</h2>
            <p className="text-center mb-4">
              {voucherType} ePINS <strong>{productDetails}</strong> is running low on stock. Only{" "}
              <Badge variant="outline" className="ml-1 bg-amber-100">
                {stockCount}
              </Badge>{" "}
              vouchers remaining.
            </p>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Please contact your administrator to replenish the stock soon.
            </p>
            <Button onClick={onClose} className="w-full">
              Acknowledge
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

interface StockCountDisplayProps {
  count: number
  isLowStock: boolean
  loading?: boolean
}

export const StockCountDisplay: React.FC<StockCountDisplayProps> = ({ count, isLowStock, loading = false }) => {
  if (loading) {
    return <div className="h-5 w-24 mt-1 bg-muted animate-pulse rounded"></div>
  }

  return (
    <div className="flex items-center mt-1 text-sm">
      <span className="mr-2">Available Stock:</span>
      {isLowStock ? (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>{count} (Low)</span>
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
          <span>{count} Available</span>
        </Badge>
      )}
    </div>
  )
}

