'use client';

import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
      setIsOpen(false);
    } else {
      setIsCollapsed(false);
    }
  }, [isMobile]);

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

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { isCollapsed } = useSidebar();
  
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
        'flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6',
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


export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('mt-auto', className)} {...props} />
});
SidebarFooter.displayName = 'SidebarFooter';


type SidebarMenuLinkProps = {
    href: string;
    label: string;
    icon: React.ElementType;
};

export const SidebarMenuLink = ({ href, label, icon: Icon }: SidebarMenuLinkProps) => {
    const pathname = usePathname();
    const { isCollapsed, isMobile, setIsOpen } = useSidebar();
    const isActive = pathname === href;
  
    const handleClick = () => {
      if (isMobile) {
        setIsOpen(false);
      }
    };
  
    if (isCollapsed && !isMobile) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={href} onClick={handleClick}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                size="icon"
                className="w-full rounded-lg"
              >
                <Icon className="h-5 w-5" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
  
    return (
      <Link href={href} onClick={handleClick}>
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          size="default"
          className="w-full justify-start gap-2 rounded-lg"
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </Button>
      </Link>
    );
};
