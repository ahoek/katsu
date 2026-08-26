/**
 * A read-through disk cache for the pinned sources these tools fetch.
 *
 * Every URL they read carries the ref it is pinned at, so what comes back
 * cannot change while the ref does not - which makes it worth keeping. The
 * ref is part of the path a file is cached under, so bumping one invalidates
 * its files by itself: there is no flag to remember and nothing to clear by
 * hand. Without this, editing a gloss in the deck cost 835 sequential SVG
 * fetches, because the tool that merges the deck with KanjiVG has one path -
 * fetch everything, write the file.
 *
 * The cache lives in `.cache/pinned/` at the repo root and is gitignored: it
 * is a copy of someone else's data, reproducible from the refs in the source.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CACHE_DIR = fileURLToPath(new URL('../../../.cache/pinned/', import.meta.url));

/**
 * Filed under the URL's own host and path, so an entry can be read, compared
 * with the source and deleted by hand. A segment that is not a plain name is
 * refused rather than escaped: these URLs are constants in this repo, so a
 * surprise in one means a mistake to fix, not input to sanitise.
 */
function cachePath(url) {
  const { host, pathname } = new URL(url);
  const segments = [host, ...pathname.split('/').filter(Boolean)];
  if (segments.some(segment => !/^[\w.-]+$/.test(segment) || segment.startsWith('.'))) {
    throw new Error(`Cannot cache ${url}: its host or path is not a plain name`);
  }
  return join(CACHE_DIR, ...segments);
}

/**
 * `read` is called only on a miss, and what it returns is written to a
 * temporary file and renamed into place, so a run stopped halfway through a
 * write leaves nothing half-written to be trusted as a cache hit later.
 */
export async function cached(url, read) {
  const path = cachePath(url);
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  const text = await read();
  await mkdir(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.partial`;
  await writeFile(partial, text);
  await rename(partial, path);
  return text;
}
