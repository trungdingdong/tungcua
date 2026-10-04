# Research: Cross-Platform Refactor (Expo + React Native)

**Feature**: `002-cross-platform-refactor` | **Date**: 2026-10-04
**Scope**: Pivot from Swift/KMP to Expo SDK 51 + React Native 0.76 with Expo Router, NativeWind, WatermelonDB, ML Kit Text Recognition.

## R-01: Cross-Platform Strategy

- **Decision**: Expo managed workflow (not bare) with EAS Build for iOS cloud builds. TypeScript strict, `expo-router` file-based navigation, `nativewind` (Tailwind) for styling, `zustand`/`jotai` for state.
- **Rationale**: Constitution mandates Expo. Single codebase for iOS/Android, no Mac required for iOS builds (EAS Build + TestFlight). Native dependencies via Expo Autolinking/plugins. Faster iteration than KMP + native UI.
- **Alternatives considered**: KMP + SwiftUI/Compose (rejected — constitution pivot); Flutter (rejected — ML Kit integration less mature, larger binary); bare React Native (rejected — no EAS, Mac required for iOS).

## R-02: OCR Engine — Google ML Kit Text Recognition

- **Decision**: `react-native-mlkit-text-recognition` (Expo-compatible). Load both `zh-Hans` and `zh-Hant` models at first use (auto-download ~20 MB each). Returns `Text.Element` clusters (words/lines). Heuristic split by Unicode grapheme cluster + proportional x-bounds for per-character tap targets. Confidence per element; low-confidence (< 0.7) = pink underline.
- **Rationale**: Constitution mandates ML Kit. On-device, supports Chinese, Latin, Japanese, Korean. No cloud. Expo config plugin available. Models downloaded at first use, not bundled.
- **Alternatives considered**: Tesseract via `react-native-tesseract-ocr` (rejected — slower, lower Chinese accuracy, larger bundle); cloud Vision API (rejected — violates principle I).

## R-03: Vertical Text Handling

- **Decision**: ML Kit reads LTR. Post-process: sort elements by `y` then `x` descending for Trad vertical right-to-left columns. Heuristic: if page aspect ratio > 1.5 and median char width > height, treat as vertical.
- **Rationale**: ML Kit doesn't natively output vertical reading order. Matches iOS Vision custom sort approach (spec R-04).
- **Alternatives considered**: Tesseract with vertical-trained models (rejected — adds second engine complexity).

## R-04: PDF Rasterization

- **Decision**: `react-native-pdf` renders page to bitmap at 300 dpi → feed to ML Kit. Cap MVP at 20 pages per document. Process sequentially to bound memory.
- **Rationale**: Constitution specifies this approach. `react-native-pdf` has Expo config plugin.
- **Alternatives considered**: `pdf.js` + canvas (rejected — slower, memory-heavy on mobile).

## R-05: Dictionary & Data Storage

- **Decision**: Build-time `scripts/build-dictionary.ts` → `assets/dictionary.sqlite` bundled. WatermelonDB lazy-loads with indexes on `char`, `radical`, `pinyin`. Schema: `CharEntry` (char, pinyin, hanviet, en_gloss, vi_gloss, radical, strokes, hsk, freq, decomposition, trad_simp_variant).
- **Rationale**: Constitution mandates WatermelonDB + bundled SQLite. WatermelonDB is React Native native SQLite (JSI), performant for 125k+ entries. Build script ensures identical DB on both platforms.
- **Alternatives considered**: `expo-sqlite` raw (rejected — no reactive queries, manual sync); Realm (rejected — larger, no Expo plugin).

## R-06: Stroke Order Animation

- **Decision**: hanzi-writer-data JSON → compressed per-char (gzip) in assets or Expo ODR. Render via `react-native-svg` + `react-native-reanimated` path interpolation. P2 scope.
- **Rationale**: Constitution mandates ODR if bundle > 150 MB. `react-native-reanimated` is Expo-compatible (worklet).
- **Alternatives considered**: Lottie (rejected — larger, less control); Canvas draw (rejected — no gesture handler for practice mode).

## R-07: Theme Tokens

- **Decision**: `tailwind.config.js` defines `mint.*`, `pink.*`, `bg.*` with light/dark hex from `DesignPrinciples.md`. Views use only tokens via `nativewind` `className` — no hardcoded hex. Dark mode via `class` strategy on root.
- **Rationale**: Constitution mandates token-only, NativeWind. Matches DesignPrinciples.md exactly.
- **Alternatives considered**: `react-native-styled-components` (rejected — runtime overhead, no Tailwind compatibility); CSS-in-JS custom (rejected — reinventing tokens).

## R-08: OpenCC Conversion

- **Decision**: `opencc-js` (WASM) or `opencc` npm (JS port) in shared TS. Pure function `display(text, variant)` — never mutates stored text. Byte-for-byte match with Swift OpenCC output verified in tests.
- **Rationale**: Must run in JS thread. `opencc-js` is WASM, fast enough for per-char conversion on tap. No native module needed.
- **Alternatives considered**: JNI Swift OpenCC via KMP (rejected — not Expo); server API (rejected — principle I).

## R-09: TTS

- **Decision**: `expo-speech` with platform voices (`zh-CN`, `zh-TW`, `vi-VN`, `en-US`). P2 scope.
- **Rationale**: Constitution mandates. Expo managed, no native config needed.

## R-10: Testing Strategy

- **Decision**: Unit tests via Vitest (shared logic: dictionary parsing, OpenCC, ML Kit coordinate mapping, PDF rasterization). Integration via Detox on Android emulator + iOS simulator (EAS). OCR accuracy validated with fixed snapshot corpus (printed/vertical/handwritten).
- **Rationale**: Constitution mandates Vitest + Detox. Expo-compatible. EAS runs iOS sim tests without Mac locally.
- **Alternatives considered**: Jest (rejected — Vitest faster, better ESM); Appium (rejected — slower, flakier).

## R-11: App Configuration

- **Decision**: `app.config.ts` with EAS build profiles (development, preview, production). Bundle identifier `com.tungcua.app` (both iOS/Android). Permissions: camera, media library, file access. Expo SDK 51, React Native 0.76.
- **Rationale**: Constitution specifies iOS 15+ / Android 8+ (API 26). Expo SDK 51 matches.
- **Alternatives considered**: None — config is standard Expo.

## R-12: Performance Budgets

- **Decision**: JS bundle < 3 MB gzipped. OCR < 2 s/page on Snapdragon 7 Gen 1 / A14 equivalent. Detail-sheet lookup < 200 ms from SQLite. 60 fps CharGrid scroll. TalkBack/VoiceOver full coverage.
- **Rationale**: Constitution mandates. Measurable, technology-agnostic outcomes.

## Resolved Status

No `NEEDS CLARIFICATION` remains. Constitution v2.0.0 (Expo) supersedes spec's KMP assumption. All tech choices locked by constitution. Spec assumptions updated accordingly.