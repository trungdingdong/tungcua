# Contract: PDF Pipeline (Spike B → M6)

**Feature**: `004-mlkit-pdf-spikes` | **Date**: 2026-10-04

This is the verified interface sketch from Spike B for M6 (PDF pipeline) to implement against. M6 writes tests against this interface first (Test-First, Principle V).

## Types

```typescript
// spikes/INTERFACE_SKETCHES/pdf-pipeline.ts

export type PdfPageStatus = 'text-layer' | 'rendered' | 'failed';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfTextLayerInfo {
  hasTextLayer: boolean;
  text?: string;              // extracted text if layer exists and usable
  readingOrder?: Bounds[];    // per-char/word bounds if available
}

export interface PdfPageResult {
  pageIndex: number;
  usedTextLayer: boolean;     // true if text layer extracted, false if rendered+OCR
  text: string;               // final text (from text layer or OCR)
  lines: OcrLine[];           // OCR lines if rendered, empty if text layer only
  renderTimeMs?: number;      // if rendered
  ocrTimeMs?: number;         // if OCR ran
  imagePath?: string;         // rendered image path (if rendered)
  status: PdfPageStatus;
  error?: string;
}

export interface PdfProcessResult {
  pages: PdfPageResult[];
  totalPages: number;
  totalTimeMs: number;
}
```

## Interfaces

```typescript
// spikes/INTERFACE_SKETCHES/pdf-detector.ts
export interface PdfDetector {
  /** Detect if a PDF page has a usable embedded text layer. Returns text + reading order if usable. */
  detectTextLayer(pdfPath: string, pageIndex: number): Promise<PdfTextLayerInfo>;

  /** Get total page count without rendering. */
  getPageCount(pdfPath: string): Promise<number>;
}

// spikes/INTERFACE_SKETCHES/pdf-renderer.ts
export interface PdfRenderer {
  /** Render a PDF page to an image file at ~300 dpi equivalent. Returns image file path. */
  renderPageToImage(pdfPath: string, pageIndex: number, dpi: number): Promise<string>;

  /** Render a PDF page to raw image data at ~300 dpi equivalent. Returns Uint8Array. */
  renderPageToImageData(pdfPath: string, pageIndex: number, dpi: number): Promise<Uint8Array>;
}

// spikes/INTERFACE_SKETCHES/pdf-pipeline.ts
export interface PdfPipeline {
  /**
   * Process a PDF end-to-end: for each page, detect text layer first;
   * if usable, extract text; otherwise render at ~300 dpi and run OCR.
   * Returns structured per-page results.
   */
  processPdf(pdfPath: string, ocrEngine: OcrEngine): Promise<PdfProcessResult>;
}
```

## Platform Implementations

| Platform | Implementation | Notes |
|---|---|---|
| iOS | `src/pdf/detector.ios.ts`, `src/pdf/renderer.ios.ts` | PDFKit for detection + rendering; text extraction via `PDFPage.string` |
| Android | `src/pdf/detector.android.ts`, `src/pdf/renderer.android.ts` | `PdfRenderer` for rendering; text extraction via `PdfTextExtractor` (custom) or `pdfjs-dist` |
| Test | `src/pdf/detector.test.ts`, `src/pdf/renderer.test.ts` | Test doubles for M6 unit tests |

## Behavior Contract

### PdfDetector
- **Input**: `pdfPath` — absolute or relative path to PDF file in app document directory; `pageIndex` — zero-based.
- **Output**: `PdfTextLayerInfo`:
  - `hasTextLayer: true` + `text` + `readingOrder` if PDF page has selectable text that's non-empty and passes "usable text layer" heuristic.
  - `hasTextLayer: false` if no text layer, empty, garbage, or wrong reading order.
- **Heuristic for "usable text layer"**: Extracted text length > 10 chars AND not mostly whitespace/symbols AND reading order plausible (left-to-right or right-to-left consistent). Documented in implementation.
- **Page count**: `getPageCount()` returns total pages without rendering; used to enforce 20-page cap before heavy work.

### PdfRenderer
- **Input**: `pdfPath`, `pageIndex`, `dpi` (target ~300 dpi equivalent).
- **Output**: Image file path (JPEG/PNG) or `Uint8Array` at target DPI.
- **Scale**: `300/72 ≈ 4.17x` PDF points to pixels.
- **Format**: JPEG 85% quality or PNG; ≤ 20 MB per page (validated).
- **Sequential only**: Caller renders pages sequentially to bound memory.

### PdfPipeline (High-Level)
- **Input**: `pdfPath`, `ocrEngine` (for pages needing OCR).
- **Algorithm**:
  1. `getPageCount()` → if > 20, throw "PDF has N pages; maximum is 20".
  2. For each page 0..count-1:
     a. `detectTextLayer(pdfPath, pageIndex)`
     b. If `hasTextLayer` AND heuristic passes → `usedTextLayer: true`, extract text, `lines: []`
     c. Else → `renderPageToImage()` → `ocrEngine.recognize(imagePath)` → `usedTextLayer: false`, populate `lines`
     d. Handle errors per page: `status: 'failed'`, continue other pages
  3. Return `PdfProcessResult` with all pages.
- **Error handling**: Password-protected → `error: "Password-protected PDF not supported"`; Corrupted → `error: "Corrupted or unreadable PDF"`; Zero pages → `error: "PDF has no pages"`; Render OOM → `error: "Page too large to render"`.

## PDF Specifics (Constitution L111-114)

- Text layer first: `detectTextLayer()` before rendering.
- Render at ~300 dpi equivalent (scale = 300/72 ≈ 4.17x).
- Cap: 20 pages per document, 20 MB per page image.
- Mixed PDFs: Per-page decision (text layer vs render+OCR).
- Encrypted/corrupted/zero-page: Distinct user-readable errors, no crashes.