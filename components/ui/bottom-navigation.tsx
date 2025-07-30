'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

export interface BottomNavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string | number
}

interface BottomNavigationProps extends React.HTMLAttributes<HTMLElement> {
  items: BottomNavItem[]
}

const BottomNavigation = React.forwardRef<HTMLElement, BottomNavigationProps>(
  ({ className, items, ...props }, ref) => {
    const pathname = usePathname()

    return (
      <nav
        ref={ref}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 h-[50px] border-t border-toss-gray-200 dark:border-toss-gray-700 bg-white dark:bg-toss-gray-900 md:hidden",
          className
        )}
        {...props}
      >
        <div className="flex h-full items-center justify-around">
          {items.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "relative flex h-full w-full min-w-[50px] flex-col items-center justify-center gap-1 text-xs transition-colors",
                  isActive
                    ? "text-toss-blue-500"
                    : "text-toss-gray-500 dark:text-toss-gray-400 hover:text-toss-gray-700 dark:hover:text-toss-gray-200"
                )}
              >
                <div className="relative">
                  {React.cloneElement(item.icon as React.ReactElement, {
                    className: "h-5 w-5"
                  })}
                  {item.badge && (
                    <div className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {item.badge}
                    </div>
                  )}
                </div>
                <span className="text-[10px]">{item.label}</span>
              </Link>
            )
          })}
        </div>
        {/* Safe area for iOS */}
        <div className="h-safe-area-inset-bottom" />
      </nav>
    )
  }
)
BottomNavigation.displayName = "BottomNavigation"

export { BottomNavigation }