import { mockLabel } from '@/lib/analysis';
import { formatClock, formatDateTime } from '@/lib/dates';
import { MARK_RIGHT, MARK_WRONG, formatMarks } from '@/lib/scoring';
import type { MockRecord } from '@/lib/types';

type MockHistoryTableProps = { mocks: readonly MockRecord[] };

export function MockHistoryTable({ mocks }: MockHistoryTableProps) {
  return (
    <div className="panel tablewrap">
      <table className="data passbook">
        <thead>
          <tr>
            <th>Date</th>
            <th>Mock</th>
            <th className="n">Right / Wrong / Skip</th>
            <th className="n">Credit</th>
            <th className="n">Debit</th>
            <th className="n">Net</th>
            <th className="n">Time</th>
          </tr>
        </thead>
        <tbody>
          {mocks.map((m) => (
            <tr key={m.id}>
              <td>
                <a href={`#review-${m.id}`}>{formatDateTime(m.startedAt)}</a>
              </td>
              <td>{mockLabel(m.type)}</td>
              <td className="n">
                {m.right} / {m.wrong} / {m.skipped}
              </td>
              <td className="n cr">+{formatMarks(m.right * MARK_RIGHT)}</td>
              <td className="n dr">−{formatMarks(m.wrong * MARK_WRONG)}</td>
              <td className="n">
                <strong>{formatMarks(m.net)}</strong> <span className="muted">/ {formatMarks(m.maxMarks)}</span>
              </td>
              <td className="n">{formatClock(m.usedMs / 1000)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
