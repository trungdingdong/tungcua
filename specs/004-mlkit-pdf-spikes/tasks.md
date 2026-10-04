# Tasks: ML Kit + PDF Spikes (M1)

**Feature Branch**: `004-mlkit-pdf-spikes`
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Research**: [research.md](research.md) | **Data Model**: [data-model.md](data-model.md) | **Contracts**: [contracts/](contracts/) | **Quickstart**: [quickstart.md](quickstart.md)

**Tests**: REQUIRED — Constitution Principle V (Test-First, NON-NEGOTIABLE). Jest unit tests for harness utilities; Maestro for device flows; custom spike measurement scripts. All test tasks MUST be written first, verified FAIL before implementation.

---

## Phase 1: Setup (Spike Infrastructure)

**Purpose**: Create isolated spike apps, shared corpus fixtures, and CI-ready scripts

- [ ] T001 Create `spikes/` folder structure at repo root with `spike-a/`, `spike-b/`, `DECISION_RECORDS/`, `INTERFACE_SKETCHES/`
- [ ] T002 Initialize Spike A Expo app: `npx create-expo-app@latest spike-a --template blank-typescript` in `spikes/spike-a/`
- [ ] T003 Initialize Spike B Expo app: `npx create-expo-app@latest spike-b --template blank-typescript` in `spikes/spike-b/`
- [ ] T004 [P] Install Spike A core deps: `expo`, `expo-dev-client`, `expo-router`, `expo-file-system`, candidate ML Kit wrappers (`react-native-mlkit-text-recognition`, `react-native-mlkit-vision`) in `spikes/spike-a/`
- [ ] T005 [P] Install Spike B core deps: `expo`, `expo-dev-client`, `expo-router`, `expo-file-system`, candidate PDF libs (`react-native-pdf`, `pdfjs-dist`, `react-native-pdf-lib`) in `spikes/spike-b/`
- [ ] T006 Install shared dev deps (both spikes): `jest`, `jest-expo`, `@testing-library/react-native`, `maestro`, `typescript`, `eslint`, `prettier` in each spike app
- [ ] T007 [P] Configure `app.config.ts` for Spike A: bundle ID `com.tungcua.spikea`, ML Kit plugin, camera/file permissions, EAS build profiles, **release profile with no network permission** in `spikes/spike-a/app.config.ts`
- [ ] T008 [P] Configure `app.config.ts` for Spike B: bundle ID `com.tungcua.spikeb`, PDF plugin(s), file permissions, EAS build profiles, **release profile with no network permission** in `spikes/spike-b/app.config.ts`
- [ ] T009 [P] Configure `eas.json` for both spikes: development/preview/production profiles, Android APK, iOS dev client in `spikes/spike-a/eas.json` and `spikes/spike-b/eas.json`
- [ ] T010 [P] Create shared corpus directories: `assets/spike-corpus/spike-a/{printed,vertical,handwritten}/`, `assets/spike-corpus/spike-b/` with `manifest.json` each
- [ ] T011 [P] Add corpus fixture placeholder READMEs and `manifest.json` templates per `data-model.md` in `assets/spike-corpus/spike-a/manifest.json` and `assets/spike-corpus/spike-b/manifest.json`
- [ ] T012 [P] Update root `.gitignore`: add `spikes/spike-a/`, `spikes/spike-b/`, `spikes/DECISION_RECORDS/`, `spikes/INTERFACE_SKETCHES/`, `spikes/**/node_modules/`, `spikes/**/.expo/`, `spikes/**/dist/`
- [ ] T013 Add spike-specific scripts to root `package.json`: `spike:a:build:android`, `spike:a:build:ios`, `spike:b:build:android`, `spike:b:build:ios`, `spike:a:run`, `spike:b:run`, `spike:clean`
- [ ] T014 [P] **Verify no network permission in release config**: check `android.permission.INTERNET` absent from Android release manifest and iOS network entitlements absent in both spike apps' `app.config.ts` release profiles in `spikes/spike-a/app.config.ts` and `spikes/spike-b/app.config.ts`
- [ ] T015 [P] **Add spike app package.json audit task**: verify each spike app's `package.json` contains only the chosen candidate dependency (no losing candidates) in `spikes/spike-a/package.json` and `spikes/spike-b/package.json`

