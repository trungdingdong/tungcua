# Contract: Coordinate & Confidence Conventions (Shared)

**Feature**: `004-mlkit-pdf-spikes` | **Date**: 2026-10-04

These are the shared conventions confirmed by both spikes, used by M4 and M6.

## Coordinate Conventions

```typescript
// spikes/INTERFACE_SKETCHES/conventions.ts

/** All bounds normalized 0-1 relative to source image/page. Origin top-left. */
export interface Bounds {
  x: number;       // 0-1, left
  y: number;       // 0-1, top
  width: number;   // 0-1
  height: number;  // 0-1
}

/** ML Kit confidence is per element (cluster). Threshold 0.7 applied at display. */
export const LOW_CONFIDENCE_THRESHOLD = 0.7;

/** Reading order: default top-to-bottom, left-to-right.
 *  Vertical heuristic: if page aspect > 1.5 AND median element width > height,
 *  sort by right descending (right-to-left columns), then top.
 */
export function computeReadingOrder(lines: OcrLine[], isVertical: boolean): OcrLine[];
```

## Confidence Model

```typescript
// Confirmed by both spikes:
// - ML Kit confidence is per element (cluster), not per glyph
// - Threshold 0.7 applied at display time
// - Graphemes inherit parent element confidence
// - On both Android and iOS, ML Kit reports confidence at element level

export interface OcrGrapheme {
  char: string;
  bounds: Bounds;
  confidence: number;  // inherited from parent element
}
```

## Reading Order

```typescript
// Default: sort by bounds.top (y) then bounds.left (x) → top-to-bottom, left-to-right
// Vertical heuristic: if page aspect ratio > 1.5 AND median element width > height,
// treat as vertical columns; sort by bounds.right descending (right-to-left columns), then bounds.top
```

## Grapheme Splitting

```typescript
// Unicode grapheme clusters via `Intl.Segmenter` (grapheme clusters)
// Proportional bounds allocation: divide parent line bounds by grapheme advance widths
```