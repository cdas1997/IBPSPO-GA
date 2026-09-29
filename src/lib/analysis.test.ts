import { describe, expect, it } from 'vitest';
import { activityByDay, dailyTarget, estimateScore, recommendTopics } from './analysis';
import { makeTestBank } from './testBank';
import { MockType, SetFilter, type MockRecord } from './types';

function mock(type: MockRecord['type'], net: number, maxMarks: number): MockRecord {
  return { id: `m${net}`, type, startedAt: 0, questionIds: [], responses: {}, seconds: {}, right: 0, wrong: 0, skipped: 0, net, maxMarks, usedMs: 0, limitSecs: 0 };
}

describe('analysis', () => {
  const bank = makeTestBank(10);

  it('estimates the score from full mocks, scaled to 60', () => {
    expect(estimateScore([])).toBeNull();
    const estimate = estimateScore([mock(MockType.Quick, 24, 24), mock(MockType.Full, 30, 60), mock(MockType.Full, 45, 60)]);
    expect(estimate).toEqual({ score: 37.5, basedOn: 2, fullMocksOnly: true });
  });

  it('points a weak topic at its wrong answers', () => {
    const answers = { a0: [0, 0] as const, a1: [0, 0] as const, a2: [0, 0] as const, a3: [1, 0] as const };
    const [first] = recommendTopics(bank, answers);
    expect(first?.topic.key).toBe('a');
    expect(first?.filter).toBe(SetFilter.Wrong);
  });

  it('spreads the remaining questions over the days left', () => {
    const now = new Date(2026, 8, 29, 10).getTime();
    const target = dailyTarget(bank, { a0: [1, now] }, now);
    expect(target).toEqual({ target: 4, doneToday: 1, remaining: 19, studyDays: 5 });
    expect(dailyTarget(bank, {}, new Date(2026, 9, 4, 9).getTime())).toBeNull();
  });

  it('buckets activity by local day', () => {
    const now = new Date(2026, 8, 29, 20).getTime();
    const yesterday = new Date(2026, 8, 28, 23, 30).getTime();
    const days = activityByDay({ answers: { a0: [1, now], a1: [1, yesterday] }, mocks: [], now, days: 7 });
    expect(days).toHaveLength(7);
    expect(days[6]?.count).toBe(1);
    expect(days[5]?.count).toBe(1);
  });
});
