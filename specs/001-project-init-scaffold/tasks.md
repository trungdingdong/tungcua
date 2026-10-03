# Tasks: Project Init & P0 Scaffold (Capture + OCR + Text)

**Input**: Design documents from `/specs/001-project-init-scaffold/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Tests**: Requested — constitution principle V (test-first, NON-NEGOTIABLE) + spec FR-014 snapshot-corpus gate. Test tasks are included and MUST be written first, verified FAIL before implementation.
**Organization**: Grouped by user story; each story independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths in every description.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: GitHub repo + Xcode scaffold + legal/constitutional hygiene

- [ ] T001 Create private GitHub repo `tungcua` (branch `main`) and push initial commit containing `README.md`
- [X] T002 Scaffold single Xcode app target `TungCua` (Swift 6, SwiftUI, iOS 17+ deployment) in `TungCua.xcodeproj`
- [X] T003 Write clone-to-run setup steps (fresh-clone build, simulator run) in `README.md`
- [X] T004 [P] Add license texts (CC BY-SA for CC-CEDICT, Arphic for MakeMeAHanzi/hanzi-writer, Vietnamese-corpus placeholder) in `TungCua/Resources/LICENSES/`
- [X] T005 [P] Add Xcode/Swift/macOS gitignore rules in `.gitignore`
- [X] T006 Remove Sync Impact Report HTML comment from `.specify/memory/constitution.md` before first commit
- [ ] T007 Add OpenCC Swift package dependency (display-only conversion) in `TungCua.xcodeproj/project.pbxproj`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Theme, persistence models, file store, snapshot fixtures, app shell — MUST complete before ANY user story

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T008 Write DocumentStore round-trip + delete-cascade test FIRST (assert deleting a doc deletes its pages + image files, no orphans) in `Tests/Unit/DocumentStoreTests.swift`
- [X] T009 [P] Write PDF page-count cap test FIRST (assert `pages.count <= 20`, over-cap refused with message stating the cap) in `Tests/Unit/PDFRasterizerTests.swift`
- [X] T010 [P] Write agent-facing design-principles doc capturing pastel colorways + UI style from `PROJECT_SCOPE.md` Theme section and constitution UX & Design Language (token names with light/dark hex: `BgBase`/`BgAlt`, `MintSurface/Primary/Ink`, `PinkSurface/Primary/Ink`; pastels surfaces-only never body text; tapped=mint, saved=pink; low-confidence pink-ink underline, no red; SF Rounded hero char + SF Pro body; stroke-player pastel track, ink strokes, pink current stroke; dark-mode surfaces; theme-tokens-only rule, no hardcoded hex in views) in `TungCua/Theme/DesignPrinciples.md`
- [X] T011 [P] Implement theme token palette per `TungCua/Theme/DesignPrinciples.md` (`BgBase`, `BgAlt`, `MintSurface/Primary/Ink`, `PinkSurface/Primary/Ink`, light/dark, zero hardcoded hex in views) in `TungCua/Theme/Theme.swift`
- [X] T012 Implement `ScannedDoc` model (fields: `id` UUID auto-generated; `createdAt` immutable, recents sort desc; `title` default `Document <yyyy-MM-dd HH:mm>`; `sourceKind` enum `scan|photo|pdf|mixed`; `pageCount` derived equals `pages.count`; `status` enum `importing|ready|recognizing|recognized|partial|failed`; validation `pages.count <= 20` and `status == .recognized` only when every page is `.recognized` or `.noText`) in `TungCua/Persistence/ScannedDoc.swift`
- [X] T013 [P] Implement `DocPage` + `RecognizedLine` value type (fields: `index` zero-based, reorder updates indexes; `imageFileName` relative under `Documents/PageImages/`, file must exist; `thumbnailFileName` optional, lazy; `ocrStatus` enum `pending|recognizing|recognized|noText|failed`; `lines` empty unless `recognized`, stored verbatim recognized variant; `averageConfidence` nil unless recognized; validation: image file ≤ 20 MB per page, boxes normalized to 0–1, confidence 0–1 with `< 0.6` rendering pink-ink underline, candidates top-3 retained) in `TungCua/Persistence/DocPage.swift`
- [X] T014 Implement `DocumentStore` per contract (`createDoc`, `addPages`, `updateLines` idempotent replace-never-append, `fetchRecents`, `deleteDoc` cascades to pages + files) in `TungCua/Persistence/DocumentStore.swift`
- [X] T015 [P] Implement file-backed page image store (write/read/delete under `Documents/PageImages/`, thumbnail derivation on demand) in `TungCua/Persistence/PageImageStore.swift`
- [X] T016 [P] Check in snapshot corpus fixtures with ground truth + thresholds (printed ≥ 0.95 gating, vertical ≥ 0.80 tracked, handwritten ≥ 0.60 tracked) in `Tests/SnapshotCorpus/`
- [X] T017 Wire app entry + P0 routes (Home, ScanReview, OCRProgress, Reader) in `TungCua/App/TungCuaApp.swift`

**Checkpoint**: Foundation ready — `xcodebuild test -only-testing:DocumentStoreTests,PDFRasterizerTests` red (no impl yet is fine); user story implementation can now begin.

---

## Phase 3: User Story 1 — Clone Repo and Build App Shell (Priority: P1) — MVP

**Goal**: Fresh clone builds and runs to branded Home with recents + Scan / Photos / Files entries and attribution screen.

**Independent Test**: QS-1 — fresh clone on second machine, README only, build + run on simulator → Home renders with entries, attribution reachable.

### Tests for User Story 1

> Write FIRST, ensure FAIL before implementation.

- [X] T018 [P] [US1] Write Home smoke UI test (launch → Home visible with Scan / Photos / Files buttons) in `Tests/UITests/HomeSmokeTests.swift`

### Implementation for User Story 1

- [X] T019 [P] [US1] Implement Home view (recents list via `fetchRecents`, Scan / Photos / Files entries, navigation to routes) in `TungCua/Features/Home/HomeView.swift`
- [X] T020 [P] [US1] Implement attribution placeholder screen (CC-CEDICT, MakeMeAHanzi/hanzi-writer, Vietnamese corpus) in `TungCua/Resources/AttributionView.swift`
- [ ] T021 [US1] Verify T018–T020 green and run QS-1 clone-to-Home validation in `specs/001-project-init-scaffold/quickstart.md`

**Checkpoint**: US1 fully functional and independently testable — MVP shippable as app shell.

---

## Phase 4: User Story 2 — Capture or Import a Document (Priority: P1)

**Goal**: Camera scan + photo import + PDF import (20-page cap) with retake/crop/page-list review and permission handling.

**Independent Test**: QS-2 + QS-6 — scan 1 page (device), import 1 photo, import ≤20-page PDF (listed), import >20-page PDF (refused with cap message), deny camera (guidance + Settings link, no crash).

### Tests for User Story 2

> Write FIRST, ensure FAIL before implementation.

- [X] T022 [P] [US2] Write CaptureService import tests (photo import adds `DocPage(ocrStatus: .pending)` with file on disk; PDF >20 pages refused with `"PDF has <N> pages; P0 supports up to 20."`; unreadable input yields `"No readable pages found."`) in `Tests/Unit/CaptureServiceTests.swift`
- [X] T023 [P] [US2] Write PDF rasterize tests (300 dpi equivalent scale, sequential pages, per-page image ≤ 20 MB) in `Tests/Unit/PDFRasterizerTests.swift`

### Implementation for User Story 2

- [X] T024 [US2] Implement PDF rasterizer (PDFKit per-page 300 dpi render, pre-flight page-count check enforcing `pages.count <= 20`, sequential processing with autoreleasepool) in `TungCua/Services/PDFRasterizer.swift`
- [X] T025 [US2] Implement CaptureService (`scan`, `importPhotos`, `importPDF`; postcondition: every added page has image file on disk + `DocPage(ocrStatus: .pending)`) in `TungCua/Services/CaptureService.swift`
- [X] T026 [P] [US2] Implement VisionKit scan bridge (`VNDocumentCameraViewController` via `UIViewControllerRepresentable`, camera-unavailable empty state for simulator) in `TungCua/Features/Capture/ScanBridge.swift`
- [X] T027 [P] [US2] Implement system import pickers (`PhotosPicker` for photos, `UIDocumentPickerViewController` for images + PDF) in `TungCua/Features/Capture/ImportPickers.swift`
- [X] T028 [US2] Implement scan review UI (retake, crop, add/remove/reorder pages before recognition) in `TungCua/Features/Capture/ScanReviewView.swift`
- [X] T029 [P] [US2] Add privacy purpose strings + denial/revocation guidance (Settings link, captured pages preserved) in `TungCua/InfoPlist/Info.plist`
- [ ] T030 [US2] Verify T022–T023 green and run QS-2 + QS-6 validation in `specs/001-project-init-scaffold/quickstart.md`

**Checkpoint**: US1 + US2 both work independently — capture funnel complete.

---

## Phase 5: User Story 3 — Recognize Text and Read Plain Result (Priority: P1)

**Goal**: On-device OCR per page with progress, plain-text Reader (Original | Text toggle, font-size, Trad/Simp display, pink-ink low-confidence underline).

**Independent Test**: QS-3 + QS-4 — printed page recognizes → progress per page → Reader text matches page; toggles work without data loss; identical behavior in airplane mode.

### Tests for User Story 3

> Write FIRST, ensure FAIL before implementation.

- [X] T031 [P] [US3] Write OCR service tests (Vision `.accurate`, `recognitionLanguages = ["zh-Hant", "zh-Hans", "en"]`, `noText` on blank page, `failed` reason passthrough, confidence < 0.6 flagged) in `Tests/Unit/OCRServiceTests.swift`
- [X] T032 [P] [US3] Write OpenCC display-mapping tests (Trad↔Simp round-trip on sample strings, pure function, stored text untouched) in `Tests/Unit/TextDisplayConversionTests.swift`

### Implementation for User Story 3

- [X] T033 [US3] Implement on-device OCR service (`VNRecognizeTextRequest`, `.accurate`, off-main-thread, one page at a time, no network calls) in `TungCua/Services/OCRService.swift`
- [X] T034 [P] [US3] Implement display-only OpenCC conversion (`display(_:as:)` pure, never mutates stored text) in `TungCua/Services/TextDisplayConversion.swift`
- [X] T035 [US3] Implement OCR progress UI (per-page `pending|recognizing|recognized|noText|failed` status with thumbnails) in `TungCua/Features/OCR/OCRProgressView.swift`
- [X] T036 [US3] Implement Reader view (Original | Text toggle, font-size slider, Trad/Simp toggle, low-confidence `pinkInk` underline only, `noText` explicit empty state) in `TungCua/Features/Reader/ReaderView.swift`
- [ ] T037 [US3] Verify T031–T032 green and run QS-3 + QS-4 validation in `specs/001-project-init-scaffold/quickstart.md`

**Checkpoint**: US1–US3 independently functional — P0 exit (OCR works, text displays) met.

---

## Phase 6: User Story 4 — Reopen a Past Document Offline (Priority: P2)

**Goal**: Recents survive restart; delete removes doc + pages + files with no orphans.

**Independent Test**: QS-5 — recognize doc → force-quit → relaunch → doc present with text intact; delete → gone from recents and storage.

### Tests for User Story 4

> Write FIRST, ensure FAIL before implementation.

- [X] T038 [P] [US4] Write persistence UI test (recognize → terminate → relaunch → doc listed and openable; delete → absent) in `Tests/UITests/PersistenceTests.swift`

### Implementation for User Story 4

- [X] T039 [US4] Implement recents wiring (fetch sorted by immutable `createdAt` desc, open doc → Reader, delete with cascade) in `TungCua/Features/Home/HomeViewModel.swift`
- [ ] T040 [US4] Verify T038 green and run QS-5 validation in `specs/001-project-init-scaffold/quickstart.md`

**Checkpoint**: All user stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Gates, accessibility, and scope discipline across all stories.

- [ ] T041 [P] Run full `xcodebuild test` (unit + snapshot corpus: printed tier gating, vertical/handwritten tracked, zero regressions) and record results in `Tests/SnapshotCorpus/RESULTS.md`
- [X] T042 [P] Device gate check (printed page OCR <2 s/page on iPhone 13+, launch to Home <2 s) and record in `Tests/SnapshotCorpus/RESULTS.md`
- [X] T043 [P] VoiceOver + Dynamic Type audit across Home → Capture → Reader and fix labels in `TungCua/Features/`
- [X] T044 [P] Light/dark theme audit (pastels surfaces-only, no hardcoded hex in any `View`, low-confidence `pinkInk` only) in `TungCua/Theme/Theme.swift`
- [X] T045 Review no-network compliance (no network entitlement added, no remote calls; airplane-mode QS-4 green) in `TungCua.xcodeproj/project.pbxproj`
- [X] T046 Scope-leak sweep (no per-character tap/detail, stroke, TTS, bookmarks/history detail, correction UI, search, flashcards, export, iCloud, paraphrase) across `TungCua/`
- [ ] T047 Run full `specs/001-project-init-scaffold/quickstart.md` QS-1..QS-8 end-to-end and fix gaps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — starts immediately (T001→T007 in order; T004/T005 parallel).
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories. Tests T008/T009 first, then T010–T017.
- **User Stories (Phases 3–6)**: All depend on Foundational. Proceed in priority order US1 → US2 → US3 → US4, or in parallel if staffed (each story touches distinct files).
- **Polish (Phase 7)**: Depends on all desired stories complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependencies on other stories.
- **US2 (P1)**: After Foundational — integrates with US1 Home entries but independently testable via QS-2.
- **US3 (P1)**: After Foundational — consumes US2 pages but OCR/Reader testable with fixture images alone.
- **US4 (P2)**: After Foundational — consumes US2/US3 data but relaunch/delete testable with any stored doc.

### Within Each User Story

- Tests FIRST and FAIL before implementation (T018; T022–T023; T031–T032; T038).
- Services before UI; contract postconditions before integration; story validation task closes each phase.

### Parallel Opportunities

- T004 + T005 (licenses, gitignore); T009/T010/T011/T013/T015/T016 (independent files in Foundational).
- T018/T019/T020; T022 + T023; T026 + T027 + T029; T031 + T032; T034 parallel with T033/T035.
- US1–US4 can run in parallel post-Foundational with separate developers (distinct files per story).
- T041–T044 polish audits run in parallel (different surfaces).

---

## Parallel Example: User Story 2

```bash
# Launch story tests together (verified FAIL first):
Task: "Write CaptureService import tests in Tests/Unit/CaptureServiceTests.swift"
Task: "Write PDF rasterize tests in Tests/Unit/PDFRasterizerTests.swift"

