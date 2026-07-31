/**
 * The whole server side of code-based sync: one Cloudflare Worker over one KV
 * namespace. GitHub Pages cannot do this itself - it serves static files and
 * stores nothing - so this is the one piece that lives elsewhere. The app stays
 * on Pages and calls this cross-origin.
 *
 * It stores one opaque string per sync code and knows nothing else: no email, no
 * password, no account. The code is the credential, so anyone holding it can read
 * and write that schedule. For a kanji review schedule that trade is worth the
 * absence of sign-up, sign-in and password-reset flows.
 *
 * Deploy (wrangler):
 *
 *   wrangler kv namespace create KATSU_SYNC
 *   # put the id in wrangler.toml, along with:
 *   #   name = "katsu-sync"
 *   #   main = "katsu-sync-worker.js"
 *   #   compatibility_date = "2026-01-01"
 *   #   [[kv_namespaces]]
 *   #   binding = "SCHEDULES"
 *   #   id = "<the id>"
 *   wrangler deploy
 *
 * Then put the Worker's URL in src/kanji/sync/sync-endpoint.ts and the sync
 * screen switches itself on.
 */

/** Only this origin may call it, so a stray site cannot read codes it guessed. */
const ALLOWED_ORIGIN = 'https://katsu.arthurhoek.nl';

/** A schedule of 2500 kanji is about 33 kB; this leaves room and caps abuse. */
const MAX_BYTES = 128 * 1024;

/** Codes are four groups of five from Crockford's base 32. */
const CODE = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{5}(-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{5}){3}$/;

/** Untouched for a year, a schedule is gone; every sync pushes the date out. */
const TTL_SECONDS = 365 * 24 * 60 * 60;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return respond(null, 204);
    }

    const code = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '');
    if (!CODE.test(code)) {
      return respond('Not a sync code', 400);
    }

    if (request.method === 'GET') {
      const stored = await env.SCHEDULES.get(code);
      return stored === null ? respond('No schedule yet', 404) : respond(stored, 200);
    }

    if (request.method === 'PUT') {
      const body = await request.text();
      if (body.length > MAX_BYTES) {
        return respond('Schedule too large', 413);
      }
      // The body is opaque here: this never parses a schedule, it only keeps it.
      await env.SCHEDULES.put(code, body, { expirationTtl: TTL_SECONDS });
      return respond('Saved', 200);
    }

    return respond('Method not allowed', 405);
  },
};

function respond(body, status) {
  return new Response(body, {
    status,
    headers: {
      'access-control-allow-origin': ALLOWED_ORIGIN,
      'access-control-allow-methods': 'GET, PUT, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}
