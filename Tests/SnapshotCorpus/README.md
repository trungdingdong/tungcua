# Snapshot Corpus

Fixed OCR accuracy fixtures. Regressions block the P0 gate (FR-014).

## Layout

```text
Tests/SnapshotCorpus/
├── README.md            this file
├── manifest.json        samples + ground truth + per-tier thresholds
├── printed/             Tier-1: printed horizontal Chinese (gating)
├── vertical/            vertical layout (tracked, non-blocking)
├── handwritten/        handwriting/calligraphy (tracked, non-blocking)
└── RESULTS.md           last recorded run (device for timing/accuracy)
```

## Thresholds

- printed >= 0.95 (gate, must pass, zero regressions vs baseline)
- vertical >= 0.80 (tracked, honest lower bar per principle IV)
- handwritten >= 0.60 (tracked, honest lower bar per principle IV)

## Adding samples

1. Drop image under its tier folder.
2. Add entry to `manifest.json` with exact expected text.
3. Run `xcodebuild test`, record in `RESULTS.md`.
