# Contract: PDF Page Renderer (Spike B → M6)

**Feature**: `004-mlkit-pdf-spikes` | **Date**: 2026-10-04

This is the verified interface sketch from Spike B for M6 (PDF pipeline) to implement against.

## Types

```typescript
// spikes/INTERFACE_SKETCHES/pdf-renderer.ts

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfRenderer {
  /** Render a PDF page to an image file at exactly 300 DPI (scale = 300/72 ≈ 4.17x). Returns image file path. */
  renderPageToImage(pdfPath: string, pageIndex: number, dpi: number): Promise<string>;

  /** Render a PDF page to raw image data at exactly 300 DPI. Returns Uint8Array. */
  renderPageToImageData(pdfPath: string, pageIndex: number, dpi: number): Promise<Uint8Array>;
}
```

## Platform Implementations

| Platform | Implementation | Notes |
|---|---|---|
| iOS | `src/pdf/renderer.ios.ts` | PDFKit `PDFPage` → `CGContext` draw at 300 DPI |
| Android | `src/pdf/renderer.android.ts` | `PdfRenderer` → `Bitmap` at 300 DPI |
| Test | `src/pdf/renderer.test.ts` | Test double for M6 unit tests |

## Behavior Contract

### renderPageToImage
- **Input**: `pdfPath` (absolute or relative path to PDF file), `pageIndex` (zero-based), `dpi` (target DPI, use 300 for ML Kit input).
- **Output**: Image file path (JPEG 85% quality or PNG) at target DPI.
- **Scale**: 300/72 ≈ 4.17x PDF points to pixels.
- **Format**: JPEG 85% quality or PNG; ≤ 20 MB per page (validated).
- **Sequential only**: Caller renders pages sequentially to bound memory.

## PDF Specifics (Constitution L111-114)

- Text layer first: `detectTextLayer()` before rendering.
- Render at exactly 300 DPI (scale = 300/72 ≈ 4.17x).
- Cap: 20 pages per document, 20 MB per page image.
- Mixed PDFs: Per-page decision (text layer vs render+OCR).
- Encrypted/corrupted/zero-page: Distinct user-readable errors, no crashes.