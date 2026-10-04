# Tasks: Cross-Platform Foundation (iOS + Android)

**Feature Branch**: `003-cross-platform-foundation`
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Research**: [research.md](research.md) | **Data Model**: [data-model.md](data-model.md) | **Contracts**: [contracts/](contracts/) | **Quickstart**: [quickstart.md](quickstart.md)

**Tests**: REQUIRED — Constitution Principle V (Test-First, NON-NEGOTIABLE). Unit tests (Jest) written before implementation; Maestro e2e flows for integration. All test tasks MUST be written first and verified FAIL before implementation.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, Expo config, NativeWind, CI bootstrap

- [ ] T001 Initialize Expo project with current stable SDK (`npx create-expo-app@latest tungcua --template blank-typescript`) at repo root
- [ ] T002 Install core dependencies: `expo`, `expo-router`, `expo-dev-client`, `expo-camera`, `expo-image-picker`, `expo-document-picker`, `expo-file-system`, `expo-font`, `expo-speech`, `expo-sqlite`, `nativewind`, `tailwindcss`, `zustand`, `drizzle-orm`, `opencc-js` (or `opencc`), `react-native-reanimated`, `react-native-gesture-handler`, `pnpm`
- [ ] T003 Install dev dependencies: `jest`, `@testing-library/react-native`, `maestro`, `typescript`, `eslint`, `prettier`, `drizzle-kit`, `@types/react`, `@types/react-native`
- [ ] T004 Configure NativeWind: `tailwind.config.js` with mint/pink/bg tokens (light/dark, class strategy), `nativewind-env.d.ts`, `metro.config.js` with NativeWind plugin
- [ ] T005 Configure `app.config.ts`: bundle ID `com.tungcua.app`, permissions (camera, media-library, file access), plugins for ML Kit wrapper, PDF renderer, reanimated, gesture-handler, fonts, EAS build profiles (development, preview, production)
- [ ] T006 Configure `eas.json` with build profiles for iOS (EAS Build cloud) and Android (local/EAS)
- [ ] T007 [P] Add license texts (CC-CEDICT CC BY-SA, MakeMeAHanzi Arphic, Vietnamese gloss placeholder, Noto fonts SIL OFL) in `assets/licenses/`
- [ ] T008 [P] Update `.gitignore`: add `.expo/`, `dist/`, `build/`, `node_modules/`, `assets/dictionary.sqlite` (built locally), `*.log`, `.DS_Store`, `coverage/`
- [ ] T009 Create dictionary build script `scripts/build-dictionary.ts` (P1+ placeholder): reads CC-CEDICT + Unihan + CVDict CSVs/JSONs → writes `assets/dictionary.sqlite` with `CharEntry` schema (indexes on `char`, `radical`, `pinyin`)
- [ ] T010 [P] Check in snapshot corpus fixtures with ground truth + thresholds (printed ≥ 0.95 gating, vertical ≥ 0.80 tracked, handwritten ≥ 0.60 tracked) in `assets/snapshot-corpus/{printed,vertical,handwritten}/` + `manifest.json`
- [ ] T011 Remove Sync Impact Report HTML comment from `.specify/memory/constitution.md` before first commit

---

## Phase 2: Spikes (Blocking Prerequisites — MUST Complete Before Phase 3)

**Purpose**: Prove critical native dependencies work before committing to them. Constitution Principle VI: native code only when spike proves gap.

**CRITICAL**: No feature work (Phase 3+) can begin until BOTH spikes pass.

- [ ] T012 Spike: ML Kit wrapper with bundled Chinese model — evaluate `react-native-mlkit-text-recognition`, `react-native-mlkit-vision`, Expo modules. Criteria: (1) Chinese recognition, (2) bundled model (no runtime download), (3) iOS + Android with current Expo SDK, (4) config plugin/autolinking. If none qualify, build minimal Expo native module wrapping ML Kit `TextRecognizer` with bundled `zh` model assets. Document decision in `docs/spike-mlkit.md`.
- [ ] T013 Spike: PDF text extraction + page rendering — evaluate `react-native-pdf`, `pdfjs-dist`, `react-native-pdf-lib`, or native module (PDFKit iOS / PdfRenderer Android). Criteria: (a) detect embedded text layer, (b) render pages at ~300 dpi equivalent. If none qualify, build minimal Expo native module. Document decision in `docs/spike-pdf.md`.

