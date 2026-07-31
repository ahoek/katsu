/**
 * Where a sync code's schedule is kept.
 *
 * A relative path, because the Worker answers on the site's own hostname - see
 * wrangler.toml. Same origin means no CORS, and no URL to keep in step between
 * the app and the service.
 *
 * Set it to '' to switch code-based sync off, which is what a fork without a
 * Worker of its own should do: the sync screen then offers only the backup file,
 * which needs no server at all.
 *
 * Locally, `npm start` proxies /api to a `wrangler dev` on port 8787
 * (proxy.conf.json). Without one running, sync reports that it cannot be
 * reached, which is the truth.
 */
export const SYNC_ENDPOINT = '/api/sync';

/** Whether a server has been configured for code-based sync. */
export function syncAvailable(endpoint: string = SYNC_ENDPOINT): boolean {
  return endpoint.trim().length > 0;
}
