import type { ReactNode } from 'react';

type PageHeadProps = { title: string; children?: ReactNode };

export function PageHead({ title, children }: PageHeadProps) {
  return (
    <div className="pagehead">
      <div className="wrap pagehead-in">
        <h1>{title}</h1>
        {children ? <p className="lede">{children}</p> : null}
      </div>
    </div>
  );
}
