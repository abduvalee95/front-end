'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from './routing';

type Messages = Record<string, unknown>;

function get(obj: Messages, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : path;
}

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
  t: (namespace: string) => (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const t = (namespace: string) => (key: string) =>
    get(messages, `${namespace}.${key}`);

  return (
    <I18nContext.Provider value={{ locale, messages, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

export function useTranslations(namespace: string) {
  const { t } = useI18n();
  return t(namespace);
}

export function useLocale(): Locale {
  const { locale } = useI18n();
  return locale;
}
