'use client';

import { useRef, useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { Building2, Upload, Save, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OrganizationSettings } from '@/services/organization';
import { toast } from 'sonner';

interface OrganizationTabProps {
  formData: Partial<OrganizationSettings>;
  settings: OrganizationSettings | undefined;
  handleOrgInputChange: (field: keyof OrganizationSettings, value: string) => void;
  handleSaveOrganization: () => void;
  updateSettingsPending: boolean;
  uploadLogo: { mutate: (file: File, options: { onSuccess: (res: { logo_url: string }) => void }) => void; isPending: boolean };
  setFormData: React.Dispatch<React.SetStateAction<Partial<OrganizationSettings>>>;
}

export function OrganizationTab({ 
  formData, 
  settings, 
  handleOrgInputChange, 
  handleSaveOrganization, 
  updateSettingsPending,
  uploadLogo,
  setFormData
}: OrganizationTabProps) {
  const t = useTranslations('settings');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadLogo.mutate(file, {
      onSuccess: (res: any) => {
        setFormData((prev: any) => ({ ...prev, logo_url: res.logo_url }));
      },
    });
    e.target.value = '';
  };

  return (
    <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
        <CardContent className="px-6 pb-6 -mt-12">
          <div className="flex items-end gap-4">
            <div className="relative group">
              <div className="size-24 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-950 shadow-lg flex items-center justify-center overflow-hidden">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Organization logo"
                    className="size-full object-cover"
                  />
                ) : (
                  <Building2 className="size-10 text-primary" />
                )}
              </div>
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadLogo.isPending}
                className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {uploadLogo.isPending ? (
                  <Loader2 className="size-6 text-white animate-spin" />
                ) : (
                  <Upload className="size-6 text-white" />
                )}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
            <div className="pb-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{formData.name || 'Organization'}</h3>
              <Badge variant={formData.status === 'ACTIVE' ? 'default' : 'secondary'} className="mt-1">
                {formData.status}
              </Badge>
              <p className="text-xs text-slate-400 mt-1.5">{t('click_to_upload_logo')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-lg font-semibold">{t('organization_details')}</CardTitle>
          <CardDescription>{t('organization_details_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('organization_name')}</Label>
              <Input 
                value={formData.name || ''} 
                onChange={(e) => handleOrgInputChange('name', e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('business_email')}</Label>
              <Input 
                type="email" 
                value={formData.email || ''} 
                onChange={(e) => handleOrgInputChange('email', e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('contact_phone')}</Label>
              <Input 
                value={formData.phone || ''} 
                onChange={(e) => handleOrgInputChange('phone', e.target.value)}
                className="h-11"
                placeholder="+998 XX XXX XX XX"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('organization_id')}</Label>
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
            disabled={updateSettingsPending}
            className="bg-primary hover:bg-primary/90"
          >
            {updateSettingsPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
            {t('save_changes')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
