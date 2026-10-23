import { describe, expect, it } from '@jest/globals';
import { createMemoryDocumentStore } from '../../src/shared/storage/memory-store';

describe('createMemoryDocumentStore', () => {
  it('creates documents and returns them newest-first from getRecents', async () => {
    const store = createMemoryDocumentStore();
    const first = await store.createDocument({ title: 'First', sourceKind: 'scan' });
    const second = await store.createDocument({ title: 'Second', sourceKind: 'photo' });

    const recents = await store.getRecents();
    expect(recents.map((doc) => doc.id)).toEqual([second.id, first.id]);
  });

  it('adds pages and derives document status from page OCR status', async () => {
    const store = createMemoryDocumentStore();
    const doc = await store.createDocument({ title: 'Doc', sourceKind: 'scan' });
    const pages = await store.addPages(doc.id, [
      { index: 0, imagePath: 'a.jpg', sourceKind: 'scan', ocrStatus: 'pending' },
      { index: 1, imagePath: 'b.jpg', sourceKind: 'scan', ocrStatus: 'pending' },
    ]);

    expect(pages).toHaveLength(2);
    expect((await store.getDocument(doc.id))?.status).toBe('ready');

    await store.updatePageOcr(
      pages[0].id,
      [{ text: '山水', bounds: { x: 0, y: 0, width: 1, height: 1 }, confidence: 0.9, graphemes: [] }],
      null,
    );
    expect((await store.getDocument(doc.id))?.status).toBe('ready');

    await store.updatePageStatus(pages[1].id, 'noText');
    expect((await store.getDocument(doc.id))?.status).toBe('recognized');
  });

  it('replaces lines idempotently on re-recognition', async () => {
    const store = createMemoryDocumentStore();
    const doc = await store.createDocument({ title: 'Doc', sourceKind: 'scan' });
    const [page] = await store.addPages(doc.id, [
      { index: 0, imagePath: 'a.jpg', sourceKind: 'scan', ocrStatus: 'pending' },
    ]);

    const line = {
      text: 'first',
      bounds: { x: 0, y: 0, width: 1, height: 1 },
      confidence: 0.5,
      graphemes: [],
    };
    await store.updatePageOcr(page.id, [line], null);
    await store.updatePageOcr(page.id, [], null);

    const [stored] = await store.getPages(doc.id);
    expect(stored.lines).toHaveLength(0);
    expect(stored.ocrStatus).toBe('noText');
  });

  it('cascades delete from document to pages', async () => {
    const store = createMemoryDocumentStore();
    const doc = await store.createDocument({ title: 'Doc', sourceKind: 'scan' });
    await store.addPages(doc.id, [
      { index: 0, imagePath: 'a.jpg', sourceKind: 'scan', ocrStatus: 'pending' },
    ]);

    await store.deleteDocument(doc.id);

    expect(await store.getDocument(doc.id)).toBeNull();
    expect(await store.getPages(doc.id)).toHaveLength(0);
  });

  it('updates settings with a single upserted row', async () => {
    const store = createMemoryDocumentStore();
    await store.updateSettings({ theme: 'dark', fontSize: 24 });

    const settings = await store.getSettings();
    expect(settings).toMatchObject({ id: 1, theme: 'dark', fontSize: 24 });
  });
});
