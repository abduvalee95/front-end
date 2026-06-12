'use client';

import { Server, AlertTriangle, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SectionHeader, FormField, ToggleRow, SaveButton } from './SharedComponents';
import { Activity } from 'lucide-react';

interface PlatformSectionProps {
  platformName: string;
  setPlatformName: (v: string) => void;
  supportEmail: string;
  setSupportEmail: (v: string) => void;
  maintenanceMode: boolean;
  setMaintenanceMode: (v: boolean) => void;
  selfRegistration: boolean;
  setSelfRegistration: (v: boolean) => void;
  trialPeriod: string;
  setTrialPeriod: (v: string) => void;
  maxOrgs: string;
  setMaxOrgs: (v: string) => void;
  savingSection: string | null;
  handleSave: (section: string) => void;
  systemMetrics: { label: string; value: string }[];
}

export function PlatformSection({
  platformName, setPlatformName,
  supportEmail, setSupportEmail,
  maintenanceMode, setMaintenanceMode,
  selfRegistration, setSelfRegistration,
  trialPeriod, setTrialPeriod,
  maxOrgs, setMaxOrgs,
  savingSection, handleSave,
  systemMetrics
}: PlatformSectionProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader icon={<Server className="size-4" />} title="Global Platform" desc="Master platform settings and branding" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-2xl border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/60 bg-muted/40">
            <CardTitle className="text-base font-black">Core Configuration</CardTitle>
            <CardDescription>Branding, limits, and access control.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Platform Name">
                <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="rounded-xl bg-muted/50 border-border h-9" />
              </FormField>
              <FormField label="Support Email">
                <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="rounded-xl bg-muted/50 border-border h-9" />
              </FormField>
              <FormField label="Trial Period (days)">
                <Input value={trialPeriod} onChange={(e) => setTrialPeriod(e.target.value)} type="number" min="1" className="rounded-xl bg-muted/50 border-border h-9" />
              </FormField>
              <FormField label="Max Organizations">
                <Input value={maxOrgs} onChange={(e) => setMaxOrgs(e.target.value)} type="number" min="1" className="rounded-xl bg-muted/50 border-border h-9" />
              </FormField>
            </div>
            <Separator />
            <div className="space-y-2">
              <ToggleRow
                title="Maintenance Mode"
                desc="Only Super Admins can access when enabled."
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
                danger
              />
              <ToggleRow
                title="Self-Registration"
                desc="Allow orgs to register without an invitation."
                checked={selfRegistration}
                onCheckedChange={setSelfRegistration}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/60 bg-muted/40 p-4 flex items-center justify-between gap-4">
            {maintenanceMode ? (
              <Alert className="rounded-xl border-amber-200 bg-amber-50 py-2 px-3 flex-1">
                <AlertTriangle className="size-3.5 text-amber-600" />
                <AlertDescription className="text-amber-700 text-xs">Maintenance mode is active — users cannot log in.</AlertDescription>
              </Alert>
            ) : (
              <div />
            )}
            <SaveButton isSaving={savingSection === 'platform'} onClick={() => handleSave('platform')} label="Save Changes" />
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border-0 bg-gradient-to-br from-[#0B1437] to-[#0d2046] text-white shadow-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(3,203,231,0.12),transparent_10rem)] pointer-events-none" />
            <CardHeader className="pb-3 relative">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Activity className="size-4 text-cyan-400" />
                </div>
                <CardTitle className="text-sm text-white">System Health</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 relative">
              {systemMetrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-bold text-cyan-400 font-mono">{m.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {maintenanceMode ? (
            <Alert className="rounded-2xl border-amber-200 bg-amber-50">
              <AlertTriangle className="size-4 text-amber-600" />
              <AlertTitle className="text-amber-800 font-bold text-sm">Maintenance Active</AlertTitle>
              <AlertDescription className="text-amber-700 text-xs">Users cannot log in.</AlertDescription>
            </Alert>
          ) : (
            <Alert className="rounded-2xl border-emerald-200 bg-emerald-50">
              <Zap className="size-4 text-emerald-600" />
              <AlertTitle className="text-emerald-800 font-bold text-sm">Platform Live</AlertTitle>
              <AlertDescription className="text-emerald-700 text-xs">All services running normally.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
