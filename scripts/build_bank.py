"""Build src/data/bank.json from the research runs.

Inputs (scripts/raw/):
  likely.json, months.json, main.json  verified question batches from the research workflows
  digital-cyber.json                   later batch; each question carries its own "likely" score
  ranking.json                         {"drop": [ids], "scores": {id: 1-5}} from the ranking workflow
  tiebreak.json                        {"order": [ids best-first]} for questions tied at the cut-off score

Only the MAX_QUESTIONS most likely questions are kept. Questions tied at the cut-off score are written to
scripts/raw/cutoff-band.json; rank them into tiebreak.json and rebuild.

usage: python3 scripts/build_bank.py
"""
import hashlib
import html
import json
import random
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'scripts' / 'raw'
OUT = ROOT / 'src' / 'data' / 'bank.json'
TIEBREAK = RAW / 'tiebreak.json'
BAND = RAW / 'cutoff-band.json'
MAX_QUESTIONS = 250
SOURCES = ['likely.json', 'months.json', 'main.json', 'digital-cyber.json']
CHECKED = '29 September 2026'
EXAM_DATE = '2026-10-04'
ORDER = ['likely', 'sep-2026', 'aug-2026', 'jul-2026', 'rbi-policy', 'rbi-circulars', 'banking-ca', 'budget', 'economy',
         'digital', 'digital-cyber', 'schemes', 'financial-regulators', 'static-banking', 'misc', 'topup']
NAMES = {'topup': 'High-yield: recently asked areas', 'likely': 'Most likely for 4 Oct'}
GROUPS = {'likely': 'focus', 'topup': 'focus', 'sep-2026': 'month', 'aug-2026': 'month', 'jul-2026': 'month'}
PREFIX = re.compile(r'^\s*(?:\(?[A-Da-d]\)|[A-Da-d][.:)])\s+')
REFERS_TO_OTHERS = re.compile(r'\b(above|of these|both|all of|none of|neither|only [a-d]\b|[a-d] and [a-d]\b|[a-d] & [a-d]\b)', re.I)


def norm(text):
    return re.sub(r'[^a-z0-9]+', ' ', text.lower()).strip()


def clean_question(q):
    opts = [PREFIX.sub('', html.unescape(str(o))).strip() for o in q.get('options', [])]
    ans = str(q.get('answer', '')).strip().upper()[:1]
    text = html.unescape(str(q.get('q', ''))).strip()
    if len(opts) != 4 or ans not in 'ABCD' or not text or len(set(map(norm, opts))) != 4:
        return None
    return {'q': text, 'options': opts, 'answer': ans, 'explanation': html.unescape(str(q.get('explanation', ''))).strip()}


def rebalance(questions, rng):
    """Shuffle option order where safe so the answer key isn't bunched on one letter."""
    for q in questions:
        if any(REFERS_TO_OTHERS.search(o) for o in q['options']):
            continue
        correct = q['options']['ABCD'.index(q['answer'])]
        rng.shuffle(q['options'])
        q['answer'] = 'ABCD'[q['options'].index(correct)]


def keep_most_likely(topics, limit):
    """Keep the `limit` highest-scoring questions; ties at the cut-off follow tiebreak.json."""
    everything = [(t['key'], q) for t in topics for q in t['questions']]
    if len(everything) <= limit:
        return topics
    tiebreak = json.loads(TIEBREAK.read_text())['order'] if TIEBREAK.exists() else []
    tb = {qid: i for i, qid in enumerate(tiebreak)}
    order = {q['id']: i for i, (_, q) in enumerate(everything)}
    ranked = sorted(everything, key=lambda kq: (-kq[1]['likely'], tb.get(kq[1]['id'], len(tb)), order[kq[1]['id']]))
    cutoff = ranked[limit - 1][1]['likely']
    band = [(k, q) for k, q in everything if q['likely'] == cutoff]
    above = sum(1 for _, q in everything if q['likely'] > cutoff)
    BAND.write_text(json.dumps({'cutoff': cutoff, 'slots': limit - above, 'questions': [
        {'id': q['id'], 'topic': k, 'q': q['q'], 'answer': q['options']['ABCD'.index(q['answer'])], 'explanation': q['explanation']}
        for k, q in band]}, ensure_ascii=False, indent=1) + '\n')
    covered = sum(1 for _, q in band if q['id'] in tb)
    print(f'cut-off score {cutoff}: {above} questions above it, {limit - above} of {len(band)} tied questions kept '
          f'({"tie-break ranking applied" if covered == len(band) else f"WARNING: tie-break covers only {covered} of {len(band)}; see {BAND.name}"})')
    keep = {q['id'] for _, q in ranked[:limit]}
    trimmed = [{**t, 'questions': [q for q in t['questions'] if q['id'] in keep]} for t in topics]
    return [t for t in trimmed if t['questions']]


def main():
    batches = []
    for name in SOURCES:
        data = json.loads((RAW / name).read_text())
        batches += data['batches']
    ranking = json.loads((RAW / 'ranking.json').read_text())
    drop, scores = set(ranking['drop']), ranking['scores']
    rng = random.Random(20260929)
    seen, topics, invalid = set(), [], 0
    for b in sorted(batches, key=lambda b: ORDER.index(b['key']) if b['key'] in ORDER else 99):
        qs = []
        for raw in b['questions']:
            q = clean_question(raw)
            key = q and norm(q['q'])
            if not q or key in seen:
                invalid += 1
                continue
            seen.add(key)
            q['id'] = hashlib.sha1(key.encode()).hexdigest()[:10]
            if q['id'] in drop:
                continue
            q['likely'] = scores.get(q['id'], raw.get('likely') or 0)
            qs.append(q)
        rebalance(qs, rng)
        if qs:
            topics.append({'key': b['key'], 'name': NAMES.get(b['key'], html.unescape(b['name'])),
                           'group': GROUPS.get(b['key'], 'topic'), 'questions': qs})
    topics = keep_most_likely(topics, MAX_QUESTIONS)
    bank = {'checked': CHECKED, 'exam': EXAM_DATE, 'topics': topics}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(bank, ensure_ascii=False, indent=1) + '\n')
    total = sum(len(t['questions']) for t in topics)
    letters = Counter(q['answer'] for t in topics for q in t['questions'])
    hot = sum(1 for t in topics for q in t['questions'] if q['likely'] >= 4)
    print(f'{total} questions in {len(topics)} sets ({len(drop)} same-fact duplicates removed, {invalid} invalid); '
          f'{hot} high-chance; answer letters {dict(sorted(letters.items()))}')
    for t in topics:
        print(f"  {len(t['questions']):3d}  {t['name']}")


if __name__ == '__main__':
    main()
