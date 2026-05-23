import uz from '../../../messages/uz.json';
import ru from '../../../messages/ru.json';
import en from '../../../messages/en.json';
import kg from '../../../messages/kg.json';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/i18n/routing';

type Messages = Record<string, unknown>;

const DICTIONARIES: Record<Locale, Messages> = {
  uz: uz as Messages,
  ru: ru as Messages,
  en: en as Messages,
  kg: kg as Messages,
};

function readLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const raw = match?.[1];
  if (raw && (LOCALES as ReadonlyArray<string>).includes(raw)) {
    return raw as Locale;
  }
  return DEFAULT_LOCALE;
}

function lookup(dict: Messages, path: string): string | null {
  const parts = path.split('.');
  let current: unknown = dict;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : null;
}

export function tt(key: string, fallback?: string): string {
  const locale = readLocaleFromCookie();
  const value =
    lookup(DICTIONARIES[locale], key) ??
    lookup(DICTIONARIES[DEFAULT_LOCALE], key);
  return value ?? fallback ?? key;
}
