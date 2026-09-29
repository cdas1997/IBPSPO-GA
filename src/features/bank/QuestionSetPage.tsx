import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ConfirmBox } from '@/components/ui/ConfirmBox';
import { EmptyState } from '@/components/ui/EmptyState';
import { isHot } from '@/lib/bank';
import { formatMarks, netMarks, setStats } from '@/lib/scoring';
import { SetFilter, type Answers, type Bank, type StudyMode } from '@/lib/types';
import { profileStore } from '@/store/profileStore';
import { QuestionList } from './QuestionList';
import { SpecialSet, applyFilter, resolveSet } from './questionSets';
import { StudyModeSwitch } from './StudyModeSwitch';
import { usePracticeCard } from './usePracticeCard';

type QuestionSetPageProps = { bank: Bank; setKey: string; initialFilter: SetFilter; answers: Answers; mode: StudyMode };

const EMPTY: Record<SetFilter, string> = {
  all: 'No questions here.',
  todo: 'You have attempted every question in this set.',
  wrong: 'No wrong answers here.',
  right: 'No right answers yet.',
  hot: 'No high-chance questions in this set.',
};

export function QuestionSetPage({ bank, setKey, initialFilter, answers, mode }: QuestionSetPageProps) {
  const [filter, setFilter] = useState<SetFilter>(initialFilter);
  const [confirmReset, setConfirmReset] = useState(false);
  const [redo, setRedo] = useState<readonly string[] | null>(null);
  const set = resolveSet(setKey, bank, answers);
  const cardProps = usePracticeCard({ answers, mode, topicName: (q) => (set?.mixed ? bank.topicByKey.get(q.topic)?.name : undefined) });
  if (!set) {
    return (
      <main className="wrap stack">
        <EmptyState>This set does not exist. Go back to the question bank.</EmptyState>
      </main>
    );
  }
  const isMistakes = set.key === SpecialSet.Mistakes;
  const base = isMistakes && redo ? redo.map((id) => bank.byId.get(id)).filter((q) => q !== undefined) : set.questions;
  const s = setStats(base, answers);
  const hotCount = base.filter(isHot).length;
  const visible = isMistakes ? base : applyFilter(base, filter, answers);
  const wrongIds = base.filter((q) => answers[q.id] && answers[q.id]?.[0] !== q.answer).map((q) => q.id);
  const positions = new Map(set.questions.map((q, i) => [q.id, i + 1]));
  const labelFor = set.mixed ? (q: { id: string }) => `Q${positions.get(q.id) ?? ''}` : (q: { n: number }) => `Q${q.n}`;

  function handleRetry(): void {
    profileStore.clearAnswers(wrongIds);
    if (isMistakes) setRedo(wrongIds);
    else setFilter(SetFilter.Todo);
    window.scrollTo(0, 0);
  }

  function handleReset(): void {
    profileStore.clearAnswers(base.map((q) => q.id));
    setConfirmReset(false);
    setFilter(SetFilter.All);
  }

  return (
    <>
      <TopBar>
        <a className="back" href="#bank">
          ← Question bank
        </a>
        <StudyModeSwitch mode={mode} onChange={(m) => profileStore.setMode(m)} />
      </TopBar>
      <main className="wrap stack">
        <header className="thead">
          <h1 className="h-topic">{isMistakes && redo ? 'Redo my mistakes' : set.name}</h1>
          <p className="sub">
            {s.total} questions · {s.done} done
            {s.done ? ` · ${s.right} right, ${s.wrong} wrong · net ${formatMarks(netMarks(s.right, s.wrong))}` : ''}
          </p>
        </header>
        {isMistakes ? null : (
          <div className="chips" role="group" aria-label="Show">
            <Chip label="All" count={s.total} pressed={filter === SetFilter.All} onPress={() => setFilter(SetFilter.All)} />
            <Chip label="Not done" count={s.total - s.done} pressed={filter === SetFilter.Todo} onPress={() => setFilter(SetFilter.Todo)} />
            <Chip label="Wrong" count={s.wrong} pressed={filter === SetFilter.Wrong} onPress={() => setFilter(SetFilter.Wrong)} />
            <Chip label="Right" count={s.right} pressed={filter === SetFilter.Right} onPress={() => setFilter(SetFilter.Right)} />
            {hotCount && set.key !== SpecialSet.Top ? (
              <Chip label="High chance" count={hotCount} pressed={filter === SetFilter.Hot} onPress={() => setFilter(SetFilter.Hot)} />
            ) : null}
          </div>
        )}
        {(filter === SetFilter.Wrong || isMistakes) && wrongIds.length ? (
          <div>
            <Button onClick={handleRetry}>
              Clear these {wrongIds.length} and try again
            </Button>
          </div>
        ) : null}
        {visible.length ? (
          <QuestionList key={`${filter}-${redo ? 'redo' : ''}`} questions={visible} cardProps={cardProps} labelFor={labelFor} />
        ) : (
          <EmptyState>{isMistakes ? 'No mistakes to redo. Wrong answers from practice collect here.' : EMPTY[filter]}</EmptyState>
        )}
        {s.done && !isMistakes ? (
          confirmReset ? (
            <ConfirmBox
              message={`Clear your ${s.done} answers in this set?`}
              confirmLabel="Clear answers"
              onConfirm={handleReset}
              onCancel={() => setConfirmReset(false)}
            />
          ) : (
            <div>
              <Button variant="link" onClick={() => setConfirmReset(true)}>
                Clear my answers in this set
              </Button>
            </div>
          )
        ) : null}
      </main>
    </>
  );
}
