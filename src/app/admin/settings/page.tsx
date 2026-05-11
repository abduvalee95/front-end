'use client';

import { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Save,
  AlertTriangle,
  Server,
  Lock,
  Loader2,
  Database,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@base-ui/react/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';



export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('platform');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest">
          <Settings className="size-4" />
          <span>System Administration</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Platform Settings</h1>
        <p className="text-slate-500 font-medium">Global configuration and system-level management for Bilim Nuru.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100/80 p-1.5 rounded-2xl w-full justify-start border border-slate-200">
          <TabsTrigger value="platform" className="rounded-xl gap-2 px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Server className="size-4" />
            Global Platform
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl gap-2 px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Lock className="size-4" />
            System Security
          </TabsTrigger>
          <TabsTrigger value="database" className="rounded-xl gap-2 px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Database className="size-4" />
            Infrastructure
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSave}>
          <TabsContent value="platform" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-[32px] overflow-hidden">
                <CardHeader className="bg-slate-50/50 pb-8 border-b border-slate-100">
                  <CardTitle className="text-2xl font-black">Core Configuration</CardTitle>
                  <CardDescription>Master platform settings and branding.</CardDescription>
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Name</Label>
                      <Input defaultValue="Bilim Nuru" className="bg-slate-50/50 border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Support Email</Label>
                      <Input defaultValue="support@bilimnuru.uz" className="bg-slate-50/50 border-slate-200" />
                    </div>
                  </div>
                  
                  <Separator className="bg-slate-100" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-black">Maintenance Mode</Label>
                        <p className="text-xs text-slate-400">Only Super Admins can access the platform when enabled.</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-black">Self-Registration</Label>
                        <p className="text-xs text-slate-400">Allow organizations to register themselves without invitation.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6 flex justify-end">
                  <Button type="submit" disabled={isSaving} className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-8 shadow-xl shadow-slate-900/20">
                    {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                    Save Core Settings
                  </Button>
                </CardFooter>
              </Card>

              <div className="space-y-6">
                <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-[32px] bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Activity className="size-5 text-cyan-400" />
                      </div>
                      <CardTitle className="text-lg">System Health</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">API Status</span>
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Latency</span>
                      <span className="font-bold">24ms</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Uptime</span>
                      <span className="font-bold">99.98%</span>
                    </div>
                  </CardContent>
                </Card>

                <Alert className="rounded-3xl border-amber-100 bg-amber-50">
                  <AlertTriangle className="size-5 text-amber-600" />
                  <AlertTitle className="text-amber-800 font-bold">Heads up!</AlertTitle>
                  <AlertDescription className="text-amber-700 text-xs">
                    Changing global settings may affect all active organizations. Proceed with caution.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
             <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-[32px] overflow-hidden">
                <CardHeader className="bg-slate-50/50 pb-8 border-b border-slate-100">
                  <CardTitle className="text-2xl font-black">Global Security Policy</CardTitle>
                  <CardDescription>Enforce security standards across all organizations.</CardDescription>
                </CardHeader>
                <CardContent className="pt-8 space-y-6">
                   <div className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-slate-50/30">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-4 text-slate-900" />
                          <Label className="text-base font-black">Mandatory 2FA</Label>
                        </div>
                        <p className="text-sm text-slate-400">Require all Admin and Manager roles to use Two-Factor Authentication.</p>
                      </div>
                      <Switch />
                   </div>

                   <div className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-slate-50/30">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Cpu className="size-4 text-slate-900" />
                          <Label className="text-base font-black">IP Whitelisting</Label>
                        </div>
                        <p className="text-sm text-slate-400">Restrict access to specific IP ranges for Super Admin dashboard.</p>
                      </div>
                      <Switch />
                   </div>
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6 flex justify-end gap-3">
                  <Button variant="outline" className="rounded-2xl border-slate-200">View Logs</Button>
                  <Button type="submit" disabled={isSaving} className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-8">
                    Update Security Policy
                  </Button>
                </CardFooter>
             </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-[32px] overflow-hidden">
              <CardHeader className="bg-slate-50/50 pb-8 border-b border-slate-100">
                <CardTitle className="text-2xl font-black">Infrastructure Management</CardTitle>
                <CardDescription>Manage database backups and system resources.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="flex items-center justify-between p-6 rounded-3xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                      <Database className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Automated Backups</p>
                      <p className="text-xs text-blue-600 font-medium italic">Next backup: 3:00 AM</p>
                    </div>
                  </div>
                  <Button className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl shadow-sm">
                    Backup Now
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2">Recent Backups</h4>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <History className="size-4 text-slate-400" />
                          <span className="text-sm font-medium">backup_full_2024_05_0{i}.sql</span>
                        </div>
                        <Badge variant="outline" className="rounded-lg">1.2 GB</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  );
}
