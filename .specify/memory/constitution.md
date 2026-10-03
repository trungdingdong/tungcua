# TungCua Constitution

## Core Principles

### I. On-Device Only (NON-NEGOTIABLE)
All OCR, dictionary lookup, conversion, and paraphrase MUST run on-device with no
network calls. Apple Vision `VNRecognizeTextRequest` is the sole OCR engine. Apple
Foundation Models (on-device) is the only permitted generative component, with
corpus lookup and dictionary fallback beneath it. Any proposal introducing a cloud
API MUST be rejected unless this principle is amended first.

### II. Character-First Interaction
The reader MUST render recognized text as individually tappable characters, never
as a single translated block. Tapping a character MUST open a detail sheet for that
character only: pinyin, Han-Viet reading, Trad/Simp variants, EN + VI glosses,
modern-Chinese paraphrase where applicable, example sentence, and stroke-order
animation. Whole-document translation views are out of scope.

### III. Bilingual Gloss EN + VI
Every character entry MUST carry both English (CC-CEDICT) and Vietnamese glosses
plus the Han-Viet reading (Unihan `kVietnamese`). A missing VI gloss MUST surface
as an explicit "untranslated" state with a user-report affordance, never as a
silent omission or a machine-guessed substitute.

### IV. Honest Coverage of Hard Inputs
Printed horizontal text is the Tier-1 target. Vertical layout, handwriting,
calligraphy, and seal script MUST be accepted as inputs but flagged honestly:
low-confidence characters get visible marking plus a manual text-correction UI.
Classical-to-modern paraphrase MUST label AI-generated output as such and always
show the source sentence and dictionary gloss alongside it.

### V. Test-First (NON-NEGOTIABLE)
Dictionary parsing (CC-CEDICT, Unihan, OpenCC mapping), stroke-data loading, and
page/rasterize logic MUST have automated tests written before implementation
(Red-Green-Refactor). OCR accuracy is validated with a fixed snapshot corpus of
printed, vertical, and handwritten samples; regressions MUST block the phase gate.

### VI. Simplicity and Phased Delivery
Build in phases: P0 capture+OCR, P1 tappable text + detail sheet, P2 stroke/TTS/
bookmarks, P3 on-device paraphrase + flashcards/export. No phase may start with
unmet exit criteria from the previous one. YAGNI applies: no iCloud sync, no
Anki export, no SRS until P1 ships.

### VII. Licensing and Attribution Compliance
CC-CEDICT (CC BY-SA), MakeMeAHanzi/hanzi-writer data (Arphic Public License),
and any Vietnamese corpus MUST retain attribution screens in-app and license
files in-repo. Bundle size MUST stay shippable: compress dictionary JSON to
SQLite and use on-demand resources for stroke SVGs if the bundle exceeds 150 MB.

## Technology Stack & Constraints

- Stack: Swift 6, SwiftUI, iOS 17+ baseline (iOS 26+ required only if Foundation
  Models generation ships in P3). VisionKit for scan, Vision
  `VNRecognizeTextRequest` with `recognitionLanguages=["zh-Hant","zh-Hans","en"]`,
  `recognitionLevel=.accurate`. PDFKit for uploads; rasterize at 300 dpi, cap MVP
  at 20 pages per document.
- Storage: SwiftData (`ScannedDoc`, `DocPage`, `Bookmark`, `LookupHistory`) plus a
  read-only bundled SQLite dictionary (`CharEntry`).
- Conversion: OpenCC for Trad/Simp. TTS via `AVSpeechSynthesizer`
  (`zh-CN`, `zh-TW`, `vi-VN`, `en-US`).
- Performance gates: OCR under 2 s per page on iPhone 13 or newer; detail-sheet
  lookup under 200 ms from bundled DB; VoiceOver operable throughout reader.

## UX & Design Language

- Theme tokens only, no hardcoded hex in views: `MintSurface`, `MintPrimary`,
  `MintInk`, `PinkSurface`, `PinkPrimary`, `PinkInk` on `BgBase`/`BgAlt`
  (`#F6FBF8` / `#FDF5F9` light; `#0F1F1A` base dark).
- Pastels are surfaces only, never body text. Tapped char uses mint surface +
  mint ink; saved char uses pink surface + pink ink. Low confidence uses pink-ink
  underline (no out-of-palette red). SF Rounded for the hero character, SF Pro
  for body. Stroke player: pastel track, ink strokes, pink current stroke.

## Development Workflow

- Spec-driven: constitution → specify → plan → tasks → implement → converge per
  feature slice. Each slice MUST list its phase (P0–P3) and exit criteria.
- Reviews MUST verify constitution compliance: on-device check (no network
  entitlement added), bilingual gloss presence, theme-token usage, attribution
  intact. Complexity beyond the phase scope MUST be justified in the plan.
- Scripts are PowerShell (`.specify/scripts/powershell/`); commemorative message
  format: `docs: amend constitution to vX.Y.Z (<reason>)`.

## Governance

Constitution supersedes all other practices. Amendments require a documented
proposal, version bump per semantic rules (MAJOR for removed/redefined
principles, MINOR for new principles/sections, PATCH for clarifications), and a
migration note for in-flight specs. The Sync Impact Report HTML comment at the
top of this file MUST be removed before commit.

**Version**: 1.0.0 | **Ratified**: 2026-10-03 | **Last Amended**: 2026-10-03
