import SwiftUI

/// Token-only palette. Hex lives here and nowhere else — views use these
/// tokens. Implements TungCua/Theme/DesignPrinciples.md.
enum Theme {
    static let bgBase = Color("BgBase", bundle: .main)
    static let bgAlt = Color("BgAlt", bundle: .main)
    static let mintSurface = Color("MintSurface", bundle: .main)
    static let mintPrimary = Color("MintPrimary", bundle: .main)
    static let mintInk = Color("MintInk", bundle: .main)
    static let pinkSurface = Color("PinkSurface", bundle: .main)
    static let pinkPrimary = Color("PinkPrimary", bundle: .main)
    static let pinkInk = Color("PinkInk", bundle: .main)

    /// Low-confidence underline color. Pink ink only — never red.
    static let lowConfidenceUnderline = pinkInk

    static func surface(for state: CharState) -> Color {
        switch state {
        case .normal: .clear
        case .tapped: mintSurface
        case .saved: pinkSurface
        }
    }

    static func ink(for state: CharState) -> Color {
        switch state {
        case .normal: .primary
        case .tapped: mintInk
        case .saved: pinkInk
        }
    }
}

enum CharState {
    case normal, tapped, saved
}
