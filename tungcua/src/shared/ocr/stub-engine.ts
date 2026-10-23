import type { OcrEngine } from './engine';
import { SAMPLE_OCR_LINES } from './fixtures';
import type { OcrResult } from './types';

export interface StubOcrEngineOptions {
  /** Lines returned for a normal ('ok') page. */
  lines?: OcrResult['lines'];
  /** Simulated latency in ms (0 by default so tests stay fast). */
  delayMs?: number;
}

/**
 * Deterministic in-memory `OcrEngine` used by the UI shell.
 *
 * Replaces the real ML Kit wrapper until prebuild lands. Paths containing
 * `blank` return `noText`; paths containing `fail` return `failed`, so the
 * error/no-text states are demonstrable without native code.
 */
export function createStubOcrEngine(options: StubOcrEngineOptions = {}): OcrEngine {
  const lines = options.lines ?? SAMPLE_OCR_LINES;
  const delayMs = options.delayMs ?? 0;

  return {
    async ensureModelsReady(): Promise<void> {
      return;
    },
    async recognize(imagePath: string): Promise<OcrResult> {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      if (imagePath.includes('fail')) {
        return {
          status: 'failed',
          lines: [],
          processingTimeMs: 12,
          error: 'Image could not be read.',
        };
      }

      if (imagePath.includes('blank')) {
        return { status: 'noText', lines: [], processingTimeMs: 8 };
      }

      return { status: 'ok', lines, processingTimeMs: 137 };
    },
  };
}
