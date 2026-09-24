/**
 * @file useKeepAwake.ts
 * @description Stops the host idling out while someone is mid-registration.
 *
 * Render's free tier sleeps a service after ~15 minutes without a request. Filling in
 * six players and uploading six ID photos can easily span that, and a student who
 * pauses to find their ID card should not come back to a page whose backend has gone
 * away. A cheap heartbeat while the app is open keeps the instance up.
 *
 * This does NOT replace an external uptime pinger: nothing here runs when no one has
 * the site open, so the first visitor after a quiet night still waits for a cold
 * start. It only protects a session already in progress.
 */

import { useEffect } from 'react';

const INTERVAL_MS = 4 * 60 * 1000; // comfortably inside the ~15 minute idle window

export function useKeepAwake(active = true) {
  useEffect(() => {
    if (!active) return;

    const ping = () => {
      // Skip while the tab is hidden: a backgrounded tab is not an active session,
      // and there is no reason to hold the instance up for it.
      if (document.visibilityState !== 'visible') return;
      fetch('/api/health', { cache: 'no-store' }).catch(() => {});
    };

    const timer = setInterval(ping, INTERVAL_MS);
    // Coming back to the tab is exactly when a slow response would be noticed.
    document.addEventListener('visibilitychange', ping);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', ping);
    };
  }, [active]);
}

export default useKeepAwake;
