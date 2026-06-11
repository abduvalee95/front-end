'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, BadgeCheck, PauseCircle } from "lucide-react";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useUsers } from "@/hooks/useUsers";

export default function AdminDashboardPage() {
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
    { name: 'Jami Tashkilotlar', value: totalOrgs, icon: Building2, color: 'text-blue-500', loading: orgsQuery.isLoading },
    { name: 'Faol Tashkilotlar', value: activeOrgs, icon: BadgeCheck, color: 'text-green-500', loading: orgsQuery.isLoading },
    { name: 'Nofaol Tashkilotlar', value: inactiveOrgs, icon: PauseCircle, color: 'text-orange-500', loading: orgsQuery.isLoading },
    { name: 'Jami Foydalanuvchilar', value: totalUsers, icon: Users, color: 'text-purple-500', loading: usersQuery.isLoading },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">SuperAdmin Dashboard</h1>
        <p className="text-muted-foreground text-sm font-medium">Platforma bo&apos;yicha umumiy statistika</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-card border-border backdrop-blur-md overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {stat.name}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Oxirgi tashkilotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orgsQuery.isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : latestOrgs.length === 0 ? (
              <p className="text-muted-foreground/50 text-sm italic text-center py-8">Ma&apos;lumotlar yo&apos;q</p>
            ) : (
              latestOrgs.map((org) => (
                <div key={org.id} className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString('uz-UZ')} · {org.usersCount} foydalanuvchi
                    </p>
                  </div>
                  <Badge variant={org.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {org.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Oxirgi foydalanuvchilar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {usersQuery.isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : latestUsers.length === 0 ? (
              <p className="text-muted-foreground/50 text-sm italic text-center py-8">Ma&apos;lumotlar yo&apos;q</p>
            ) : (
              latestUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <Badge variant="secondary">{u.role}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
