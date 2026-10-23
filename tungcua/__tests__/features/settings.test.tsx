import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { __resetMockRouter } from '../../src/shared/test-utils/router-mock';
import SettingsScreen from '../../app/(tabs)/settings';
import {
  createMemoryDocumentStore,
  renderWithProviders,
} from '../../src/shared/test-utils';
import { resetUiStore, useUiStore } from '../../src/store/ui-store';

describe('SettingsScreen', () => {
  beforeEach(() => {
    __resetMockRouter();
    resetUiStore();
  });

  it('updates theme, font size and script variant', async () => {
    const store = createMemoryDocumentStore();
    const view = await renderWithProviders(<SettingsScreen />, { store });

    await fireEvent.press(view.getByTestId('settings-theme-dark'));
    expect(useUiStore.getState().theme).toBe('dark');

    await fireEvent.press(view.getByTestId('settings-font-increase'));
    expect(useUiStore.getState().fontSize).toBe(22);

    await fireEvent.press(view.getByTestId('settings-variant-simplified'));
    expect(useUiStore.getState().scriptVariant).toBe('simplified');

    const settings = await store.getSettings();
    expect(settings).toMatchObject({
      theme: 'dark',
      fontSize: 22,
      scriptVariant: 'simplified',
    });
  });

  it('clamps font size to the 14-32 pt range', async () => {
    const store = createMemoryDocumentStore();
    const view = await renderWithProviders(<SettingsScreen />, { store });

    for (let step = 0; step < 5; step += 1) {
      await fireEvent.press(view.getByTestId('settings-font-decrease'));
    }
    expect(useUiStore.getState().fontSize).toBe(14);

    for (let step = 0; step < 10; step += 1) {
      await fireEvent.press(view.getByTestId('settings-font-increase'));
    }
    expect(useUiStore.getState().fontSize).toBe(32);
  });
});
