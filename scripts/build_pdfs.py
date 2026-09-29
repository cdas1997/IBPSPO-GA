"""Print the question bank as A4 PDFs (all categories + one per category) with headless Chrome.

usage: python3 scripts/build_pdfs.py          (writes public/pdf/po-mains-ga-qa-<all|category>.pdf)
The file names must match pdfHref() in src/features/qa/pdf.ts. public/pdf/manifest.json records the
bank.json hash the PDFs were printed from; src/features/qa/pdf.test.ts fails when they drift apart.
"""
import hashlib
import html
import json
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BANK = ROOT / 'src' / 'data' / 'bank.json'
OUT = ROOT / 'public' / 'pdf'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
HOT = 4
LETTERS = 'ABCD'
CSS = """
@page {
  size: A4;
  margin: 9mm 9mm 11mm;
  @bottom-center { content: "PO Mains GA Prep \\00B7  Questions & answers \\00B7  page " counter(page) " of " counter(pages); font: 6.5pt "Helvetica Neue", Arial, sans-serif; color: #555; }
}
* { box-sizing: border-box; }
body { margin: 0; color: #111; font: 8.4pt/1.32 "Helvetica Neue", Arial, sans-serif; }
.head { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; padding-bottom: 1.5mm; border-bottom: 0.8pt solid #111; }
.head h1 { margin: 0; font: 700 13pt/1.15 Georgia, "Times New Roman", serif; }
.head .meta { font: 6.8pt/1.3 Menlo, monospace; color: #444; text-align: right; }
.legend { margin: 1.2mm 0 2mm; font-size: 7pt; color: #333; }
.contents { margin: 0 0 2.5mm; font-size: 7pt; color: #333; }
.contents b { color: #111; }
.cols { column-count: 2; column-gap: 5mm; column-rule: 0.4pt solid #bbb; }
.cat h2 { margin: 2.2mm 0 0.8mm; padding: 0.6mm 0; font: 700 9.6pt/1.2 Georgia, "Times New Roman", serif; border-bottom: 0.6pt solid #111; break-after: avoid; }
.cat h2 span { font: 400 6.8pt Menlo, monospace; color: #444; }
.cat:first-child h2 { margin-top: 0; }
ol { list-style: none; margin: 0; padding: 0; }
li { padding: 1mm 0 1.1mm; border-bottom: 0.3pt solid #ccc; break-inside: avoid; }
.q { font-weight: 600; }
.q b { color: #000; }
.star { color: #111; }
.a { margin-top: 0.4mm; color: #0B5A2F; font-weight: 700; }
.ex { margin-top: 0.3mm; color: #333; font-size: 7.5pt; line-height: 1.28; }
"""


def esc(text):
    return html.escape(str(text), quote=False)


def category_html(topic, heading=True):
    hot = sum(1 for q in topic['questions'] if q.get('likely', 0) >= HOT)
    items = []
    for i, q in enumerate(topic['questions'], 1):
        ans = LETTERS.index(q['answer'])
        star = ' <span class="star">★</span>' if q.get('likely', 0) >= HOT else ''
        items.append(
            f'<li><div class="q"><b>{i}.</b> {esc(q["q"])}{star}</div>'
            f'<div class="a">Ans ({q["answer"]}) {esc(q["options"][ans])}</div>'
            f'<div class="ex">{esc(q["explanation"])}</div></li>'
        )
    head = f'<h2>{esc(topic["name"])} <span>{len(topic["questions"])} Q · {hot}★</span></h2>' if heading else ''
    return f'<section class="cat">{head}<ol>{"".join(items)}</ol></section>'


def document_html(bank, topics, title):
    total = sum(len(t['questions']) for t in topics)
    hot = sum(1 for t in topics for q in t['questions'] if q.get('likely', 0) >= HOT)
    head = (
        f'<div class="head"><h1>{esc(title)}</h1><div class="meta">IBPS PO Mains 2026 · GA<br>'
        f'{total} Q · {hot}★ · checked {esc(bank["checked"])}</div></div>'
        f'<p class="legend">★ = high chance of appearing (ranked against past IBPS PO Mains papers and 2026 bank exams). '
        f'Each answer is followed by the key fact and its source. Marking: +1.2 right, −0.30 wrong.</p>'
    )
    contents = ''
    if len(topics) > 1:
        entries = ' · '.join(f'<b>{esc(t["name"])}</b> {len(t["questions"])}' for t in topics)
        contents = f'<p class="contents">Contents: {entries}</p>'
    single = len(topics) == 1
    body = ''.join(category_html(t, heading=not single) for t in topics)
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{esc(title)}</title><style>{CSS}</style></head>'
            f'<body>{head}{contents}<div class="cols">{body}</div></body></html>')


def pdf_complete(path):
    if not path.exists() or path.stat().st_size < 1000:
        return False
    with path.open('rb') as f:
        f.seek(-1024, 2)
        return b'%%EOF' in f.read()


def print_pdf(page_html, out_path, workdir):
    """Chrome on macOS can linger after printing, so wait for a finished file and then stop it."""
    src = workdir / (out_path.stem + '.html')
    src.write_text(page_html)
    cmd = [CHROME, '--headless=new', '--disable-gpu', '--no-first-run', '--no-pdf-header-footer',
           f'--user-data-dir={workdir / "profile"}', f'--print-to-pdf={out_path}', src.as_uri()]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        deadline = time.monotonic() + 120
        while time.monotonic() < deadline:
            if proc.poll() is not None or pdf_complete(out_path):
                time.sleep(0.5)
                break
            time.sleep(0.25)
    finally:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()
    if not pdf_complete(out_path):
        raise RuntimeError(f'Chrome did not finish writing {out_path.name}')


def main():
    raw = BANK.read_bytes()
    bank = json.loads(raw)
    topics = bank['topics']
    for t in topics:
        if t['key'] == 'all' or not re.fullmatch(r'[a-z0-9-]+', t['key']):
            raise SystemExit(f'Topic key {t["key"]!r} cannot be used in a PDF file name.')
    jobs = [('all', topics, 'Questions & answers: all categories')]
    jobs += [(t['key'], [t], t['name']) for t in topics]
    staging = OUT.with_name('pdf.staging')
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True)
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        for key, subset, title in jobs:
            out = staging / f'po-mains-ga-qa-{key}.pdf'
            print_pdf(document_html(bank, subset, title), out, work)
            print(f'  {out.stat().st_size // 1024:5d} KB  {out.name}')
    manifest = {'bankSha256': hashlib.sha256(raw).hexdigest(), 'keys': [t['key'] for t in topics]}
    (staging / 'manifest.json').write_text(json.dumps(manifest, indent=1) + '\n')
    if OUT.exists():
        shutil.rmtree(OUT)
    staging.rename(OUT)


if __name__ == '__main__':
    main()
