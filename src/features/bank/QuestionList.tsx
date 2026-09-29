import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { Question } from '@/lib/types';
import { QuestionCard, type QuestionCardProps } from './QuestionCard';

const PAGE = 40;

type QuestionListProps = {
  questions: readonly Question[];
  cardProps: (q: Question, label: string) => QuestionCardProps;
  labelFor: (q: Question) => string;
};

export function QuestionList({ questions, cardProps, labelFor }: QuestionListProps) {
  const [shown, setShown] = useState(PAGE);
  const visible = questions.slice(0, shown);
  return (
    <div className="qlist">
      {visible.map((q) => (
        <QuestionCard key={q.id} {...cardProps(q, labelFor(q))} />
      ))}
      {questions.length > shown ? (
        <Button onClick={() => setShown((n) => n + PAGE)}>
          Show {Math.min(PAGE, questions.length - shown)} more of {questions.length - shown} remaining
        </Button>
      ) : null}
    </div>
  );
}