---

## Phase 2: Foundational (Spike Harness Infrastructure)

**Purpose**: Shared harness code, corpus loaders, measurement runners — MUST complete before spike execution

**CRITICAL**: No spike execution (Phase 3+) can begin until this phase is complete.

### Unit Tests (Written FIRST — Red-Green-Refactor per Principle V)

- [ ] T016 [P] Write Jest tests for Spike A corpus loader (loads manifest, validates entries, resolves image paths) in `spikes/spike-a/src/harness/__tests__/corpus-loader.test.ts`
- [ ] T017 [P] Write Jest tests for Spike B corpus loader (loads manifest, validates PDF entries, resolves paths) in `spikes/spike-b/src/harness/__tests__/corpus-loader.test.ts`
- [ ] T018 [P] Write Jest tests for measurement recorder (writes JSON results, computes aggregates: median warm time, printed accuracy) in `spikes/spike-a/src/harness/__tests__/measurements.test.ts`
- [ ] T019 [P] Write Jest tests for result schema validation (validates `SpikeAResult`, `SpikeBResult` against data-model) in `spikes/spike-a/src/harness/__tests__/schema.test.ts`

### Implementation (After Tests Fail → Implement → Green)

- [ ] T020 Implement shared TypeScript types (`SpikeACorpusEntry`, `SpikeAResult`, `SpikeBCorpusEntry`, `SpikeBResult`, `SpikeASummary`, `SpikeBSummary`, `EndToEndResult`) in `spikes/shared/types.ts` (**copy to both spikes**, no symlinks for Windows compatibility)
- [ ] T021 Implement corpus loader (`loadManifest()`, `resolveImagePath()`, `validateEntry()`) in `spikes/spike-a/src/harness/corpus-loader.ts` and `spikes/spike-b/src/harness/corpus-loader.ts`
- [ ] T022 Implement measurement recorder (`recordResult()`, `computeAggregate()`, `writeJSON()`) with **cold-start timing tracking** in `spikes/spike-a/src/harness/measurements.ts` and `spikes/spike-b/src/harness/measurements.ts`
- [ ] T023 Implement result schema validators (Zod or manual) for `SpikeAResult`, `SpikeBResult`, `EndToEndResult` in `spikes/shared/validators.ts`
- [ ] T022 Create Spike A harness entry point (`run-spike-a.ts`): loads corpus, iterates candidates, runs measurements, writes `src/results/spike-a-{platform}.json` in `spikes/spike-a/src/harness/run-spike-a.ts`
- [ ] T023 Create Spike B harness entry point (`run-spike-b.ts`): loads corpus, iterates candidates, runs measurements, writes `src/results/spike-b-{platform}.json` in `spikes/spike-b/src/harness/run-spike-b.ts`
- [ ] T024 Create End-to-End runner (`run-e2e.ts`): composes Spike B render → Spike A OCR, writes `src/results/end-to-end-{platform}.json` in `spikes/spike-a/src/harness/run-e2e.ts` (or shared)
- [ ] T025 Verify T016–T019 red (no impl yet), then implement T020–T024 to green (`pnpm test` passes in both spikes)

**Checkpoint**: Foundation ready — `pnpm test` passes in both spikes; harnesses load corpus, run measurements, write JSON. Spike execution can begin.

---

## Phase 3: User Story 1 — ML Kit Chinese OCR Spike Execution (Priority: P1)

**Goal**: Evaluate ML Kit wrapper candidates on real Android + iPhone with 20-image corpus; produce decision record with measurements, chosen wrapper, interface sketch.

**Independent Test**: SA-2/SA-3 from quickstart — run Spike A harness on real Android device and real iPhone with 20-image corpus in airplane mode; verify accuracy ≥ 0.95, warm time < 2s, structured output.

### Tests (Written FIRST — Red-Green-Refactor)

- [ ] T030 [P] [US1] Write Jest test for candidate wrapper registry (loads `react-native-mlkit-text-recognition`, `react-native-mlkit-vision`, validates exports) in `spikes/spike-a/src/candidates/__tests__/registry.test.ts`
- [ ] T031 [P] [US1] Write Jest test for OCR measurement adapter (wraps candidate `recognize()`, returns `SpikeAResult` with **cold/warm timing**, extracts lines/graphemes/confidence) in `spikes/spike-a/src/candidates/__tests__/adapter.test.ts`
- [ ] T032 [P] [US1] Write Maestro flow for Spike A device run (launch app, trigger corpus run, verify results file written) in `spikes/spike-a/e2e/maestro/spike-a-run.yaml`
- [ ] T033 [P] [US1] Write Maestro flow for airplane-mode verification (disable network, run corpus, verify no network calls) in `spikes/spike-a/e2e/maestro/spike-a-airplane.yaml`

### Implementation

- [ ] T034 [US1] Implement candidate wrapper registry (loads `react-native-mlkit-text-recognition`, `react-native-mlkit-vision`, exposes unified `OcrEngine` interface) in `spikes/spike-a/src/candidates/registry.ts`
- [ ] T035 [US1] Implement OCR measurement adapter (calls candidate `recognize()`, measures **cold/warm time**, extracts lines/graphemes/confidence, returns `SpikeAResult`) in `spikes/spike-a/src/candidates/adapter.ts`
- [ ] T036 [US1] Implement Spike A harness UI (minimal screen: "Run Corpus", "View Results", "Airplane Mode Test") in `spikes/spike-a/app/(tabs)/index.tsx`
- [ ] T037 [US1] Implement results screen (displays aggregate table: candidate × platform × accuracy/time) in `spikes/spike-a/app/results.tsx`
- [ ] T038 [US1] Add ML Kit model bundling config: verify `react-native-mlkit-text-recognition` plugin bundles Chinese model; if not, document native module design in `spikes/spike-a/app.config.ts`
- [ ] T039 [US1] **Run Spike A on Android device (SA-2) in airplane mode**: `cd spikes/spike-a && pnpm eas build --platform android --profile development`, install, run harness **with Wi-Fi/cellular disabled**, record `src/results/spike-a-android.json`
- [ ] T040 [US1] **Run Spike A on iOS device (SA-3) in airplane mode**: `cd spikes/spike-a && pnpm eas build --platform ios --profile development`, TestFlight install, run harness **with Wi-Fi/cellular disabled**, record `src/results/spike-a-ios.json`
- [ ] T041 [US1] Write Spike A Decision Record (`DECISION_RECORD.md`) with: options evaluated, measurements table, chosen wrapper, rejected options, risks, interface sketch path, go/no-go for M4 in `spikes/spike-a/DECISION_RECORD.md`
- [ ] T042 [US1] Extract verified interface sketch (`OcrEngine`, `OcrResult`, `OcrLine`, `OcrGrapheme`) to `spikes/INTERFACE_SKETCHES/ocr-engine.ts`
- [ ] T043 [US1] **Add maintenance health evaluation task**: document GitHub stars, recent commits, open issues, npm downloads for each candidate in decision record
- [ ] T044 [US1] **Document full return structure per candidate**: full text, blocks, lines, elements, bounding boxes, coordinate space, confidence per level in decision record
- [ ] T045 [US1] Verify T030–T033 green and run SA-2/SA-3/SA-4 validation on Android + iOS

**Checkpoint**: US1 complete — Spike A decision record written, interface sketch extracted, go/no-go for M4 recorded.

---

## Phase 4: User Story 2 — PDF Text-Layer + Rendering Spike Execution (Priority: P1)

**Goal**: Evaluate PDF text-layer detection/extraction and page rendering candidates on real Android + iPhone with 10-PDF corpus; produce decision record with measurements, chosen approach, interface sketch.

**Independent Test**: SB-2/SB-3 from quickstart — run Spike B harness on real devices with 10-PDF corpus; verify text-layer detection, rendering at ~300 dpi, 20-page no OOM, distinct errors for edge cases.

### Tests (Written FIRST — Red-Green-Refactor)

