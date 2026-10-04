# Contract: PDF Text-Layer Detector (Spike B → M6)

**Feature**: `004-mlkit-pdf-spikes` | **Date**: 2026-10-04

This is the verified interface sketch from Spike B for M6 (PDF pipeline) to implement against.

## Types

```typescript
// spikes/INTERFACE_SKETCHES/pdf-detector.ts

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

export interface PdfDetector {
  /** Detect if a PDF page has a usable embedded text layer. Returns text + reading order if usable. */
  detectTextLayer(pdfPath: string, pageIndex: number): Promise<PdfTextLayerInfo>;

  /** Get total page count without rendering. */
  getPageCount(pdfPath: string): Promise<number>;
}
```

## Platform Implementations

| Platform | Implementation | Notes |
|---|---|---|
| iOS | `src/pdf/detector.ios.ts` | PDFKit for detection; text extraction via `PDFPage.string` |
| Android | `src/pdf/detector.android.ts` | `PdfRenderer` for rendering; text extraction via `pdfjs-dist` or native text extractor |
| Test | `src/pdf/detector.test.ts` | Test double for M6 unit tests |

## Behavior Contract

### detectTextLayer
- **Input**: `pdfPath` — absolute or relative path to PDF file in app document directory; `pageIndex` — zero-based.
- **Output**: `PdfTextLayerInfo`:
  - `hasTextLayer: true` + `text` + `readingOrder` if PDF page has selectable text that's non-empty and passes "usable text layer" heuristic.
  - `hasTextLayer: false` if no text layer, empty, garbage, or wrong reading order.
- **Heuristic for "usable text layer"**: Extracted text length > 10 chars, not mostly whitespace/symbols, reading order plausible (left-to-right or right-to-left consistent). Documented in implementation.
- **Page count**: `getPageCount()` returns total pages without rendering; used to enforce 20-page cap before heavy work.