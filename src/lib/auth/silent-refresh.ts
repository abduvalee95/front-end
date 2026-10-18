/**
 * Silent Refresh Manager
 * Proactive token refresh before expiry for seamless UX
 */

import { isTenantRefreshPaused, refreshTenantSession } from './tenant-refresh';
import { useAuthStore } from '@/store/auth.store';
import { getTimeUntilRefresh } from './token-config';
import { logger } from '@/lib/logger';

class SilentRefreshManager {
  private timer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private generation = 0;

  /**
   * Start silent refresh monitoring
   * @param tokenIssuedAtMs - Timestamp when current access token was issued
   */
  start(tokenIssuedAtMs?: number): void {
    // Clear any existing timer
    this.stop();
    if (!useAuthStore.getState().isAuthenticated || isTenantRefreshPaused()) return;
    const generation = this.generation;

    // Calculate time until refresh needed
    const delay = getTimeUntilRefresh(tokenIssuedAtMs);

    if (delay <= 0) {
      // Token is already expiring soon, refresh immediately
      this.executeRefresh(generation);
      return;
    }

    // Schedule refresh
    this.timer = setTimeout(() => {
      this.executeRefresh(generation);
    }, delay);

    logger.debug(`[SilentRefresh] Scheduled refresh in ${Math.round(delay / 1000)}s`);
  }

  /**
   * Stop silent refresh monitoring
   */
  stop(): void {
    this.generation += 1;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Execute token refresh
   */
  private async executeRefresh(generation: number): Promise<void> {
    if (generation !== this.generation || !useAuthStore.getState().isAuthenticated || isTenantRefreshPaused()) return;
    if (this.isRefreshing) {
      logger.debug('[SilentRefresh] Already refreshing, skipping');
      return;
    }

    this.isRefreshing = true;
    logger.debug('[SilentRefresh] Executing proactive token refresh');

    try {
      await refreshTenantSession();
      
      // Refresh successful, schedule next refresh
      if (generation === this.generation && useAuthStore.getState().isAuthenticated && !isTenantRefreshPaused()) {
        this.start(Date.now());
      }
      logger.debug('[SilentRefresh] Token refreshed successfully');
    } catch {
      logger.warn('[SilentRefresh] Token refresh unavailable');
      // Don't throw - let the API interceptor handle 401s on next request
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Refresh immediately (e.g., when tab becomes visible)
   */
  async refreshNow(): Promise<boolean> {
    if (!useAuthStore.getState().isAuthenticated || isTenantRefreshPaused()) return false;
    const generation = this.generation;
    try {
      await refreshTenantSession();
      if (generation !== this.generation || !useAuthStore.getState().isAuthenticated || isTenantRefreshPaused()) return false;
      this.start(Date.now());
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const silentRefreshManager = new SilentRefreshManager();

// Visibility API integration - refresh when tab becomes visible
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Check if we need to refresh (token might have expired while tab was hidden)
      silentRefreshManager.refreshNow().catch(() => {
        // Silent fail - interceptor will handle if needed
      });
    }
  });
}

export default SilentRefreshManager;
