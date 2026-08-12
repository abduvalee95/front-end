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
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            {t('security_settings')}
          </CardTitle>
          <CardDescription>{t('security_settings_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/50 dark:bg-card/50">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary-muted/30 flex items-center justify-center">
                <Smartphone className="size-5 text-primary-emphasis" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('two_factor_auth')}</p>
                <p className="text-xs text-muted-foreground">{t('two_factor_auth_desc')}</p>
              </div>
            </div>
            <Badge variant="secondary">{t('coming_soon')}</Badge>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/50 dark:bg-card/50">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary-muted/30 flex items-center justify-center">
                <Clock className="size-5 text-primary-emphasis" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('session_timeout')}</p>
                <p className="text-xs text-muted-foreground">{t('session_timeout_desc')}</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/50 dark:bg-card/50">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-warning-muted/30 flex items-center justify-center">
                <Mail className="size-5 text-warning-emphasis" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('login_notifications')}</p>
                <p className="text-xs text-muted-foreground">{t('login_notifications_desc')}</p>
              </div>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Alert className="border-warning/50 bg-warning-muted/20">
        <AlertCircle className="size-4 text-warning-emphasis" />
        <AlertDescription className="text-sm text-warning-emphasis">
          {t('security_features_coming')}
        </AlertDescription>
      </Alert>
    </div>
  );
}
