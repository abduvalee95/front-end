export const PAGE_SIZE_DEFAULT = 10;

export const STALE_TIME = {
  SHORT: 5 * 60 * 1000,
  MEDIUM: 10 * 60 * 1000,
  LONG: 30 * 60 * 1000,
} as const;

export const QUERY_LIMITS = {
  LEADS: 200,
  INVOICES: 200,
  ORGS_STATS: 100,
} as const;
