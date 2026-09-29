import type { ReactNode } from 'react';

type TopBarProps = { children: ReactNode };

export function TopBar({ children }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="wrap topbar-in">{children}</div>
    </div>
  );
}
