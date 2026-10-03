import Foundation
import OpenCC

enum ScriptVariant {
    case traditional, simplified
}

/// Display-only OpenCC conversion. Pure function — never mutates stored text.
/// Requires the Swift OpenCC package (see README first-time Mac setup).
enum TextDisplayConversion {
    static func display(_ text: String, as variant: ScriptVariant) -> String {
        switch variant {
        case .traditional: OpenCC.convert(text, from: .simplified, to: .traditional)
        case .simplified: OpenCC.convert(text, from: .traditional, to: .simplified)
        }
    }
}
