import { describe, expect, it } from '@jest/globals';
import AttributionScreen, {
  ATTRIBUTION_ENTRIES,
} from '../../app/(tabs)/attribution';
import { renderWithProviders } from '../../src/shared/test-utils';

describe('AttributionScreen', () => {
  it('lists every bundled license and credit', async () => {
    const view = await renderWithProviders(<AttributionScreen />);

    for (const entry of ATTRIBUTION_ENTRIES) {
      expect(view.getByText(entry.name)).toBeTruthy();
      expect(view.getByText(entry.license)).toBeTruthy();
      expect(view.getByText(entry.file)).toBeTruthy();
    }
  });

  it('includes CC-CEDICT, Make Me a Hanzi, Vietnamese placeholder and Noto fonts', () => {
    const names = ATTRIBUTION_ENTRIES.map((entry) => entry.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'CC-CEDICT',
        'Make Me a Hanzi',
        'Vietnamese gloss corpus',
        'Noto fonts',
      ]),
    );
  });
});