**Checkpoint**: Both spikes pass — ML Kit wrapper and PDF renderer selected/proven. Feature work can begin.

---

## Phase 3: Foundational (Blocking Prerequisites for All User Stories)

**Purpose**: Shared types, database schema, OCR engine interface, conversion, theme tokens, PDF utilities — MUST complete before ANY user story

**CRITICAL**: No user story work can begin until this phase is complete.

### Unit Tests (Written FIRST — Red-Green-Refactor per Principle V)

- [ ] T014 [P] Write Jest unit tests for coordinate mapping / reading order (top-to-bottom LTR + vertical heuristic) in `__tests__/shared/ocr/reading-order.test.ts`
- [ ] T015 [P] Write Jest unit tests for grapheme splitting (Unicode grapheme cluster → proportional bounds) in `__tests__/shared/ocr/grapheme.test.ts`
- [ ] T016 [P] Write Jest unit tests for Trad/Simp conversion (OpenCC JS, golden files, byte-for-byte match with Swift OpenCC) in `__tests__/shared/conversion/opencc.test.ts`
- [ ] T017 [P] Write Jest unit tests for PDF text-layer detection (embedded text vs scanned) in `__tests__/shared/pdf/detector.test.ts`
- [ ] T018 [P] Write Jest unit tests for database operations (create, read, update, delete, cascade) in `__tests__/shared/storage/queries.test.ts`

### Implementation (After Tests Fail → Implement → Green)

- [ ] T019 Implement shared TypeScript types (`OcrEngine`, `OcrResult`, `OcrLine`, `OcrGrapheme`, `Bounds`, `Document`, `Page`, `AppSettings`, `ScriptVariant`) in `src/shared/ocr/types.ts` and `src/shared/storage/schema.ts`
- [ ] T020 Implement `OcrEngine` interface + ML Kit implementation (platform-specific via native module) in `src/shared/ocr/engine.ts` (uses spike-proven wrapper)
- [ ] T021 Implement reading order heuristic (top-to-bottom LTR default + vertical right-to-left columns) in `src/shared/ocr/reading-order.ts`
- [ ] T022 Implement grapheme split (Unicode grapheme cluster + proportional bounds) in `src/shared/ocr/grapheme.ts`
- [ ] T023 Implement PDF text-layer detector in `src/shared/pdf/detector.ts`
- [ ] T024 Implement PDF page renderer (~300 dpi equivalent) in `src/shared/pdf/renderer.ts`
- [ ] T025 Implement Drizzle schema (`documents`, `pages`, `app_settings` + P1/P2 reserved `char_entries`, `bookmarks`, `lookup_history`) in `src/shared/storage/schema.ts`
- [ ] T026 Implement typed query layer (`DocumentStore`: create, get, update, delete, cascade; `PageFileStore`: write/read/delete page images + thumbnails) in `src/shared/storage/queries.ts`
- [ ] T027 Implement Drizzle migrations setup in `src/shared/storage/migrations.ts` and `drizzle.config.ts`
- [ ] T028 Implement Trad/Simp display conversion (OpenCC JS, pure function, never mutates stored text) in `src/shared/conversion/opencc.ts`
- [ ] T029 Implement theme tokens re-export from `tailwind.config.js` in `src/shared/theme/tokens.ts`
- [ ] T029b Implement shared test utilities (mock OcrEngine, fixtures) in `src/shared/test-utils/`
- [ ] T030 Configure root layout `app/_layout.tsx`: providers (Theme, Zustand, Drizzle), global styles, NativeWind class strategy for dark mode
- [ ] T031 Verify T014–T018 red (no impl yet), then implement T019–T029b to green (`pnpm test` passes all shared unit tests)

**Checkpoint**: Foundation ready — `pnpm test` passes all shared logic tests; user story implementation can now begin.

