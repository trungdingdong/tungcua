# Research: Project Init & P0 Scaffold (Capture + OCR + Text)

**Feature**: `001-project-init-scaffold` | **Date**: 2026-10-03
**Scope**: P0 — repo + Xcode scaffold, capture (scan/photo/PDF), on-device OCR, plain-text reader, persistence.

All technical choices below are locked by `PROJECT_SCOPE.md` and the constitution. Research confirms integration patterns; no open `NEEDS CLARIFICATION` remains.

## R-01: Repo + Xcode Scaffold Baseline

- **Decision**: GitHub repo `tungcua` (private, `main` default), single Xcode app target `TungCua`, Swift 6 + SwiftUI, iOS 17+ deployment target, SwiftData capability enabled. README documents clone → open → run on simulator; `LICENSES/` holds CC BY-SA + Arphic texts + Vietnamese-corpus placeholder; constitution Sync Impact HTML comment removed before first commit.
- **Rationale**: One target keeps P0 simple (constitution VI / YAGNI). iOS 17 baseline unlocks SwiftData while keeping the widest device base; iOS 26+ is gated to P3 only if Foundation Models generation ships.
- **Alternatives considered**: Multi-target modular scaffold (rejected — premature for P0); iOS 26-only baseline (rejected — shrinks test base, only needed for P3 generation).

## R-02: Camera Scan Integration Pattern

- **Decision**: `VNDocumentCameraViewController` (VisionKit, UIKit) wrapped in `UIViewControllerRepresentable` as the P0 scan path; `DataScannerViewController` reserved for live-text assist later. Scan review (retake/crop/page list) uses the controller's native review UI plus a SwiftUI page-list screen for add/remove/reorder.
- **Rationale**: `VNDocumentCameraViewController` is the Apple-standard document-scan flow (auto shutter, crop, multi-page) with zero custom camera code — smallest P0 surface. UIKit bridge is a solved SwiftUI pattern.
- **Alternatives considered**: Custom AVFoundation camera pipeline (rejected — large scope, no P0 benefit); `DataScannerViewController`-only (rejected — live scanning complements but does not replace multi-page document capture).

## R-03: Photo / File Import Pattern

- **Decision**: `PhotosPicker` (PhotosUI) for photo-library import; `UIDocumentPickerViewController` (UTTypes image + PDF) bridged via `UIViewControllerRepresentable` for file import.
- **Rationale**: System pickers inherit permissions, privacy, and file-access correctness from Apple; no custom browser code in P0.
- **Alternatives considered**: Custom PHPicker wrapper (equivalent — PhotosPicker is the SwiftUI-native form, preferred); direct file-system access (rejected — sandbox violations).

## R-04: On-Device OCR Configuration

- **Decision**: `VNRecognizeTextRequest` as sole engine, `recognitionLevel = .accurate`, `recognitionLanguages = ["zh-Hant", "zh-Hans", "en"]`, `usesLanguageCorrection = false` for Chinese passes (Vision has no Chinese `customWords`/correction), request `recognitionCandidates` + per-observation confidence; run off-main-thread via `VNImageRequestHandler`, one page at a time.
- **Rationale**: Matches constitution stack exactly; `.accurate` trades speed for Tier-1 printed accuracy within the 2 s/page gate on iPhone 13+. Per-observation confidence drives the low-confidence underline (principle IV).
- **Alternatives considered**: `.fast` level (rejected — accuracy loss on the Tier-1 target); third-party/cloud OCR (rejected — violates principle I, non-negotiable).

## R-05: PDF Rasterize at 300 dpi, 20-Page Cap

- **Decision**: PDFKit `PDFDocument` per-page render at 300 dpi equivalent scale (`page.bounds` × 300/72) to `CGImage`/`UIImage`, sequential page processing with autoreleasepool + downsampled thumbnails; refuse >20-page PDFs up front with a message stating the cap. Page images stored as files (app sandbox), paths referenced from SwiftData.
- **Rationale**: 300 dpi preserves stroke detail for OCR; sequential processing bounds peak memory on iPhone 13; pre-flight page-count check fails fast with a clear message (FR-005).
- **Alternatives considered**: Full-PDF in-memory rasterize (rejected — memory spikes on 20-page docs); sub-200 dpi raster (rejected — degrades Chinese stroke recognition).

## R-06: Persistence Model (SwiftData + File Store)

- **Decision**: SwiftData `ScannedDoc` (1) → `DocPage` (N) with image-file URLs + recognized-line value payloads (text, box, confidence, status); thumbnails derived on demand. Bundled read-only SQLite `CharEntry` schema reserved but NOT populated in P0 (P1 dictionary scope).
- **Rationale**: SwiftData is the constitution-mandated store; binary images live outside the DB to keep it lean and fast. Reserving (not building) the dictionary schema avoids P1 scope leak while keeping the seam visible.
- **Alternatives considered**: Core Data (rejected — constitution mandates SwiftData); images as DB blobs (rejected — bloat, slow fetch).

## R-07: Trad/Simp Display Toggle (P0 Display Only)

- **Decision**: OpenCC (Swift package) applied as a pure display transform over recognized text for the P0 Trad/Simp toggle; source text stored once in its recognized variant. No per-character dictionary lookup in P0.
- **Rationale**: Display-only conversion satisfies FR-008 without pulling P1 dictionary scope into P0. OpenCC is the constitution-mandated converter.
- **Alternatives considered**: Storing both variants (rejected — duplication, divergence risk); dictionary-backed conversion in P0 (rejected — P1 scope).

## R-08: Theme Tokens + Accessibility

- **Decision**: `Theme` enum/namespace of SwiftUI `Color` tokens (`BgBase`, `BgAlt`, `MintSurface/Primary/Ink`, `PinkSurface/Primary/Ink`) with light/dark variants from asset catalog or semantic colors; zero hardcoded hex in views (SwiftLint custom rule or code-review gate). Low confidence = `PinkInk` underline. Full VoiceOver labels on Home/Capture/Reader controls; Dynamic Type respected; font-size slider drives reader text size.
- **Rationale**: Token-only enforcement is a constitution review gate; asset-backed colors give dark mode free. Pink-ink underline keeps palette discipline (no red).
- **Alternatives considered**: Hardcoded hex with later cleanup (rejected — violates review gate from day one).

## R-09: Test-First + Snapshot Corpus

- **Decision**: XCTest unit tests written first for PDF rasterize/page-count cap, SwiftData round-trip, OpenCC display mapping; XCUITest for clone-to-Home and import-to-reader smoke; `Tests/SnapshotCorpus/` holds printed/vertical/handwritten samples with expected text + per-tier thresholds; OCR timing test asserts <2 s/page on device (simulator runs accuracy-only).
- **Rationale**: Satisfies principle V (Red-Green-Refactor for parsing/rasterize logic; snapshot corpus gates OCR regressions).
- **Alternatives considered**: Manual-only QA (rejected — regressions would not block gates); device-only CI (noted — simulator covers logic, device covers timing/accuracy; documented in quickstart).

## Resolved Status

No `NEEDS CLARIFICATION` remains. iOS minimum (17+), repo naming, PDF cap, and gloss-source deferral are recorded as spec assumptions and do not block P0.
