import { useSyncExternalStore } from 'react';
import type { MemoryDocumentStore } from '../shared/storage/memory-store';

/**
 * Re-render when the in-memory store mutates. The shell has no SQLite
 * subscription layer yet, so `useSyncExternalStore` over the store's version
 * counter keeps screens in sync after imports / OCR.
 */
export function useStoreVersion(store: MemoryDocumentStore): number {
  return useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
}