---

## Phase 4: User Story 1 — Scan and Read a Printed Page (Priority: P1) — MVP CORE

**Goal**: User scans a printed Chinese page, reviews it (retake/crop), runs recognition with progress, opens Reader with correct text. Works identically on iOS/Android.

**Independent Test**: QS-2 (Scan a Printed Page) — fresh install on each platform, scan one page, reach Reader with correct text.

### Unit Tests (Written FIRST)

- [ ] T032 [P] [US1] Write Jest test for camera permission flow (granted/denied) in `__tests__/features/scan/permissions.test.ts`
- [ ] T033 [P] [US1] Write Jest test for scan review (retake, crop, confirm adds page) in `__tests__/features/scan/review.test.ts`
- [ ] T034 [P] [US1] Write Jest test for OCR progress → Reader navigation in `__tests__/features/scan/ocr-progress.test.ts`

### Maestro E2E Tests (Written FIRST)

- [ ] T035 [P] [US1] Write Maestro flow: scan printed page → review → OCR → Reader in `e2e/maestro/scan-read.yaml`

### Implementation

- [ ] T036 [US1] Implement Home screen `app/(tabs)/index.tsx`: Recents list (from `DocumentStore.getRecents`), Scan/Photos/Files/Attribution actions, NativeWind styling
- [ ] T037 [US1] Implement Scan screen `app/scan.tsx`: `expo-camera` + `expo-document-picker` for camera capture, review (retake/crop/page list), confirm adds pages via `DocumentStore.addPages`
- [ ] T038 [US1] Implement OCR Progress screen `app/ocr/[docId].tsx`: per-page status (pending|recognizing|recognized|noText|failed) with thumbnails, calls `OcrEngine.recognize()` per page, updates via `DocumentStore.updatePageOcr`
- [ ] T039 [US1] Implement Reader screen `app/reader/[docId].tsx`: displays recognized text (plain, non-tappable in P0), uses `DocumentStore.getDocWithPages`
- [ ] T040 [US1] Verify T032–T035 green and run QS-2 validation on Android + iOS

**Checkpoint**: US1 fully functional on both platforms — scan → review → OCR → Reader works.

---

## Phase 5: User Story 2 — Import Images and PDFs (Priority: P1)

**Goal**: User imports photo from gallery or image/PDF from storage. PDFs ≤20 pages accepted; text PDFs use embedded text; scanned PDFs rendered + OCR'd. Over-cap refused with clear message.

**Independent Test**: QS-3, QS-4, QS-5, QS-5b — import 3-page text PDF, 3-page scanned PDF, 25-page PDF on both platforms.

### Unit Tests (Written FIRST)

- [ ] T041 [P] [US2] Write Jest test for photo import (media library permission, adds page) in `__tests__/features/import/photos.test.ts`
- [ ] T042 [P] [US2] Write Jest test for file import (images + PDF, text layer detection, 20-page cap) in `__tests__/features/import/files.test.ts`
- [ ] T043 [P] [US2] Write Jest test for PDF text layer detection + rendering in `__tests__/shared/pdf/import.test.ts`

### Maestro E2E Tests (Written FIRST)

- [ ] T044 [P] [US2] Write Maestro flow: import photo → OCR → Reader in `e2e/maestro/import-photo.yaml`
- [ ] T045 [P] [US2] Write Maestro flow: import text PDF → Reader (no OCR) in `e2e/maestro/import-text-pdf.yaml`
- [ ] T046 [P] [US2] Write Maestro flow: import scanned PDF → render → OCR → Reader in `e2e/maestro/import-scanned-pdf.yaml`
- [ ] T047 [P] [US2] Write Maestro flow: import 25-page PDF → refusal message in `e2e/maestro/import-overcap.yaml`

### Implementation

