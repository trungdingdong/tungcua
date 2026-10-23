import { describe, expect, it } from '@jest/globals';
import { splitGraphemeBounds, splitGraphemes } from '../../src/shared/ocr/grapheme';
import { inspectPdf } from '../../src/shared/pdf/detector';
import { makePdfAsset } from '../../src/shared/import/mock-picker';

describe('splitGraphemes', () => {
  it('splits Chinese text into single characters', () => {
    expect(splitGraphemes('山水之間')).toEqual(['山', '水', '之', '間']);
  });
});

describe('splitGraphemeBounds', () => {
  it('distributes bounds proportionally across the line', () => {
    const graphemes = splitGraphemeBounds(
      '山水',
      { x: 0.1, y: 0.2, width: 0.8, height: 0.1 },
      0.9,
    );

    expect(graphemes).toHaveLength(2);
    expect(graphemes[0].bounds.x).toBeCloseTo(0.1);
    expect(graphemes[1].bounds.x).toBeCloseTo(0.5);
    expect(graphemes[0].bounds.width).toBeCloseTo(0.4);
    expect(graphemes.every((entry) => entry.confidence === 0.9)).toBe(true);
  });
});

describe('inspectPdf', () => {
  it('reports page count and text layer from the asset', () => {
    expect(inspectPdf(makePdfAsset({ pageCount: 3, hasTextLayer: true }))).toEqual({
      pageCount: 3,
      hasTextLayer: true,
    });
    expect(inspectPdf(makePdfAsset({ pageCount: 25, hasTextLayer: false }))).toEqual({
      pageCount: 25,
      hasTextLayer: false,
    });
  });
});
