
"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button, type ButtonProps } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "./sheet"
import { PanelLeft } from "lucide-react"
import AppSidebar from "../app-sidebar"


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
  const [isCollapsed, setIsCollapsed] = React.useState(isMobile)

  React.useEffect(() => {
    setIsCollapsed(isMobile)
  },[isMobile])


  return (
    <SidebarContext.Provider
      value={{ isOpen, setIsOpen, isMobile, isCollapsed, setIsCollapsed }}
    >
      <TooltipProvider>{children}</TooltipProvider>
    </SidebarContext.Provider>
  )
}

export const MobileSidebar = () => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs p-0">
                <AppSidebar />
            </SheetContent>
        </Sheet>
    )
}


export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { isCollapsed } = useSidebar()

  return (
    <aside
        ref={ref}
        className={cn(
            "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-[width]",
            isCollapsed ? "w-14" : "w-64",
            className
        )}
        {...props}
    >
      {children}
    </aside>
  )
})
Sidebar.displayName = "Sidebar"

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6",
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
  <div ref={ref} className={cn("flex-grow overflow-y-auto", className)} {...props} />
))
SidebarContent.displayName = "SidebarContent"

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => {
  const { isCollapsed } = useSidebar();
  return (
    <ul
      ref={ref}
      className={cn(
        "flex flex-col gap-y-1 p-2",
        isCollapsed ? "items-center" : "items-stretch",
        className
      )}
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
    isCollapsed?: boolean
  }
>(({ className, isActive, tooltip, children, isCollapsed, ...props }, ref) => {

    if (isCollapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                <Button
                    ref={ref}
                    variant={isActive ? "secondary" : "ghost"}
                    size="icon"
                    className={cn("rounded-lg", className)}
                    {...props}
                >
                    {children}
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
            size="default"
            className={cn("rounded-lg justify-start", className)}
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
  <div ref={ref} className={cn("mt-auto p-2", className)} {...props} />
))
SidebarFooter.displayName = "SidebarFooter"

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isMobile, isCollapsed } = useSidebar()
  
  if (isMobile) {
    return <div ref={ref} className={cn("", className)} {...props} />;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[padding-left]",
        isCollapsed ? "sm:pl-14" : "sm:pl-64",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"
