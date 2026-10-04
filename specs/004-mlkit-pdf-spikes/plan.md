# Implementation Plan: ML Kit + PDF Spikes (M1)

**Branch**: `004-mlkit-pdf-spikes` | **Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-mlkit-pdf-spikes/spec.md`

## Summary

Execute two technical spikes (M1 of P0 build order) to de-risk the OCR and PDF pipelines before feature work begins. Spike A validates a maintained React Native/Expo wrapper for ML Kit Chinese text recognition with a BUNDLED model on both iOS and Android, returning structured results for per-character splitting and the 0.7 confidence rule. Spike B validates PDF text-layer detection/extraction and ~300 dpi page rendering on both platforms, with per-page decision logic for mixed PDFs. Both spikes run on real devices in airplane mode; their decision records (options evaluated, measurements, chosen approach, rejected options, risks, interface sketches) unblock M4 (OCR core) and M6 (PDF pipeline). End-to-end validation: scanned PDF → rendered image → ML Kit recognition → structured result in airplane mode on both platforms.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React Native (from current stable Expo SDK), Node.js (version required by current Expo SDK)

**Primary Dependencies**:
- `expo` (current stable SDK), `expo-dev-client`, `expo-router`, `expo-file-system`
- Spike A candidates: `react-native-mlkit-text-recognition`, `react-native-mlkit-vision`, or custom Expo native module wrapping ML Kit `TextRecognizer` with bundled `zh` model
- Spike B candidates: `react-native-pdf`, `pdfjs-dist`, `react-native-pdf-lib`, or custom Expo native module (iOS PDFKit + Android PdfRenderer + text extraction lib)
- Testing: Jest (Expo preset) for unit tests, Maestro for device flows, custom spike harness scripts
- Build: EAS Build (cloud iOS, local Android), `expo-dev-client`, `expo-doctor`

**Storage**: Spike harness uses `expo-file-system` for corpus fixture access (images/PDFs in `assets/spike-corpus/`); no persistent DB needed for spikes.

**Testing**: Jest (Expo preset) for unit tests of harness utilities; Maestro for device flow validation; custom spike harness scripts for measurements (accuracy, timing, memory). Real device testing mandatory; emulators/simulators for development only.

**Target Platform**: iOS and Android at minimum versions of current stable Expo SDK (SDK 51+). iOS builds via EAS Build (cloud); Android via local device/emulator with `expo-dev-client`. Expo Go NOT supported.

**Project Type**: Spike harness (throwaway Expo/React Native apps in `spikes/` folder), not production code.

**Performance Goals** (measured on real devices, not emulators):
- Spike A: OCR warm time < 2 s/page on Snapdragon 7 Gen 1 class / iPhone 13 class; printed horizontal accuracy ≥ 0.95 char accuracy; cold-start time reported separately
- Spike B: 20-page PDF render sequentially without crash/OOM on mid-range Android; render time per page reported; 25-page refused with distinct error
- End-to-end: Scanned PDF → render → ML Kit → structured result in airplane mode on both platforms

**Constraints**:
- On-device only: ML Kit Chinese model BUNDLED (not downloaded at runtime). No Tesseract, no cloud OCR, no runtime data downloads. No network permission in release config.
- PDF: detect embedded text layer first; else render at ~300 dpi equivalent. Cap 20 pages, 20 MB/page image.
- Expo managed workflow: current stable SDK, `expo-dev-client`, EAS Build, no Expo Go.
- Spike code isolated in `spikes/` folder; losing-candidate deps not in final `package.json`.
- No WatermelonDB, Tesseract, KMP, SwiftData, Room, cloud APIs.
- Fallbacks permitted: small custom Expo native module. Fallbacks NOT permitted without Principle I amendment: cloud OCR, Tesseract, second OCR engine, runtime model downloads.
- Real devices mandatory for pass/fail; emulators/simulators for dev only. iOS via EAS Build + TestFlight (no Mac needed).

**Scale/Scope**: Two throwaway Expo/React Native apps in `spikes/spike-a/` and `spikes/spike-b/`, each with a small corpus (~20 images, ~10 PDFs). Decision records, interface sketches, go/no-go verdicts. No production UI, DB, navigation, theming, or persistence.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | Evidence |
|---|---|---|
| I. On-Device Only (NON-NEGOTIABLE) | PASS | Spike A explicitly tests BUNDLED ML Kit model, no runtime download. Spike B renders locally. Airplane mode mandatory. No network permission in release config. |
| II. Character-First Interaction | PASS (phased) | Spike A returns per-character (grapheme) bounds via proportional split for P1 tap targets. |
| III. Bilingual Gloss EN + VI | PASS (phased) | Not applicable to spikes; P1+ will implement with `vi_gloss` = "untranslated". |
| IV. Honest Coverage of Hard Inputs | PASS | Spike A corpus includes vertical, handwriting, blank, corrupted; Spike B includes encrypted, corrupted, garbage text-layer PDFs. Heuristics documented. |
| V. Test-First (NON-NEGOTIABLE) | PASS | Spike harness includes Jest unit tests for utilities; Maestro for device flows; measurements recorded against pass criteria. |
| VI. Simplicity and Phased Delivery | PASS | M1 spikes only; M4/M6 production code later. Native code only if spike proves gap. |
| VII. Licensing and Attribution Compliance | PASS | No new licenses in spikes; ML Kit model bundled per Google terms; corpus fixtures licensed for testing. |

Post-Phase-1 re-check: Design adds no new scope; spikes validate native deps; interfaces are TS types for M4/M6; quickstart enforces airplane-mode and real-device gates. All gates remain PASS.

## Project Structure

### Documentation (this feature)

```text
specs/004-mlkit-pdf-spikes/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── ocr-engine.md    # OcrEngine interface + return types
│   ├── pdf-pipeline.md  # PdfDetector + PdfRenderer interfaces
│   ├── pdf-detector.md  # PdfDetector interface + types
│   ├── pdf-renderer.md  # PdfRenderer interface + types
│   ├── interface-sketches.md # Verified TS types for M4/M6
│   ├── conventions.md   # Coordinate conventions, confidence model, reading order
│   └── errors.md        # Error types and codes
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
tungcua/
├── spikes/
│   ├── spike-a/                    # Spike A: ML Kit Chinese OCR
│   │   ├── app/                    # Expo router minimal routes
│   │   ├── assets/
│   │   │   └── spike-corpus/       # ~20 images + ground truth manifest
│   │   ├── src/
│   │   │   ├── candidates/         # Wrapper evaluation code (throwaway)
│   │   │   ├── harness/            # Measurement runner, corpus loader
│   │   │   └── results/            # Measurement output, decision record
│   │   ├── app.config.ts
│   │   ├── package.json
│   │   └── DECISION_RECORD.md      # Spike A decision record
│   ├── spike-b/                    # Spike B: PDF text-layer + rendering
│   │   ├── app/
│   │   ├── assets/
│   │   │   └── spike-corpus/       # ~10 PDFs + ground truth manifest
│   │   ├── src/
│   │   │   ├── candidates/
│   │   │   ├── harness/
│   │   │   └── results/
│   │   ├── app.config.ts
│   │   ├── package.json
│   │   └── DECISION_RECORD.md      # Spike B decision record
│   └── e2e/                        # Maestro flows for both spikes
├── assets/
│   └── spike-corpus/               # Shared corpus fixtures (git-tracked)
│       ├── spike-a/                # ~20 images + manifest.json
│       └── spike-b/                # ~10 PDFs + manifest.json
├── spikes/DECISION_RECORDS/        # Copied decision records for M4/M6
│   ├── spike-a-decision.md
│   └── spike-b-decision.md
└── spikes/INTERFACE_SKETCHES/      # Verified TS interfaces for M4/M6
    ├── ocr-engine.ts
    ├── pdf-detector.ts
    ├── pdf-renderer.ts
    ├── pdf-pipeline.ts
    ├── conventions.ts
    └── errors.ts
```

**Structure Decision**: Two isolated spike apps in `spikes/` with shared corpus in `assets/spike-corpus/`. Each spike is a minimal Expo app with its own `package.json` and `app.config.ts` so losing candidates don't pollute main `package.json`. Decision records and interface sketches copied to `spikes/DECISION_RECORDS/` and `spikes/INTERFACE_SKETCHES/` for M4/M6 consumption. Spike apps are NOT imported by main app.

## Complexity Tracking

No constitution violations to justify. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | — |