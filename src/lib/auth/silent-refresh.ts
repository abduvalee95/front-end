/**
 * Silent Refresh Manager
 * Proactive token refresh before expiry for seamless UX
 */

import axios from 'axios';
import { getTimeUntilRefresh } from './token-config';
import { logger } from '@/lib/logger';

class SilentRefreshManager {
  private timer: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  /**
   * Start silent refresh monitoring
   * @param tokenIssuedAtMs - Timestamp when current access token was issued
   */
  start(tokenIssuedAtMs?: number): void {
    // Clear any existing timer
    this.stop();

    // Calculate time until refresh needed
    const delay = getTimeUntilRefresh(tokenIssuedAtMs);

    if (delay <= 0) {
      // Token is already expiring soon, refresh immediately
      this.executeRefresh();
      return;
    }

    // Schedule refresh
    this.timer = setTimeout(() => {
      this.executeRefresh();
    }, delay);

    logger.debug(`[SilentRefresh] Scheduled refresh in ${Math.round(delay / 1000)}s`);
  }

  /**
   * Stop silent refresh monitoring
   */
  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Execute token refresh
   */
  private async executeRefresh(): Promise<void> {
    if (this.isRefreshing) {
      logger.debug('[SilentRefresh] Already refreshing, skipping');
      return;
    }

    this.isRefreshing = true;
    logger.debug('[SilentRefresh] Executing proactive token refresh');

    try {
      await axios.post('/api/auth/refresh', {}, { withCredentials: true });
      
      // Refresh successful, schedule next refresh
      this.start(Date.now());
      logger.debug('[SilentRefresh] Token refreshed successfully');
    } catch (error) {
      logger.error('[SilentRefresh] Token refresh failed:', error);
      // Don't throw - let the API interceptor handle 401s on next request
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Refresh immediately (e.g., when tab becomes visible)
   */
  async refreshNow(): Promise<boolean> {
    try {
      await axios.post('/api/auth/refresh', {}, { withCredentials: true });
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
