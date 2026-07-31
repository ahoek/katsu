/**
 * A sync code is the only credential in this feature: whoever has it can read
 * and write that schedule. It is not tied to a person, an email or a password,
 * so there is nothing to reset and no personal data to look after - but there is
 * also nothing to recover it with, which is why the export file matters.
 */

/**
 * Crockford's base 32 alphabet, minus the letters that get mistaken for digits
 * when read off one screen and typed into another.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Four groups of four: 20 characters of base 32, so 100 bits of guesswork. */
const GROUPS = 4;
const GROUP_LENGTH = 5;

export function createSyncCode(): string {
  const bytes = new Uint8Array(GROUPS * GROUP_LENGTH);
  crypto.getRandomValues(bytes);

  const characters = [...bytes].map(byte => ALPHABET[byte % ALPHABET.length]);
  const groups = [];
  for (let i = 0; i < GROUPS; i++) {
    groups.push(characters.slice(i * GROUP_LENGTH, (i + 1) * GROUP_LENGTH).join(''));
  }
  return groups.join('-');
}

/**
 * Accept a code however it was typed - lower case, spaces, missing dashes, and
 * the digits people substitute for the letters left out of the alphabet.
 */
export function normaliseSyncCode(input: string): string {
  const cleaned = input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replaceAll('I', '1')
    .replaceAll('L', '1')
    .replaceAll('O', '0')
    .replaceAll('U', 'V');

  const groups = [];
  for (let i = 0; i < cleaned.length; i += GROUP_LENGTH) {
    groups.push(cleaned.slice(i, i + GROUP_LENGTH));
  }
  return groups.join('-');
}

export function isSyncCode(input: string): boolean {
  const cleaned = normaliseSyncCode(input).replaceAll('-', '');
  return (
    cleaned.length === GROUPS * GROUP_LENGTH
    && [...cleaned].every(character => ALPHABET.includes(character))
  );
}
