# TungCua — Project Scope (Session Plan)

## Concept
Cross-platform app (iOS + Android). Scan documents via camera or upload images /
PDFs. OCR reads Chinese text. No full-document translation. Each recognized
character is tappable. Tapping a character shows that character only:
translation, usage example, modern-Chinese rendering, stroke order.

## Locked Decisions
- Source types: all (printed modern, classical / Han-Nom, handwritten,
  calligraphy, vertical layout).
- Translation targets: English + Vietnamese (toggle).
- "Modernized" means both: Traditional ↔ Simplified conversion AND
  Classical → modern Mandarin paraphrase.
- OCR strategy: on-device only (Google ML Kit, bundled Chinese models).

## Tech Stack (Cross-Platform)
| Layer | Choice |
|---|---|
| Framework | Expo SDK 51 (React Native 0.76) |
| Language | TypeScript (strict) |
| Build | EAS Build (cloud iOS/Android) — no Mac required |
| Camera/Scan | `expo-camera` + `expo-document-picker` + `expo-image-picker` |
| OCR | `react-native-mlkit-text-recognition` (Google ML Kit, on-device, `zh-Hans` + `zh-Hant`) |
| PDF | `react-native-pdf` (render page → bitmap → ML Kit) |
| Storage | `watermelondb` (SQLite, reactive) or `expo-sqlite` + `drizzle-orm` |
| State | `zustand` or `jotai` |
| Navigation | `expo-router` (file-based) |
| UI/Theme | `nativewind` (Tailwind) + custom pastel tokens |
| Animations | `react-native-reanimated` 3 + `react-native-gesture-handler` |
| TTS | `expo-speech` (platform voices) |
| Fonts | `expo-font` (SF Pro / Noto Sans SC) |

### Project Structure
```
tungcua/
├── app/                    # expo-router pages
│   ├── (tabs)/             # home, scan, library, settings
│   ├── reader/[id].tsx     # document reader (tappable chars)
│   └── char/[char].tsx     # detail sheet (modal)
├── src/
│   ├── components/         # CharGrid, CharCard, StrokePlayer, Toolbar
│   ├── hooks/              # useOCR, useDictionary, useTheme
│   ├── services/           # mlkit.ts, pdf.ts, dictionary.ts, opencc.ts
│   ├── db/                 # watermelon models, migrations
│   ├── theme/              # tokens.ts, global.css
│   └── utils/              # char-tokenize, coordinate-map
├── assets/                 # fonts, dict.sqlite (bundled), stroke SVGs
├── eas.json                # build profiles
└── package.json
```

## Pipeline
```
CameraRoll / DocumentPicker / Camera
      ↓
Expo Image/PDF → Bitmap (PDF: render page via react-native-pdf)
      ↓
ML Kit TextRecognizer (CHINESE model, on-device)
      ↓
RecognizedText: blocks → lines → elements (each ≈ word/char cluster)
      ↓
Coordinate mapping: normalize to 0–1, sort reading-order (top→bottom,
right→left for vertical)
      ↓
Tokenize to per-character array (split clusters by Unicode grapheme)
      ↓
Persist: Doc → Pages → Char[] (bounds, text, confidence)
      ↓
Reader renders CharGrid (FlatList of TouchableOpacity per char)
      ↓
Tap → lookup in bundled SQLite → CharDetailSheet
```

## Dictionary Bundle (offline)
- Build-time script: download CC-CEDICT + Unihan `kVietnamese` + OpenCC map
  + hanzi-writer stroke JSON → compile to `dictionary.sqlite` (~30–50 MB)
  → bundle in `assets/`.
- WatermelonDB schema: `char_entries` (char, trad, simp, pinyin, hanviet,
  radical, strokes, hsk, freq, def_en[], def_vi[], decomp, stroke_svg).
- Stroke SVGs: compressed JSON or ODR (on-demand resources) if bundle > 100 MB.

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
| Phase | Scope |
|---|---|
| P0 | Expo init, EAS config, camera + picker + PDF render, ML Kit OCR, page list, recognized text dump |
| P1 | CharGrid (tappable), bundled SQLite dict, CharDetailSheet (EN/VI/Trad/Simp/pinyin/hanviet), Trad/Simp toggle |
| P2 | StrokePlayer (SVG animate), TTS, bookmarks/history, low-confidence edit, vertical order fix |
| P3 | On-device paraphrase (optional: TFLite or skip), flashcards/export, iCloud/Drive sync |

Gates: OCR < 2 s/page (mid-range device), lookup < 200 ms, TalkBack/VoiceOver operable.

## Risks & Mitigations
| Risk | Mitigation |
|---|---|
| ML Kit char-level boxes are clusters | Proportional split + grapheme cluster; allow manual correction |
| Bundle size (dict + strokes) | WatermelonDB compression; ODR for stroke SVGs; lazy-load |
| Expo managed workflow limits native modules | ML Kit + PDF + SQLite all have Expo-compatible packages |
| No Mac for local iOS test | EAS Build + TestFlight; test on Android device locally |
| Vertical/handwritten accuracy | Honest confidence UI; manual text edit before tap |

## Spec-Kit Base (this session)
- `specify-cli` installed via `uv tool`; `specify.exe` blocked by AppControl
  → runner shim `Temp\opencode\specify_run.py` used via
  `uv run --with specify-cli`.
- Project initialized in place: `--integration opencode --script ps`.
- Constitution v1.0.0 ratified 2026-10-03 at `.specify/memory/constitution.md`
  (remove Sync Impact HTML comment before commit).

## Next Steps
1. `/speckit.specify` — P0 capture + OCR feature spec (Expo + ML Kit).
2. Decide: minimum Expo SDK / React Native version, on-device paraphrase
   strategy for P3 (TFLite model vs skip).
3. Curate Vietnamese gloss source.
4. Scaffold Expo project: `npx create-expo-app tungcua -t typescript`
5. Add deps, configure NativeWind + pastel tokens, write dictionary build
   script.