- [ ] T060 [P] [US2] Write Jest test for PDF candidate registry (loads `react-native-pdf`, `pdfjs-dist`, `react-native-pdf-lib`, validates exports) in `spikes/spike-b/src/candidates/__tests__/registry.test.ts`
- [ ] T061 [P] [US2] Write Jest test for PDF detector adapter (wraps candidate `detectTextLayer()`, returns `PdfTextLayerInfo`) in `spikes/spike-b/src/candidates/__tests__/detector-adapter.test.ts`
- [ ] T062 [P] [US2] Write Jest test for PDF renderer adapter (wraps candidate `renderPageToImage()`, returns image path + timing) in `spikes/spike-b/src/candidates/__tests__/renderer-adapter.test.ts`
- [ ] T063 [P] [US2] Write Jest test for PDF pipeline composer (per-page text-layer-first logic, 20-page cap) in `spikes/spike-b/src/candidates/__tests__/pipeline.test.ts`
- [ ] T063 [P] [US2] Write Maestro flow for Spike B device run (launch, run corpus, verify results) in `spikes/spike-b/e2e/maestro/spike-b-run.yaml`
- [ ] T064 [P] [US2] Write Maestro flow for edge-case PDFs (25-page refusal, encrypted error, corrupted error) in `spikes/spike-b/e2e/maestro/spike-b-edges.yaml`

### Implementation

- [ ] T064 [US2] Implement PDF candidate registry (loads `react-native-pdf`, `pdfjs-dist`, `react-native-pdf-lib`, exposes `PdfDetector` + `PdfRenderer` interfaces) in `spikes/spike-b/src/candidates/registry.ts`
- [ ] T065 [US2] Implement PDF detector adapter (wraps candidate text-layer detection, applies **"usable text layer" heuristic**: text length > 10 chars, non-whitespace ratio > 50%, reading order plausible), returns `PdfTextLayerInfo` in `spikes/spike-b/src/candidates/detector-adapter.ts`
- [ ] T066 [US2] Implement PDF renderer adapter (wraps candidate page rendering at **300 DPI exactly (scale = 300/72 ≈ 4.17x)**, returns image path + dimensions + timing) in `spikes/spike-b/src/candidates/renderer-adapter.ts`
- [ ] T067 [US2] Implement PDF pipeline composer (per-page: detect text layer → if usable extract text else render → OCR; enforces 20-page cap; **fail-fast refusal at page count check**; sequential render) in `spikes/spike-b/src/candidates/pipeline.ts`
- [ ] T068 [US2] Implement Spike B harness UI (minimal: "Run Corpus", "View Results", "Edge Cases") in `spikes/spike-b/app/(tabs)/index.tsx`
- [ ] T069 [US2] Implement results screen (aggregate table: candidate × platform × text-layer accuracy/render time/memory) in `spikes/spike-b/app/results.tsx`
- [ ] T070 [US2] Add PDF plugin config: verify chosen candidate has Expo config plugin for iOS/Android (autolinking works, native builds succeed) in `spikes/spike-b/app.config.ts`
- [ ] T070 [US2] **Run Spike B on Android device (SB-2) in airplane mode**: `cd spikes/spike-b && pnpm eas build --platform android --profile development`, install, run harness **with Wi-Fi/cellular disabled**, record `src/results/spike-b-android.json`
- [ ] T071 [US2] **Run Spike B on iOS device (SB-3) in airplane mode**: `cd spikes/spike-b && pnpm eas build --platform ios --profile development`, TestFlight install, run harness **with Wi-Fi/cellular disabled**, record `src/results/spike-b-ios.json`
- [ ] T072 [US2] Write Spike B Decision Record (`DECISION_RECORD.md`) with: options evaluated, measurements table, chosen PDF approach, rejected options, risks, interface sketch path, go/no-go for M6 in `spikes/spike-b/DECISION_RECORD.md`
- [ ] T073 [US2] **Document "usable text layer" heuristic criteria**: text length > 10 chars, non-whitespace ratio > 50%, reading order plausible (left-to-right or right-to-left consistent) in decision record
- [ ] T073 [US2] **Document error message templates** for each failure mode: password-protected, corrupted, zero pages, OOM, over-cap
- [ ] T074 [US2] **Add maintenance health evaluation task**: document GitHub stars, recent commits, open issues, npm downloads for each PDF candidate in decision record
- [ ] T075 [US2] **Document full return structure per candidate**: text-layer detection accuracy, extracted text quality, render timing, memory behavior
- [ ] T076 [US2] Verify T060–T064 green and run SB-2/SB-3/SB-4 validation on Android + iOS