- [ ] T048 [US2] Implement PhotoPicker screen `app/import/photos.tsx`: `expo-image-picker` for gallery import, adds pages via `DocumentStore.addPages`
- [ ] T049 [US2] Implement FilePicker screen `app/import/files.tsx`: `expo-document-picker` for images + PDF, detects text layer (uses `detector.ts`), renders scanned pages (uses `renderer.ts`), enforces 20-page cap with refusal message
- [ ] T049b [US2] Handle mixed PDFs (some pages text, some scanned) — text pages use embedded text, scanned pages rendered + OCR
- [ ] T050 [US2] Verify T041–T047 green and run QS-3, QS-4, QS-5, QS-5b validation on Android + iOS

**Checkpoint**: US2 fully functional — all import paths work, PDF text-layer-first approach verified.

---

## Phase 6: User Story 3 — Reader Controls (Priority: P1)

**Goal**: Reader has Original|Text toggle, font size slider (14–32 pt), Trad/Simp toggle (OpenCC display only), pink-ink low-confidence underline (< 0.7), explicit "no text found" state. No hardcoded hex.

**Independent Test**: QS-6 — toggle Original|Text, adjust font size, flip Trad/Simp, verify underline, verify blank page state.

### Unit Tests (Written FIRST)

- [ ] T051 [P] [US3] Write Jest test for Original|Text toggle (no data loss) in `__tests__/features/reader/toggle.test.ts`
- [ ] T052 [P] [US3] Write Jest test for font size slider (14–32 pt range) in `__tests__/features/reader/font-size.test.ts`
- [ ] T053 [P] [US3] Write Jest test for Trad/Simp toggle (OpenCC display only, stored text unchanged) in `__tests__/features/reader/trad-simp.test.ts`
- [ ] T054 [P] [US3] Write Jest test for low-confidence underline (pink-ink, threshold 0.7) in `__tests__/features/reader/underline.test.ts`
- [ ] T055 [P] [US3] Write Jest test for "no text found" state in `__tests__/features/reader/no-text.test.ts`

### Maestro E2E Tests (Written FIRST)

- [ ] T056 [P] [US3] Write Maestro flow: Reader controls (toggle, font, trad/simp, underline, no-text) in `e2e/maestro/reader-controls.yaml`

### Implementation

- [ ] T057 [US3] Enhance Reader screen `app/reader/[docId].tsx`: Original|Text segmented control, font size slider (14–32), Trad/Simp toggle (calls `opencc.convert`), renders lines with pink-ink underline for `confidence < 0.7`, explicit "No text found" state for empty pages
- [ ] T058 [US3] Implement UI components `src/components/ui/`: Toggle, Slider, SegmentedControl (NativeWind, theme tokens only, no hardcoded hex)
- [ ] T059 [US3] Verify T051–T056 green and run QS-6 validation on Android + iOS

**Checkpoint**: US3 fully functional — all Reader controls work, theme tokens only, pink-ink underline consistent.

---

## Phase 7: User Story 4 — Persistence (Priority: P1)

**Goal**: Documents, pages, images, recognized text survive app restarts in Recents. Delete cascades to pages + files.

**Independent Test**: QS-7 — scan → force-close → reopen → document intact; delete → removes pages + files.

### Unit Tests (Written FIRST)

- [ ] T060 [P] [US4] Write Jest test for document persistence across restarts (create → close → open → intact) in `__tests__/features/persistence/restart.test.ts`
- [ ] T061 [P] [US4] Write Jest test for delete cascade (document → pages → image files) in `__tests__/features/persistence/delete.test.ts`

### Maestro E2E Tests (Written FIRST)

- [ ] T062 [P] [US4] Write Maestro flow: scan → kill app → reopen → document intact in `e2e/maestro/persistence-restart.yaml`
- [ ] T063 [P] [US4] Write Maestro flow: delete document → pages + files removed in `e2e/maestro/persistence-delete.yaml`

### Implementation

- [ ] T064 [US4] Ensure `DocumentStore.deleteDocument` cascades: DB delete (SQLite FK) → `PageFileStore.deletePageFiles` for all pages
- [ ] T065 [US4] Implement Recents list in Home `app/(tabs)/index.tsx` using `DocumentStore.getRecents` (sorted by `created_at` desc)
- [ ] T066 [US4] Verify T060–T063 green and run QS-7 validation on Android + iOS

**Checkpoint**: US4 fully functional — persistence and cascade delete work.

