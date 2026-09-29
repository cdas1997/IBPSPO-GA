import { useState } from 'react';
import { errorCode, type DownloadsCapability } from '@/services/claudeHost';
import { pdfFilename, pdfHref } from './pdf';
import type { SaveTarget } from './useSaveTarget';

class PdfLoadError extends Error {
  readonly code = 'pdf_load_failed';
}

const MESSAGES: Record<string, string> = {
  declined: 'Export cancelled.',
  rate_limited: 'A save prompt is already open. Finish it, then try again.',
  pdf_load_failed: 'The PDF could not be loaded. Check your connection and try again.',
};
const FALLBACK = 'This view cannot save files. Open the site in a web browser to export the PDF.';

async function loadPdf(href: string): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(href);
  } catch {
    throw new PdfLoadError('network');
  }
  if (!res.ok) throw new PdfLoadError(`HTTP ${res.status}`);
  return res.blob();
}

type ExportPdfProps = {
  categoryKey: string | null;
  categoryName: string | null;
  appearance: 'button' | 'link';
  target: SaveTarget;
};

export function ExportPdf({ categoryKey, categoryName, appearance, target }: ExportPdfProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const href = pdfHref(categoryKey);
  const filename = pdfFilename(categoryName);
  const label = appearance === 'button' ? 'Export as PDF' : 'Export this category as PDF';
  const className = appearance === 'button' ? 'btn btn-primary' : 'textlink';
  const srName = appearance === 'link' && categoryName ? <span className="sr-only"> ({categoryName})</span> : null;

  if (target.kind === 'link') {
    return (
      <a className={className} href={href} download={filename}>
        {label}
        {srName}
      </a>
    );
  }
  if (target.kind === 'none') {
    return appearance === 'button' ? <p className="small muted qa-nodl">{FALLBACK}</p> : null;
  }

  async function handleSave(downloads: DownloadsCapability): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      const result = await downloads.save({ filename, data: await loadPdf(href) });
      setMessage(result.status === 'saved' ? 'Saved.' : null);
    } catch (err) {
      setMessage(MESSAGES[errorCode(err)] ?? FALLBACK);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="export">
      <button
        type="button"
        className={className}
        disabled={target.kind === 'checking' || busy}
        onClick={() => {
          if (target.kind === 'viewer') void handleSave(target.downloads);
        }}
      >
        {busy ? 'Preparing PDF…' : label}
        {srName}
      </button>
      {message ? (
        <span className="small muted" role="status">
          {message}
        </span>
      ) : null}
    </span>
  );
}