**Checkpoint**: US2 complete — Spike B decision record written, interface sketches extracted, go/no-go for M6 recorded.

---

## Phase 5: User Story 3 — End-to-End Chain Validation (Priority: P1)

**Goal**: Prove full chain on both platforms: scanned PDF → rendered page image → ML Kit Chinese recognition → structured result (text, lines, boxes, confidence) with timing, in airplane mode.

**Independent Test**: EE-1/EE-2 from quickstart — run composed pipeline on both devices in airplane mode; verify structured output, timing, accuracy.

### Tests (Written FIRST — Red-Green-Refactor)

- [ ] T078 [P] [US3] Write Jest test for end-to-end composer (imports Spike A `OcrEngine`, Spike B `PdfPipeline`, composes `processPdf → render → recognize`) in `spikes/spike-a/src/harness/__tests__/e2e-composer.test.ts`
- [ ] T079 [P] [US3] Write Maestro flow for end-to-end chain (pick scanned PDF, run full pipeline, verify structured output) in `spikes/spike-a/e2e/maestro/e2e-chain.yaml`

### Implementation

- [ ] T080 [US3] Implement end-to-end composer (imports chosen Spike A `OcrEngine`, Spike B `PdfPipeline`, runs `processPdf → for each page: render → recognize`, returns `EndToEndResult` with **render vs OCR timing breakdown**) in `spikes/spike-a/src/harness/e2e-composer.ts`
- [ ] T081 [US3] Add end-to-end button to Spike A harness UI ("Run E2E Chain") in `spikes/spike-a/app/(tabs)/index.tsx`
- [ ] T082 [US3] **Run end-to-end on Android (EE-1) in airplane mode**: airplane mode, run scanned PDF through chain, record `src/results/end-to-end-android.json`
- [ ] T083 [US3] **Run end-to-end on iOS (EE-1) in airplane mode**: airplane mode, run scanned PDF through chain, record `src/results/end-to-end-ios.json`
- [ ] T084 [US3] **Verify EE-2 pass criteria**: structured output + timing + accuracy ≥ 0.95 on both platforms
- [ ] T085 [US3] **Document render vs OCR timing breakdown** in end-to-end results
- [ ] T086 [US3] Verify T078–T079 green and run EE-1/EE-2 validation on Android + iOS

**Checkpoint**: US3 complete — end-to-end chain validated on both platforms, SC-002 satisfied.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Decision records, interface sketches, go/no-go verdicts, cleanup, go/no-go for M4/M6

