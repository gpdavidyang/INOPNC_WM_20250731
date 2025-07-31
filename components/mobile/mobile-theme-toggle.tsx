'use client'

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/providers/theme-provider"
import { cn } from "@/lib/utils"

interface MobileThemeToggleProps {
  className?: string
}

export default function MobileThemeToggle({ className }: MobileThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors",
        "text-gray-700 hover:text-gray-900 hover:bg-gray-50",
        "dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800",
        className
      )}
    >
      <div className="flex items-center">
        {theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? (
          <Moon className="mr-3 h-5 w-5" />
        ) : (
          <Sun className="mr-3 h-5 w-5" />
        )}
        <span>테마</span>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {theme === "light" && "라이트"}
        {theme === "dark" && "다크"}
        {theme === "system" && "시스템"}
      </span>
    </button>
  )
}

export function MobileThemeToggleCompact({ className }: MobileThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-lg transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
      aria-label="테마 변경"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      ) : (
        <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      )}
    </button>
  )
}