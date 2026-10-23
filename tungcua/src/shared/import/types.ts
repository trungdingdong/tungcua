/** A single asset returned by a camera/gallery/file picker. */
export interface PickedAsset {
  uri: string;
  name: string;
  mimeType: string;
  kind: 'image' | 'pdf';
  /** PDF page count (mock metadata until the real renderer lands). */
  pageCount?: number;
  /** Whether the PDF exposes an embedded text layer. */
  hasTextLayer?: boolean;
}

/**
 * Import source surface. Real build wires `expo-image-picker` /
 * `expo-document-picker`; the shell injects the mock implementation.
 */
export interface MediaPicker {
  pickPhotos(): Promise<PickedAsset[]>;
  pickFiles(): Promise<PickedAsset[]>;
}