- [ ] T087 [P] Copy Spike A decision record to shared location: `cp spikes/spike-a/DECISION_RECORD.md spikes/DECISION_RECORDS/spike-a-decision.md`
- [ ] T088 [P] Copy Spike B decision record to shared location: `cp spikes/spike-b/DECISION_RECORD.md spikes/DECISION_RECORDS/spike-b-decision.md`
- [ ] T089 [P] Copy interface sketches to shared location: `cp spikes/INTERFACE_SKETCHES/* spikes/INTERFACE_SKETCHES/` (verify `ocr-engine.ts`, `pdf-detector.ts`, `pdf-renderer.ts`, `pdf-pipeline.ts`, `conventions.ts`, `errors.ts`)
- [ ] T090 [P] **Verify go/no-go for M4**: `grep -i "goNoGoM4.*go" spikes/DECISION_RECORDS/spike-a-decision.md`
- [ ] T091 [P] **Verify go/no-go for M6**: `grep -i "goNoGoM6.*go" spikes/DECISION_RECORDS/spike-b-decision.md`
- [ ] T092 [P] **Record app size deltas**: measure APK/IPA size with chosen approaches vs base; record in decision records
- [ ] T093 [P] **Verify spike harness isolation**: `grep -r "spike" package.json` (root) returns no spike deps; losing candidates not in root `package.json`
- [ ] T094 [P] **Audit each spike app's package.json**: verify each spike app's `package.json` contains only the chosen candidate dependency (no losing candidates) in `spikes/spike-a/package.json` and `spikes/spike-b/package.json`
- [ ] T095 [P] Run full quickstart.md validation (SA-1..SA-4, SB-1..SB-4, EE-1..EE-2) on both platforms
- [ ] T096 [P] Archive spike corpus manifests to `assets/spike-corpus/` for M4/M6 test fixtures
- [ ] T097 [P] **Document coordinate conventions**: bounds normalized 0-1, origin top-left, orientation corrected; ML Kit confidence at element level; graphemes inherit parent confidence
- [ ] T098 [P] **Document vertical-text heuristic parameters**: page aspect ratio > 1.5 AND median element width > height → sort by right descending (right-to-left columns), then top
- [ ] T099 [P] **Document grapheme splitting algorithm**: Unicode grapheme cluster via `Intl.Segmenter`, proportional bounds allocation
- [ ] T100 [P] **Document confidence model per platform**: ML Kit reports at element level on both platforms; threshold 0.7 applied at display time; graphemes inherit parent confidence
- [ ] T101 [P] **Document 300 DPI rendering spec**: scale = 300/72 ≈ 4.17x PDF points to pixels; JPEG 85% quality; ≤ 20 MB/page
- [ ] T102 [P] **Record build-time impact**: measure build time delta with chosen approaches
- [ ] T103 [P] Run full quickstart.md validation (SA-1..SA-4, SB-1..SB-4, EE-1..EE-2) on both platforms
- [ ] T104 [P] Archive spike corpus manifests to `assets/spike-corpus/` for M4/M6 test fixtures
- [ ] T105 [P] Clean up: remove spike apps from repo if M4/M6 start in separate modules, or keep in `spikes/` for reference (document decision)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — starts immediately (T001–T015; T004/T005/T007/T008/T010/T011 parallel)
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all spike execution. Tests T016–T019 first, then T020–T025.
- **User Stories (Phases 3–5)**: All depend on Foundational. US1 and US2 can run in parallel (different spikes). US3 depends on US1 + US2 completion.
- **Polish (Phase 6)**: Depends on US1–US3 complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependencies on US2/US3.
- **US2 (P1)**: After Foundational — independent of US1; can run in parallel.
- **US3 (P1)**: After US1 + US2 — needs chosen wrapper + PDF approach.

### Within Each User Story

- Tests FIRST and FAIL before implementation (T030–T033; T060–T064; T078–T079).
- Candidate evaluation before harness UI; harness UI before device runs; device runs before decision record.
- Decision record before interface sketch extraction; interface sketch before M4/M6 go/no-go.

### Parallel Opportunities

- T004 + T005 + T007 + T008 + T010 + T011 (setup parallel)
- T016 + T017 + T018 + T019 (foundational tests parallel)
- T030–T033 (US1 tests parallel) | T060–T064 (US2 tests parallel)
- US1 device runs (T039) + US2 device runs (T070) can run in parallel (different devices)
- T087–T089 (polish copies parallel)

---

## Parallel Example: Spike A Candidate Evaluation

```bash
# Launch candidate evaluation together (verified FAIL first):
Task: "Write Jest test for candidate wrapper registry in spikes/spike-a/src/candidates/__tests__/registry.test.ts"
Task: "Write Jest test for OCR measurement adapter in spikes/spike-a/src/candidates/__tests__/adapter.test.ts"
Task: "Write Maestro flow for Spike A device run in spikes/spike-a/e2e/maestro/spike-a-run.yaml"
Task: "Write Maestro flow for airplane-mode verification in spikes/spike-a/e2e/maestro/spike-a-airplane.yaml"

# After tests fail → implement candidates in parallel:
Task: "Implement candidate wrapper registry in spikes/spike-a/src/candidates/registry.ts"
Task: "Implement OCR measurement adapter in spikes/spike-a/src/candidates/adapter.ts"
```

## Parallel Example: Spike B Candidate Evaluation

```bash
Task: "Write Jest test for PDF candidate registry in spikes/spike-b/src/candidates/__tests__/registry.test.ts"
Task: "Write Jest test for PDF detector adapter in spikes/spike-b/src/candidates/__tests__/detector-adapter.test.ts"
Task: "Write Jest test for PDF renderer adapter in spikes/spike-b/src/candidates/__tests__/renderer-adapter.test.ts"
Task: "Write Jest test for PDF pipeline composer in spikes/spike-b/src/candidates/__tests__/pipeline.test.ts"
```

