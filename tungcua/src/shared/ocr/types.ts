/**
 * OCR result types — verbatim from specs/003-cross-platform-foundation/contracts/ocr-engine.md.
 *
 * These are the shared, spike-proven shapes. The real ML Kit wrapper (spike A
 * winner `@react-native-ml-kit/text-recognition`) plugs in behind `OcrEngine`;
 * the shell ships with a deterministic stub instead.
 */

export type OcrStatus = 'ok' | 'noText' | 'failed';

/** Normalized bounds, 0-1, top-left origin. */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrGrapheme {
  /** Single Unicode grapheme cluster. */
  char: string;
  /** Normalized 0-1, proportional split of the parent line bounds. */
  bounds: Bounds;
  /** 0-1; same as the parent line/element. */
  confidence: number;
}

export interface OcrLine {
  /** Verbatim ML Kit output. */
  text: string;
  /** Normalized 0-1. */
  bounds: Bounds;
  /** 0-1. */
  confidence: number;
  graphemes: OcrGrapheme[];
}

export interface OcrResult {
  status: OcrStatus;
  lines: OcrLine[];
  processingTimeMs: number;
  error?: string;
}
