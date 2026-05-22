import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, CreditCard } from "lucide-react";

export const metadata = {
  title: 'Dashboard | Билим Нуру',
};

const stats = [
  { name: 'Jami Tashkilotlar', value: '24', icon: Building2, color: 'text-blue-500' },
  { name: 'Faol Studentlar', value: '1,284', icon: Users, color: 'text-green-500' },
  { name: 'Oylik tushum', value: '$12,450', icon: CreditCard, color: 'text-purple-500' },
  { name: 'O\'sish', value: '+12%', icon: TrendingUp, color: 'text-orange-500' },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">SuperAdmin Dashboard</h1>
        <p className="text-muted-foreground text-sm font-medium">all staticts about organization</p>
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
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border backdrop-blur-md h-80">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">last 5 active organizations</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-full">
            <span className="text-muted-foreground/50 text-sm italic">No data</span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border backdrop-blur-md h-80">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">last 5 active students</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-full">
            <span className="text-muted-foreground/50 text-sm italic">Ma&apos;lumotlar yo&apos;q</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
