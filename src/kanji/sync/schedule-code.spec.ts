import { Card, startLearning } from '../srs/srs';
import { ScheduleCodeError, decodeSchedule, encodeSchedule } from './schedule-code';

const NOW = 1_760_000_000_000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function card(kanji: string, overrides: Partial<Card> = {}): Card {
  return { ...startLearning(kanji, NOW), ...overrides };
}

/**
 * Rewrite the text inside a code, through the same deflate and base 64 the
 * encoder uses, so a payload from an imagined later version is the real wire
 * format rather than a stand-in.
 */
async function repack(code: string, change: (text: string) => string): Promise<string> {
  const bytes = Uint8Array.from(
    atob(code.replaceAll('-', '+').replaceAll('_', '/')), letter => letter.charCodeAt(0));
  const text = change(new TextDecoder().decode(
    await through(bytes, new DecompressionStream('deflate-raw'))));
  const packed = await through(new TextEncoder().encode(text), new CompressionStream('deflate-raw'));

  let binary = '';
  for (const byte of packed) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
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

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value as Uint8Array);
  }
  const out = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

describe('the schedule code', () => {
  it('carries a card there and back', async () => {
    const cards = [card('水', { stage: 4, due: NOW + 3 * DAY, reviews: 6, lapses: 2 })];

    const [decoded] = await decodeSchedule(await encodeSchedule(cards, NOW));

    expect(decoded).toMatchObject({ kanji: '水', stage: 4, reviews: 6, lapses: 2 });
    // Times are kept to the minute, which is finer than any interval or than
    // the merge needs.
    expect(decoded.due).toBeCloseTo(cards[0].due, -5);
    expect(decoded.learnedAt).toBeCloseTo(cards[0].learnedAt, -5);
    expect(decoded.updatedAt).toBeCloseTo(cards[0].updatedAt, -5);
  });

  it('carries a whole schedule, in any order', async () => {
    const cards = [
      card('楽', { stage: 9, reviews: 8, due: NOW - DAY }),
      card('一', { stage: 1, reviews: 0 }),
      card('顔', { stage: 5, reviews: 4, lapses: 1, learnedAt: NOW - 30 * DAY }),
    ];

    const decoded = await decodeSchedule(await encodeSchedule(cards, NOW));

    expect(decoded).toHaveLength(3);
    for (const original of cards) {
      const match = decoded.find(candidate => candidate.kanji === original.kanji);
      expect(match).toMatchObject({
        stage: original.stage,
        reviews: original.reviews,
        lapses: original.lapses,
      });
      expect(match!.due).toBeCloseTo(original.due, -5);
    }
  });

  it('keeps times to the minute, which is all the merge needs', async () => {
    const cards = [card('水', { due: NOW + 4 * HOUR + 25_000, updatedAt: NOW - 90_000 })];

    const [decoded] = await decodeSchedule(await encodeSchedule(cards, NOW));

    expect(Math.abs(decoded.due - cards[0].due)).toBeLessThanOrEqual(30_000);
    expect(Math.abs(decoded.updatedAt - cards[0].updatedAt)).toBeLessThanOrEqual(30_000);
  });

  it('carries an empty schedule', async () => {
    expect(await decodeSchedule(await encodeSchedule([], NOW))).toEqual([]);
  });


  it('refuses something that is not a schedule', async () => {
    await expect(decodeSchedule('hello')).rejects.toThrow(ScheduleCodeError);
    await expect(decodeSchedule('')).rejects.toThrow(ScheduleCodeError);
  });

  /**
   * The room a later version has to add a field without shutting this one out,
   * and the edge of that room: an unknown section is passed over, while a row
   * whose count is off is damage. Pinned here because a later version will read
   * these tests as the promise they are - see the note on MARKER.
   */
  describe('what a later version may add', () => {
    it('reads a schedule with a section it does not know', async () => {
      const cards = [card('水', { stage: 4, reviews: 6, lapses: 2 }), card('空', { stage: 2, lapses: 5 })];
      const extended = await repack(await encodeSchedule(cards, NOW), text => `${text}|2.1`);

      const decoded = await decodeSchedule(extended);

      expect(decoded).toHaveLength(2);
      expect(decoded.find(c => c.kanji === '空')).toMatchObject({ stage: 2, lapses: 5 });
    });

    it('refuses a schedule whose rows have grown a value', async () => {
      const wider = await repack(await encodeSchedule([card('水')], NOW), text => {
        const [marker, base, rows] = text.split('|');
        return [marker, base, rows.split(',').map(row => `${row}.1`).join(',')].join('|');
      });

      await expect(decodeSchedule(wider)).rejects.toThrow(ScheduleCodeError);
    });

    it('refuses a row that is missing a value', async () => {
      const short = await repack(await encodeSchedule([card('水')], NOW), text => {
        const [marker, base, rows] = text.split('|');
        const trimmed = rows.split(',').map(row => row.split('.').slice(0, -1).join('.'));
        return [marker, base, trimmed.join(',')].join('|');
      });

      await expect(decodeSchedule(short)).rejects.toThrow(ScheduleCodeError);
    });
  });

  it('refuses a schedule written by a later format', async () => {
    const code = await encodeSchedule([card('水')], NOW);
    const damaged = code.slice(0, 4) + 'zz' + code.slice(6);

    await expect(decodeSchedule(damaged)).rejects.toThrow(ScheduleCodeError);
  });
});
