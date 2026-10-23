import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppButton } from '../../src/components/ui/AppButton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ScreenScroll } from '../../src/components/ui/Screen';
import { useApp } from '../../src/providers/app-provider';
import type { Document } from '../../src/shared/storage/types';
import { useStoreVersion } from '../../src/store/use-store-version';

export default function HomeScreen() {
  const router = useRouter();
  const { store } = useApp();
  const version = useStoreVersion(store);
  const [recents, setRecents] = useState<Document[]>([]);

  useEffect(() => {
    let active = true;
    void store.getRecents().then((documents) => {
      if (active) {
        setRecents(documents);
      }
    });
    return () => {
      active = false;
    };
  }, [store, version]);

  return (
    <ScreenScroll>
      <Text className="text-3xl font-sans font-bold text-mint-ink dark:text-dark-mint-ink">
        TungCua
      </Text>
      <Text className="text-base font-sans text-mint-ink dark:text-dark-mint-ink">
        Read Chinese documents on device. Nothing leaves your phone.
      </Text>

      <View className="gap-3">
        <AppButton label="Scan a page" testID="home-scan" onPress={() => router.push('/scan')} />
        <AppButton
          label="Import photos"
          variant="secondary"
          testID="home-photos"
          onPress={() => router.push('/import/photos')}
        />
        <AppButton
          label="Import files"
          variant="secondary"
          testID="home-files"
          onPress={() => router.push('/import/files')}
        />
      </View>

      <Text className="mt-2 text-lg font-sans font-semibold text-mint-ink dark:text-dark-mint-ink">
        Recent documents
      </Text>

      {recents.length === 0 ? (
        <EmptyState message="No documents yet. Scan a page or import a photo or PDF to get started." />
      ) : (
        recents.map((doc) => (
          <Pressable
            key={doc.id}
            testID={`recent-${doc.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Open ${doc.title}`}
            onPress={() =>
              router.push(doc.status === 'recognized' ? `/reader/${doc.id}` : `/ocr/${doc.id}`)
            }
            className="rounded-2xl bg-mint-surface p-4 dark:bg-dark-mint-surface"
          >
            <Text className="text-base font-sans font-semibold text-mint-ink dark:text-dark-mint-ink">
              {doc.title}
            </Text>
            <Text className="text-sm font-sans text-mint-ink dark:text-dark-mint-ink">
              {doc.status} · {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}
            </Text>
          </Pressable>
        ))
      )}
    </ScreenScroll>
  );
}
