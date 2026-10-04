# Data Model: ML Kit + PDF Spikes (M1)

**Feature**: `004-mlkit-pdf-spikes` | **Date**: 2026-10-04
**Scope**: Spike harness data structures only — no persistent DB. Corpus fixtures are JSON + files.

## Entities

### SpikeACorpusEntry (image fixture)

```typescript
interface SpikeACorpusEntry {
  filename: string;                    // e.g., "printed-simplified-01.jpg"
  tier: 'printed-simplified' | 'printed-traditional' | 'mixed-latin' | 'vertical-traditional' | 'handwriting' | 'blank' | 'non-chinese' | 'large-20mb' | 'corrupted';
  imagePath: string;                   // relative to corpus root
  groundTruthText: string;             // expected recognized text
  expectedBehavior: 'ocr' | 'no-text' | 'error';  // what Spike A should do
  maxDimension?: number;               // for large-20mb tier
}
```

### SpikeACorpusManifest

```typescript
interface SpikeACorpusManifest {
  version: string;                     // "1.0.0"
  thresholds: {
    printedAccuracy: 0.95;             // gate
    warmTimeMs: 2000;                  // warm per-page limit
  };
  entries: SpikeACorpusEntry[];
}
```

### SpikeAResult (measurement output per image)

```typescript
interface SpikeAResult {
  filename: string;
  candidate: string;                   // wrapper name evaluated
  platform: 'android' | 'ios';
  recognizedText: string;              // full text returned
  lines: OcrLine[];                    // structured lines
  processingTimeMs: number;            // cold or warm
  isColdStart: boolean;
  memoryPeakMb?: number;
  status: 'ok' | 'no-text' | 'failed';
  error?: string;
}

interface OcrLine {
  text: string;
  bounds: Bounds;                      // normalized 0-1
  confidence: number;                  // 0-1 (line or element level)
  elements?: OcrElement[];             // if wrapper returns elements
}

interface OcrElement {
  text: string;
  bounds: Bounds;
  confidence: number;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### SpikeASummary (aggregate measurements)

```typescript
interface SpikeASummary {
  candidate: string;
  platform: 'android' | 'ios';
  printedAccuracy: number;             // character accuracy on printed tier
  warmTimeMs: number;                  // median warm time
  coldTimeMs: number;                  // median cold time
  modelBundledVerified: boolean;       // airplane mode success
  appSizeDeltaMb: number;              // delta vs base
  coordinateConvention: string;        // documented
  confidenceGranularity: 'line' | 'element' | 'both';
  goNoGo: 'go' | 'no-go';
  notes: string;
}
```

---

### SpikeBCorpusEntry (PDF fixture)

```typescript
interface SpikeBCorpusEntry {
  filename: string;                    // e.g., "text-simplified-3page.pdf"
  type: 'text-simplified' | 'text-traditional' | 'scanned' | 'mixed' | '20-page' | '25-page' | 'large-pages' | 'password-protected' | 'corrupted' | 'garbage-text-layer';
  pdfPath: string;                     // relative to corpus root
  pageCount: number;
  hasTextLayer: boolean;               // expected
  groundTruthTextPerPage: string[];    // expected text per page (for text-layer PDFs)
  expectedBehavior: 'text-layer' | 'render-ocr' | 'refuse' | 'error';
  password?: string;                   // for password-protected
}
```

### SpikeBCorpusManifest

```typescript
interface SpikeBCorpusManifest {
  version: string;
  entries: SpikeBCorpusEntry[];
}
```

### SpikeBResult (measurement output per PDF)

```typescript
interface SpikeBResult {
  filename: string;
  candidate: string;                   // PDF approach evaluated
  platform: 'android' | 'ios';
  pageCount: number;
  pages: SpikeBPageResult[];
  totalRenderTimeMs: number;
  peakMemoryMb?: number;
  status: 'ok' | 'refused' | 'failed';
  error?: string;
}

