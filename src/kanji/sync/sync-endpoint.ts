/**
 * Where a sync code's schedule is kept.
 *
 * Empty means sync is switched off, which is how the app ships: GitHub Pages
 * serves static files and cannot store anything, so a code needs somewhere else
 * to put the schedule. With nothing configured the sync screen offers only
 * export and import, which need no server at all.
 *
 * Point this at a deployment of `server/katsu-sync-worker.js` (see the README)
 * and the code-based sync appears by itself.
 */
export const SYNC_ENDPOINT = '';

/** Whether a server has been configured for code-based sync. */
export function syncAvailable(endpoint: string = SYNC_ENDPOINT): boolean {
  return endpoint.trim().length > 0;
}
