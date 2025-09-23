
'use client';

import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';
import { PanelLeft } from 'lucide-react';
import AppSidebar from '../app-sidebar';
import { usePathname } from 'next/navigation';

type SidebarContextProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

const SidebarContext = React.createContext<SidebarContextProps | undefined>(
  undefined
);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(isMobile);

  React.useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
      setIsOpen(false);
    } else {
      setIsCollapsed(false);
    }
  }, [isMobile]);

  React.useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  const value = {
    isOpen,
    setIsOpen,
    isMobile,
    isCollapsed,
    setIsCollapsed,
  };

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider>{children}</TooltipProvider>
    </SidebarContext.Provider>
  );
}

export function MobileSidebar() {
  const { isOpen, setIsOpen, isMobile } = useSidebar();

  if (!isMobile) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs p-0" withCloseButton={false}>
        <AppSidebar />
      </SheetContent>
    </Sheet>
  );
}

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { isCollapsed, isMobile } = useSidebar();

  if (isMobile) return null;

  return (
    <aside
      ref={ref}
      className={cn(
        'fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-[width]',
        isCollapsed ? 'w-14' : 'w-64',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
});
Sidebar.displayName = 'Sidebar';

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex h-14 items-center justify-center px-4 lg:h-[60px] lg:px-6',
        className
      )}
      {...props}
    />
  );
});
SidebarHeader.displayName = 'SidebarHeader';

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex-grow overflow-y-auto', className)} {...props} />
));
SidebarContent.displayName = 'SidebarContent';

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => {
  return <ul ref={ref} className={cn('flex flex-col gap-y-1 p-2', className)} {...props} />;
});
SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn(className)} {...props} />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    isActive?: boolean;
    tooltip?: string;
    asChild?: boolean;
  }
>(({ className, isActive, tooltip, children, asChild, ...props }, ref) => {
  const { isCollapsed } = useSidebar();
  const Comp = asChild ? 'div' : Button;

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Comp
            ref={ref}
            variant={isActive ? 'secondary' : 'ghost'}
            size="icon"
            className={cn('rounded-lg', className)}
            {...props}
          >
            {children}
          </Comp>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Comp
      ref={ref}
      variant={isActive ? 'secondary' : 'ghost'}
      size="default"
      className={cn(
        'rounded-lg justify-start [&>span]:w-0 [&>span]:opacity-0 [&>span]:-translate-x-2',
        !isCollapsed && '[&>span]:w-auto [&>span]:opacity-100 [&>span]:translate-x-0',
        'transition-all duration-300 ease-in-out',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});
SidebarMenuButton.displayName = 'SidebarMenuButton';

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mt-auto', className)} {...props} />
));
SidebarFooter.displayName = 'SidebarFooter';
