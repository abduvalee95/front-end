import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

/** Refresh every view derived from payments after a successful write. */
export function invalidatePaymentViews(queryClient: QueryClient, orgId: string | undefined) {
  return Promise.all([
    queryKeys.finance.all(orgId),
    queryKeys.students.all(orgId),
    queryKeys.dashboard.all(orgId),
    // These legacy views share the current user's QueryClient, cleared on logout.
    ['analytics'],
    ['reports'],
  ].map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
