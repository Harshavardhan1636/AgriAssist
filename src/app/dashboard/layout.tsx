
'use client';

import AppSidebar from '@/components/app-sidebar';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';


function DashboardLayoutContent({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const { isCollapsed, isMobile, isOpen, setIsOpen } = useSidebar();
  
    if (isMobile) {
      return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
           <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="sm:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <Header />
            </header>
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
            </main>
          </div>
          <SheetContent side="left" className="p-0" withCloseButton={true}>
            <AppSidebar />
          </SheetContent>
        </Sheet>
      );
    }
  
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AppSidebar />
        <div className={cn("flex flex-col sm:gap-4 sm:py-4 transition-[padding-left]", isCollapsed ? 'sm:pl-14' : 'sm:pl-64')}>
          <Header />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
      </div>
    );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
