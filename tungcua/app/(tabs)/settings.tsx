import { Text, View } from 'react-native';
import { AppButton } from '../../src/components/ui/AppButton';
import { ScreenScroll } from '../../src/components/ui/Screen';
import { useApp } from '../../src/providers/app-provider';
import {
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  type ScriptVariant,
  type ThemeMode,
} from '../../src/shared/storage/types';
import { useUiStore } from '../../src/store/ui-store';

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const VARIANTS: { value: ScriptVariant; label: string }[] = [
  { value: 'traditional', label: 'Traditional' },
  { value: 'simplified', label: 'Simplified' },
];

const FONT_STEP = 2;

export default function SettingsScreen() {
  const { store } = useApp();
  const theme = useUiStore((state) => state.theme);
  const fontSize = useUiStore((state) => state.fontSize);
  const scriptVariant = useUiStore((state) => state.scriptVariant);
  const setTheme = useUiStore((state) => state.setTheme);
  const setFontSize = useUiStore((state) => state.setFontSize);
  const setScriptVariant = useUiStore((state) => state.setScriptVariant);

  const chooseTheme = (value: ThemeMode) => {
    setTheme(value);
    void store.updateSettings({ theme: value });
  };

  const changeFontSize = (delta: number) => {
    const next = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, fontSize + delta));
    setFontSize(next);
    void store.updateSettings({ fontSize: next });
  };

  const chooseVariant = (value: ScriptVariant) => {
    setScriptVariant(value);
    void store.updateSettings({ scriptVariant: value });
  };

  return (
    <ScreenScroll>
      <Text className="text-2xl font-sans font-bold text-mint-ink dark:text-dark-mint-ink">
        Settings
      </Text>

      <Text className="text-lg font-sans font-semibold text-mint-ink dark:text-dark-mint-ink">
        Theme
      </Text>
      {THEMES.map((option) => (
        <AppButton
          key={option.value}
          label={option.label}
          testID={`settings-theme-${option.value}`}
          variant={theme === option.value ? 'primary' : 'ghost'}
          onPress={() => chooseTheme(option.value)}
        />
      ))}

      <Text className="text-lg font-sans font-semibold text-mint-ink dark:text-dark-mint-ink">
        Font size ({fontSize} pt)
      </Text>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <AppButton
            label="Smaller"
            testID="settings-font-decrease"
            variant="secondary"
            onPress={() => changeFontSize(-FONT_STEP)}
          />
        </View>
        <View className="flex-1">
          <AppButton
            label="Larger"
            testID="settings-font-increase"
            variant="secondary"
            onPress={() => changeFontSize(FONT_STEP)}
          />
        </View>
      </View>

      <Text className="text-lg font-sans font-semibold text-mint-ink dark:text-dark-mint-ink">
        Display script
      </Text>
      {VARIANTS.map((option) => (
        <AppButton
          key={option.value}
          label={option.label}
          testID={`settings-variant-${option.value}`}
          variant={scriptVariant === option.value ? 'primary' : 'ghost'}
          onPress={() => chooseVariant(option.value)}
        />
      ))}
    </ScreenScroll>
  );
}
