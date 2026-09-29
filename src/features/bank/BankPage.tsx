import { useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { PageHead } from '@/components/layout/PageHead';
import { isAnsweredWrong, setStats } from '@/lib/scoring';
import { TopicGroup, type Answers, type Bank, type StudyMode } from '@/lib/types';
import { profileStore } from '@/store/profileStore';
import { QuestionList } from './QuestionList';
import { searchQuestions } from './questionSets';
import { StudyModeSwitch } from './StudyModeSwitch';
import { TopicList } from './TopicList';
import { usePracticeCard } from './usePracticeCard';

type BankPageProps = { bank: Bank; answers: Answers; mode: StudyMode };

const GROUPS: readonly { group: TopicGroup; title: string; note: string }[] = [
  { group: TopicGroup.Focus, title: 'Targeted sets', note: 'Built from exam-pattern research' },
  { group: TopicGroup.Month, title: 'Last three months', note: 'Most current-affairs questions come from here' },
  { group: TopicGroup.Topic, title: 'Topics', note: '' },
];

export function BankPage({ bank, answers, mode }: BankPageProps) {
  const [query, setQuery] = useState('');
  const top = setStats(bank.top, answers);
  const all = setStats(bank.all, answers);
  const mistakes = bank.all.filter((q) => isAnsweredWrong(q, answers)).length;
  const hits = query.trim().length >= 2 ? searchQuestions(bank.all, query) : null;
  const cardProps = usePracticeCard({ answers, mode, topicName: (q) => bank.topicByKey.get(q.topic)?.name });

  return (
    <>
      <PageHead title="Question bank">
        {bank.all.length} fact-checked questions on General, Economy, Banking, Digital &amp; Financial Awareness, each with an
        explanation.
      </PageHead>
      <main className="wrap stack">
        <div className="sechead">
          <span className="small muted">Practice checks each answer as you go. Revision shows every answer for fast reading.</span>
          <StudyModeSwitch mode={mode} onChange={(m) => profileStore.setMode(m)} />
        </div>
        {bank.top.length ? (
          <a className="starthere" href="#set-top">
            <span className="label">Start here</span>
            <strong>The {bank.top.length} questions most likely to be asked</strong>
            <span className="m">
              Ranked against past IBPS PO Mains papers and 2026 bank exams · {top.done} of {top.total} done
            </span>
          </a>
        ) : null}
        <div className="quicklinks">
          <a className="qlink" href="#set-mistakes">
            <span className="t">My mistakes</span>
            <span className="m">{mistakes ? `${mistakes} question${mistakes === 1 ? '' : 's'} to redo` : 'None yet'}</span>
          </a>
          <a className="qlink" href="#set-all">
            <span className="t">All questions, mixed</span>
            <span className="m">
              {all.done} of {all.total} done
            </span>
          </a>
        </div>
        <div className="searchbox">
          <label className="label" htmlFor="search">
            Search the bank
          </label>
          <input
            id="search"
            type="search"
            placeholder="Try repo rate, UPI, Mudra, SBI…"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {hits ? (
          <section className="stack-sm" aria-live="polite">
            <p className="sub">
              {hits.length ? `${hits.length} question${hits.length === 1 ? '' : 's'} mention “${query.trim()}”` : `No questions mention “${query.trim()}”.`}
            </p>
            <QuestionList key={query} questions={hits} cardProps={cardProps} labelFor={(q) => `Q${q.n}`} />
          </section>
        ) : null}
        {GROUPS.map(({ group, title, note }) => {
          const topics = bank.topics.filter((t) => t.group === group);
          return topics.length ? (
            <section key={group} className="stack-sm">
              <div className="sechead">
                <h2 className="h2">{title}</h2>
                {note ? <span className="small muted">{note}</span> : null}
              </div>
              <TopicList topics={topics} answers={answers} />
            </section>
          ) : null;
        })}
        <Footer checked={bank.checked} />
      </main>
    </>
  );
}
