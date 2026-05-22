'use client';

import { History, Download } from 'lucide-react';
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
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader icon={<History className="size-4" />} title="Audit Log" desc="Recent Super Admin actions on the platform" />

      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/40 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-black">Activity Log</CardTitle>
            <CardDescription>All administrative actions recorded below.</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => toast.success('CSV export started')}
            className="rounded-xl border-slate-200 gap-2 text-sm"
          >
            <Download className="size-4" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="pt-2 divide-y divide-slate-100">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start justify-between py-3.5">
              <div className="flex items-start gap-3">
                <div className="size-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <History className="size-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{log.user}</p>
                </div>
              </div>
              <Badge variant="outline" className="rounded-lg text-[10px] shrink-0 ml-4">{log.time}</Badge>
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t border-slate-100 bg-slate-50/40 p-4 flex justify-center">
          <Button variant="outline" onClick={() => toast.info('Loading more logs...')} className="rounded-xl border-slate-200 text-sm">
            Load More
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
