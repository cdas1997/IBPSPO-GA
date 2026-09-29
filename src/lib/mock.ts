import { isHot } from './bank';
import { EXAM_PACE_SECS, MARK_RIGHT, choiceOf, isAnsweredWrong, netMarks, setStats } from './scoring';
import { MockType, type Answers, type Bank, type LiveMock, type MockRecord, type Question } from './types';

type MockConfig = { label: string; questions: number; seconds: number; blurb: string };

export const MOCK_CONFIG: Readonly<Record<MockType, MockConfig>> = {
  [MockType.Full]: {
    label: 'Full mock',
    questions: 50,
    seconds: 35 * 60,
    blurb: 'Same size and clock as the real GA section. About 70% of the questions come from the high-chance pool.',
  },
  [MockType.Quick]: {
    label: 'Quick mock',
    questions: 20,
    seconds: 14 * 60,
    blurb: 'Exam pace (42 seconds a question) for when you only have 15 minutes.',
  },
  [MockType.Weak]: {
    label: 'Weak-areas mock',
    questions: 25,
    seconds: 25 * EXAM_PACE_SECS,
    blurb: 'Built from your mistakes and your lowest-scoring topics, so you drill what costs you marks.',
  },
};

export const WEAK_MOCK_MIN_ANSWERS = 20;
const HOT_SHARE = 0.7;
const MISTAKE_SHARE = 0.4;
const WEAK_TOPIC_COUNT = 4;
const UNJUDGED_ACCURACY = 0.65;

export function shuffled<T>(items: readonly T[], random: () => number): T[] {
  return items
    .map((item) => ({ item, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

function unique(list: readonly Question[]): Question[] {
  const seen = new Set<string>();
  return list.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)));
}

type PickArgs = { type: MockType; bank: Bank; answers: Answers; random: () => number };

function pickWeakAreas({ bank, answers, random }: PickArgs, count: number): Question[] {
  const weakest = bank.topics
    .map((t) => {
      const s = setStats(t.questions, answers);
      return { t, accuracy: s.done >= 3 ? s.right / s.done : UNJUDGED_ACCURACY };
    })
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, WEAK_TOPIC_COUNT)
    .flatMap(({ t }) => t.questions.filter((q) => choiceOf(answers, q.id) === undefined || isAnsweredWrong(q, answers)));
  const mistakes = bank.all.filter((q) => isAnsweredWrong(q, answers));
  const pool = unique([
    ...shuffled(mistakes, random).slice(0, Math.round(count * MISTAKE_SHARE)),
    ...shuffled(weakest, random),
    ...shuffled(bank.all.filter(isHot), random),
    ...shuffled(bank.all, random),
  ]);
  return shuffled(pool.slice(0, count), random);
}

export function pickMockQuestions(args: PickArgs): Question[] {
  const count = Math.min(MOCK_CONFIG[args.type].questions, args.bank.all.length);
  if (args.type === MockType.Weak) return pickWeakAreas(args, count);
  const hot = shuffled(args.bank.all.filter(isHot), args.random);
  const rest = shuffled(args.bank.all.filter((q) => !isHot(q)), args.random);
  const hotCount = Math.min(hot.length, Math.round(count * HOT_SHARE));
  const picked = [...hot.slice(0, hotCount), ...rest.slice(0, count - hotCount)];
  const topUp = hot.slice(hotCount, hotCount + count - picked.length);
  return shuffled([...picked, ...topUp], args.random);
}

export function createLiveMock(args: PickArgs & { now: number }): LiveMock {
  const config = MOCK_CONFIG[args.type];
  return {
    id: `m${args.now}`,
    type: args.type,
    questionIds: pickMockQuestions(args).map((q) => q.id),
    responses: {},
    marked: {},
    visited: [0],
    seconds: {},
    index: 0,
    startedAt: args.now,
    endsAt: args.now + config.seconds * 1000,
    limitSecs: config.seconds,
    questionShownAt: args.now,
  };
}

export function isLiveRunning(live: LiveMock | null, now: number): live is LiveMock {
  return live !== null && live.endsAt > now;
}

/** Adds the time spent on the current question since it was shown. */
export function accrueTime(live: LiveMock, now: number): LiveMock {
  const t = Math.min(now, live.endsAt);
  const id = live.questionIds[live.index];
  if (id === undefined) return live;
  const spent = Math.max(0, (t - live.questionShownAt) / 1000);
  return { ...live, seconds: { ...live.seconds, [id]: (live.seconds[id] ?? 0) + spent }, questionShownAt: t };
}

export function goToQuestion(live: LiveMock, index: number, now: number): LiveMock {
  const next = accrueTime(live, now);
  const clamped = Math.max(0, Math.min(live.questionIds.length - 1, index));
  return { ...next, index: clamped, visited: next.visited.includes(clamped) ? next.visited : [...next.visited, clamped] };
}

export function finishLiveMock(live: LiveMock, bank: Bank, now: number): MockRecord {
  const done = accrueTime(live, now);
  let right = 0;
  let wrong = 0;
  for (const id of done.questionIds) {
    const r = done.responses[id];
    if (r === undefined) continue;
    if (r === bank.byId.get(id)?.answer) right += 1;
    else wrong += 1;
  }
  return {
    id: done.id,
    type: done.type,
    startedAt: done.startedAt,
    questionIds: done.questionIds,
    responses: done.responses,
    seconds: done.seconds,
    right,
    wrong,
    skipped: done.questionIds.length - right - wrong,
    net: netMarks(right, wrong),
    maxMarks: done.questionIds.length * MARK_RIGHT,
    usedMs: Math.min(now, done.endsAt) - done.startedAt,
    limitSecs: done.limitSecs,
  };
}

export const PaletteState = {
  Answered: 'answered',
  NotAnswered: 'not-answered',
  NotVisited: 'not-visited',
  Marked: 'marked',
  AnsweredMarked: 'answered-marked',
} as const;
export type PaletteState = (typeof PaletteState)[keyof typeof PaletteState];

export function paletteState(live: LiveMock, index: number): PaletteState {
  const id = live.questionIds[index] ?? '';
  const answered = live.responses[id] !== undefined;
  const marked = Boolean(live.marked[id]);
  if (answered && marked) return PaletteState.AnsweredMarked;
  if (marked) return PaletteState.Marked;
  if (answered) return PaletteState.Answered;
  return live.visited.includes(index) ? PaletteState.NotAnswered : PaletteState.NotVisited;
}
