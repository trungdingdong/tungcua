# Feature Specification: Project Init & P0 Scaffold (Capture + OCR + Text)

**Feature Branch**: `001-project-init-scaffold`

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "init project -- create the project github repo and scaffold, refer to PROJECT_SCOPE.md file to get an understanding of what this project is about"

**Phase**: P0 (per PROJECT_SCOPE.md and constitution principle VI)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clone Repo and Build App Shell (Priority: P1)

A developer clones the GitHub repo, opens the Xcode project, and runs a branded TungCua app shell on a test device/simulator showing Home with Scan / Photos / Files entry points.

**Why this priority**: Nothing else (OCR, reader, dictionary) can be built or tested without a version-controlled, buildable project. This is the foundation gate for all P-phases.

**Independent Test**: Clone repo fresh on a second machine, open in Xcode, build and run on simulator — Home screen appears with Scan / Photos / Files buttons and theme applied, no extra setup beyond documented steps.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repo, **When** the developer follows the README setup steps, **Then** the app builds with no errors and launches to Home.
2. **Given** the app launched, **When** the user views Home, **Then** recent-docs list plus Scan / Photos / Files actions are visible and navigable.
3. **Given** the repo, **When** inspecting license/attribution files, **Then** CC BY-SA (CC-CEDICT), Arphic (MakeMeAHanzi/hanzi-writer), and Vietnamese-corpus placeholders plus the constitution Sync Impact cleanup are present and correct.

---

### User Story 2 - Capture or Import a Document (Priority: P1)

A user learning Chinese scans a printed page with the camera, or imports a photo or PDF (up to 20 pages), then reviews pages (retake, crop, page list) before recognition runs.

**Why this priority**: Capture is the entry funnel for every downstream value (OCR → tap → lookup). Covers printed horizontal Tier-1 plus accepted hard inputs (vertical, handwriting, calligraphy).

**Independent Test**: On device, scan 1 page, import 1 photo, import 1 multi-page PDF — each produces a page list with thumbnails where pages can be retaken/recropped/removed before OCR.

**Acceptance Scenarios**:

1. **Given** camera permission granted, **When** the user scans a printed Chinese page, **Then** a preview with crop/retake appears and confirming adds the page to the document.
2. **Given** Home, **When** the user picks a photo from the photo library, **Then** it is added as a document page without requiring a rescan.
3. **Given** Home, **When** the user picks a PDF up to 20 pages, **Then** each page is rasterized into a page image and listed; a PDF over 20 pages is refused with a clear message stating the 20-page MVP cap.
4. **Given** camera permission denied, **When** the user taps Scan, **Then** a friendly explanation with a shortcut to Settings is shown (no crash, no dead end).

---

### User Story 3 - Recognize Text and Read Plain Result (Priority: P1)

A user runs on-device recognition on captured pages and reads the recognized Chinese text beside the original image, with low-confidence characters visibly underlined and an Original | Text toggle plus font-size control.

**Why this priority**: P0 exit is "OCR works and text displays" — tappable characters and dictionary detail are P1 and explicitly out of scope here.

**Independent Test**: Scan a printed horizontal page → OCR progress shows per-page state → Reader shows original image and recognized text matching the page; low-confidence characters are underlined per theme rules.

**Acceptance Scenarios**:

1. **Given** a document with pages ready, **When** recognition runs fully on-device, **Then** each page shows recognized text with per-character confidence retained, completing within the performance gate (see SC-002).
2. **Given** recognized text, **When** the user toggles Original | Text, **Then** the view switches between page image and recognized text without data loss.
3. **Given** recognized text with uncertain characters, **When** displayed, **Then** low-confidence characters carry a pink-ink underline (never red) per theme tokens.
4. **Given** airplane mode (no network), **When** capture and recognition run, **Then** everything works identically — no network call is made.

---

### User Story 4 - Reopen a Past Document Offline (Priority: P2)

A returning user opens Home and reopens a previously scanned document with its pages and recognized text intact after app restart.

**Why this priority**: Persistence proves the SwiftData page model works and unblocks P1/P2 (history, bookmarks, correction UI).

**Independent Test**: Scan → force-quit app → relaunch → document and its recognized text are still listed and openable.

**Acceptance Scenarios**:

1. **Given** a recognized document, **When** the app restarts, **Then** the document appears in recents with pages and text intact.
2. **Given** stored documents, **When** the user deletes one, **Then** it and its pages disappear from recents and storage.

---

### Edge Cases

