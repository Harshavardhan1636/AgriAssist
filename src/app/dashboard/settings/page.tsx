'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/context/i18n-context';
import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Palette, Languages } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(true); // Set to true by default

  const userAvatar = PlaceHolderImages.find(img => img.id === 'user_avatar');

  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale);
    // Store the preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', newLocale);
      localStorage.setItem('autoTranslateEnabled', 'true');
    }
  };

  // Load saved preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferredLanguage');
      const autoTranslateEnabled = localStorage.getItem('autoTranslateEnabled') === 'true';
      
      if (savedLanguage) {
        setLocale(savedLanguage);
      }
      
      setAutoTranslate(autoTranslateEnabled);
    }
  }, [setLocale]);

  return (
    <div className="grid gap-8">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-semibold">{t('Settings')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('Appearance')}
            </CardTitle>
            <CardDescription>{t('Customize the look and feel of the application.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t('Theme')}</h3>
                <p className="text-sm text-muted-foreground">{t('Select the theme for the application.')}</p>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('Light')}</SelectItem>
                  <SelectItem value="dark">{t('Dark')}</SelectItem>
                  <SelectItem value="system">{t('System')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t('Notifications')}</h3>
                <p className="text-sm text-muted-foreground">{t('Enable or disable notifications.')}</p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {t('Language & Region')}
            </CardTitle>
            <CardDescription>{t('Configure language and regional settings.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t('Language')}</h3>
                <p className="text-sm text-muted-foreground">{t('Select your preferred language.')}</p>
              </div>
              <Select value={locale} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                  <SelectItem value="te">తెలుగు</SelectItem>
                  <SelectItem value="ta">தமிழ்</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t('Auto-translate')}</h3>
                <p className="text-sm text-muted-foreground">{t('Automatically translate content.')}</p>
              </div>
              <Switch
                checked={autoTranslate}
                onCheckedChange={(checked) => {
                  setAutoTranslate(checked);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('autoTranslateEnabled', checked.toString());
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('Account Information')}</CardTitle>
            <CardDescription>{t('Manage your account details and preferences.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16">
                <Image
                  src={userAvatar?.imageUrl || ''}
                  alt="User Avatar"
                  fill
                  className="rounded-full object-cover"
                  data-ai-hint={userAvatar?.imageHint}
                />
              </div>
              <div>
                <h3 className="font-medium">Agronomist</h3>
                <p className="text-sm text-muted-foreground">agro@agriassist.com</p>
                <Button variant="link" className="p-0 h-auto text-sm">
                  {t('Change Password')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}