import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-toss-blue-500 hover:bg-toss-blue-600 text-white shadow-md hover:shadow-lg",
        secondary: "bg-toss-gray-100 dark:bg-toss-gray-800 hover:bg-toss-gray-200 dark:hover:bg-toss-gray-700 text-toss-gray-900 dark:text-toss-gray-100",
        danger: "bg-red-500 hover:bg-red-600 text-white",
        ghost: "hover:bg-toss-gray-100 dark:hover:bg-toss-gray-800 text-toss-gray-700 dark:text-toss-gray-300",
        outline: "border border-toss-gray-200 dark:border-toss-gray-700 hover:bg-toss-gray-100 dark:hover:bg-toss-gray-800 text-toss-gray-700 dark:text-toss-gray-300"
      },
      size: {
        sm: "px-4 py-2 text-sm min-h-[40px]",
        md: "px-6 py-3 text-base min-h-[48px]",
        lg: "px-8 py-4 text-lg min-h-[56px]",
        full: "w-full px-6 py-3 text-base min-h-[50px]"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }