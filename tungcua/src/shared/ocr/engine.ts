import type { OcrResult } from './types';

/**
 * Contract: specs/003-cross-platform-foundation/contracts/ocr-engine.md
 *
 * The shell depends only on this interface, so the real ML Kit implementation
 * (or a test double) can be injected without touching call sites.
 */
export interface OcrEngine {
  /** Recognize text in an image file. Returns lines + graphemes. */
  recognize(imagePath: string): Promise<OcrResult>;

  /** Ensure ML Kit models are available (bundled, not downloaded). */
  ensureModelsReady(): Promise<void>;
}
