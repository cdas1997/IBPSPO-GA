import { Meter } from '@/components/ui/Meter';
import { Strength, percent, setStats, strengthOf } from '@/lib/scoring';
import type { Answers, Topic } from '@/lib/types';

const STRENGTH_LABEL: Record<Strength, string> = {
  strong: 'Strong',
  average: 'Average',
  weak: 'Weak',
  early: 'Too few to judge',
  none: 'Not started',
};

type TopicTableProps = { topics: readonly Topic[]; answers: Answers };

export function TopicTable({ topics, answers }: TopicTableProps) {
  return (
    <section className="stack-sm">
      <div className="sechead">
        <h2 className="h2">Topic by topic</h2>
        <span className="small muted">Strong 75%+ · Average 50–74% · Weak below 50%</span>
      </div>
      <div className="panel tablewrap">
        <table className="data">
          <thead>
            <tr>
              <th>Topic</th>
              <th className="n">Done</th>
              <th>Accuracy</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => {
              const s = setStats(t.questions, answers);
              const strength = strengthOf(s);
              const accuracy = percent(s.right, s.done);
              const tone = strength === Strength.Strong || strength === Strength.Average || strength === Strength.Weak ? strength : 'accent';
              return (
                <tr key={t.key}>
                  <td>
                    <a href={`#set-${t.key}`}>{t.name}</a>
                  </td>
                  <td className="n">
                    {s.done}/{s.total}
                  </td>
                  <td>
                    <div className="acccell">
                      <Meter value={s.done ? accuracy : 0} tone={tone} label={s.done ? `${accuracy}% right` : 'Not started'} />
                      <span className="pct">{s.done ? `${accuracy}%` : '–'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status ${strength}`}>{STRENGTH_LABEL[strength]}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
