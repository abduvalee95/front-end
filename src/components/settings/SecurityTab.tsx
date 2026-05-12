'use client';

import { useTranslations } from '@/i18n/index';
import { ShieldCheck, Smartphone, Clock, Mail, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SecurityTab() {
  const t = useTranslations('settings');

  return (
    <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            {t('security_settings')}
          </CardTitle>
          <CardDescription>{t('security_settings_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Smartphone className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('two_factor_auth')}</p>
                <p className="text-xs text-slate-500">{t('two_factor_auth_desc')}</p>
              </div>
            </div>
            <Badge variant="secondary">{t('coming_soon')}</Badge>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Clock className="size-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('session_timeout')}</p>
                <p className="text-xs text-slate-500">{t('session_timeout_desc')}</p>
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
                <p className="font-semibold text-sm">{t('login_notifications')}</p>
                <p className="text-xs text-slate-500">{t('login_notifications_desc')}</p>
              </div>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-900/20">
        <AlertCircle className="size-4 text-amber-600" />
        <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
          {t('security_features_coming')}
        </AlertDescription>
      </Alert>
    </div>
  );
}
