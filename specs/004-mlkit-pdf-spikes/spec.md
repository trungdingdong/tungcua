# Feature Specification: ML Kit + PDF Spikes (M1)

**Feature Branch**: `004-mlkit-pdf-spikes`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Technical spikes for TungCua P0: prove the on-device Chinese OCR path and the PDF text-extraction/rendering path on both iOS and Android before any feature work depends on them. This is module M1 of the P0 build order and covers tasks T012 (ML Kit spike) and T013 (PDF spike)."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — ML Kit Chinese OCR Spike Execution (Priority: P1)

A developer runs the Spike A harness on a real Android device and a real iPhone to verify that a maintained React Native/Expo wrapper can run Google ML Kit's Chinese text recognition with the model BUNDLED on both platforms, returning structured results (text, lines, boxes, confidence) suitable for per-character proportional splitting and the 0.7 low-confidence rule.

**Why this priority**: The entire OCR core (M4) and all downstream modules depend on this spike's verdict. If it fails, the architecture changes fundamentally.

**Independent Test**: Run the Spike A harness (a release-style build, see Technical Constraints) on a real Android device and a real iPhone with the agreed 20-image corpus. Record accuracy, cold and warm timing, returned structure, failure behavior, and airplane-mode behavior.

**Acceptance Scenarios**:

1. **Given** the Spike A harness installed as a fresh install on a real Android device and a real iPhone, **When** the developer runs recognition on the 20-image corpus in airplane mode, **Then** Chinese recognition completes on both platforms and no network permission is present in the release configuration.
2. **Given** the harness output, **When** printed horizontal Chinese images are processed, **Then** mean character accuracy is ≥ 0.95 on both platforms and warm per-page time is < 2 s on mid-range Android and iPhone 13-class hardware.
3. **Given** the harness output, **When** results are inspected, **Then** bounding boxes are returned in a documented coordinate convention usable for proportional per-character splitting, and the confidence level reported (line, element, or none) is documented for each platform.
4. **Given** a blank page and a non-Chinese page, **When** recognition runs, **Then** the result is recorded as "no text" and not as an error; a corrupted or oversized image fails with a distinct, non-crashing failure.

---

### User Story 2 — PDF Text-Layer + Rendering Spike Execution (Priority: P1)

A developer runs the Spike B harness on the same real devices to verify that PDFs can have embedded text layers detected/extracted and pages rendered to images at ~300 dpi equivalent on both platforms, with per-page decision logic for mixed PDFs.

**Why this priority**: The PDF pipeline (M6) depends on this spike. If it fails, the import flow architecture changes.

**Independent Test**: Run the Spike B harness on the same real devices with the agreed 10-PDF corpus. Record text-layer detection results, extracted text quality, render timing, memory behavior, and failure modes.

**Acceptance Scenarios**:

1. **Given** the Spike B harness on real devices, **When** text-based PDFs are processed, **Then** text-layer detection works, extraction yields accurate text with reading order, and the "usable text layer" heuristic is documented.
2. **Given** the harness, **When** scanned/image-only PDFs are processed, **Then** pages render at ~300 dpi equivalent and feed Spike A's recognition with accuracy comparable to a native photo of the same content.
3. **Given** the harness, **When** a 20-page PDF is processed on mid-range Android, **Then** rendering completes sequentially without crash or out-of-memory error, temporary files are cleaned up, and peak memory is recorded if measurable.
4. **Given** the harness, **When** a 25-page, encrypted, corrupted, or zero-page PDF is opened, **Then** each fails with a distinct, user-readable error before heavy work begins and without crashing.
5. **Given** a mixed PDF (some text pages, some scanned pages), **When** processed, **Then** the text-layer decision is made per page.

---

### User Story 3 — End-to-End Chain Validation (Priority: P1)

A developer proves the full chain on both platforms: scanned PDF → rendered page image → ML Kit Chinese recognition → structured result (text, lines, boxes, confidence) with timing, in airplane mode.

**Why this priority**: This is the single most important integration result of M1. It validates that the two spikes compose correctly.

**Independent Test**: Run a scanned PDF through the composed pipeline on both devices in airplane mode, using a release-style build. Record end-to-end timing, accuracy vs. ground truth, and the final structured result shape.

