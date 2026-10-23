import type { OcrLine } from '../ocr/types';

/**
 * Storage types — derived from specs/003-cross-platform-foundation/data-model.md.
 *
 * The real build uses `expo-sqlite` + Drizzle (schema.ts / queries.ts, Phase 3).
 * The UI shell uses the in-memory `DocumentStore` implementation instead.
 */

export type DocumentSourceKind = 'scan' | 'photo' | 'pdf' | 'mixed';

export type DocumentStatus =
  | 'importing'
  | 'ready'
  | 'recognizing'
  | 'recognized'
  | 'partial'
  | 'failed';

export type PageSourceKind = 'scan' | 'photo' | 'pdf';

export type PageOcrStatus =
  | 'pending'
  | 'recognizing'
  | 'recognized'
  | 'noText'
  | 'failed';

export type ThemeMode = 'system' | 'light' | 'dark';

export type ScriptVariant = 'traditional' | 'simplified';

export interface Document {
  id: string;
  createdAt: number;
  title: string;
  sourceKind: DocumentSourceKind;
  status: DocumentStatus;
  pageCount: number;
}

export interface Page {
  id: string;
  documentId: string;
  index: number;
  imagePath: string;
  thumbnailPath: string | null;
  sourceKind: PageSourceKind;
  ocrStatus: PageOcrStatus;
  lines: OcrLine[];
  averageConfidence: number | null;
}

export interface AppSettings {
  id: number;
  theme: ThemeMode;
  fontSize: number;
  scriptVariant: ScriptVariant;
}

export type CreateDocumentInput = {
  title: string;
  sourceKind: DocumentSourceKind;
  status?: 'importing' | 'ready';
};

export type CreatePageInput = {
  index: number;
  imagePath: string;
  thumbnailPath?: string;
  sourceKind: PageSourceKind;
  ocrStatus: 'pending';
};

/** Contract: specs/003-cross-platform-foundation/contracts/storage.md */
export interface DocumentStore {
  createDocument(input: CreateDocumentInput): Promise<Document>;
  getDocument(id: string): Promise<Document | null>;
  getDocWithPages(id: string): Promise<{ document: Document; pages: Page[] } | null>;
  getRecents(limit?: number): Promise<Document[]>;
  updateDocumentStatus(id: string, status: DocumentStatus): Promise<void>;
  deleteDocument(id: string): Promise<void>;

  addPages(documentId: string, pages: CreatePageInput[]): Promise<Page[]>;
  getPages(documentId: string): Promise<Page[]>;
  updatePageOcr(pageId: string, lines: OcrLine[], avgConfidence: number | null): Promise<void>;
  updatePageStatus(pageId: string, status: PageOcrStatus): Promise<void>;

  getSettings(): Promise<AppSettings>;
  updateSettings(partial: Partial<AppSettings>): Promise<void>;
}

export const MAX_PAGES_PER_DOCUMENT = 20;
export const MAX_PAGE_IMAGE_BYTES = 20 * 1024 * 1024;
export const DEFAULT_FONT_SIZE = 20;
export const MIN_FONT_SIZE = 14;
export const MAX_FONT_SIZE = 32;

export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  theme: 'system',
  fontSize: DEFAULT_FONT_SIZE,
  scriptVariant: 'traditional',
};
