const DAY_MS = 86_400_000;

/** Device-local calendar date, never UTC. */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export type ExamCountdown = { daysLeft: number; label: string };

export function examCountdown(examIso: string, now: number): ExamCountdown | null {
  const [y, m, d] = examIso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const exam = new Date(y, m - 1, d).getTime();
  const daysLeft = Math.round((exam - startOfDay(now)) / DAY_MS);
  const label = new Date(exam).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return { daysLeft, label };
}

export function formatClock(totalSecs: number): string {
  const s = Math.max(0, Math.round(totalSecs));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function formatShortDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
}