**Acceptance Scenarios**:

1. **Given** a scanned PDF from the corpus, **When** the end-to-end chain runs in airplane mode, **Then** the pipeline completes on both platforms with zero network calls, producing structured results (text, lines, boxes, confidence) and per-page timing.

---

### User Story 4 — Decision Records and Go/No-Go (Priority: P1)

A developer writes one decision record per spike and a go/no-go for starting M4 (OCR core) and M6 (PDF pipeline), including interface sketches so M4 and M6 can write tests first.

**Why this priority**: The spikes only have value if they produce a decision that later modules can act on.

**Independent Test**: A reviewer who did not run the spikes can read the decision records and name the exact packages (or native module design) M4 and M6 will use, the evidence behind the choice, and what happens if a spike failed.

**Acceptance Scenarios**:

1. **Given** completed experiments, **When** the decision records are reviewed, **Then** each lists options evaluated, measurements, chosen approach with exact package names and versions (or native module design), rejected options with reasons, risks, and a go/no-go.
2. **Given** a failed spike, **When** the record is reviewed, **Then** it states the permitted fallback and the cost of switching.

---

### Edge Cases

- What happens when no maintained ML Kit wrapper qualifies? → Plan a small custom Expo native module (permitted by Constitution Principle I).
- What happens when the PDF text layer is empty, garbage, or has wrong reading order? → A documented heuristic rejects it and falls back to OCR. Heuristic: extracted text length > 10 chars, non-whitespace ratio > 50%, reading order plausible (LTR or RTL consistent). If heuristic fails, page is treated as scanned.
- What happens when a rendered PDF page exceeds 20 MB? → Record the observed behavior and recommend one behavior (skip page or abort) with a distinct, clear error.
- What happens when ML Kit returns no confidence values on a platform? → Document the confidence model per platform and how the 0.7 rule adapts.
- What happens when a PDF is password-protected, corrupted, or has zero pages? → Distinct, user-readable errors; no crashes.
- What happens when no real iPhone or Apple Developer account is available? → iOS results are marked unverified and the iOS go/no-go is blocked; M4 and M6 may proceed for Android only.
- What happens when airplane-mode testing is attempted with a development-client build? → Invalid: that build loads JavaScript from a development server over the network. Use a release-style build.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The spike MUST evaluate and document whether a maintained React Native/Expo wrapper exists that exposes ML Kit Chinese text recognition with the BUNDLED model on both iOS and Android, without runtime download. On Android this means ML Kit's bundled Chinese text-recognition dependency, not the Play Services-delivered variant; on iOS the Chinese text-recognition pod. "Maintained" means: a release within the last 12 months, compatible with the project's Expo SDK and the New Architecture (Fabric renderer, TurboModules, Hermes), and no unresolved build-breaking issues.
- **FR-002**: The spike MUST verify the chosen ML Kit approach works with the project's Expo SDK, the New Architecture, development builds, and EAS Build without ejecting.
- **FR-003**: The spike MUST document the exact return structure of the ML Kit approach: full text, blocks, lines, elements, bounding boxes (coordinate space and orientation), and confidence values per level (line/element/none) on each platform.
- **FR-004**: The spike MUST measure and report printed horizontal Chinese accuracy and time on both platforms using the 20-image corpus. Pass thresholds: mean character accuracy ≥ 0.95 and warm per-page time < 2 s. Accuracy is defined as 1 − (edit distance ÷ reference length), computed after stripping whitespace and normalizing punctuation; Simplified and Traditional forms are NOT normalized. Cold time (first call after launch) and warm time (median of at least 5 runs after one warm-up run) are reported separately; the 2 s gate applies to warm time. Vertical and handwritten results are informational and not gated.
- **FR-005**: The spike MUST verify that no network permission is present in the release configuration and that recognition works in airplane mode from a fresh install of a release-style build, proving the model is bundled.
- **FR-006**: The spike MUST evaluate and document PDF text-layer detection and extraction on both platforms, with a documented heuristic for rejecting empty/garbage layers and falling back to OCR, decided per page. The heuristic is: extracted text length > 10 characters, non-whitespace ratio > 50%, and reading order is plausible (left-to-right or right-to-left consistent). If the heuristic fails, the page is treated as scanned and rendered for OCR.
- **FR-007**: The spike MUST verify page rendering at exactly 300 DPI (scale = 300/72 ≈ 4.17x PDF points to pixels) on both platforms to an image file (JPEG 85% quality or PNG) suitable as ML Kit input. A viewer-only component is not sufficient unless it can produce an image file; this MUST be verified before the component is considered. Output image ≤ 20 MB per page.
- **FR-008**: The spike MUST verify that a 20-page PDF renders sequentially without crash or out-of-memory error on mid-range Android, with temporary files cleaned up and peak memory recorded if measurable; that the 20-page cap is enforced before heavy work; and that 25-page, encrypted, corrupted, and zero-page PDFs each fail with a distinct, user-readable error.
- **FR-009**: The spike MUST prove the end-to-end chain: scanned PDF → rendered image → ML Kit recognition → structured result (text, lines, boxes, confidence) with timing, in airplane mode on both platforms.
- **FR-010**: The spike MUST record how each approach reports a blank page and a non-Chinese page (expected: "no text", not an error) and how it fails on a corrupted or oversized image (expected: distinct, non-crashing failure), so M4's status model (ok / noText / failed) can be defined.
- **FR-011**: The spike MUST produce written decision records per spike with: options evaluated, measurements, chosen approach, rejected options with reasons, risks, exact package names and versions or native module design, and a go/no-go for M4 and M6.
- **FR-012**: The spike MUST produce verified interface sketches (types only) for the chosen ML Kit approach and PDF approach so M4 and M6 can write tests first.
- **FR-013**: The spike MUST measure and report app size delta from the bundled Chinese model and from the PDF approach on each platform (APK size for Android, IPA size for iOS, against the 150 MB budget), build-time impact, and config plugin or native setup needs.
- **FR-014**: The spike MUST confirm the confidence model (ML Kit reports at element level on both platforms; graphemes inherit parent element confidence; threshold 0.7 applied at display time) and state the resulting rule for the 0.7 low-confidence underline.
- **FR-015**: The spike MUST document coordinate and orientation conventions (bounds 0-1 normalized, origin top-left, orientation corrected), the vertical-text heuristic (page aspect ratio > 1.5 AND median element width > height → sort by right descending for right-to-left columns, then top), and the proportional grapheme splitting approach (Unicode grapheme clusters via `Intl.Segmenter`, proportional bounds allocation).
- **FR-016**: The spike harness MUST be a separate Expo project (for example `spikes/ocr-pdf/`) with its own `package.json`, dependencies, and builds, or a throwaway branch. The main app's `package.json` MUST receive only the winning approach, and only in M4/M6. Losing-candidate dependencies MUST NOT appear in the main app. Exact package versions MUST be locked in decision records for reproducibility.

---

### Key Entities

- **SpikeAHarness**: Throwaway Expo app exercising ML Kit wrapper candidates on real devices; includes the 20-image corpus with ground truth; produces structured results and measurements.
- **SpikeBHarness**: Throwaway Expo app exercising PDF text-layer detection/extraction and page rendering candidates; includes the 10-PDF corpus with ground truth; produces measurements and failure-mode documentation. May share a project with Spike A so the end-to-end chain can run.
- **DecisionRecord**: Written document per spike (A and B) containing: options evaluated, measurements, chosen approach with exact package/version or native module design, rejected options with reasons, risks, interface sketch, go/no-go for M4/M6.
- **InterfaceSketch**: TypeScript types for `OcrEngine`, `OcrResult`, `OcrLine`, `OcrGrapheme`, `PdfDetector`, `PdfRenderer` that M4 and M6 will implement against.
- **ImageCorpus (~20 images)**: clean printed Simplified; printed Traditional with moderate skew, blur and lighting variation; mixed Chinese/Latin/digits/punctuation; printed vertical Traditional (right-to-left columns); handwriting sample; blank page; non-Chinese page; an image near the 20 MB cap; a corrupted/unreadable file. Each has hand-written ground-truth text where applicable.
- **PdfCorpus (~10 PDFs)**: text-based Simplified; text-based Traditional; scanned image-only; mixed text/scanned; 20 pages; 25 pages; large page size; password-protected; corrupted; and a PDF whose text layer is empty or garbage. Each has ground truth where applicable.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Both spikes have a written decision record with measured evidence from real devices on both platforms.
- **SC-002**: The end-to-end chain (scanned PDF → rendered page image → ML Kit Chinese recognition → structured result) works in airplane mode on a real Android device and a real iPhone using a release-style build, or the record states exactly what failed and the chosen fallback.
- **SC-003**: Mean printed horizontal accuracy is at least 0.95 and warm OCR time is under 2 s per page on both devices, or the shortfall is documented with a mitigation.
- **SC-004**: A 20-page PDF renders sequentially without crash or out-of-memory on the mid-range Android; 25-page, encrypted, corrupted and zero-page PDFs fail with distinct errors.
- **SC-005**: Adding the chosen approaches keeps the projected install size within the 150 MB budget, with measured deltas recorded.
- **SC-006**: A clear go/no-go is recorded for starting M4 (OCR core) and M6 (PDF pipeline), with the interface sketches needed to write their tests first.
- **SC-007**: The spike harness and any losing-candidate dependencies are removable without touching production code.

---

## Assumptions

- The foundation project (M0: `expo-doctor` clean, development builds on both platforms) is complete before this module starts.
- The spike corpora (images, PDFs, and hand-written ground-truth text) are prepared by the developer before experiments begin. This preparation is the slowest part of the module and is not covered by the spike's time estimate. A small corpus is enough because the goal is feasibility, not final accuracy tuning (the full snapshot corpus gate happens in M4).
- A mid-range Android device (Snapdragon 7 Gen 1 class) and an iPhone 13-class device are available for testing.
- Installing builds on a physical iPhone via EAS typically requires a paid Apple Developer Program membership. If no real iPhone or membership is available, iOS results are marked unverified and the iOS go/no-go is blocked; Android may proceed alone. This is a known risk.
- iOS builds use EAS Build (no Mac required locally). Each candidate build consumes EAS build quota; the plan should account for build limits on the current plan.
- The project's current Expo SDK (currently 57) and the React Native version it ships are used; there is no pinning to an older SDK.

---

## Technical Constraints (from Constitution v2.1.0)

- Use the project's current Expo SDK and the React Native version it ships; confirm with `npx expo-doctor`. Do not pin an older SDK.
- Continuous Native Generation with a development build (`expo-dev-client`) and EAS Build; Expo Go is NOT supported.
- Airplane-mode and no-network-permission checks MUST use a preview or release build profile with JavaScript bundled in the app. A development-client build loads JavaScript over the network and is not valid for these checks.
- No network calls during any experiment run used for pass criteria; verify with airplane mode.
- Spike code lives in an isolated, clearly named location (a separate Expo project under `spikes/`, or a throwaway branch) and must not be imported by production code.
- Keep dependencies added for losing candidates out of the main app's `package.json`.
- Do NOT use WatermelonDB, Tesseract, Kotlin Multiplatform, SwiftData, Room, or any cloud API.
- Fallbacks permitted by the Constitution: a small custom Expo native module. Fallbacks NOT permitted without amending Principle I: cloud OCR, Tesseract, any second OCR engine, runtime model downloads.
- **New Architecture validation**: Spike A MUST verify the chosen ML Kit wrapper works with Fabric renderer, TurboModules, and Hermes.
- **Exact DPI**: 300 DPI rendering uses scale = 300/72 ≈ 4.17x PDF points to pixels.
- **Fail-fast 20-page cap**: PDF page count check occurs before any rendering; over-cap files are refused immediately with a distinct error.
- **Version pinning**: Exact package versions locked in decision records for reproducibility.

---

## Out of Scope

- Production OCR pipeline, database, screens, theming, camera capture, gallery import, Reader, Trad/Simp conversion, dictionary, tap interaction, accessibility work, CI pipeline, and any polished UI.
- Choosing between ML Kit and other engines (the engine is fixed by Constitution Principle I; this module only decides how to reach it).
