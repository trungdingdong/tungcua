import { describe, expect, it } from '@jest/globals';
import { LOW_CONFIDENCE_THRESHOLD } from '../../src/shared/ocr/fixtures';
import { createStubOcrEngine } from '../../src/shared/ocr/stub-engine';

describe('createStubOcrEngine', () => {
  const engine = createStubOcrEngine();

  it('returns recognized lines with graphemes for a normal page', async () => {
    const result = await engine.recognize('mock://scan/page-1.jpg');
    expect(result.status).toBe('ok');
    expect(result.lines.length).toBeGreaterThan(0);
    expect(result.lines[0].graphemes.length).toBeGreaterThan(0);
  });

  it('flags low-confidence lines below the threshold', async () => {
    const result = await engine.recognize('mock://scan/page-1.jpg');
    expect(result.lines.some((line) => line.confidence < LOW_CONFIDENCE_THRESHOLD)).toBe(true);
  });

  it('returns noText for blank pages', async () => {
    const result = await engine.recognize('mock://scan/blank.jpg');
    expect(result).toMatchObject({ status: 'noText', lines: [] });
  });

  it('returns failed with an error for unreadable pages', async () => {
    const result = await engine.recognize('mock://scan/fail.jpg');
    expect(result.status).toBe('failed');
    expect(result.error).toBeTruthy();
  });
});
