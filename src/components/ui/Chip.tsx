type ChipProps = { label: string; count: number; pressed: boolean; onPress: () => void };

export function Chip({ label, count, pressed, onPress }: ChipProps) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} onClick={onPress}>
      {label}
      <span className="num">{count}</span>
    </button>
  );
}