---

## Phase 8: User Story 5 — Fully Offline and Private (Priority: P1)

**Goal**: Entire capture-to-read flow works in airplane mode, zero network requests, no network permission for core features.

**Independent Test**: QS-8 — airplane mode enabled, full flow works, zero network calls.

### Unit Tests (Written FIRST)

- [ ] T067 [P] [US5] Write Jest test verifying no network calls in OCR/storage/import paths (mock fetch, assert not called) in `__tests__/shared/offline/no-network.test.ts`

### Maestro E2E Tests (Written FIRST)

- [ ] T068 [P] [US5] Write Maestro flow: airplane mode → scan → import → OCR → read → persist → delete in `e2e/maestro/offline.yaml`

### Implementation

- [ ] T069 [US5] Verify `app.config.ts` release profile has NO `android.permission.INTERNET` and NO iOS `UIBackgroundModes` network
- [ ] T070 [US5] Verify ML Kit model is bundled (not downloaded) — `assets/mlkit/` present in both platform builds
- [ ] T071 [US5] Verify no runtime network calls in any P0 code path (lint rule: no `fetch`, `XMLHttpRequest`, `WebSocket` in `src/shared/`, `src/components/`, `app/`)
- [ ] T072 [US5] Verify T067–T068 green and run QS-8 validation on Android + iOS

**Checkpoint**: US5 fully functional — offline-only, no network permission, bundled model.

---

## Phase 9: User Story 6 — No iOS Regression (Priority: P2)

**Goal**: All iOS QS-1..QS-8 from spec 001 pass; theme colors match DesignPrinciples.md in light/dark.

**Independent Test**: QS-9 — run QS-1..QS-8 on iOS via TestFlight; theme visual match.

### Tests (Written FIRST)

- [ ] T073 [P] [US6] Write Maestro flow: iOS regression suite (QS-1..QS-8) in `e2e/maestro/ios-regression.yaml`
- [ ] T074 [P] [US6] Write visual regression test: theme colors vs DesignPrinciples.md (light/dark) in `e2e/maestro/theme-parity.yaml`

### Implementation

- [ ] T075 [US6] Run EAS Build iOS development profile → TestFlight install → run QS-1..QS-8 manually
- [ ] T076 [US6] Compare theme tokens in `tailwind.config.js` to DesignPrinciples.md — exact hex match for mint/pink/bg light/dark
- [ ] T077 [US6] Verify T073–T074 green and run QS-9 validation on iOS

**Checkpoint**: US6 verified — iOS parity confirmed, theme matches exactly.

---

## Phase 10: User Story 7 — Attribution (Priority: P2)

**Goal**: In-app screen lists CC-CEDICT CC BY-SA, Make Me a Hanzi (Arphic), Vietnamese gloss placeholder, bundled license files.

**Independent Test**: QS-10 — open Attribution screen, verify entries + license files.

### Unit Tests (Written FIRST)

- [ ] T078 [P] [US7] Write Jest test for Attribution screen content (licenses listed, links to files) in `__tests__/features/attribution/content.test.ts`

### Maestro E2E Tests (Written FIRST)

- [ ] T079 [P] [US7] Write Maestro flow: open Attribution → verify entries in `e2e/maestro/attribution.yaml`

### Implementation

- [ ] T080 [US7] Implement Attribution screen `app/(tabs)/attribution.tsx`: lists CC-CEDICT CC BY-SA, Make Me a Hanzi Arphic, Vietnamese gloss placeholder, links to `assets/licenses/`
- [ ] T081 [US7] Verify license files present in `assets/licenses/` (CC-CEDICT, MakeMeAHanzi, Vietnamese placeholder, Noto fonts SIL OFL)
- [ ] T082 [US7] Verify T078–T079 green and run QS-10 validation on Android + iOS

**Checkpoint**: US7 functional — attribution screen complete, licenses bundled.

---

## Phase 11: User Story 8 — Single-Clone Developer Setup (Priority: P2)

**Goal**: Fresh clone → documented commands → working Android dev build, iOS dev build via EAS, unit tests pass.

