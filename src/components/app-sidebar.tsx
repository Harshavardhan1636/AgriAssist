
'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuLink,
} from '@/components/ui/sidebar';
import { Leaf, LayoutDashboard, History, FlaskConical, LifeBuoy, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/context/i18n-context';


export default function AppSidebar({isMobile = false}: {isMobile?: boolean}) {
    const { t } = useI18n();
  
    const menuItems = [
      { href: '/dashboard', label: t('Dashboard'), icon: LayoutDashboard },
      { href: '/dashboard/analyze', label: t('New Analysis'), icon: FlaskConical },
      { href: '/dashboard/history', label: t('History'), icon: History },
      { href: '/dashboard/community', label: t('Community Outbreak Alerts'), icon: Users },
      { href: '/dashboard/review', label: t('Review Queue'), icon: LifeBuoy },
    ];
  
    const settingsItem = { href: '#', label: t('Settings'), icon: Settings };

    return (
    <Sidebar isMobile={isMobile}>
        <SidebarHeader>
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <Leaf className="h-6 w-6 text-primary" />
                <span className="">AgriAssist</span>
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
                />
            </SidebarMenuItem>
        </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
    )
}

    