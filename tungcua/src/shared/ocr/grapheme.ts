import type { Bounds, OcrGrapheme } from './types';

/**
 * Split text into Unicode grapheme clusters.
 *
 * Uses `Intl.Segmenter` when available (Hermes support varies), and falls back
 * to code-point iteration. Reading order / proportional bounds land in T022.
 */
export function splitGraphemes(text: string): string[] {
  const Segmenter = (
    Intl as unknown as {
      Segmenter?: new (
        locale: string,
        options: { granularity: string },
      ) => { segment(input: string): Iterable<{ segment: string }> };
    }
  ).Segmenter;

  if (Segmenter) {
    const segmenter = new Segmenter('zh', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (entry) => entry.segment);
  }

  return Array.from(text);
}

/**
 * Distribute a line's normalized bounds across its graphemes proportionally by
 * horizontal position. Approximation only; P1 tap targets refine this.
 */
export function splitGraphemeBounds(
  text: string,
  bounds: Bounds,
  confidence: number,
): OcrGrapheme[] {
  const graphemes = splitGraphemes(text);
  const count = graphemes.length;
  if (count === 0) {
    return [];
  }

  const step = bounds.width / count;
  return graphemes.map((char, index) => ({
    char,
    bounds: {
      x: bounds.x + step * index,
      y: bounds.y,
      width: step,
      height: bounds.height,
    },
    confidence,
  }));
}
