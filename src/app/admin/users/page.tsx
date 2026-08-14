'use client';

import { Users, ShieldCheck, Sparkles } from 'lucide-react';
import { UsersTable } from '@/components/users/UsersTable';
import { useUsers } from '@/hooks/useUsers';
import { useTranslations } from '@/i18n/index';

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const totalQuery = useUsers({ page: 1, limit: 1 });
  const totalUsers = totalQuery.data?.meta.total;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-card border border-border bg-[linear-gradient(160deg,#07111f_0%,#0c2733_60%,#081726_100%)] p-7 text-background shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(3,203,231,0.2),transparent_22rem)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <p className="flex items-center gap-2 tabular-nums text-caption font-bold uppercase tracking-normal text-primary-emphasis/80">
              <ShieldCheck className="size-3.5" /> {t('console_tag')}
            </p>
            <h1 className="text-h1 tracking-tight md:text-h1">
              {t('users.title')}
            </h1>
            <p className="max-w-xl font-medium text-muted-foreground">
              {t('users.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-6 py-4 backdrop-blur-md">
              <div className="flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/15">
                <Users className="size-6 text-primary-emphasis" />
              </div>
              <div>
                <p className="tabular-nums text-caption font-bold uppercase tracking-normal text-primary-emphasis/60">{t('users.total_platform')}</p>
                <p className="text-h1 tabular-nums text-background">{totalUsers ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8">
        <div className="rounded-card border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-md transition-shadow hover:shadow-xl sm:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-h2 text-foreground">{t('users.directory')}</h3>
              <p className="text-h4 text-muted-foreground">{t('users.directory_sub')}</p>
            </div>
            <div className="rounded-2xl bg-muted p-3">
              <Sparkles className="size-5 text-muted-foreground" />
            </div>
          </div>

          <UsersTable />
        </div>
      </div>
    </div>
  );
}
