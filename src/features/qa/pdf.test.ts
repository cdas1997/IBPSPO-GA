/// <reference types="node" />
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import raw from '@/data/bank.json';
import { pdfHref } from './pdf';

const ROOT = new URL('../../../', import.meta.url);

function publicFile(href: string): URL {
  return new URL(`public/${href.replace(/^\.\//, '')}`, ROOT);
}

describe('PDF exports', () => {
  it('were printed from the current question bank', () => {
    const manifest: unknown = JSON.parse(readFileSync(publicFile('./pdf/manifest.json'), 'utf8'));
    const bankHash = createHash('sha256').update(readFileSync(new URL('src/data/bank.json', ROOT))).digest('hex');
    expect(manifest).toMatchObject({ bankSha256: bankHash });
  });

  it('exist for every category and for the full book', () => {
    const keys = [null, ...raw.topics.map((t) => t.key)];
    for (const key of keys) expect(existsSync(publicFile(pdfHref(key))), pdfHref(key)).toBe(true);
  });
});
