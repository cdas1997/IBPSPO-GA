import type { ReactNode } from 'react';

export type Kpi = { label: string; value: ReactNode; note: string };

type KpiRowProps = { items: readonly Kpi[] };

export function KpiRow({ items }: KpiRowProps) {
  return (
    <section className="kpis" aria-label="Key numbers">
      {items.map((k) => (
        <div key={k.label} className="kpi">
          <span className="label">{k.label}</span>
          <span className="v">{k.value}</span>
          <span className="note">{k.note}</span>
        </div>
      ))}
    </section>
  );
}
