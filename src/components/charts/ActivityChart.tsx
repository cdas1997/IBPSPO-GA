import { useRef, useState } from 'react';
import { useElementWidth } from '@/hooks/useElementWidth';
import { ChartTooltip, type TooltipState } from './ChartTooltip';

export type ActivityBar = { key: string; shortLabel: string; longLabel: string; count: number };

type ActivityChartProps = { bars: readonly ActivityBar[] };

const HEIGHT = 210;
const M = { l: 36, r: 8, t: 20, b: 28 };
const MAX_BAR = 24;

function columnPath(x: number, y: number, w: number, h: number): string {
  if (h <= 0) return '';
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function ActivityChart({ bars }: ActivityChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const width = useElementWidth(box);
  const [active, setActive] = useState<number | null>(null);
  const W = Math.max(260, width);
  const iw = W - M.l - M.r;
  const ih = HEIGHT - M.t - M.b;
  const most = Math.max(0, ...bars.map((b) => b.count));
  const top = most <= 10 ? 10 : Math.ceil(most / 20) * 20;
  const y = (v: number): number => M.t + ih - (v / top) * ih;
  const band = iw / Math.max(1, bars.length);
  const bw = Math.min(MAX_BAR, band * 0.6);
  const peak = bars.reduce((best, b, i) => (b.count > (bars[best]?.count ?? 0) ? i : best), 0);
  const activeBar = active === null ? undefined : bars[active];
  const tip: TooltipState = activeBar && active !== null
    ? { x: M.l + band * active + band / 2, y: y(activeBar.count), value: `${activeBar.count} question${activeBar.count === 1 ? '' : 's'}`, detail: ` ${activeBar.longLabel}` }
    : null;

  return (
    <div className="chart" ref={box}>
      {width > 0 ? (
        <svg width={W} height={HEIGHT} viewBox={`0 0 ${W} ${HEIGHT}`}>
          {[0, top / 2, top].map((t) => (
            <g key={t}>
              <line className="c-grid" x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} />
              <text className="c-tick" x={M.l - 8} y={y(t) + 4} textAnchor="end">
                {t}
              </text>
            </g>
          ))}
          {bars.map((b, i) => {
            const cx = M.l + band * i + band / 2;
            const by = y(b.count);
            const labelled = b.count > 0 && (i === peak || i === bars.length - 1);
            return (
              <g key={b.key}>
                <path className={`c-bar${active === i ? ' is-hover' : ''}`} d={columnPath(cx - bw / 2, by, bw, M.t + ih - by)} />
                <text className="c-tick" x={cx} y={HEIGHT - 8} textAnchor="middle">
                  {b.shortLabel}
                </text>
                {labelled ? (
                  <text className="c-val" x={cx} y={by - 6} textAnchor="middle">
                    {b.count}
                  </text>
                ) : null}
                <rect
                  className="c-hit"
                  x={M.l + band * i}
                  y={M.t}
                  width={band}
                  height={ih}
                  tabIndex={0}
                  role="img"
                  aria-label={`${b.longLabel}: ${b.count} questions`}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                />
              </g>
            );
          })}
        </svg>
      ) : null}
      <ChartTooltip tip={tip} containerWidth={W} />
    </div>
  );
}
