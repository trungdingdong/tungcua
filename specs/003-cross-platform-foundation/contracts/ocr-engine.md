# Contract: OcrEngine Interface

**Feature**: `003-cross-platform-foundation` | **Date**: 2026-10-04

## Types

```typescript
// src/shared/ocr/types.ts

export type OcrStatus = 'ok' | 'noText' | 'failed';

export interface OcrGrapheme {
  char: string;                    // single Unicode grapheme cluster
  bounds: Bounds;                  // normalized 0–1, proportional split
  confidence: number;              // 0–1 (same as parent line/element)
}

export interface OcrLine {
  text: string;                    // verbatim ML Kit output
  bounds: Bounds;                  // normalized 0–1
  confidence: number;              // 0–1
  graphemes: OcrGrapheme[];        // proportional split by Unicode grapheme
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrResult {
  status: OcrStatus;
  lines: OcrLine[];
  processingTimeMs: number;
  error?: string;
}
```

## Interface

```typescript
// src/shared/ocr/engine.ts

export interface OcrEngine {
  /** Recognize text in an image file. Returns result with lines + graphemes. */
  recognize(imagePath: string): Promise<OcrResult>;

  /** Ensure ML Kit models are available (bundled, not downloaded). */
  ensureModelsReady(): Promise<void>;
}
```

## Platform Implementations

| Platform | Implementation | Notes |
|---|---|---|
| iOS | `src/shared/ocr/engine.ios.ts` | Wraps ML Kit via Expo native module (bundled `zh` model in `.xcframework`) |
| Android | `src/shared/ocr/engine.android.ts` | Wraps ML Kit via Expo native module (bundled `zh` model in AAR) |
| Test | `src/shared/ocr/engine.test.ts` | Test double returning fixture `OcrResult` |

## Behavior Contract

- **Input**: `imagePath` — absolute or relative path to image file (JPEG/PNG) in app document directory.
- **Output**: `OcrResult` with:
  - `status: 'ok'` — `lines` populated with `text`, `bounds` (0–1), `confidence`, `graphemes[]`
  - `status: 'noText'` — `lines: []`, no error
  - `status: 'failed'` — `error` populated, `lines: []`
- **Models**: Chinese (`zh`) model MUST be bundled in app binary. No runtime download. `ensureModelsReady()` resolves immediately or throws if bundle missing.
- **Reading order**: Lines already sorted by `reading-order.ts` heuristic (top-to-bottom LTR default; vertical right-to-left columns heuristic).
- **Grapheme split**: Each `OcrLine` includes `graphemes[]` derived by Unicode grapheme cluster proportional split of line bounds (for P1 tap targets).
- **Confidence**: ML Kit reports at line/element level. Same confidence assigned to all graphemes in that line/element. Threshold 0.7 applied at display time.
- **Error handling**: Unreadable/corrupt image → `status: 'failed'`, `error` descriptive. Never throws.
- **Performance**: < 2 s/page on target hardware (measured on device, not emulator).
- **Testability**: Interface allows test double injection. `engine.test.ts` returns controlled `OcrResult` fixtures.

## ML Kit Specifics (constitution L99-110)

- Chinese recognizer loads `zh` model (bundled).
- Returns `Text.Element` clusters (not single glyphs).
- Confidence per element; threshold 0.7 → pink-ink underline.
- Reading order: ML Kit LTR default; vertical heuristic post-process in `reading-order.ts`.