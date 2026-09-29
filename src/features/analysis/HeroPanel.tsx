import { ButtonLink } from '@/components/ui/Button';
import { Meter } from '@/components/ui/Meter';
import type { DailyTarget, ScoreEstimate } from '@/lib/analysis';
import { formatMarks, percent } from '@/lib/scoring';

type HeroPanelProps = {
  estimate: ScoreEstimate | null;
  practiceAccuracy: number | null;
  practiceDone: number;
  target: DailyTarget | null;
  examLabel: string | null;
  isExamDay: boolean;
};

export function HeroPanel({ estimate, practiceAccuracy, practiceDone, target, examLabel, isExamDay }: HeroPanelProps) {
  return (
    <section className="panel hero">
      <div>
        <span className="label">Estimated GA score</span>
        {estimate ? (
          <>
            <span className="hero-num">
              {formatMarks(estimate.score)}
              <small>/ 60</small>
            </span>
            <p className="small muted">
              Average of your last {estimate.basedOn} {estimate.fullMocksOnly ? 'full ' : ''}mock{estimate.basedOn === 1 ? '' : 's'}, scaled to the
              50-question section.
            </p>
          </>
        ) : (
          <>
            <span className="hero-num">–</span>
            <p className="small muted">
              Take a full mock to get an estimate.{' '}
              {practiceAccuracy === null ? 'Your practice accuracy is not measured yet.' : `Your practice accuracy is ${practiceAccuracy}% on ${practiceDone} questions.`}
            </p>
            <div>
              <ButtonLink href="#mocks" variant="primary">
                Go to mock tests
              </ButtonLink>
            </div>
          </>
        )}
      </div>
      <div>
        <span className="label">Today’s target</span>
        {target ? (
          <>
            <span className="hero-num">
              {target.doneToday}
              <small>/ {target.target} questions</small>
            </span>
            <Meter value={percent(target.doneToday, target.target)} label={`${target.doneToday} of ${target.target} done today`} />
            <p className="small muted">
              {target.remaining} questions left in the bank and {target.studyDays} study day{target.studyDays === 1 ? '' : 's'}
              {examLabel ? ` before ${examLabel}` : ''}.
            </p>
          </>
        ) : (
          <p className="muted">
            {isExamDay ? 'Exam day. Skim the September set in Revision mode, then stop and rest.' : 'You have attempted every question. Redo your mistakes and keep taking mocks.'}
          </p>
        )}
      </div>
    </section>
  );
}
