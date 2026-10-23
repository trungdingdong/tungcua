import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { __resetMockRouter, mockRouter } from '../../src/shared/test-utils/router-mock';
import ScanScreen from '../../app/scan';
import { createMemoryDocumentStore, renderWithProviders } from '../../src/shared/test-utils';

describe('ScanScreen', () => {
  beforeEach(() => __resetMockRouter());

  it('captures pages, supports retake, and creates a document', async () => {
    const store = createMemoryDocumentStore();
    const view = await renderWithProviders(<ScanScreen />, { store });

    await fireEvent.press(view.getByTestId('scan-capture'));
    await fireEvent.press(view.getByTestId('scan-capture'));
    expect(view.getByText('Pages (2)')).toBeTruthy();

    await fireEvent.press(view.getByTestId('scan-retake-0'));
    expect(view.getByText('Pages (1)')).toBeTruthy();

    await fireEvent.press(view.getByTestId('scan-confirm'));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());

    const [document] = await store.getRecents();
    expect(document.sourceKind).toBe('scan');
    const pages = await store.getPages(document.id);
    expect(pages).toHaveLength(1);
    expect(mockRouter.push).toHaveBeenCalledWith(`/ocr/${document.id}`);
  });

  it('keeps confirm disabled until a page is captured', async () => {
    const store = createMemoryDocumentStore();
    const view = await renderWithProviders(<ScanScreen />, { store });

    expect(view.getByTestId('scan-confirm').props.accessibilityState.disabled).toBe(true);
  });
});
