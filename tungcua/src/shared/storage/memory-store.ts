import type { OcrLine } from '../ocr/types';
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type CreateDocumentInput,
  type CreatePageInput,
  type Document,
  type DocumentStatus,
  type DocumentStore,
  type Page,
  type PageOcrStatus,
} from './types';

export interface MemoryStoreSeed {
  documents?: Document[];
  pages?: Page[];
  settings?: Partial<AppSettings>;
}

export interface MemoryDocumentStore extends DocumentStore {
  /** Monotonic change counter for `useSyncExternalStore`. */
  getVersion(): number;
  /** Subscribe to mutations (for `useSyncExternalStore`). */
  subscribe(listener: () => void): () => void;
  /** Test hook: drop all rows and reset the id sequence. */
  reset(seed?: MemoryStoreSeed): void;
}

function averageConfidence(lines: OcrLine[]): number | null {
  if (lines.length === 0) {
    return null;
  }
  const total = lines.reduce((sum, line) => sum + line.confidence, 0);
  return total / lines.length;
}

function deriveStatus(pages: Page[]): DocumentStatus {
  if (pages.length === 0) {
    return 'ready';
  }
  const done = pages.every(
    (page) => page.ocrStatus === 'recognized' || page.ocrStatus === 'noText',
  );
  if (done) {
    return 'recognized';
  }
  if (pages.some((page) => page.ocrStatus === 'failed')) {
    return 'partial';
  }
  if (pages.some((page) => page.ocrStatus === 'recognizing')) {
    return 'recognizing';
  }
  return 'ready';
}

/**
 * In-memory `DocumentStore` used by the UI shell and by tests.
 *
 * Behavior mirrors contracts/storage.md (cascade delete, idempotent OCR writes,
 * derived document status) without a SQLite/Drizzle dependency.
 */
export function createMemoryDocumentStore(seed: MemoryStoreSeed = {}): MemoryDocumentStore {
  let documents: Document[] = [];
  let pages: Page[] = [];
  let settings: AppSettings = { ...DEFAULT_SETTINGS, ...seed.settings };
  let sequence = 0;
  let version = 0;
  const listeners = new Set<() => void>();

  const emit = (): void => {
    version += 1;
    listeners.forEach((listener) => listener());
  };

  const nextId = (prefix: string): string => {
    sequence += 1;
    return `${prefix}_${Date.now().toString(36)}_${sequence}`;
  };

  const reset = (nextSeed: MemoryStoreSeed = {}): void => {
    documents = (nextSeed.documents ?? []).map((doc) => ({ ...doc }));
    pages = (nextSeed.pages ?? []).map((page) => ({ ...page, lines: [...page.lines] }));
    settings = { ...DEFAULT_SETTINGS, ...nextSeed.settings };
    sequence = 0;
    emit();
  };

  reset(seed);

  const findPage = (pageId: string): Page | undefined =>
    pages.find((page) => page.id === pageId);

  const refreshDocument = (documentId: string): void => {
    const doc = documents.find((entry) => entry.id === documentId);
    if (!doc) {
      return;
    }
    const docPages = pages.filter((page) => page.documentId === documentId);
    doc.pageCount = docPages.length;
    doc.status = deriveStatus(docPages);
  };

  return {
    reset,
    getVersion: () => version,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    async createDocument(input: CreateDocumentInput): Promise<Document> {
      const document: Document = {
        id: nextId('doc'),
        createdAt: Date.now(),
        title: input.title,
        sourceKind: input.sourceKind,
        status: input.status ?? 'ready',
        pageCount: 0,
      };
      documents.push(document);
      emit();
      return { ...document };
    },

    async getDocument(id: string): Promise<Document | null> {
      const doc = documents.find((entry) => entry.id === id);
      return doc ? { ...doc } : null;
    },

    async getDocWithPages(
      id: string,
    ): Promise<{ document: Document; pages: Page[] } | null> {
      const doc = documents.find((entry) => entry.id === id);
      if (!doc) {
        return null;
      }
      return {
        document: { ...doc },
        pages: pages
          .filter((page) => page.documentId === id)
          .sort((a, b) => a.index - b.index)
          .map((page) => ({ ...page, lines: [...page.lines] })),
      };
    },

    async getRecents(limit?: number): Promise<Document[]> {
      const sorted = documents
        .map((doc, index) => ({ doc, index }))
        .sort((a, b) => b.doc.createdAt - a.doc.createdAt || b.index - a.index)
        .map(({ doc }) => doc);
      return (limit ? sorted.slice(0, limit) : sorted).map((doc) => ({ ...doc }));
    },

    async updateDocumentStatus(id: string, status: DocumentStatus): Promise<void> {
      const doc = documents.find((entry) => entry.id === id);
      if (doc) {
        doc.status = status;
        emit();
      }
    },

    async deleteDocument(id: string): Promise<void> {
      pages = pages.filter((page) => page.documentId !== id);
      documents = documents.filter((doc) => doc.id !== id);
      emit();
    },

    async addPages(documentId: string, inputs: CreatePageInput[]): Promise<Page[]> {
      const created = inputs.map((input) => {
        const page: Page = {
          id: nextId('page'),
          documentId,
          index: input.index,
          imagePath: input.imagePath,
          thumbnailPath: input.thumbnailPath ?? null,
          sourceKind: input.sourceKind,
          ocrStatus: input.ocrStatus,
          lines: [],
          averageConfidence: null,
        };
        pages.push(page);
        return { ...page };
      });
      refreshDocument(documentId);
      emit();
      return created;
    },

    async getPages(documentId: string): Promise<Page[]> {
      return pages
        .filter((page) => page.documentId === documentId)
        .sort((a, b) => a.index - b.index)
        .map((page) => ({ ...page, lines: [...page.lines] }));
    },

    async updatePageOcr(
      pageId: string,
      lines: OcrLine[],
      avgConfidence: number | null,
    ): Promise<void> {
      const page = findPage(pageId);
      if (!page) {
        return;
      }
      page.lines = [...lines];
      page.averageConfidence = avgConfidence ?? averageConfidence(lines);
      page.ocrStatus = lines.length === 0 ? 'noText' : 'recognized';
      refreshDocument(page.documentId);
      emit();
    },

    async updatePageStatus(pageId: string, status: PageOcrStatus): Promise<void> {
      const page = findPage(pageId);
      if (!page) {
        return;
      }
      page.ocrStatus = status;
      refreshDocument(page.documentId);
      emit();
    },

    async getSettings(): Promise<AppSettings> {
      return { ...settings };
    },

    async updateSettings(partial: Partial<AppSettings>): Promise<void> {
      settings = { ...settings, ...partial, id: 1 };
      emit();
    },
  };
}
