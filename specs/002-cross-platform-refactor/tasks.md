# Tasks: Cross-Platform Refactor (Expo + React Native)

**Input**: Design documents from `/specs/002-cross-platform-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Tests**: Requested — constitution principle V (test-first, NON-NEGOTIABLE). Test tasks included and MUST be written first, verified FAIL before implementation.
**Organization**: Grouped by user story; each story independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths in every description.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Expo project init, tooling, dictionary build script, legal hygiene

- [ ] T001 Initialize Expo SDK 51 project with TypeScript strict (`npx create-expo-app@latest tungcua --template blank-typescript`) in repo root
- [ ] T002 Install core dependencies: `expo-router@4`, `nativewind@4`, `tailwindcss@3`, `zustand`, `jotai`, `watermelondb@0.27`, `expo-sqlite`, `react-native-mlkit-text-recognition@1`, `react-native-pdf@13`, `expo-camera`, `expo-document-picker`, `expo-image-picker`, `expo-file-system`, `expo-speech`, `react-native-reanimated@3`, `react-native-gesture-handler@2`, `opencc-js` (or `opencc`)
- [ ] T003 Install dev dependencies: `vitest`, `@testing-library/react-native`, `detox`, `eslint`, `prettier`, `typescript@5.5`
- [ ] T004 Configure NativeWind: `tailwind.config.js` with `mint.*`, `pink.*`, `bg.*` tokens from `DesignPrinciples.md` (light/dark hex), `nativewind-env.d.ts`, `metro.config.js` with NativeWind plugin
- [ ] T005 Configure `app.config.ts`: bundle ID `com.tungcua.app`, permissions (camera, media-library, file access), plugins for ML Kit / PDF / reanimated / gesture-handler, EAS build profiles (development, preview, production)
- [ ] T006 Configure `eas.json` with build profiles for iOS (EAS Build) and Android
- [ ] T007 [P] Add license texts (CC-CEDICT CC BY-SA, MakeMeAHanzi Arphic, Vietnamese corpus placeholder) in `assets/licenses/`
- [ ] T008 [P] Update `.gitignore`: add `.expo/`, `dist/`, `build/`, `node_modules/`, `assets/dictionary.sqlite` (built locally), `*.log`, `.DS_Store`
- [ ] T009 Create dictionary build script `scripts/build-dictionary.ts`: reads CC-CEDICT + Unihan + CVDict CSVs/JSONs → writes `assets/dictionary.sqlite` with `CharEntry` schema (indexes on `char`, `radical`, `pinyin`)
- [ ] T010 [P] Check in snapshot corpus fixtures with ground truth + thresholds (printed ≥ 0.95 gating, vertical ≥ 0.80 tracked, handwritten ≥ 0.60 tracked) in `assets/snapshot-corpus/`
- [ ] T011 Remove Sync Impact Report HTML comment from `.specify/memory/constitution.md` before first commit

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, theme tokens, database schema, OCR engine interface, conversion, store, PDF rasterize — MUST complete before ANY user story

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T012 Write Vitest unit tests FIRST for shared types (CharEntry validation, OcrLine bounds normalization, OcrStatus enum) in `src/shared/__tests__/types.test.ts`
- [ ] T013 [P] Write Vitest tests FIRST for OpenCC conversion (traditional↔simplified round-trip, empty string stable) in `src/shared/__tests__/conversion.test.ts`
- [ ] T014 [P] Write Vitest tests FIRST for dictionary service (get by char, search prefix, missing vi_gloss returns "⧗ untranslated") in `src/shared/__tests__/dictionary.test.ts`
- [ ] T015 [P] Write Vitest tests FIRST for PDF rasterize (page count cap 20, 300 dpi scale, per-page ≤ 20 MB) in `src/shared/__tests__/pdf.test.ts`
- [ ] T016 [P] Write Vitest tests FIRST for coordinate mapping (ML Kit element → grapheme split, bounds 0–1 normalized) in `src/shared/__tests__/coordinate-mapping.test.ts`
- [ ] T017 Implement shared TypeScript types (`CharEntry`, `OcrLine`, `OcrResult`, `ScannedDoc`, `DocPage`, `SnapshotSample`, `ScriptVariant`) in `src/shared/types.ts`
- [ ] T018 Implement ThemeTokens (colors light/dark, spacing, typography) in `src/shared/theme/tokens.ts` — single source matching `tailwind.config.js` and `DesignPrinciples.md`
- [ ] T019 Implement `TextDisplayConversion` using `opencc-js` (WASM) in `src/shared/conversion.ts` — pure function `display(text, variant)`, never mutates stored text
- [ ] T020 Implement `OcrEngine` interface + ML Kit implementation in `src/shared/ocr.ts`: `recognize(imageUri)`, `ensureModelsLoaded()`, loads `zh-Hans` + `zh-Hant`, returns `OcrResult` with lines + grapheme split, confidence threshold 0.7
- [ ] T021 Implement `DictionaryService` (WatermelonDB) in `src/shared/dictionary.ts`: `get(char)`, `search(prefix, limit)`, `getStrokeSvg(char)` — reads bundled `assets/dictionary.sqlite`
- [ ] T022 Implement `DocumentStore` (WatermelonDB) in `src/shared/store.ts`: `createDoc`, `addPages`, `updateOcr`, `getRecents`, `getDocWithPages`, `deleteDoc` (cascades pages + files via Expo FileSystem)
- [ ] T023 Implement PDF rasterize wrapper in `src/shared/pdf.ts`: `rasterize(uri, maxPages=20)` → returns page image URIs using `react-native-pdf` at 300 dpi
- [ ] T024 Set up WatermelonDB schema (`ScannedDoc`, `DocPage`, `CharEntry`, `Bookmark`, `LookupHistory`) in `src/shared/models/` with indexes
- [ ] T025 Configure root layout `app/_layout.tsx`: providers (ThemeProvider, WatermelonDB provider, Zustand/Jotai), global styles, NativeWind class strategy for dark mode
- [ ] T026 Verify T012–T016 red (no impl yet), then implement T017–T024 to green

**Checkpoint**: Foundation ready — `pnpm vitest run` passes all shared logic tests; user story implementation can now begin.

---

## Phase 3: User Story 1 — Android User Scans and Reads Chinese Documents (Priority: P1) — MVP

**Goal**: Android user installs app, scans/imports Chinese document, runs on-device OCR, reads text with toggles/underline — functionally equivalent to iOS P0.

**Independent Test**: QS-1..QS-8 from `quickstart.md` on Android emulator/device.

### Tests for User Story 1

> Write FIRST, ensure FAIL before implementation.

- [ ] T027 [P] [US1] Write Detox integration test: fresh install → Home shows recents + Scan/Photos/Files/Attribution in `e2e/home.test.ts`
- [ ] T028 [P] [US1] Write Detox test: Scan flow (camera permission → document scanner → crop/retake → confirm → page listed) in `e2e/capture.test.ts`
- [ ] T029 [P] [US1] Write Detox test: Photos import + Files import (image + ≤20-page PDF listed, >20-page refused) in `e2e/import.test.ts`
- [ ] T030 [P] [US1] Write Detox test: OCR progress → Reader (Original|Text toggle, font slider, Trad/Simp toggle, pink-ink underline < 0.7, no-text state) in `e2e/reader.test.ts`
- [ ] T031 [P] [US1] Write Detox test: Airplane mode full flow identical, no network calls in `e2e/offline.test.ts`
- [ ] T032 [P] [US1] Write Detox test: Persistence (recognize → kill → reopen → doc present; delete → gone) in `e2e/persistence.test.ts`

### Implementation for User Story 1

- [ ] T033 [US1] Implement Home screen `app/(tabs)/index.tsx`: recents list (from `DocumentStore.getRecents`), Scan/Photos/Files buttons, Attribution link, NativeWind styling
- [ ] T034 [US1] Implement ScanReview screen `app/scan.tsx`: `expo-document-picker` + `expo-camera` for system document scanner, crop/retake, confirm adds pages via `DocumentStore.addPages`
- [ ] T035 [US1] Implement PhotoPicker screen `app/import/photos.tsx`: `expo-image-picker` for photo library, adds pages
- [ ] T036 [US1] Implement FilePicker screen `app/import/files.tsx`: `expo-document-picker` for images + PDF, calls `pdf.rasterize()` then `addPages`, enforces 20-page cap with refusal message
- [ ] T037 [US1] Implement OCRProgress screen `app/ocr/[docId].tsx`: per-page status (pending|recognizing|recognized|noText|failed) with thumbnails, calls `OcrEngine.recognize()` per page, updates via `DocumentStore.updateOcr`
- [ ] T038 [US1] Implement Reader screen `app/reader/[docId].tsx`: Original|Text segmented control, font-size slider (14–32), Trad/Simp toggle (calls `TextDisplayConversion.display`), renders lines with pink-ink underline for `confidence < 0.7`, explicit no-text state
- [ ] T039 [US1] Implement Attribution screen `app/(tabs)/attribution.tsx`: lists CC-CEDICT, MakeMeAHanzi, Vietnamese corpus with links to `assets/licenses/`
- [ ] T040 [US1] Verify T027–T032 green and run QS-1..QS-8 validation on Android

**Checkpoint**: US1 fully functional on Android — MVP shippable for Android.

---

## Phase 4: User Story 2 — iOS User Experiences No Regression (Priority: P1)

**Goal**: Existing iOS P0 functionality works identically after refactor via EAS Build + TestFlight.

**Independent Test**: Run full iOS QS-1..QS-8 from `specs/001-project-init-scaffold/quickstart.md` — all pass.

### Tests for User Story 2

> Write FIRST, ensure FAIL before implementation.

- [ ] T041 [P] [US2] Write Detox test suite for iOS (same scenarios as US1) in `e2e/ios-regression.test.ts` — runs on iOS simulator via EAS
- [ ] T042 [P] [US2] Write visual parity test: theme tokens match `DesignPrinciples.md` hex exactly (light/dark) in `e2e/theme-parity.test.ts`

### Implementation for User Story 2

- [ ] T043 [US2] Configure iOS-specific native module linking (handled by Expo Autolinking; verify `react-native-mlkit-text-recognition` iOS pod installs)
- [ ] T044 [US2] Verify iOS camera/document picker works via `expo-document-picker` + `expo-camera` on TestFlight device
- [ ] T045 [US2] Verify ML Kit iOS loads `zh-Hans`/`zh-Hant` models, OCR accuracy matches Android (shared snapshot corpus tests)
- [ ] T046 [US2] Verify SwiftUI-free: no Swift code remains; all UI via React Native + NativeWind
- [ ] T047 [US2] Run EAS Build iOS preview profile → install via TestFlight → run QS-1..QS-8 manually

**Checkpoint**: iOS parity verified — zero functional regression vs old Swift P0.

---

## Phase 5: User Story 3 — Shared Business Logic Eliminates Duplication (Priority: P2)

**Goal**: Dictionary lookup, OpenCC conversion, data models, theme tokens, OCR result processing implemented once in `src/shared/` and used by both platforms.

**Independent Test**: Unit tests for shared module run on JVM (Gradle not used — Vitest on Node) and iOS (EAS sim) — same test cases, same results.

### Tests for User Story 3

> Write FIRST, ensure FAIL before implementation.

- [ ] T048 [P] [US3] Write Vitest test: shared `CharEntry` parse returns identical fields on both platforms in `src/shared/__tests__/shared-parity.test.ts`
- [ ] T049 [P] [US3] Write Vitest test: shared `TextDisplayConversion` byte-for-byte matches Swift OpenCC output (golden file) in `src/shared/__tests__/opencc-parity.test.ts`
- [ ] T050 [P] [US3] Write Vitest test: shared low-confidence threshold flags same characters for same OCR input in `src/shared/__tests__/ocr-threshold-parity.test.ts`
- [ ] T051 [P] [US3] Write Vitest test: shared `ThemeTokens` hex values match `DesignPrinciples.md` exactly in `src/shared/__tests__/theme-parity.test.ts`

### Implementation for User Story 3

- [ ] T052 [US3] Ensure all shared logic imports only from `src/shared/` — no platform-specific code in shared
- [ ] T053 [US3] Verify `pnpm vitest run` passes on Linux (CI) and macOS (local) with identical results
- [ ] T054 [US3] Add golden-file test for OpenCC: commit known traditional↔simplified pairs, assert byte-for-byte match

**Checkpoint**: Zero duplication — all business logic single-sourced in `src/shared/`.

---

## Phase 6: User Story 4 — Platform-Specific OCR Engines Abstracted Behind Common Interface (Priority: P1)

**Goal**: iOS and Android both implement `OcrEngine` via ML Kit; Reader/Store logic shared.

**Independent Test**: Swap OcrEngine impl with test double → Reader/Store tests still pass on both platforms.

### Tests for User Story 4

> Write FIRST, ensure FAIL before implementation.

- [ ] T055 [P] [US4] Write Vitest test: mock `OcrEngine` returns known `OcrResult` → Reader renders correctly in `src/shared/__tests__/ocr-engine-contract.test.ts`
- [ ] T056 [P] [US4] Write Detox test: blank page → `OcrStatus.noText` (not error) on both platforms in `e2e/ocr-blank.test.ts`
- [ ] T057 [P] [US4] Write Detox test: low-confidence chars flagged consistently (< 0.7) on both platforms in `e2e/ocr-confidence.test.ts`

### Implementation for User Story 4

- [ ] T058 [US4] Verify ML Kit iOS native module compiles via Expo Autolinking (EAS Build)
- [ ] T059 [US4] Verify ML Kit Android native module compiles via Gradle (EAS Build)
- [ ] T060 [US4] Implement ML Kit model download prompt UX (first use, ~20 MB per model) with Tesseract fallback stub in `src/shared/ocr.ts`
- [ ] T061 [US4] Implement vertical text heuristic: sort by `y` then `x` descending for Trad vertical right-to-left columns in `src/shared/ocr.ts`

**Checkpoint**: OCR abstraction verified — 90%+ code shared, only native module differs.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Gates, accessibility, bundle size, scope discipline across all stories.

- [ ] T062 [P] Run full `pnpm vitest run` (shared logic: dictionary, OpenCC, coordinate mapping, PDF rasterize, OCR threshold) — record results
- [ ] T063 [P] Run Detox on Android emulator + iOS simulator (EAS) — record results in `e2e/results/`
- [ ] T064 [P] Device gate check: Android printed page OCR < 2 s on Snapdragon 7 Gen 1 equiv; iOS < 2 s on A14+ (TestFlight)
- [ ] T065 [P] TalkBack (Android) / VoiceOver (iOS) audit: all controls labeled, CharGrid navigable per character (P1), Dynamic Type respected
- [ ] T066 [P] Light/dark theme audit: pastels surfaces-only, no hardcoded hex in any view, low-confidence `pinkInk` only
- [ ] T067 Review no-network compliance: no `INTERNET` permission in AndroidManifest, no network entitlement in iOS; ML Kit model download allowed (not core flow)
- [ ] T068 Scope-leak sweep: no per-char tap/detail (P1), stroke (P2), TTS (P2), bookmarks (P2), correction (P2), search (P2), flashcards (P3), export (P3), sync (P3), paraphrase (P3)
- [ ] T069 Bundle size check: `pnpm eas build --platform android --profile preview` → APK ≤ 150 MB; iOS IPA ≤ 150 MB
- [ ] T070 Run full `quickstart.md` QS-1..QS-8 end-to-end on both platforms and fix gaps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — starts immediately (T001→T011; T007/T008/T010 parallel).
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories. Tests T012–T016 first, then T017–T026.
- **User Stories (Phases 3–6)**: All depend on Foundational. Proceed in priority order US1 → US2 → US3 → US4, or in parallel if staffed.
- **Polish (Phase 7)**: Depends on all desired stories complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependencies on other stories.
- **US2 (P1)**: After Foundational — shares all code with US1; only iOS-specific verification needed.
- **US3 (P2)**: After Foundational — verifies shared module parity (runs alongside US1/US2).
- **US4 (P1)**: After Foundational — verifies OCR engine contract (runs alongside US1/US2).

### Within Each User Story

- Tests FIRST and FAIL before implementation (T027–T032; T041–T042; T048–T051; T055–T057).
- Screens before integration; contract tests before platform verification; story validation task closes each phase.

### Parallel Opportunities

- T007 + T008 + T010 (licenses, gitignore, corpus); T012–T016 (test files independent).
- T027–T032 (Detox tests for US1) can run in parallel as separate test files.
- T033–T039 (US1 screens) can be developed in parallel by different developers (different route files).
- T041 + T042 (US2 iOS tests) parallel with US1 work.
- T048–T051 (US3 parity tests) parallel with US1/US2.
- T062–T066 (polish audits) run in parallel (different surfaces).

---

## Parallel Example: User Story 1

```bash
# Launch story tests together (verified FAIL first):
Task: "Write Detox home test in e2e/home.test.ts"
Task: "Write Detox capture test in e2e/capture.test.ts"
Task: "Write Detox import test in e2e/import.test.ts"
Task: "Write Detox reader test in e2e/reader.test.ts"
Task: "Write Detox offline test in e2e/offline.test.ts"
Task: "Write Detox persistence test in e2e/persistence.test.ts"

