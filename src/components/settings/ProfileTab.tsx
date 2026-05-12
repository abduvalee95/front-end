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

interface ProfileTabProps {
  user: any;
  profileData: any;
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

  const handleSaveProfile = async () => {
    // TODO: Connect to backend
    toast.success('Profile updated successfully');
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
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="size-5 text-primary" />
            {t('profile_photo')}
          </CardTitle>
          <CardDescription>{t('profile_photo_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="size-24 border-4 border-white dark:border-slate-800 shadow-lg">
                <AvatarImage src={profileData.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-2xl font-bold">
                  {profileData.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 size-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Upload className="size-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-white">{profileData.full_name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="size-4 mr-2" />
                  {t('change_photo')}
                </Button>
                {profileData.avatar_url && (
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600">
                    <X className="size-4 mr-2" />
                    {t('remove')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-lg font-semibold">{t('personal_info')}</CardTitle>
          <CardDescription>{t('personal_info_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium">{t('full_name')}</Label>
              <Input 
                id="full_name" 
                value={profileData.full_name} 
                onChange={(e) => handleProfileChange('full_name', e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile_email" className="text-sm font-medium">{t('email')}</Label>
              <Input 
                id="profile_email" 
                type="email" 
                value={profileData.email} 
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile_phone" className="text-sm font-medium">{t('phone')}</Label>
              <Input 
                id="profile_phone" 
                value={profileData.phone} 
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                className="h-11"
                placeholder="+998 XX XXX XX XX"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('role')}</Label>
              <div className="h-11 flex items-center px-3 rounded-md border bg-slate-50 dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-400">
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 flex justify-end">
          <Button onClick={handleSaveProfile} className="bg-primary hover:bg-primary/90">
            <Save className="size-4 mr-2" />
            {t('save_changes')}
          </Button>
        </CardFooter>
      </Card>

      {/* Password Change */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Key className="size-5 text-primary" />
            {t('change_password')}
          </CardTitle>
          <CardDescription>{t('change_password_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('current_password')}</Label>
              <div className="relative">
                <Input 
                  type={showPassword.current ? 'text' : 'password'} 
                  value={passwordData.current}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                  className="h-11 pr-10"
                />
                <button 
                  onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('new_password')}</Label>
              <div className="relative">
                <Input 
                  type={showPassword.new ? 'text' : 'password'} 
                  value={passwordData.new}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                  className="h-11 pr-10"
                />
                <button 
                  onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword.new ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {passwordData.new && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{t('password_strength')}</span>
                    <span className={`font-medium ${
                      getPasswordStrength(passwordData.new) >= 75 ? 'text-green-500' : 
                      getPasswordStrength(passwordData.new) >= 50 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {getPasswordStrength(passwordData.new) >= 75 ? t('strong') : 
                       getPasswordStrength(passwordData.new) >= 50 ? t('medium') : t('weak')}
                    </span>
                  </div>
                  <Progress value={getPasswordStrength(passwordData.new)} className="h-2" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('confirm_password')}</Label>
              <div className="relative">
                <Input 
                  type={showPassword.confirm ? 'text' : 'password'} 
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                  className="h-11 pr-10"
                />
                <button 
                  onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 flex justify-end">
          <Button 
            disabled={!passwordData.current || !passwordData.new || passwordData.new !== passwordData.confirm}
            className="bg-primary hover:bg-primary/90"
          >
            <Key className="size-4 mr-2" />
            Update Password
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
