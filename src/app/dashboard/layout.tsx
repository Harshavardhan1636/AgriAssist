
'use client';

import * as React from 'react';
import AppSidebar from '@/components/app-sidebar';
import Header from '@/components/header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useI18n } from '@/context/i18n-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { t } = useI18n();

  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        {/* Mobile Sidebar in a Sheet */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="p-0" withCloseButton={true}>
            <SheetHeader className='p-4 border-b'>
              <SheetTitle className='text-left'>{t('AgriAssist Menu')}</SheetTitle>
            </SheetHeader>
            <AppSidebar isMobile={true} />
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden border-r bg-muted/40 md:block">
          <AppSidebar />
        </div>

        {/* Main Content */}
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Header onMenuClick={() => setIsOpen(true)} />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
