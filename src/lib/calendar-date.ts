import { format } from 'date-fns';

/** Date filters represent the user's local calendar day, not a UTC instant. */
export function formatCalendarDate(date: Date | null | undefined): string | undefined {
  return date ? format(date, 'yyyy-MM-dd') : undefined;
}
