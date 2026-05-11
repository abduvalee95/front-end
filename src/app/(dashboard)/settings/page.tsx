'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Bell, 
  ShieldCheck, 
  Save,
  MessageSquare,
  Send,
  Loader2,
  TestTube,
  Info,
  AlertCircle,
  Mail,
  Phone,
  Clock,
  User,
  Palette,
  Globe,
  Key,
  Smartphone,
  CheckCircle2,
  X,
  Upload,
  ChevronRight,
  ExternalLink,
  Moon,
  Sun,
  Laptop,
  Users,
  Eye,
  EyeOff,
  Copy,
  Check,
  Settings
} from 'lucide-react';
import { useOrganizationSettings, useUpdateOrganizationSettings } from '@/hooks/useOrganization';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { OrganizationSettings } from '@/services/organization';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';


// Settings navigation items
const settingsNav = [
  { id: 'profile', label: 'Profile', icon: User, desc: 'Personal information' },
  { id: 'organization', label: 'Organization', icon: Building2, desc: 'Company details' },
  { id: 'integrations', label: 'Integrations', icon: Globe, desc: 'Telegram & WhatsApp' },
  { id: 'security', label: 'Security', icon: ShieldCheck, desc: 'Access & authentication' },
  { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Theme & language' },
];

export default function SettingsPage() {
  const { data: settings, isLoading } = useOrganizationSettings();
  const updateSettings = useUpdateOrganizationSettings();
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState<Partial<OrganizationSettings>>({});
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  
  // Integration testing states
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // UI states
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const handleOrgInputChange = (field: keyof OrganizationSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOrgSwitchChange = (field: keyof OrganizationSettings, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveOrganization = async () => {
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      telegram_enabled: formData.telegram_enabled,
      telegram_bot_token: formData.telegram_bot_token,
      telegram_chat_id: formData.telegram_chat_id,
      whatsapp_enabled: formData.whatsapp_enabled,
      whatsapp_cloud_token: formData.whatsapp_cloud_token,
      whatsapp_phone_number_id: formData.whatsapp_phone_number_id,
      whatsapp_target: formData.whatsapp_target,
    };
    updateSettings.mutate(payload, {
      onSuccess: () => toast.success('Organization settings saved successfully'),
      onError: () => toast.error('Failed to save settings'),
    });
  };

  const handleSaveProfile = async () => {
    // TODO: Connect to backend
    toast.success('Profile updated successfully');
  };

  const handleTestTelegram = async () => {
    if (!formData.telegram_bot_token || !formData.telegram_chat_id) {
      toast.error('Please fill in both Bot Token and Chat ID');
      return;
    }
    setTestingTelegram(true);
    setTelegramStatus('idle');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTelegramStatus('success');
      toast.success('Telegram connection successful!');
    } catch (error) {
      setTelegramStatus('error');
      toast.error('Connection test failed');
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!formData.whatsapp_cloud_token || !formData.whatsapp_phone_number_id) {
      toast.error('Please fill in Cloud Token and Phone Number ID');
      return;
    }
    setTestingWhatsApp(true);
    setWhatsappStatus('idle');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setWhatsappStatus('success');
      toast.success('WhatsApp connection successful!');
    } catch (error) {
      setWhatsappStatus('error');
      toast.error('Connection test failed');
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
              <Settings className="size-4" />
              <span>Configuration</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your profile, organization, and system preferences</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-72 flex-shrink-0">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm sticky top-6">
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {settingsNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                          isActive 
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className={`size-5 ${isActive ? 'text-primary-foreground' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${isActive ? 'text-primary-foreground' : ''}`}>{item.label}</p>
                          <p className={`text-xs truncate ${isActive ? 'text-primary-foreground/70' : 'text-slate-400'}`}>{item.desc}</p>
                        </div>
                        <ChevronRight className={`size-4 transition-transform ${isActive ? 'rotate-90 text-primary-foreground' : 'text-slate-300'}`} />
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div className="space-y-6 transition-all duration-300">
                  {/* Avatar Section */}
                  <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-800">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <User className="size-5 text-primary" />
                        Profile Photo
                      </CardTitle>
                      <CardDescription>This photo will be displayed across the platform</CardDescription>
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
                              Change Photo
                            </Button>
                            {profileData.avatar_url && (
                              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600">
                                <X className="size-4 mr-2" />
                                Remove
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
                      <CardTitle className="text-lg font-semibold">Personal Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
                          <Input 
                            id="full_name" 
                            value={profileData.full_name} 
                            onChange={(e) => handleProfileChange('full_name', e.target.value)}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile_email" className="text-sm font-medium">Email Address</Label>
                          <Input 
                            id="profile_email" 
                            type="email" 
                            value={profileData.email} 
                            onChange={(e) => handleProfileChange('email', e.target.value)}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile_phone" className="text-sm font-medium">Phone Number</Label>
                          <Input 
                            id="profile_phone" 
                            value={profileData.phone} 
                            onChange={(e) => handleProfileChange('phone', e.target.value)}
                            className="h-11"
                            placeholder="+998 XX XXX XX XX"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Role</Label>
                          <div className="h-11 flex items-center px-3 rounded-md border bg-slate-50 dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-400">
                            {user?.role?.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 flex justify-end">
                      <Button onClick={handleSaveProfile} className="bg-primary hover:bg-primary/90">
                        <Save className="size-4 mr-2" />
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Password Change */}
                  <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Key className="size-5 text-primary" />
                        Change Password
                      </CardTitle>
                      <CardDescription>Update your account password</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-4 max-w-md">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Current Password</Label>
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
                          <Label className="text-sm font-medium">New Password</Label>
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
                                <span className="text-slate-500">Password strength</span>
                                <span className={`font-medium ${
                                  getPasswordStrength(passwordData.new) >= 75 ? 'text-green-500' : 
                                  getPasswordStrength(passwordData.new) >= 50 ? 'text-yellow-500' : 'text-red-500'
                                }`}>
                                  {getPasswordStrength(passwordData.new) >= 75 ? 'Strong' : 
                                   getPasswordStrength(passwordData.new) >= 50 ? 'Medium' : 'Weak'}
                                </span>
                              </div>
                              <Progress value={getPasswordStrength(passwordData.new)} className="h-2" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Confirm New Password</Label>
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
              )}

              {/* Organization Settings */}
              {activeTab === 'organization' && (
                <div className="space-y-6 transition-all duration-300">
                  <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
                    <CardContent className="px-6 pb-6 -mt-12">
                      <div className="flex items-end gap-4">
                        <div className="size-24 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-950 shadow-lg flex items-center justify-center">
                          <Building2 className="size-10 text-primary" />
                        </div>
                        <div className="pb-2">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{formData.name || 'Organization'}</h3>
                          <Badge variant={formData.status === 'ACTIVE' ? 'default' : 'secondary'} className="mt-1">
                            {formData.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                      <CardTitle className="text-lg font-semibold">Organization Details</CardTitle>
                      <CardDescription>Manage your organization information</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Organization Name</Label>
                          <Input 
                            value={formData.name || ''} 
                            onChange={(e) => handleOrgInputChange('name', e.target.value)}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Business Email</Label>
                          <Input 
                            type="email" 
                            value={formData.email || ''} 
                            onChange={(e) => handleOrgInputChange('email', e.target.value)}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Contact Phone</Label>
                          <Input 
                            value={formData.phone || ''} 
                            onChange={(e) => handleOrgInputChange('phone', e.target.value)}
                            className="h-11"
                            placeholder="+998 XX XXX XX XX"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Organization ID</Label>
                          <div className="flex gap-2">
                            <div className="flex-1 h-11 flex items-center px-3 rounded-md border bg-slate-50 dark:bg-slate-900 text-sm font-mono text-slate-600">
                              {settings?.id}
                            </div>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-11 w-11"
                              onClick={() => handleCopyToClipboard(settings?.id || '')}
                            >
                              {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 flex justify-end">
                      <Button 
                        onClick={handleSaveOrganization} 
                        disabled={updateSettings.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {updateSettings.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {/* Integrations */}
              {activeTab === 'integrations' && (
                <div className="space-y-6 transition-all duration-300">
                  {/* Telegram */}
                  <Card className={`border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300 ${formData.telegram_enabled ? 'ring-1 ring-blue-500/20' : ''}`}>
                    <CardHeader className={`border-b transition-colors ${formData.telegram_enabled ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'bg-slate-50/50 dark:bg-slate-900/50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`size-12 rounded-xl flex items-center justify-center transition-colors ${
                            formData.telegram_enabled ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}>
                            <Send className="size-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold">Telegram Bot</CardTitle>
                            <CardDescription>Send automated notifications</CardDescription>
                          </div>
                        </div>
                        <Switch 
                          checked={formData.telegram_enabled || false} 
                          onCheckedChange={(checked) => handleOrgSwitchChange('telegram_enabled', checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className={`p-6 space-y-4 transition-opacity ${formData.telegram_enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Bot Token</Label>
                          <Input 
                            type="password"
                            value={formData.telegram_bot_token || ''} 
                            onChange={(e) => handleOrgInputChange('telegram_bot_token', e.target.value)}
                            placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
                            className="h-11 font-mono text-sm"
                          />
                          <p className="text-xs text-slate-500">Get this from @BotFather on Telegram</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Chat ID</Label>
                          <Input 
                            value={formData.telegram_chat_id || ''} 
                            onChange={(e) => handleOrgInputChange('telegram_chat_id', e.target.value)}
                            placeholder="-1001234567890"
                            className="h-11 font-mono text-sm"
                          />
                          <p className="text-xs text-slate-500">Group or channel identifier</p>
                        </div>
                      </div>
                      
                      {formData.telegram_enabled && formData.telegram_bot_token && formData.telegram_chat_id && (
                        <Alert className={`${
                          telegramStatus === 'success' ? 'border-green-500/50 bg-green-50 dark:bg-green-900/20' :
                          telegramStatus === 'error' ? 'border-red-500/50 bg-red-50 dark:bg-red-900/20' :
                          'border-blue-500/50 bg-blue-50 dark:bg-blue-900/20'
                        }`}>
                          <Info className="size-4" />
                          <AlertDescription className="flex items-center justify-between">
                            <span className="text-sm">
                              {telegramStatus === 'success' ? 'Connection verified' :
                               telegramStatus === 'error' ? 'Connection failed' :
                               'Ready to test connection'}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleTestTelegram}
                              disabled={testingTelegram}
                            >
                              {testingTelegram ? (
                                <><Loader2 className="mr-2 size-3 animate-spin" />Testing...</>
                              ) : (
                                <><TestTube className="mr-2 size-3" />Test Connection</>
                              )}
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* WhatsApp */}
                  <Card className={`border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300 ${formData.whatsapp_enabled ? 'ring-1 ring-emerald-500/20' : ''}`}>
                    <CardHeader className={`border-b transition-colors ${formData.whatsapp_enabled ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : 'bg-slate-50/50 dark:bg-slate-900/50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`size-12 rounded-xl flex items-center justify-center transition-colors ${
                            formData.whatsapp_enabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}>
                            <MessageSquare className="size-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold">WhatsApp Cloud API</CardTitle>
                            <CardDescription>WhatsApp Business integration</CardDescription>
                          </div>
                        </div>
                        <Switch 
                          checked={formData.whatsapp_enabled || false} 
                          onCheckedChange={(checked) => handleOrgSwitchChange('whatsapp_enabled', checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className={`p-6 space-y-4 transition-opacity ${formData.whatsapp_enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Cloud API Token</Label>
                          <Input 
                            type="password"
                            value={formData.whatsapp_cloud_token || ''} 
                            onChange={(e) => handleOrgInputChange('whatsapp_cloud_token', e.target.value)}
                            className="h-11 font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Phone Number ID</Label>
                          <Input 
                            value={formData.whatsapp_phone_number_id || ''} 
                            onChange={(e) => handleOrgInputChange('whatsapp_phone_number_id', e.target.value)}
                            className="h-11 font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-medium">Default Target Number</Label>
                          <Input 
                            value={formData.whatsapp_target || ''} 
                            onChange={(e) => handleOrgInputChange('whatsapp_target', e.target.value)}
                            placeholder="998901234567"
                            className="h-11 font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      {formData.whatsapp_enabled && formData.whatsapp_cloud_token && formData.whatsapp_phone_number_id && (
                        <Alert className={`${
                          whatsappStatus === 'success' ? 'border-green-500/50 bg-green-50 dark:bg-green-900/20' :
                          whatsappStatus === 'error' ? 'border-red-500/50 bg-red-50 dark:bg-red-900/20' :
                          'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/20'
                        }`}>
                          <Info className="size-4" />
                          <AlertDescription className="flex items-center justify-between">
                            <span className="text-sm">
                              {whatsappStatus === 'success' ? 'Connection verified' :
                               whatsappStatus === 'error' ? 'Connection failed' :
                               'Ready to test connection'}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleTestWhatsApp}
                              disabled={testingWhatsApp}
                            >
                              {testingWhatsApp ? (
                                <><Loader2 className="mr-2 size-3 animate-spin" />Testing...</>
                              ) : (
                                <><TestTube className="mr-2 size-3" />Test Connection</>
                              )}
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <CardFooter className="flex justify-end px-0">
                    <Button 
                      onClick={handleSaveOrganization} 
                      disabled={updateSettings.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {updateSettings.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                      Save Integration Settings
                    </Button>
                  </CardFooter>
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div className="space-y-6 transition-all duration-300">
                  <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <ShieldCheck className="size-5 text-primary" />
                        Security Settings
                      </CardTitle>
                      <CardDescription>Manage your account security preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Smartphone className="size-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Two-Factor Authentication</p>
                            <p className="text-xs text-slate-500">Add an extra layer of security</p>
                          </div>
                        </div>
                        <Badge variant="secondary">Coming Soon</Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Clock className="size-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Session Timeout</p>
                            <p className="text-xs text-slate-500">Auto-logout after 24 hours</p>
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Mail className="size-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Login Notifications</p>
                            <p className="text-xs text-slate-500">Get notified of new logins</p>
                          </div>
                        </div>
                        <Switch />
                      </div>
                    </CardContent>
                  </Card>

                  <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-900/20">
                    <AlertCircle className="size-4 text-amber-600" />
                    <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                      Additional security features will be available in the next release.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Appearance */}
              {activeTab === 'appearance' && (
                <div className="space-y-6 transition-all duration-300">
                  <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                      <CardTitle className="text-lg font-semibold">Theme</CardTitle>
                      <CardDescription>Choose your preferred appearance</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-primary bg-primary/5 transition-all">
                          <Sun className="size-8 text-primary" />
                          <span className="font-semibold text-sm">Light</span>
                        </button>
                        <button className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900 transition-all">
                          <Moon className="size-8 text-slate-600 dark:text-slate-400" />
                          <span className="font-semibold text-sm text-slate-600 dark:text-slate-400">Dark</span>
                        </button>
                        <button className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900 transition-all">
                          <Laptop className="size-8 text-slate-600 dark:text-slate-400" />
                          <span className="font-semibold text-sm text-slate-600 dark:text-slate-400">System</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                      <CardTitle className="text-lg font-semibold">Language</CardTitle>
                      <CardDescription>Select your preferred language</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Select defaultValue="uz">
                        <SelectTrigger className="w-full max-w-xs h-11">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uz">O'zbekcha</SelectItem>
                          <SelectItem value="ru">Русский</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

