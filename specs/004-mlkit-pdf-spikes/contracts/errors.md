# Contract: Error Types (Shared)

**Feature**: `004-mlkit-pdf-spikes` | **Date**: 2026-10-04

Shared error types used by both spikes and M4/M6.

## Error Types

```typescript
// spikes/INTERFACE_SKETCHES/errors.ts

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

## Error Message Templates

| Code | Message Template | Recoverable |
|------|------------------|-------------|
| `MODEL_NOT_BUNDLED` | "ML Kit Chinese model not found in app bundle. Please reinstall the app." | false |
| `IMAGE_UNREADABLE` | "Unable to read image file. The file may be corrupted or in an unsupported format." | true |
| `PDF_PASSWORD_PROTECTED` | "Password-protected PDFs are not supported. Please provide an unprotected PDF." | false |
| `PDF_CORRUPTED` | "The PDF file appears to be corrupted or unreadable." | false |
| `PDF_ZERO_PAGES` | "The PDF file contains no pages." | false |
| `PDF_OVER_CAP` | "PDF has {N} pages; maximum is 20." | false |
| `PDF_PAGE_TOO_LARGE` | "Page {N} exceeds 20 MB limit after rendering. Try a lower resolution source." | false |
| `PDF_RENDER_OOM` | "Out of memory while rendering page {N}. Try a smaller page or close other apps." | true |
| `NETWORK_NOT_ALLOWED` | "Network access is not permitted. Please check your connection settings." | false |

## Usage

```typescript
// In M4/M6 implementations:
throw new SpikeError(SpikeErrorCodes.PDF_PASSWORD_PROTECTED, 
  "Password-protected PDFs are not supported. Please provide an unprotected PDF.", 
  false);
```