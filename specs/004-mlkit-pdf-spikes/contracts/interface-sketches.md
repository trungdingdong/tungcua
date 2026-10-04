# Verified Interface Sketches (Spike A + B → M4/M6)

**Feature**: `004-mlkit-pdf-spikes` | **Date**: 2026-10-04

These are the verified TypeScript interfaces produced by Spike A and Spike B. M4 and M6 MUST write tests against these interfaces first (Test-First, Principle V). Copy to `src/shared/` when M4/M6 begin.

---

## OCR Engine (Spike A → M4)

```typescript
// src/shared/ocr/types.ts

export type OcrStatus = 'ok' | 'noText' | 'failed';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrGrapheme {
  char: string;
  bounds: Bounds;
  confidence: number;
}

export interface OcrLine {
  text: string;
  bounds: Bounds;
  confidence: number;
  graphemes: OcrGrapheme[];
}

export interface OcrResult {
  status: OcrStatus;
  lines: OcrLine[];
  processingTimeMs: number;
  error?: string;
}

export interface OcrEngine {
  recognize(imagePath: string): Promise<OcrResult>;
  ensureModelsReady(): Promise<void>;
}
```

**Confirmed by Spike A**:
- ML Kit returns `Text.Element` clusters (not glyphs) → proportional grapheme split
- Confidence at element level → threshold 0.7 applied at display
- Bounds normalized 0-1, origin top-left, orientation corrected
- `ensureModelsReady()` resolves immediately (bundled model) or throws

---

## PDF Pipeline (Spike B → M6)

```typescript
// src/shared/pdf/types.ts

export type PdfPageStatus = 'text-layer' | 'rendered' | 'failed';

export interface PdfTextLayerInfo {
  hasTextLayer: boolean;
  text?: string;
  readingOrder?: Bounds[];
}

export interface PdfPageResult {
  pageIndex: number;
  usedTextLayer: boolean;
  text: string;
  lines: OcrLine[];          // from shared ocr types
  renderTimeMs?: number;
  ocrTimeMs?: number;
  imagePath?: string;
  status: PdfPageStatus;
  error?: string;
}

export interface PdfProcessResult {
  pages: PdfPageResult[];
  totalPages: number;
  totalTimeMs: number;
}

export interface PdfDetector {
  detectTextLayer(pdfPath: string, pageIndex: number): Promise<PdfTextLayerInfo>;
  getPageCount(pdfPath: string): Promise<number>;
}

export interface PdfRenderer {
  renderPageToImage(pdfPath: string, pageIndex: number, dpi: number): Promise<string>;
  renderPageToImageData(pdfPath: string, pageIndex: number, dpi: number): Promise<Uint8Array>;
}

export interface PdfPipeline {
  processPdf(pdfPath: string, ocrEngine: OcrEngine): Promise<PdfProcessResult>;
}
```

**Confirmed by Spike B**:
- `detectTextLayer()` returns `hasTextLayer: true` + text + readingOrder if usable
- Heuristic: text length > 10, not mostly whitespace, plausible reading order
- `renderPageToImage()` at 300 dpi (scale 300/72 ≈ 4.17x), JPEG 85% quality
- `PdfPipeline.processPdf()`: per-page text-layer-first, cap 20 pages, sequential render
- Errors: password-protected, corrupted, zero-page, OOM → distinct messages

---

## Coordinate & Confidence Conventions (Shared)

```typescript
// src/shared/conventions.ts

/** All bounds normalized 0-1 relative to source image/page. Origin top-left. */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** ML Kit confidence is per element (cluster). Threshold 0.7 applied at display. */
export const LOW_CONFIDENCE_THRESHOLD = 0.7;

/** Reading order: default top-to-bottom, left-to-right.
 *  Vertical heuristic: if page aspect > 1.5 AND median element width > height,
 *  sort by right descending (right-to-left columns), then top.
 */
export function computeReadingOrder(lines: OcrLine[], isVertical: boolean): OcrLine[];
```

**Confirmed by both spikes**:
- Bounds always 0-1 normalized, orientation-corrected
- Confidence at ML Kit element level; graphemes inherit parent confidence
- Vertical heuristic documented; results flagged best-effort

---

## Error Types (Shared)

```typescript
// src/shared/errors.ts

export class SpikeError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly recoverable: boolean = false
  ) {
    super(message);
    this.name = 'SpikeError';
  }
}

export const SpikeErrorCodes = {
  MODEL_NOT_BUNDLED: 'MODEL_NOT_BUNDLED',
  IMAGE_UNREADABLE: 'IMAGE_UNREADABLE',
  PDF_PASSWORD_PROTECTED: 'PDF_PASSWORD_PROTECTED',
  PDF_CORRUPTED: 'PDF_CORRUPTED',
  PDF_ZERO_PAGES: 'PDF_ZERO_PAGES',
  PDF_OVER_CAP: 'PDF_OVER_CAP',
  PDF_PAGE_TOO_LARGE: 'PDF_PAGE_TOO_LARGE',
  PDF_RENDER_OOM: 'PDF_RENDER_OOM',
  NETWORK_NOT_ALLOWED: 'NETWORK_NOT_ALLOWED',
} as const;
```

---

## Usage in M4/M6 (Test-First)

```typescript
// M4: src/ocr/__tests__/engine.test.ts
import { OcrEngine, OcrResult } from '@/shared/ocr/types';

// Test double for M4 unit tests
export const createMockOcrEngine = (fixture: OcrResult): OcrEngine => ({
  recognize: jest.fn().mockResolvedValue(fixture),
  ensureModelsReady: jest.fn().mockResolvedValue(undefined),
});

// M4: src/ocr/engine.ts — implements OcrEngine using chosen Spike A wrapper

// M6: src/pdf/__tests__/pipeline.test.ts
import { PdfPipeline, PdfProcessResult } from '@/shared/pdf/types';
import { createMockOcrEngine } from '@/shared/ocr/__tests__/engine.test';

// M6: src/pdf/pipeline.ts — implements PdfPipeline using chosen Spike B detector/renderer
```

---

## Spike Decision Records → M4/M6 Consumption

| Artifact | Location | Purpose |
|---|---|---|
| Spike A Decision | `spikes/DECISION_RECORDS/spike-a-decision.md` | Chosen wrapper, config plugin, native module design, risks |
| Spike B Decision | `spikes/DECISION_RECORDS/spike-b-decision.md` | Chosen PDF approach, config plugin, native module design, risks |
| Interface Sketches | `spikes/INTERFACE_SKETCHES/*.ts` | Copy to `src/shared/` for M4/M6 test-first |
| Corpus Manifests | `assets/spike-corpus/spike-a/manifest.json`, `spike-b/manifest.json` | Ground truth for accuracy validation in M4/M6 tests |