'use client';

import { 
  Users, 
  CalendarDays, 
  AlertTriangle, 
  ClipboardList, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip,
  AreaChart,
  Area
} from 'recharts';

const pieData = [
  { name: 'English', value: 45, color: '#3b82f6' }, 
  { name: 'IT Courses', value: 30, color: '#6366f1' }, 
  { name: 'Math', value: 25, color: '#8b5cf6' }, 
];

const barData = [
  { name: 'Cash', value: 25, color: '#2dd4bf' }, 
  { name: 'Card', value: 85, color: '#3b82f6' }, 
  { name: 'Bank', value: 10, color: '#64748b' }, 
];

const recentActivity = [
  { id: 1, type: 'lead', title: 'New Lead: Sarah Johnson', time: '10 min ago', status: 'new' },
  { id: 2, type: 'payment', title: 'Payment received: $450', time: '1 hour ago', status: 'success' },
  { id: 3, type: 'class', title: 'IT Course - Group A started', time: '2 hours ago', status: 'active' },
];

export default function DashboardPage() {
  return (
    <div className="w-full h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 text-white shadow-2xl border border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_25rem)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
              <Sparkles className="size-4" />
              <span>System Insights</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Welcome back, Bilim Nuru Admin
            </h1>
            <p className="text-slate-300 max-w-xl font-medium">
              Everything is looking good today. You have <span className="text-blue-400 font-bold">12 new leads</span> and 3 upcoming classes in the next hour.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all backdrop-blur-md border border-white/10">
              Generate Report
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-600/25">
              Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value="92" 
          subtitle="Full paid: 46" 
          icon={Users} 
          trend="+12%" 
          trendUp={true}
          color="#3b82f6"
        />
        <StatCard 
          title="March Payments" 
          value="364,950" 
          unit="som" 
          subtitle="Pending: 17" 
          icon={CalendarDays} 
          trend="+8%" 
          trendUp={true}
          color="#2dd4bf"
        />
        <StatCard 
          title="April Payments" 
          value="203,800" 
          unit="som" 
          subtitle="Pending: 45" 
          icon={CalendarDays} 
          trend="-3%" 
          trendUp={false}
          color="#f59e0b"
        />
        <StatCard 
          title="Payment Risk" 
          value="16" 
          subtitle="Partial: 30" 
          icon={AlertTriangle} 
          trend="+2" 
          trendUp={false}
          color="#f43f5e"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Charts Area */}
        <div className="xl:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Distribution Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 shadow-sm border border-slate-200/50 transition-all hover:shadow-xl hover:shadow-slate-200/40 min-w-0">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Leads by Status</h3>
                  <p className="text-sm text-slate-400 font-medium">Conversion funnel overview</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <TrendingUp className="size-5 text-slate-400" />
                </div>
              </div>
              <div className="h-[300px] w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-slate-500">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 shadow-sm border border-slate-200/50 transition-all hover:shadow-xl hover:shadow-slate-200/40 min-w-0">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Payment Stats</h3>
                  <p className="text-sm text-slate-400 font-medium">Daily transaction breakdown</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <Clock className="size-5 text-slate-400" />
                </div>
              </div>
              <div className="h-[280px] w-full mt-4 min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={45}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Activity Area */}
        <div className="space-y-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 shadow-sm border border-slate-200/50 h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900">Recent Activity</h3>
              <button className="text-blue-500 font-bold text-xs hover:underline flex items-center gap-1">
                View All <ChevronRight className="size-3" />
              </button>
            </div>
            <div className="space-y-6">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4 group cursor-pointer">
                  <div className={`size-10 rounded-xl shrink-0 flex items-center justify-center ${
                    activity.status === 'new' ? 'bg-blue-50 text-blue-500' :
                    activity.status === 'success' ? 'bg-emerald-50 text-emerald-500' :
                    'bg-amber-50 text-amber-500'
                  }`}>
                    {activity.type === 'lead' ? <Users className="size-5" /> :
                     activity.type === 'payment' ? <CreditCard className="size-5" /> :
                     <CalendarDays className="size-5" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{activity.title}</p>
                    <p className="text-xs font-medium text-slate-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-blue-100/50">
                <p className="text-sm font-black text-slate-900 mb-2">Today's Attendance</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-indigo-600">0%</span>
                  <span className="text-xs font-bold text-slate-400 mb-1">vs yesterday</span>
                </div>
                <div className="w-full h-2 bg-slate-200/50 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[0%] transition-all duration-1000" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, subtitle, icon: Icon, trend, trendUp, color }: any) {
  return (
    <div 
      className="bg-white/80 backdrop-blur-sm rounded-[32px] p-6 shadow-sm border border-slate-200/50 transition-all hover:shadow-xl hover:shadow-slate-200/40 group overflow-hidden relative"
      style={{ borderLeft: `6px solid ${color}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="size-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm" style={{ backgroundColor: `${color}15`, color: color }}>
          <Icon className="size-6" />
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black",
          trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
        )}>
          {trendUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
          {unit && <span className="text-sm font-bold text-slate-400">{unit}</span>}
        </div>
        <div className="text-[11px] font-semibold text-slate-400 pt-1 flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-slate-300" />
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function CreditCard({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
  );
}
