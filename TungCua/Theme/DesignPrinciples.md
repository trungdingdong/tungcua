# TungCua Design Principles — Pastel Colorways + UI Style

Agent reference. Authoritative for every view. Implements constitution
UX & Design Language and `PROJECT_SCOPE.md` Theme. If a design choice is not
in this file, ask before inventing it.

## Palette (light mode)

| Token | Hex | Role |
|---|---|---|
| `BgBase` | `#F6FBF8` | App background, mint-white |
| `BgAlt` | `#FDF5F9` | Alternate background, pink-white |
| `MintSurface` | `#DDF6E8` | Selected / tapped surfaces |
| `MintPrimary` | `#7ED6B5` (`#4FBF9A` pressed) | Primary actions, mint family |
| `MintInk` | `#0E4A38` | Text/icons on mint surfaces |
| `PinkSurface` | `#FBDCE9` | Saved surfaces |
| `PinkPrimary` | `#E893BE` (`#CC6DA0` pressed) | Accent actions, pink family |
| `PinkInk` | `#5E2144` | Text/icons on pink surfaces, low-confidence underline |

## Palette (dark mode)

- Base background `#0F1F1A`, green surface `#1B3A30`, pink surface `#3A2433`.
- Inks lighten for contrast; pastels stay surfaces, never body text.

## Hard rules

1. Pastels are surfaces only, never body text.
2. Tapped character = mint surface + mint ink. Saved character = pink surface
   + pink ink. Never swap the families.
3. Low confidence = `PinkInk` underline. No red anywhere, no out-of-palette
   color for status. Errors use copy + pink ink, not red.
4. Theme tokens only in views. No hardcoded hex in any `View`. `Theme.swift`
   is the single place hex may appear.
5. Typography: SF Rounded for the hero character, SF Pro for body.
6. Stroke player (P2): pastel track, ink strokes, pink current stroke.
7. Font-size slider drives reader text; Dynamic Type respected everywhere.
8. Every interactive control gets a VoiceOver label. Reader flows must be
   VoiceOver-operable end to end.
9. AI-generated paraphrase (P3) is always labeled and shown beside the source
   sentence, never alone.
