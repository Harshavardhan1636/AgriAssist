
'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Leaf, LayoutDashboard, History, FlaskConical, LifeBuoy, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/context/i18n-context';
import { useSidebar } from './ui/sidebar';


export default function AppSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { isCollapsed } = useSidebar();


  const menuItems = [
    { href: '/dashboard', label: t('Dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/analyze', label: t('New Analysis'), icon: FlaskConical },
    { href: '/dashboard/history', label: t('History'), icon: History },
    { href: '/dashboard/review', label: t('Review Queue'), icon: LifeBuoy },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <Leaf className="h-8 w-8 text-primary" />
            <span className={isCollapsed ? 'hidden' : 'inline'}>
                <h1 className="text-xl font-bold font-headline">AgriAssist</h1>
            </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('Settings')}>
                    <Settings />
                    <span>{t('Settings')}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
