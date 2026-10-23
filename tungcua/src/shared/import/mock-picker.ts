import type { MediaPicker, PickedAsset } from './types';

export function makeImageAsset(index = 1): PickedAsset {
  return {
    uri: `mock://photos/photo-${index}.jpg`,
    name: `photo-${index}.jpg`,
    mimeType: 'image/jpeg',
    kind: 'image',
  };
}

export function makePdfAsset(
  options: { pageCount?: number; hasTextLayer?: boolean; name?: string } = {},
): PickedAsset {
  const pageCount = options.pageCount ?? 3;
  const hasTextLayer = options.hasTextLayer ?? true;
  return {
    uri: `mock://files/${options.name ?? 'document.pdf'}`,
    name: options.name ?? 'document.pdf',
    mimeType: 'application/pdf',
    kind: 'pdf',
    pageCount,
    hasTextLayer,
  };
}

export interface MockMediaPickerOptions {
  photos?: PickedAsset[];
  files?: PickedAsset[];
}

/**
 * Deterministic picker used by the shell so import flows are demonstrable and
 * testable without native modules. Defaults: one photo, one 3-page text PDF.
 */
export function createMockMediaPicker(options: MockMediaPickerOptions = {}): MediaPicker {
  return {
    async pickPhotos(): Promise<PickedAsset[]> {
      return options.photos ?? [makeImageAsset()];
    },
    async pickFiles(): Promise<PickedAsset[]> {
      return options.files ?? [makePdfAsset()];
    },
  };
}
