# Feature Specification: Cross-Platform Foundation (iOS + Android)

**Feature Branch**: `003-cross-platform-foundation`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Cross-platform foundation for TungCua (iOS + Android, one codebase), delivering P0: capture, on-device OCR, and reading of Chinese documents. This replaces the earlier Swift/iOS-only scaffold (spec 001) and the Kotlin Multiplatform draft of this spec. Refer to PROJECT_SCOPE.md for product context."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scan and Read a Printed Page (Priority: P1)

A user on iOS or Android grants camera permission, photographs a printed Chinese page, reviews it (retake/crop), runs recognition with visible progress, and opens the Reader showing the recognized text.

**Why this priority**: Core P0 flow — scan → OCR → read. Must work identically on both platforms.

**Independent Test**: Fresh install on each platform, scan one page, reach the Reader with correct text.

**Acceptance Scenarios**:

1. **Given** app installed on iOS/Android, **When** user grants camera permission and scans a printed Chinese page, **Then** page appears in review with crop/retake, confirm adds page.
2. **Given** page added, **When** user runs recognition, **Then** on-device OCR completes with visible progress, Reader opens with recognized text matching the page.
3. **Given** recognition complete, **When** user views Reader, **Then** recognized text is displayed correctly.

---

### User Story 2 - Import Images and PDFs (Priority: P1)

A user imports a photo from the gallery or an image/PDF file from storage. PDFs up to 20 pages are accepted; larger ones are refused with a clear message. PDFs that already contain selectable text use that text directly; scanned PDFs are rendered to images and recognized.

**Why this priority**: Import is the alternative entry path for users who already have documents.

**Independent Test**: Import a 3-page text PDF and a 3-page scanned PDF on both platforms.

**Acceptance Scenarios**:

1. **Given** app on Home, **When** user imports a photo from gallery, **Then** photo is added as a document page ready for OCR.
2. **Given** a 3-page text-based PDF, **When** user imports it, **Then** embedded text layer is detected and used directly without re-OCR.
3. **Given** a 3-page scanned PDF, **When** user imports it, **Then** each page is rendered to an image at ~300 dpi equivalent and recognized.
4. **Given** a 25-page PDF, **When** user imports it, **Then** import is refused with a clear message stating the 20-page cap.

---

### User Story 3 - Reader Controls (Priority: P1)

User can switch between Original image and Recognized text, change font size, toggle Traditional/Simplified display (display only; stored text is unchanged), and see low-confidence text marked with a pink-ink underline. A page with no recognizable text shows an explicit "no text found" state, not an error.

**Why this priority**: Reader is the primary consumption interface; controls must be complete and consistent.

**Independent Test**: On a recognized document, toggle Original|Text, adjust font size, flip Trad/Simp, verify low-confidence underline appears, verify blank page shows "no text found".

**Acceptance Scenarios**:

1. **Given** recognized document in Reader, **When** user toggles Original|Text, **Then** view switches between page image and recognized text without data loss.
2. **Given** recognized text, **When** user adjusts font size slider, **Then** text size changes immediately (14–32 pt range).
3. **Given** recognized text, **When** user toggles Traditional/Simplified, **Then** display converts via OpenCC; stored text unchanged.
4. **Given** low-confidence text (ML Kit confidence < 0.7), **When** displayed, **Then** affected text has pink-ink underline (never red).
5. **Given** page with no recognizable text, **When** opened in Reader, **Then** explicit "no text found" state shown (not an error).

---

### User Story 4 - Persistence (Priority: P1)

Documents, pages, page images and recognized text survive app restarts and appear in a Recents list on Home. User can delete a document, which removes its pages and image files.

**Why this priority**: Core data integrity — user work must persist.

**Independent Test**: Scan a page, force-close app, reopen, document intact in Recents; delete document, verify removal.

**Acceptance Scenarios**:

1. **Given** recognized document, **When** app is force-closed and reopened, **Then** document appears in Recents with pages and recognized text intact.
2. **Given** stored document, **When** user deletes it, **Then** document, its pages, and image files are removed from storage.

---

### User Story 5 - Fully Offline and Private (Priority: P1)

The entire capture-to-read flow works in airplane mode on both platforms, makes zero network requests, and the app requests no network-related permission for core features. No scanned content leaves the device.

**Why this priority**: Privacy and offline-first are non-negotiable (constitution principle I).

**Independent Test**: Enable airplane mode, run full capture→OCR→read flow on both platforms, verify zero network calls (no permission requested, no traffic).

**Acceptance Scenarios**:

1. **Given** airplane mode enabled, **When** user scans/imports/runs OCR/reads, **Then** all operations complete identically to online mode.
2. **Given** app permissions reviewed, **Then** no network-related permission (INTERNET, ACCESS_NETWORK_STATE) is requested for core flow.

