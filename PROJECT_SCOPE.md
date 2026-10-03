# TungCua — Project Scope (Session Plan)

## Concept
iOS app. Scan documents via camera or upload images / PDFs. OCR reads Chinese
text. No full-document translation. Each recognized character is tappable.
Tapping a character shows that character only: translation, usage example,
modern-Chinese rendering, stroke order.

## Locked Decisions
- Source types: all (printed modern, classical / Han-Nom, handwritten,
  calligraphy, vertical layout).
- Translation targets: English + Vietnamese (toggle).
- "Modernized" means both: Traditional ↔ Simplified conversion AND
  Classical → modern Mandarin paraphrase.
- OCR strategy: on-device only (Apple Vision, no cloud).

## Tech Stack
- Swift 6, SwiftUI, iOS 17+ baseline (iOS 26+ only if on-device Foundation
  Models generation ships in P3).
- Scan: `VNDocumentCameraViewController` + `DataScannerViewController`
  (VisionKit).
- OCR: `VNRecognizeTextRequest`, `recognitionLanguages = ["zh-Hant",
  "zh-Hans", "en"]`, `recognitionLevel = .accurate`. Note: Vision has no
  language correction / `customWords` for Chinese.
- Upload: `PhotosPicker`, `UIDocumentPicker`, PDFKit `PDFDocument` rasterized
  per page at 300 dpi (MVP cap: 20 pages).
- Storage: SwiftData (`ScannedDoc`, `DocPage`, `Bookmark`, `LookupHistory`)
  + bundled read-only SQLite dictionary (`CharEntry`).
- Conversion: OpenCC (Trad ↔ Simp).
- TTS: `AVSpeechSynthesizer` (`zh-CN`, `zh-TW`, `vi-VN`, `en-US`).

## Pipeline
```
camera / photo / PDF → preprocess (crop, deskew, contrast) → Vision OCR →
VNRecognizedTextObservation + boxes + candidates → page model →
normalized string → OpenCC variant → per-char tokens → tap → dictionary lookup
```
- V1 interaction: tap recognized-text characters (Vision returns line /
  paragraph boxes, not char boxes). V2 (optional): proportional overlay boxes
  on image.
- Vertical text: Vision ordering is weak → custom sort + manual reading-order
  fix UI. Handwriting / seal script: poor accuracy → low-confidence flag +
  manual text correction before tap.

## Dictionary & Data Sources (all bundled, offline)
| Source | Provides |
|---|---|
| CC-CEDICT (~125k entries, CC BY-SA 4.0) | EN gloss + pinyin |
| Unihan `kVietnamese`, `kMandarin`, `kRSUnicode` | Han-Viet reading, radical, stroke count |
| CVDict / NomFoundation-derived table (curate) | Vietnamese glosses |
| chinese-lexicon build | HSK level, frequency |
| MakeMeAHanzi `dictionary.txt` | decomposition, etymology fallback |
| hanzi-writer-data (MakeMeAHanzi graphics) | stroke-order animation JSON |
| CC-CEDICT examples + Tatoeba subset | example sentences |
| Classical-modern parallel corpus + Apple Foundation Models (on-device, fallback chain) | modern paraphrase |

Fallback chain for paraphrase: corpus lookup → Foundation Models generation →
dictionary gloss. AI output is always labeled and shown beside source sentence.

## Char Detail Sheet (per tap)
Big char + pinyin + Han-Viet (+ zhuyin optional), Trad/Simp variants, EN
definitions, VI definitions, modern paraphrase (if classical), example sentence
(source + modern + EN/VI), stroke-order animation (play / step / practice),
radical, stroke count, HSK, frequency, decomposition tree. Actions: bookmark,
add to list, copy, TTS.

## UX Flow
1. Home: recent docs + Scan / Photos / Files import.
2. Scan review: retake, crop, page list.
3. OCR progress: thumbnails + confidence.
4. Reader: Original image | Recognized text toggle; tappable chars; low
   confidence underlined; font-size slider; Trad/Simp toggle;
   vertical/horizontal toggle.
5. Detail bottom sheet (see above).
6. Lists: saved chars, history, CSV / Anki export (P3).

## Theme — Cool Pastel Green + Pink
- `BgBase #F6FBF8` mint-white, `BgAlt #FDF5F9` pink-white.
- `MintSurface #DDF6E8`, `MintPrimary #7ED6B5` (pressed `#4FBF9A`),
  `MintInk #0E4A38`.
- `PinkSurface #FBDCE9`, `PinkPrimary #E893BE` (pressed `#CC6DA0`),
  `PinkInk #5E2144`.
- Dark mode: bg `#0F1F1A`, green surface `#1B3A30`, pink surface `#3A2433`.
- Rules: pastels = surfaces only, never body text. Tapped = mint, saved =
  pink. Low confidence = pink-ink underline (no red). SF Rounded hero char,
  SF Pro body. Theme tokens only in views, no hardcoded hex.

## MVP Phases
- P0: scaffold, permissions, scan + upload + PDF rasterize + Vision OCR +
  text display.
- P1: tappable char grid + bundled SQLite + detail sheet EN/VI + Trad/Simp.
- P2: stroke animation + TTS + bookmarks/history + correction UI + search.
- P3: Foundation Models paraphrase + flashcards + export + iCloud.
- Gates: OCR < 2 s/page (iPhone 13+), lookup < 200 ms, VoiceOver operable.

## Risks
- Han-Nom / cursive / seal accuracy → correction UI, honest confidence flags.
- VI gloss quality fragmented → curation + user-report flow.
- Bundle size (dict + SVGs ~80–150 MB) → SQLite compression, on-demand
  resources.
- AI paraphrase hallucination → labeled output + source always visible.
- License attribution (CC BY-SA, Arphic) screens required.

## Spec-Kit Base (this session)
- `specify-cli` installed via `uv tool`; `specify.exe` blocked by AppControl
  → runner shim `Temp\opencode\specify_run.py` used via
  `uv run --with specify-cli`.
- Project initialized in place: `--integration opencode --script ps`.
- Constitution v1.0.0 ratified 2026-10-03 at `.specify/memory/constitution.md`
  (remove Sync Impact HTML comment before commit).

## Next Steps
1. `/speckit.specify` — P0 capture + OCR feature spec.
2. Decide: minimum iOS version, Foundation Models gate for P3.
3. Curate Vietnamese gloss source.
