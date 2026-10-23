import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { AppProvider, type AppProviderProps } from '../../providers/app-provider';
import { createMockMediaPicker } from '../import/mock-picker';
import { createStubOcrEngine } from '../ocr/stub-engine';
import { createMemoryDocumentStore } from '../storage/memory-store';

export { createMockMediaPicker, createStubOcrEngine, createMemoryDocumentStore };
export * from '../ocr/fixtures';

export interface RenderWithProvidersOptions extends RenderOptions {
  store?: AppProviderProps['store'];
  engine?: AppProviderProps['engine'];
  picker?: AppProviderProps['picker'];
}

/** Render a screen wrapped in an `AppProvider` with injectable dependencies. */
export async function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) {
  const { store, engine, picker, ...renderOptions } = options;
  return render(
    <AppProvider store={store} engine={engine} picker={picker}>
      {ui}
    </AppProvider>,
    renderOptions,
  );
}
