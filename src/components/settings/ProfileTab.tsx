'use client';

import { useState, useRef } from 'react';
import { useTranslations } from '@/i18n/index';
import { User, Upload, X, Save, Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { userService } from '@/services/users';
import { getErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';

interface ProfileTabProps {
  user: { role?: string } | null | undefined;
  profileData: Record<string, string>;
  handleProfileChange: (field: string, value: string) => void;
}

export function ProfileTab({ user, profileData, handleProfileChange }: ProfileTabProps) {
  const t = useTranslations('settings');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const storeUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { logout } = useAuth();

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await userService.updateSelf({
        phone: profileData.phone,
        full_name: profileData.full_name,
        email: profileData.email,
      });
      if (storeUser) setAuth({ ...storeUser, ...updated });
      toast.success(t('profile_updated'));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    setSavingPassword(true);
    try {
      await userService.updateSelf({
        phone: storeUser?.phone ?? profileData.phone,
        password: passwordData.current,
        new_password: passwordData.new,
        confirm_new_password: passwordData.confirm,
      });
      setPasswordData({ current: '', new: '', confirm: '' });
      toast.success(t('password_updated'));
      // Backend clears the refresh token on password change — re-login required.
      setTimeout(() => logout(), 1500);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  return (
    <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      {/* Avatar Section */}
      <Card>
        <CardHeader className="border-b border-border bg-muted/50">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <User className="size-5 text-primary" />
            {t('profile_photo')}
          </CardTitle>
          <CardDescription>{t('profile_photo_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="size-24 border-4 border-card shadow-card">
                <AvatarImage src={profileData.avatar_url} />
                <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
                  {profileData.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={() => fileInputRef.current?.click()}
                aria-label={t('change_photo')}
                className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card transition-transform hover:scale-110"
              >
                <Upload className="size-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
            </div>
            <div className="flex-1">
              <p className="text-h3 text-foreground">{profileData.full_name}</p>
              <p className="text-body-sm capitalize text-muted-foreground">{user?.role?.replace('_', ' ').toLowerCase()}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="size-4" />
                  {t('change_photo')}
                </Button>
                {profileData.avatar_url && (
                  <Button size="sm" variant="danger">
                    <X className="size-4" />
                    {t('remove')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>{t('personal_info')}</CardTitle>
          <CardDescription>{t('personal_info_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-h4">{t('full_name')}</Label>
              <Input 
                id="full_name" 
                value={profileData.full_name} 
                onChange={(e) => handleProfileChange('full_name', e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile_email" className="text-h4">{t('email')}</Label>
              <Input 
                id="profile_email" 
                type="email" 
                value={profileData.email} 
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile_phone" className="text-h4">{t('phone')}</Label>
              <Input 
                id="profile_phone" 
                value={profileData.phone} 
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                className="h-11"
                placeholder="+996 XX XXX XX XX"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-h4">{t('role')}</Label>
              <div className="flex h-11 items-center rounded-control border border-border bg-muted px-3 text-body-sm text-muted-foreground">
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end px-6 py-4">
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t('save_changes')}
          </Button>
        </CardFooter>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <Key className="size-5 text-primary" />
            {t('change_password')}
          </CardTitle>
          <CardDescription>{t('change_password_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label className="text-h4">{t('current_password')}</Label>
              <div className="relative">
                <Input 
                  type={showPassword.current ? 'text' : 'password'} 
                  value={passwordData.current}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                  className="h-11 pr-10"
                />
                <button 
                  onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-h4">{t('new_password')}</Label>
              <div className="relative">
                <Input 
                  type={showPassword.new ? 'text' : 'password'} 
                  value={passwordData.new}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                  className="h-11 pr-10"
                />
                <button 
                  onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword.new ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {passwordData.new && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('password_strength')}</span>
                    <span className={
                      getPasswordStrength(passwordData.new) >= 75 ? 'font-medium text-success-emphasis' :
                      getPasswordStrength(passwordData.new) >= 50 ? 'font-medium text-warning-emphasis' : 'font-medium text-danger-emphasis'
                    }>
                      {getPasswordStrength(passwordData.new) >= 75 ? t('strong') : 
                       getPasswordStrength(passwordData.new) >= 50 ? t('medium') : t('weak')}
                    </span>
                  </div>
                  <Progress value={getPasswordStrength(passwordData.new)} className="h-2" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-h4">{t('confirm_password')}</Label>
              <div className="relative">
                <Input 
                  type={showPassword.confirm ? 'text' : 'password'} 
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                  className="h-11 pr-10"
                />
                <button 
                  onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end px-6 py-4">
          <Button
            onClick={handleUpdatePassword}
            disabled={savingPassword || !passwordData.current || passwordData.new.length < 6 || passwordData.new !== passwordData.confirm}
          >
            {savingPassword ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
            {t('update_password')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
