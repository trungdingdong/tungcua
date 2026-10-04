# Feature Specification: Cross-Platform Refactor (iOS + Android)

**Feature Branch**: `002-cross-platform-refactor`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "refactor project base -- refactor the current swift code to the new tech stack so that user from android could also use it, can refer to PROJECT_SCOPE.md file to get an understanding of what this project is about"

**Phase**: Foundation (pre-P1, enables parallel platform development)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Android User Scans and Reads Chinese Documents (Priority: P1)

An Android user installs TungCua from Play Store, grants camera/storage permissions, scans a printed Chinese page or imports a photo/PDF, runs on-device OCR, and reads recognized text with Trad/Simp toggle, font-size control, and low-confidence underline — functionally equivalent to iOS P0.

**Why this priority**: Android is 70%+ of global mobile; excluding it caps addressable market. Parity with iOS P0 is the minimum viable cross-platform deliverable.

**Independent Test**: Fresh install on Android 13+ device → scan 1 page → OCR runs on-device → Reader shows text with toggles/underline → reopen after kill → doc persists. No iOS device required.

**Acceptance Scenarios**:

1. **Given** Android app installed, **When** user grants camera permission and scans a printed Chinese page, **Then** page appears in review with crop/retake, confirm adds page.
2. **Given** Android app, **When** user imports a photo or ≤20-page PDF from gallery/files, **Then** pages are listed and ready for OCR.
3. **Given** pages ready, **When** user runs recognition, **Then** on-device OCR completes per page, progress shown, Reader opens with recognized text matching page.
4. **Given** recognized text, **When** user toggles Original|Text, adjusts font size, flips Trad/Simp, **Then** view updates without data loss; low-confidence chars show pink-ink underline.
5. **Given** recognized doc, **When** app is force-closed and reopened, **Then** doc appears in recents with text intact; delete removes it.
6. **Given** airplane mode, **When** full capture→OCR→read flow runs, **Then** behaves identically — zero network calls.

---

### User Story 2 - iOS User Experiences No Regression (Priority: P1)

Existing iOS P0 functionality (scan, import, OCR, reader, persistence, theme, offline) continues to work identically after refactor.

**Why this priority**: Cannot ship Android by breaking iOS. iOS is the reference implementation; refactor must be invisible to current users.

**Independent Test**: Run full iOS QS-1..QS-8 from `specs/001-project-init-scaffold/quickstart.md` — all pass.

**Acceptance Scenarios**:

1. **Given** iOS app built from refactored codebase, **When** run on simulator/device, **Then** Home, Scan, Import, OCR, Reader, Persistence all pass existing quickstart scenarios.
2. **Given** iOS theme tokens, **When** viewed in light/dark mode, **Then** colors match `DesignPrinciples.md` exactly (no visual drift).
3. **Given** iOS data, **When** migrating from pre-refactor build, **Then** existing docs/pages/text open correctly (migration or forward-compatible schema).

---

### User Story 3 - Shared Business Logic Eliminates Duplication (Priority: P2)

Dictionary lookup, OpenCC conversion, data models (ScannedDoc, DocPage, RecognizedLine), theme tokens, and OCR result processing are implemented once in shared code and used by both platforms.

**Why this priority**: Duplicating dictionary parsing, conversion, and data logic across Swift/Kotlin is error-prone and doubles maintenance. Shared Kotlin Multiplatform (KMP) library is the single source of truth.

**Independent Test**: Unit tests for shared module run on JVM (Gradle) and iOS (Xcode) — same test cases, same results.

**Acceptance Scenarios**:

1. **Given** shared `CharEntry` model, **When** iOS and Android both parse bundled dictionary SQLite, **Then** identical field values returned for same character.
2. **Given** shared `TextDisplayConversion`, **When** both platforms convert "简体" ↔ "繁體", **Then** results match byte-for-byte.
3. **Given** shared `RecognizedLine` + confidence threshold, **When** both platforms underline low-confidence, **Then** same characters flagged for same OCR input.
4. **Given** shared theme tokens, **When** both platforms render `MintPrimary` surface, **Then** hex `#7ED6B5` used on both (single source).

---

### User Story 4 - Platform-Specific OCR Engines Abstracted Behind Common Interface (Priority: P1)

iOS uses Apple Vision `VNRecognizeTextRequest`; Android uses ML Kit Text Recognition v2 (on-device, supports Chinese) or Tesseract fallback. Both implement a common `OcrEngine` interface so Reader/Store logic is shared.

**Why this priority**: OCR is the only fundamentally platform-specific component (no cross-platform Chinese OCR library exists). Abstraction keeps 90%+ of code shared.

**Independent Test**: Swap iOS OcrEngine implementation with a test double → Reader/Store tests still pass. Same on Android.

**Acceptance Scenarios**:

1. **Given** `OcrEngine` interface, **When** iOS implementation wraps Vision, **Then** returns `OcrResult` with lines, boxes, confidence, candidates.
2. **Given** `OcrEngine` interface, **When** Android implementation wraps ML Kit, **Then** returns same `OcrResult` shape for same input image.
3. **Given** blank page image, **When** either engine runs, **Then** returns `OcrStatus.noText` (not error).
4. **Given** low-confidence chars, **When** either engine runs, **Then** confidence < 0.6 flagged consistently.

---

### Edge Cases

- What happens when Android ML Kit Chinese model is not downloaded? → Prompt user to download (one-time, ~20 MB), fallback to Tesseract if offline, never silent failure.
- How does system handle vertical text / handwriting on Android? → ML Kit supports vertical; handwriting accuracy tracked honestly with same pink-ink underline + `noText`/`failed` states as iOS.
- How does PDF rasterize work on Android? → `PdfRenderer` at 300 dpi equivalent, 20-page cap, same refusal messages.
- How does shared SQLite dictionary ship on Android? → Bundled as asset, opened read-only via `SQLiteDatabase.openDatabase`; same schema as iOS.
- What if user has existing iOS data and installs Android? → Separate local storage per platform; iCloud sync is P3 (out of scope). No cross-platform sync in this refactor.
- How are theme tokens shared? → Defined in shared Kotlin `ThemeTokens` data class; iOS reads via generated Swift bindings; Android uses directly in Compose.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Android app MUST exist (package `com.tungcua.app`), build with Gradle, target Android 13+ (API 33), compileSdk 34, Kotlin 2.0+, Jetpack Compose Material3.
- **FR-002**: Shared Kotlin Multiplatform library MUST contain: data models (`ScannedDoc`, `DocPage`, `RecognizedLine`, `CharEntry`), `TextDisplayConversion` (OpenCC), `OcrEngine` interface + `OcrResult`/`OcrStatus` types, `ThemeTokens` (colors, spacing, typography), dictionary parsing logic, theme token values.
- **FR-003**: iOS app MUST consume shared KMP library via CocoaPods/SPM generated framework; SwiftUI views call shared logic through generated Swift APIs.
- **FR-004**: Android app MUST consume shared KMP library as Gradle dependency; Compose views call shared logic directly.
- **FR-005**: Both platforms MUST implement `OcrEngine`: iOS wraps Vision `.accurate` with `zh-Hant/zh-Hans/en`; Android wraps ML Kit Text Recognition v2 Chinese + Latin, with Tesseract fallback if ML Kit unavailable.
- **FR-006**: Both platforms MUST offer capture paths: camera scan (system document scanner on iOS, `DocumentScanner`/`CameraX` on Android), photo library import, file import (images + PDF).
- **FR-007**: Both platforms MUST rasterize PDF at 300 dpi equivalent, cap at 20 pages, refuse over-cap with identical message.
- **FR-008**: Both platforms MUST persist `ScannedDoc`/`DocPage` locally: iOS SwiftData, Android Room (same schema via shared entities). Delete cascades to pages + image files.
- **FR-009**: Reader MUST be functionally identical: Original|Text toggle, font-size slider, Trad/Simp display toggle (shared OpenCC), pink-ink low-confidence underline (< 0.6), explicit no-text state.
- **FR-010**: Theme tokens MUST be single-source: defined in shared KMP `ThemeTokens` (light/dark hex values from `DesignPrinciples.md`); iOS `Theme.swift` and Android `Theme.kt` generated/derived from it.
- **FR-011**: Both apps MUST remain fully offline-functional (airplane mode); no network entitlement/permission added for core flow.
- **FR-012**: Both apps MUST include license/attribution screens (CC-CEDICT CC BY-SA, MakeMeAHanzi Arphic, Vietnamese corpus placeholder) and bundled license files.
- **FR-013**: Snapshot corpus (printed/vertical/handwritten) MUST be shared test fixtures; both platforms run accuracy tests against same ground truth; printed tier ≥ 0.95 gates both.
- **FR-014**: Out of scope for this refactor (deferred): per-character tap + detail sheet (P1), stroke-order animation (P2), TTS (P2), bookmarks/history (P2), correction UI (P2), search (P2), flashcards/export (P3), iCloud/Android backup sync (P3), on-device paraphrase (P3). These remain platform-specific implementations later.

### Key Entities

- **Shared KMP Module**: `tungcua-shared` — Kotlin Multiplatform library (targets: iOS ARM64, iOS Simulator ARM64/X64, Android JVM). Contains all business logic, data models, interfaces, theme tokens, dictionary parsing, OpenCC conversion.
- **iOS App**: `TungCua` — SwiftUI app consuming `tungcua-shared` framework. Platform code: Vision OCR, SwiftData, VisionKit scan, SwiftUI views.
- **Android App**: `tungcua-android` — Compose Multiplatform app consuming `tungcua-shared` as Gradle dependency. Platform code: ML Kit/Tesseract OCR, Room, CameraX/DocumentScanner, Compose views.
- **Dictionary SQLite**: Bundled read-only asset on both platforms; same schema (`CharEntry`: char, pinyin, hanviet, en_gloss, vi_gloss, radical, strokes, hsk, freq, decomposition, trad/simp variants).
- **Snapshot Corpus**: Shared test fixtures (images + JSON manifest) consumed by both platform test suites.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Android user completes scan→OCR→read flow on first try without assistance (parity with iOS SC-003: 9/10 success rate).
- **SC-002**: Android printed horizontal Chinese OCR completes in under 3 seconds per page on mid-range device (Snapdragon 7 Gen 1 / equivalent); iOS remains <2 s/page on iPhone 13+.
- **SC-003**: Shared KMP module unit tests pass on both JVM (Gradle) and iOS (Xcode) with identical results — zero platform-specific test divergence.
- **SC-004**: Snapshot corpus accuracy: printed tier ≥ 0.95 on both platforms; vertical/handwritten tracked separately with honest lower bars; zero regressions vs checked-in baseline.
- **SC-005**: iOS quickstart QS-1..QS-8 all pass post-refactor — zero functional regression.
- **SC-006**: Theme visual parity: pixel-perfect match of `MintPrimary`/`PinkPrimary` surfaces, `PinkInk` underline, SF Rounded hero (iOS) / Material3 rounded (Android) — verified by design review checklist.
- **SC-007**: APK + IPA size increase from shared KMP ≤ 15 MB each (dictionary + shared logic); total bundle ≤ 150 MB per platform (constitution VII).
- **SC-008**: Developer can build both platforms from single repo clone: `./gradlew assembleDebug` (Android) and `xcodebuild` (iOS) — documented in unified README.

## Assumptions

- Cross-platform strategy: **Kotlin Multiplatform (KMP)** for shared logic + native UI (SwiftUI + Compose). Not Flutter/React Native — OCR and platform integrations are too native-heavy; KMP shares only what's portable.
- Android OCR: **ML Kit Text Recognition v2** (on-device, supports Chinese, Latin, Japanese, Korean) as primary; **Tesseract 5** (tessdata_fast Chinese) as offline fallback if ML Kit model download fails. Both are on-device, no cloud.
- iOS OCR: unchanged — Apple Vision `VNRecognizeTextRequest` `.accurate`.
- Minimum Android: API 33 (Android 13) — ML Kit Chinese support requires recent Play Services; matches iOS 17+ baseline philosophy.
- Dictionary SQLite: same file bundled on both platforms; shared Kotlin `SqlDelight` or raw SQLite driver for read-only access.
- Theme tokens: single source in KMP `ThemeTokens.kt` (data class with light/dark hex); iOS consumes via generated Swift struct; Android uses directly in Compose `ColorScheme`.
- No cross-platform sync (iCloud / Google Drive) in this refactor — P3 per constitution VI.
- Vietnamese gloss source still under curation; placeholder remains in both apps until resolved.
- OpenCC: shared KMP uses a Kotlin port (e.g., `opencc-kotlin`) or JNI wrapper; iOS continues using Swift OpenCC package. Output must match byte-for-byte.
- Team has or will acquire Android development capacity (Kotlin, Compose, Gradle).