export const LOCALES = ['uz', 'ru', 'en', 'kg'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ru';
