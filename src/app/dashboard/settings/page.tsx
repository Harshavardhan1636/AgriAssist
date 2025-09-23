
'use client';

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/context/i18n-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserNav } from "@/components/user-nav";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/auth-context";


export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'ml', name: 'മലയാളം' },
  ];

  return (
    <div className="grid gap-6">
       <div className="flex items-center gap-4">
          <h1 className="text-3xl font-semibold">{t('Settings')}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('My Profile')}</CardTitle>
          <CardDescription>{t('Update your personal information.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
                <UserNav />
                <div className="space-y-2 w-full max-w-sm">
                    <Label htmlFor="name">{t('Name')}</Label>
                    <Input id="name" defaultValue="Agronomist" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">{t('Email')}</Label>
                <Input id="email" type="email" defaultValue="agro@agriassist.com" disabled />
            </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>{t('Save')}</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Appearance')}</CardTitle>
          <CardDescription>{t('Customize the look and feel of the application.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Label htmlFor="dark-mode" className="font-medium">{t('Dark Mode')}</Label>
                    <p className="text-sm text-muted-foreground">{t('Toggle between light and dark themes.')}</p>
                </div>
                <Switch 
                  id="dark-mode" 
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="language">{t('Language')}</Label>
                 <Select value={locale} onValueChange={setLocale}>
                    <SelectTrigger className="w-full sm:w-[280px]">
                        <SelectValue placeholder={t('Select a language')} />
                    </SelectTrigger>
                    <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <p className="text-sm text-muted-foreground">{t('Choose your preferred language for the interface.')}</p>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Account')}</CardTitle>
          <CardDescription>{t('Manage your account settings.')}</CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="outline" onClick={logout}>{t('Log out')}</Button>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
            <div className="flex items-center justify-between w-full">
                <div>
                    <p className="font-medium">{t('Delete Account')}</p>
                    <p className="text-sm text-muted-foreground">{t('Permanently delete your account and all associated data.')}</p>
                </div>
                <Button variant="destructive">{t('Delete Account')}</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  )
}