---

## Implementation Strategy

### Spike-First (M1 Only)

1. Complete Phase 1: Setup (T001–T015).
2. Complete Phase 2: Foundational (T016–T025) — tests-first, red before green.
3. Complete Phase 3: US1 (T030–T045) — Spike A on both devices.
4. Complete Phase 4: US2 (T060–T076) — Spike B on both devices (parallel with US1 if devices available).
5. Complete Phase 5: US3 (T078–T086) — End-to-end chain.
6. **STOP and VALIDATE**: Both spikes pass, decision records written, interface sketches verified, go/no-go for M4/M6.
6. Complete Phase 6: Polish (T087–T105) — copy artifacts, verify isolation, clean up.

### Incremental Delivery

1. Setup + Foundational → harnesses ready.
2. + US1 → Spike A verdict (ML Kit wrapper chosen).
3. + US2 → Spike B verdict (PDF approach chosen).
4. + US3 → End-to-end chain verified.
5. Polish → Decision records + interface sketches delivered to M4/M6.

### Parallel Team Strategy

With multiple developers post-Foundational:
- Dev A: US1 (Spike A — ML Kit wrapper evaluation on Android)
- Dev B: US2 (Spike B — PDF evaluation on Android)
- Dev C: US1 iOS + US2 iOS (EAS Build + TestFlight runs)
- Dev D: US3 (End-to-end composer) + Phase 6 (decision records, interface sketches)

Stories merge via shared `spikes/shared/` types and `spikes/INTERFACE_SKETCHES/` without file conflicts.

---

## Notes

- [P] tasks = different files, no dependencies — safe for parallel agents.
- [Story] label maps each story-phase task to its user story for traceability.
- **Test-First is NON-NEGOTIABLE** (Constitution Principle V): ALL test tasks (T016–T019, T030–T033, T060–T064, T078–T079) MUST be written FIRST, verified FAIL, then implementation.
- Spike apps are THROWAWAY — keep in `spikes/` folder, do NOT import from main app.
- Losing candidate dependencies MUST NOT enter root `package.json` (T093).
- Real devices MANDATORY for pass/fail (Quickstart). Emulator/simulator for dev only.
- iOS builds via EAS Build (cloud) — no Mac required locally.
- If a spike FAILS: decision record states fallback (custom Expo native module per Principle VI) and cost.
- Constitution Principle I: NO network permission, NO runtime model download, airplane mode mandatory.
- Constitution Principle VI: Native code ONLY if spike proves gap (custom native module as fallback).
- **Windows compatibility**: Use copy (not symlink) for shared types (T020).
- **Exact DPI**: 300 DPI = scale 300/72 ≈ 4.17x (T066).
- **New Architecture validation**: Verify Fabric renderer + TurboModules + Hermes compatibility (T034, T052).
- **New Architecture**: Fabric renderer, TurboModules, Hermes (T034).
- **Usable text layer heuristic**: text length > 10 chars, non-whitespace ratio > 50%, reading order plausible (T065).
- **300 DPI exact**: scale = 300/72 ≈ 4.17x PDF points to pixels (T066).
- **Fail-fast 20-page cap**: refuse at page count check before rendering (T067).
- **Confidence model**: ML Kit reports at element level on both platforms; threshold 0.7 applied at display; graphemes inherit parent confidence (T100).
- **Coordinate conventions**: bounds 0-1 normalized, origin top-left, orientation corrected (T097).
- **Vertical heuristic**: aspect ratio > 1.5 AND median element width > height → sort right desc (T098).
- **Grapheme splitting**: `Intl.Segmenter` Unicode grapheme clusters, proportional bounds (T099).
- **Version pinning**: exact versions for spikes, locked in decision record (T037, T072).
- **Error message templates**: password-protected, corrupted, zero pages, OOM, over-cap (T073).
- **Cold-start timing**: measured separately from warm runs (T020, T031).
- **Render vs OCR timing**: separate breakdown in end-to-end results (T085).
- **Exact versions**: locked in decision record for spikes (T037, T072).
- **Build-time impact**: measured and recorded (T102).