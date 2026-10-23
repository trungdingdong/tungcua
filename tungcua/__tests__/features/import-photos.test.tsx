import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { __resetMockRouter, mockRouter } from '../../src/shared/test-utils/router-mock';
import PhotoImportScreen from '../../app/import/photos';
import {
  createMemoryDocumentStore,
  createMockMediaPicker,
  renderWithProviders,
} from '../../src/shared/test-utils';
import { makeImageAsset } from '../../src/shared/import/mock-picker';

describe('PhotoImportScreen', () => {
  beforeEach(() => __resetMockRouter());

  it('imports gallery photos into a new document', async () => {
    const store = createMemoryDocumentStore();
    const picker = createMockMediaPicker({
      photos: [makeImageAsset(1), makeImageAsset(2)],
    });
    const view = await renderWithProviders(<PhotoImportScreen />, { store, picker });

    await fireEvent.press(view.getByTestId('photos-pick'));
    await waitFor(() => expect(view.getByTestId('photo-asset-1')).toBeTruthy());

    await fireEvent.press(view.getByTestId('photos-add'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());

    const [document] = await store.getRecents();
    expect(document.sourceKind).toBe('photo');
    expect(await store.getPages(document.id)).toHaveLength(2);
    expect(mockRouter.push).toHaveBeenCalledWith(`/ocr/${document.id}`);
  });
});
