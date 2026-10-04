# Implementation Plan: Cross-Platform Refactor (Expo + React Native)

**Branch**: `002-cross-platform-refactor` | **Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-cross-platform-refactor/spec.md`

## Summary

Pivot TungCua from Swift/iOS-only to **Expo SDK 51 + React Native 0.76** (TypeScript strict) with a single codebase for iOS 15+ and Android 8+ (API 26). Shared business logic in `src/shared/` (TypeScript): data models, ML Kit OCR abstraction, OpenCC conversion, dictionary service (WatermelonDB + bundled SQLite), theme tokens (NativeWind/Tailwind). Platform UI: `expo-router` file-based navigation, NativeWind styling, Compose-style components. Native deps via Expo Autolinking/plugins: `react-native-mlkit-text-recognition` (OCR), `react-native-pdf` (rasterize), `watermelondb` (SQLite), `react-native-reanimated`/`gesture-handler` (animations), `expo-speech` (TTS P2). EAS Build for iOS cloud builds + TestFlight; no Mac required. Phased delivery per constitution: P0 capture+OCR → P1 tap+detail → P2 stroke/TTS/bookmarks → P3 paraphrase+export.

## Technical Context

**Language/Version**: TypeScript 5.5 (strict), React Native 0.76, Expo SDK 51, Node 20+

**Primary Dependencies**:
- Navigation: `expo-router` v4 (file-based, typed routes)
- Styling: `nativewind` v4 (Tailwind CSS) + `tailwindcss` v3
- State: `zustand` (global) + `jotai` (atomic) — choose per feature
- Database: `watermelondb` v0.27 (JSI SQLite, reactive) + `expo-sqlite` adapter
- OCR: `react-native-mlkit-text-recognition` v1 (Expo config plugin, loads `zh-Hans`/`zh-Hant`)
- PDF: `react-native-pdf` v13 (Expo config plugin, 300 dpi rasterize)
- Camera/Files: `expo-camera`, `expo-document-picker`, `expo-image-picker`, `expo-file-system`
- Animations: `react-native-reanimated` v3, `react-native-gesture-handler` v2
- TTS: `expo-speech` (P2)
- OpenCC: `opencc-js` (WASM) or `opencc` npm
- Testing: `vitest` (unit), `detox` (integration, EAS), `testing-library/react-native`
- Build: `eas-cli`, `expo-dev-client` for local device testing

**Storage**: WatermelonDB (reactive SQLite) for `ScannedDoc`/`DocPage`/`CharEntry`/`Bookmark`/`LookupHistory`. Bundled read-only `assets/dictionary.sqlite` (built from CC-CEDICT + Unihan + CVDict). Page images + thumbnails in Expo FileSystem `Documents/` directory.

**Testing**: Vitest unit tests for shared logic (dictionary parsing, OpenCC, coordinate mapping, PDF rasterize). Detox integration tests on Android emulator + iOS simulator (EAS). Snapshot corpus accuracy tests (printed/vertical/handwritten) in shared test fixtures. OCR timing gate on device.

**Target Platform**: iOS 15+ / Android 8+ (API 26). Expo SDK 51 managed workflow. EAS Build profiles: development, preview, production.

**Project Type**: cross-platform mobile app (Expo managed)

**Performance Goals**:
- JS bundle < 3 MB gzipped
- OCR < 2 s/page on Snapdragon 7 Gen 1 / A14 equivalent
- Detail-sheet lookup < 200 ms from SQLite
- 60 fps CharGrid scroll
- TalkBack / VoiceOver full coverage

**Constraints**:
- On-device ONLY — no network entitlement/permission for core flow (ML Kit models download at first use, not bundled; count toward install size not JS bundle)
- PDF cap 20 pages; 300 dpi rasterize
- Theme tokens only (NativeWind classes) — no hardcoded hex in views
- Low-confidence underline: pink-ink only (no red)
- Bundle size ≤ 150 MB per platform (dictionary compressed to SQLite, stroke SVGs ODR if needed)
- Expo managed workflow — eject only if required native module has no Expo-compatible package
- Vietnamese gloss source still under curation; placeholder in both apps

**Scale/Scope**: Single-user local app. 7 P0 screens (Home, ScanReview, OCRProgress, Reader, PhotoPicker, FilePicker, Attribution). P0 data: docs ≤20 pages, images ≤20 MB/page. Explicitly excludes P1+ (tap detail, stroke, TTS, bookmarks, correction, search, flashcards, export, sync, paraphrase).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | Evidence |
|---|---|---|
| I. On-Device Only (NON-NEGOTIABLE) | PASS | ML Kit Text Recognition (bundled Chinese models) sole OCR engine. No cloud API. TFLite paraphrase only if P3. Review gate: no network entitlement in app config. |
| II. Character-First Interaction | PASS (phased) | P0 Reader is plain text per spec FR-014, but OcrEngine returns `graphemes` (proportional split) so P1 tap needs no re-OCR. No whole-doc translation view. |
| III. Bilingual Gloss EN + VI | PASS (phased) | No gloss in P0 by design; `vi_gloss` missing → `"⧗ untranslated"` with report affordance. `CharEntry` schema ready for P1. |
| IV. Honest Coverage of Hard Inputs | PASS | Low-confidence (< 0.7) pink-ink underline, `noText`/`failed` states, vertical sort heuristic, handwriting tracked honestly. |
| V. Test-First (NON-NEGOTIABLE) | PASS | Vitest unit tests before impl for dictionary/OpenCC/coordinate mapping/PDF. Snapshot corpus with tier thresholds blocks P0 gate. Detox integration. |
| VI. Simplicity / Phased Delivery | PASS | P0 slice only; P1+ listed as out-of-scope with leak flag in quickstart. Expo managed workflow, no bare. |
| VII. Licensing / Attribution | PASS | Attribution screen + license files in assets. Dictionary compressed to SQLite. ML Kit models downloaded (not bundled). ODR for stroke SVGs if >150 MB. |

Post-Phase-1 re-check: design adds no new scope — data model reserves (not builds) P1/P2 entities; contracts are TS interfaces with no cloud surface; quickstart enforces scope-leak flag. All gates remain PASS with no complexity-tracker entries required.

## Project Structure

### Documentation (this feature)

```text
specs/002-cross-platform-refactor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── p0-interfaces.md # OcrEngine, TextDisplayConversion, ThemeTokens, DictionaryService, DocumentStore, UI routes
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
tungcua/
├── app/                    # expo-router file-based routes
│   ├── _layout.tsx         # Root layout, providers, theme
│   ├── (tabs)/             # Tab-like grouping (Home, Attribution)
│   │   ├── index.tsx       # Home: recents + Scan/Photos/Files
│   │   └── attribution.tsx # License screen
│   ├── scan.tsx            # ScanReview (expo-document-picker + camera)
│   ├── import/
│   │   ├── photos.tsx      # PhotoPicker (expo-image-picker)
│   │   └── files.tsx       # FilePicker (expo-document-picker)
│   ├── ocr/[docId].tsx     # OCRProgress (per-page status)
│   └── reader/[docId].tsx  # Reader (Original|Text, font-size, Trad/Simp, underline)
├── src/
│   ├── shared/             # SINGLE SOURCE OF TRUTH (TypeScript)
│   │   ├── types.ts        # CharEntry, OcrLine, OcrResult, ScannedDoc, DocPage, SnapshotSample
│   │   ├── ocr.ts          # OcrEngine interface + ML Kit impl (platform-specific via native module)
│   │   ├── conversion.ts   # TextDisplayConversion (opencc-js)
│   │   ├── dictionary.ts   # DictionaryService (WatermelonDB)
│   │   ├── store.ts        # DocumentStore (WatermelonDB)
│   │   ├── theme/
│   │   │   ├── tokens.ts   # ThemeTokens (single source)
│   │   │   └── tailwind.config.js # Tailwind config with mint/pink/bg tokens
│   │   ├── pdf.ts          # PDF rasterize (react-native-pdf wrapper)
│   │   └── __tests__/      # Vitest unit tests (shared logic)
│   ├── components/         # Reusable UI components
│   │   ├── CharGrid.tsx    # P1: tappable character grid (uses OcrLine.graphemes)
│   │   ├── CharDetailSheet.tsx # P1: detail sheet
│   │   ├── ThemeProvider.tsx
│   │   └── ui/             # Button, Slider, Toggle, Card, etc.
│   ├── hooks/              # Custom hooks (useOCR, useDictionary, useTheme, etc.)
│   ├── store/              # Zustand/Jotai stores (UI state only)
│   └── utils/              # Helpers (grapheme split, coordinate mapping, etc.)
├── assets/
│   ├── dictionary.sqlite   # Built by scripts/build-dictionary.ts (gitignored, built locally)
│   ├── snapshot-corpus/    # Shared test fixtures (images + manifest.json)
│   │   ├── printed/
│   │   ├── vertical/
│   │   ├── handwritten/
│   │   └── manifest.json
│   ├── fonts/              # SF Pro / Material3 font configs (Expo Font)
│   └── licenses/           # CC-CEDICT, Arphic, Vietnamese placeholder
├── scripts/
│   └── build-dictionary.ts # Build-time: CC-CEDICT + Unihan + CVDict → SQLite
├── eas.json                # EAS Build profiles
├── app.config.ts           # Expo config (permissions, plugins, bundle ID)
├── package.json
├── tsconfig.json
├── tailwind.config.js      # Theme tokens (source of truth)
├── nativewind-env.d.ts
└── metro.config.js
```

**Structure Decision**: Monorepo with `src/shared/` as the single source of truth for all business logic. Platform differences only in native module linking (handled by Expo Autolinking) and minimal platform-specific UI tweaks. `expo-router` provides typed navigation. NativeWind ensures theme tokens are the only styling mechanism.

## Complexity Tracking

No constitution violations to justify. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | — |