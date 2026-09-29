import { Footer } from '@/components/layout/Footer';
import { PageHead } from '@/components/layout/PageHead';
import {
  accuracyOf,
  activityByDay,
  dailyTarget,
  estimateScore,
  marksLostToNegative,
  mockLabel,
  mockPace,
  recommendTopics,
  scaledTo60,
} from '@/lib/analysis';
import { examCountdown, formatShortDate } from '@/lib/dates';
import { EXAM_PACE_SECS, formatMarks, netMarks, percent, setStats } from '@/lib/scoring';
import type { Bank, Profile } from '@/lib/types';
import { ChartsSection } from './ChartsSection';
import { DataPanel } from './DataPanel';
import { HeroPanel } from './HeroPanel';
import { KpiRow, type Kpi } from './KpiRow';
import { Onboarding } from './Onboarding';
import { Recommendations } from './Recommendations';
import { TopicTable } from './TopicTable';

type AnalysisPageProps = { bank: Bank; user: string; profile: Profile; storageOk: boolean; now: number };

function buildKpis(bank: Bank, profile: Profile): Kpi[] {
  const s = setStats(bank.all, profile.answers);
  const top = setStats(bank.top, profile.answers);
  const pace = mockPace(profile.mocks);
  const lost = marksLostToNegative(profile.mocks);
  const mockRight = profile.mocks.reduce((n, m) => n + m.right, 0);
  const mockWrong = profile.mocks.reduce((n, m) => n + m.wrong, 0);
  const plural = profile.mocks.length === 1 ? '' : 's';
  const items: Kpi[] = [
    {
      label: 'Questions done',
      value: (
        <>
          {s.done}
          <small> / {s.total}</small>
        </>
      ),
      note: s.done ? `${s.wrong} wrong so far` : 'Start with the Top 100',
    },
    {
      label: 'Practice accuracy',
      value: s.done ? `${percent(s.right, s.done)}%` : '–',
      note: s.done ? `Net ${formatMarks(netMarks(s.right, s.wrong))} marks at +1.2 / −0.3` : 'Answer a few questions first',
    },
    {
      label: 'Time per question',
      value: pace === null ? '–' : `${Math.round(pace)}s`,
      note: pace === null ? 'Measured in mocks' : `${pace <= EXAM_PACE_SECS ? 'Within' : 'Slower than'} the ${EXAM_PACE_SECS}s exam pace`,
    },
    {
      label: 'Lost to negative marks',
      value: profile.mocks.length ? `−${formatMarks(lost)}` : '–',
      note: profile.mocks.length ? `Across ${profile.mocks.length} mock${plural}, ${accuracyOf(mockRight, mockWrong)}% accuracy` : 'Measured in mocks',
    },
  ];
  if (bank.top.length) {
    items.splice(2, 0, {
      label: `Top ${bank.top.length} covered`,
      value: (
        <>
          {top.done}
          <small> / {top.total}</small>
        </>
      ),
      note: top.done ? `${percent(top.right, top.done)}% right` : 'Most likely to be asked',
    });
  }
  return items;
}

export function AnalysisPage({ bank, user, profile, storageOk, now }: AnalysisPageProps) {
  const s = setStats(bank.all, profile.answers);
  const countdown = examCountdown(bank.examDate, now);
  const fresh = !s.done && !profile.mocks.length;
  const trend = profile.mocks
    .slice()
    .reverse()
    .map((m, i) => ({
      label: `M${i + 1}`,
      value: scaledTo60(m),
      detail: `${mockLabel(m.type)}, ${formatShortDate(m.startedAt)}`,
      accuracy: accuracyOf(m.right, m.wrong),
    }));

  return (
    <>
      <PageHead title={`${user}’s analysis`}>
        {fresh
          ? 'Nothing to analyse yet. Answer questions in the bank or take a mock, and this page fills in: estimated score, weak topics, pace and what to study next.'
          : `Where you stand${countdown ? ` for ${countdown.label}` : ''}, and what to study next.`}
      </PageHead>
      <main className="wrap stack">
        <HeroPanel
          estimate={estimateScore(profile.mocks)}
          practiceAccuracy={s.done ? percent(s.right, s.done) : null}
          practiceDone={s.done}
          target={dailyTarget(bank, profile.answers, now)}
          examLabel={countdown?.label ?? null}
          isExamDay={countdown?.daysLeft === 0}
        />
        {fresh ? (
          <Onboarding daysLeft={countdown?.daysLeft ?? null} hasTopSet={bank.top.length > 0} />
        ) : (
          <>
            <KpiRow items={buildKpis(bank, profile)} />
            <Recommendations items={recommendTopics(bank, profile.answers)} />
          </>
        )}
        <ChartsSection trend={trend} activity={activityByDay({ answers: profile.answers, mocks: profile.mocks, now, days: 7 })} />
        {fresh ? null : <TopicTable topics={bank.topics} answers={profile.answers} />}
        <DataPanel profile={profile} storageOk={storageOk} />
        <Footer checked={bank.checked} />
      </main>
    </>
  );
}
