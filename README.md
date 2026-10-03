# TungCua

iOS app. Scan documents via camera or import images / PDFs. On-device OCR reads
Chinese text. No full-document translation — each recognized character is
tappable, opening that character only: translation, usage example,
modern-Chinese rendering, stroke order.

P0 slice (this repo state): capture + on-device OCR + plain-text reader +
persistence. Tappable characters, dictionary detail, stroke animation, TTS,
bookmarks, correction UI, flashcards, export, iCloud, and paraphrase arrive in
P1–P3 per `PROJECT_SCOPE.md`.

## Requirements

- macOS with Xcode 16+ (iOS 17 SDK). Windows/Linux check out the repo but
  cannot build it (SwiftUI + Vision require Apple toolchains).
- iPhone 13+ device for camera flow, OCR timing gate, and snapshot accuracy.
  Simulator covers build, import paths, reader, persistence, airplane-mode logic.

## Clone to running app (SC-001: <15 min, simulator)

```sh
git clone <remote-url> tungcua
cd tungcua
open TungCua.xcodeproj
```

Select the `TungCua` scheme, pick an iPhone simulator, Run. Home shows
recents + Scan / Photos / Files. Attribution screen reachable from Home.

First-time Mac setup notes:

- Signing: set your Development Team (Signing & Capabilities). Bundle id
  `com.tungcua.app` is a placeholder.
- UI test target: `Tests/UITests/*.swift` ships as source; add a UI Testing
  Bundle target on first Mac setup if not present, then attach the files.
- OpenCC: `TungCua/Services/TextDisplayConversion.swift` does
  `import OpenCC`. Add a Swift OpenCC package via
  File > Add Package Dependencies before building the Reader toggle.
- Snapshot corpus: drop sample images + ground truth per
  `Tests/SnapshotCorpus/README.md`, then run `xcodebuild test`.

## Validation

Follow `specs/001-project-init-scaffold/quickstart.md` (QS-1..QS-8).

## Principles (non-negotiable)

- On-device only. No network entitlement, no cloud calls. Airplane mode must
  behave identically (constitution principle I).
- Character-first. Never a whole-document translation view (principle II).
- Bilingual gloss EN + VI with explicit "untranslated" states, never guessed
  substitutes (principle III).
- Honest coverage of hard inputs: low-confidence flags + correction, never
  silent drops (principle IV).
- Tests before implementation; snapshot-corpus regressions block gates (V).
- Phased delivery P0→P3, no scope leak (VI). See `tasks.md` T046 sweep list.
- Attribution screens + license files kept intact (VII).

## Layout

```text
TungCua/
├── App/            entry + routes
├── Theme/          Theme.swift (token-only colors) + DesignPrinciples.md
├── Features/       Home, Capture, OCR, Reader (SwiftUI views)
├── Services/       Capture, PDF rasterize, OCR, OpenCC display conversion
├── Persistence/    SwiftData ScannedDoc/DocPage + file-backed page images
├── Resources/     AttributionView + LICENSES/
└── InfoPlist/      Info.plist (privacy strings, launch screen)
Tests/
├── Unit/           XCTest (store, rasterize, capture, OCR, OpenCC mapping)
├── UITests/        XCUITest (home smoke, persistence relaunch)
└── SnapshotCorpus/ accuracy fixtures + thresholds + RESULTS.md
specs/001-project-init-scaffold/  spec, plan, research, data-model,
                                  contracts, quickstart, tasks
```
