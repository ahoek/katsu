import { DEFAULT_CAP, NO_CAP, capReached, dayKey, remainingToday } from './daily';

/** Midday, so a timezone offset either way stays inside the same day. */
const NOON = new Date(2026, 6, 31, 12, 0, 0).getTime();

const HOUR = 60 * 60 * 1000;

describe('dayKey', () => {
  it('names the local calendar day', () => {
    expect(dayKey(NOON)).toBe('2026-07-31');
  });

  it('pads a single-digit month and day', () => {
    expect(dayKey(new Date(2026, 0, 5, 12).getTime())).toBe('2026-01-05');
  });

  it('holds through the evening and turns over at local midnight', () => {
    expect(dayKey(NOON + 11 * HOUR)).toBe('2026-07-31');
    expect(dayKey(NOON + 13 * HOUR)).toBe('2026-08-01');
  });
});

describe('remainingToday', () => {
  it('counts down from the cap', () => {
    expect(remainingToday(DEFAULT_CAP, 0)).toBe(DEFAULT_CAP);
    expect(remainingToday(DEFAULT_CAP, 8)).toBe(DEFAULT_CAP - 8);
  });

  it('never goes below zero, however far past the cap a session ran', () => {
    expect(remainingToday(10, 25)).toBe(0);
  });

  it('is unbounded with no cap set, so callers can slice by it regardless', () => {
    expect(remainingToday(NO_CAP, 500)).toBe(Infinity);
  });
});

describe('capReached', () => {
  it('is reached once the batch is done and kanji are still waiting', () => {
    expect(capReached(10, 10, 34)).toBe(true);
  });

  it('is not reached while the batch has room', () => {
    expect(capReached(10, 9, 34)).toBe(false);
  });

  it('is not reached when nothing is due, so an empty day says nothing about a cap', () => {
    expect(capReached(10, 10, 0)).toBe(false);
  });

  it('is never reached with no cap set', () => {
    expect(capReached(NO_CAP, 400, 34)).toBe(false);
  });
});
