import type { PickedAsset } from '../import/types';

export interface PdfInspection {
  pageCount: number;
  hasTextLayer: boolean;
}

/**
 * Stub PDF text-layer detector.
 *
 * The real detector (T023) reads embedded text with pdf.js; the shell reads the
 * mock asset metadata so the text-vs-scanned branch is exercisable.
 */
export function inspectPdf(asset: PickedAsset): PdfInspection {
  return {
    pageCount: asset.pageCount ?? 1,
    hasTextLayer: asset.hasTextLayer ?? false,
  };
}
