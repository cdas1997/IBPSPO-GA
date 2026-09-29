import { isHot } from '@/lib/bank';
import { choiceOf, percent, setStats } from '@/lib/scoring';
import type { Answers, Topic } from '@/lib/types';

type TopicListProps = { topics: readonly Topic[]; answers: Answers };

export function TopicList({ topics, answers }: TopicListProps) {
  return (
    <ul className="topics">
      {topics.map((t) => {
        const s = setStats(t.questions, answers);
        const hotLeft = t.questions.filter((q) => isHot(q) && choiceOf(answers, q.id) === undefined).length;
        const share = (n: number): string => `${s.total ? (n * 100) / s.total : 0}%`;
        return (
          <li key={t.key}>
            <a className="trow" href={`#set-${t.key}`}>
              <span className="tname">{t.name}</span>
              <span className="tmeta">
                {s.total} questions{s.done ? ` · ${s.done} done · ${percent(s.right, s.done)}% right` : ''}
              </span>
              {hotLeft ? <span className="hotn">{hotLeft} high-chance</span> : null}
              <span className="track" aria-hidden="true">
                <span className="sg" style={{ width: share(s.right) }} />
                <span className="sb" style={{ width: share(s.wrong) }} />
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
