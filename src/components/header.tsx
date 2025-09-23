
'use client';

import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";
import { Upload, Languages, PanelLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/context/i18n-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";


export default function Header() {
  const pathname = usePathname();
  const { t, setLocale, locale } = useI18n();
  const { isMobile } = useSidebar();

  const getTitle = (pathname: string) => {
    switch (pathname) {
      case "/dashboard":
        return t('Dashboard');
      case "/dashboard/analyze":
        return t('New Analysis');
      case "/dashboard/history":
        return t('Analysis History');
      case "/dashboard/review":
        return t('Review Queue');
      default:
        return "AgriAssist";
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'ml', name: 'മലയാളം' },
  ];


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
       {isMobile && (
        <SidebarTrigger>
          <PanelLeft />
          <span className="sr-only">Toggle Menu</span>
        </SidebarTrigger>
       )}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold font-headline text-foreground">{getTitle(pathname)}</h1>
      </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/dashboard/analyze">
            <Upload className="mr-2" />
            {t('New Analysis')}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Languages className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Change language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLocale(lang.code)}
                className={locale === lang.code ? 'font-bold' : ''}
              >
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <UserNav />
      </div>
    </header>
  );
}


