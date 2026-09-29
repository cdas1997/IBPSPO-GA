import { isHot } from '@/lib/bank';
import { choiceOf, isAnsweredWrong } from '@/lib/scoring';
import { SetFilter, type Answers, type Bank, type Question } from '@/lib/types';

export type QuestionSet = { key: string; name: string; questions: readonly Question[]; mixed: boolean };

export const SpecialSet = { Top: 'top', All: 'all', Mistakes: 'mistakes' } as const;

export function resolveSet(key: string, bank: Bank, answers: Answers): QuestionSet | null {
  if (key === SpecialSet.Top) return bank.top.length ? { key, name: `Top ${bank.top.length}: most likely to be asked`, questions: bank.top, mixed: true } : null;
  if (key === SpecialSet.All) return { key, name: 'All questions, mixed', questions: bank.all, mixed: true };
  if (key === SpecialSet.Mistakes) return { key, name: 'My mistakes', questions: bank.all.filter((q) => isAnsweredWrong(q, answers)), mixed: true };
  const topic = bank.topicByKey.get(key);
  return topic ? { key, name: topic.name, questions: topic.questions, mixed: false } : null;
}

export function applyFilter(questions: readonly Question[], filter: SetFilter, answers: Answers): Question[] {
  return questions.filter((q) => {
    const choice = choiceOf(answers, q.id);
    switch (filter) {
      case SetFilter.Todo:
        return choice === undefined;
      case SetFilter.Wrong:
        return choice !== undefined && choice !== q.answer;
      case SetFilter.Right:
        return choice === q.answer;
      case SetFilter.Hot:
        return isHot(q);
      case SetFilter.All:
        return true;
    }
  });
}

export function searchQuestions(questions: readonly Question[], query: string): Question[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return questions.filter((q) => {
    const hay = `${q.text} ${q.options.join(' ')} ${q.explanation}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}
