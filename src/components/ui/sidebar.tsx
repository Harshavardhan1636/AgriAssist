
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';
import { PanelLeft, PanelLeftClose, PanelRightClose } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = React.useState(isMobile);

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

export function MobileSidebar({children}: {children: React.ReactNode}) {
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
        <SheetHeader className="h-14 flex items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <SheetTitle>AgriAssist</SheetTitle>
            </Link>
        </SheetHeader>
        {children}
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
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mt-auto', className)} {...props} />
));
SidebarFooter.displayName = 'SidebarFooter';


type SidebarMenuButtonProps = {
    href: string;
    label: string;
    icon: React.ElementType;
};

export const SidebarMenuLink = ({ href, label, icon: Icon }: SidebarMenuButtonProps) => {
    const pathname = usePathname();
    const { isCollapsed, isMobile, setIsOpen } = useSidebar();
    const isActive = pathname === href;
  
    const handleClick = () => {
      if (isMobile) {
        setIsOpen(false);
      }
    };
  
    if (isCollapsed) {
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
  

