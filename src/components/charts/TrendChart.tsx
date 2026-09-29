import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useElementWidth } from '@/hooks/useElementWidth';
import { ChartTooltip, type TooltipState } from './ChartTooltip';

export type TrendPoint = { label: string; value: number; detail: string };

type TrendChartProps = { points: readonly TrendPoint[]; max: number; unit: string; ariaLabel: string };

const HEIGHT = 210;
const M = { l: 36, r: 48, t: 16, b: 28 };
const TICK_STEP = 20;

export function TrendChart({ points, max, unit, ariaLabel }: TrendChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const width = useElementWidth(box);
  const [active, setActive] = useState<number | null>(null);
  const W = Math.max(260, width);
  const iw = W - M.l - M.r;
  const ih = HEIGHT - M.t - M.b;
  const minValue = Math.min(0, ...points.map((p) => p.value));
  const y0 = minValue < 0 ? Math.floor(minValue / TICK_STEP) * TICK_STEP : 0;
  const x = (i: number): number => M.l + (points.length === 1 ? iw / 2 : (i * iw) / (points.length - 1));
  const y = (v: number): number => M.t + ih - ((v - y0) / (max - y0)) * ih;
  const ticks: number[] = [];
  for (let t = y0; t <= max; t += TICK_STEP) ticks.push(t);
  const labelEvery = Math.ceil(points.length / 8);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
  const last = points[points.length - 1];
  const activePoint = active === null ? undefined : points[active];
  const tip: TooltipState = activePoint && active !== null
    ? { x: x(active), y: y(activePoint.value), value: `${activePoint.value.toFixed(2)} ${unit}`, detail: `${activePoint.label} · ${activePoint.detail}` }
    : null;

  function handleMove(e: PointerEvent<SVGSVGElement>): void {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = points.length === 1 ? 0 : Math.round((px - M.l) / (iw / (points.length - 1)));
    setActive(Math.max(0, Math.min(points.length - 1, i)));
  }

  function handleKey(e: KeyboardEvent<SVGSVGElement>): void {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const current = active ?? points.length - 1;
    setActive(Math.max(0, Math.min(points.length - 1, current + (e.key === 'ArrowRight' ? 1 : -1))));
  }

  return (
    <div className="chart" ref={box}>
      {width > 0 ? (
        <svg
          width={W}
          height={HEIGHT}
          viewBox={`0 0 ${W} ${HEIGHT}`}
          tabIndex={0}
          role="img"
          aria-label={ariaLabel}
          onPointerMove={handleMove}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(points.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={handleKey}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line className="c-grid" x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} />
              <text className="c-tick" x={M.l - 8} y={y(t) + 4} textAnchor="end">
                {t}
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            i % labelEvery === 0 || i === points.length - 1 ? (
              <text key={p.label} className="c-tick" x={x(i)} y={HEIGHT - 8} textAnchor="middle">
                {p.label}
              </text>
            ) : null,
          )}
          {points.length > 1 ? (
            <>
              <path className="c-area" d={`${line}L${x(points.length - 1).toFixed(1)},${y(y0)}L${x(0).toFixed(1)},${y(y0)}Z`} />
              <path className="c-line" d={line} />
            </>
          ) : null}
          {tip ? <line className="c-cross" x1={tip.x} x2={tip.x} y1={M.t} y2={M.t + ih} /> : null}
          {points.map((p, i) => (
            <circle key={p.label} className="c-dot" cx={x(i)} cy={y(p.value)} r={4.5} />
          ))}
          {last ? (
            <text className="c-val" x={x(points.length - 1) + 9} y={y(last.value) + 4}>
              {last.value.toFixed(2)}
            </text>
          ) : null}
        </svg>
      ) : null}
      <ChartTooltip tip={tip} containerWidth={W} />
    </div>
  );
}
