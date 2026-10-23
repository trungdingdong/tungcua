import { Pressable, Text } from 'react-native';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

const CONTAINER: Record<AppButtonVariant, string> = {
  primary: 'bg-mint-primary dark:bg-dark-mint-primary',
  secondary: 'bg-pink-surface dark:bg-dark-pink-surface',
  ghost: 'bg-transparent',
};

const LABEL: Record<AppButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-pink-ink dark:text-dark-pink-ink',
  ghost: 'text-mint-ink dark:text-dark-mint-ink',
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityLabel,
  testID,
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      testID={testID}
      onPress={onPress}
      className={`rounded-2xl px-4 py-3 items-center justify-center ${CONTAINER[variant]} ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <Text className={`text-base font-semibold ${LABEL[variant]}`}>{label}</Text>
    </Pressable>
  );
}
