# Quickstart: Validate P0 Cross-Platform Foundation

**Feature**: `003-cross-platform-foundation` | **Date**: 2026-10-04

Covers: Android + iOS parity, scan/import/OCR/read, persistence, offline, regression, attribution, developer setup.

## Prerequisites

- Node.js (version required by current stable Expo SDK)
- pnpm 9+
- Git
- **Android**: Android Studio (emulator API level per SDK) or physical device (Android min per SDK) with USB debugging
- **iOS**: No Mac required for builds (EAS Build cloud). TestFlight app on iOS device for testing. Xcode + Simulator optional for local Mac.
- EAS CLI: `pnpm dlx eas-cli@latest` (for iOS builds)
- Expo Dev Client: `pnpm dlx expo@latest install expo-dev-client`

## Setup (Fresh Clone)

```bash
git clone <repo-url> tungcua
cd tungcua
pnpm install
# Build dictionary (P1+, no-op in P0)
pnpm run build:dictionary   # → assets/dictionary.sqlite (placeholder in P0)
# Verify snapshot corpus
ls -la assets/snapshot-corpus/{printed,vertical,handwritten}/
```

## Validation Scenarios

### QS-1 Fresh Clone → Working Dev Builds (SC-008)

```bash
# Android
pnpm expo start --dev-client --android
# → builds dev client, installs on emulator/device, opens app

# iOS (no Mac required)
pnpm eas build --platform ios --profile development
# → EAS builds in cloud, QR code for TestFlight install
```

**Expect**: App launches on both platforms. Home shows empty Recents + Scan / Photos / Files / Attribution buttons. No crashes.

---

### QS-2 Scan a Printed Page (US1, SC-001, SC-002)

1. Open app → tap **Scan**
2. Grant camera permission
3. Point at printed Chinese page → capture
4. Review: retake / crop / confirm
5. Confirm → page added, OCR Progress shows page
6. Wait for recognition → Reader opens with text

**Expect**:
- Camera permission requested with clear rationale
- Review screen allows retake/crop
- OCR completes < 2 s on real device (Snapdragon 7 Gen 1 / iPhone 13 class)
- Reader shows recognized text matching page

---

### QS-3 Import Photo (US2)

1. Home → tap **Photos**
2. Grant media library permission
2. Pick a Chinese photo
3. Page added, OCR runs, Reader opens

**Expect**: Same OCR quality as scan; photo import path works.

---

### QS-4 Import Text PDF (US2, FR-006)

1. Home → tap **Files**
2. Pick a 3-page **text-based** PDF (has embedded selectable text)
3. Pages listed immediately (text layer detected, no OCR needed)

**Expect**: Text used directly; no OCR delay; Reader shows correct text.

---

### QS-5 Import Scanned PDF (US2, FR-006)

1. Home → tap **Files**
2. Pick a 3-page **scanned** PDF (no text layer)
3. Pages rendered at ~300 dpi → OCR runs → Reader opens

**Expect**: Each page rendered → OCR < 2 s/page; recognized text correct.

---

### QS-5b Import Over-Cap PDF (US2, FR-006)

1. Home → tap **Files**
2. Pick a 25-page PDF
3. Import refused with clear message: "PDF has 25 pages; maximum is 20."

**Expect**: Refusal message shown; no partial import.

---

### QS-6 Reader Controls (US3, FR-009, FR-010)

On a recognized document in Reader:

1. **Original | Text** toggle → switches between page image and recognized text
2. **Font size slider** (14–32 pt) → text size changes immediately
3. **Traditional / Simplified** toggle → text converts via OpenCC; stored text unchanged
4. **Low-confidence underline** → text with ML Kit confidence < 0.7 has pink-ink underline (never red)
5. **Blank page** → shows "No text found" state (not error)

**Expect**: All controls responsive; theme tokens only (no hardcoded hex); pink-ink underline visible.

---

### QS-7 Persistence (US4, FR-008)

1. Scan/import a page, run OCR, verify Reader
2. Force-close app (swipe away from recents)
3. Reopen app → document in Recents with text intact
4. Long-press document → Delete → confirm
5. Document gone from Recents; image files deleted

