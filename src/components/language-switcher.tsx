'use client';

import { useLocale, useTranslations } from '@/i18n/index';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { type Locale } from '@/i18n/routing';

const LOCALE_OPTIONS: { value: Locale; label: string; nativeLabel: string; flag: string }[] = [
  { value: 'uz', label: "O'zbekcha", nativeLabel: "O'zbek", flag: '🇺🇿' },
  { value: 'ru', label: 'Русский', nativeLabel: 'Рус', flag: '🇷🇺' },
  { value: 'en', label: 'English', nativeLabel: 'Eng', flag: '🇬🇧' },
  { value: 'kg', label: 'Кыргызча', nativeLabel: 'Кырг', flag: '🇰🇬' },
];

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'header' | 'sidebar';
}

export function LanguageSwitcher({ className, variant = 'header' }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations('lang_switcher');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  };

  const current = LOCALE_OPTIONS.find((opt) => opt.value === locale) ?? LOCALE_OPTIONS[0];

  const menuItems = (
    <>
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
        {t('label')}
      </div>
      <DropdownMenuSeparator />
      {LOCALE_OPTIONS.map((opt) => (
        <DropdownMenuItem
          key={opt.value}
          onClick={() => handleLocaleChange(opt.value)}
          className={cn(
            'flex items-center gap-2.5 cursor-pointer text-sm',
            opt.value === locale && 'font-bold text-primary-emphasis bg-primary-muted'
          )}
        >
          <span className="text-base">{opt.flag}</span>
          <span>{opt.label}</span>
          {opt.value === locale && (
            <span className="ml-auto text-caption bg-primary-muted text-primary-emphasis px-1.5 py-0.5 rounded-md font-bold">
              ✓
            </span>
          )}
        </DropdownMenuItem>
      ))}
    </>
  );

  if (variant === 'sidebar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t('label')}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-sidebar-text hover:bg-sidebar-hover-bg hover:text-sidebar-foreground transition-all text-body-sm font-semibold w-full',
            isPending && 'opacity-60 pointer-events-none',
            className
          )}
          disabled={isPending}
        >
          <Globe className="size-5 shrink-0" />
          <span>{current.flag} {current.label}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="min-w-[170px]">
          {menuItems}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('label')}
        title={t('label')}
        className={cn(
          'flex items-center gap-1.5 rounded-xl font-semibold text-sm px-2.5 py-1.5 hover:bg-muted transition-colors text-foreground',
          isPending && 'opacity-60 pointer-events-none',
          className
        )}
        disabled={isPending}
      >
        {/* <Globe className="size-4 shrink-0" /> */}
        <span className="text-base leading-none">{current.flag}</span>
        {/* <span className="hidden sm:inline">{current.nativeLabel}</span> */}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[170px]">
        {menuItems}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
