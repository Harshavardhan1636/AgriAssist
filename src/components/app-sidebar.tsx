
'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuLink,
  useSidebar,
} from '@/components/ui/sidebar';
import { Leaf, LayoutDashboard, History, FlaskConical, LifeBuoy, Settings, Users, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/context/i18n-context';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';


const SidebarToggle = () => {
    const { isCollapsed, setIsCollapsed } = useSidebar();

    if (!setIsCollapsed) return null;

    return (
        <div className="hidden md:flex justify-end p-2">
            <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <ChevronLeft
                className={cn(
                    'h-6 w-6 transition-transform',
                    isCollapsed && 'rotate-180'
                )}
                />
            </Button>
        </div>
    );
}


export default function AppSidebar({isMobile = false}: {isMobile?: boolean}) {
    const { t } = useI18n();
    const { isCollapsed } = useSidebar();
  
    const menuItems = [
      { href: '/dashboard', label: t('Dashboard'), icon: LayoutDashboard },
      { href: '/dashboard/analyze', label: t('New Analysis'), icon: FlaskConical },
      { href: '/dashboard/history', label: t('History'), icon: History },
      { href: '/dashboard/community', label: t('Community Outbreak Alerts'), icon: Users },
      { href: '/dashboard/review', label: t('Review Queue'), icon: LifeBuoy },
    ];
  
    const settingsItem = { href: '/dashboard/settings', label: t('Settings'), icon: Settings };

    return (
    <Sidebar isMobile={isMobile}>
        <SidebarHeader>
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <Leaf className="h-6 w-6 text-primary" />
                <span className={cn(isCollapsed && 'hidden')}>{!isMobile && "AgriAssist"}</span>
            </Link>
        </SidebarHeader>
        <SidebarContent>
        <SidebarMenu>
            {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
                <SidebarMenuLink 
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isMobile={isMobile}
                />
            </SidebarMenuItem>
            ))}
        </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuLink 
                    href={settingsItem.href}
                    label={settingsItem.label}
                    icon={settingsItem.icon}
                    isMobile={isMobile}
                />
            </SidebarMenuItem>
        </SidebarMenu>
        <SidebarToggle />
        </SidebarFooter>
    </Sidebar>
    )
}
