import { Footer } from '@/components/layout/Footer';
import { PageHead } from '@/components/layout/PageHead';
import { EmptyState } from '@/components/ui/EmptyState';
import { navigate } from '@/hooks/useHashRoute';
import type { Bank } from '@/lib/types';
import { ExportPdf } from './ExportPdf';
import { useSaveTarget } from './useSaveTarget';
import { QaCategory } from './QaCategory';

const ALL = 'all';

type QaPageProps = { bank: Bank; categoryKey: string | null };

function scrollToCategory(key: string): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const section = document.getElementById(`qa-cat-${key}`);
  section?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  section?.focus({ preventScroll: true });
}

export function QaPage({ bank, categoryKey }: QaPageProps) {
  const current = categoryKey ? bank.topicByKey.get(categoryKey) : undefined;
  const topics = current ? [current] : bank.topics;
  const saveTarget = useSaveTarget();

  return (
    <>
      <PageHead title="Questions & answers">
        All {bank.all.length} questions with the correct answer and the key fact, category by category. Read it like a revision book or
        export it as a PDF.
      </PageHead>
      <main className="wrap stack">
        <div className="panel pad qa-controls">
          <div className="field">
            <label className="label" htmlFor="qa-category">
              Category
            </label>
            <select
              id="qa-category"
              value={current ? current.key : ALL}
              onChange={(e) => navigate({ name: 'qa', key: e.target.value === ALL ? null : e.target.value })}
            >
              <option value={ALL}>All categories ({bank.all.length} questions)</option>
              {bank.topics.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name} ({t.questions.length})
                </option>
              ))}
            </select>
          </div>
          <ExportPdf categoryKey={current?.key ?? null} categoryName={current?.name ?? null} appearance="button" target={saveTarget} />
        </div>
        {categoryKey && !current ? <EmptyState>That category does not exist. Pick one from the list above.</EmptyState> : null}
        {current ? null : (
          <nav className="qa-index" aria-label="Jump to a category">
            {bank.topics.map((t) => (
              <button key={t.key} type="button" className="chip" aria-label={`${t.name}, ${t.questions.length} questions`} onClick={() => scrollToCategory(t.key)}>
                {t.name}
                <span className="num">{t.questions.length}</span>
              </button>
            ))}
          </nav>
        )}
        {topics.map((t) => (
          <QaCategory key={t.key} topic={t} saveTarget={current ? null : saveTarget} />
        ))}
        <Footer checked={bank.checked} />
      </main>
    </>
  );
}
