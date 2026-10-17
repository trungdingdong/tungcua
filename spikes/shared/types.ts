/**
 * CANONICAL SOURCE: spikes/shared/types.ts
 *
 * Shared spike harness types (Spike A + Spike B), mirroring specs/004-mlkit-pdf-spikes/data-model.md.
 *
 * Windows compatibility: do NOT use symlinks. Copy this file verbatim to:
 *   - spikes/spike-a/src/shared/types.ts
 *   - spikes/spike-b/src/shared/types.ts
 * Keep all copies in sync.
 */

export interface Bounds {
  /** 0-1, left */
  x: number;
  /** 0-1, top */
  y: number;
  /** 0-1 */
  width: number;
  /** 0-1 */
  height: number;
}

export interface OcrElement {
  text: string;
  bounds: Bounds;
  /** 0-1, element (cluster) level */
  confidence: number;
}

export interface OcrGrapheme {
  char: string;
  bounds: Bounds;
  /** inherited from parent element/line */
  confidence: number;
}

export interface OcrLine {
  text: string;
  bounds: Bounds;
  /** 0-1 */
  confidence: number;
  elements?: OcrElement[];
  graphemes?: OcrGrapheme[];
}

export type SpikeAPlatform = 'android' | 'ios';

export type SpikeATier =
  | 'printed-simplified'
  | 'printed-traditional'
  | 'mixed-latin'
  | 'vertical-traditional'
  | 'handwriting'
  | 'blank'
  | 'non-chinese'
  | 'large-20mb'
  | 'corrupted';

export type SpikeAExpectedBehavior = 'ocr' | 'no-text' | 'error';

export interface SpikeACorpusEntry {
  /** e.g., "printed-simplified-01.jpg" */
  filename: string;
  tier: SpikeATier;
  /** relative to corpus root (or absolute) */
  imagePath: string;
  /** expected recognized text */
  groundTruthText: string;
  expectedBehavior: SpikeAExpectedBehavior;
  /** for large-20mb tier */
  maxDimension?: number;
}

export interface SpikeACorpusManifest {
  version: string;
  thresholds: {
    /** gate */
    printedAccuracy: number;
    /** warm per-page limit */
    warmTimeMs: number;
  };
  entries: SpikeACorpusEntry[];
}

export type SpikeAStatus = 'ok' | 'no-text' | 'failed';

export interface SpikeAResult {
  filename: string;
  /** wrapper name evaluated */
  candidate: string;
  platform: SpikeAPlatform;
  recognizedText: string;
  lines: OcrLine[];
  /** cold or warm */
  processingTimeMs: number;
  isColdStart: boolean;
  memoryPeakMb?: number;
  status: SpikeAStatus;
  error?: string;
}

export interface SpikeASummary {
  candidate: string;
  platform: SpikeAPlatform;
  /** character accuracy on printed tier */
  printedAccuracy: number;
  /** median warm time */
  warmTimeMs: number;
  /** median cold time */
  coldTimeMs: number;
  /** airplane mode success */
  modelBundledVerified: boolean;
  /** delta vs base */
  appSizeDeltaMb: number;
  /** documented */
  coordinateConvention: string;
  confidenceGranularity: 'line' | 'element' | 'both';
  goNoGo: 'go' | 'no-go';
  notes: string;
}

export type SpikeBType =
  | 'text-simplified'
  | 'text-traditional'
  | 'scanned'
  | 'mixed'
  | '20-page'
  | '25-page'
  | 'large-pages'
  | 'password-protected'
  | 'corrupted'
  | 'garbage-text-layer';

export type SpikeBExpectedBehavior =
  | 'text-layer'
  | 'render-ocr'
  | 'refuse'
  | 'error';

export interface SpikeBCorpusEntry {
  /** e.g., "text-simplified-3page.pdf" */
  filename: string;
  type: SpikeBType;
  /** relative to corpus root (or absolute) */
  pdfPath: string;
  pageCount?: number;
  /** expected */
  hasTextLayer?: boolean;
  /** expected text per page (for text-layer PDFs) */
  groundTruthTextPerPage?: string[];
  expectedBehavior: SpikeBExpectedBehavior;
  /** for password-protected */
  password?: string;
}

export interface SpikeBCorpusManifest {
  version: string;
  entries: SpikeBCorpusEntry[];
}

export type SpikeBStatus = 'ok' | 'refused' | 'failed';
export type SpikeBPageStatus = 'text-layer' | 'rendered' | 'failed';

export interface SpikeBPageResult {
  pageIndex: number;
  hasTextLayer: boolean;
  /** if text layer used */
  extractedText?: string;
  /** vs ground truth */
  extractedTextAccuracy?: number;
  /** if rendered */
  renderedImagePath?: string;
  renderTimeMs: number;
  imageDimensions: { width: number; height: number };
  imageSizeBytes: number;
  status: SpikeBPageStatus;
  error?: string;
}

export interface SpikeBResult {
  filename: string;
  /** PDF approach evaluated */
  candidate: string;
  platform: SpikeAPlatform;
  pageCount: number;
  pages: SpikeBPageResult[];
  totalRenderTimeMs: number;
  peakMemoryMb?: number;
  status: SpikeBStatus;
  error?: string;
}

export interface SpikeBSummary {
  candidate: string;
  platform: SpikeAPlatform;
  /** on text PDFs */
  textLayerDetectionAccuracy: number;
  /** vs ground truth */
  textExtractionAccuracy: number;
  /** per page */
  avgRenderTimeMs: number;
  /** over 20 pages */
  maxMemoryMb: number;
  /** no crash/OOM */
  twentyPageOk: boolean;
  /** distinct error */
  twentyFivePageRefused: boolean;
  /** distinct error */
  encryptedHandled: boolean;
  /** distinct error */
  corruptedHandled: boolean;
  goNoGo: 'go' | 'no-go';
  notes: string;
}

export interface EndToEndPageResult {
  pageIndex: number;
  renderTimeMs: number;
  ocrTimeMs: number;
  recognizedText: string;
  lines: OcrLine[];
  accuracyVsGroundTruth: number;
}

export interface EndToEndResult {
  pdfFilename: string;
  platform: SpikeAPlatform;
  totalTimeMs: number;
  pages: EndToEndPageResult[];
  airplaneModeVerified: boolean;
}
