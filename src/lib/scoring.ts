import type { Answers, Question } from './types';

export const MARK_RIGHT = 1.2;
/** IBPS deducts a quarter of the question's marks: 0.25 x 1.2 */
export const MARK_WRONG = 0.3;
export const EXAM_PACE_SECS = 42;

export type SetStats = { right: number; wrong: number; done: number; total: number };

export function choiceOf(answers: Answers, id: string): number | undefined {
  return answers[id]?.[0];
}

export function isAnsweredWrong(q: Question, answers: Answers): boolean {
  const choice = choiceOf(answers, q.id);
  return choice !== undefined && choice !== q.answer;
}

export function setStats(questions: readonly Question[], answers: Answers): SetStats {
  let right = 0;
  let wrong = 0;
  for (const q of questions) {
    const choice = choiceOf(answers, q.id);
    if (choice === undefined) continue;
    if (choice === q.answer) right += 1;
    else wrong += 1;
  }
  return { right, wrong, done: right + wrong, total: questions.length };
}

export function netMarks(right: number, wrong: number): number {
  return right * MARK_RIGHT - wrong * MARK_WRONG;
}

export function percent(part: number, whole: number): number {
  return whole ? Math.round((part * 100) / whole) : 0;
}

export function formatMarks(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

export const Strength = { Strong: 'strong', Average: 'average', Weak: 'weak', Early: 'early', None: 'none' } as const;
export type Strength = (typeof Strength)[keyof typeof Strength];

export const MIN_ATTEMPTS_TO_JUDGE = 3;

export function strengthOf(stats: SetStats): Strength {
  if (!stats.done) return Strength.None;
  if (stats.done < MIN_ATTEMPTS_TO_JUDGE) return Strength.Early;
  const accuracy = stats.right / stats.done;
  if (accuracy >= 0.75) return Strength.Strong;
  if (accuracy >= 0.5) return Strength.Average;
  return Strength.Weak;
}
