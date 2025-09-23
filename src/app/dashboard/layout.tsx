
'use client';

import * as React from 'react';
import AppSidebar from '@/components/app-sidebar';
import Header from '@/components/header';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useI18n } from '@/context/i18n-context';
import { cn } from '@/lib/utils';
import ClientOnly from '@/components/client-only';
import { useToast } from '@/hooks/use-toast';
import { communityOutbreaks } from '@/lib/mock-data';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed, isMobile } = useSidebar();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    // Simulate checking for new high-risk community alerts on load
    const highRiskAlerts = communityOutbreaks.filter(o => o.riskLevel === 'High');
    if (highRiskAlerts.length > 0) {
        const latestAlert = highRiskAlerts[0];
        setTimeout(() => {
            toast({
              title: (
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  {t('Community Alert')}
                </div>
              ),
              description: (
                <div>
                  <p>{t('High-risk outbreak detected')}: <strong>{t(latestAlert.disease as any)}</strong> {t('in')} {latestAlert.location}.</p>
                  <Link href="/dashboard/community">
                    <Button variant="link" className="p-0 h-auto mt-2">{t('View Details')}</Button>
                  </Link>
                </div>
              ),
              variant: 'destructive',
              duration: 15000, 
            });
        }, 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn(
      "grid min-h-screen w-full",
      !isMobile && "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]",
      !isMobile && isCollapsed && "md:grid-cols-[68px_1fr] lg:grid-cols-[68px_1fr]"
    )}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0" withCloseButton={true}>
          <SheetHeader className='p-4 border-b'>
            <SheetTitle className='text-left'>{t('AgriAssist Menu')}</SheetTitle>
          </SheetHeader>
          <AppSidebar isMobile={true} />
        </SheetContent>
      </Sheet>

      <div className={cn("hidden border-r bg-muted/40 md:block h-screen sticky top-0")}>
        <AppSidebar />
      </div>

      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
          <Header onMenuClick={() => setIsOpen(true)} />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
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
  )
}
