import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import {
  __resetMockRouter,
  __setMockParams,
  mockRouter,
} from '../../src/shared/test-utils/router-mock';
import OcrProgressScreen from '../../app/ocr/[docId]';
import {
  createMemoryDocumentStore,
  createStubOcrEngine,
  renderWithProviders,
} from '../../src/shared/test-utils';

describe('OcrProgressScreen', () => {
  beforeEach(() => __resetMockRouter());

  it('recognizes every page and opens the reader', async () => {
    const store = createMemoryDocumentStore();
    const document = await store.createDocument({ title: 'Doc', sourceKind: 'scan' });
    await store.addPages(document.id, [
      { index: 0, imagePath: 'mock://scan/page-1.jpg', sourceKind: 'scan', ocrStatus: 'pending' },
      { index: 1, imagePath: 'mock://scan/blank.jpg', sourceKind: 'scan', ocrStatus: 'pending' },
      { index: 2, imagePath: 'mock://scan/fail.jpg', sourceKind: 'scan', ocrStatus: 'pending' },
    ]);
    __setMockParams({ docId: document.id });

    const view = await renderWithProviders(<OcrProgressScreen />, {
      store,
      engine: createStubOcrEngine(),
    });

    await waitFor(() =>
      expect(view.getByTestId('ocr-status-0').props.children).toBe('Recognized'),
    );
    expect(view.getByTestId('ocr-status-1').props.children).toBe('No text found');
    expect(view.getByTestId('ocr-status-2').props.children).toBe('Failed');

    const pages = await store.getPages(document.id);
    expect(pages.map((page) => page.ocrStatus)).toEqual([
      'recognized',
      'noText',
      'failed',
    ]);

    await waitFor(() =>
      expect(view.getByTestId('ocr-open-reader').props.accessibilityState.disabled).toBe(false),
    );
    await fireEvent.press(view.getByTestId('ocr-open-reader'));
    expect(mockRouter.push).toHaveBeenCalledWith(`/reader/${document.id}`);
  });
});
