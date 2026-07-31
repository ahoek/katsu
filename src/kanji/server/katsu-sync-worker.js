/**
 * The whole server side of code-based sync: one Cloudflare Worker over one KV
 * namespace. GitHub Pages cannot do this itself - it serves static files and
 * stores nothing - so this is the one piece that runs elsewhere.
 *
 * It answers katsu.arthurhoek.nl/api/sync/<code> on the site's own hostname, so
 * the app calls it same-origin and there is no CORS to arrange. Configuration
 * lives in wrangler.toml; setup and deployment are in src/kanji/README.md.
 *
 * It stores one opaque string per sync code and knows nothing else: no email, no
 * password, no account. The code is the credential, so anyone holding it can read
 * and write that schedule. For a kanji review schedule that trade is worth the
 * absence of sign-up, sign-in and password-reset flows.
 */

/** A schedule of 2500 kanji is about 33 kB; this leaves room and caps abuse. */
const MAX_BYTES = 128 * 1024;

/** Codes are four groups of five from Crockford's base 32. */
const CODE = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{5}(-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{5}){3}$/;

/** Untouched for a year, a schedule is gone; every sync pushes the date out. */
const TTL_SECONDS = 365 * 24 * 60 * 60;

const HEADERS = {
  'cache-control': 'no-store',
  'content-type': 'text/plain; charset=utf-8',
};

export default {
  async fetch(request, env) {
    const code = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '');
    if (!CODE.test(code)) {
      return new Response('Not a sync code', { status: 400, headers: HEADERS });
    }

    if (request.method === 'GET') {
      const stored = await env.SCHEDULES.get(code);
      return stored === null
        ? new Response('No schedule yet', { status: 404, headers: HEADERS })
        : new Response(stored, { status: 200, headers: HEADERS });
    }

    if (request.method === 'PUT') {
      const body = await request.text();
      if (body.length > MAX_BYTES) {
        return new Response('Schedule too large', { status: 413, headers: HEADERS });
      }
      // The body is opaque here: this never parses a schedule, it only keeps it.
      await env.SCHEDULES.put(code, body, { expirationTtl: TTL_SECONDS });
      return new Response('Saved', { status: 200, headers: HEADERS });
    }

    return new Response('Method not allowed', { status: 405, headers: HEADERS });
  },
};
