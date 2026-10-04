# TungCua Constitution

## Core Principles

### I. On-Device Only (NON-NEGOTIABLE)

All OCR, dictionary lookup, conversion, and paraphrase MUST run on-device with no
network calls. Google ML Kit Text Recognition with the Chinese model BUNDLED in
the app (not downloaded at runtime) is the sole OCR engine on both platforms.
Any generative paraphrase in P3 MUST use an on-device TensorFlow Lite model or be
omitted. Any proposal introducing a cloud OCR or translation API, a fallback OCR
engine, or a runtime data download MUST be rejected unless this principle is
amended first.

### II. Character-First Interaction

The reader MUST render recognized text as individually tappable characters, never
as a single translated block (delivered from P1; P0 returns the per-character
data this needs). Tapping a character MUST open a detail sheet for that character
only: pinyin, Han-Viet reading, Trad/Simp variants, EN + VI glosses,
modern-Chinese paraphrase where applicable, example sentence, and stroke-order
animation. Whole-document translation views are out of scope.

### III. Bilingual Gloss EN + VI

Every character entry MUST carry both English (CC-CEDICT) and Vietnamese glosses
plus the Han-Viet reading (Unihan `kVietnamese`). A missing VI gloss MUST surface
as an explicit "untranslated" state with a user-report affordance, never as a
silent omission or a machine-guessed substitute. The Vietnamese gloss source MUST
be chosen and its license verified before P1 begins.

### IV. Honest Coverage of Hard Inputs

Printed horizontal text is the Tier-1 target. Vertical layout, handwriting,
calligraphy, and seal script MUST be accepted as inputs but flagged honestly:
low-confidence text gets visible marking plus a manual text-correction UI (P2).
The UI MUST never claim accuracy it does not have. Classical-to-modern paraphrase
(if built) MUST label AI-generated output as such and always show the source
sentence and dictionary gloss alongside it.

### V. Test-First (NON-NEGOTIABLE)

Dictionary parsing (CC-CEDICT, Unihan, OpenCC mapping), stroke-data loading,
OCR coordinate mapping and reading order, grapheme splitting, PDF text-layer
detection, and database operations MUST have automated tests written before
implementation (Red-Green-Refactor). Unit tests run on Jest with the Expo preset.
End-to-end flows run on Maestro on an Android emulator and an iOS simulator. OCR
accuracy is validated with a fixed snapshot corpus of printed, vertical, and
handwritten samples: the PRINTED tier gates each phase; vertical and handwritten
tiers are informational baselines that MUST NOT regress. A CI check MUST verify
that the release app configuration requests no network permission.

### VI. Simplicity and Phased Delivery

Build in phases: P0 capture+OCR, P1 tappable text + detail sheet, P2 stroke/TTS/
bookmarks/correction, P3 on-device paraphrase + flashcards/export. No phase may
start with unmet exit criteria from the previous one. YAGNI applies: no cloud
sync, no Anki export, no SRS until P1 ships; one state library (Zustand); one
local database technology (SQLite). Native code is limited to what the stack
requires: use Continuous Native Generation (prebuild) with a development build,
and write a small Expo native module only when no maintained package meets the
requirement, after a spike proves the gap.

### VII. Licensing and Attribution Compliance

CC-CEDICT (CC BY-SA), MakeMeAHanzi/hanzi-writer data (Arphic Public License),
bundled fonts (e.g., Noto Sans SC, SIL OFL), and any Vietnamese corpus MUST
retain attribution screens in-app and license files in-repo. Fonts MUST be
redistributable on both platforms; Apple-only system fonts MUST NOT be assumed.
Bundle size MUST stay shippable: total installed size at most 150 MB per
platform, including the bundled ML Kit model. Stroke data MUST be trimmed to a
bundled common-character subset; a runtime download of stroke data requires
amending Principle I first.

## Cross-Platform Constraints

- Target: iOS and Android at the minimum versions of the chosen Expo SDK. The
  plan MUST use the CURRENT stable Expo SDK and the React Native version it
  ships (confirm with `npx expo-doctor`), and MUST NOT pin an older SDK. Use the
  Node version that SDK requires.
- Package manager: pnpm. Documented commands in the README MUST produce working
  development builds from a fresh clone.
