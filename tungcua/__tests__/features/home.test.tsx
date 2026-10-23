import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { __resetMockRouter, mockRouter } from '../../src/shared/test-utils/router-mock';
import HomeScreen from '../../app/(tabs)/index';
import { createMemoryDocumentStore, renderWithProviders } from '../../src/shared/test-utils';

describe('HomeScreen', () => {
  beforeEach(() => __resetMockRouter());

  it('shows an empty state and routes to scan', async () => {
    const { getByTestId, getByText } = await renderWithProviders(<HomeScreen />, {
      store: createMemoryDocumentStore(),
    });

    await waitFor(() => expect(getByText(/No documents yet/)).toBeTruthy());

    await fireEvent.press(getByTestId('home-scan'));
    expect(mockRouter.push).toHaveBeenCalledWith('/scan');
  });

  it('lists recent documents and opens the reader', async () => {
    const store = createMemoryDocumentStore();
    const doc = await store.createDocument({ title: 'My Scan', sourceKind: 'scan' });

    const { getByText, getByTestId } = await renderWithProviders(<HomeScreen />, {
      store,
    });

    await waitFor(() => expect(getByText('My Scan')).toBeTruthy());

    await fireEvent.press(getByTestId(`recent-${doc.id}`));
    expect(mockRouter.push).toHaveBeenCalledWith(`/ocr/${doc.id}`);
  });
});
