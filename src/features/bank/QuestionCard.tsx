import { memo } from 'react';
import { isHot } from '@/lib/bank';
import type { Question } from '@/lib/types';

const LETTERS = ['A', 'B', 'C', 'D'];

export type QuestionCardProps = {
  question: Question;
  label: string;
  /** topic name, shown when the list mixes topics */
  context?: string;
  choice?: number;
  /** ask: options are tappable; result: the answer and explanation are shown */
  display: 'ask' | 'result';
  /** how to word a result shown without a choice */
  unanswered?: 'answer' | 'skipped';
  secondsSpent?: number;
  onPick?: (questionId: string, choice: number) => void;
};

function optionClass(index: number, question: Question, choice: number | undefined, display: QuestionCardProps['display']): string {
  if (display === 'ask') return 'opt';
  if (index === question.answer) return 'opt is-right';
  if (index === choice) return 'opt is-wrong';
  return 'opt is-dim';
}

function Verdict({ question, choice, unanswered }: Pick<QuestionCardProps, 'question' | 'choice' | 'unanswered'>) {
  const letter = LETTERS[question.answer];
  if (choice === question.answer) return <p className="verdict good">Correct</p>;
  if (choice !== undefined) return <p className="verdict bad">Wrong · the answer is {letter}</p>;
  if (unanswered === 'skipped') return <p className="verdict bad">Not attempted · the answer is {letter}</p>;
  return <p className="verdict neutral">Answer: {letter}</p>;
}

function QuestionCardBase({ question, label, context, choice, display, unanswered = 'answer', secondsSpent, onPick }: QuestionCardProps) {
  return (
    <article className="qcard">
      <div className="qmeta">
        <span className="qno">{label}</span>
        {context ? <span className="qtopic">{context}</span> : null}
        {isHot(question) ? <span className="hot">High chance</span> : null}
      </div>
      <p className="qtext">{question.text}</p>
      <div className="opts" role="group" aria-label="Options">
        {question.options.map((text, i) => (
          <button
            key={text}
            type="button"
            className={optionClass(i, question, choice, display)}
            disabled={display === 'result'}
            onClick={() => onPick?.(question.id, i)}
          >
            <span className="letter">{LETTERS[i]}</span>
            <span>{text}</span>
          </button>
        ))}
      </div>
      {display === 'result' ? (
        <div className="explain">
          <Verdict question={question} choice={choice} unanswered={unanswered} />
          <p className="expl">{question.explanation}</p>
          {secondsSpent ? <span className="timeused">Time spent: {Math.round(secondsSpent)}s</span> : null}
        </div>
      ) : null}
    </article>
  );
}

export const QuestionCard = memo(QuestionCardBase);