- What happens when the camera is unavailable (simulator / restricted device)? Import paths (Photos/Files) must still work; Scan shows an explanatory empty state.
- How does the system handle a >20-page PDF, corrupt image, or unreadable page? Refuse with a plain-language message stating the limit/reason; keep already-imported pages.
- How does the system handle vertical text or handwriting with poor recognition? Accept the input, flag low-confidence characters, do not silently drop them (manual correction UI arrives in P2; P0 must preserve text + confidence).
- How does the system handle permission revocation mid-flow? Return to a safe state with guidance, no data loss for already-captured pages.
- What happens when recognition finds no text (blank page)? Show an explicit "no text recognized" state per page, not an empty screen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Repo MUST exist on GitHub with Xcode project scaffold that builds and runs to Home (recent docs + Scan / Photos / Files entries) from a fresh clone following README steps.
- **FR-002**: System MUST request camera and photo-library permissions with plain-language purpose strings and handle denial/revocation with guidance (Settings link), never a crash or dead end.
- **FR-003**: System MUST offer all three capture paths: camera scan, photo-library import, file import (images + PDF).
- **FR-004**: System MUST provide scan review: retake, crop, and per-page list management (add/remove/reorder) before recognition.
- **FR-005**: System MUST rasterize imported PDFs to page images at print-readable resolution, capped at 20 pages per document for MVP; over-cap files MUST be refused with a message stating the cap.
- **FR-006**: System MUST run text recognition fully on-device for Chinese (Traditional + Simplified) and English with an accurate-recognition setting; no cloud call is permitted.
- **FR-007**: System MUST persist for each page the page image reference, recognized text lines with bounding boxes and confidence, and recognition status.
- **FR-008**: Reader MUST show Original image | Recognized text toggle, font-size control, and Traditional/Simplified display toggle for recognized text (conversion applied to display; per-character dictionary detail is P1 and out of scope).
- **FR-009**: Reader MUST visibly mark low-confidence characters with a pink-ink underline per theme (no red, no out-of-palette color).
- **FR-010**: System MUST persist documents across restarts (recent-docs list, pages, recognized text) and support delete.
- **FR-011**: System MUST apply the Cool Pastel Green + Pink theme via named tokens only (no hardcoded color values in views), including dark-mode surfaces, and use rounded hero styling for large character display where present.
- **FR-012**: System MUST remain fully functional with no network (airplane-mode test); no network entitlement or remote call may be added.
- **FR-013**: Repo MUST include license/attribution artifacts (CC-CEDICT CC BY-SA, MakeMeAHanzi/hanzi-writer Arphic, Vietnamese corpus placeholder) and in-app attribution placeholder screen wiring.
- **FR-014**: OCR accuracy MUST be validated against a fixed snapshot corpus (printed horizontal, vertical, handwritten samples) checked into the repo; regressions MUST block the P0 gate.
- **FR-015**: Out of scope for this spec (deferred): per-character tap + detail sheet, stroke-order animation, TTS, bookmarks/history detail, manual text correction UI, search, flashcards, CSV/Anki export, iCloud sync, on-device paraphrase generation. Reader text in P0 is plain (non-tappable) display.

### Key Entities

- **Repository / Project**: version-controlled GitHub repo + Xcode project; attributes: README setup steps, build scheme, bundle config, license/attribution files.
- **ScannedDoc**: a capture session; attributes: creation date, page count, recognition status, source mix (scan/photo/PDF).
- **DocPage**: one page; attributes: page image, recognized text lines, per-line boxes + confidence, reading order, status (pending/recognized/failed/no-text).
- **Snapshot Corpus**: fixed test inputs for accuracy regression; attributes: sample images (printed, vertical, handwritten), expected text, accuracy threshold per tier.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer unfamiliar with the repo completes clone-to-running-app on simulator following only the README in under 15 minutes.
- **SC-002**: Printed horizontal Chinese pages complete recognition in under 2 seconds per page on iPhone 13 or newer hardware.
- **SC-003**: 9 out of 10 first-time users successfully scan-or-import a 1-page document and view its recognized text without assistance.
- **SC-004**: Snapshot-corpus accuracy meets tier gates with zero regressions versus the checked-in baseline (printed horizontal gate highest; vertical/handwritten tracked separately with honest lower bars).
- **SC-005**: All capture-to-read flows pass in airplane mode with zero network attempts detected.
- **SC-006**: Users can switch Original | Text and adjust text size to a comfortable reading setting within 30 seconds on first try.

## Assumptions

- GitHub repo name `tungcua`, private under the user's account, default branch `main`; Xcode app target named `TungCua`, iOS 17+ baseline, Swift 6 + SwiftUI (per constitution; iOS 26+ only if P3 generation ships).
- Recognition uses on-device Vision accurate recognition for Traditional/Simplified Chinese + English; proportional per-character overlay boxes and custom vertical reading-order sort are P1/P2 refinements, not P0 gates.
- PDF rasterization at print-readable resolution (~300 dpi equivalent) with the 20-page MVP cap; 20-page PDFs up to phone-memory limits are assumed testable on iPhone 13+.
- Theme token names (`BgBase`, `BgAlt`, `MintSurface/Primary/Ink`, `PinkSurface/Primary/Ink`) and dark-mode surfaces per PROJECT_SCOPE.md; pastels surfaces-only.
- Camera testing requires a physical device; simulator validates import + reader paths only.
- Vietnamese gloss curation, Foundation Models gating, and exact iOS minimum are tracked as follow-ups and do not block P0 scaffold acceptance.
- `specify.exe` AppControl block workaround (`uv run --with specify-cli` via runner shim) is environment documentation, not a product requirement.
