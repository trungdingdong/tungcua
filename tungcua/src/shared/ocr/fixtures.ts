import { splitGraphemeBounds } from './grapheme';
import type { Bounds, OcrLine } from './types';

/** Low-confidence threshold from the constitution (0.7). */
export const LOW_CONFIDENCE_THRESHOLD = 0.7;

interface LineSpec {
  text: string;
  y: number;
  height: number;
  confidence: number;
}

const LINE_SPECS: LineSpec[] = [
  { text: '山水之間', y: 0.08, height: 0.06, confidence: 0.98 },
  { text: '有朋自遠方來', y: 0.18, height: 0.06, confidence: 0.96 },
  { text: '不亦樂乎', y: 0.28, height: 0.06, confidence: 0.62 },
];

function toLine(spec: LineSpec): OcrLine {
  const bounds: Bounds = { x: 0.08, y: spec.y, width: 0.84, height: spec.height };
  return {
    text: spec.text,
    bounds,
    confidence: spec.confidence,
    graphemes: splitGraphemeBounds(spec.text, bounds, spec.confidence),
  };
}

/** Deterministic recognized lines used by the stub engine and tests. */
export const SAMPLE_OCR_LINES: OcrLine[] = LINE_SPECS.map(toLine);

/** Concatenated sample text (mirrors ML Kit `result.text`). */
export const SAMPLE_OCR_TEXT = SAMPLE_OCR_LINES.map((line) => line.text).join('\n');
