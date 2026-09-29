import { useCallback } from 'react';
import { choiceOf } from '@/lib/scoring';
import { StudyMode, type Answers, type Question } from '@/lib/types';
import { profileStore } from '@/store/profileStore';
import type { QuestionCardProps } from './QuestionCard';

type PracticeCardArgs = { answers: Answers; mode: StudyMode; topicName: (q: Question) => string | undefined };

/** Props for a question card in practice or revision mode. */
export function usePracticeCard({ answers, mode, topicName }: PracticeCardArgs): (q: Question, label: string) => QuestionCardProps {
  const handlePick = useCallback((questionId: string, choice: number) => {
    profileStore.answer(questionId, choice);
  }, []);
  return (q, label) => {
    const choice = choiceOf(answers, q.id);
    return {
      question: q,
      label,
      context: topicName(q),
      choice,
      display: choice !== undefined || mode === StudyMode.Revision ? 'result' : 'ask',
      onPick: handlePick,
    };
  };
}
