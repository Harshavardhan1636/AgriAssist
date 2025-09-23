
"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button, type ButtonProps } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type SidebarContextProps = {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  isMobile: boolean
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}
const SidebarContext = React.createContext<SidebarContextProps | undefined>(
  undefined
)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isCollapsed, setIsCollapsed] = React.useState(true) // Start collapsed on desktop

  return (
    <SidebarContext.Provider
      value={{ isOpen, setIsOpen, isMobile, isCollapsed, setIsCollapsed }}
    >
      <TooltipProvider>{children}</TooltipProvider>
    </SidebarContext.Provider>
  )
}

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, ...props }, ref) => {
  const { isMobile, isOpen, setIsOpen } = useSidebar()
  if (!isMobile) return null
  return (
    <SheetTrigger asChild>
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn("md:hidden", className)}
        {...props}
        onClick={() => setIsOpen(!isOpen)}
      />
    </SheetTrigger>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { isMobile, isOpen, setIsOpen, isCollapsed, setIsCollapsed } =
    useSidebar()

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0">
          <div ref={ref} className={cn("flex h-full flex-col", className)}>
            {children}
          </div>
        </SheetContent>
      </Sheet>
    )
  }
  return (
    <div
      ref={ref}
      className={cn(
        "hidden md:fixed md:left-0 md:top-0 md:z-20 md:flex md:h-dvh md:flex-col md:border-r",
        isCollapsed ? "w-16" : "w-64",
        "transition-[width]",
        className
      )}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
      {...props}
    >
      {children}
    </div>
  )
})
Sidebar.displayName = "Sidebar"

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isCollapsed } = useSidebar()
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-16 shrink-0 items-center border-b",
        isCollapsed ? "justify-center" : "px-4",
        className
      )}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-grow", className)} {...props} />
))
SidebarContent.displayName = "SidebarContent"

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => {
  return (
    <ul
      ref={ref}
      className={cn("flex flex-col gap-y-1 p-2", className)}
      {...props}
    />
  )
})
SidebarMenu.displayName = "SidebarMenu"

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn(className)} {...props} />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    isActive?: boolean
    tooltip?: string
  }
>(({ className, isActive, tooltip, children, ...props }, ref) => {
  const { isMobile, isCollapsed } = useSidebar()

  if (isCollapsed && !isMobile) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant={isActive ? "secondary" : "ghost"}
            size="icon"
            className={cn("w-full", className)}
            {...props}
          >
            {React.Children.map(children, (child) =>
              React.isValidElement(child) && child.type === "span" ? null : child
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Button
      ref={ref}
      variant={isActive ? "secondary" : "ghost"}
      className={cn("w-full justify-start", className)}
      {...props}
    >
      {children}
    </Button>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mt-auto border-t", className)} {...props} />
))
SidebarFooter.displayName = "SidebarFooter"

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isCollapsed } = useSidebar()
  return (
    <div
      ref={ref}
      className={cn(
        "md:pl-64",
        isCollapsed ? "md:pl-16" : "md:pl-64",
        "transition-[padding-left]",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"
