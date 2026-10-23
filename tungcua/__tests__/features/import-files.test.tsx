import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { __resetMockRouter, mockRouter } from '../../src/shared/test-utils/router-mock';
import FileImportScreen from '../../app/import/files';
import {
  createMemoryDocumentStore,
  createMockMediaPicker,
  renderWithProviders,
} from '../../src/shared/test-utils';
import { makePdfAsset } from '../../src/shared/import/mock-picker';

describe('FileImportScreen', () => {
  beforeEach(() => __resetMockRouter());

  it('uses embedded text for a text PDF and opens the reader', async () => {
    const store = createMemoryDocumentStore();
    const picker = createMockMediaPicker({
      files: [makePdfAsset({ pageCount: 3, hasTextLayer: true })],
    });
    const view = await renderWithProviders(<FileImportScreen />, { store, picker });

    await fireEvent.press(view.getByTestId('files-pick'));
    await waitFor(() => expect(view.getByTestId('file-asset-0')).toBeTruthy());
    await fireEvent.press(view.getByTestId('files-add'));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());

    const [document] = await store.getRecents();
    const pages = await store.getPages(document.id);
    expect(pages).toHaveLength(3);
    expect(pages.every((page) => page.ocrStatus === 'recognized')).toBe(true);
    expect(mockRouter.push).toHaveBeenCalledWith(`/reader/${document.id}`);
  });

  it('sends scanned PDFs to OCR', async () => {
    const store = createMemoryDocumentStore();
    const picker = createMockMediaPicker({
      files: [makePdfAsset({ pageCount: 2, hasTextLayer: false })],
    });
    const view = await renderWithProviders(<FileImportScreen />, { store, picker });

    await fireEvent.press(view.getByTestId('files-pick'));
    await waitFor(() => expect(view.getByTestId('file-asset-0')).toBeTruthy());
    await fireEvent.press(view.getByTestId('files-add'));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());

    const [document] = await store.getRecents();
    expect(mockRouter.push).toHaveBeenCalledWith(`/ocr/${document.id}`);
    const pages = await store.getPages(document.id);
    expect(pages.every((page) => page.ocrStatus === 'pending')).toBe(true);
  });

  it('refuses PDFs over the 20-page cap', async () => {
    const store = createMemoryDocumentStore();
    const picker = createMockMediaPicker({
      files: [makePdfAsset({ pageCount: 25, hasTextLayer: true })],
    });
    const view = await renderWithProviders(<FileImportScreen />, { store, picker });

    await fireEvent.press(view.getByTestId('files-pick'));
    await waitFor(() => expect(view.getByTestId('file-asset-0')).toBeTruthy());
    await fireEvent.press(view.getByTestId('files-add'));

    await view.findByTestId('files-message');
    expect(view.getByText(/limit is 20 pages/)).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(await store.getRecents()).toHaveLength(0);
  });
});
