# Contract: Storage (Database + FileSystem)

**Feature**: `003-cross-platform-foundation` | **Date**: 2026-10-04

## Database: `expo-sqlite` + Drizzle ORM

### Schema (Drizzle)

```typescript
// src/shared/storage/schema.ts

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  title: text('title').notNull(),
  sourceKind: text('source_kind', { enum: ['scan', 'photo', 'pdf', 'mixed'] }).notNull(),
  status: text('status', { enum: ['importing', 'ready', 'recognizing', 'recognized', 'partial', 'failed'] }).notNull(),
  pageCount: integer('page_count').notNull().default(0),
});

export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  index: integer('index').notNull(),
  imagePath: text('image_path').notNull(),
  thumbnailPath: text('thumbnail_path'),
  sourceKind: text('source_kind', { enum: ['scan', 'photo', 'pdf'] }).notNull(),
  ocrStatus: text('ocr_status', { enum: ['pending', 'recognizing', 'recognized', 'noText', 'failed'] }).notNull(),
  lines: text('lines', { mode: 'json' }).notNull().$type<OcrLine[]>(),
  averageConfidence: real('average_confidence'),
}, (table) => ({
  docIdx: index('pages_document_id_idx').on(table.documentId),
}));

export const appSettings = sqliteTable('app_settings', {
  id: integer('id').primaryKey(), // always 1
  theme: text('theme', { enum: ['system', 'light', 'dark'] }).notNull().default('system'),
  fontSize: integer('font_size').notNull().default(20),
  scriptVariant: text('script_variant', { enum: ['traditional', 'simplified'] }).notNull().default('traditional'),
});

// P1/P2 reserved (created but empty)
export const charEntries = sqliteTable('char_entries', {
  char: text('char').primaryKey(),
  pinyin: text('pinyin'),
  hanviet: text('hanviet'),
  enGloss: text('en_gloss'),
  viGloss: text('vi_gloss'),
  radical: text('radical'),
  radicalNumber: integer('radical_number'),
  strokes: integer('strokes'),
  hsk: integer('hsk'),
  frequency: integer('frequency'),
  decomposition: text('decomposition'),
  tradVariant: text('trad_variant'),
  simpVariant: text('simp_variant'),
}, (table) => ({
  radicalIdx: index('char_entries_radical_idx').on(table.radical),
  pinyinIdx: index('char_entries_pinyin_idx').on(table.pinyin),
}));

export const bookmarks = sqliteTable('bookmarks', {
  id: text('id').primaryKey(),
  char: text('char').notNull().references(() => charEntries.char),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const lookupHistory = sqliteTable('lookup_history', {
  id: text('id').primaryKey(),
  char: text('char').notNull().references(() => charEntries.char),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
```

### Query Layer Interface

```typescript
// src/shared/storage/queries.ts

export interface DocumentStore {
  // Documents
  createDocument(input: CreateDocumentInput): Promise<Document>;
  getDocument(id: string): Promise<Document | null>;
  getRecents(limit?: number): Promise<Document[]>;
  updateDocumentStatus(id: string, status: DocumentStatus): Promise<void>;
  deleteDocument(id: string): Promise<void>; // cascades pages + files

  // Pages
  addPages(documentId: string, pages: CreatePageInput[]): Promise<Page[]>;
  getPages(documentId: string): Promise<Page[]>;
  updatePageOcr(pageId: string, lines: OcrLine[], avgConfidence: number | null): Promise<void>;
  updatePageStatus(pageId: string, status: PageOcrStatus): Promise<void>;

  // Settings
  getSettings(): Promise<AppSettings>;
  updateSettings(partial: Partial<AppSettings>): Promise<void>;
}

export type CreateDocumentInput = {
  title: string;
  sourceKind: 'scan' | 'photo' | 'pdf' | 'mixed';
  status?: 'importing' | 'ready';
};

export type CreatePageInput = {
  index: number;
  imagePath: string;
  thumbnailPath?: string;
  sourceKind: 'scan' | 'photo' | 'pdf';
  ocrStatus: 'pending';
};

export type Document = typeof documents.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type AppSettings = typeof appSettings.$inferSelect;
```

### FileSystem (Page Images)

```typescript
// src/shared/storage/files.ts

export interface PageFileStore {
  /** Write page image, return relative path. Enforces 20 MB limit. */
  writePageImage(docId: string, pageIndex: number, data: Uint8Array): Promise<string>;

  /** Read page image as Uint8Array. */
  readPageImage(relativePath: string): Promise<Uint8Array | null>;

  /** Delete page image + thumbnail. */
  deletePageFiles(imagePath: string, thumbnailPath?: string): Promise<void>;

  /** Generate thumbnail (lazy, on first request). */
  ensureThumbnail(imagePath: string, maxDimension: number): Promise<string>;
}
```

- Page images stored in `${FileSystem.documentDirectory}/pages/{docId}/{pageIndex}.jpg`
- Thumbnails in `${FileSystem.documentDirectory}/thumbs/{docId}/{pageIndex}.jpg`
- Max 20 MB per page image (validated on write)
- Deleting document → `PageFileStore.deletePageFiles()` for all its pages

## Dictionary Database (P1+, separate file)

- File: `assets/dictionary.sqlite` (bundled, read-only)
- On first launch: copy to `${FileSystem.documentDirectory}/dictionary.sqlite`
- Opened via separate `expo-sqlite` connection (read-only)
- Schema: `charEntries` table (see `schema.ts`)
- Indexes: `char` (PK), `radical`, `pinyin`

## Behavior Contracts

- **Cascading delete**: `deleteDocument(id)` → deletes pages (DB cascade) → deletes image/thumbnail files (app code). No orphan rows or files.
- **Idempotent OCR update**: `updatePageOcr(pageId, lines, avgConfidence)` replaces `lines` entirely; never appends.
- **No network**: All DB + FileSystem ops are local. No sync, no cloud.
- **Testability**: `DocumentStore` and `PageFileStore` are interfaces; test doubles injectable.