---

### User Story 6 - No iOS Regression (Priority: P2)

Everything the existing iOS P0 build supports (acceptance scenarios QS-1..QS-8 in specs/001-project-init-scaffold/quickstart.md) still passes in the new app, and theme colors match DesignPrinciples.md in light and dark mode.

**Why this priority**: Cannot ship cross-platform by breaking existing iOS users.

**Independent Test**: Run full iOS QS-1..QS-8 from spec 001 quickstart — all pass; theme visual match.

**Acceptance Scenarios**:

1. **Given** new cross-platform app on iOS, **When** run QS-1..QS-8, **Then** all scenarios pass.
2. **Given** light/dark mode, **When** viewed, **Then** colors match DesignPrinciples.md exactly (no visual drift).

---

### User Story 7 - Attribution (Priority: P2)

An in-app screen lists third-party licenses and credits (CC-CEDICT CC BY-SA, Make Me a Hanzi, any other bundled data/fonts), and license files ship with the app. A placeholder entry exists for the Vietnamese gloss source until it is chosen.

**Why this priority**: Legal compliance (constitution principle VII).

**Independent Test**: Open Attribution screen, verify all required licenses listed, license files present in bundle.

**Acceptance Scenarios**:

1. **Given** Attribution screen, **When** opened, **Then** CC-CEDICT CC BY-SA, Make Me a Hanzi, and Vietnamese gloss placeholder are listed with links to license files.
2. **Given** app bundle, **When** inspected, **Then** license text files are present.

---

### User Story 8 - Single-Clone Developer Setup (Priority: P2)

A developer can clone the repo, run documented commands, and get a working development build on an Android device and an iOS device/simulator (no Mac required for iOS builds), plus run all unit tests.

**Why this priority**: Developer velocity — zero-friction onboarding.

**Independent Test**: Fresh clone, follow README, build Android dev build, build iOS via EAS, run unit tests.

**Acceptance Scenarios**:

1. **Given** fresh clone, **When** developer follows README setup, **Then** Android dev build runs on device/emulator.
2. **Given** fresh clone, **When** developer runs EAS iOS build, **Then** iOS dev build installs via TestFlight (no Mac required).
3. **Given** fresh clone, **When** developer runs `pnpm test`, **Then** all unit tests pass.

---

### Edge Cases

- What happens when ML Kit Chinese model is not available? → Model is bundled in app (not downloaded); if missing, clear error with guidance.
- How does system handle vertical text / handwriting? → Best-effort with documented heuristic (top-to-bottom, right-to-left for vertical); low-confidence flagged honestly.
- How does system handle corrupted/unreadable image? → Distinct "unreadable file" message, no crash.
- What if user denies camera permission? → Clear explanation with Settings link; import paths still work.
- What if OCR fails on a page? → Page status = failed; user can retry; other pages unaffected.
- What if PDF has mixed text/scanned pages? → Text pages use embedded text; scanned pages rendered and OCR'd.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: One TypeScript (strict) codebase targets iOS and Android. No separate native UI projects. Platform differences are limited to native module configuration.
- **FR-002**: OCR: Google ML Kit Chinese text recognition with the Chinese model BUNDLED in the app (not downloaded at runtime), on both platforms. It is the only OCR engine; no Tesseract, no cloud fallback.
- **FR-003**: OCR is hidden behind an OcrEngine interface returning status (ok / noText / failed), lines with bounding boxes, text, and confidence, plus per-character (grapheme) entries with approximate boxes derived by proportional split. The interface can be replaced with a test double in tests.
- **FR-004**: Reading order is top-to-bottom, left-to-right by default, with a documented heuristic for vertical text. Vertical and handwritten input is best-effort; the UI never claims accuracy it does not have.
- **FR-005**: Low-confidence threshold is 0.7, applied to whatever level of confidence ML Kit reports (line or element); the spec requires consistent flagging for identical OCR input, not per-character precision.
- **FR-006**: PDFs: detect an embedded text layer first and use it; otherwise render each page to an image at a resolution sufficient for OCR (about 300 dpi equivalent) and recognize it. Cap at 20 pages, max 20 MB per page image.
- **FR-007**: Capture: camera capture with review (retake, crop, page list), gallery import, and file import (images + PDF).
- **FR-008**: Storage: all user data (documents, pages, recognized text, image paths) in a local SQLite database using the Expo-supported SQLite package with a typed query layer; page images and thumbnails in the app's document directory. Deleting a document cascades to pages and files. The schema reserves, but does not implement, entities for P1/P2 (character entries, bookmarks, lookup history). The future read-only dictionary will be a SEPARATE database file from user data.
- **FR-009**: Trad/Simp display conversion runs on-device with an OpenCC-based JavaScript library, with identical output on both platforms.
- **FR-010**: Theme: a single set of design tokens (mint/pink pastel palette from PROJECT_SCOPE.md, light/dark) is the only source of colors; views contain no hardcoded hex values. Pastels are used for surfaces only, never body text. Low-confidence marking uses a pink-ink underline, never red.
- **FR-011**: Fonts must be redistributable on both platforms (Noto Sans SC for Chinese plus one rounded Latin font); no Apple-only fonts.
- **FR-012**: Accessibility: all P0 screens are operable with VoiceOver and TalkBack, with labels on controls and reasonable focus order.
- **FR-013**: Navigation is file-based and typed. State management uses a single library (Zustand) for UI state; persisted data comes from the database, not UI stores.
- **FR-014**: Errors are never silent: permission denied, unreadable file, over-cap PDF, OCR failure, and no-text each have a distinct, user-readable message.

