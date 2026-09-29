import type { ReactNode } from 'react';

export type Section = 'analysis' | 'bank' | 'mocks' | 'qa';

const ICONS: Record<Section, ReactNode> = {
  analysis: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  bank: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" />
      <path d="M4 19a2 2 0 0 1 2-2h13M9 7h6" />
    </svg>
  ),
  mocks: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M9 2h6" />
    </svg>
  ),
  qa: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 11h7M9 15h7M9 7h3" />
    </svg>
  ),
};

const TABS: readonly { key: Section; label: string; short: string; href: string }[] = [
  { key: 'analysis', label: 'Analysis', short: 'Analysis', href: '#analysis' },
  { key: 'bank', label: 'Question bank', short: 'Practice', href: '#bank' },
  { key: 'mocks', label: 'Mock tests', short: 'Mocks', href: '#mocks' },
  { key: 'qa', label: 'Q&A', short: 'Q&A', href: '#qa' },
];

type SiteHeaderProps = { active: Section; daysLeft: number | null; user: string; onSwitchUser: () => void };

export function SiteHeader({ active, daysLeft, user, onSwitchUser }: SiteHeaderProps) {
  const countdown = daysLeft === null || daysLeft < 0 ? null : daysLeft === 0 ? 'Exam today' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to exam`;
  return (
    <header className="site-head">
      <div className="wrap site-head-in">
        <a className="brand" href="#analysis">
          PO Mains GA Prep
        </a>
        {countdown ? <span className="countchip">{countdown}</span> : null}
        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => (
            <a key={t.key} className="tab" href={t.href} aria-current={t.key === active ? 'page' : undefined}>
              {ICONS[t.key]}
              <span className="tab-long">{t.label}</span>
              <span className="tab-short">{t.short}</span>
            </a>
          ))}
        </nav>
        <button type="button" className="userbtn" onClick={onSwitchUser} aria-label={`Signed in as ${user}. Switch user`}>
          <span className="username">{user}</span>
          <span className="avatar" aria-hidden="true">
            {user.slice(0, 1)}
          </span>
        </button>
      </div>
    </header>
  );
}
