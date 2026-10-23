import { describe, expect, it } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import {
  __resetMockRouter,
  __setMockParams,
  mockRouter,
} from '../../src/shared/test-utils/router-mock';
import OcrProgressScreen from '../../app/ocr/[docId]';
import ReaderScreen from '../../app/reader/[docId]';
import ScanScreen from '../../app/scan';
import {
  createMemoryDocumentStore,
  createStubOcrEngine,
  renderWithProviders,
  SAMPLE_OCR_LINES,
} from '../../src/shared/test-utils';

describe('mocked flow: scan -> OCR -> reader', () => {
  it('carries a captured page through recognition into the reader', async () => {
    __resetMockRouter();
    const store = createMemoryDocumentStore();
    const engine = createStubOcrEngine();

    const scanView = await renderWithProviders(<ScanScreen />, { store, engine });
    await fireEvent.press(scanView.getByTestId('scan-capture'));
    await fireEvent.press(scanView.getByTestId('scan-confirm'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());

    const docId = String(mockRouter.push.mock.calls[0][0]).replace('/ocr/', '');
    expect(docId).not.toHaveLength(0);
    await scanView.unmount();

    __setMockParams({ docId });
    const ocrView = await renderWithProviders(<OcrProgressScreen />, { store, engine });
    await waitFor(() =>
      expect(ocrView.getByTestId('ocr-open-reader').props.accessibilityState.disabled).toBe(
        false,
      ),
    );
    await ocrView.unmount();

    const readerView = await renderWithProviders(<ReaderScreen />, { store, engine });
    await waitFor(() => expect(readerView.getByTestId('reader-title')).toBeTruthy());

    expect(readerView.getByText(SAMPLE_OCR_LINES[0].text)).toBeTruthy();
    const [document] = await store.getRecents();
    expect(document.status).toBe('recognized');
  });
});