**Independent Test**: QS-1, QS-11 — fresh clone, follow README, build Android, build iOS via EAS, `pnpm test` passes.

### Implementation

- [ ] T083 [US8] Write comprehensive `README.md`: clone, `pnpm install`, `pnpm expo start --dev-client --android`, `pnpm eas build --platform ios --profile development`, `pnpm test`, troubleshooting
- [ ] T084 [US8] Verify `pnpm test` runs all unit tests (Jest Expo preset) and passes
- [ ] T085 [US8] Verify `pnpm test:e2e:android` runs Maestro flows on emulator
- [ ] T086 [US8] Verify `pnpm test:e2e:ios` runs Maestro flows on iOS simulator (EAS)
- [ ] T087 [US8] Verify `pnpm lint && pnpm typecheck && pnpm test` passes (CI simulation)
- [ ] T088 [US8] Fresh clone test: clone repo in clean dir, follow README, confirm Android dev build + iOS EAS build + tests pass
- [ ] T089 [US8] Run QS-1, QS-11 validation on Android + iOS

**Checkpoint**: US8 verified — zero-friction developer onboarding.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Gates, performance, accessibility, scope discipline, CI, bundle size.

- [ ] T090 [P] Run full `pnpm test` (all unit tests: coordinate mapping, grapheme split, Trad/Simp, PDF text-layer, DB operations) — record results
- [ ] T091 [P] Run Maestro e2e on Android emulator + iOS simulator (EAS) — record results in `e2e/results/`
- [ ] T092 [P] Device gate check: OCR < 2 s/page on Snapdragon 7 Gen 1 equiv (Android) + iPhone 13 class (iOS) — real devices only
- [ ] T093 [P] Reader scroll 20-page doc → 60 fps on target devices (real devices only)
- [ ] T094 [P] TalkBack (Android) / VoiceOver (iOS) audit: all P0 screens operable, labels on controls, reasonable focus order
- [ ] T095 [P] Light/dark theme audit: pastels surfaces-only, no hardcoded hex in any view, low-confidence pink-ink only
- [ ] T096 [P] CI verification: no `INTERNET` permission in Android release manifest, no network capability in iOS release entitlements, no network calls during core flow
- [ ] T097 [P] Scope-leak sweep: no per-char tap/detail, dictionary, stroke, TTS, bookmarks, correction, search, flashcards, export, sync, paraphrase
- [ ] T098 [P] Bundle size check: `pnpm eas build --platform android --profile preview` → APK ≤ 150 MB; iOS IPA ≤ 150 MB (including ML Kit model)
- [ ] T099 [P] JS bundle size: `pnpm expo export --dump-assetmap` → gzipped < 3 MB
- [ ] T100 Run full `quickstart.md` QS-1..QS-15 end-to-end on both platforms and fix gaps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — starts immediately (T001→T011; T007/T008/T010 parallel)
- **Spikes (Phase 2)**: Depends on Setup — BLOCKS all feature work. T012 + T013 can run in parallel.
- **Foundational (Phase 3)**: Depends on Spikes — BLOCKS all user stories. Tests T014–T018 first, then T019–T031.
- **User Stories (Phases 4–11)**: All depend on Foundational. Proceed in priority order US1→US2→US3→US4→US5 (all P1) → US6→US7→US8 (P2), or in parallel if staffed.
- **Polish (Phase 12)**: Depends on all desired stories complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependencies on other stories.
- **US2 (P1)**: After Foundational — shares OCR/Reader with US1; independently testable via import paths.
- **US3 (P1)**: After Foundational — uses US1/US2 pages; independently testable with fixture data.
- **US4 (P1)**: After Foundational — uses US1/US2/US3 data; independently testable with seeded DB.
- **US5 (P1)**: After Foundational — cross-cutting; verifies all flows offline.
- **US6 (P2)**: After US1–US5 — verifies iOS parity.
- **US7 (P2)**: After Foundational — standalone screen.
- **US8 (P2)**: After all — validates full setup.

### Within Each User Story

