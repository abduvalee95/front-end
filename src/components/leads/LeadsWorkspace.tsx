'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { LeadsKanban } from './LeadsKanban';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import {
  Users,
  Search,
  Filter,
  Sparkles,
  MoreHorizontal,
  Phone,
  Clock,
  UserCheck,
  UserMinus,
  Loader2,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useLeads, useConvertLead, useUpdateLead } from '@/hooks/useLeads';
import { Lead, LeadStatus } from '@/types/analytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';
import { AILeadResponse } from '../analytics/AILeadResponse';
import { CreateLeadModal } from './CreateLeadModal';

export function LeadsWorkspace() {
  const t = useTranslations('leads');
  const tCommon = useTranslations('common');
  const { value: search, debouncedValue: debouncedSearch, handleChange: setSearch, clearSearch, isPending: isSearching } = useDebounceSearch({ delay: 300 });
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  
  const leads = useLeads({
    page: 1,
    limit: 100,
    search: debouncedSearch || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredLeads = leads.data?.items ?? [];

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'NEW': return <Badge variant="secondary" className="bg-primary/10 text-primary-emphasis border-primary/20">{t('status_new')}</Badge>;
      case 'CONTACTED': return <Badge variant="secondary" className="bg-warning/10 text-warning-emphasis border-warning/20">{t('status_contacted')}</Badge>;
      case 'CONVERTED': return <Badge variant="secondary" className="bg-success/10 text-success-emphasis border-success/20">{t('status_converted')}</Badge>;
      case 'LOST': return <Badge variant="secondary" className="bg-danger/10 text-danger-emphasis border-danger/20">{t('status_lost')}</Badge>;
    }
  };

  const convertLead = useConvertLead();
  const updateLead = useUpdateLead();

  const handleConvert = (lead: Lead) => {
    if (lead.status === 'CONVERTED' || lead.status === 'LOST') return;
    convertLead.mutate(lead.id);
  };

  const handleMarkLost = (lead: Lead) => {
    updateLead.mutate({ id: lead.id, data: { status: 'LOST' } });
  };

  const handleAIAction = (lead: Lead) => {
    setSelectedLead(lead);
    setIsAIModalOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Users}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <>
            <div className="flex items-center rounded-control border border-border bg-muted p-0.5">
              <Button
                variant={view === 'kanban' ? 'primary' : 'ghost'}
                size="sm"
                aria-label={t('view_kanban')}
                aria-pressed={view === 'kanban'}
                onClick={() => setView('kanban')}
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                variant={view === 'table' ? 'primary' : 'ghost'}
                size="sm"
                aria-label={t('view_table')}
                aria-pressed={view === 'table'}
                onClick={() => setView('table')}
              >
                <List className="size-4" />
              </Button>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Users className="size-4" />
              {t('add_lead')}
            </Button>
          </>
        }
      />

      {/* Filters & Search — only in table view */}
      {view === 'table' && <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-card border border-border bg-card p-4 shadow-card">
        <div className="md:col-span-2 relative">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin pointer-events-none" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          )}
          <Input 
            placeholder={`${tCommon('search')} ${t('full_name')} ${tCommon('or')} ${t('phone')}...`} 
            className={`pl-10${search ? ' pr-9' : ''}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={tCommon('clear')}
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" className="w-full justify-between">
                <Filter className="mr-2 size-4" />
                {statusFilter === 'ALL' ? tCommon('all_statuses') : t(`status_${statusFilter.toLowerCase()}`)}
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem onClick={() => setStatusFilter('ALL')}>{tCommon('all_statuses')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter('NEW')}>{t('status_new')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('CONTACTED')}>{t('status_contacted')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('CONVERTED')}>{t('status_converted')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('LOST')}>{t('status_lost')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>}

      {/* Kanban View */}
      {view === 'kanban' && (
        <LeadsKanban
          leads={filteredLeads}
          isLoading={leads.isLoading}
          onAIAction={handleAIAction}
        />
      )}

      {/* Table Section */}
      {view === 'table' &&
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('full_name')}</th>
                <th className="px-6 py-4 font-semibold">{tCommon('status')}</th>
                <th className="px-6 py-4 font-semibold">{t('source')}</th>
                <th className="px-6 py-4 font-semibold">{tCommon('created_at')}</th>
                <th className="px-6 py-4 font-semibold text-right">{tCommon('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4"><Skeleton className="h-10 w-full max-w-[200px]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    {tCommon('no_data')}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground group-hover:text-primary-emphasis transition-colors">
                          {lead.full_name}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <Phone className="size-3" />
                          {lead.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Badge variant="outline" className="font-normal capitalize">
                          {lead.source.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground" suppressHydrationWarning>
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3" />
                        {format(parseISO(lead.created_at), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-primary-emphasis hover:text-primary-emphasis hover:bg-primary/10"
                          onClick={() => handleAIAction(lead)}
                          title={t('generate_ai_response')}
                        >
                          <Sparkles className="size-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                            <DropdownMenuLabel>{t('title')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleAIAction(lead)}>
                              <Sparkles className="mr-2 size-4 text-primary-emphasis" />
                              {t('generate_ai_response')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-success-emphasis"
                              onClick={() => handleConvert(lead)}
                              disabled={lead.status === 'CONVERTED' || lead.status === 'LOST' || convertLead.isPending}
                            >
                              <UserCheck className="mr-2 size-4" />
                              {convertLead.isPending ? tCommon('loading') : t('convert')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-danger-emphasis"
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>}

      <AILeadResponse 
        lead={selectedLead} 
        isOpen={isAIModalOpen} 
        onClose={() => {
          setIsAIModalOpen(false);
          setSelectedLead(null);
        }} 
      />
      <CreateLeadModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
