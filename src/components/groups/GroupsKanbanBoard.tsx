'use client';

import { useMemo } from 'react';
import { RefreshCw, Trash2, Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Group } from '@/types/group';
import { EditGroupModal } from './EditGroupModal';
import { EnrollStudentModal } from './EnrollStudentModal';

interface GroupsKanbanBoardProps {
  groups: Group[];
  canManage: boolean;
  isDeleting: string | null;
  onDelete: (id: string, name: string) => void;
}

export function GroupsKanbanBoard({ groups, canManage, isDeleting, onDelete }: GroupsKanbanBoardProps) {
  // Logic to split groups into 3 categories
  const { forming, active, completed } = useMemo(() => {
    const now = new Date();
    // Normalize to start of day for fair comparison
    now.setHours(0, 0, 0, 0);

    const forming: Group[] = [];
    const active: Group[] = [];
    const completed: Group[] = [];

    groups.forEach((g) => {
      const start = new Date(g.start_date);
      const end = new Date(g.end_date);
      
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      if (now < start) {
        forming.push(g);
      } else if (now > end) {
        completed.push(g);
      } else {
        active.push(g);
      }
    });

    return { forming, active, completed };
  }, [groups]);

  const columns = [
    {
      id: 'forming',
      title: 'Forming (Upcoming)',
      color: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400',
      dotColor: 'bg-amber-500',
      items: forming,
    },
    {
      id: 'active',
      title: 'Active (In Progress)',
      color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
      dotColor: 'bg-emerald-500',
      items: active,
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'bg-slate-500/10 border-slate-500/20 text-slate-700 dark:text-slate-400',
      dotColor: 'bg-slate-500',
      items: completed,
    },
  ];

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return d;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:gap-8">
      {columns.map((column) => (
        <div key={column.id} className="flex flex-col gap-4">
          {/* Column Header */}
          <div className={cn('flex items-center justify-between rounded-2xl border px-5 py-3', column.color)}>
            <div className="flex items-center gap-2.5">
              <span className={cn('size-2.5 rounded-full', column.dotColor)} />
              <h3 className="font-bold tracking-tight">{column.title}</h3>
            </div>
            <Badge variant="secondary" className="rounded-full bg-white/50 dark:bg-black/20">
              {column.items.length}
            </Badge>
          </div>

          {/* Column Cards Container */}
          <div className="flex flex-col gap-4 rounded-3xl bg-muted/30 p-2 min-h-[500px]">
            {column.items.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 text-center">
                <p className="text-sm font-medium text-muted-foreground">No groups here</p>
              </div>
            ) : (
              column.items.map((group) => (
                <Card 
                  key={group.id} 
                  className="group relative flex flex-col overflow-hidden rounded-[1.25rem] border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardContent className="p-4">
                    {/* Course Badge & Actions */}
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <Badge variant="outline" className="rounded-md border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">
                        {group.course?.title ?? 'No Course'}
                      </Badge>
                      
                      {canManage && (
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <EnrollStudentModal groupId={group.id} groupName={group.name} />
                          <EditGroupModal group={group} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={isDeleting === group.id}
                            onClick={() => onDelete(group.id, group.name)}
                            title="Delete group"
                          >
                            {isDeleting === group.id ? (
                              <RefreshCw className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Group Name */}
                    <Link href={`/groups/${group.id}`}>
                      <h4 className="mb-4 text-lg font-bold leading-tight tracking-tight text-foreground hover:text-primary hover:underline transition-colors cursor-pointer">
                        {group.name}
                      </h4>
                    </Link>

                    {/* Teacher & Dates */}
                    <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-6">
                          <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                            {group.teacher?.full_name?.charAt(0) ?? 'T'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-muted-foreground">
                          {group.teacher?.full_name ?? 'Unassigned'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Calendar className="size-3.5" />
                        <span>{formatDate(group.start_date)} — {formatDate(group.end_date)}</span>
                      </div>
                    </div>
                    
                    {/* Duration Progress Bar (Visual flair for Active) */}
                    {column.id === 'active' && (
                      <div className="mt-4">
                        <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <span>Progress</span>
                          <span>In progress</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-emerald-500 w-[50%] animate-pulse rounded-full" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
