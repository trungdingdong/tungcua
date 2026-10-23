import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

export function Screen({ children }: { children: ReactNode }) {
  return <View className="flex-1 bg-bg-base dark:bg-dark-bg-base">{children}</View>;
}

export function ScreenScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      className="flex-1 bg-bg-base dark:bg-dark-bg-base"
      contentContainerClassName="p-5 gap-4"
    >
      {children}
    </ScrollView>
  );
}
