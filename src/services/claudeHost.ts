/**
 * The claude.ai artifact viewer injects `window.claude`; on any other host (GitHub Pages, localhost)
 * it is absent and files download through ordinary links.
 */
export type SaveResult = { status: 'saved' | 'delivered' };
export type DownloadsCapability = { save: (request: { filename: string; data: Blob }) => Promise<SaveResult> };
type ClaudeHost = { use: (name: 'downloads') => Promise<DownloadsCapability | null> };

declare global {
  interface Window {
    claude?: ClaudeHost;
  }
}

let downloads: Promise<DownloadsCapability | null> | null = null;

export function isClaudeViewer(): boolean {
  return Boolean(window.claude);
}

/** Resolves null outside the claude.ai viewer, or when the viewer cannot save files. */
export function getDownloads(): Promise<DownloadsCapability | null> {
  if (!window.claude) return Promise.resolve(null);
  downloads ??= window.claude.use('downloads').catch(() => null);
  return downloads;
}

export function errorCode(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string') return err.code;
  return 'unavailable';
}
