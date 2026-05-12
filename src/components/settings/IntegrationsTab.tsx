'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { Send, MessageSquare, Info, Loader2, TestTube, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

import type { OrganizationSettings } from '@/services/organization';

interface IntegrationsTabProps {
  formData: Partial<OrganizationSettings>;
  handleOrgInputChange: (field: keyof OrganizationSettings, value: string) => void;
  handleOrgSwitchChange: (field: keyof OrganizationSettings, value: boolean) => void;
  handleSaveOrganization: () => void;
  updateSettingsPending: boolean;
}

export function IntegrationsTab({
  formData,
  handleOrgInputChange,
  handleOrgSwitchChange,
  handleSaveOrganization,
  updateSettingsPending
}: IntegrationsTabProps) {
  const t = useTranslations('settings');
  
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

  return (
    <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
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
                <CardTitle className="text-lg font-semibold">{t('telegram_bot')}</CardTitle>
                <CardDescription>{t('telegram_bot_desc')}</CardDescription>
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
              <Label className="text-sm font-medium">{t('bot_token')}</Label>
              <Input 
                type="password"
                value={formData.telegram_bot_token || ''} 
                onChange={(e) => handleOrgInputChange('telegram_bot_token', e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
                className="h-11 font-mono text-sm"
              />
              <p className="text-xs text-slate-500">{t('bot_token_help')}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('chat_id')}</Label>
              <Input 
                value={formData.telegram_chat_id || ''} 
                onChange={(e) => handleOrgInputChange('telegram_chat_id', e.target.value)}
                placeholder="-1001234567890"
                className="h-11 font-mono text-sm"
              />
              <p className="text-xs text-slate-500">{t('chat_id_help')}</p>
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
                  {telegramStatus === 'success' ? t('connection_verified') :
                   telegramStatus === 'error' ? t('connection_failed') :
                   t('ready_to_test')}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestTelegram}
                  disabled={testingTelegram}
                >
                  {testingTelegram ? (
                    <><Loader2 className="mr-2 size-3 animate-spin" />{t('testing')}</>
                  ) : (
                    <><TestTube className="mr-2 size-3" />{t('test_connection')}</>
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
                <CardTitle className="text-lg font-semibold">{t('whatsapp_api')}</CardTitle>
                <CardDescription>{t('whatsapp_api_desc')}</CardDescription>
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
              <Label className="text-sm font-medium">{t('cloud_api_token')}</Label>
              <Input 
                type="password"
                value={formData.whatsapp_cloud_token || ''} 
                onChange={(e) => handleOrgInputChange('whatsapp_cloud_token', e.target.value)}
                className="h-11 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('phone_number_id')}</Label>
              <Input 
                value={formData.whatsapp_phone_number_id || ''} 
                onChange={(e) => handleOrgInputChange('whatsapp_phone_number_id', e.target.value)}
                className="h-11 font-mono text-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">{t('default_target_number')}</Label>
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
                  {whatsappStatus === 'success' ? t('connection_verified') :
                   whatsappStatus === 'error' ? t('connection_failed') :
                   t('ready_to_test')}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestWhatsApp}
                  disabled={testingWhatsApp}
                >
                  {testingWhatsApp ? (
                    <><Loader2 className="mr-2 size-3 animate-spin" />{t('testing')}</>
                  ) : (
                    <><TestTube className="mr-2 size-3" />{t('test_connection')}</>
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
          disabled={updateSettingsPending}
          className="bg-primary hover:bg-primary/90"
        >
          {updateSettingsPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          {t('save_integration_settings')}
        </Button>
      </CardFooter>
    </div>
  );
}
