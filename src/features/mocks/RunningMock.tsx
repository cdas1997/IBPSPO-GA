import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { ConfirmBox } from '@/components/ui/ConfirmBox';
import { navigate } from '@/hooks/useHashRoute';
import { useNow } from '@/hooks/useNow';
import { formatClock } from '@/lib/dates';
import { MOCK_CONFIG, PaletteState, paletteState } from '@/lib/mock';
import type { Bank, LiveMock } from '@/lib/types';
import { profileStore } from '@/store/profileStore';

const LETTERS = ['A', 'B', 'C', 'D'];
const WARN_SECS = 300;

type RunningMockProps = { bank: Bank; live: LiveMock };

function finishAndReview(): void {
  const record = profileStore.finishLive();
  navigate(record ? { name: 'review', id: record.id } : { name: 'mocks' });
}

export function RunningMock({ bank, live }: RunningMockProps) {
  const now = useNow(1000);
  const [confirm, setConfirm] = useState<'submit' | 'quit' | null>(null);
  const timeUp = now >= live.endsAt;

  useEffect(() => {
    if (timeUp) finishAndReview();
  }, [timeUp]);

  useEffect(() => {
    return () => profileStore.accrueLiveTime();
  }, []);

  const id = live.questionIds[live.index] ?? '';
  const question = bank.byId.get(id);
  if (!question) return null;
  const picked = live.responses[id];
  const answered = Object.keys(live.responses).length;
  const left = (live.endsAt - now) / 1000;
  const last = live.questionIds.length - 1;

  function go(index: number): void {
    profileStore.goToQuestion(index);
    window.scrollTo(0, 0);
  }

  function pick(choice: number): void {
    profileStore.updateLive((l) => ({ ...l, responses: { ...l.responses, [id]: choice } }));
  }

  function clear(): void {
    profileStore.updateLive((l) => ({ ...l, responses: Object.fromEntries(Object.entries(l.responses).filter(([k]) => k !== id)) }));
  }

  function toggleMark(): void {
    profileStore.updateLive((l) => {
      const marked = { ...l.marked };
      if (marked[id]) delete marked[id];
      else marked[id] = true;
      return { ...l, marked };
    });
  }

  function quit(): void {
    profileStore.quitLive();
    navigate({ name: 'mocks' });
  }

  return (
    <>
      <TopBar>
        <span className="mock-pos">
          {MOCK_CONFIG[live.type].label} · Q {live.index + 1}/{live.questionIds.length}
        </span>
        <span className={`timer${left <= WARN_SECS ? ' warn' : ''}`} role="timer" aria-label="Time left">
          {formatClock(left)}
        </span>
        <Button variant="primary" onClick={() => setConfirm('submit')}>
          Submit
        </Button>
      </TopBar>
      <main className="wrap stack">
        {confirm === 'submit' ? (
          <ConfirmBox
            message={`Submit now? You have answered ${answered} of ${live.questionIds.length}.`}
            confirmLabel="Submit and see my score"
            onConfirm={finishAndReview}
            onCancel={() => setConfirm(null)}
          />
        ) : null}
        <article className="qcard">
          <div className="qmeta">
            <span className="qno">Question {live.index + 1}</span>
          </div>
          <p className="qtext">{question.text}</p>
          <div className="opts" role="group" aria-label="Options">
            {question.options.map((text, i) => (
              <button key={text} type="button" className={`opt${picked === i ? ' is-picked' : ''}`} aria-pressed={picked === i} onClick={() => pick(i)}>
                <span className="letter">{LETTERS[i]}</span>
                <span>{text}</span>
              </button>
            ))}
          </div>
        </article>
        <div className="mock-actions">
          <Button disabled={live.index === 0} onClick={() => go(live.index - 1)}>
            Previous
          </Button>
          <Button disabled={picked === undefined} onClick={clear}>
            Clear
          </Button>
          <Button onClick={toggleMark}>{live.marked[id] ? 'Unmark' : 'Mark for review'}</Button>
          <Button variant="primary" disabled={live.index === last} onClick={() => go(live.index + 1)}>
            Save &amp; next
          </Button>
        </div>
        <section className="stack-sm" aria-label="Question palette">
          <p className="label">Question palette · {answered} answered</p>
          <div className="pgrid">
            {live.questionIds.map((qid, i) => {
              const state = paletteState(live, i);
              return (
                <button
                  key={qid}
                  type="button"
                  className={`pbtn${state === PaletteState.NotVisited ? '' : ` ${state}`}${i === live.index ? ' is-current' : ''}`}
                  aria-label={`Question ${i + 1}, ${state.replace('-', ' ')}`}
                  onClick={() => go(i)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="legend">
            <span><i className="answered" />Answered</span>
            <span><i className="not-answered" />Not answered</span>
            <span><i />Not visited</span>
            <span><i className="marked" />Marked for review</span>
          </div>
        </section>
        {confirm === 'quit' ? (
          <ConfirmBox message="Quit this mock? Your answers in it will be thrown away." confirmLabel="Quit mock" onConfirm={quit} onCancel={() => setConfirm(null)} />
        ) : (
          <div>
            <Button variant="link" onClick={() => setConfirm('quit')}>
              Quit this mock
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
