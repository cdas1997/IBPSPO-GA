import { describe, expect, it } from 'vitest';
import { BackupError, decodeBackup, encodeBackup } from './backup';
import { emptyProfile, parseProfile } from './profile';

describe('backup and stored-data validation', () => {
  const known = new Set(['q1', 'q2']);

  it('round-trips answers and mocks through a backup code', () => {
    const profile = { ...emptyProfile(), answers: { q1: [2, 1700000000000] as const } };
    const restored = decodeBackup(encodeBackup(profile), known);
    expect(restored.answers).toEqual({ q1: [2, 1700000000000] });
    expect(restored.mocks).toEqual([]);
  });

  it('rejects text that is not a backup code', () => {
    expect(() => decodeBackup('hello there', known)).toThrow(BackupError);
  });

  it('drops malformed entries and questions this bank does not have', () => {
    const parsed = parseProfile(
      { answers: { q1: [1, 5], q9: [0, 5], q2: 'bad' }, mocks: [{ id: 'x' }], live: { nope: true }, mode: 'revision' },
      known,
    );
    expect(parsed.answers).toEqual({ q1: [1, 5] });
    expect(parsed.mocks).toEqual([]);
    expect(parsed.live).toBeNull();
    expect(parsed.mode).toBe('revision');
  });
});
