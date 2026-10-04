import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TungCua',
  slug: 'tungcua',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'tungcua',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.tungcua.app',
    infoPlist: {
      NSCameraUsageDescription: 'TungCua needs camera access to scan Chinese documents for on-device text recognition.',
      NSPhotoLibraryUsageDescription: 'TungCua needs photo library access to import images for text recognition.',
      NSDocumentsFolderUsageDescription: 'TungCua needs file access to import PDFs and images for text recognition.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#F6FBF8',
    },
    package: 'com.tungcua.app',
    predictiveBackGestureEnabled: false,
    permissions: [
      'CAMERA',
      'READ_MEDIA_IMAGES',
      'READ_MEDIA_VIDEO',
      'READ_EXTERNAL_STORAGE',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-camera',
      {
        cameraPermission: 'TungCua needs camera access to scan Chinese documents for on-device text recognition.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'TungCua needs photo library access to import images for text recognition.',
      },
    ],
    [
      'expo-document-picker',
      {
        iCloudPermission: 'TungCua needs file access to import PDFs and images for text recognition.',
      },
    ],
    'expo-sqlite',
    [
      'react-native-reanimated',
      {
        // Enable worklets
      },
    ],
    'react-native-gesture-handler',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: 'tungcua',
    },
  },
  owner: 'tungcua',
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/tungcua',
  },
});