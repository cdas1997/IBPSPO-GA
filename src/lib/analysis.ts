import { isHot } from './bank';
import { dayKey, examCountdown, startOfDay } from './dates';
import { MOCK_CONFIG } from './mock';
import { MARK_WRONG, choiceOf, netMarks, percent, setStats } from './scoring';
import { MockType, SetFilter, type Answers, type Bank, type MockRecord, type Topic } from './types';

const EXAM_MAX = 60;

export type DayActivity = { key: string; shortLabel: string; longLabel: string; count: number };

type ActivityArgs = { answers: Answers; mocks: readonly MockRecord[]; now: number; days: number };

export function activityByDay({ answers, mocks, now, days }: ActivityArgs): DayActivity[] {
  const counts = new Map<string, number>();
  const bump = (key: string, by: number): void => {
    counts.set(key, (counts.get(key) ?? 0) + by);
  };
  for (const record of Object.values(answers)) bump(dayKey(record[1]), 1);
  for (const m of mocks) bump(dayKey(m.startedAt), m.right + m.wrong);
  const today = startOfDay(now);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const key = dayKey(d.getTime());
    return {
      key,
      shortLabel: i === days - 1 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      longLabel: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      count: counts.get(key) ?? 0,
    };
  });
}

export type Recommendation = { topic: Topic; reason: string; filter: SetFilter };

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export function recommendTopics(bank: Bank, answers: Answers, limit = 3): Recommendation[] {
  return bank.topics
    .map((topic) => {
      const s = setStats(topic.questions, answers);
      const hotLeft = topic.questions.filter((q) => isHot(q) && choiceOf(answers, q.id) === undefined).length;
      const left = s.total - s.done;
      const accuracy = s.done >= 3 ? s.right / s.done : null;
      const score = hotLeft * 2 + left * 0.3 + (accuracy === null ? 0 : (1 - accuracy) * 25) + s.wrong * 1.5;
      let reason: string;
      let filter: SetFilter = SetFilter.Todo;
      if (accuracy !== null && accuracy < 0.6) {
        reason = `Only ${Math.round(accuracy * 100)}% right so far · ${plural(s.wrong, 'wrong answer')} to redo`;
        if (s.wrong) filter = SetFilter.Wrong;
      } else if (!s.done) {
        reason = `Not started · ${hotLeft ? plural(hotLeft, 'high-chance question') : plural(s.total, 'question')}`;
      } else if (hotLeft) {
        reason = `${plural(hotLeft, 'high-chance question')} still to do`;
      } else {
        reason = `${plural(left, 'question')} left${s.wrong ? ` · ${s.wrong} to redo` : ''}`;
      }
      return { topic, reason, filter, score, finished: !left && !s.wrong };
    })
    .filter((r) => !r.finished)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ topic, reason, filter }) => ({ topic, reason, filter }));
}

export type ScoreEstimate = { score: number; basedOn: number; fullMocksOnly: boolean };

/** Average of the last three mocks (full mocks preferred), scaled to the 60-mark section. */
export function estimateScore(mocks: readonly MockRecord[]): ScoreEstimate | null {
  const full = mocks.filter((m) => m.type === MockType.Full).slice(0, 3);
  const basis = full.length ? full : mocks.slice(0, 3);
  if (!basis.length) return null;
  const score = basis.reduce((sum, m) => sum + scaledTo60(m), 0) / basis.length;
  return { score, basedOn: basis.length, fullMocksOnly: full.length > 0 };
}

export function scaledTo60(m: MockRecord): number {
  return m.maxMarks ? (m.net * EXAM_MAX) / m.maxMarks : 0;
}

/** Average seconds per answered mock question. */
export function mockPace(mocks: readonly MockRecord[]): number | null {
  let count = 0;
  let total = 0;
  for (const m of mocks) {
    for (const id of m.questionIds) {
      if (m.responses[id] === undefined) continue;
      count += 1;
      total += m.seconds[id] ?? 0;
    }
  }
  return count ? total / count : null;
}

export function marksLostToNegative(mocks: readonly MockRecord[]): number {
  return mocks.reduce((sum, m) => sum + m.wrong * MARK_WRONG, 0);
}

export type DailyTarget = { target: number; doneToday: number; remaining: number; studyDays: number };

export function dailyTarget(bank: Bank, answers: Answers, now: number): DailyTarget | null {
  const countdown = examCountdown(bank.examDate, now);
  if (!countdown || countdown.daysLeft <= 0) return null;
  const today = dayKey(now);
  const doneToday = Object.values(answers).filter((r) => dayKey(r[1]) === today).length;
  const remaining = bank.all.filter((q) => choiceOf(answers, q.id) === undefined).length;
  if (!remaining && !doneToday) return null;
  return { target: Math.ceil((remaining + doneToday) / countdown.daysLeft), doneToday, remaining, studyDays: countdown.daysLeft };
}

export type TopicResult = { topic: Topic; right: number; wrong: number; skipped: number; net: number };

export function mockTopicBreakdown(mock: MockRecord, bank: Bank): TopicResult[] {
  const byTopic = new Map<string, TopicResult>();
  for (const id of mock.questionIds) {
    const q = bank.byId.get(id);
    const topic = q && bank.topicByKey.get(q.topic);
    if (!q || !topic) continue;
    const row = byTopic.get(topic.key) ?? { topic, right: 0, wrong: 0, skipped: 0, net: 0 };
    const r = mock.responses[id];
    if (r === undefined) row.skipped += 1;
    else if (r === q.answer) row.right += 1;
    else row.wrong += 1;
    row.net = netMarks(row.right, row.wrong);
    byTopic.set(topic.key, row);
  }
  return [...byTopic.values()].sort((a, b) => a.net - b.net);
}

export function mockLabel(type: MockType): string {
  return MOCK_CONFIG[type].label;
}

export function accuracyOf(right: number, wrong: number): number {
  return percent(right, right + wrong);
}
