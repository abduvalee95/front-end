'use client';

import { format } from 'date-fns';
import { Mail, Phone, Users, Calendar, Pencil, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { OrganizationStatusBadge } from './OrganizationStatusBadge';
import { cn } from '@/lib/utils';
import type { PlatformOrganization } from '@/types/platform';

interface OrgDetailDrawerProps {
  org: PlatformOrganization | null;
  onClose: () => void;
  onEdit: (org: PlatformOrganization) => void;
  onToggleStatus: (org: PlatformOrganization) => void;
}

export function OrgDetailDrawer({ org, onClose, onEdit, onToggleStatus }: OrgDetailDrawerProps) {
  return (
    <Sheet open={!!org} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle className="sr-only">Organization Details</SheetTitle>
          <SheetDescription className="sr-only">View and manage organization</SheetDescription>
          {org && (
            <div className="flex items-center gap-4">
              <Avatar className="size-14 rounded-2xl shrink-0">
                <AvatarFallback className="rounded-2xl text-h1 edu-gradient-avatar">
                  {org.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-h3 truncate">{org.name}</p>
                <div className="mt-1">
                  <OrganizationStatusBadge status={org.status} />
                </div>
              </div>
            </div>
          )}
        </SheetHeader>

        {org && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-0.5">
              <DetailRow icon={Mail} label="Email" value={org.email} />
              <DetailRow icon={Phone} label="Phone" value={org.phone || '—'} />
              <DetailRow icon={Users} label="Users" value={`${org.usersCount} members`} />
              <Separator className="my-2" />
              <DetailRow
                icon={Calendar}
                label="Created"
                value={format(new Date(org.created_at), 'MMM d, yyyy')}
              />
              <DetailRow
                icon={Calendar}
                label="Updated"
                value={format(new Date(org.updated_at), 'MMM d, yyyy')}
              />
            </div>

            <SheetFooter className="px-6 py-4 border-t flex flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(org)}
              >
                <Pencil className="mr-2 size-3.5" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  'flex-1',
                  org.status === 'ACTIVE'
                    ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                    : 'border-success/30 text-success-emphasis hover:bg-success/10',
                )}
                onClick={() => onToggleStatus(org)}
              >
                <Power className="mr-2 size-3.5" />
                {org.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-caption font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-h4 truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}