# Launch independent screens together after foundation:
Task: "Implement Home screen in app/(tabs)/index.tsx"
Task: "Implement ScanReview screen in app/scan.tsx"
Task: "Implement PhotoPicker screen in app/import/photos.tsx"
Task: "Implement FilePicker screen in app/import/files.tsx"
```

## Parallel Example: Foundational

```bash
# Launch all Vitest test files together (verified FAIL first):
Task: "Write types tests in src/shared/__tests__/types.test.ts"
Task: "Write conversion tests in src/shared/__tests__/conversion.test.ts"
Task: "Write dictionary tests in src/shared/__tests__/dictionary.test.ts"
Task: "Write PDF tests in src/shared/__tests__/pdf.test.ts"
Task: "Write coordinate mapping tests in src/shared/__tests__/coordinate-mapping.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T011).
2. Complete Phase 2: Foundational (T012–T026) — tests-first, red before green.
3. Complete Phase 3: US1 (T027–T040).
4. **STOP and VALIDATE**: QS-1..QS-8 on Android emulator/device. Deploy demo APK.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. + US1 → Android MVP demo (QS-1..QS-8).
3. + US2 → iOS parity demo (TestFlight QS-1..QS-8).
4. + US3 → Shared logic parity verified (Vitest cross-platform).
5. + US4 → OCR abstraction verified (contract tests).
6. Polish → gates recorded (T062–T070).

### Parallel Team Strategy

With multiple developers post-Foundational:
- Dev A: US1 Android screens (Home, Scan, Import, OCR, Reader)
- Dev B: US2 iOS verification (EAS Build, TestFlight, ML Kit iOS)
- Dev C: US3 shared parity (Vitest golden files, OpenCC match)
- Dev D: US4 OCR engine contract (mock tests, vertical heuristic)
Stories merge via `src/shared/` contracts without file conflicts.

---

## Notes

- [P] tasks = different files, no dependencies — safe for parallel agents.
- [Story] label maps each story-phase task to its user story for traceability.
- Field constraints quoted verbatim from data-model.md (caps, enums, thresholds) — no implementation-time discretion.
- Commit after each task or logical group; stop at any checkpoint to validate story independently.
- P1+ scope (tap detail, stroke, TTS, bookmarks, correction, search, flashcards, export, sync, paraphrase) shipping here = scope leak, flag per T068.
- Old Swift scaffold (`TungCua.xcodeproj`, `TungCua/`, `Tests/`) already removed per user request.