
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
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    } else {
        setIsCollapsed(false);
    }
  }, [isMobile]);

  const value = {
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
  return (
    <div
      ref={ref}
      className={cn('flex h-full max-h-screen flex-col gap-2', className)}
      {...props}
    >
      {children}
    </div>
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
  <div ref={ref} className={cn('flex-1', className)} {...props} />
));
SidebarContent.displayName = 'SidebarContent';

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => {
  return <ul ref={ref} className={cn('grid gap-y-1 p-2 md:px-4', className)} {...props} />;
});
SidebarMenu.displayName = 'SidebarMenu';


export const SidebarMenuItem = React.forwardRef<
    HTMLLIElement,
    React.HTMLAttributes<HTMLLIElement>
  >(({ className, ...props }, ref) => (
    <li ref={ref} className={cn('grid', className)} {...props} />
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
    const { isCollapsed } = useSidebar();
    const isActive = pathname === href;
  
    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={href}>
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
      <Link href={href}>
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
