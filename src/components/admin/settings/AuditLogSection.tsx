'use client';

import { History, Download } from 'lucide-react';
import { useTranslations } from '@/i18n/index';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SectionHeader } from './SharedComponents';

interface AuditLogEntry {
  id: string;
  action: string;
  user: string;
  time: string;
}

interface AuditLogSectionProps {
  auditLogs: AuditLogEntry[];
}

export function AuditLogSection({ auditLogs }: AuditLogSectionProps) {
  const t = useTranslations('admin');
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader icon={<History className="size-4" />} title={t('settings.nav_audit')} desc={t('settings.audit_header_desc')} />

      <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/60 bg-muted/40 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-h3">{t('settings.activity_log')}</CardTitle>
            <CardDescription>{t('settings.activity_log_desc')}</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => toast.success(t('settings.csv_started'))}
            className="rounded-xl border-border gap-2 text-body"
          >
            <Download className="size-4" /> {t('settings.export_csv')}
          </Button>
        </CardHeader>
        <CardContent className="pt-2 divide-y divide-border/60">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start justify-between py-3.5">
              <div className="flex items-start gap-3">
                <div className="size-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <History className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-h4 text-foreground">{log.action}</p>
                  <p className="text-caption text-muted-foreground mt-0.5">{log.user}</p>
                </div>
              </div>
              <Badge variant="outline" className="rounded-lg text-caption shrink-0 ml-4">{log.time}</Badge>
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t border-border/60 bg-muted/40 p-4 flex justify-center">
          <Button variant="outline" onClick={() => toast.info(t('settings.loading_logs'))} className="rounded-xl border-border text-body">
            {t('settings.load_more')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