- No Mac required for iOS builds: EAS Build (cloud) + TestFlight. Local
  development on Windows: Android emulator or device with a development build
  (`expo-dev-client`). Expo Go is NOT supported.
- Every native dependency MUST be verified to work with the chosen SDK (config
  plugin or autolinking) before it is added to the plan.
- Architecture: TypeScript strict, `expo-router` file-based typed navigation,
  `nativewind` (Tailwind) for styling, `zustand` for UI state, `expo-sqlite`
  with a typed query layer (e.g., Drizzle) for persistence. WatermelonDB,
  Tesseract, Kotlin Multiplatform, SwiftData, and Room MUST NOT be used.
- Performance budgets (measured on real devices, never emulators): OCR < 2 s per
  printed page on Snapdragon 7 Gen 1 class and iPhone 13 class hardware;
  detail-sheet lookup < 200 ms; 60 fps Reader/CharGrid scroll; JS bundle < 3 MB
  gzipped; TalkBack / VoiceOver full coverage.

## Expo & ML Kit Specifics

- OCR: use the ML Kit Chinese recognizer through a wrapper selected by a spike
  that proves bundled-model Chinese recognition on BOTH platforms. If no
  maintained wrapper qualifies, build a small Expo native module. OCR is hidden
  behind an `OcrEngine` interface so tests can substitute a double.
- ML Kit returns line/element clusters, not single glyphs. Split clusters by
  Unicode grapheme and assign approximate per-character bounds proportionally.
  Confidence is used at whatever granularity the engine reports (line or
  element); low-confidence threshold is 0.7 → pink-ink underline, never red.
- Reading order: top-to-bottom, left-to-right by default. ML Kit's ordering is
  not reliable for vertical layouts, so apply a documented post-processing
  heuristic for vertical columns (right-to-left) and treat results as
  best-effort.
- PDF: first detect an embedded text layer and use it; otherwise render each
  page to an image at about 300 dpi equivalent and run OCR. The rendering
  approach is chosen by spike (a viewer-only library is not sufficient). Cap at
  20 pages per document and 20 MB per page image.
- User data: local SQLite via `expo-sqlite`. Page images and thumbnails live in
  the app document directory. Deleting a document cascades to pages and files.
- Dictionary (P1+): build-time `scripts/build-dictionary.ts` →
  `assets/dictionary.sqlite`, a SEPARATE read-only database from user data,
  copied from the app bundle to the document directory on first launch. Indexes
  on `char`, `radical`, `pinyin`.
- Display conversion: Trad/Simp via an OpenCC-based JavaScript library, display
  only; stored recognized text is never modified.
- Theme tokens: `tailwind.config.js` at the repo root is the single definition of
  `mint.*`, `pink.*`, `bg.*` (light and dark, `class` strategy). Views use only
  tokens, no hardcoded hex. Pastels are for surfaces only, never body text.
- Fonts: Noto Sans SC for Chinese plus one rounded Latin font, bundled via
  `expo-font`.
- TTS (P2): `expo-speech` with platform voices (`zh-CN`, `zh-TW`, `vi-VN`,
  `en-US`).

## Development Workflow

- Spec-driven: constitution → specify → plan → tasks → analyze → implement per
  feature slice. Each slice lists its phase (P0–P3) and exit criteria. Plans MUST
  include spikes for any unproven native dependency before feature tasks.
- Reviews MUST verify constitution compliance: no network permission in release
  config, bilingual gloss presence (P1+), theme-token usage, attribution intact,
  no banned technologies, and no work beyond the phase scope. Complexity beyond
  phase scope MUST be justified in the plan.
- Scripts: PowerShell (`.specify/scripts/powershell/`) for spec-kit; pnpm scripts
  for app build and test tasks. Commit format:
  `docs: amend constitution to vX.Y.Z (<reason>)`.

## Governance

Constitution supersedes all other practices. Amendments require a documented
proposal, version bump per semantic rules (MAJOR for removed/redefined
principles, MINOR for new principles/sections or materially changed guidance,
PATCH for clarifications), and a migration note for in-flight specs. Spec 002
(KMP draft) is superseded by spec 003; plan and tasks derived from 002 MUST be
regenerated. The Sync Impact Report HTML comment at the top of this file MUST be
removed before commit.

**Version**: 2.1.0 | **Ratified**: 2026-10-03 | **Last Amended**: 2026-10-04
