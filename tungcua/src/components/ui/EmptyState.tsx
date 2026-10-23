import { Text, View } from 'react-native';

export function EmptyState({ message }: { message: string }) {
  return (
    <View className="rounded-2xl bg-mint-surface p-5 dark:bg-dark-mint-surface">
      <Text className="text-base font-sans text-mint-ink dark:text-dark-mint-ink">
        {message}
      </Text>
    </View>
  );
}

export function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-2xl bg-bg-alt p-4 dark:bg-dark-bg-alt">{children}</View>
  );
}
