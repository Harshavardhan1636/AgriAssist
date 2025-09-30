'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/context/i18n-context";
import { useAuth } from "@/context/auth-context";
import { 
  User, 
  MapPin, 
  Save, 
  RefreshCw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from '@/hooks/use-toast';

// Define user profile type
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  farmLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export default function AccountPage() {
  const { t } = useI18n();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load user profile
  useEffect(() => {
    if (isAuthenticated && user) {
      setProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        farmLocation: user.farmLocation,
      });
      
      setDisplayName(user.displayName || '');
      setAddress(user.farmLocation?.address || '');
    }
  }, [isAuthenticated, user]);

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    
    try {
      // In a real application, this would save to a backend API
      // For now, we'll update localStorage
      const updatedProfile = {
        ...profile,
        displayName,
        farmLocation: profile.farmLocation ? {
          ...profile.farmLocation,
          address
        } : undefined
      } as UserProfile;
      
      localStorage.setItem('authUser', JSON.stringify(updatedProfile));
      
      setProfile(updatedProfile);
      
      toast({
        title: t('Profile Updated'),
        description: t('Your profile has been successfully updated.'),
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to update profile. Please try again.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 min-w-0">
        <div>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t('Authentication Required')}</CardTitle>
            <CardDescription>
              {t('Please log in to access your account settings.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('You need to be logged in to view and manage your account information.')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('My Profile')}</h1>
        <p className="text-muted-foreground">
          {t('Manage your profile information')}
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('Profile Information')}
          </CardTitle>
          <CardDescription>
            {t('Update your personal information and farm location')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('Email')}</Label>
              <Input 
                id="email" 
                value={profile?.email || ''} 
                disabled 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="displayName">{t('Display Name')}</Label>
              <Input 
                id="displayName" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('Enter your name')}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">{t('Farm Address')}</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input 
                    id="address" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t('Enter your farm address')}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleSaveProfile} 
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {t('Saving...')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t('Save Changes')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Account Management */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Account Management')}</CardTitle>
          <CardDescription>
            {t('Manage your account security')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={logout} className="flex items-center gap-2">
            <span>{t('Log out')}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}