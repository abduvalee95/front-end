'use client';

import { useState } from 'react';
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
  const [resetCacheOpen, setResetCacheOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader icon={<Database className="size-4" />} title="Infrastructure" desc="Backups, resources, and maintenance operations" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/40">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <Database className="size-4 text-blue-500" /> Database Backups
            </CardTitle>
            <CardDescription>Automated daily backups — 30-day retention.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 border border-blue-100">
              <div>
                <p className="text-sm font-black text-slate-900">Next Backup</p>
                <p className="text-xs text-blue-600 font-medium">Tonight at 3:00 AM</p>
              </div>
              <Button
                onClick={() => toast.success('Manual backup triggered')}
                className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl shadow-sm gap-1.5 text-xs h-8"
              >
                <Upload className="size-3.5" /> Backup Now
              </Button>
            </div>
            <div className="space-y-1.5">
              {recentBackups.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-700 truncate max-w-[160px]">{b.name}</p>
                      <p className="text-[10px] text-slate-400">{b.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="rounded-lg text-[10px]">{b.size}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toast.success(`Downloading ${b.name}`)}
                      className="size-7 rounded-lg"
                    >
                      <Download className="size-3 text-slate-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/40">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Cpu className="size-4 text-violet-500" /> Resource Monitor
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {resourceMetrics.map((r) => (
                <div key={r.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">{r.label}</span>
                    <span className="text-slate-900 font-mono">{r.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${r.color} transition-all duration-1000`} style={{ width: `${r.value}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-red-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-red-100 bg-red-50/50">
              <CardTitle className="text-sm font-black text-red-700 flex items-center gap-2">
                <AlertTriangle className="size-4" /> Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5">
              <AlertDialog open={resetCacheOpen} onOpenChange={setResetCacheOpen}>
                <Button
                  variant="outline"
                  onClick={() => setResetCacheOpen(true)}
                  className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 gap-2 justify-start text-sm h-9"
                >
                  <RefreshCw className="size-4" /> Reset All Organization Caches
                </Button>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset All Caches?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will flush cached data across all organizations. Users may experience a temporary slowdown.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => toast.success('All organization caches reset')}
                      className="bg-red-600 hover:bg-red-700 rounded-xl"
                    >
                      Reset Caches
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog open={purgeOpen} onOpenChange={setPurgeOpen}>
                <Button
                  variant="outline"
                  onClick={() => setPurgeOpen(true)}
                  className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 gap-2 justify-start text-sm h-9"
                >
                  <Trash2 className="size-4" /> Purge Orphaned Records
                </Button>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Purge Orphaned Records?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes records no longer linked to any organization. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => toast.success('Orphaned records purged')}
                      className="bg-red-600 hover:bg-red-700 rounded-xl"
                    >
                      Purge Records
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
