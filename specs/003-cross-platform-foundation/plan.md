# Implementation Plan: Cross-Platform Foundation (iOS + Android)

**Branch**: `003-cross-platform-foundation` | **Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-cross-platform-foundation/spec.md`

## Summary

Build a single TypeScript (strict) Expo/React Native codebase targeting iOS and Android that delivers P0: camera capture with review, gallery/file import (images + PDFs up to 20 pages), on-device OCR via bundled ML Kit Chinese model, and a Reader with Original|Text toggle, font size, Trad/Simp display conversion (OpenCC JS), and pink-ink low-confidence underline. All user data in local SQLite via `expo-sqlite` with typed query layer (Drizzle), page images in document directory. Navigation via `expo-router`, styling via NativeWind, state via Zustand. CI validates no network permission, offline-only operation. Spikes first: (a) ML Kit wrapper with bundled Chinese model on both platforms, (b) PDF text extraction + page rendering.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React Native (version from current stable Expo SDK), Node.js (version required by chosen Expo SDK)

**Primary Dependencies**:
- `expo` (current stable SDK), `expo-router`, `expo-dev-client`, `expo-camera`, `expo-image-picker`, `expo-document-picker`, `expo-file-system`, `expo-font`, `expo-speech`, `expo-sqlite`
- `nativewind` (Tailwind CSS), `tailwindcss`
- `zustand` (UI state)
- `drizzle-orm` (typed query layer over `expo-sqlite`)
- `opencc-js` or `opencc` (Trad/Simp conversion)
- `ml-kit` wrapper (spike-proven for bundled Chinese model)
- `react-native-reanimated`, `react-native-gesture-handler` (animations)
- `pnpm` package manager

**Storage**: Local SQLite via `expo-sqlite` with Drizzle ORM for user data (documents, pages, recognized text, image paths). Page images and thumbnails in app document directory (`expo-file-system`). Future read-only dictionary in separate `assets/dictionary.sqlite` (P1+). No WatermelonDB, no Room, no SwiftData.

**Testing**: Jest with Expo preset (unit tests written first). Maestro for e2e flows on Android emulator and iOS simulator. Snapshot corpus (printed/vertical/handwritten) checked into repo; printed tier gates at 0.95 char accuracy. CI verifies no network permission in release config.

**Target Platform**: iOS and Android at minimum versions of current stable Expo SDK. iOS builds via EAS Build (cloud) + TestFlight; no Mac required. Android via local emulator/device with development build (`expo-dev-client`). Expo Go NOT supported.

**Project Type**: Cross-platform mobile app (Expo managed workflow with Continuous Native Generation / prebuild).

**Performance Goals** (measured on real devices, not emulators):
- OCR < 2 s per printed page on Snapdragon 7 Gen 1 class / iPhone 13 class
- Detail-sheet lookup < 200 ms (P1+)
- 60 fps Reader/CharGrid scroll
- JS bundle < 3 MB gzipped
- TalkBack / VoiceOver full coverage

**Constraints**:
- On-device only: ML Kit Chinese model BUNDLED (not downloaded at runtime). No Tesseract, no cloud OCR, no runtime data downloads. No network permission in release config.
- PDF: detect embedded text layer first; else render at ~300 dpi equivalent. Cap 20 pages, 20 MB/page image.
- Theme: single token source in `tailwind.config.js` (mint/pink/bg, light/dark, `class` strategy). No hardcoded hex in views. Pastels for surfaces only.
- Fonts: Noto Sans SC + one rounded Latin font, bundled via `expo-font`. No Apple-only fonts.
- Navigation: `expo-router` file-based typed routes.
- State: Zustand for UI state only; persisted data from SQLite.
- Native code only when spike proves gap; otherwise use maintained packages with config plugins/autolinking.
- CI: verifies no network permission in release app config; no network calls during core flow.
- Banned: WatermelonDB, Tesseract, Kotlin Multiplatform, SwiftData, Room, any cloud API.

**Scale/Scope**: Single-user local app. P0 screens: Home (Recents + actions), Camera Review, Import (Photos/Files), OCR Progress, Reader, Attribution. User data: documents ≤20 pages, images ≤20 MB/page. P1+ entities reserved in schema but not implemented.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | Evidence |
|---|---|---|
| I. On-Device Only (NON-NEGOTIABLE) | PASS | ML Kit Chinese model bundled; no runtime download; no Tesseract/cloud fallback; no network permission in release config; CI verifies. |
| II. Character-First Interaction | PASS (phased) | P0 OcrEngine returns per-character (grapheme) entries with approximate bounds; P1 will add tap/detail. No whole-doc translation. |
| III. Bilingual Gloss EN + VI | PASS (phased) | P0 ships no dictionary; P1+ will implement with `vi_gloss` = "untranslated" + report affordance. Vietnamese source license verified before P1. |
| IV. Honest Coverage of Hard Inputs | PASS | Vertical/handwriting best-effort; documented heuristic; low-confidence (<0.7) pink-ink underline; UI never claims false accuracy. |
| V. Test-First (NON-NEGOTIABLE) | PASS | Jest unit tests before impl (coordinate mapping, grapheme split, Trad/Simp, PDF text-layer, DB). Maestro e2e on emulators. Snapshot corpus gates printed ≥0.95. CI checks no network permission. |
| VI. Simplicity and Phased Delivery | PASS | P0 only (capture+OCR+read). P1+ deferred. One state lib (Zustand), one DB (SQLite). Native only when spike proves gap. |
| VII. Licensing and Attribution Compliance | PASS | Attribution screen + license files in bundle. Fonts (Noto Sans SC, rounded Latin) redistributable. Bundle ≤150 MB including ML Kit model. Stroke data trimmed subset; runtime download requires Principle I amendment. |

Post-Phase-1 re-check: design adds no new scope; spikes validate native dependencies; contracts are TS interfaces; quickstart enforces scope boundaries. All gates remain PASS.

## Project Structure

### Documentation (this feature)

```text
specs/003-cross-platform-foundation/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── ocr-engine.md    # OcrEngine interface + types
│   ├── storage.md       # Database schema + query layer
│   ├── conversion.md    # Trad/Simp conversion interface
│   ├── theme.md         # Theme tokens (tailwind.config.js reference)
│   └── navigation.md    # expo-router routes
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
tungcua/
├── app/                          # expo-router file-based routes
│   ├── _layout.tsx               # Root layout, providers, theme
│   ├── (tabs)/
│   │   ├── index.tsx             # Home: Recents + Scan/Import/Attribution
│   │   └── attribution.tsx       # Attribution screen
│   ├── scan.tsx                  # Camera capture with review
│   ├── import/
│   │   ├── photos.tsx            # Gallery import
│   │   └── files.tsx             # File import (images + PDF)
│   ├── ocr/[docId].tsx           # OCR Progress per page
│   └── reader/[docId].tsx        # Reader: Original|Text, font, Trad/Simp, underline
├── src/
│   ├── shared/                   # Platform-agnostic business logic
│   │   ├── ocr/
│   │   │   ├── types.ts          # OcrEngine, OcrResult, OcrLine, OcrGrapheme
│   │   │   ├── engine.ts         # ML Kit implementation (platform-specific via native module)
│   │   │   ├── reading-order.ts  # Top-to-bottom LTR + vertical heuristic
│   │   │   └── grapheme.ts       # Unicode grapheme split + proportional bounds
│   │   ├── pdf/
│   │   │   ├── types.ts
│   │   │   ├── detector.ts       # Text layer detection
│   │   │   └── renderer.ts       # Page rendering to image (~300 dpi)
│   │   ├── storage/
│   │   │   ├── schema.ts         # Drizzle schema: documents, pages, settings
│   │   │   ├── queries.ts        # Typed query layer
│   │   │   └── migrations.ts     # Schema versioning
│   │   ├── conversion/
│   │   │   └── opencc.ts         # Trad/Simp display conversion (OpenCC JS)
│   │   ├── theme/
│   │   │   └── tokens.ts         # Re-exports from tailwind.config.js (single source)
│   │   └── test-utils/           # Shared test helpers (mock OcrEngine, fixtures)
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Button, Slider, Toggle, Card, etc. (NativeWind)
│   │   ├── ScanReview.tsx        # Camera review (retake/crop/page list)
│   │   ├── OcrProgress.tsx       # Per-page status list
│   │   ├── ReaderView.tsx        # Reader with controls
│   │   └── AttributionView.tsx   # License screen
│   ├── hooks/                    # Custom hooks (useOcr, useDocuments, useTheme, etc.)
│   ├── store/                    # Zustand store (UI state only)
│   └── utils/                    # Helpers (file paths, formatting, etc.)
├── assets/
│   ├── fonts/                    # Noto Sans SC, rounded Latin (expo-font)
│   ├── mlkit/                    # Bundled ML Kit Chinese model (platform-specific)
│   └── licenses/                 # CC-CEDICT, MakeMeAHanzi, Vietnamese placeholder
├── scripts/
│   └── build-dictionary.ts       # P1+: builds assets/dictionary.sqlite
├── e2e/
│   └── maestro/                  # Maestro flows (scan, import, read, persist, offline)
├── __tests__/                    # Jest unit tests (Expo preset)
├── tailwind.config.js            # Theme tokens (single source)
├── nativewind-env.d.ts
├── expo-env.d.ts
├── app.config.ts                 # Expo config (plugins, permissions, bundle ID)
├── eas.json                      # EAS Build profiles
├── package.json
├── tsconfig.json
├── metro.config.js
├── drizzle.config.ts             # Drizzle config
└── README.md                     # Developer setup, commands, CI
```

**Structure Decision**: Monorepo with `src/shared/` as single source of truth for business logic (ocr, pdf, storage, conversion, theme). Platform differences only in native module configuration (ML Kit wrapper, PDF renderer) handled via Expo config plugins. `expo-router` provides typed navigation. NativeWind ensures theme tokens are the only styling mechanism. Drizzle over `expo-sqlite` gives typed queries without WatermelonDB overhead.

## Complexity Tracking

No constitution violations to justify. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | — |