# Contracts: P0 Service Interfaces

**Feature**: `001-project-init-scaffold` | **Date**: 2026-10-03

P0 exposes no network API. These Swift protocol contracts are the seams between
Capture → OCR → Store → Reader. Implementations are built in the implement phase;
`quickstart.md` validates each seam end-to-end. See `data-model.md` for entities.

## CaptureService

```swift
enum CaptureSource { case scan, photo, pdf }
enum ImportResult { case added(pageIDs: [UUID]); case refused(reason: String) }

protocol CaptureService {
    /// Presents system scan UI; resolves with page image files added to a draft doc.
    func scan() async -> ImportResult
    /// Imports system-picker images (Photos) into a draft doc.
    func importPhotos(_ assets: [Data]) async -> ImportResult
    /// Rasterizes a PDF (max 20 pages) into page images; refuses over-cap with message.
    func importPDF(_ data: Data) async -> ImportResult
}
```

- Postcondition: every added page has an image file on disk + `DocPage(ocrStatus: .pending)`.
- Refusal messages: `"PDF has <N> pages; P0 supports up to 20."`, `"No readable pages found."`

## OCRService (on-device only)

```swift
struct OCRLine { let text: String; let box: CGRect; let confidence: Float; let candidates: [String] }
enum OCRStatus { case recognized(lines: [OCRLine]); case noText; case failed(reason: String) }

protocol OCRService {
    /// Runs Vision accurate recognition for zh-Hant/zh-Hans/en off-main-thread.
    func recognize(pageImageURL: URL) async -> OCRStatus
}
```

- Constraints: `VNRecognizeTextRequest`, `.accurate`, no network. See `research.md` R-04.
- Timing gate: <2 s/page on iPhone 13+ (device test; simulator asserts correctness only).

## DocumentStore (SwiftData)

```swift
protocol DocumentStore {
    func createDoc(source: CaptureSource) async -> ScannedDoc
    func addPages(_ images: [URL], to docID: UUID) async throws
    func updateLines(_ lines: [OCRLinePersisted], for pageID: UUID) async throws
    func fetchRecents() async -> [ScannedDoc]
    func deleteDoc(_ docID: UUID) async throws  // cascades to pages + files
}
```

- Postcondition: `deleteDoc` leaves no orphan rows or image files (unit-tested).

## TextDisplayConversion (OpenCC, display-only)

```swift
enum ScriptVariant { case traditional, simplified }
protocol TextDisplayConversion {
    /// Pure function; never mutates stored text.
    func display(_ text: String, as variant: ScriptVariant) -> String
}
```

## ThemeTokens

```swift
enum Theme {
    static let bgBase, bgAlt, mintSurface, mintPrimary, mintInk: Color
    static let pinkSurface, pinkPrimary, pinkInk: Color
    static let lowConfidenceUnderline = pinkInk
}
```

- Rule: no hardcoded hex in any `View`; low-confidence underline uses `pinkInk` only.

## UI Routes (P0 screens)

| Route | Entry | Exit |
|---|---|---|
| `Home` | App launch | → Scan / Photos / Files / open doc / attribution |
| `ScanReview` | Scan done | → confirm (page added) / retake / crop |
| `OCRProgress` | Pages ready | → per-page status → Reader when done |
| `Reader` | Doc recognized | Original \| Text toggle, font-size, Trad/Simp toggle |

VoiceOver labels required on all four routes (acceptance in `quickstart.md`).
