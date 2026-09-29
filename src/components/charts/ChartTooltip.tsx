export type TooltipState = { x: number; y: number; value: string; detail: string } | null;

type ChartTooltipProps = { tip: TooltipState; containerWidth: number };

const EDGE = 70;

export function ChartTooltip({ tip, containerWidth }: ChartTooltipProps) {
  if (!tip) return null;
  const left = Math.max(EDGE, Math.min(containerWidth - EDGE, tip.x));
  return (
    <div className="tip" style={{ left, top: tip.y }} role="status">
      <strong>{tip.value}</strong>
      {tip.detail}
    </div>
  );
}
