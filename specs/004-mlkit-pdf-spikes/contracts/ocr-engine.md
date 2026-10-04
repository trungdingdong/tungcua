# Contract: OcrEngine Interface (Spike A → M4)

**Feature**: `004-mlkit-pdf-spikes` | **Date**: 2026-10-04

This is the verified interface sketch from Spike A for M4 (OCR core) to implement against. M4 writes tests against this interface first (Test-First, Principle V).

## Types

```typescript
// spikes/INTERFACE_SKETCHES/ocr-engine.ts

export type OcrStatus = 'ok' | 'noText' | 'failed';

export interface Bounds {
  x: number;       // 0-1 normalized, left
  y: number;       // 0-1 normalized, top
  width: number;   // 0-1 normalized
  height: number;  // 0-1 normalized
}

export interface OcrGrapheme {
  char: string;           // single Unicode grapheme cluster
  bounds: Bounds;         // proportional split of parent line/element
  confidence: number;     // 0-1 (same as parent line/element)
}

export interface OcrLine {
  text: string;           // verbatim ML Kit output for this line
  bounds: Bounds;         // normalized 0-1, relative to image
  confidence: number;     // 0-1 (line or element level)
  graphemes: OcrGrapheme[]; // proportional split by Unicode grapheme cluster
}

export interface OcrResult {
  status: OcrStatus;
  lines: OcrLine[];
  processingTimeMs: number;
  error?: string;          // only when status === 'failed'
}

export interface OcrEngine {
  /** Recognize Chinese text in an image file. Returns structured result with lines + graphemes. */
  recognize(imagePath: string): Promise<OcrResult>;

  /** Ensure ML Kit models are available (bundled, not downloaded). Resolves immediately if ready. */
  ensureModelsReady(): Promise<void>;
}
```

## Platform Implementations

| Platform | Implementation | Notes |
|---|---|---|
| iOS | `src/ocr/engine.ios.ts` | Wraps ML Kit via chosen Spike A wrapper (or custom native module) with bundled `zh` model in `.xcframework` |
| Android | `src/ocr/engine.android.ts` | Wraps ML Kit via chosen Spike A wrapper (or custom native module) with bundled `zh` model in AAR |
| Test | `src/ocr/engine.test.ts` | Test double returning fixture `OcrResult` for M4 unit tests |

## Behavior Contract

- **Input**: `imagePath` — absolute or relative path to image file (JPEG/PNG) in app document directory.
- **Output**: `OcrResult` with:
  - `status: 'ok'` — `lines` populated with `text`, `bounds` (0-1), `confidence`, `graphemes[]`
  - `status: 'noText'` — `lines: []`, no error
  - `status: 'failed'` — `error` populated, `lines: []`
- **Models**: Chinese (`zh`) model MUST be bundled in app binary. No runtime download. `ensureModelsReady()` resolves immediately or throws if bundle missing.
- **Reading order**: Lines already sorted by `reading-order.ts` heuristic (top-to-bottom LTR default; vertical right-to-left columns heuristic).
- **Grapheme split**: Each `OcrLine` includes `graphemes[]` derived by Unicode grapheme cluster proportional split of line bounds (for P1 tap targets).
- **Confidence**: ML Kit reports at line/element level. Same confidence assigned to all graphemes in that line/element. Threshold 0.7 applied at display time.
- **Error handling**: Unreadable/corrupt image → `status: 'failed'`, `error` descriptive. Never throws.
- **Performance**: < 2 s/page on target hardware (measured on device, not emulator).
- **Testability**: Interface allows test double injection. `engine.test.ts` returns controlled `OcrResult` fixtures.

## ML Kit Specifics (Constitution L99-110)

- Chinese recognizer loads `zh` model (bundled).
- Returns `Text` → `Text.Block[]` → `Text.Line[]` → `Text.Element[]`.
- Elements are clusters, not single glyphs.
- Confidence per element; threshold 0.7 → pink-ink underline.
- Reading order: ML Kit LTR default; vertical heuristic post-process in `reading-order.ts`.