---

### Key Entities

- **Document**: A scanned/imported document (id, createdAt, title, sourceKind, status, pageCount).
- **Page**: One page within a document (id, documentId, index, imagePath, thumbnailPath, sourceKind, ocrStatus, lines, averageConfidence).
- **OcrLine**: Recognized text line (text, bounds, confidence, graphemes[]).
- **OcrGrapheme**: Per-character entry (char, bounds, confidence) — derived by proportional split for P1 tap targets.
- **OcrResult**: Engine output (status, lines, processingTimeMs, error?).
- **AppSettings**: User preferences (theme, fontSize, scriptVariant).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 9 of 10 first-time testers on each platform complete scan to read without help.
- **SC-002**: OCR completes in under 2 seconds per printed page, measured on real devices (a mid-range Android such as Snapdragon 7 Gen 1 class and an iPhone 13 class); emulator timings are not accepted.
- **SC-003**: Reader scroll stays smooth at 60 fps for a 20-page document on those devices.
- **SC-004**: Printed-tier corpus accuracy is at least 0.95 on both platforms.
- **SC-005**: iOS QS-1..QS-8 all pass; theme matches DesignPrinciples.md.
- **SC-006**: Total installed size is at most 150 MB per platform, including the bundled OCR model, and P0 ships no dictionary data.
- **SC-007**: The full flow runs in airplane mode on both platforms with zero network requests.
- **SC-008**: A new developer produces working dev builds for both platforms from a fresh clone by following the README.

---

## Assumptions

- The existing Swift app is a pre-release scaffold with no real users, so no data migration is required. It is kept in the repo as a behavioral reference until parity is verified, then removed. (If this is wrong, add a migration requirement.)
- Printed modern Chinese is the supported baseline. Classical text, Han-Nom, vertical, handwriting and calligraphy are best-effort with honest low-confidence UI.
- No cross-device sync; no Vietnamese gloss in P0 (placeholder only).
- Reader shows plain recognized text in P0; per-character tapping arrives in P1 using the per-character data produced here.

---

## Out of Scope

Per-character tap and detail sheet, dictionary, stroke order, TTS, bookmarks/history, text correction, search, flashcards/export, sync/backup, on-device paraphrase.

---

## Testing and Quality Requirements

- Unit tests (Jest with the Expo preset) are written before implementation for: coordinate mapping/reading order, grapheme splitting, Trad/Simp conversion, PDF text-layer detection, and database operations.
- End-to-end flows (scan/import to Reader, persistence, delete, airplane mode) are covered by Maestro flows on Android emulator and iOS simulator.
- A shared snapshot corpus (printed, vertical, handwritten images plus ground-truth manifest) is checked into the repo. The PRINTED tier gates P0 at 0.95 character accuracy; vertical and handwritten tiers are reported as informational baselines and must not regress.
- A CI task verifies that the app configuration requests no network permission and that no network calls occur during the core flow.

---

## Technical Constraints (decided; verify versions in /speckit.plan)

- Use the CURRENT stable Expo SDK and the React Native version it ships; confirm with expo-doctor. Do not pin an older SDK. Use the Node version that SDK requires.
- Continuous Native Generation with a development build (expo-dev-client) and EAS Build; Expo Go is not supported. iOS and Android minimum versions follow the chosen SDK's minimums.
- Before building features, the plan must include short spikes proving: (a) the chosen ML Kit wrapper runs Chinese recognition from a bundled model on both platforms, (b) the chosen PDF text-extraction and page-rendering approach works on both platforms. If the wrapper or renderer does not exist, plan a small Expo native module instead.
- Styling via NativeWind; animations via Reanimated and Gesture Handler as needed.
- Do NOT use WatermelonDB, Tesseract, Kotlin Multiplatform, SwiftData, Room, or any cloud API.