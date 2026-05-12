'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from '@/i18n/index';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Theme labels are translated dynamically in component

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('common');
  
  const themes = [
    { value: 'light', label: t('theme_light'), icon: Sun },
    { value: 'dark', label: t('theme_dark'), icon: Moon },
    { value: 'system', label: t('theme_system'), icon: Monitor },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn('size-8', className)}
            aria-label={t('toggle_theme')}
          />
        }
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">{t('toggle_theme')}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
            <Icon className="mr-2 size-4" />
            {label}
            {theme === value && <Check className="ml-auto size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
