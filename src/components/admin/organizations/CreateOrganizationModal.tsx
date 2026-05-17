'use client';

import { useForm } from 'react-hook-form';
import { Loader2, Building2, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateOrganization } from '@/hooks/useOrganizations';
import type { CreateOrganizationPayload, UserRole } from '@/types/platform';
import { useTranslations } from '@/i18n/index';

interface CreateOrganizationModalProps {
  open: boolean;
  onClose: () => void;
}

type FormValues = {
  Org_name: string;
  Org_email: string;
  adminName: string;
  adminEmail: string;
  phone: string;
  password: string;
  adminRole: UserRole;
};

export function CreateOrganizationModal({ open, onClose }: CreateOrganizationModalProps) {
  const createOrg = useCreateOrganization();
  const t = useTranslations('common');
  const tSettings = useTranslations('settings');
  const tAuth = useTranslations('auth');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      Org_name: '',
      Org_email: '',
      adminName: '',
      adminEmail: '',
      phone: '',
      password: '',
      adminRole: 'ADMIN',
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload: CreateOrganizationPayload = { ...values, Org_status: 'ACTIVE' };
    createOrg.mutate(payload, {
      onSuccess: () => { reset(); onClose(); },
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) { reset(); onClose(); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div>
              <DialogTitle>{t('create_organization')}</DialogTitle>
              <DialogDescription>
                {t('create_organization_desc')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="create-org-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Org section */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Building2 className="size-3" /> {tSettings('organization')}
            </p>
            <Field label={tSettings('organization_name')} error={errors.Org_name?.message}>
              <Input {...register('Org_name', { required: t('required') })} placeholder="e.g. Tech Academy" />
            </Field>
            <Field label={tSettings('business_email')} error={errors.Org_email?.message}>
              <Input type="email" {...register('Org_email', { required: t('required') })} placeholder="info@company.com" />
            </Field>
            <Field label={t('phone')} error={errors.phone?.message}>
              <Input {...register('phone', { required: t('required') })} placeholder="+996901234567" />
            </Field>
          </div>

          <Separator />

          {/* Admin section */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <UserCircle2 className="size-3" /> {t('admin_account')}
            </p>
            <Field label={tSettings('full_name')} error={errors.adminName?.message}>
              <Input {...register('adminName', { required: t('required') })} placeholder="First Last" />
            </Field>
            <Field label={t('admin_email')} error={errors.adminEmail?.message}>
              <Input type="email" {...register('adminEmail', { required: t('required') })} placeholder="admin@company.com" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tAuth('password')} error={errors.password?.message}>
                <Input
                  type="password"
                  {...register('password', { required: t('required'), minLength: { value: 6, message: t('min_6_chars') } })}
                  placeholder="••••••"
                />
              </Field>
              <Field label={t('role')}>
                <select
                  {...register('adminRole')}
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring transition-colors"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                </select>
              </Field>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={createOrg.isPending} className="rounded-xl">
            {t('cancel')}
          </Button>
          <Button type="submit" form="create-org-form" className="edu-gradient-btn rounded-xl" disabled={createOrg.isPending}>
            {createOrg.isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            {t('create_organization')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
