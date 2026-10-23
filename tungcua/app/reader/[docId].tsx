import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ScreenScroll } from '../../src/components/ui/Screen';
import { useApp } from '../../src/providers/app-provider';
import type { Document, Page } from '../../src/shared/storage/types';
import { useStoreVersion } from '../../src/store/use-store-version';

interface ReaderData {
  document: Document;
  pages: Page[];
}

export default function ReaderScreen() {
  const { docId } = useLocalSearchParams<{ docId: string }>();
  const { store } = useApp();
  const version = useStoreVersion(store);
  const [data, setData] = useState<ReaderData | null>(null);

  useEffect(() => {
    let active = true;
    if (!docId) {
      return;
    }
    void store.getDocWithPages(docId).then((result) => {
      if (active) {
        setData(result);
      }
    });
    return () => {
      active = false;
    };
  }, [store, docId, version]);

  if (!data) {
    return (
      <ScreenScroll>
        <Text className="text-base font-sans text-mint-ink dark:text-dark-mint-ink">
          Loading document…
        </Text>
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll>
      <Text
        testID="reader-title"
        className="text-2xl font-sans font-bold text-mint-ink dark:text-dark-mint-ink"
      >
        {data.document.title}
      </Text>

      {data.pages.map((page) => (
        <View key={page.id} testID={`reader-page-${page.index}`} className="gap-2">
          <Text className="text-sm font-sans text-pink-ink dark:text-dark-pink-ink">
            Page {page.index + 1}
          </Text>
          {page.lines.length === 0 ? (
            <EmptyState message="No text found on this page." />
          ) : (
            <View className="gap-2">
              {page.lines.map((line, index) => (
                <Text
                  key={`${page.id}-${index}`}
                  testID={`reader-line-${page.index}-${index}`}
                  className="text-lg font-sans text-mint-ink dark:text-dark-mint-ink"
                >
                  {line.text}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScreenScroll>
  );
}