interface SpikeBPageResult {
  pageIndex: number;
  hasTextLayer: boolean;
  extractedText?: string;              // if text layer used
  extractedTextAccuracy?: number;      // vs ground truth
  renderedImagePath?: string;          // if rendered
  renderTimeMs: number;
  imageDimensions: { width: number; height: number };
  imageSizeBytes: number;
  status: 'text-layer' | 'rendered' | 'failed';
  error?: string;
}
```

### SpikeBSummary (aggregate measurements)

```typescript
interface SpikeBSummary {
  candidate: string;
  platform: 'android' | 'ios';
  textLayerDetectionAccuracy: number;  // on text PDFs
  textExtractionAccuracy: number;      // vs ground truth
  avgRenderTimeMs: number;             // per page
  maxMemoryMb: number;                 // over 20 pages
  twentyPageOk: boolean;               // no crash/OOM
  twentyFivePageRefused: boolean;      // distinct error
  encryptedHandled: boolean;           // distinct error
  corruptedHandled: boolean;           // distinct error
  goNoGo: 'go' | 'no-go';
  notes: string;
}
```

---

### EndToEndResult (composed chain)

```typescript
interface EndToEndResult {
  pdfFilename: string;
  platform: 'android' | 'ios';
  totalTimeMs: number;
  pages: EndToEndPageResult[];
  airplaneModeVerified: boolean;
}

interface EndToEndPageResult {
  pageIndex: number;
  renderTimeMs: number;
  ocrTimeMs: number;
  recognizedText: string;
  lines: OcrLine[];
  accuracyVsGroundTruth: number;
}
```

---

### DecisionRecord (per spike)

```typescript
interface DecisionRecord {
  spike: 'A' | 'B';
  date: string;                        // ISO 8601
  optionsEvaluated: EvaluatedOption[];
  measurements: SpikeASummary[] | SpikeBSummary[];
  chosen: ChosenApproach;
  rejected: RejectedOption[];
  risks: Risk[];
  interfaceSketch: string;             // path to TS types
  goNoGoM4: 'go' | 'no-go';
  goNoGoM6: 'go' | 'no-go';
  appSizeDeltaMb: { android: number; ios: number };
  buildTimeImpact: string;
  configPluginNeeds: string[];
}

interface EvaluatedOption {
  name: string;
  version: string;
  type: 'package' | 'native-module';
  passCriteriaMet: boolean;
}

interface ChosenApproach {
  name: string;
  version: string;
  type: 'package' | 'native-module';
  configPlugin: boolean;
  nativeModuleDesign?: string;         // if custom
}

interface RejectedOption {
  name: string;
  reason: string;
}

interface Risk {
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}
```

---

### InterfaceSketches (for M4/M6)

```typescript
// spikes/INTERFACE_SKETCHES/ocr-engine.ts
export type OcrStatus = 'ok' | 'noText' | 'failed';

export interface OcrGrapheme {
  char: string;
  bounds: Bounds;
  confidence: number;
}

export interface OcrLine {
  text: string;
  bounds: Bounds;
  confidence: number;
  graphemes: OcrGrapheme[];
}

export interface OcrResult {
  status: OcrStatus;
  lines: OcrLine[];
  processingTimeMs: number;
  error?: string;
}

export interface OcrEngine {
  recognize(imagePath: string): Promise<OcrResult>;
  ensureModelsReady(): Promise<void>;
}

// spikes/INTERFACE_SKETCHES/pdf-detector.ts
export interface PdfTextLayerInfo {
  hasTextLayer: boolean;
  text?: string;
  readingOrder?: Bounds[];  // per-char/word bounds if available
}

export interface PdfDetector {
  detectTextLayer(pdfPath: string, pageIndex: number): Promise<PdfTextLayerInfo>;
  getPageCount(pdfPath: string): Promise<number>;
}

// spikes/INTERFACE_SKETCHES/pdf-renderer.ts
export interface PdfRenderer {
  renderPageToImage(pdfPath: string, pageIndex: number, dpi: number): Promise<string>; // returns image path
  renderPageToImageData(pdfPath: string, pageIndex: number, dpi: number): Promise<Uint8Array>;
}

// spikes/INTERFACE_SKETCHES/pdf-pipeline.ts
export interface PdfPipeline {
  // High-level: detect text layer OR render+OCR per page
  processPdf(pdfPath: string, ocrEngine: OcrEngine): Promise<PdfProcessResult>;
}

export interface PdfProcessResult {
  pages: PdfPageResult[];
}

