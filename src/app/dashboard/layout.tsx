
'use client';

import AppSidebar from '@/components/app-sidebar';
import Header from '@/components/header';
import ClientOnly from '@/components/client-only';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/i18n-context';


function DashboardLayoutContent({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const { isCollapsed, isMobile, isOpen, setIsOpen } = useSidebar();
    const { t } = useI18n();
  
    if (isMobile) {
      return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Header />
            <main className="flex-1 gap-4 p-4 md:gap-8 md:p-6">
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
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AppSidebar />
        <div className={cn("flex flex-col sm:py-4 transition-[padding-left]", isCollapsed ? 'sm:pl-14' : 'sm:pl-64')}>
          <Header />
          <main className="flex-1 gap-4 p-4 md:gap-8 md:p-6">
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
