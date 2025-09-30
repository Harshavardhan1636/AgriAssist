'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import te from '@/locales/te.json';
import ta from '@/locales/ta.json';
import ml from '@/locales/ml.json';

const translations: Record<string, any> = { en, hi, te, ta, ml };

type I18nContextType = {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState('en');

  // Effect to run only on the client
  useEffect(() => {
    // Check for saved language preference
    const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('preferredLanguage') : null;
    const autoTranslateEnabled = typeof window !== 'undefined' ? localStorage.getItem('autoTranslateEnabled') === 'true' : true;
    
    if (savedLanguage && autoTranslateEnabled && translations[savedLanguage]) {
      setLocale(savedLanguage);
    } else {
      // Fallback to browser language
      const browserLang = navigator.language.split('-')[0];
      if (translations[browserLang]) {
        setLocale(browserLang);
      }
    }
  }, []);

  const t = (key: string): string => {
    // Handle empty or invalid keys
    if (!key || typeof key !== 'string') {
      return '';
    }
    
    // Fallback to English if the key is not found in the current locale
    const messages = translations[locale] || translations.en;
    
    // If the key doesn't exist in the current language, fallback to English
    if (!messages[key]) {
      console.warn(`Translation key "${key}" not found for locale "${locale}", falling back to English`);
      return translations.en[key] || key;
    }
    
    return messages[key];
  };

  const value = {
    locale,
    setLocale: (newLocale: string) => {
      // Validate that the locale exists
      if (translations[newLocale]) {
        setLocale(newLocale);
        // Save the preference to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('preferredLanguage', newLocale);
          localStorage.setItem('autoTranslateEnabled', 'true');
        }
      } else {
        console.warn(`Unsupported locale: ${newLocale}`);
      }
    },
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}