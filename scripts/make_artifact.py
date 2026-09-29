"""Inline the Vite build into one page for publishing as a claude.ai artifact.

usage: npm run build && python3 scripts/make_artifact.py   (writes artifact/po-mains-ga-prep.html)
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
OUT = ROOT / 'artifact' / 'po-mains-ga-prep.html'


def main():
    index = (DIST / 'index.html').read_text()
    css_path = re.search(r'<link rel="stylesheet"[^>]*href="\./(assets/[^"]+\.css)"', index).group(1)
    js_path = re.search(r'<script type="module"[^>]*src="\./(assets/[^"]+\.js)"', index).group(1)
    fonts = re.search(r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com[^"]+)"', index).group(1)
    css = (DIST / css_path).read_text()
    js = (DIST / js_path).read_text().replace('</script', '<\\/script')
    page = (
        '<title>PO Mains GA Prep</title>\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        f'<link rel="stylesheet" href="{fonts}">\n'
        f'<style>\n{css}\n</style>\n'
        '<div id="root"></div>\n'
        f'<script type="module">\n{js}\n</script>\n'
    )
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(page)
    print(f'wrote {OUT.relative_to(ROOT)} ({len(page) // 1024} KB)')


if __name__ == '__main__':
    main()
