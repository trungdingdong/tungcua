# Data Model: Cross-Platform Refactor (Expo + React Native)

**Feature**: `002-cross-platform-refactor` | **Date**: 2026-10-04 | **Phase**: P0
**Storage**: WatermelonDB (React Native, JSI SQLite) + bundled read-only `dictionary.sqlite` (assets). File store for page images (Expo FileSystem).

## Shared TypeScript Types (src/shared/types.ts)

### CharEntry (Dictionary)

```typescript
interface CharEntry {
  char: string;              // Single Unicode character (key)
  pinyin: string;            // CC-CEDICT pinyin with tone numbers
  hanviet: string;           // Unihan kVietnamese reading
  en_gloss: string;          // CC-CEDICT English definition(s)
  vi_gloss: string;          // Vietnamese gloss (curated source) — may be "⧗ untranslated"
  radical: string;           // KangXi radical char
  radical_number: number;    // 1–214
  strokes: number;           // Stroke count
  hsk: number | null;        // 1–6 or null
  frequency: number;         // Corpus frequency rank (lower = more common)
  decomposition: string;     // MakeMeAHanzi decomposition tree (JSON string)
  trad_variant: string | null; // Traditional form if char is Simplified
  simp_variant: string | null; // Simplified form if char is Traditional
}
```

**Validation**:
- `char.length === 1` (single grapheme cluster)
- `strokes >= 1`
- `radical_number` 1–214
- `vi_gloss` missing → explicitly `"⧗ untranslated"` (never empty, never guessed)

### OcrEngine Interface (src/shared/ocr.ts)

```typescript
interface OcrLine {
  text: string;
  bounds: { x: number; y: number; width: number; height: number }; // 0–1 normalized
  confidence: number;          // 0–1
  // For tap targets: proportional split by grapheme cluster
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
  // Pre-load models (ML Kit downloads ~20 MB per model)
  ensureModelsLoaded(): Promise<void>;
}
```

### Document / Page Models (WatermelonDB schema)

```typescript
// src/shared/models/ScannedDoc.ts
class ScannedDoc extends Model {
  static table = 'scanned_docs';
  static associations = { pages: { type: 'has_many', foreignKey: 'doc_id' } };

  @field('created_at') createdAt!: number;           // Unix ms, immutable
  @field('title') title!: string;                    // Default "Document YYYY-MM-DD HH:mm"
  @field('source_kind') sourceKind!: 'scan' | 'photo' | 'pdf' | 'mixed';
  @field('status') status!: 'importing' | 'ready' | 'recognizing' | 'recognized' | 'partial' | 'failed';
  @field('page_count') pageCount!: number;           // Derived = pages.length
}

// src/shared/models/DocPage.ts
class DocPage extends Model {
  static table = 'doc_pages';
  static associations = { doc: { type: 'belongs_to', key: 'doc_id' } };

  @field('doc_id') docId!: string;
  @field('index') index!: number;                    // Zero-based order
  @field('image_uri') imageUri!: string;             // File:// URI (Expo FileSystem)
  @field('thumbnail_uri') thumbnailUri?: string;     // Optional, lazy
  @field('source_kind') sourceKind!: 'scan' | 'photo' | 'pdf';
  @field('ocr_status') ocrStatus!: 'pending' | 'recognizing' | 'recognized' | 'noText' | 'failed';
  @json('lines') lines!: OcrLine[];                  // Empty unless recognized
  @field('average_confidence') averageConfidence?: number; // Null unless recognized
}
```

**Validation**:
- `imageUri` file <= 20 MB (downscale on import)
- `lines` stored verbatim in recognized variant; Trad/Simp toggle is display-only via OpenCC
- Bounding boxes normalized 0–1 relative to page image
- `ocrStatus` transitions: `pending → recognizing → recognized | noText | failed`

### SnapshotSample (Test Fixture)

```typescript
interface SnapshotSample {
  name: string;           // e.g., "printed-horizontal-01"
  tier: 'printed' | 'vertical' | 'handwritten';
  imageUri: string;       // assets/snapshot-corpus/...
  expectedText: string;   // Ground truth
  minAccuracy: number;    // Printed >= 0.95, vertical >= 0.80, handwritten >= 0.60
}
```

## P1/P2 Reserved (schema seams, NOT in P0)

- `Bookmark`, `LookupHistory` (WatermelonDB models)
- `CharEntry` stroke_order_svg (ODR or compressed asset)
- `OcrLine.graphemes` fully populated for per-char tap (P1)
- Paraphrase field in `CharEntry` (P3)

## Integrity Rules

- Delete `ScannedDoc` → cascade delete `DocPage` rows → delete image + thumbnail files (Expo FileSystem)
- OCR writes idempotent per page: re-run replaces `lines`, never appends
- All persistence local; no network sync (constitution I)
- Dictionary SQLite read-only, opened via WatermelonDB SQLite adapter

## Platform-Specific Notes

| Aspect | iOS (EAS Build) | Android (Gradle/EAS) |
|--------|-----------------|----------------------|
| DB Driver | `watermelondb/adapters/sqlite` (native iOS SQLite) | `watermelondb/adapters/sqlite` (Android SQLite) |
| FileSystem | `expo-file-system` (Documents dir) | `expo-file-system` (Documents dir) |
| OCR Engine | `react-native-mlkit-text-recognition` (iOS ML Kit) | `react-native-mlkit-text-recognition` (Android ML Kit) |
| PDF Rasterize | `react-native-pdf` (iOS PDFKit) | `react-native-pdf` (Android PdfRenderer) |
| Camera/Scan | `expo-document-picker` + `expo-camera` | `expo-document-picker` + `expo-camera` |
| Theme | NativeWind + Tailwind | NativeWind + Tailwind |