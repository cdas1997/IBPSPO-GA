import { describe, expect, it } from 'vitest';
import { isHot } from './bank';
import { MOCK_CONFIG, PaletteState, accrueTime, createLiveMock, finishLiveMock, goToQuestion, paletteState, pickMockQuestions } from './mock';
import { makeTestBank } from './testBank';
import { MockType } from './types';

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

describe('mock tests', () => {
  const bank = makeTestBank(40);

  it('draws 50 distinct questions for a full mock, about 70% high-chance', () => {
    const picked = pickMockQuestions({ type: MockType.Full, bank, answers: {}, random: seeded(7) });
    expect(picked).toHaveLength(50);
    expect(new Set(picked.map((q) => q.id)).size).toBe(50);
    expect(picked.filter(isHot).length).toBe(Math.min(35, bank.all.filter(isHot).length));
  });

  it('builds a weak-areas mock that starts with past mistakes', () => {
    const answers = { a0: [0, 1] as const, a1: [3, 1] as const, b0: [0, 1] as const };
    const picked = pickMockQuestions({ type: MockType.Weak, bank, answers, random: seeded(3) });
    expect(picked).toHaveLength(MOCK_CONFIG.weak.questions);
    expect(picked.map((q) => q.id)).toEqual(expect.arrayContaining(['a0', 'a1', 'b0']));
  });

  it('times each question and marks the result the IBPS way', () => {
    const start = 1_000_000;
    let live = createLiveMock({ type: MockType.Quick, bank, answers: {}, random: seeded(11), now: start });
    const [first = '', second = ''] = live.questionIds;
    live = { ...live, responses: { [first]: 1, [second]: 0 } };
    live = goToQuestion(live, 1, start + 30_000);
    live = accrueTime(live, start + 50_000);
    expect(live.seconds[first]).toBeCloseTo(30);
    expect(live.seconds[second]).toBeCloseTo(20);
    expect(paletteState(live, 0)).toBe(PaletteState.Answered);
    expect(paletteState(live, 5)).toBe(PaletteState.NotVisited);
    const record = finishLiveMock(live, bank, start + 60_000);
    expect(record.right).toBe(1);
    expect(record.wrong).toBe(1);
    expect(record.skipped).toBe(18);
    expect(record.net).toBeCloseTo(0.9);
    expect(record.maxMarks).toBeCloseTo(24);
  });

  it('never counts time past the end of the clock', () => {
    const live = createLiveMock({ type: MockType.Quick, bank, answers: {}, random: seeded(5), now: 0 });
    const record = finishLiveMock(live, bank, 10 * 60 * 60 * 1000);
    expect(record.usedMs).toBe(MOCK_CONFIG.quick.seconds * 1000);
  });
});
