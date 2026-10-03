# Data Model: Project Init & P0 Scaffold

**Feature**: `001-project-init-scaffold` | **Date**: 2026-10-03 | **Phase**: P0
**Store**: SwiftData (+ file store for page images). P0 only — `Bookmark`, `LookupHistory`, `CharEntry` arrive in P1/P2.

## Entities

### ScannedDoc

A single capture session (scan batch, photo set, or one PDF import).

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key, auto-generated |
| `createdAt` | Date | Set on creation, immutable, used for recents sort (desc) |
| `title` | String | Default `Document <yyyy-MM-dd HH:mm>`; user-renameable in later phase (P0: read-only default) |
| `sourceKind` | enum (`scan`, `photo`, `pdf`, `mixed`) | Records origin mix |
| `pageCount` | Int (derived) | Equals `pages.count`; 1–20 enforced at import |
| `status` | enum (`importing`, `ready`, `recognizing`, `recognized`, `partial`, `failed`) | Transitions below |

**Relationships**: `pages: [DocPage]` — cascade delete (deleting a doc deletes its pages + image files).

**Validation**:
- `pages.count <= 20` (import refuses more with user-facing message).
- `status == .recognized` only when every page is `.recognized` or `.noText`; any `.failed` → `.partial`/`failed`.

**State transitions**:
`importing → ready → recognizing → recognized | partial | failed`. Re-run of OCR allowed from `partial`/`failed`.

### DocPage

One page within a `ScannedDoc`.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `index` | Int | Zero-based order within doc; reorder updates indexes |
| `imageFileName` | String | Relative file name under `Documents/PageImages/`; file must exist |
| `thumbnailFileName` | String? | Derived thumbnail; generated lazily, never blocks import |
| `sourceKind` | enum (`scan`, `photo`, `pdf`) | Per-page origin |
| `ocrStatus` | enum (`pending`, `recognizing`, `recognized`, `noText`, `failed`) | See transitions |
| `lines` | [RecognizedLine] (value type, persisted) | Empty unless `recognized` |
| `averageConfidence` | Float? | Mean of line confidences; nil unless recognized |

**Validation**:
- Image file ≤ 20 MB per page (import downscales beyond print-readable need).
- `lines` preserved verbatim (recognized variant); Trad/Simp toggle is display-only via OpenCC, never stored.
- Bounding boxes normalized to 0–1 relative coordinates (resolution-independent).

**State transitions**: `pending → recognizing → recognized | noText | failed`.

### RecognizedLine (value type, embedded in DocPage)

| Field | Type | Rules |
|---|---|---|
| `text` | String | Non-empty; verbatim Vision output |
| `boundingBox` | CGRect (normalized) | 0–1 relative to page image |
| `confidence` | Float 0–1 | From `VNRecognizedTextObservation.confidence`; `< 0.6` renders pink-ink underline (tunable threshold, single constant) |
| `candidates` | [String] (top-3) | Retained for P2 correction UI; unused in P0 display |

### SnapshotSample (test fixture, not app runtime)

| Field | Type | Rules |
|---|---|---|
| `name` | String | e.g. `printed-horizontal-01` |
| `tier` | enum (`printed`, `vertical`, `handwritten`) | Gate thresholds differ per tier |
| `imagePath` | Path | Checked into `Tests/SnapshotCorpus/` |
| `expectedText` | String | Ground truth |
| `minAccuracy` | Float | Printed ≥ 0.95, vertical ≥ 0.80 (tracked), handwritten ≥ 0.60 (tracked, honest flag) |

Thresholds are P0 gates for printed tier; vertical/handwritten are tracked (not blocking) with visible low-confidence flags per principle IV.

## P1-Reserved (schema seams, NOT built in P0)

- `Bookmark`, `LookupHistory`: SwiftData models (P2).
- `CharEntry`: read-only bundled SQLite table (pinyin, Han-Viet, EN/VI gloss, radical, strokes, HSK, frequency) — P1.
- `DocPage.lines[].candidates` already retained to feed P2 correction UI.

## Integrity Rules

- Delete `ScannedDoc` → delete `DocPage` rows → delete image + thumbnail files (no orphans; covered by unit test).
- OCR writes are idempotent per page: re-run replaces `lines`, never appends.
- All persistence operations are local; no sync, no network (constitution I).
