
'use client';

import AppSidebar from '@/components/app-sidebar';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { SidebarProvider, MobileSidebar, useSidebar } from '@/components/ui/sidebar';
import { PanelLeft } from 'lucide-react';

function MobileMenuTrigger() {
  const { isMobile, isOpen, setIsOpen } = useSidebar();

  if (!isMobile || isOpen) return null;

  return (
    <Button 
      size="icon" 
      variant="outline" 
      className="sm:hidden fixed top-3 left-4 z-40"
      onClick={() => setIsOpen(true)}
    >
      <PanelLeft className="h-5 w-5" />
      <span className="sr-only">Toggle Menu</span>
    </Button>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AppSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <MobileMenuTrigger />
          <Header />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
        <MobileSidebar>
            <AppSidebar />
        </MobileSidebar>
      </div>
    </SidebarProvider>
  );
}
