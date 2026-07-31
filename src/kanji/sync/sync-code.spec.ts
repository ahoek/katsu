import { createSyncCode, isSyncCode, normaliseSyncCode } from './sync-code';

describe('sync codes', () => {
  it('makes a code in four readable groups', () => {
    const code = createSyncCode();

    expect(code).toMatch(/^[0-9A-Z]{5}(-[0-9A-Z]{5}){3}$/);
    expect(isSyncCode(code)).toBe(true);
  });

  it('leaves out the letters that get misread as digits', () => {
    const codes = Array.from({ length: 200 }, () => createSyncCode()).join('');

    expect(codes).not.toMatch(/[ILOU]/);
  });

  it('does not make the same code twice', () => {
    const codes = new Set(Array.from({ length: 500 }, () => createSyncCode()));

    expect(codes.size).toBe(500);
  });

  it('accepts a code however it was typed', () => {
    const code = 'ABCDE-FGHJK-MNPQR-STVWX';

    expect(normaliseSyncCode('abcde-fghjk-mnpqr-stvwx')).toBe(code);
    expect(normaliseSyncCode('ABCDEFGHJKMNPQRSTVWX')).toBe(code);
    expect(normaliseSyncCode('  abcde fghjk mnpqr stvwx  ')).toBe(code);
  });

  it('forgives the letters people substitute for the missing ones', () => {
    // Typed with an I, an O and a U, which the alphabet leaves out.
    expect(normaliseSyncCode('ABCD1-FGHJK-MNPQR-STVWX')).toBe(normaliseSyncCode('abcdI-fghjk-mnpqr-stvwx'));
    expect(normaliseSyncCode('ABCD0-FGHJK-MNPQR-STVWX')).toBe(normaliseSyncCode('abcdO-fghjk-mnpqr-stvwx'));
    expect(normaliseSyncCode('ABCDV-FGHJK-MNPQR-STVWX')).toBe(normaliseSyncCode('abcdU-fghjk-mnpqr-stvwx'));
  });

  it('rejects what is not a code', () => {
    expect(isSyncCode('')).toBe(false);
    expect(isSyncCode('too-short')).toBe(false);
    expect(isSyncCode('ABCDE-FGHJK-MNPQR')).toBe(false);
    expect(isSyncCode('ABCDE-FGHJK-MNPQR-STVWX-YZ012')).toBe(false);
  });
});
