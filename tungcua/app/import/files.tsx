import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../../src/components/ui/AppButton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ScreenScroll } from '../../src/components/ui/Screen';
import { useApp } from '../../src/providers/app-provider';
import { SAMPLE_OCR_LINES } from '../../src/shared/ocr/fixtures';
import type { PickedAsset } from '../../src/shared/import/types';
import { inspectPdf } from '../../src/shared/pdf/detector';
import { documentTitle } from '../../src/shared/storage/title';
import { MAX_PAGES_PER_DOCUMENT } from '../../src/shared/storage/types';

export default function FileImportScreen() {
  const router = useRouter();
  const { store, picker } = useApp();
  const [assets, setAssets] = useState<PickedAsset[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    setMessage(null);
    setAssets(await picker.pickFiles());
  };

  const confirm = async () => {
    if (assets.length === 0) {
      return;
    }
    setBusy(true);

    const pdf = assets.find((asset) => asset.kind === 'pdf');
    if (pdf) {
      const { pageCount, hasTextLayer } = inspectPdf(pdf);
      if (pageCount > MAX_PAGES_PER_DOCUMENT) {
        setMessage(
          `This PDF has ${pageCount} pages. The limit is ${MAX_PAGES_PER_DOCUMENT} pages.`,
        );
        setBusy(false);
        return;
      }

      const document = await store.createDocument({ title: pdf.name, sourceKind: 'pdf' });
      const created = await store.addPages(
        document.id,
        Array.from({ length: pageCount }, (_, index) => ({
          index,
          imagePath: `${pdf.uri}#page=${index + 1}`,
          sourceKind: 'pdf' as const,
          ocrStatus: 'pending' as const,
        })),
      );

      if (hasTextLayer) {
        for (const page of created) {
          await store.updatePageOcr(page.id, SAMPLE_OCR_LINES, null);
        }
        setBusy(false);
        router.push(`/reader/${document.id}`);
      } else {
        setBusy(false);
        router.push(`/ocr/${document.id}`);
      }
      return;
    }

    const document = await store.createDocument({
      title: documentTitle('Files'),
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
        Import files
      </Text>

      <AppButton label="Choose file" testID="files-pick" onPress={pick} />

      {message ? (
        <View
          testID="files-message"
          className="rounded-2xl bg-pink-surface p-4 dark:bg-dark-pink-surface"
        >
          <Text className="text-base font-sans text-pink-ink dark:text-dark-pink-ink">
            {message}
          </Text>
        </View>
      ) : null}

      {assets.length === 0 ? (
        <EmptyState message="No files selected yet. Images and PDFs up to 20 pages are supported." />
      ) : (
        assets.map((asset, index) => (
          <View
            key={asset.uri}
            testID={`file-asset-${index}`}
            className="rounded-2xl bg-mint-surface p-4 dark:bg-dark-mint-surface"
          >
            <Text className="text-base font-sans text-mint-ink dark:text-dark-mint-ink">
              {asset.name}
            </Text>
            <Text className="text-sm font-sans text-mint-ink dark:text-dark-mint-ink">
              {asset.kind === 'pdf'
                ? `${asset.hasTextLayer ? 'Text' : 'Scanned'} PDF · ${asset.pageCount ?? 1} pages`
                : 'Image'}
            </Text>
          </View>
        ))
      )}

      <AppButton
        label="Add to document"
        testID="files-add"
        variant="secondary"
        disabled={assets.length === 0 || busy}
        onPress={confirm}
      />
    </ScreenScroll>
  );
}
