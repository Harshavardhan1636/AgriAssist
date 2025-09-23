
'use client';

import { useState } from 'react';
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";
import { Languages, PanelLeft, ShoppingCart } from "lucide-react";
import { useI18n } from "@/context/i18n-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from '@/context/cart-context';
import { Badge } from './ui/badge';
import CartSheet from './cart-sheet';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { setLocale, locale } = useI18n();
  const { cart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartItemCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'ml', name: 'മലയാളം' },
  ];

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="shrink-0 md:hidden"
        onClick={onMenuClick}
      >
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>
      
      <div className="flex w-full flex-1 items-center justify-end gap-4">
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

        <Button variant="outline" size="icon" className="relative" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart className="h-[1.2rem] w-[1.2rem]" />
            {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{cartItemCount}</Badge>
            )}
            <span className="sr-only">Open cart</span>
        </Button>

        <UserNav />
      </div>
      <CartSheet isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}
