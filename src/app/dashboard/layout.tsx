
'use client';

import AppSidebar from '@/components/app-sidebar';
import Header from '@/components/header';
import ClientOnly from '@/components/client-only';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/i18n-context';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';


function DashboardLayoutContent({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const { isCollapsed, isMobile } = useSidebar();
    const { t } = useI18n();
    const [isOpen, setIsOpen] = React.useState(false);
  
    if (isMobile) {
      return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="sm:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <Header />
            </header>
            <main className="flex-1 p-4 overflow-x-hidden">
              {children}
            </main>
          </div>
          <SheetContent side="left" className="p-0" withCloseButton={true}>
            <SheetHeader className='p-4 border-b'>
                <SheetTitle className='text-left'>{t('AgriAssist Menu')}</SheetTitle>
            </SheetHeader>
            <AppSidebar />
          </SheetContent>
        </Sheet>
      );
    }
  
    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <div className={cn("hidden border-r bg-muted/40 md:block", isCollapsed && "md:hidden")}>
              <AppSidebar />
          </div>
          <div className="flex flex-col">
              <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                <Header />
              </header>
              <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-x-hidden">
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
        <ClientOnly>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </ClientOnly>
    </SidebarProvider>
  );
}