**Expect**: Data survives restart; delete cascades to pages + files.

---

### QS-8 Airplane Mode (US5, SC-007)

1. Enable airplane mode (disable Wi-Fi + cellular)
2. Repeat QS-2 through QS-7
3. Verify zero network requests (OS network monitor / Xcode/Studio network profiler)

**Expect**: All flows identical to online. No permission prompts for network. No background traffic.

---

### QS-9 iOS Regression (US6, SC-005)

Run **QS-1 through QS-8 on iOS** (via TestFlight dev build). All must pass.

**Additional**: Compare theme colors to `DesignPrinciples.md` in light/dark mode — pixel-perfect match.

---

### QS-10 Attribution Screen (US7, FR-011)

1. Home → tap **Attribution**
2. Verify entries: CC-CEDICT (CC BY-SA), Make Me a Hanzi (Arphic), Vietnamese gloss placeholder
3. License files present in bundle (`assets/licenses/`)

---

### QS-11 Unit Tests (Principle V)

```bash
pnpm test
# → Jest with Expo preset runs all unit tests
# Required test coverage:
# - coordinate mapping / reading order
# - grapheme splitting
# - Trad/Simp conversion (golden files)
# - PDF text-layer detection
# - Database operations (create, read, update, delete, cascade)
```

**Expect**: All tests pass. Tests written BEFORE implementation (Red-Green-Refactor).

---

### QS-12 E2E Flows (Maestro)

```bash
# Android
pnpm test:e2e:android
# → runs Maestro flows on emulator

# iOS (requires EAS simulator or local Mac)
pnpm test:e2e:ios
# → runs Maestro flows on iOS simulator
```

**Required flows**: scan→read, import→read, persistence, delete, airplane mode.

---

### QS-13 Snapshot Corpus Accuracy (SC-004)

```bash
pnpm test:accuracy
# → Runs OCR on printed/vertical/handwritten corpus
# Printed tier: character accuracy ≥ 0.95 (gate)
# Vertical/handwritten: reported as informational baseline; must not regress
```

**Expect**: Printed ≥ 0.95 on both platforms. Baselines recorded in CI.

---

### QS-14 CI Checks (Principle V, L51)

```bash
# Local simulation of CI
pnpm lint && pnpm typecheck && pnpm test
# CI also verifies:
# - No INTERNET permission in Android release manifest
# - No network capability in iOS release entitlements
# - No network calls during core flow (simulated)
```

---

### QS-15 Performance (SC-002, SC-003, SC-006)

| Metric | Target | Measurement |
|---|---|---|
| OCR per printed page | < 2 s | Real device (Snapdragon 7 Gen 1 / iPhone 13 class) |
| Reader scroll 20-page doc | 60 fps | Real device |
| JS bundle (gzipped) | < 3 MB | `pnpm expo export --dump-assetmap` |
| Installed size | ≤ 150 MB | APK / IPA size including ML Kit model |

**Note**: Emulator timings NOT accepted for SC-002/SC-003.

---

## Out of Scope (Must NOT Appear in P0)

- Per-character tap + detail sheet
- Dictionary lookup
- Stroke order animation
- TTS
- Bookmarks/history
- Text correction UI
- Search
- Flashcards/export
- Sync/backup
- On-device paraphrase

If any of these appear in the build, flag as scope leak.

---

## Troubleshooting

| Issue | Resolution |
|---|---|
| `expo-doctor` warnings | Fix before proceeding; SDK version mismatch blocks builds |
| ML Kit model not found | Verify `assets/mlkit/` has bundled model for both platforms |
| PDF text layer not detected | Spike may need different renderer; check `pdf.ts` |
| Theme colors wrong | Check `tailwind.config.js` matches `DesignPrinciples.md` exactly |
| iOS build fails on EAS | Check `eas.json` profiles, `app.config.ts` plugins, bundle ID |
| Maestro flow flaky | Add waits/retries; ensure element IDs stable |