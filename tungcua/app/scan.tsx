import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../src/components/ui/AppButton';
import { EmptyState } from '../src/components/ui/EmptyState';
import { ScreenScroll } from '../src/components/ui/Screen';
import { useApp } from '../src/providers/app-provider';
import { documentTitle } from '../src/shared/storage/title';

export default function ScanScreen() {
  const router = useRouter();
  const { store } = useApp();
  const [pages, setPages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const capture = () => {
    setPages((previous) => [...previous, `mock://scan/page-${previous.length + 1}.jpg`]);
  };

  const retake = (index: number) => {
    setPages((previous) => previous.filter((_, position) => position !== index));
  };

  const confirm = async () => {
    if (pages.length === 0) {
      return;
    }
    setBusy(true);
    const document = await store.createDocument({
      title: documentTitle('Scan'),
      sourceKind: 'scan',
    });
    await store.addPages(
      document.id,
      pages.map((imagePath, index) => ({
        index,
        imagePath,
        sourceKind: 'scan' as const,
        ocrStatus: 'pending' as const,
      })),
    );
    setBusy(false);
    router.push(`/ocr/${document.id}`);
  };

  return (
    <ScreenScroll>
      <View className="h-48 items-center justify-center rounded-2xl bg-pink-surface dark:bg-dark-pink-surface">
        <Text className="text-base font-sans text-pink-ink dark:text-dark-pink-ink">
          Camera preview (mock)
        </Text>
      </View>

      <AppButton label="Capture page" testID="scan-capture" onPress={capture} />

      <Text className="text-lg font-sans font-semibold text-mint-ink dark:text-dark-mint-ink">
        Pages ({pages.length})
      </Text>

      {pages.length === 0 ? (
        <EmptyState message="No pages captured yet. Tap Capture page to add one." />
      ) : (
        pages.map((imagePath, index) => (
          <View
            key={imagePath}
            testID={`scan-page-${index}`}
            className="flex-row items-center justify-between rounded-2xl bg-mint-surface p-4 dark:bg-dark-mint-surface"
          >
            <Text className="text-base font-sans text-mint-ink dark:text-dark-mint-ink">
              Page {index + 1}
            </Text>
            <AppButton
              label="Retake"
              variant="ghost"
              testID={`scan-retake-${index}`}
              accessibilityLabel={`Retake page ${index + 1}`}
              onPress={() => retake(index)}
            />
          </View>
        ))
      )}

      <AppButton
        label="Recognize text"
        testID="scan-confirm"
        disabled={pages.length === 0 || busy}
        onPress={confirm}
      />
    </ScreenScroll>
  );
}
