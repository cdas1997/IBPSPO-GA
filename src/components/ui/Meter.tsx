type MeterProps = { value: number; tone?: 'accent' | 'strong' | 'average' | 'weak'; label: string };

export function Meter({ value, tone = 'accent', label }: MeterProps) {
  const width = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div className={`meter ${tone === 'accent' ? '' : tone}`} role="img" aria-label={label}>
      <span style={{ width }} />
    </div>
  );
}
