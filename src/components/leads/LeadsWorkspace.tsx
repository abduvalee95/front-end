'use client';

import { useState } from 'react';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { 
  Users, 
  Search, 
  Filter, 
  Sparkles, 
  MoreHorizontal, 
  Phone, 
  Mail, 
  Clock,
  ChevronRight,
  UserCheck,
  UserMinus,
  MessageSquarePlus,
  Loader2,
  X,
} from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { Lead, LeadStatus } from '@/types/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';
import { AILeadResponse } from '../analytics/AILeadResponse';
import { CreateLeadModal } from './CreateLeadModal';

export function LeadsWorkspace() {
  const { value: search, debouncedValue: debouncedSearch, handleChange: setSearch, clearSearch, isPending: isSearching } = useDebounceSearch({ delay: 300 });
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  
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
      case 'NEW': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">New</Badge>;
      case 'CONTACTED': return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Contacted</Badge>;
      case 'CONVERTED': return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Converted</Badge>;
      case 'LOST': return <Badge variant="secondary" className="bg-rose-500/10 text-rose-500 border-rose-500/20">Lost</Badge>;
    }
  };

  const handleAIAction = (lead: Lead) => {
    setSelectedLead(lead);
    setIsAIModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads Management</h1>
          <p className="text-muted-foreground mt-1">Manage potential students and use AI to boost conversion.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            className="edu-gradient-primary text-white"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Users className="mr-2 size-4" />
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="md:col-span-2 relative">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin pointer-events-none" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          )}
          <Input 
            placeholder="Search leads by name or phone..." 
            className={`pl-10${search ? ' pr-9' : ''}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" className="w-full justify-between">
                <Filter className="mr-2 size-4" />
                {statusFilter === 'ALL' ? 'All Statuses' : statusFilter}
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem onClick={() => setStatusFilter('ALL')}>All Statuses</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter('NEW')}>New</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('CONTACTED')}>Contacted</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('CONVERTED')}>Converted</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('LOST')}>Lost</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Lead Info</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Source</th>
                <th className="px-6 py-4 font-semibold">Created At</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6 h-16 bg-muted/20" />
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground group-hover:text-indigo-500 transition-colors">
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
                          className="h-8 w-8 p-0 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10"
                          onClick={() => handleAIAction(lead)}
                          title="Generate AI Response"
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
                            <DropdownMenuLabel>Manage Lead</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleAIAction(lead)}>
                              <Sparkles className="mr-2 size-4 text-indigo-500" />
                              Generate AI Response
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <MessageSquarePlus className="mr-2 size-4" />
                              Add Comment
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-emerald-500">
                              <UserCheck className="mr-2 size-4" />
                              Convert to Student
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-rose-500">
                              <UserMinus className="mr-2 size-4" />
                              Mark as Lost
                            </DropdownMenuItem>
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
      </div>

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
