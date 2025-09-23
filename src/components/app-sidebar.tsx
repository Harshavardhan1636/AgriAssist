
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
import { Leaf, LayoutDashboard, History, FlaskConical, LifeBuoy, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/context/i18n-context';
import { useSidebar } from './ui/sidebar';


export default function AppSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { isCollapsed, isMobile, setIsOpen } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };


  const menuItems = [
    { href: '/dashboard', label: t('Dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/analyze', label: t('New Analysis'), icon: FlaskConical },
    { href: '/dashboard/history', label: t('History'), icon: History },
    { href: '/dashboard/community', label: t('Community Outbreaks'), icon: Users },
    { href: '/dashboard/review', label: t('Review Queue'), icon: LifeBuoy },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <Leaf className="h-6 w-6 text-primary" />
                {!isCollapsed && <span className="">AgriAssist</span>}
            </Link>
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
                isCollapsed={isCollapsed}
              >
                <Link href={item.href} onClick={handleLinkClick}>
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
                <SidebarMenuButton tooltip={t('Settings')} isCollapsed={isCollapsed}>
                    <Settings />
                    <span>{t('Settings')}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
