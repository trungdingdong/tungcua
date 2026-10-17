/**
 * CANONICAL SOURCE: spikes/shared/validators.ts
 *
 * Manual (dependency-free) schema validators for spike harness result types.
 * Mirrors specs/004-mlkit-pdf-spikes/data-model.md — bounds normalized 0-1
 * (origin top-left), confidence 0-1.
 *
 * Windows compatibility: do NOT use symlinks. Copy this file verbatim to:
 *   - spikes/spike-a/src/shared/validators.ts
 *   - spikes/spike-b/src/shared/validators.ts
 * Keep all copies in sync (they import the sibling ./types copy).
 */

import type { Bounds } from './types';

export interface SchemaValidation {
  valid: boolean;
  errors: string[];
}

type Record_ = Record<string, unknown>;

function isRecord(value: unknown): value is Record_ {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInRange(value: unknown, min: number, max: number): boolean {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

const PLATFORMS = ['android', 'ios'] as const;
const SPIKE_A_STATUSES = ['ok', 'no-text', 'failed'] as const;
const SPIKE_B_STATUSES = ['ok', 'refused', 'failed'] as const;
const SPIKE_B_PAGE_STATUSES = ['text-layer', 'rendered', 'failed'] as const;

function validateBounds(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  const keys: Array<keyof Bounds> = ['x', 'y', 'width', 'height'];
  for (const key of keys) {
    if (!isInRange(value[key], 0, 1)) {
      errors.push(`${path}.${key} must be a number between 0 and 1`);
    }
  }
}

function validateConfidence(value: unknown, path: string, errors: string[]): void {
  if (!isInRange(value, 0, 1)) {
    errors.push(`${path}.confidence must be a number between 0 and 1`);
  }
}

function validateElement(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (typeof value.text !== 'string') {
    errors.push(`${path}.text must be a string`);
  }
  validateBounds(value.bounds, `${path}.bounds`, errors);
  validateConfidence(value.confidence, path, errors);
}

function validateGrapheme(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (typeof value.char !== 'string') {
    errors.push(`${path}.char must be a string`);
  }
  validateBounds(value.bounds, `${path}.bounds`, errors);
  validateConfidence(value.confidence, path, errors);
}

function validateLine(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (typeof value.text !== 'string') {
    errors.push(`${path}.text must be a string`);
  }
  validateBounds(value.bounds, `${path}.bounds`, errors);
  validateConfidence(value.confidence, path, errors);

  if (value.elements !== undefined) {
    if (!Array.isArray(value.elements)) {
      errors.push(`${path}.elements must be an array`);
    } else {
      value.elements.forEach((element: unknown, index: number) => {
        validateElement(element, `${path}.elements[${index}]`, errors);
      });
    }
  }

  if (value.graphemes !== undefined) {
    if (!Array.isArray(value.graphemes)) {
      errors.push(`${path}.graphemes must be an array`);
    } else {
      value.graphemes.forEach((grapheme: unknown, index: number) => {
        validateGrapheme(grapheme, `${path}.graphemes[${index}]`, errors);
      });
    }
  }
}

function validateOcrLines(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }
  value.forEach((line: unknown, index: number) => {
    validateLine(line, `${path}[${index}]`, errors);
  });
}

export function validateSpikeAResult(value: unknown): SchemaValidation {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ['result must be an object'] };
  }
  if (typeof value.filename !== 'string') {
    errors.push('filename must be a string');
  }
  if (typeof value.candidate !== 'string') {
    errors.push('candidate must be a string');
  }
  if (!isOneOf(value.platform, PLATFORMS)) {
    errors.push('platform must be "android" or "ios"');
  }
  if (typeof value.recognizedText !== 'string') {
    errors.push('recognizedText must be a string');
  }
  if (typeof value.processingTimeMs !== 'number') {
    errors.push('processingTimeMs must be a number');
  }
  if (typeof value.isColdStart !== 'boolean') {
    errors.push('isColdStart must be a boolean');
  }
  if (!isOneOf(value.status, SPIKE_A_STATUSES)) {
    errors.push('status must be "ok", "no-text", or "failed"');
  }
  if (value.memoryPeakMb !== undefined && typeof value.memoryPeakMb !== 'number') {
    errors.push('memoryPeakMb must be a number when present');
  }
  if (value.error !== undefined && typeof value.error !== 'string') {
    errors.push('error must be a string when present');
  }
  validateOcrLines(value.lines, 'lines', errors);
  return { valid: errors.length === 0, errors };
}

