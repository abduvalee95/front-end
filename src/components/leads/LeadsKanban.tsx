'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { Lead, LeadStatus } from '@/types/analytics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Phone,
  Clock,
  Sparkles,
  MoreVertical,
  UserCheck,
  UserMinus,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUpdateLead, useConvertLead } from '@/hooks/useLeads';
import { toast } from 'sonner';

interface LeadsKanbanProps {
  leads: Lead[];
  isLoading: boolean;
  onAIAction?: (lead: Lead) => void;
}

export function LeadsKanban({ leads, isLoading, onAIAction }: LeadsKanbanProps) {
  const t = useTranslations('leads');
  const tCommon = useTranslations('common');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const updateLead = useUpdateLead();
  const convertLead = useConvertLead();

  const COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
    { status: 'NEW', label: t('status_new'), color: 'bg-blue-500' },
    { status: 'CONTACTED', label: t('status_contacted'), color: 'bg-amber-500' },
    { status: 'CONVERTED', label: t('status_converted'), color: 'bg-emerald-500' },
    { status: 'LOST', label: t('status_lost'), color: 'bg-rose-500' },
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('leadId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('leadId');
    if (!id) return;

    updateLead.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast.success(t('lead_moved_to').replace('{status}', t(`status_${status.toLowerCase()}`)));
        },
      }
    );
    setDraggedId(null);
  };

  const handleConvert = (lead: Lead) => {
    convertLead.mutate(lead.id, {
      onSuccess: () => {
        toast.success(`${lead.full_name} ${t('converted')}`);
      },
    });
  };

  const handleMarkLost = (lead: Lead) => {
    updateLead.mutate({ id: lead.id, data: { status: 'LOST' } });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[600px]">
        {COLUMNS.map((col) => (
          <div key={col.status} className="bg-slate-50/50 dark:bg-slate-900/50 border border-dashed border-border rounded-2xl p-4 space-y-4">
            <Skeleton className="h-6 w-32 mb-6" />
            <Skeleton className="h-[140px] w-full rounded-xl" />
            <Skeleton className="h-[140px] w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px] overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnLeads = leads.filter((l) => l.status === col.status);
        
        return (
          <div 
            key={col.status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.status)}
            className="flex flex-col gap-4 min-w-[280px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className={cn("size-2 rounded-full", col.color)} />
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                  {col.label}
                </h3>
              </div>
              <Badge variant="secondary" className="font-mono">
                {columnLeads.length}
              </Badge>
            </div>

            {/* Column Body */}
            <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-3 border border-dashed border-border flex flex-col gap-3 min-h-[500px]">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  className={cn(
                    "bg-card border border-border rounded-xl p-4 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-indigo-500/50 transition-all group",
                    draggedId === lead.id && "opacity-50 scale-95"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm leading-tight group-hover:text-indigo-500 transition-colors">
                      {lead.full_name}
                    </h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            aria-label={tCommon('actions')}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>{t('title')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onAIAction?.(lead)}>
                            <Sparkles className="mr-2 size-4 text-indigo-500" />
                            {t('generate_ai_response')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-emerald-500"
                            onClick={() => handleConvert(lead)}
                            disabled={lead.status === 'CONVERTED' || lead.status === 'LOST' || convertLead.isPending}
                          >
                            <UserCheck className="mr-2 size-4" />
                            {convertLead.isPending ? tCommon('loading') : t('convert')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-rose-500"
                            onClick={() => handleMarkLost(lead)}
                            disabled={lead.status === 'LOST' || updateLead.isPending}
                          >
                            <UserMinus className="mr-2 size-4" />
                            {t('status_lost')}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="size-3" />
                      {lead.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {format(parseISO(lead.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-normal py-0">
                      {lead.source.replace(/_/g, ' ')}
                    </Badge>
                    
                    <div className="flex gap-1">
                      {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="size-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                          onClick={() => handleConvert(lead)}
                          title={t('convert')}
                        >
                          <UserCheck className="size-3.5" />
                        </Button>
                      )}
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="size-7 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10"
                        title={t('ai_assistant')}
                        onClick={() => onAIAction?.(lead)}
                      >
                        <Sparkles className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {columnLeads.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground italic text-center p-8">
                  {t('drop_leads')}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
