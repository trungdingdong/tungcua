import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../../src/components/ui/AppButton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ScreenScroll } from '../../src/components/ui/Screen';
import { useApp } from '../../src/providers/app-provider';
import type { PickedAsset } from '../../src/shared/import/types';
import { documentTitle } from '../../src/shared/storage/title';

export default function PhotoImportScreen() {
  const router = useRouter();
  const { store, picker } = useApp();
  const [assets, setAssets] = useState<PickedAsset[]>([]);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    setAssets(await picker.pickPhotos());
  };

  const addToDocument = async () => {
    if (assets.length === 0) {
      return;
    }
    setBusy(true);
    const document = await store.createDocument({
      title: documentTitle('Photos'),
      sourceKind: 'photo',
    });
    await store.addPages(
      document.id,
      assets.map((asset, index) => ({
        index,
        imagePath: asset.uri,
        sourceKind: 'photo' as const,
        ocrStatus: 'pending' as const,
      })),
    );
    setBusy(false);
    router.push(`/ocr/${document.id}`);
  };

  return (
    <ScreenScroll>
      <Text className="text-2xl font-sans font-bold text-mint-ink dark:text-dark-mint-ink">
        Import photos
      </Text>

      <AppButton
        label="Choose from gallery"
        testID="photos-pick"
        onPress={pick}
      />

      {assets.length === 0 ? (
        <EmptyState message="No photos selected yet." />
      ) : (
        assets.map((asset, index) => (
          <View
            key={asset.uri}
            testID={`photo-asset-${index}`}
            className="rounded-2xl bg-mint-surface p-4 dark:bg-dark-mint-surface"
          >
            <Text className="text-base font-sans text-mint-ink dark:text-dark-mint-ink">
              {asset.name}
            </Text>
          </View>
        ))
      )}

      <AppButton
        label="Add to document"
        testID="photos-add"
        variant="secondary"
        disabled={assets.length === 0 || busy}
        onPress={addToDocument}
      />
    </ScreenScroll>
  );
}
