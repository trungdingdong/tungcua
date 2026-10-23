import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../../src/components/ui/AppButton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ScreenScroll } from '../../src/components/ui/Screen';
import { useApp } from '../../src/providers/app-provider';
import type { Page, PageOcrStatus } from '../../src/shared/storage/types';
import { useStoreVersion } from '../../src/store/use-store-version';

const STATUS_LABEL: Record<PageOcrStatus, string> = {
  pending: 'Waiting',
  recognizing: 'Recognizing…',
  recognized: 'Recognized',
  noText: 'No text found',
  failed: 'Failed',
};

export default function OcrProgressScreen() {
  const { docId } = useLocalSearchParams<{ docId: string }>();
  const router = useRouter();
  const { store, engine } = useApp();
  const version = useStoreVersion(store);
  const [pages, setPages] = useState<Page[]>([]);
  const [done, setDone] = useState(false);
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!docId) {
      return;
    }
    void store.getPages(docId).then((result) => {
      if (active) {
        setPages(result);
      }
    });
    return () => {
      active = false;
    };
  }, [store, docId, version]);

  useEffect(() => {
    if (!docId || startedFor.current === docId) {
      return;
    }
    startedFor.current = docId;

    void (async () => {
      await store.updateDocumentStatus(docId, 'recognizing');
      const queued = await store.getPages(docId);

      for (const page of queued) {
        await store.updatePageStatus(page.id, 'recognizing');
        const result = await engine.recognize(page.imagePath);

        if (result.status === 'ok') {
          const average = result.lines.length
            ? result.lines.reduce((sum, line) => sum + line.confidence, 0) /
              result.lines.length
            : null;
          await store.updatePageOcr(page.id, result.lines, average);
        } else if (result.status === 'noText') {
          await store.updatePageOcr(page.id, [], null);
        } else {
          await store.updatePageStatus(page.id, 'failed');
        }
      }

      await store.updateDocumentStatus(docId, 'recognized');
      setDone(true);
    })();
  }, [docId, store, engine]);

  return (
    <ScreenScroll>
      <Text className="text-2xl font-sans font-bold text-mint-ink dark:text-dark-mint-ink">
        Recognizing text
      </Text>

      {pages.length === 0 ? (
        <EmptyState message="No pages to recognize." />
      ) : (
        pages.map((page) => (
          <View
            key={page.id}
            testID={`ocr-page-${page.index}`}
            className="flex-row items-center justify-between rounded-2xl bg-mint-surface p-4 dark:bg-dark-mint-surface"
          >
            <Text className="text-base font-sans text-mint-ink dark:text-dark-mint-ink">
              Page {page.index + 1}
            </Text>
            <Text
              testID={`ocr-status-${page.index}`}
              className="text-sm font-sans text-mint-ink dark:text-dark-mint-ink"
            >
              {STATUS_LABEL[page.ocrStatus]}
            </Text>
          </View>
        ))
      )}

      <AppButton
        label="Open reader"
        testID="ocr-open-reader"
        disabled={!done}
        onPress={() => router.push(`/reader/${docId}`)}
      />
    </ScreenScroll>
  );
}
