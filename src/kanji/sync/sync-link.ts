import { isSyncCode, normaliseSyncCode } from './sync-code';

/**
 * A sync code as a link, so the other device can be handed it by camera instead
 * of by typing. The code rides in the fragment rather than the query string:
 * fragments are never sent to a server, which is right for something that is
 * effectively a password.
 *
 * The link points at the sync screen itself, so a phone's own camera app opens
 * the app with the code already in hand - no scanner in the app, and no camera
 * permission to ask for.
 */

const PATH = '/kanji/sync';
const FRAGMENT_KEY = 'code';

export function syncCodeLink(code: string, origin: string): string {
  return `${origin.replace(/\/$/, '')}${PATH}#${FRAGMENT_KEY}=${code}`;
}

/** The code out of a fragment, if it holds a usable one. */
export function syncCodeFromFragment(fragment: string | null | undefined): string {
  if (!fragment) {
    return '';
  }
  const value = new URLSearchParams(fragment).get(FRAGMENT_KEY) ?? '';
  const code = normaliseSyncCode(value);
  return isSyncCode(code) ? code : '';
}
