import { Card } from '../srs/srs';

/**
 * Packs a review schedule into a string, so it can be carried between devices -
 * over the sync service, or in a file.
 *
 * The packing is deliberate rather than JSON, because this travels: cards are
 * sorted by code point and only the difference from the previous one is written,
 * every number is base 36, and times are minutes relative to one timestamp in
 * the header. Deflate then does the rest, bringing a card to roughly thirteen
 * characters - a schedule of 240 kanji comes to about 3 kB, and 2500 would be
 * around 32 kB.
 */

/** Marks the format, so a later version can be told apart or refused. */
const MARKER = 'k1';

const MINUTE = 60 * 1000;

export class ScheduleCodeError extends Error {}

export async function encodeSchedule(cards: readonly Card[], now = Date.now()): Promise<string> {
  const base = Math.round(now / MINUTE);
  const sorted = [...cards].sort((a, b) => codePoint(a.kanji) - codePoint(b.kanji));

  let previous = 0;
  const rows = sorted.map(card => {
    const point = codePoint(card.kanji);
    const row = [
      point - previous,
      card.stage,
      Math.round(card.due / MINUTE) - base,
      card.reviews,
      card.lapses,
      Math.round(card.learnedAt / MINUTE) - base,
      Math.round(card.updatedAt / MINUTE) - base,
    ];
    previous = point;
    return row.map(value => value.toString(36)).join('.');
  });

  const text = [MARKER, base.toString(36), rows.join(',')].join('|');
  return base64url(await deflate(new TextEncoder().encode(text)));
}

export async function decodeSchedule(code: string): Promise<Card[]> {
  let text: string;
  try {
    text = new TextDecoder().decode(await inflate(fromBase64url(code.trim())));
  } catch {
    throw new ScheduleCodeError('This is not a Katsu schedule.');
  }

  const [marker, baseText, rowsText] = text.split('|');
  if (marker !== MARKER) {
    throw new ScheduleCodeError('This schedule comes from a different version of Katsu.');
  }
  const base = parseInt(baseText, 36);
  if (!Number.isFinite(base)) {
    throw new ScheduleCodeError('This schedule is damaged.');
  }
  if (!rowsText) {
    return [];
  }

  let previous = 0;
  return rowsText.split(',').map(row => {
    const values = row.split('.').map(value => parseInt(value, 36));
    if (values.length !== 7 || values.some(value => !Number.isFinite(value))) {
      throw new ScheduleCodeError('This schedule is damaged.');
    }
    const [pointDelta, stage, due, reviews, lapses, learnedAt, updatedAt] = values;
    previous += pointDelta;

    if (previous < 0x3000 || previous > 0x9fff) {
      throw new ScheduleCodeError('This schedule is damaged.');
    }
    return {
      kanji: String.fromCodePoint(previous),
      stage,
      due: (base + due) * MINUTE,
      reviews,
      lapses,
      learnedAt: (base + learnedAt) * MINUTE,
      updatedAt: (base + updatedAt) * MINUTE,
    };
  });
}

function codePoint(kanji: string): number {
  return kanji.codePointAt(0) ?? 0;
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  return through(bytes, new CompressionStream('deflate-raw'));
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  return through(bytes, new DecompressionStream('deflate-raw'));
}

async function through(bytes: Uint8Array, transform: TransformStream): Promise<Uint8Array> {
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  const reader = source.pipeThrough(transform).getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value as Uint8Array);
    length += (value as Uint8Array).length;
  }

  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** Base 64 without the characters that would need escaping in a URL. */
function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function fromBase64url(text: string): Uint8Array {
  const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}
