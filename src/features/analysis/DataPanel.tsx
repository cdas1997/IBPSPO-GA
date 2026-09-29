import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmBox } from '@/components/ui/ConfirmBox';
import { knownQuestionIds } from '@/data';
import { BackupError, decodeBackup, encodeBackup } from '@/lib/backup';
import type { Profile } from '@/lib/types';
import { profileStore } from '@/store/profileStore';

type Panel = 'none' | 'show-code' | 'restore' | 'reset';

type DataPanelProps = { profile: Profile; storageOk: boolean };

export function DataPanel({ profile, storageOk }: DataPanelProps) {
  const [panel, setPanel] = useState<Panel>('none');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    const backup = encodeBackup(profile);
    setMessage(null);
    try {
      await navigator.clipboard.writeText(backup);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCode(backup);
      setPanel('show-code');
    }
  }

  function handleRestore(): void {
    try {
      const restored = decodeBackup(code, knownQuestionIds);
      profileStore.replace({ ...restored, mode: profile.mode });
      setMessage(`Restored ${Object.keys(restored.answers).length} answers and ${restored.mocks.length} mocks.`);
      setPanel('none');
      setCode('');
    } catch (err) {
      setMessage(err instanceof BackupError ? err.message : 'That code could not be restored. Copy it again and retry.');
    }
  }

  return (
    <section className="panel pad stack-sm datapanel">
      <h2 className="h2">Your data</h2>
      {!storageOk ? <p className="notice">This browser is refusing to save progress (private mode or full storage). Your answers will be lost when you close the tab.</p> : null}
      <p className="small muted">
        Progress is saved in this browser only. To move it to another phone or laptop, copy the backup code here and restore it there.
      </p>
      <div className="row-actions">
        <Button onClick={() => void handleCopy()}>{copied ? 'Copied' : 'Copy backup code'}</Button>
        <Button onClick={() => { setPanel('restore'); setMessage(null); }}>Restore from a code</Button>
        <Button variant="link" onClick={() => setPanel('reset')}>
          Reset all progress
        </Button>
      </div>
      {panel === 'show-code' ? (
        <>
          <label className="small muted" htmlFor="backup-code">
            Your browser blocked copying. Select all of this code and copy it yourself.
          </label>
          <textarea id="backup-code" readOnly value={code} onFocus={(e) => e.currentTarget.select()} />
        </>
      ) : null}
      {panel === 'restore' ? (
        <>
          <label className="small" htmlFor="restore-code">
            Paste a backup code. It replaces the progress saved under this name on this device.
          </label>
          <textarea id="restore-code" value={code} onChange={(e) => setCode(e.target.value)} />
          <div className="row-actions">
            <Button variant="primary" disabled={!code.trim()} onClick={handleRestore}>
              Restore
            </Button>
            <Button onClick={() => setPanel('none')}>Cancel</Button>
          </div>
        </>
      ) : null}
      {panel === 'reset' ? (
        <ConfirmBox
          message="Clear all answers and mock history for this name on this device? This cannot be undone."
          confirmLabel="Clear everything"
          onConfirm={() => {
            profileStore.resetAll();
            setPanel('none');
          }}
          onCancel={() => setPanel('none')}
        />
      ) : null}
      {message ? (
        <p className="small" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
