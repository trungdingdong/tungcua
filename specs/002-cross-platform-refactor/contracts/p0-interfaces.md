# Contracts: P0 Shared Interfaces (Expo + React Native)

**Feature**: `002-cross-platform-refactor` | **Date**: 2026-10-04

These TypeScript interfaces are the single-source contracts between shared logic and platform UI. Implemented in `src/shared/`.

## OcrEngine

```typescript
// src/shared/ocr.ts
interface OcrLine {
  text: string;
  bounds: { x: number; y: number; width: number; height: number }; // 0–1 normalized
  confidence: number;          // 0–1
  graphemes?: Array<{
    char: string;
    bounds: { x: number; y: number; width: number; height: number };
    confidence: number;
  }>;
}

type OcrStatus = 'recognized' | 'noText' | 'failed';

interface OcrResult {
  status: OcrStatus;
  lines: OcrLine[];
  error?: string;
  processingTimeMs: number;
}

interface OcrEngine {
  recognize(imageUri: string): Promise<OcrResult>;
  ensureModelsLoaded(): Promise<void>;
}
```

- **iOS impl**: Wraps ML Kit iOS via `react-native-mlkit-text-recognition` native module.
- **Android impl**: Wraps ML Kit Android via same package (autolinked).
- Both load `zh-Hans` + `zh-Hant` models at first use.
- Confidence threshold for low-confidence underline: 0.7 (ML Kit scale).

## TextDisplayConversion (OpenCC)

```typescript
// src/shared/conversion.ts
type ScriptVariant = 'traditional' | 'simplified';

interface TextDisplayConversion {
  display(text: string, variant: ScriptVariant): string;
}
```

- Pure function, never mutates stored text.
- Uses `opencc-js` (WASM) or `opencc` npm package.
- Byte-for-byte match with Swift OpenCC verified in shared tests.

## ThemeTokens

```typescript
// src/shared/theme/tokens.ts
interface ThemeColors {
  // Light
  bgBase: string;      // #F6FBF8
  bgAlt: string;       // #FDF5F9
  mintSurface: string; // #DDF6E8
  mintPrimary: string; // #7ED6B5
  mintPrimaryPressed: string; // #4FBF9A
  mintInk: string;     // #0E4A38
  pinkSurface: string; // #FBDCE9
  pinkPrimary: string; // #E893BE
  pinkPrimaryPressed: string; // #CC6DA0
  pinkInk: string;     // #5E2144
  // Dark
  bgBaseDark: string;       // #0F1F1A
  mintSurfaceDark: string;  // #1B3A30
  pinkSurfaceDark: string;  // #3A2433
  // Semantic
  lowConfidenceUnderline: string; // pinkInk (light) / pinkInk (dark)
}

interface ThemeTokens {
  colors: ThemeColors;
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
  typography: {
    heroFontFamily: string;   // 'SF Rounded' (iOS) / 'Material3 Rounded' (Android)
    bodyFontFamily: string;   // 'SF Pro' (iOS) / 'Material3 Body' (Android)
    heroFontSize: number;
    bodyFontSize: number;
  };
}
```

- Single source in `tailwind.config.js` → consumed via NativeWind `className` in views.
- Dark mode via `class` strategy on root `<View className="dark">`.

## DictionaryService

```typescript
// src/shared/dictionary.ts
interface CharEntry {
  char: string;
  pinyin: string;
  hanviet: string;
  en_gloss: string;
  vi_gloss: string;        // "⧗ untranslated" if missing
  radical: string;
  radical_number: number;
  strokes: number;
  hsk: number | null;
  frequency: number;
  decomposition: string;
  trad_variant: string | null;
  simp_variant: string | null;
}

interface DictionaryService {
  get(char: string): Promise<CharEntry | null>;
  search(prefix: string, limit: number): Promise<CharEntry[]>;
  // For P2: stroke SVG
  getStrokeSvg(char: string): Promise<string | null>;
}
```

- Backed by bundled `assets/dictionary.sqlite` (WatermelonDB).
- `vi_gloss` missing → explicitly `"⧗ untranslated"` with report affordance.

## DocumentStore (WatermelonDB)

```typescript
// src/shared/store.ts
interface DocumentStore {
  createDoc(source: 'scan' | 'photo' | 'pdf' | 'mixed'): Promise<ScannedDoc>;
  addPages(docId: string, imageUris: string[], source: 'scan' | 'photo' | 'pdf'): Promise<DocPage[]>;
  updateOcr(pageId: string, result: OcrResult): Promise<void>;
  getRecents(): Promise<ScannedDoc[]>;
  getDocWithPages(docId: string): Promise<{ doc: ScannedDoc; pages: DocPage[] }>;
  deleteDoc(docId: string): Promise<void>; // cascades pages + files
}
```

- Postcondition: `deleteDoc` leaves no orphan rows or image files.

## UI Routes (expo-router)

| Route | Screen | Purpose |
|-------|--------|---------|
| `/` | Home | Recents + Scan/Photos/Files entries + Attribution |
| `/scan` | ScanReview | System document scanner (camera) |
| `/import/photos` | PhotoPicker | Photo library import |
| `/import/files` | FilePicker | Files import (images + PDF) |
| `/ocr/[docId]` | OCRProgress | Per-page status → Reader |
| `/reader/[docId]` | Reader | Original|Text, font-size, Trad/Simp, pink-ink underline |
| `/attribution` | Attribution | CC-CEDICT, MakeMeAHanzi, Vietnamese corpus |

## Accessibility Contract

- Every interactive control: `accessibilityLabel` + `accessibilityRole` + `accessibilityHint` where needed.
- Reader: CharGrid must be TalkBack/VoiceOver navigable per character (P1).
- Dynamic Type / font scaling respected everywhere (`useFontScale` hook).
- Color contrast: WCAG AA minimum on all text (tokens designed for it).