export interface PdfPageResult {
  pageIndex: number;
  usedTextLayer: boolean;
  text: string;
  lines: OcrLine[];
}
```

---

### Corpus Manifests (JSON)

```json
// assets/spike-corpus/spike-a/manifest.json
{
  "version": "1.0.0",
  "thresholds": { "printedAccuracy": 0.95, "warmTimeMs": 2000 },
  "entries": [
    { "filename": "printed-simplified-01.jpg", "tier": "printed-simplified", "imagePath": "printed-simplified-01.jpg", "groundTruthText": "你好世界", "expectedBehavior": "ocr" },
    { "filename": "printed-traditional-01.jpg", "tier": "printed-traditional", "imagePath": "printed-traditional-01.jpg", "groundTruthText": "你好世界", "expectedBehavior": "ocr" },
    { "filename": "mixed-latin-01.jpg", "tier": "mixed-latin", "imagePath": "mixed-latin-01.jpg", "groundTruthText": "Hello 世界 123", "expectedBehavior": "ocr" },
    { "filename": "vertical-traditional-01.jpg", "tier": "vertical-traditional", "imagePath": "vertical-traditional-01.jpg", "groundTruthText": "直書文字", "expectedBehavior": "ocr" },
    { "filename": "handwriting-01.jpg", "tier": "handwriting", "imagePath": "handwriting-01.jpg", "groundTruthText": "手寫", "expectedBehavior": "ocr" },
    { "filename": "blank-01.jpg", "tier": "blank", "imagePath": "blank-01.jpg", "groundTruthText": "", "expectedBehavior": "no-text" },
    { "filename": "non-chinese-01.jpg", "tier": "non-chinese", "imagePath": "non-chinese-01.jpg", "groundTruthText": "English only", "expectedBehavior": "ocr" },
    { "filename": "large-20mb-01.jpg", "tier": "large-20mb", "imagePath": "large-20mb-01.jpg", "groundTruthText": "大文件測試", "expectedBehavior": "ocr", "maxDimension": 4000 },
    { "filename": "corrupted-01.jpg", "tier": "corrupted", "imagePath": "corrupted-01.jpg", "groundTruthText": "", "expectedBehavior": "error" }
  ]
}
```

```json
// assets/spike-corpus/spike-b/manifest.json
{
  "version": "1.0.0",
  "entries": [
    { "filename": "text-simplified-3page.pdf", "type": "text-simplified", "pdfPath": "text-simplified-3page.pdf", "pageCount": 3, "hasTextLayer": true, "groundTruthTextPerPage": ["第一页内容", "第二页内容", "第三页内容"], "expectedBehavior": "text-layer" },
    { "filename": "text-traditional-3page.pdf", "type": "text-traditional", "pdfPath": "text-traditional-3page.pdf", "pageCount": 3, "hasTextLayer": true, "groundTruthTextPerPage": ["第一頁內容", "第二頁內容", "第三頁內容"], "expectedBehavior": "text-layer" },
    { "filename": "scanned-3page.pdf", "type": "scanned", "pdfPath": "scanned-3page.pdf", "pageCount": 3, "hasTextLayer": false, "groundTruthTextPerPage": ["掃描頁一", "掃描頁二", "掃描頁三"], "expectedBehavior": "render-ocr" },
    { "filename": "mixed-4page.pdf", "type": "mixed", "pdfPath": "mixed-4page.pdf", "pageCount": 4, "hasTextLayer": true, "groundTruthTextPerPage": ["文字層頁一", "掃描頁二", "文字層頁三", "掃描頁四"], "expectedBehavior": "text-layer" },
    { "filename": "20-page.pdf", "type": "20-page", "pdfPath": "20-page.pdf", "pageCount": 20, "hasTextLayer": false, "expectedBehavior": "render-ocr" },
    { "filename": "25-page.pdf", "type": "25-page", "pdfPath": "25-page.pdf", "pageCount": 25, "expectedBehavior": "refuse" },
    { "filename": "large-pages.pdf", "type": "large-pages", "pdfPath": "large-pages.pdf", "pageCount": 5, "expectedBehavior": "render-ocr" },
    { "filename": "password-protected.pdf", "type": "password-protected", "pdfPath": "password-protected.pdf", "pageCount": 3, "expectedBehavior": "error", "password": "test123" },
    { "filename": "corrupted.pdf", "type": "corrupted", "pdfPath": "corrupted.pdf", "expectedBehavior": "error" },
    { "filename": "garbage-text-layer.pdf", "type": "garbage-text-layer", "pdfPath": "garbage-text-layer.pdf", "pageCount": 2, "hasTextLayer": true, "expectedBehavior": "render-ocr" }
  ]
}
```