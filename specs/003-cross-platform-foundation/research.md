# Research: Cross-Platform Foundation (Expo + React Native)

**Feature**: `003-cross-platform-foundation` | **Date**: 2026-10-04
**Scope**: P0 foundation — capture, on-device OCR (bundled ML Kit), PDF import, Reader, persistence. Constitution v2.1.0 decisions are binding.

## R-01: Expo SDK Version

- **Decision**: Use the CURRENT stable Expo SDK (SDK 51+ as of 2026-10) and the React Native version it ships. Confirm with `npx expo-doctor`. Do not pin an older SDK.
- **Rationale**: Constitution mandates current stable SDK; pinning creates maintenance debt and blocks native module compatibility. Node version follows SDK requirement.
- **Alternatives considered**: Pinning to SDK 50 (rejected — constitution forbids); waiting for SDK 52 (rejected — use current stable).

## R-02: ML Kit Wrapper with Bundled Chinese Model

- **Decision**: Spike required before feature work. Evaluate maintained wrappers (e.g., `react-native-mlkit-text-recognition`, `react-native-mlkit-vision`, or Expo's own modules). Criteria: (1) supports Chinese text recognition, (2) allows bundling model in app (not runtime download), (3) works on iOS + Android with current Expo SDK, (4) has config plugin or autolinking. If none qualify, build a small Expo native module wrapping ML Kit `TextRecognizer` with bundled `zh` model assets.
- **Rationale**: Constitution principle I requires bundled model, no runtime download. Principle V requires spike before plan commits to wrapper. ML Kit's Chinese model is ~20 MB; bundling adds to install size but counts toward 150 MB budget.
- **Alternatives considered**: Runtime model download (rejected — Principle I); Tesseract fallback (rejected — banned); cloud OCR (rejected — Principle I).

## R-03: PDF Text Extraction + Page Rendering

- **Decision**: Spike required. Evaluate libraries that can (a) detect embedded text layer in PDF, (b) render pages to images at ~300 dpi equivalent. Candidates: `react-native-pdf` (viewer, may not expose text layer), `pdfjs-dist` (text extraction + rendering, heavier), `react-native-pdf-lib` (manipulation), or a small native module using platform PDFKit (iOS) / PdfRenderer (Android). Must work on both platforms with current Expo SDK.
- **Rationale**: Spec FR-006 requires text-layer-first approach. Constitution requires spike proving approach before plan commits. Viewer-only libraries insufficient.
- **Alternatives considered**: OCR every page unconditionally (rejected — slower, ignores existing text); `react-native-view-pdf` (rejected — viewer only).

## R-04: ML Kit Output → Per-Character (Grapheme) Entries

- **Decision**: ML Kit returns line/element clusters with bounds and confidence. Implement proportional split by Unicode grapheme cluster: measure cluster advance width, divide bounds proportionally, assign same confidence to each grapheme (or line/element confidence). Returns `OcrGrapheme[]` with approximate bounds for P1 tap targets.
- **Rationale**: Constitution L103-104: ML Kit returns clusters, not glyphs. Proportional split is standard heuristic. Confidence at engine-reported granularity (line/element); threshold 0.7 applied consistently.
- **Alternatives considered**: Per-glyph ML Kit output (not available); fixed-width split (rejected — proportional respects variable-width glyphs).

## R-05: Reading Order Heuristic for Vertical Text

- **Decision**: Default: sort by `bounds.top` then `bounds.left` (top-to-bottom, left-to-right). Vertical heuristic: if page aspect ratio > 1.5 AND median element width > height, treat as vertical columns; sort by `bounds.right` descending (right-to-left columns), then `bounds.top`. Flag results as best-effort in UI.
- **Rationale**: Constitution L107-110: ML Kit ordering unreliable for vertical. Heuristic documented, not perfect, but honest. Matches PROJECT_SCOPE vertical layout handling.
- **Alternatives considered**: Full vertical ML Kit model (not available); Tesseract vertical (banned).

## R-06: Local SQLite with Typed Query Layer

- **Decision**: `expo-sqlite` + `drizzle-orm`. Schema defined in TypeScript with Drizzle; migrations via Drizzle Kit. User data tables: `documents`, `pages`, `app_settings`. Page images/thumbnails in document directory (file paths in DB). Future dictionary: separate `assets/dictionary.sqlite` copied to document dir on first launch (P1+).
- **Rationale**: Constitution L89-91, L115-116: `expo-sqlite` with typed query layer (Drizzle). No WatermelonDB, Room, SwiftData. Drizzle gives type-safe queries, migrations, and works with Expo SQLite.
- **Alternatives considered**: Raw SQL (rejected — no type safety); WatermelonDB (rejected — banned); Realm (rejected — not Expo-first); custom query builder (rejected — Drizzle is maintained standard).

## R-07: Trad/Simp Conversion (OpenCC JS)

- **Decision**: Use `opencc-js` (WASM) or `opencc` (pure JS) for display-only conversion. Function `convert(text, 's2t' | 't2s')` pure, never mutates stored text. Verify byte-for-byte match with Swift OpenCC (golden file tests).
- **Rationale**: Constitution L121-122: display only, stored text unchanged. JS library avoids native module. `opencc-js` is WASM, fast enough for per-tap conversion.
- **Alternatives considered**: Native OpenCC via native module (rejected — Principle VI: no native when JS works); server API (rejected — Principle I).

## R-08: Theme Tokens via Tailwind + NativeWind

- **Decision**: `tailwind.config.js` at repo root defines `mint.*`, `pink.*`, `bg.*` (light/dark, `class` strategy). Views use only `className="bg-mint-surface text-mint-ink"` etc. No hardcoded hex. Pastels for surfaces only. `nativewind` processes Tailwind at build time.
- **Rationale**: Constitution L123-125: single token source, no hardcoded hex. NativeWind is Expo-compatible. Dark mode via `class` strategy on root view.
- **Alternatives considered**: CSS-in-JS (rejected — no token enforcement); StyleSheet with constants (rejected — no dark mode automation); `react-native-styled-components` (rejected — runtime overhead).

## R-09: Fonts (Noto Sans SC + Rounded Latin)

- **Decision**: Bundle `Noto Sans SC` (SIL OFL) for Chinese via `expo-font`. Pick one rounded Latin font (e.g., `Noto Sans Rounded` or `Inter Rounded` — SIL OFL) for Latin/rounded hero. Both redistributable on iOS/Android. No Apple-only fonts (SF Pro, SF Rounded).
- **Rationale**: Constitution L126-127: fonts must be redistributable on both platforms. Apple-only fonts violate Principle VII. Noto family is standard, OFL-licensed, covers Chinese + Latin.
- **Alternatives considered**: System fonts (rejected — SF Pro/Rounded not on Android); separate fonts per platform (rejected — single codebase, visual parity).

## R-10: E2E Testing with Maestro

- **Decision**: Maestro flows for scan→read, import→read, persistence, delete, airplane mode. Run on Android emulator (local) and iOS simulator (EAS). Maestro chosen over Detox for Expo compatibility and simpler setup.
- **Rationale**: Constitution L47-48: e2e on Maestro on Android emulator + iOS simulator. Maestro works with Expo dev builds, no Jest/Detox flakiness.
- **Alternatives considered**: Detox (rejected — complex with Expo); Appium (rejected — heavier); manual only (rejected — Principle V requires automated e2e).

## R-11: CI Pipeline (GitHub Actions + EAS)

- **Decision**: GitHub Actions for unit tests (Jest), lint, typecheck. EAS Build for iOS/Android preview builds. EAS Submit for TestFlight/Play Store (later). CI job verifies `android.permission.INTERNET` and `UIBackgroundModes` network absent from release config.
- **Rationale**: Constitution L51: CI check verifies no network permission in release config. EAS handles iOS builds without Mac.
- **Alternatives considered**: Bitrise/CircleCI (rejected — GitHub Actions + EAS is standard Expo stack); local-only (rejected — CI required).

## R-12: Snapshot Corpus Structure

- **Decision**: Repo structure: `assets/snapshot-corpus/{printed,vertical,handwritten}/` with images + `manifest.json` mapping filename → ground truth text + tier. Vitest reads manifest, runs OCR via test double or real engine on device, computes char accuracy. Printed tier gates at 0.95; vertical/handwritten informational, non-regressing.
- **Rationale**: Constitution L48-50: fixed snapshot corpus, printed tier gates, others informational baselines. Shared corpus ensures parity.
- **Alternatives considered**: Per-platform corpus (rejected — parity requires same ground truth); synthetic data (rejected — real samples needed).

## Resolved Status

All technical decisions resolved via constitution binding or spike requirements. No open `NEEDS CLARIFICATION` remains. Spikes (R-02, R-03) must complete before feature tasks begin.