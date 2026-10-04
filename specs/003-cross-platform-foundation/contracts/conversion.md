# Contract: Trad/Simp Display Conversion

**Feature**: `003-cross-platform-foundation` | **Date**: 2026-10-04

## Interface

```typescript
// src/shared/conversion/opencc.ts

export type ScriptVariant = 'traditional' | 'simplified';

export interface TextDisplayConversion {
  /** Convert text for display only. Never mutates stored text. */
  convert(text: string, variant: ScriptVariant): string;
}
```

## Implementation

- Library: `opencc-js` (WASM) or `opencc` (pure JS). Chosen by spike proving identical output to Swift OpenCC.
- Function is **pure**: same input → same output; no side effects; no mutation of stored text.
- Stored recognized text is ALWAYS in its original ML Kit variant (Traditional or Simplified as detected).
- Display conversion applied at render time in Reader view.

## Behavior Contract

| Input | Variant | Output |
|---|---|---|
| `"简体中文"` | `'traditional'` | `"簡體中文"` |
| `"繁體中文"` | `'simplified'` | `"简体中文"` |
| `"测试"` | `'traditional'` | `"測試"` |
| `""` | any | `""` |
| Mixed/unknown chars | any | Best effort; unknown chars passed through |

- **Round-trip**: `convert(convert(text, 't2s'), 's2t')` ≈ `text` (may not be exact for all chars; OpenCC is not perfectly invertible).
- **Performance**: < 5 ms for typical page text (< 2000 chars).
- **Testability**: Golden-file tests verify byte-for-byte match with Swift OpenCC output for known pairs.

## Usage

```typescript
// In Reader view
import { useScriptVariant } from '@/hooks/useScriptVariant';
import { opencc } from '@/shared/conversion/opencc';

const variant = useScriptVariant(); // 'traditional' | 'simplified'
const displayText = opencc.convert(storedLineText, variant);
```

## Constitution Compliance (L121-122)

- Display only — stored text never modified.
- Identical output on iOS and Android (same JS library).
- On-device, no network.