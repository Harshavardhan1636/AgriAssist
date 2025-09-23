'use client';

import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";
import { Languages, PanelLeft, PanelLeftClose, PanelRightClose } from "lucide-react";
import { useI18n } from "@/context/i18n-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "./ui/sidebar";
import { SheetTrigger } from "./ui/sheet";


export default function Header() {
  const { setLocale, locale } = useI18n();
  const { isCollapsed, setIsCollapsed, isMobile, setIsOpen } = useSidebar();


  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'ml', name: 'മലയാളം' },
  ];


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        
        {isMobile ? (
          <SheetTrigger asChild>
            <Button size="icon" variant="outline">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
        ) : (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {isCollapsed ? <PanelRightClose /> : <PanelLeftClose />}
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
        )}
      
      <div className="flex flex-1 items-center justify-end gap-4">
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