function validateSpikeBPage(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (typeof value.pageIndex !== 'number') {
    errors.push(`${path}.pageIndex must be a number`);
  }
  if (typeof value.hasTextLayer !== 'boolean') {
    errors.push(`${path}.hasTextLayer must be a boolean`);
  }
  if (typeof value.renderTimeMs !== 'number') {
    errors.push(`${path}.renderTimeMs must be a number`);
  }
  if (typeof value.imageSizeBytes !== 'number') {
    errors.push(`${path}.imageSizeBytes must be a number`);
  }
  if (!isRecord(value.imageDimensions)) {
    errors.push(`${path}.imageDimensions must be an object`);
  } else {
    if (typeof value.imageDimensions.width !== 'number') {
      errors.push(`${path}.imageDimensions.width must be a number`);
    }
    if (typeof value.imageDimensions.height !== 'number') {
      errors.push(`${path}.imageDimensions.height must be a number`);
    }
  }
  if (!isOneOf(value.status, SPIKE_B_PAGE_STATUSES)) {
    errors.push(
      `${path}.status must be "text-layer", "rendered", or "failed"`,
    );
  }
}

export function validateSpikeBResult(value: unknown): SchemaValidation {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ['result must be an object'] };
  }
  if (typeof value.filename !== 'string') {
    errors.push('filename must be a string');
  }
  if (typeof value.candidate !== 'string') {
    errors.push('candidate must be a string');
  }
  if (!isOneOf(value.platform, PLATFORMS)) {
    errors.push('platform must be "android" or "ios"');
  }
  if (typeof value.pageCount !== 'number') {
    errors.push('pageCount must be a number');
  }
  if (typeof value.totalRenderTimeMs !== 'number') {
    errors.push('totalRenderTimeMs must be a number');
  }
  if (!isOneOf(value.status, SPIKE_B_STATUSES)) {
    errors.push('status must be "ok", "refused", or "failed"');
  }
  if (value.peakMemoryMb !== undefined && typeof value.peakMemoryMb !== 'number') {
    errors.push('peakMemoryMb must be a number when present');
  }
  if (value.error !== undefined && typeof value.error !== 'string') {
    errors.push('error must be a string when present');
  }
  if (!Array.isArray(value.pages)) {
    errors.push('pages must be an array');
  } else {
    value.pages.forEach((page: unknown, index: number) => {
      validateSpikeBPage(page, `pages[${index}]`, errors);
    });
  }
  return { valid: errors.length === 0, errors };
}

function validateEndToEndPage(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (typeof value.pageIndex !== 'number') {
    errors.push(`${path}.pageIndex must be a number`);
  }
  if (typeof value.renderTimeMs !== 'number') {
    errors.push(`${path}.renderTimeMs must be a number`);
  }
  if (typeof value.ocrTimeMs !== 'number') {
    errors.push(`${path}.ocrTimeMs must be a number`);
  }
  if (typeof value.recognizedText !== 'string') {
    errors.push(`${path}.recognizedText must be a string`);
  }
  validateOcrLines(value.lines, `${path}.lines`, errors);
  if (!isInRange(value.accuracyVsGroundTruth, 0, 1)) {
    errors.push(`${path}.accuracyVsGroundTruth must be a number between 0 and 1`);
  }
}

export function validateEndToEndResult(value: unknown): SchemaValidation {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ['result must be an object'] };
  }
  if (typeof value.pdfFilename !== 'string') {
    errors.push('pdfFilename must be a string');
  }
  if (!isOneOf(value.platform, PLATFORMS)) {
    errors.push('platform must be "android" or "ios"');
  }
  if (typeof value.totalTimeMs !== 'number') {
    errors.push('totalTimeMs must be a number');
  }
  if (typeof value.airplaneModeVerified !== 'boolean') {
    errors.push('airplaneModeVerified must be a boolean');
  }
  if (!Array.isArray(value.pages)) {
    errors.push('pages must be an array');
  } else {
    value.pages.forEach((page: unknown, index: number) => {
      validateEndToEndPage(page, `pages[${index}]`, errors);
    });
  }
  return { valid: errors.length === 0, errors };
}
