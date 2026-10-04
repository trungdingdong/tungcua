# Data Model: Cross-Platform Foundation (P0)

**Feature**: `003-cross-platform-foundation` | **Date**: 2026-10-04 | **Phase**: P0
**Storage**: `expo-sqlite` + Drizzle ORM (user data). Page images in app document directory (`expo-file-system`). Future dictionary in separate `assets/dictionary.sqlite` (P1+).

## Entities

### Document

A scanned or imported document.

| Field | Type | Constraints |
|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY, NOT NULL |
| `created_at` | INTEGER (ms epoch) | NOT NULL, default `Date.now()` |
| `title` | TEXT | NOT NULL, default `"Document YYYY-MM-DD HH:mm"` |
| `source_kind` | TEXT | NOT NULL, enum: `'scan' | 'photo' | 'pdf' | 'mixed'` |
| `status` | TEXT | NOT NULL, enum: `'importing' | 'ready' | 'recognizing' | 'recognized' | 'partial' | 'failed'` |
| `page_count` | INTEGER | NOT NULL, default 0, derived from pages |

**Validation**:
- `page_count` = count of pages; max 20 (enforced at import)
- `status == 'recognized'` only when all pages are `'recognized' | 'noText'`

**State transitions**:
`importing → ready → recognizing → recognized | partial | failed`. Re-run OCR allowed from `partial`/`failed`.

---

### Page

One page within a document.

| Field | Type | Constraints |
|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY, NOT NULL |
| `document_id` | TEXT (UUID) | NOT NULL, FOREIGN KEY → `documents.id` ON DELETE CASCADE |
| `index` | INTEGER | NOT NULL, zero-based order within document |
| `image_path` | TEXT | NOT NULL, relative to app document directory |
| `thumbnail_path` | TEXT | nullable, relative path, generated lazily |
| `source_kind` | TEXT | NOT NULL, enum: `'scan' | 'photo' | 'pdf'` |
| `ocr_status` | TEXT | NOT NULL, enum: `'pending' | 'recognizing' | 'recognized' | 'noText' | 'failed'` |
| `lines` | TEXT (JSON) | NOT NULL, default `'[]'`, array of `OcrLine` |
| `average_confidence` | REAL | nullable, mean of line confidences |

**Validation**:
- `image_path` file ≤ 20 MB (enforced at import)
- `lines` stored verbatim in recognized variant; Trad/Simp toggle is display-only via OpenCC
- Bounding boxes normalized 0–1 relative to page image

**State transitions**: `pending → recognizing → recognized | noText | failed`

---

### OcrLine (JSON value type, embedded in Page.lines)

| Field | Type | Constraints |
|---|---|---|
| `text` | TEXT | NOT NULL, verbatim ML Kit output |
| `bounds` | `{x, y, width, height}` | NOT NULL, normalized 0–1 |
| `confidence` | REAL | NOT NULL, 0–1 |
| `graphemes` | `OcrGrapheme[]` | NOT NULL, proportional split |

---

### OcrGrapheme (JSON value type, embedded in OcrLine.graphemes)

| Field | Type | Constraints |
|---|---|---|
| `char` | TEXT | NOT NULL, single Unicode grapheme cluster |
| `bounds` | `{x, y, width, height}` | NOT NULL, normalized 0–1, proportional split |
| `confidence` | REAL | NOT NULL, 0–1 (same as parent line/element) |

---

### OcrResult (engine output, not persisted directly)

| Field | Type | Constraints |
|---|---|---|
| `status` | TEXT | NOT NULL, enum: `'ok' | 'noText' | 'failed'` |
| `lines` | `OcrLine[]` | NOT NULL |
| `processing_time_ms` | INTEGER | NOT NULL |
| `error` | TEXT | nullable |

---

### AppSettings

User preferences (single row, upsert on change).

| Field | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, always 1 |
| `theme` | TEXT | NOT NULL, enum: `'system' | 'light' | 'dark'`, default `'system'` |
| `font_size` | INTEGER | NOT NULL, default 20 (pt), range 14–32 |
| `script_variant` | TEXT | NOT NULL, enum: `'traditional' | 'simplified'`, default `'traditional'` |

---

## P1/P2 Reserved Entities (schema defined, NOT implemented in P0)

### CharEntry (read-only dictionary, separate DB `assets/dictionary.sqlite`)

| Field | Type | Notes |
|---|---|---|
| `char` | TEXT | PRIMARY KEY, single grapheme |
| `pinyin` | TEXT | CC-CEDICT |
| `hanviet` | TEXT | Unihan `kVietnamese` |
| `en_gloss` | TEXT | CC-CEDICT English |
| `vi_gloss` | TEXT | Curated Vietnamese; missing → `"untranslated"` |
| `radical` | TEXT | KangXi radical char |
| `radical_number` | INTEGER | 1–214 |
| `strokes` | INTEGER | Stroke count |
| `hsk` | INTEGER | 1–6 or NULL |
| `frequency` | INTEGER | Corpus rank (lower = more common) |
| `decomposition` | TEXT | MakeMeAHanzi JSON |
| `trad_variant` | TEXT | NULL if already traditional |
| `simp_variant` | TEXT | NULL if already simplified |

**Indexes**: `char`, `radical`, `pinyin`

### Bookmark (P2)

| Field | Type |
|---|---|
| `id` | UUID |
| `char` | TEXT (FK → CharEntry.char) |
| `created_at` | INTEGER |

### LookupHistory (P2)

| Field | Type |
|---|---|
| `id` | UUID |
| `char` | TEXT (FK → CharEntry.char) |
| `created_at` | INTEGER |

---

## Integrity Rules

- `ON DELETE CASCADE` from `documents` → `pages` (SQLite foreign key).
- Deleting a document: cascade removes pages → app code deletes `image_path` + `thumbnail_path` files via `expo-file-system`.
- OCR writes are idempotent per page: re-run replaces `lines`, never appends.
- All persistence operations are local; no sync, no network (Principle I).
- Dictionary DB is SEPARATE from user data DB (copied from bundle on first launch P1+).

## Platform-Specific Notes

| Aspect | iOS (EAS Build) | Android (local/EAS) |
|---|---|---|
| SQLite driver | `expo-sqlite` (iOS native) | `expo-sqlite` (Android native) |
| FileSystem | `expo-file-system` (Documents dir) | `expo-file-system` (Documents dir) |
| ML Kit model | Bundled in `.xcframework` / app bundle | Bundled in AAR / app bundle |
| PDF renderer | Platform PDFKit via native module | Platform PdfRenderer via native module |