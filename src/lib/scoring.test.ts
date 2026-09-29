import { describe, expect, it } from 'vitest';
import { MARK_WRONG, Strength, formatMarks, netMarks, setStats, strengthOf } from './scoring';
import { makeTestBank } from './testBank';

describe('scoring', () => {
  it('deducts a quarter of 1.2 marks for each wrong answer', () => {
    expect(MARK_WRONG).toBeCloseTo(0.3);
    expect(netMarks(40, 10)).toBeCloseTo(45);
    expect(formatMarks(netMarks(0, 3))).toBe('-0.90');
  });

  it('counts right, wrong and unanswered questions', () => {
    const bank = makeTestBank(5);
    const qs = bank.topicByKey.get('a')?.questions ?? [];
    const stats = setStats(qs, { a0: [1, 0], a1: [0, 0], a2: [1, 0] });
    expect(stats).toEqual({ right: 2, wrong: 1, done: 3, total: 5 });
  });

  it('only judges strength after three attempts', () => {
    expect(strengthOf({ right: 0, wrong: 0, done: 0, total: 5 })).toBe(Strength.None);
    expect(strengthOf({ right: 2, wrong: 0, done: 2, total: 5 })).toBe(Strength.Early);
    expect(strengthOf({ right: 3, wrong: 1, done: 4, total: 5 })).toBe(Strength.Strong);
    expect(strengthOf({ right: 2, wrong: 2, done: 4, total: 5 })).toBe(Strength.Average);
    expect(strengthOf({ right: 1, wrong: 3, done: 4, total: 5 })).toBe(Strength.Weak);
  });
});
