import { loadBank } from './bank';
import type { Bank } from './types';

/** A small bank for unit tests: two topics, likelihood scores 1-5. */
export function makeTestBank(perTopic = 30): Bank {
  const topic = (key: string, likelyFor: (i: number) => number) => ({
    key,
    name: `Topic ${key}`,
    group: 'topic',
    questions: Array.from({ length: perTopic }, (_, i) => ({
      id: `${key}${i}`,
      q: `Question ${key}${i}?`,
      options: ['w', 'x', 'y', 'z'],
      answer: 'B',
      explanation: `Because ${key}${i}.`,
      likely: likelyFor(i),
    })),
  });
  return loadBank({ checked: 'test', exam: '2026-10-04', topics: [topic('a', (i) => (i % 5) + 1), topic('b', () => 2)] });
}
