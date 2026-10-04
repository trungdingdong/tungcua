# Quickstart: Validate P0 Cross-Platform (Expo + React Native)

**Feature**: `002-cross-platform-refactor` | **Date**: 2026-10-04
Covers: shared KMP → iOS/Android parity. Details in [`data-model.md`](data-model.md) and [`contracts/p0-interfaces.md`](contracts/p0-interfaces.md).

## Prerequisites

- Node 20+, pnpm 9+, Git
- **Android**: Android Studio (emulator API 34) or physical device (Android 13+)
- **iOS**: No Mac required for build (EAS Build). TestFlight for device testing. Simulator via Xcode on Mac if available.
- Expo CLI: `pnpm dlx expo@latest`
- EAS CLI: `pnpm dlx eas-cli@latest` (for cloud iOS builds)

## Setup (Single Repo)

```bash
git clone https://github.com/trungdingdong/tungcua.git
cd tungcua
pnpm install
# First-time: build dictionary SQLite
pnpm run build:dictionary   # → assets/dictionary.sqlite
# Verify assets exist
ls -la assets/dictionary.sqlite assets/snapshot-corpus/
```

## Validation Scenarios (Both Platforms)

### QS-1 Fresh Clone → Home (SC-008)

```bash
# Android
pnpm expo start --android
# iOS (EAS Build → TestFlight, or local Mac simulator)
pnpm expo start --ios
```

Expect: Home shows recents + Scan / Photos / Files + Attribution. No crash.

### QS-2 Capture Paths (FR-006)

1. **Scan**: Tap Scan → system document scanner → crop/retake → confirm → page listed.
2. **Photos**: Tap Photos → pick image → page listed.
3. **Files**: Tap Files → pick image or ≤20-page PDF → pages rasterized (300 dpi) and listed.
4. **Over-cap PDF**: Pick >20-page PDF → refused with "PDF has N pages; P0 supports up to 20."

### QS-3 OCR + Reader (FR-005, FR-009)

1. Run recognition on printed horizontal Chinese page.
2. Expect: per-page progress → Reader opens.
3. Toggle Original | Text (no data loss).
4. Font-size slider (14–32 pt step 1).
5. Trad/Simp toggle (shared OpenCC, stored text untouched).
6. Low-confidence chars (< 0.7 ML Kit) show pink-ink underline only.
7. Blank page → "No text recognized" state.

### QS-4 Offline (FR-011, SC-005)

1. Enable airplane mode.
2. Repeat QS-2 + QS-3.
3. Identical behavior; no network attempt. Verify no `INTERNET` permission in AndroidManifest / no network entitlement in iOS.

### QS-5 Persistence (FR-008)

1. Recognize doc → force-close app (swipe away) → reopen → doc in recents with text.
2. Delete doc → gone from recents and storage (no orphan files).

### QS-6 Theme + Accessibility (FR-010, SC-006)

1. Toggle light/dark (system or in-app) → surfaces correct, pastels never body text.
2. TalkBack (Android) / VoiceOver (iOS) through Home → Capture → Reader: all controls operable.
3. Dynamic Type / font scaling respected.

### QS-7 Gates (FR-013, SC-002, SC-004)

```bash
# Unit tests (shared logic: dictionary, OpenCC, coordinate mapping, PDF rasterize)
pnpm vitest run

# OCR accuracy (snapshot corpus)
pnpm vitest run --reporter=verbose src/shared/__tests__/ocr.accuracy.test.ts
# Printed tier must meet >= 0.95, zero regressions vs baseline
# Vertical/handwritten tracked separately

# Performance
# Android: printed page OCR < 2 s on Snapdragon 7 Gen 1 / equiv (device)
# iOS: < 2 s on A14+ (TestFlight device)
```

### QS-8 Build Size (SC-007)

```bash
# Android
pnpm eas build --platform android --profile preview
# Check APK size ≤ 150 MB

# iOS
pnpm eas build --platform ios --profile preview
# Check IPA size ≤ 150 MB
```

## Platform-Specific Notes

| Platform | Run Command | Test Device |
|----------|-------------|-------------|
| Android | `pnpm expo start --android` | Emulator API 34 or physical (Android 13+) |
| iOS (local Mac) | `pnpm expo start --ios` | Simulator iOS 17+ |
| iOS (no Mac) | `pnpm eas build --platform ios --profile preview` → TestFlight | Physical iOS 15+ via TestFlight |

## Out of Scope (must NOT appear in P0)

Per-character tap + detail sheet, stroke animation, TTS, bookmarks/history detail, correction UI, search, flashcards, export, cloud sync, paraphrase — P1+. If any ships, flag as scope leak.