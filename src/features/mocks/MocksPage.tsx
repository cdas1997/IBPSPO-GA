import { Footer } from '@/components/layout/Footer';
import { PageHead } from '@/components/layout/PageHead';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatClock } from '@/lib/dates';
import { MOCK_CONFIG, WEAK_MOCK_MIN_ANSWERS, isLiveRunning } from '@/lib/mock';
import { MockType, type Bank, type LiveMock, type MockRecord } from '@/lib/types';
import { navigate } from '@/hooks/useHashRoute';
import { useNow } from '@/hooks/useNow';
import { profileStore } from '@/store/profileStore';
import { MockHistoryTable } from './MockHistoryTable';

type MocksPageProps = { bank: Bank; answeredCount: number; mocks: readonly MockRecord[]; live: LiveMock | null };

const ORDER: readonly MockType[] = [MockType.Full, MockType.Quick, MockType.Weak];

export function MocksPage({ bank, answeredCount, mocks, live }: MocksPageProps) {
  const now = useNow(1000);
  const running = isLiveRunning(live, now) ? live : null;

  function handleStart(type: MockType): void {
    profileStore.startMock(type);
    navigate({ name: 'mock' });
  }

  return (
    <>
      <PageHead title="Mock tests">
        Timed tests marked the IBPS way: +1.2 for a right answer, −0.30 (a quarter of 1.2) for a wrong one, nothing for a skipped one.
      </PageHead>
      <main className="wrap stack">
        {running ? (
          <div className="resume">
            <span>
              <b>{MOCK_CONFIG[running.type].label} in progress</b>
              <br />
              <span className="small">
                {formatClock((running.endsAt - now) / 1000)} left · {Object.keys(running.responses).length} of {running.questionIds.length} answered
              </span>
            </span>
            <ButtonLink href="#mock" variant="primary">
              Resume
            </ButtonLink>
          </div>
        ) : null}
        <section className="mocktypes">
          {ORDER.map((type) => {
            const cfg = MOCK_CONFIG[type];
            const locked = type === MockType.Weak && answeredCount < WEAK_MOCK_MIN_ANSWERS;
            return (
              <div key={type} className={`mtype${type === MockType.Full ? ' main' : ''}`}>
                <h3>{cfg.label}</h3>
                <span className="spec">
                  {Math.min(cfg.questions, bank.all.length)} questions · {formatClock(cfg.seconds)}
                </span>
                <p>
                  {cfg.blurb}
                  {locked ? ` Unlocks after you answer ${WEAK_MOCK_MIN_ANSWERS} questions in the bank (${answeredCount} so far).` : ''}
                </p>
                <Button variant={type === MockType.Full ? 'primary' : 'secondary'} disabled={locked || Boolean(running)} onClick={() => handleStart(type)}>
                  Start {cfg.label.toLowerCase()}
                </Button>
              </div>
            );
          })}
        </section>
        <p className="small muted">
          You can change or clear an answer until you submit. “Mark for review” flags a question to come back to; a marked question
          that has an answer still counts. The test submits itself when time runs out.
        </p>
        <section className="stack-sm">
          <div className="sechead">
            <h2 className="h2">Your mocks</h2>
            {mocks.length ? <span className="small muted">Open any mock to review every question</span> : null}
          </div>
          {mocks.length ? (
            <MockHistoryTable mocks={mocks} />
          ) : (
            <EmptyState>Your finished mocks will be listed here, each with a full question-by-question review.</EmptyState>
          )}
        </section>
        <Footer checked={bank.checked} />
      </main>
    </>
  );
}
