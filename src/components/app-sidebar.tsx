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
import { Leaf, LayoutDashboard, History, FlaskConical, LifeBuoy, Users, ChevronLeft, Cloudy, MessageSquare, Sprout, ShoppingCart, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/context/i18n-context';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

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
    const { t, locale } = useI18n();
    const { isCollapsed } = useSidebar();
    const [menuItems, setMenuItems] = useState([
      { href: '/dashboard', label: t('Dashboard'), icon: LayoutDashboard },
      { href: '/dashboard/analyze', label: t('New Analysis'), icon: FlaskConical },
      { href: '/dashboard/history', label: t('History'), icon: History },
      { href: '/dashboard/conversations', label: t('AI Conversations'), icon: MessageSquare },
      { href: '/dashboard/forecast', label: t('Forecast'), icon: Cloudy },
      { href: '/dashboard/crop-planning', label: t('Crop Planning'), icon: Sprout },
      { href: '/dashboard/store', label: t('Store'), icon: ShoppingCart },
      { href: '/dashboard/community', label: t('Community Outbreak Alerts'), icon: Users },
      { href: '/dashboard/knowledge-sharing', label: t('Knowledge Sharing'), icon: Share2 },
      { href: '/dashboard/review', label: t('Review Queue'), icon: LifeBuoy },
    ]);

    // Update menu items when locale changes
    useEffect(() => {
      setMenuItems([
        { href: '/dashboard', label: t('Dashboard'), icon: LayoutDashboard },
        { href: '/dashboard/analyze', label: t('New Analysis'), icon: FlaskConical },
        { href: '/dashboard/history', label: t('History'), icon: History },
        { href: '/dashboard/conversations', label: t('AI Conversations'), icon: MessageSquare },
        { href: '/dashboard/forecast', label: t('Forecast'), icon: Cloudy },
        { href: '/dashboard/crop-planning', label: t('Crop Planning'), icon: Sprout },
        { href: '/dashboard/store', label: t('Store'), icon: ShoppingCart },
        { href: '/dashboard/community', label: t('Community Outbreak Alerts'), icon: Users },
        { href: '/dashboard/knowledge-sharing', label: t('Knowledge Sharing'), icon: Share2 },
        { href: '/dashboard/review', label: t('Review Queue'), icon: LifeBuoy },
      ]);
    }, [t, locale]);

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
            <SidebarMenuItem key={item.href}>
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
        <SidebarToggle />
        </SidebarFooter>
    </Sidebar>
    )
}