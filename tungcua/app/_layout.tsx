import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';
import { AppProvider } from '../src/providers/app-provider';
import { useUiStore } from '../src/store/ui-store';

function RootNavigator() {
  const theme = useUiStore((state) => state.theme);
  const systemScheme = useColorScheme();
  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

  return (
    <View className={isDark ? 'dark flex-1' : 'flex-1'}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ title: 'Scan' }} />
        <Stack.Screen name="import/photos" options={{ title: 'Import Photos' }} />
        <Stack.Screen name="import/files" options={{ title: 'Import Files' }} />
        <Stack.Screen name="ocr/[docId]" options={{ title: 'Recognizing' }} />
        <Stack.Screen name="reader/[docId]" options={{ title: 'Reader' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}
