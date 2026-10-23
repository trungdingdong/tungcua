import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type { MediaPicker } from '../shared/import/types';
import { createMockMediaPicker } from '../shared/import/mock-picker';
import type { OcrEngine } from '../shared/ocr/engine';
import { createStubOcrEngine } from '../shared/ocr/stub-engine';
import {
  createMemoryDocumentStore,
  type MemoryDocumentStore,
} from '../shared/storage/memory-store';
import { useUiStore } from '../store/ui-store';

export interface AppContextValue {
  store: MemoryDocumentStore;
  engine: OcrEngine;
  picker: MediaPicker;
}

const AppContext = createContext<AppContextValue | null>(null);

export interface AppProviderProps {
  store?: MemoryDocumentStore;
  engine?: OcrEngine;
  picker?: MediaPicker;
  children: ReactNode;
}

/**
 * Dependency injection for the UI shell. Defaults wire the mock store, stub OCR
 * engine and mock picker; tests override them per case.
 */
export function AppProvider({
  store,
  engine,
  picker,
  children,
}: AppProviderProps) {
  const value = useMemo<AppContextValue>(
    () => ({
      store: store ?? createMemoryDocumentStore(),
      engine: engine ?? createStubOcrEngine(),
      picker: picker ?? createMockMediaPicker(),
    }),
    [store, engine, picker],
  );

  useEffect(() => {
    let active = true;
    void value.store.getSettings().then((settings) => {
      if (active) {
        useUiStore.getState().hydrate(settings);
      }
    });
    return () => {
      active = false;
    };
  }, [value.store]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return value;
}
