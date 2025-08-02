'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { useFontSize,  getTypographyClass, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { touchMode } = useTouchMode()
  
  const touchModeClasses = {
    normal: "p-4",
    glove: "p-6",
    precision: "p-3"
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "bg-white dark:bg-toss-gray-800 backdrop-blur-sm border border-toss-gray-200 dark:border-toss-gray-700 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all duration-300",
        touchModeClasses[touchMode],
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { touchMode } = useTouchMode()
  
  const touchModeClasses = {
    normal: "p-4",
    glove: "p-6",
    precision: "p-3"
  }
  
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5", touchModeClasses[touchMode], className)}
      {...props}
    />
  )
})
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const { isLargeFont } = useFontSize()
  
  return (
    <h3
      ref={ref}
      className={cn(
        getFullTypographyClass('heading', 'xl', isLargeFont),
        "font-semibold leading-none tracking-tight text-toss-gray-900 dark:text-toss-gray-100",
        className
      )}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { isLargeFont } = useFontSize()
  
  return (
    <p
      ref={ref}
      className={cn(
        getFullTypographyClass('body', 'sm', isLargeFont),
        "text-toss-gray-500 dark:text-toss-gray-400",
        className
      )}
      {...props}
    />
  )
})
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { touchMode } = useTouchMode()
  
  const touchModeClasses = {
    normal: "p-4 pt-0",
    glove: "p-6 pt-0",
    precision: "p-3 pt-0"
  }
  
  return (
    <div ref={ref} className={cn(touchModeClasses[touchMode], className)} {...props} />
  )
})
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { touchMode } = useTouchMode()
  
  const touchModeClasses = {
    normal: "p-4 pt-0",
    glove: "p-6 pt-0",
    precision: "p-3 pt-0"
  }
  
  return (
    <div
      ref={ref}
      className={cn("flex items-center", touchModeClasses[touchMode], className)}
      {...props}
    />
  )
})
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }