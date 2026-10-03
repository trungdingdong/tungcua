# Quickstart: Validate P0 (Project Init & Scaffold)

**Feature**: `001-project-init-scaffold` | **Date**: 2026-10-03
Covers: repo scaffold → capture → OCR → reader → persistence. Details in
[`data-model.md`](data-model.md) and [`contracts/p0-services.md`](contracts/p0-services.md).

## Prerequisites

- macOS with Xcode 16+ (iOS 17 SDK), iPhone 13+ device for camera/OCR timing.
- Simulator suffices for: build, import paths, reader, persistence, airplane-mode logic.
- Physical device required for: Scan flow, OCR <2 s/page gate, snapshot accuracy tiers.

## Setup

```powershell
gh repo create tungcua --private --clone   # or clone existing remote
Set-Location tungcua
open TungCua.xcodeproj                     # select TungCua scheme, run on simulator
```

Expected: builds with no errors, Home shows recents + Scan / Photos / Files.

## Validation Scenarios

### QS-1 Clone-to-Home (FR-001, SC-001)

1. Fresh clone on a second machine, follow README only, build + run.
2. Expect: Home renders, no extra setup, attribution screen reachable.

### QS-2 Import Paths (FR-003/004/005)

1. Photos: import 1 Chinese photo → page list shows thumbnail; remove + re-add works.
2. Files: import a ≤20-page PDF → all pages rasterized and listed.
3. Files: import a >20-page PDF → refused with message stating the 20-page cap; existing pages kept.
4. Scan (device): scan 1 printed page → crop/retake → confirm adds page.

### QS-3 OCR + Reader (FR-006/007/008/009)

1. Run recognition on a printed horizontal page.
2. Expect: per-page progress → Reader shows recognized text matching page; OCR progress visible per page.
3. Toggle Original | Text (no data loss), move font-size slider, flip Trad/Simp toggle.
4. Low-confidence chars (if any) carry pink-ink underline only.

### QS-4 Offline (FR-012, SC-005)

1. Enable airplane mode, repeat QS-2 + QS-3.
2. Expect: identical behavior; no network prompt. (Review must confirm no network entitlement added.)

### QS-5 Persistence (FR-010)

1. Recognize a doc → force-quit → relaunch → doc present in recents with text intact.
2. Delete doc → gone from recents and storage (no orphans).

### QS-6 Permissions (FR-002)

1. Deny camera → tap Scan → friendly explanation + Settings link, no crash.
2. Revoke mid-flow → safe state, captured pages preserved.

### QS-7 Gates (FR-014, SC-002/004)

1. `xcodebuild test` — unit (rasterize cap, store round-trip/delete cascade, OpenCC mapping) + snapshot corpus; printed tier must meet threshold, zero regressions.
2. Device: printed page OCR <2 s/page; record vertical/handwritten accuracy (tracked, non-blocking).

### QS-8 Theme + Accessibility (FR-011)

1. Toggle light/dark → surfaces correct, pastels never body text.
2. VoiceOver through Home → Capture → Reader: all controls operable; Dynamic Type respected.

## Out of Scope (must NOT appear)

Per-character tap + detail sheet, stroke animation, TTS, bookmarks/history detail,
correction UI, search, flashcards, export, iCloud, paraphrase — P1+. If any ships
here, flag as scope leak.
