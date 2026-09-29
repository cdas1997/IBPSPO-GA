import { useEffect } from 'react';
import { SiteHeader, type Section } from '@/components/layout/SiteHeader';
import { bank } from '@/data';
import { AnalysisPage } from '@/features/analysis';
import { LoginPage } from '@/features/auth';
import { BankPage, QuestionSetPage } from '@/features/bank';
import { MockReview, MocksPage, RunningMock } from '@/features/mocks';
import { QaPage } from '@/features/qa';
import { navigate, parseRoute, useHash, type Route } from '@/hooks/useHashRoute';
import { useNow } from '@/hooks/useNow';
import { examCountdown } from '@/lib/dates';
import { isLiveRunning } from '@/lib/mock';
import { setStats } from '@/lib/scoring';
import { profileStore, useProfileState } from '@/store/profileStore';

const MINUTE = 60_000;

function sectionOf(route: Route): Section {
  if (route.name === 'bank' || route.name === 'set') return 'bank';
  if (route.name === 'mocks' || route.name === 'review' || route.name === 'mock') return 'mocks';
  if (route.name === 'qa') return 'qa';
  return 'analysis';
}

export function App() {
  const hash = useHash();
  const route = parseRoute(hash);
  const user = useProfileState((s) => s.user);
  const profile = useProfileState((s) => s.profile);
  const storageOk = useProfileState((s) => s.storageOk);
  const now = useNow(MINUTE);
  const countdown = examCountdown(bank.examDate, now);
  const live = profile.live;
  const liveExpired = live !== null && live.endsAt <= now;
  const showRunning = route.name === 'mock' && isLiveRunning(live, now);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [hash]);

  useEffect(() => {
    if (liveExpired) profileStore.finishLive();
  }, [liveExpired]);

  useEffect(() => {
    if (user && route.name === 'mock' && !showRunning) navigate({ name: 'mocks' });
  }, [user, route.name, showRunning]);

  if (!user) {
    return <LoginPage questionCount={bank.all.length} examLabel={countdown?.label ?? null} onLogin={(name) => profileStore.login(name)} />;
  }

  if (showRunning && live) return <RunningMock bank={bank} live={live} />;

  return (
    <div className="with-tabs with-head">
      <SiteHeader active={sectionOf(route)} daysLeft={countdown?.daysLeft ?? null} user={user} onSwitchUser={() => profileStore.logout()} />
      <Page route={route} user={user} now={now} storageOk={storageOk} />
    </div>
  );
}

type PageProps = { route: Route; user: string; now: number; storageOk: boolean };

function Page({ route, user, now, storageOk }: PageProps) {
  const profile = useProfileState((s) => s.profile);
  switch (route.name) {
    case 'bank':
      return <BankPage bank={bank} answers={profile.answers} mode={profile.mode} />;
    case 'set':
      return <QuestionSetPage key={`${route.key}~${route.filter}`} bank={bank} setKey={route.key} initialFilter={route.filter} answers={profile.answers} mode={profile.mode} />;
    case 'mocks':
    case 'mock':
      return <MocksPage bank={bank} answeredCount={setStats(bank.all, profile.answers).done} mocks={profile.mocks} live={profile.live} />;
    case 'review': {
      const mock = profile.mocks.find((m) => m.id === route.id);
      if (!mock) return <MocksPage bank={bank} answeredCount={setStats(bank.all, profile.answers).done} mocks={profile.mocks} live={profile.live} />;
      return <MockReview key={mock.id} bank={bank} mock={mock} canStartNew={!isLiveRunning(profile.live, now)} />;
    }
    case 'qa':
      return <QaPage bank={bank} categoryKey={route.key} />;
    case 'analysis':
      return <AnalysisPage bank={bank} user={user} profile={profile} storageOk={storageOk} now={now} />;
  }
}
