import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border border-toss-gray-200 dark:border-toss-gray-700 bg-white dark:bg-toss-gray-800 px-3 py-2 text-base text-toss-gray-900 dark:text-toss-gray-100 ring-offset-white dark:ring-offset-toss-gray-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-toss-gray-500 dark:placeholder:text-toss-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }