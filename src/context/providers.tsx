'use client';

import { I18nProvider } from './i18n-context';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './auth-context';
import { CartProvider } from './cart-context';
import { GlobalSpeechController } from '@/components/global-speech-controller';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
      <AuthProvider>
        <I18nProvider>
            <CartProvider>
                {children}
                <Toaster />
                <GlobalSpeechController />
            </CartProvider>
        </I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}