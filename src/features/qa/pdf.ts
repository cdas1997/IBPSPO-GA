/** Must match the file names written by scripts/build_pdfs.py. */
export function pdfHref(categoryKey: string | null): string {
  return `./pdf/po-mains-ga-qa-${categoryKey ?? 'all'}.pdf`;
}

/** The name the viewer's saved file gets. */
export function pdfFilename(categoryName: string | null): string {
  const label = (categoryName ?? 'All categories').replace(/&/g, 'and').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
  return `PO Mains GA Q and A - ${label}.pdf`;
}
