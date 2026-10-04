# Research: ML Kit + PDF Spikes (M1)

**Feature**: `004-mlkit-pdf-spikes` | **Date**: 2026-10-04
**Scope**: Two technical spikes to validate ML Kit Chinese OCR and PDF pipeline before M4/M6.

## R-01: ML Kit Wrapper Selection (Spike A)

**Decision**: Evaluate `react-native-mlkit-text-recognition` (primary), `react-native-mlkit-vision` (secondary), and custom Expo native module (fallback). Criteria: bundled Chinese model, both platforms, current Expo SDK, EAS Build compatible, active maintenance.

**Rationale**: Constitution Principle I requires bundled ML Kit Chinese model. The `react-native-mlkit-text-recognition` package is the most referenced community wrapper. Must verify it supports bundled model (not Play Services download), both platforms, and current Expo SDK. If no maintained wrapper qualifies, build small Expo native module wrapping ML Kit `TextRecognizer` with bundled `zh` model assets.

**Alternatives considered**:
- `react-native-mlkit-vision` — broader ML Kit API, may be heavier
- Custom native module — permitted by Constitution Principle VI, only if no maintained wrapper qualifies
- Tesseract / cloud OCR — explicitly forbidden by Constitution Principle I

**Spike evaluation plan**:
1. Add each candidate to Spike A harness
2. Test on real Android + iPhone with 20-image corpus
3. Measure: accuracy, cold/warm timing, return structure (text, lines, elements, boxes, confidence), coordinate convention, bundled model verification (airplane mode), app size delta
4. Document confidence granularity (line vs element) per platform for 0.7 threshold rule

## R-02: PDF Text-Layer Detection + Rendering (Spike B)

**Decision**: Evaluate `react-native-pdf` (viewer, may not expose text layer), `pdfjs-dist` (text extraction + rendering, heavier), `react-native-pdf-lib` (manipulation), and custom Expo native module (iOS PDFKit + Android PdfRenderer + text extraction lib like `pdf-text-extract` or `pdfjs-dist` text layer). Criteria: detect embedded text layer + extract text with reading order/positions, render pages at ~300 dpi to image suitable for ML Kit, per-page text-layer detection for mixed PDFs, 20-page cap enforcement, encrypted/corrupted handling.

**Rationale**: Spec FR-006 requires text-layer-first approach. Constitution requires spike proving approach before plan commits. Viewer-only libraries insufficient. `react-native-pdf` may not expose text layer. `pdfjs-dist` is pure JS but heavy. Native module gives most control.

**Alternatives considered**:
- OCR every page unconditionally — rejected (slower, ignores existing text)
- `react-native-view-pdf` — viewer only, no text extraction or image output
- Pure JS PDF parsing — may not handle all PDF features

**Spike evaluation plan**:
1. Add each candidate to Spike B harness
2. Test on real Android + iPhone with 10-PDF corpus
3. Measure: text-layer detection accuracy, extracted text quality, render time/page, output image dims/file size, memory over 20 pages, 25-page refusal, encrypted/corrupted handling
4. Document "usable text layer" heuristic for fallback to OCR

## R-03: ML Kit Return Structure & Confidence Model

**Decision**: Document exact return structure per platform: ML Kit returns `Text` → `Text.Block[]` → `Text.Line[]` → `Text.Element[]`. Elements are clusters, not single glyphs. Confidence reported per element (or line). Proportional grapheme split by Unicode grapheme cluster → approximate per-char bounds. Threshold 0.7 applied at element/line confidence level.

**Rationale**: Constitution L103-106: ML Kit returns clusters, not glyphs. Proportional split is standard heuristic. Confidence at engine-reported granularity; threshold 0.7 applied consistently. Must document per-platform differences.

**Coordinate convention**: ML Kit returns normalized bounds (0-1) relative to image. Origin top-left. Orientation: ML Kit detects orientation; we use corrected image. Reading order: default top-to-bottom, left-to-right; vertical heuristic post-process.

## R-04: PDF Rendering Approach

**Decision**: Render each page to bitmap at ~300 dpi equivalent (scale = 300/72 ≈ 4.17x). Use platform APIs: iOS PDFKit `PDFPage` → `CGContext` draw; Android `PdfRenderer` → `Bitmap`. Process sequentially (not parallel) to bound memory. Cap 20 pages, 20 MB/page image. Detect text layer first via platform API or `pdfjs-dist` text extraction.

**Rationale**: Constitution L111-114: 300 dpi, 20-page cap, 20 MB/page. Sequential processing bounds memory. Text-layer-first per FR-006.

## R-05: Corpus Fixtures

**Decision**: Check in ~20 images for Spike A (printed Simplified/Traditional, mixed Latin, vertical, handwriting, blank, non-Chinese, large 20MB, corrupted) and ~10 PDFs for Spike B (text Simplified, text Traditional, scanned, mixed, 20-page, 25-page, large pages, password-protected, corrupted, garbage text layer). Ground truth in `manifest.json` per corpus.

**Rationale**: Shared fixtures ensure parity. Small corpus for feasibility (full snapshot corpus gate in M4). Manifest includes ground truth text, expected behavior (text-layer yes/no, OCR expected), tier classification.

## R-06: Decision Record Format

**Decision**: Each spike produces `DECISION_RECORD.md` with:
1. Options evaluated (package names, versions, native module design)
2. Measurements table (accuracy, timing, memory, size delta)
3. Chosen approach with exact package/version or native module design
4. Rejected options with reasons
5. Risks and mitigations
5. Interface sketch (TS types) for M4/M6
6. Go/no-go verdict for M4/M6
7. App size delta, build-time impact, config plugin needs

**Rationale**: Spec FR-010, FR-011 require decision records and interface sketches for M4/M6 test-first development.

## R-07: Interface Sketches for M4/M6

**Decision**: Produce verified TypeScript types in `spikes/INTERFACE_SKETCHES/`:
- `OcrEngine`, `OcrResult`, `OcrLine`, `OcrGrapheme`, `Bounds` (from Spike A chosen wrapper)
- `PdfDetector`, `PdfRenderer`, `PdfPageResult` (from Spike B chosen approach)
- Coordinate conventions, confidence model, reading order heuristic documented

**Rationale**: Spec FR-011: M4/M6 must write tests first against these interfaces.

## Resolved Status

All technical decisions resolved via spike evaluation plan. No open `NEEDS CLARIFICATION` remains. Spikes must execute before M4/M6 tasks begin.