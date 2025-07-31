'use client'

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "@/providers/theme-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by showing neutral state before mount
  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-1 p-1 bg-toss-gray-100 dark:bg-toss-gray-800 rounded-lg border border-toss-gray-200 dark:border-toss-gray-700", className)}>
        <Button variant="ghost" size="sm" className="gap-2" disabled>
          <Sun className="h-4 w-4" />
          <span className="hidden sm:inline">라이트</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2" disabled>
          <Moon className="h-4 w-4" />
          <span className="hidden sm:inline">다크</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2" disabled>
          <Monitor className="h-4 w-4" />
          <span className="hidden sm:inline">시스템</span>
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1 p-1 bg-toss-gray-100 dark:bg-toss-gray-800 rounded-lg border border-toss-gray-200 dark:border-toss-gray-700", className)}>
      <Button
        variant={theme === "light" ? "primary" : "ghost"}
        size="sm"
        onClick={() => setTheme("light")}
        className="gap-2"
      >
        <Sun className="h-4 w-4" />
        <span className="hidden sm:inline">라이트</span>
      </Button>
      <Button
        variant={theme === "dark" ? "primary" : "ghost"}
        size="sm"
        onClick={() => setTheme("dark")}
        className="gap-2"
      >
        <Moon className="h-4 w-4" />
        <span className="hidden sm:inline">다크</span>
      </Button>
      <Button
        variant={theme === "system" ? "primary" : "ghost"}
        size="sm"
        onClick={() => setTheme("system")}
        className="gap-2"
      >
        <Monitor className="h-4 w-4" />
        <span className="hidden sm:inline">시스템</span>
      </Button>
    </div>
  )
}