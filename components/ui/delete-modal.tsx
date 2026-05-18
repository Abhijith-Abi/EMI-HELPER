"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  itemName?: string
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description = "This action is permanent and cannot be undone. All related historical records will be cleared.",
  itemName
}: DeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-card/80 p-6 shadow-2xl backdrop-blur-2xl glassmorphism"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Warning Alert Icon Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive border border-destructive/20 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                {itemName && (
                  <p className="text-sm font-semibold text-primary mt-0.5">
                    Target: {itemName}
                  </p>
                )}
              </div>
            </div>

            {/* Description Body */}
            <div className="mt-2 mb-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>

            {/* Action Buttons Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto border-border bg-transparent hover:bg-accent transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                className="w-full sm:w-auto shadow-lg shadow-destructive/20 hover:shadow-destructive/40 transition-all duration-200"
              >
                Confirm Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
