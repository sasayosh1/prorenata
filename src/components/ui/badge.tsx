import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-professional-100 text-professional-800 hover:bg-professional-200 dark:bg-professional-800 dark:text-professional-200",
        medical:
          "border-transparent bg-medical-100 text-medical-800 hover:bg-medical-200 dark:bg-medical-900 dark:text-medical-200",
        clean:
          "border-transparent bg-clean-100 text-clean-800 hover:bg-clean-200 dark:bg-clean-900 dark:text-clean-200",
        outline:
          "border-professional-200 text-professional-700 dark:border-professional-600 dark:text-professional-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }