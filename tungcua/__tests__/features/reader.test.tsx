import { beforeEach, describe, expect, it } from '@jest/globals';
import { waitFor } from '@testing-library/react-native';
import { __resetMockRouter, __setMockParams } from '../../src/shared/test-utils/router-mock';
import ReaderScreen from '../../app/reader/[docId]';
import {
  createMemoryDocumentStore,
  SAMPLE_OCR_LINES,
  renderWithProviders,
} from '../../src/shared/test-utils';

describe('ReaderScreen', () => {
  beforeEach(() => __resetMockRouter());

  it('renders recognized text and a no-text page state', async () => {
    const store = createMemoryDocumentStore();
    const document = await store.createDocument({ title: 'Reading', sourceKind: 'scan' });
    const [first, second] = await store.addPages(document.id, [
      { index: 0, imagePath: 'mock://scan/page-1.jpg', sourceKind: 'scan', ocrStatus: 'pending' },
      { index: 1, imagePath: 'mock://scan/blank.jpg', sourceKind: 'scan', ocrStatus: 'pending' },
    ]);
    await store.updatePageOcr(first.id, SAMPLE_OCR_LINES, null);
    await store.updatePageOcr(second.id, [], null);
    __setMockParams({ docId: document.id });

    const view = await renderWithProviders(<ReaderScreen />, { store });

    await waitFor(() => expect(view.getByTestId('reader-title')).toBeTruthy());
    expect(view.getByText('Reading')).toBeTruthy();
    expect(view.getByText(SAMPLE_OCR_LINES[0].text)).toBeTruthy();
    expect(view.getByText('No text found on this page.')).toBeTruthy();
  });
});
