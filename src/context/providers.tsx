
'use client';

import { I18nProvider } from './i18n-context';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './auth-context';

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
          {children}
          <Toaster />
        </I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
