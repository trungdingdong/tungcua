import { Text, View } from 'react-native';
import { ScreenScroll } from '../../src/components/ui/Screen';

interface AttributionEntry {
  name: string;
  license: string;
  file: string;
}

export const ATTRIBUTION_ENTRIES: AttributionEntry[] = [
  { name: 'CC-CEDICT', license: 'CC BY-SA 4.0', file: 'CC-CEDICT-BY-SA-4.0.txt' },
  {
    name: 'Make Me a Hanzi',
    license: 'Arphic Public License',
    file: 'MakeMeAHanzi-Arphic.txt',
  },
  {
    name: 'Vietnamese gloss corpus',
    license: 'Placeholder — source pending',
    file: 'Vietnamese-Corpus-PLACEHOLDER.txt',
  },
  { name: 'Noto fonts', license: 'SIL Open Font License 1.1', file: 'Noto-Fonts-OFL.txt' },
];

export default function AttributionScreen() {
  return (
    <ScreenScroll>
      <Text className="text-2xl font-sans font-bold text-mint-ink dark:text-dark-mint-ink">
        Attribution
      </Text>
      <Text className="text-base font-sans text-mint-ink dark:text-dark-mint-ink">
        Bundled data and fonts, with their licenses in assets/licenses/.
      </Text>

      {ATTRIBUTION_ENTRIES.map((entry) => (
        <View
          key={entry.name}
          testID={`attribution-${entry.name}`}
          className="rounded-2xl bg-mint-surface p-4 dark:bg-dark-mint-surface"
        >
          <Text className="text-base font-sans font-semibold text-mint-ink dark:text-dark-mint-ink">
            {entry.name}
          </Text>
          <Text className="text-sm font-sans text-mint-ink dark:text-dark-mint-ink">
            {entry.license}
          </Text>
          <Text className="text-xs font-sans text-pink-ink dark:text-dark-pink-ink">
            {entry.file}
          </Text>
        </View>
      ))}
    </ScreenScroll>
  );
}
