'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { Database, Upload, CheckCircle2, Download, Cpu, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { SectionHeader } from './SharedComponents';

interface RecentBackup {
  id: string;
  name: string;
  date: string;
  size: string;
}

interface ResourceMetric {
  label: string;
  value: number;
  color: string;
}

interface InfrastructureSectionProps {
  recentBackups: RecentBackup[];
  resourceMetrics: ResourceMetric[];
}

export function InfrastructureSection({ recentBackups, resourceMetrics }: InfrastructureSectionProps) {
  const t = useTranslations('admin');
  const [resetCacheOpen, setResetCacheOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader icon={<Database className="size-4" />} title={t('settings.nav_infra')} desc={t('settings.infra_header_desc')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/60 bg-muted/40">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Database className="size-4 text-primary-emphasis" /> {t('settings.db_backups')}
            </CardTitle>
            <CardDescription>{t('settings.db_backups_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/100/10 border border-primary/20">
              <div>
                <p className="text-sm font-semibold text-foreground">{t('settings.next_backup')}</p>
                <p className="text-xs text-primary-emphasis font-medium">{t('settings.tonight_at')}</p>
              </div>
              <Button
                onClick={() => toast.success(t('settings.backup_triggered'))}
                className="bg-card hover:bg-muted/60 text-foreground border border-border rounded-xl shadow-sm gap-1.5 text-xs h-8"
              >
                <Upload className="size-3.5" /> {t('settings.backup_now')}
              </Button>
            </div>
            <div className="space-y-1.5">
              {recentBackups.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/60 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-success-emphasis shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground/90 truncate max-w-[160px]">{b.name}</p>
                      <p className="text-caption text-muted-foreground">{b.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="rounded-lg text-caption">{b.size}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toast.success(t('settings.downloading', { name: b.name }))}
                      className="size-7 rounded-lg"
                    >
                      <Download className="size-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/60 bg-muted/40">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Cpu className="size-4 text-primary-emphasis" /> {t('settings.resource_monitor')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {resourceMetrics.map((r) => (
                <div key={r.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="text-foreground tabular-nums">{r.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${r.color} transition-all duration-1000`} style={{ width: `${r.value}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-danger/20 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-danger/20 bg-danger/100/10">
              <CardTitle className="text-sm font-semibold text-danger-emphasis flex items-center gap-2">
                <AlertTriangle className="size-4" /> {t('settings.danger_zone')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5">
              <AlertDialog open={resetCacheOpen} onOpenChange={setResetCacheOpen}>
                <Button
                  variant="outline"
                  onClick={() => setResetCacheOpen(true)}
                  className="w-full rounded-xl border-danger/30 text-danger-emphasis hover:bg-danger/100/10 gap-2 justify-start text-sm h-9"
                >
                  <RefreshCw className="size-4" /> {t('settings.reset_caches')}
                </Button>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.reset_caches_q')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings.reset_caches_desc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">{t('settings.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => toast.success(t('settings.caches_reset_done'))}
                      className="bg-danger hover:bg-danger rounded-xl"
                    >
                      {t('settings.reset_caches_confirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog open={purgeOpen} onOpenChange={setPurgeOpen}>
                <Button
                  variant="outline"
                  onClick={() => setPurgeOpen(true)}
                  className="w-full rounded-xl border-danger/30 text-danger-emphasis hover:bg-danger/100/10 gap-2 justify-start text-sm h-9"
                >
                  <Trash2 className="size-4" /> {t('settings.purge_records')}
                </Button>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.purge_q')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings.purge_desc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">{t('settings.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => toast.success(t('settings.records_purged'))}
                      className="bg-danger hover:bg-danger rounded-xl"
                    >
                      {t('settings.purge_confirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
