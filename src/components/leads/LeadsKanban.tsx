'use client';

import { useState } from 'react';
import { Lead, LeadStatus } from '@/types/analytics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Clock, 
  Sparkles, 
  MoreVertical, 
  UserCheck, 
  UserMinus,
  Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { analyticsService } from '@/services/analytics';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

interface LeadsKanbanProps {
  leads: Lead[];
  isLoading: boolean;
  onAIAction?: (lead: Lead) => void;
}

const COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'NEW', label: 'New Leads', color: 'bg-blue-500' },
  { status: 'CONTACTED', label: 'Contacted', color: 'bg-amber-500' },
  { status: 'CONVERTED', label: 'Converted', color: 'bg-emerald-500' },
  { status: 'LOST', label: 'Lost', color: 'bg-rose-500' },
];

export function LeadsKanban({ leads, isLoading, onAIAction }: LeadsKanbanProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organization_id = user?.organization_id;
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('leadId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('leadId');
    if (!id) return;

    try {
      await analyticsService.updateLead(id, { status });
      toast.success(`Lead moved to ${status.toLowerCase()}`);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all(organization_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all(organization_id) });
    } catch (error) {
      toast.error('Failed to update lead status');
    }
    setDraggedId(null);
  };

  const handleConvert = async (lead: Lead) => {
    try {
      await analyticsService.convertToStudent(lead.id);
      toast.success(`${lead.full_name} converted to student!`);
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all(organization_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all(organization_id) });
    } catch (error) {
      toast.error('Conversion failed');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[600px]">
        {COLUMNS.map((col) => (
          <div key={col.status} className="bg-muted/30 rounded-2xl p-4 space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded-lg w-1/2" />
            <div className="h-32 bg-muted rounded-xl w-full" />
            <div className="h-32 bg-muted rounded-xl w-full" />
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
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreVertical className="size-4" />
                    </button>
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
                          title="Convert to Student"
                        >
                          <UserCheck className="size-3.5" />
                        </Button>
                      )}
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="size-7 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10"
                        title="AI Assistant"
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
                  Drop leads here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
