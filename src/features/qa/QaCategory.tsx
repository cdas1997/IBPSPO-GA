import { memo } from 'react';
import { isHot } from '@/lib/bank';
import type { Topic } from '@/lib/types';
import { ExportPdf } from './ExportPdf';
import type { SaveTarget } from './useSaveTarget';

const LETTERS = ['A', 'B', 'C', 'D'];

type QaCategoryProps = { topic: Topic; saveTarget: SaveTarget | null };

function QaCategoryBase({ topic, saveTarget }: QaCategoryProps) {
  const hot = topic.questions.filter(isHot).length;
  return (
    <section className="qa-cat" id={`qa-cat-${topic.key}`} aria-label={topic.name} tabIndex={-1}>
      <div className="qa-cathead">
          <div>
            <h2 className="h2">{topic.name}</h2>
            <p className="sub">
              {topic.questions.length} questions · {hot} high-chance
            </p>
          </div>
          {saveTarget ? <ExportPdf categoryKey={topic.key} categoryName={topic.name} appearance="link" target={saveTarget} /> : null}
      </div>
      <ol className="qa-list" role="list">
        {topic.questions.map((q, i) => (
          <li key={q.id} className="qa-item">
            <span className="qa-n">{i + 1}.</span>
            <div>
              <p className="qa-q">
                {q.text}
                {isHot(q) ? <span className="hot hot-inline">High chance</span> : null}
              </p>
              <p className="qa-a">
                <span className="qa-letter">{LETTERS[q.answer]}</span>
                <span>{q.options[q.answer]}</span>
              </p>
              <p className="qa-ex">{q.explanation}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export const QaCategory = memo(QaCategoryBase);
