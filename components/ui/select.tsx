import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-12 w-full rounded-lg border border-toss-gray-200 dark:border-toss-gray-700 bg-white dark:bg-toss-gray-800 px-3 py-2 text-base text-toss-gray-900 dark:text-toss-gray-100 ring-offset-white dark:ring-offset-toss-gray-900 hover:border-toss-gray-300 dark:hover:border-toss-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-toss-gray-200 dark:disabled:hover:border-toss-gray-700 appearance-none pr-10 cursor-pointer transition-colors",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-toss-gray-500 pointer-events-none" />
      </div>
    )
  }
)
Select.displayName = "Select"

export interface SelectItemProps
  extends React.OptionHTMLAttributes<HTMLOptionElement> {}

const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <option
        ref={ref}
        className={cn(
          "text-toss-gray-900 dark:text-toss-gray-100",
          className
        )}
        {...props}
      />
    )
  }
)
SelectItem.displayName = "SelectItem"

export { Select, SelectItem }