# Launch independent UI bridges together after services:
Task: "Implement VisionKit scan bridge in TungCua/Features/Capture/ScanBridge.swift"
Task: "Implement system import pickers in TungCua/Features/Capture/ImportPickers.swift"
Task: "Add privacy purpose strings in TungCua/InfoPlist/Info.plist"
```

## Parallel Example: User Story 3

```bash
Task: "Write OCR service tests in Tests/Unit/OCRServiceTests.swift"
Task: "Write OpenCC display-mapping tests in Tests/Unit/TextDisplayConversionTests.swift"
# Then after green:
Task: "Implement display-only OpenCC conversion in TungCua/Services/TextDisplayConversion.swift"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T007).
2. Complete Phase 2: Foundational (T008–T017) — tests-first, red before green.
3. Complete Phase 3: US1 (T018–T021).
4. **STOP and VALIDATE**: QS-1 fresh-clone build → Home. Deploy/demo shell.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. + US1 → shell demo (MVP).
3. + US2 → capture demo (QS-2/QS-6).
4. + US3 → P0 exit demo (QS-3/QS-4, OCR + Reader offline).
5. + US4 → persistence demo (QS-5).
6. Polish → gates recorded (QS-7/QS-8, T041–T047).

### Parallel Team Strategy

With multiple developers post-Foundational: Dev A → US1 shell/Home; Dev B → US2 capture/rasterize; Dev C → US3 OCR/Reader; Dev D → US4 recents/delete. Stories merge via `DocumentStore` + `DocPage` contracts without file conflicts.

---

## Notes

- [P] tasks = different files, no dependencies — safe for parallel agents.
- [Story] label maps each story-phase task to its user story for traceability.
- Field constraints quoted verbatim from data-model.md (caps, enums, thresholds) — no implementation-time discretion.
- Commit after each task or logical group; stop at any checkpoint to validate story independently.
- P1+ scope (tap detail, dictionary DB, stroke, TTS, correction, export, sync, paraphrase) shipping here = scope leak, flag per T046.
