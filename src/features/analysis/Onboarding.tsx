import { ButtonLink } from '@/components/ui/Button';

type OnboardingProps = { daysLeft: number | null; hasTopSet: boolean };

export function Onboarding({ daysLeft, hasTopSet }: OnboardingProps) {
  return (
    <section className="panel pad stack-sm">
      <h2 className="h2">How to use the next {daysLeft && daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'}` : 'few days'}</h2>
      <ol className="steps">
        <li>
          <span>
            <b>Practise the Top 100 first</b>
            <span className="muted small">The questions ranked most likely to appear, from past IBPS PO Mains papers and 2026 bank exams.</span>
          </span>
        </li>
        <li>
          <span>
            <b>Then the month sets, newest first</b>
            <span className="muted small">Most GA questions are current affairs from the last three to five months.</span>
          </span>
        </li>
        <li>
          <span>
            <b>Take a full mock every day from here</b>
            <span className="muted small">50 questions in 35 minutes, marked the IBPS way. Your score trend appears below.</span>
          </span>
        </li>
        <li>
          <span>
            <b>Come back here to see what to fix</b>
            <span className="muted small">Weak topics, your pace, and the marks you lose to wrong guesses.</span>
          </span>
        </li>
      </ol>
      <div className="row-actions">
        <ButtonLink href={hasTopSet ? '#set-top' : '#bank'} variant="primary">
          Start practising
        </ButtonLink>
        <ButtonLink href="#mocks">Take a mock</ButtonLink>
      </div>
    </section>
  );
}
