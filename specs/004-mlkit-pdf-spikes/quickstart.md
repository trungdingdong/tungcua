# Quickstart: Validate ML Kit + PDF Spikes (M1)

**Feature**: `004-mlkit-pdf-spikes` | **Date**: 2026-10-04

Covers: Spike A (ML Kit Chinese OCR), Spike B (PDF text-layer + rendering), end-to-end chain. Run on real devices only.

## Prerequisites

- Node.js (version required by current stable Expo SDK)
- pnpm 9+
- Git
- **Android**: Physical device (Snapdragon 7 Gen 1 class) with USB debugging, or Android Studio emulator (dev only — pass/fail requires real device)
- **iOS**: Physical iPhone 13-class device; EAS Build + TestFlight (no Mac required). Xcode Simulator for dev only.
- EAS CLI: `pnpm dlx eas-cli@latest`
- Expo Dev Client: `pnpm dlx expo@latest install expo-dev-client`

## Setup

```bash
# From repo root
cd tungcua
pnpm install

# Verify Expo SDK
npx expo-doctor

# Prepare corpus (team provides)
ls -la assets/spike-corpus/spike-a/     # ~20 images + manifest.json
ls -la assets/spike-corpus/spike-b/     # ~10 PDFs + manifest.json
```

---

## Spike A: ML Kit Chinese OCR

### SA-1: Harness Setup

```bash
cd spikes/spike-a
pnpm install
# Verify app.config.ts has bundle ID, permissions, ML Kit plugin
```

### SA-2: Run on Android Device

```bash
# Build development client
pnpm eas build --platform android --profile development

# Install on device (QR code or adb)
# Run harness — it will:
# 1. Load corpus manifest
# 2. For each image: run OCR (cold + warm), record accuracy, timing, structure
# 2. Output results to src/results/spike-a-android.json
# 3. Verify airplane mode: run again with Wi-Fi/cellular off
```

### SA-3: Run on iOS Device (EAS Build)

```bash
pnpm eas build --platform ios --profile development
# Scan QR with TestFlight, install
# Run harness → outputs src/results/spike-a-ios.json
```

### SA-4: Pass Criteria Checklist (Spike A)

| Criterion | Target | Verified? |
|---|---|---|
| Chinese recognition runs on Android + iPhone | ✅ | |
| No network permission in release config | ✅ | |
| Airplane mode works (fresh install) | ✅ | |
| Printed horizontal accuracy ≥ 0.95 | Both platforms | |
| Warm OCR time < 2 s/page | Android + iPhone | |
| Bounding boxes + confidence returned | Documented | |
| App size delta recorded | MB per platform | |
| Decision record written | `DECISION_RECORD.md` | |

---

## Spike B: PDF Text-Layer + Rendering

### SB-1: Harness Setup

```bash
cd spikes/spike-b
pnpm install
# Verify app.config.ts has bundle ID, PDF plugin
```

### SB-2: Run on Android Device

```bash
pnpm eas build --platform android --profile development
# Install, run harness → outputs src/results/spike-b-android.json
```

### SB-3: Run on iOS Device (EAS Build)

```bash
pnpm eas build --platform ios --profile development
# Install via TestFlight, run harness → outputs src/results/spike-b-ios.json
```

### SB-4: Pass Criteria Checklist (Spike B)

| Criterion | Target | Verified? |
|---|---|---|
| Text-layer detection + extraction works | Android + iOS | |
| "Usable text layer" heuristic documented | ✅ | |
| Page rendering at ~300 dpi works | Both platforms | |
| 20-page PDF renders sequentially, no OOM | Android (mid-range) | |
| 25 pages refused with distinct error | ✅ | |
| Encrypted PDF fails with distinct error | ✅ | |
| Corrupted PDF fails with distinct error | ✅ | |
| Rendered pages feed Spike A OCR successfully | Accuracy comparable to photo | |
| Decision record written | `DECISION_RECORD.md` | |

---

## End-to-End Chain Validation

### EE-1: Full Chain Test

```bash
# On each device, in airplane mode:
# 1. Pick a scanned PDF from spike-b corpus
# 2. Run Spike B pipeline: detect text layer → render → Spike A OCR
# 3. Verify output: structured result (text, lines, boxes, confidence) + timing
# 4. Record in src/results/end-to-end-{android,ios}.json
```

### EE-2: Pass Criteria (EE)

| Criterion | Verified? |
|---|---|
| Scanned PDF → render → ML Kit → structured result | Android + iOS |
| Zero network calls (airplane mode) | ✅ |
| Per-page timing recorded | ✅ |
| Accuracy vs ground truth ≥ 0.95 (printed) | Both platforms |

---

## Decision Records & Interface Sketches

After both spikes pass:

```bash
# Copy decision records for M4/M6 consumption
cp spikes/spike-a/DECISION_RECORD.md spikes/DECISION_RECORDS/spike-a-decision.md
cp spikes/spike-b/DECISION_RECORD.md spikes/DECISION_RECORDS/spike-b-decision.md

# Copy interface sketches for M4/M6 test-first development
cp -r spikes/spike-a/src/results/interfaces/* spikes/INTERFACE_SKETCHES/
cp -r spikes/spike-b/src/results/interfaces/* spikes/INTERFACE_SKETCHES/

# Verify go/no-go
cat spikes/DECISION_RECORDS/spike-a-decision.md | grep "goNoGo"
cat spikes/DECISION_RECORDS/spike-b-decision.md | grep "goNoGo"
```

### Go/No-Go Criteria

| Module | Go If | No-Go If |
|---|---|---|
| M4 (OCR Core) | Spike A go + interface sketch verified | Spike A no-go, or no maintainable wrapper |
| M6 (PDF Pipeline) | Spike B go + interface sketch verified | Spike B no-go, or no viable PDF approach |

---

## Cleanup (After M4/M6 Start)

```bash
# Remove spike harnesses and losing-candidate deps
rm -rf spikes/spike-a spikes/spike-b
# Verify no spike deps in root package.json
grep -r "spike" package.json  # should be empty
```

---

## Troubleshooting

| Issue | Resolution |
|---|---|
| `expo-doctor` warnings | Fix before proceeding; SDK mismatch blocks builds |
| ML Kit model not found in bundle | Verify `assets/mlkit/` or native module includes model; check config plugin |
| PDF text layer not detected | Verify `detectTextLayer()` heuristic; may need different PDF library |
| iOS build fails on EAS | Check `eas.json` profiles, `app.config.ts` plugins, bundle ID |
| Accuracy < 0.95 | Check image quality, lighting; may need better corpus or model |
| OOM on 20-page PDF | Render sequentially, clean temp files, downscale if > 20 MB |
| Spike deps in root package.json | Remove losing candidates; only keep chosen in final package.json |

---

## Notes

- **Real devices mandatory** for all pass/fail results. Emulator/simulator results are for development only.
- **iOS builds require EAS Build** (cloud). No Mac needed locally.
- **Airplane mode required** for all pass/fail runs to prove offline/bundled model.
- **Corpus fixtures** are team-provided; small set for feasibility, not final accuracy.
- **Decision records** are the primary deliverable — they unblock M4/M6.