import { useEffect, useState } from 'react';
import { getDownloads, isClaudeViewer, type DownloadsCapability } from '@/services/claudeHost';

export type SaveTarget =
  | { kind: 'link' }
  | { kind: 'checking' }
  | { kind: 'viewer'; downloads: DownloadsCapability }
  | { kind: 'none' };

/** Decides once per page how Export should save: a plain link, or the claude.ai viewer's save prompt. */
export function useSaveTarget(): SaveTarget {
  const [target, setTarget] = useState<SaveTarget>(() => (isClaudeViewer() ? { kind: 'checking' } : { kind: 'link' }));
  useEffect(() => {
    if (!isClaudeViewer()) return;
    let active = true;
    void getDownloads().then((downloads) => {
      if (active) setTarget(downloads ? { kind: 'viewer', downloads } : { kind: 'none' });
    });
    return () => {
      active = false;
    };
  }, []);
  return target;
}
