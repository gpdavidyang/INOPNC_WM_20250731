'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { useFontSize,  getTypographyClass, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    elevation?: 'sm' | 'md' | 'lg' | 'xl'
    premium?: boolean
  }
>(({ className, elevation = 'sm', premium = false, ...props }, ref) => {
  const { touchMode } = useTouchMode()
  
  const touchModeClasses = {
    normal: "p-4",
    glove: "p-6",
    precision: "p-3"
  }
  
  const elevationClasses = {
    sm: "elevation-sm hover:elevation-md",
    md: "elevation-md hover:elevation-lg",
    lg: "elevation-lg hover:elevation-xl",
    xl: "elevation-xl"
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-gray-200 dark:border-gray-700",
        "theme-transition elevation-hover",
        premium 
          ? "bg-premium-light dark:bg-premium-dark" 
          : "bg-white dark:bg-gray-800",
        elevationClasses[elevation],
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
        "font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100",
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
        "text-gray-500 dark:text-gray-400",
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