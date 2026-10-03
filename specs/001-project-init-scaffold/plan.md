# Implementation Plan: Project Init & P0 Scaffold (Capture + OCR + Text)

**Branch**: `001-project-init-scaffold` | **Date**: 2026-10-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-project-init-scaffold/spec.md`

## Summary

Create the `tungcua` GitHub repo with a buildable Swift 6 + SwiftUI (iOS 17+) app shell, then deliver the P0 vertical slice: system capture (VisionKit scan, PhotosPicker, document picker + PDFKit 300 dpi rasterize capped at 20 pages) → on-device Vision OCR (`.accurate`, zh-Hant/zh-Hans/en) → plain-text Reader (Original | Text toggle, font-size, Trad/Simp display via OpenCC, pink-ink low-confidence underline) → SwiftData persistence (`ScannedDoc` → `DocPage`). Approach per [`research.md`](research.md): Apple-system UI where possible, sequential offline OCR, file-backed page images, token-only theme, test-first with snapshot corpus gate. Per-character tap, dictionary, stroke, TTS, correction, export, sync, and paraphrase are explicitly P1+ and excluded.

## Technical Context

**Language/Version**: Swift 6 (strict concurrency), Xcode 16+, iOS 17+ deployment target

**Primary Dependencies**: SwiftUI; VisionKit (`VNDocumentCameraViewController`, `DataScannerViewController` reserved); Vision `VNRecognizeTextRequest`; PDFKit; PhotosUI `PhotosPicker` + `UIDocumentPickerViewController` (UTTypes); OpenCC Swift package (display-only conversion); SwiftData; `AVFoundation` permissions only (no custom camera pipeline)

**Storage**: SwiftData (`ScannedDoc`, `DocPage` + embedded `RecognizedLine` values); page images + thumbnails as files under `Documents/PageImages/`; bundled SQLite `CharEntry` schema reserved, NOT populated in P0

**Testing**: XCTest (unit: rasterize cap, store round-trip/delete cascade, OpenCC mapping) + XCUITest (clone-to-Home, import-to-reader smoke) + `Tests/SnapshotCorpus/` accuracy fixtures (printed/vertical/handwritten tiers); OCR timing <2 s/page asserted on device, correctness-only on simulator

**Target Platform**: iOS 17+ iPhones (perf baseline iPhone 13+); camera flows device-only, import/reader testable on simulator

**Project Type**: mobile-app (single native iOS target)

**Performance Goals**: OCR <2 s/page (iPhone 13+); app launch to Home <2 s; 20-page PDF import-to-ready <60 s on device; reader toggle/font-size response instant (<100 ms perceived)

**Constraints**: On-device ONLY — no network entitlement, no cloud calls (airplane-mode test); PDF cap 20 pages; rasterize at 300 dpi equivalent; theme tokens only (no hardcoded hex in views); VoiceOver operable; pastels surfaces-only; low-confidence marking pink-ink underline (no red)

**Scale/Scope**: Single-user local app; 4 P0 screens (Home, ScanReview, OCRProgress, Reader); P0 data: docs ≤20 pages, images ≤20 MB/page; explicitly excludes P1+ (tap detail, dictionary DB, stroke, TTS, bookmarks/history detail, correction, search, flashcards, export, iCloud, paraphrase)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | Evidence |
|---|---|---|
| I. On-Device Only (NON-NEGOTIABLE) | PASS | Sole OCR engine `VNRecognizeTextRequest`; no network entitlement; airplane-mode scenario QS-4 in quickstart; review gate documented |
| II. Character-First Interaction | PASS (phased) | P0 Reader is plain text per spec FR-015, but stores per-line boxes + confidence + top-3 candidates (see data-model) so P1 tap needs no re-OCR; no whole-document translation view added |
| III. Bilingual Gloss EN + VI | PASS (phased) | No gloss in P0 by design; no machine-guessed substitute; `CharEntry` schema reserved for P1 |
| IV. Honest Coverage of Hard Inputs | PASS | Low-confidence pink-ink underline (threshold constant), `noText`/`failed` states, hard inputs accepted not dropped |
| V. Test-First (NON-NEGOTIABLE) | PASS | Tests-before-impl for rasterize/store/mapping; snapshot corpus with tier thresholds blocks P0 gate; timing gate on device |
| VI. Simplicity / Phased Delivery | PASS | P0 slice only; P1+ listed as out-of-scope with leak flag in quickstart; single target, system pickers, no custom camera |
| VII. Licensing / Attribution | PASS | `LICENSES/` + in-app attribution placeholder (FR-013); bundle discipline (file-backed images, thumbnails lazy) |

Post-Phase-1 re-check: design adds no new scope — data model reserves (not builds) P1/P2 entities; contracts are protocol seams with no cloud surface; quickstart enforces scope-leak flag. All gates remain PASS with no complexity-tracker entries required.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-init-scaffold/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── p0-services.md   # Capture/OCR/Store/Conversion/Theme/UI-route contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
TungCua/
├── App/
│   ├── TungCuaApp.swift
│   └── AppRoutes.swift
├── Theme/
│   └── Theme.swift              # token-only colors (light/dark), fonts
├── Features/
│   ├── Home/HomeView.swift
│   ├── Capture/ScanBridge.swift # VNDocumentCameraViewController wrapper
│   ├── Capture/ImportPickers.swift
│   ├── Capture/ScanReviewView.swift
│   ├── OCR/OCRProgressView.swift
│   └── Reader/ReaderView.swift   # Original|Text, font-size, Trad/Simp toggle
├── Services/
│   ├── CaptureService.swift
│   ├── OCRService.swift         # Vision .accurate, zh-Hant/zh-Hans/en
│   ├── PDFRasterizer.swift      # 300 dpi, 20-page cap
│   └── TextDisplayConversion.swift  # OpenCC display-only
├── Persistence/
│   ├── ScannedDoc.swift
│   ├── DocPage.swift            # + RecognizedLine value type
│   └── DocumentStore.swift
├── Resources/
│   ├── AttributionView.swift    # placeholder screen
│   └── LICENSES/               # CC BY-SA, Arphic, VI-corpus placeholder
└── InfoPlist/
    └── PrivacyStrings           # camera + photo usage descriptions

Tests/
├── Unit/                        # rasterize, store, OpenCC mapping
├── UITests/                     # Home + import-to-reader smoke
└── SnapshotCorpus/              # printed/vertical/handwritten + expected text
```

**Structure Decision**: Single Xcode app target (`TungCua`) with feature-grouped SwiftUI views, thin `Services/` seams per contracts, and SwiftData persistence. No packages, no backend, no second target — YAGNI for P0; P1 dictionary/reader detail will extend (not restructure) this layout.

## Complexity Tracking

No constitution violations to justify. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | — |
