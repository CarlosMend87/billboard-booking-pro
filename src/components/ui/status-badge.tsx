import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        available: "bg-status-available/10 text-status-available border border-status-available/20",
        reserved: "bg-status-reserved/10 text-status-reserved border border-status-reserved/20",
        confirmed: "bg-status-confirmed/10 text-status-confirmed border border-status-confirmed/20",
        occupied: "bg-status-occupied/10 text-status-occupied border border-status-occupied/20",
      },
    },
    defaultVariants: {
      variant: "available",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props} />
  )
}

export { StatusBadge, statusBadgeVariants }