- Tests FIRST and FAIL before implementation (unit + Maestro).
- Components before integration; contract tests before platform verification.
- Story validation task closes each phase.

### Parallel Opportunities

- T007 + T008 + T010 (licenses, gitignore, corpus); T012 + T013 (spikes parallel).
- T014–T018 (unit test files independent).
- T032–T035 (US1 tests parallel); T041–T047 (US2 tests parallel); T051–T056 (US3 tests parallel); T060–T063 (US4 tests parallel).
- T036–T039 (US1 screens) can be developed in parallel by different developers (different route files).
- US1–US5 can run in parallel post-Foundational with separate developers (distinct files per story).
- T090–T099 polish audits run in parallel (different surfaces).

---

## Parallel Example: User Story 1 (Scan & Read)

```bash
# Launch story tests together (verified FAIL first):
Task: "Write Jest test for camera permission flow in __tests__/features/scan/permissions.test.ts"
Task: "Write Jest test for scan review in __tests__/features/scan/review.test.ts"
Task: "Write Jest test for OCR progress in __tests__/features/scan/ocr-progress.test.ts"
Task: "Write Maestro flow scan-read in e2e/maestro/scan-read.yaml"

# Launch independent screens together after foundation:
Task: "Implement Home screen in app/(tabs)/index.tsx"
Task: "Implement Scan screen in app/scan.tsx"
Task: "Implement OCR Progress screen in app/ocr/[docId].tsx"
Task: "Implement Reader screen in app/reader/[docId].tsx"
```

## Parallel Example: Foundational Unit Tests

```bash
# Launch all Vitest test files together (verified FAIL first):
Task: "Write Jest test for coordinate mapping in __tests__/shared/ocr/reading-order.test.ts"
Task: "Write Jest test for grapheme splitting in __tests__/shared/ocr/grapheme.test.ts"
Task: "Write Jest test for Trad/Simp conversion in __tests__/shared/conversion/opencc.test.ts"
Task: "Write Jest test for PDF text-layer detection in __tests__/shared/pdf/detector.test.ts"
Task: "Write Jest test for database operations in __tests__/shared/storage/queries.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T011).
2. Complete Phase 2: Spikes (T012–T013) — MUST pass before proceeding.
3. Complete Phase 3: Foundational (T014–T031) — tests-first, red before green.
4. Complete Phase 4: US1 (T032–T040).
5. **STOP and VALIDATE**: QS-2 on Android + iOS. Deploy demo dev builds.

### Incremental Delivery

1. Setup + Spikes + Foundational → foundation ready.
2. + US1 → scan→read demo (MVP).
3. + US2 → import (photo, text PDF, scanned PDF) demo.
4. + US3 → Reader controls demo.
5. + US4 → persistence demo.
6. + US5 → offline demo.
7. + US6 → iOS regression verified.
8. + US7 → attribution screen.
9. + US8 → developer setup verified.
10. Polish → gates recorded (T090–T100).

### Parallel Team Strategy

With multiple developers post-Foundational:
- Dev A: US1 Android/iOS screens (Home, Scan, OCR, Reader)
- Dev B: US2 import screens (Photos, Files, PDF detector/renderer)
- Dev C: US3 Reader controls + US4 persistence + US5 offline
- Dev D: US6 iOS regression + US7 Attribution + US8 README/CI
- Shared: Foundational (T014–T031) done by team lead or split.

Stories merge via `src/shared/` contracts without file conflicts.

---

## Notes

- [P] tasks = different files, no dependencies — safe for parallel agents.
- [Story] label maps each story-phase task to its user story for traceability.
- Field constraints quoted verbatim from data-model.md (caps, enums, thresholds) — no implementation-time discretion.
- Commit after each task or logical group; stop at any checkpoint to validate story independently.
- P1+ scope (per-char tap/detail, dictionary, stroke, TTS, bookmarks, correction, search, flashcards, export, sync, paraphrase) shipping here = scope leak, flag per T097.
- Spikes T012 + T013 are MANDATORY gates — if they fail, plan a small Expo native module per Principle VI.
- Constitution Principle V: ALL test tasks written FIRST, verified FAIL, then implementation.