'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Loader2, Building2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUpdateOrganization } from '@/hooks/useOrganizations';
import type { PlatformOrganization, UpdateOrganizationPayload } from '@/types/platform';
import { useTranslations } from '@/i18n/index';

interface EditOrganizationModalProps {
  org: PlatformOrganization | null;
  onClose: () => void;
}

type FormValues = {
  name: string;
  email: string;
  phone: string;
  telegram_chat_id: string;
  whatsapp_target: string;
};

export function EditOrganizationModal({ org, onClose }: EditOrganizationModalProps) {
  const updateOrg = useUpdateOrganization();
  const t = useTranslations('common');
  const tSettings = useTranslations('settings');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    if (org) {
      reset({
        name: org.name,
        email: org.email,
        phone: org.phone ?? '',
        telegram_chat_id: '',
        whatsapp_target: '',
      });
    }
  }, [org, reset]);

  const onSubmit = (values: FormValues) => {
    if (!org) return;
    const payload: UpdateOrganizationPayload = {
      name: values.name || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      telegram_chat_id: values.telegram_chat_id || undefined,
      whatsapp_target: values.whatsapp_target || undefined,
    };
    updateOrg.mutate({ id: org.id, payload }, { onSuccess: onClose });
  };

  return (
    <Sheet open={!!org} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            {org && (
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="edu-gradient-avatar font-semibold">
                  {org.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0">
              <SheetTitle className="truncate">{org?.name ?? t('edit_organization')}</SheetTitle>
              <SheetDescription>{t('update_org_details')}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="edit-org-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Building2 className="size-3" /> {t('basic_info')}
              </p>
              <Field label={`${t('name')} *`} error={errors.name?.message}>
                <Input {...register('name', { required: t('required') })} />
              </Field>
              <Field label={`${t('email')} *`} error={errors.email?.message}>
                <Input type="email" {...register('email', { required: t('required') })} />
              </Field>
              <Field label={t('phone')}>
                <Input {...register('phone')} placeholder="+996901234567" />
              </Field>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare className="size-3" /> {tSettings('integrations')}
              </p>
              <Field label={tSettings('chat_id')}>
                <Input {...register('telegram_chat_id')} placeholder="-100xxxxxxxxxx" />
              </Field>
              <Field label={t('whatsapp_number')}>
                <Input {...register('whatsapp_target')} placeholder="+996901234567" />
              </Field>
            </div>
          </form>
        </div>

        <SheetFooter className="px-6 py-4 border-t flex flex-row gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={updateOrg.isPending}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="edit-org-form" className="edu-gradient-btn rounded-lg" disabled={updateOrg.isPending}>
            {updateOrg.isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            {tSettings('save_changes')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
