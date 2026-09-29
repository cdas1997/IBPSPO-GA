import type { Recommendation } from '@/lib/analysis';
import { SetFilter } from '@/lib/types';

type RecommendationsProps = { items: readonly Recommendation[] };

export function Recommendations({ items }: RecommendationsProps) {
  if (!items.length) return null;
  return (
    <section className="stack-sm">
      <div className="sechead">
        <h2 className="h2">Study next</h2>
        <span className="small muted">Picked from your accuracy and the high-chance questions left</span>
      </div>
      <div className="recs">
        {items.map((r) => (
          <a key={r.topic.key} className="rec" href={`#set-${r.topic.key}${r.filter === SetFilter.All ? '' : `~${r.filter}`}`}>
            <span className="t">{r.topic.name}</span>
            <span className="why">{r.reason}</span>
            <span className="go">Practise →</span>
          </a>
        ))}
      </div>
    </section>
  );
}
