'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, BadgeCheck, PauseCircle, ArrowUpRight, Activity } from "lucide-react";
import Link from "next/link";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useUsers } from "@/hooks/useUsers";
import { useTranslations, useLocale } from "@/i18n/index";

export default function AdminDashboardPage() {
  const t = useTranslations('admin');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const orgsQuery = useOrganizations({ page: 1, limit: 100 });
  const usersQuery = useUsers({ page: 1, limit: 5 });

  const orgs = orgsQuery.data?.items ?? [];
  const totalOrgs = orgsQuery.data?.meta.total ?? 0;
  const activeOrgs = orgs.filter((o) => o.status === 'ACTIVE').length;
  const inactiveOrgs = orgs.filter((o) => o.status === 'INACTIVE').length;
  const totalUsers = usersQuery.data?.meta.total ?? 0;

  const latestOrgs = [...orgs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const latestUsers = usersQuery.data?.items ?? [];

  const stats = [
    { name: t('dashboard.total_orgs'), value: totalOrgs, icon: Building2, accent: 'text-primary-emphasis', bar: 'from-primary/70', chip: 'bg-primary/10 border-primary/20', loading: orgsQuery.isLoading },
    { name: t('dashboard.active_orgs'), value: activeOrgs, icon: BadgeCheck, accent: 'text-success-emphasis', bar: 'from-success/70', chip: 'bg-success/10 border-success/20', loading: orgsQuery.isLoading },
    { name: t('dashboard.inactive_orgs'), value: inactiveOrgs, icon: PauseCircle, accent: 'text-warning-emphasis', bar: 'from-warning/70', chip: 'bg-warning/10 border-warning/20', loading: orgsQuery.isLoading },
    { name: t('dashboard.total_users'), value: totalUsers, icon: Users, accent: 'text-primary-emphasis', bar: 'from-primary/70', chip: 'bg-primary/10 border-primary/20', loading: usersQuery.isLoading },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,#07111f_0%,#0c2733_55%,#081726_100%)] p-7 text-white shadow-2xl sm:p-9">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(3,203,231,0.22),transparent_22rem),radial-gradient(circle_at_10%_90%,rgba(0,236,129,0.12),transparent_18rem)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:36px_36px]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-primary-emphasis/80">
              <Activity className="size-3.5" /> {t('console_tag')}
            </p>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              {t('dashboard.title')}
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {t('dashboard.subtitle')}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <span className="flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-success-emphasis/90">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-success" />
              </span>
              {t('live')}
            </span>
            <Link
              href="/admin/organizations"
              className="group flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              {tNav('organizations')}
              <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Stats strip inside hero */}
        <div className="relative mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.name}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
              style={{ animationDelay: `${i * 90}ms`, animationDuration: '600ms' }}
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${stat.bar} to-transparent`} />
              <div className="flex items-start justify-between">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {stat.name}
                </p>
                <div className={`flex size-7 items-center justify-center rounded-lg border ${stat.chip}`}>
                  <stat.icon className={`size-3.5 ${stat.accent}`} />
                </div>
              </div>
              {stat.loading ? (
                <Skeleton className="mt-2 h-9 w-16 bg-white/10" />
              ) : (
                <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-white">
                  {stat.value.toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Lists ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-[24px] border-border/70 bg-card/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-extrabold tracking-tight text-foreground">
              {t('dashboard.latest_orgs')}
            </CardTitle>
            <Link
              href="/admin/organizations"
              className="flex items-center gap-1 text-xs font-bold text-primary transition-opacity hover:opacity-70"
            >
              {t('view_all')} <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {orgsQuery.isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
            ) : latestOrgs.length === 0 ? (
              <p className="py-8 text-center text-sm italic text-muted-foreground/50">{t('no_data')}</p>
            ) : (
              latestOrgs.map((org, i) => (
                <div
                  key={org.id}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border/50 px-4 py-3 transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.04] animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                  style={{ animationDelay: `${i * 70}ms`, animationDuration: '500ms' }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-sm font-black text-primary">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{org.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString(locale)} · {t('users_count', { count: org.usersCount })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      org.status === 'ACTIVE'
                        ? 'shrink-0 rounded-md border-success/25 bg-success/15 text-success-emphasis'
                        : 'shrink-0 rounded-md border-warning/25 bg-warning/15 text-warning-emphasis'
                    }
                  >
                    {org.status === 'ACTIVE' ? t('active') : t('inactive')}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-border/70 bg-card/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-extrabold tracking-tight text-foreground">
              {t('dashboard.latest_users')}
            </CardTitle>
            <Link
              href="/admin/users"
              className="flex items-center gap-1 text-xs font-bold text-primary transition-opacity hover:opacity-70"
            >
              {t('view_all')} <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {usersQuery.isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
            ) : latestUsers.length === 0 ? (
              <p className="py-8 text-center text-sm italic text-muted-foreground/50">{t('no_data')}</p>
            ) : (
              latestUsers.map((u, i) => (
                <div
                  key={u.id}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border/50 px-4 py-3 transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.04] animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                  style={{ animationDelay: `${i * 70}ms`, animationDuration: '500ms' }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-sm font-black text-primary-emphasis">
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{u.full_name}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 rounded-md font-mono text-[10px] uppercase tracking-wider">
                    {u.role}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
